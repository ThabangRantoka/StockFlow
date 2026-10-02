const express = require("express");
const cors = require("cors");
const inventoryRoutes = require("./routes/inventoryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");

const healthRoutes = require("./routes/healthRoutes");
const productRoutes = require("./routes/productRoutes");
const customerRoutes = require("./routes/customerRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);


module.exports = app;