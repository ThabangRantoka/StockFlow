const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");


const {
  getInventory,
  getLowStock,
  restockProduct,
  getInventorySummary
} = require("../controllers/inventoryController");


// Get all inventory
router.get(
  "/",
  authenticateToken,
  authorizeRoles("Employee", "Manager", "Admin"),
  getInventory
);
// Get low-stock products
router.get(
  "/low-stock",
  authenticateToken,
  authorizeRoles("Employee", "Manager", "Admin"),
  getLowStock
);
// Restock a product
router.patch(
  "/:id/restock",
  authenticateToken,
  authorizeRoles("Manager", "Admin"),
  restockProduct
);
// Get inventory summary
router.get(
  "/summary",
  authenticateToken,
  authorizeRoles("Employee", "Manager", "Admin"),
  getInventorySummary
);

module.exports = router;