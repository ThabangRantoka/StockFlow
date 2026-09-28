const express = require("express");
const router = express.Router();

const {
  getInventory,
  getLowStock,
  restockProduct,
  getInventorySummary
} = require("../controllers/inventoryController");


// Get all inventory
router.get("/", getInventory);
// Get low-stock products
router.get("/low-stock", getLowStock);
// Restock a product
router.patch("/:id/restock", restockProduct);
// Get inventory summary
router.get("/summary", getInventorySummary);

module.exports = router;