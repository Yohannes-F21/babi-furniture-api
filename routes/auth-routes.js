const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  // changePassword,
  refreshAccessToken,
  logoutUser,
} = require("../controllers/updated-auth-controller");
const authMiddleware = require("../middleware/auth-middleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
// router.post("/change-password", authMiddleware, changePassword);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logoutUser);
module.exports = router;
