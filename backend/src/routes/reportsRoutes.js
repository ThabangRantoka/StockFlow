
const express = require("express");
const router = express.Router();

const {
  getReports
} = require("../controllers/reportsController");

const {
  authenticateToken
} = require("../middleware/authMiddleware");

// ========================
// GET REPORTS
// ========================
router.get(
  "/",
  authenticateToken,
  getReports
);

module.exports = router;
