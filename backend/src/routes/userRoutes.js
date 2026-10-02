const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  getUsers,
  createUser,
  updateUserRole,
  updateUserStatus
} = require("../controllers/userController");


// GET ALL USERS - ADMIN ONLY
router.get(
  "/",
  authenticateToken,
  authorizeRoles("Admin"),
  getUsers
);

// UPDATE USER ROLE - ADMIN ONLY
router.patch(
  "/:id/role",
  authenticateToken,
  authorizeRoles("Admin"),
  updateUserRole
);

// UPDATE USER STATUS - ADMIN ONLY
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("Admin"),
  updateUserStatus
);


// CREATE USER - ADMIN ONLY
router.post(
  "/",
  authenticateToken,
  authorizeRoles("Admin"),
  createUser
);


module.exports = router;