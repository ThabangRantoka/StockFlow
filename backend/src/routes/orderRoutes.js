const express = require("express");
const router = express.Router();

const {
  getOrders,
  getOrderById,
  createOrder,
  addOrderItem,
  updateOrderStatus
} = require("../controllers/orderController");

router.get("/", getOrders);
router.get("/:id", getOrderById);

router.post("/", createOrder);
router.post("/items", addOrderItem);
router.patch("/:id/status", updateOrderStatus);

module.exports = router;