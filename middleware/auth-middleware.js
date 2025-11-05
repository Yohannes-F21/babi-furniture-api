const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model"); // adjust path

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // Helper: Verify access token
  const verifyAccessToken = (token) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      return null;
    }
  };

  // Helper: Generate new access token
  const generateAccessToken = (user) => {
    return jwt.sign(
      {
        userId: user._id,
        userName: user.userName,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );
  };

  // 1. Try to verify access token
  let decoded = verifyAccessToken(token);

  if (decoded) {
    req.userInfo = decoded;
    return next(); // Token valid → proceed
  }

  // 2. Access token missing or expired → try refresh
  const refreshToken = req.cookies.refreshToken;
  console.log("Refresh token received:", refreshToken);

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please login again.",
    });
  }

  try {
    // Verify refresh token
    const refreshDecoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET_KEY
    );
    console.log("Refresh token decoded:", refreshDecoded);
    // Find user and validate refresh token
    const user = await userModel.findOne({
      _id: refreshDecoded.userId,
      refreshToken: refreshToken,
    });
    console.log("User found:", user);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    // Generate NEW access token
    const newAccessToken = generateAccessToken(user);

    // Attach to request (for route handler)
    req.userInfo = {
      userId: user._id,
      userName: user.userName,
      role: user.role,
    };

    // Optional: Send new token in response header
    res.setHeader("X-New-Access-Token", newAccessToken);

    // Proceed to route
    return next();
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(403).json({
      success: false,
      message: "Invalid refresh token. Please login again.",
    });
  }
};

module.exports = authMiddleware;
