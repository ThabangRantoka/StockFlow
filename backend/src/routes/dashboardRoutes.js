const express = require("express");

const {
  getDashboard,
} = require("../controllers/dashboardController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/dashboard
// Accessible to any authenticated StockFlow user.
router.get("/", authenticateToken, getDashboard);

module.exports = router;