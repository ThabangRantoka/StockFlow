
const express = require("express");
const pool = require("../config/database");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Check whether PostgreSQL responds to a simple query.
    await pool.query("SELECT 1");

    return res.status(200).json({
      status: "ok",
      message: "StockFlow API is running",
      services: {
        api: "online",
        database: "online",
      },
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    return res.status(503).json({
      status: "degraded",
      message: "StockFlow API is running, but PostgreSQL is unavailable",
      services: {
        api: "online",
        database: "offline",
      },
    });
  }
});

module.exports = router;
