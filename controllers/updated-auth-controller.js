const userModel = require("../models/user-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, userName: user.userName, role: user.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "15m" } // short-lived
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET_KEY,
    { expiresIn: "7d" } // long-lived
  );

  return { accessToken, refreshToken };
};

// REGISTER CONTROLLER
const registerUser = async (req, res) => {
  try {
    const { userName, email, password, role } = req.body;

    const checkExistingUser = await userModel.findOne({
      $or: [{ userName }, { email }],
    });
    if (checkExistingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with same username or email.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newlyCreatedUser = new userModel({
      userName,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    await newlyCreatedUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error", e });
  }
};

// LOGIN CONTROLLER
const loginUser = async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = await userModel.findOne({ userName });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token in database for that user
    user.refreshToken = refreshToken;
    await user.save();

    // Send refresh token as HTTP-only cookie (client can't access it)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only HTTPS in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/api/auth/refresh-token",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error", e });
  }
};

// REFRESH TOKEN ENDPOINT
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    console.log("Cookies received:", req.cookies);

    // 1. Check cookie exists
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token provided" });
    }

    // 2. Find user with this refresh token
    const user = await userModel.findOne({ refreshToken });
    if (!user) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid refresh token" });
    }

    // 3. Verify JWT (use promisified version)
    let decoded;
    try {
      decoded = await jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET_KEY
      );
    } catch (err) {
      // Remove invalid token from DB
      user.refreshToken = null;
      await user.save();
      return res
        .status(403)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }

    // 4. CRITICAL: Match userId from token with DB user
    if (decoded.userId !== user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Token mismatch" });
    }

    // 5. Generate new access token
    const accessToken = jwt.sign(
      {
        userId: user._id,
        userName: user.userName,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    // 6. Success
    return res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// LOGOUT CONTROLLER
const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken)
      return res
        .status(400)
        .json({ success: false, message: "No token found" });

    const user = await userModel.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
};
