const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  getOrders,
  getOrderById,
  createOrder,
  addOrderItem,
  updateOrderStatus
} = require("../controllers/orderController");


// GET ALL ORDERS
router.get(
  "/",
  authenticateToken,
  authorizeRoles("Employee", "Manager", "Admin"),
  getOrders
);


// GET ONE ORDER
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("Employee", "Manager", "Admin"),
  getOrderById
);


// CREATE ORDER
router.post(
  "/",
  authenticateToken,
  authorizeRoles("Employee", "Manager", "Admin"),
  createOrder
);


// ADD ITEM TO ORDER
router.post(
  "/items",
  authenticateToken,
  authorizeRoles("Employee", "Manager", "Admin"),
  addOrderItem
);


// UPDATE ORDER STATUS
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Manager", "Admin"),
  updateOrderStatus
);


module.exports = router;