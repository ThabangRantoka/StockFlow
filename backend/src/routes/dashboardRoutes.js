const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  getDashboard
} = require("../controllers/dashboardController");


// Get dashboard data
router.get(
  "/",
  authenticateToken,
  authorizeRoles("Employee", "Manager", "Admin"),
  getDashboard
);


module.exports = router;