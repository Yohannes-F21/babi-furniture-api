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
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User Not Found" });
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
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
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
// REFRESH TOKEN CONTROLLER (REWRITTEN)
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    // 1. No cookie found
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    // 2. Find the user that owns this token
    const user = await userModel.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Refresh token invalid",
      });
    }

    // 3. Verify JWT validity
    let decodedData;
    try {
      decodedData = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET_KEY
      );
    } catch (err) {
      // Remove corrupted token
      user.refreshToken = null;
      await user.save();

      return res.status(403).json({
        success: false,
        message: "Refresh token expired or invalid",
      });
    }

    // 4. Ensure the token belongs to this user
    if (decodedData.userId !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Token does not match user",
      });
    }

    // 5. Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: user._id,
        userName: user.userName,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    // 6. Respond with new access token
    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      message: "Access token refreshed successfully",
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Refresh Access Token Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// LOGOUT CONTROLLER
const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "No token found" });
    }

    // Clear from DB
    await userModel.updateOne(
      { refreshToken },
      { $set: { refreshToken: null } }
    );

    // Clear cookie — MATCH EXACTLY
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
};
