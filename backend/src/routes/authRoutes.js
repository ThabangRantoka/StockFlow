
const express = require("express");

const {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
} = require("../controllers/authController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public authentication routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected profile routes
router.get("/me", authenticateToken, getMyProfile);
router.put("/me", authenticateToken, updateMyProfile);

// Protected password-change route
router.put(
  "/change-password",
  authenticateToken,
  changePassword
);

module.exports = router;
