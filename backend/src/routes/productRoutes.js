const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles("Employee", "Manager", "Admin"),
  getProducts
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("Employee", "Manager", "Admin"),
  getProductById
);


router.post(
  "/",
  authenticateToken,
  authorizeRoles("Manager", "Admin"),
  createProduct
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Manager", "Admin"),
  updateProduct
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin"),
  deleteProduct
);

module.exports = router;