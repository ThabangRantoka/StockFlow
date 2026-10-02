const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");



const {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer

} = require("../controllers/customerController");

router.get(
  "/",
  authenticateToken,
  authorizeRoles("Employee", "Manager", "Admin"),
  getCustomers
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("Employee", "Manager", "Admin"),
  createCustomer
);
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Employee", "Manager", "Admin"),
  updateCustomer
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin"),
  deleteCustomer
);

module.exports = router;