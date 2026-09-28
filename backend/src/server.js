require("dotenv").config();

const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 5000;

pool.query("SELECT NOW()")
  .then((result) => {
    console.log("PostgreSQL connected successfully");
    console.log("Database time:", result.rows[0].now);

    app.listen(PORT, () => {
      console.log(`StockFlow API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("PostgreSQL connection failed:", error.message);
  });