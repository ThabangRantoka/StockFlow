const pool = require("../config/database");


// ========================
// GET DASHBOARD SUMMARY
// ========================
const getDashboardSummary = async () => {

  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM products) AS total_products,
      (SELECT COUNT(*) FROM customers) AS total_customers,
      (SELECT COUNT(*) FROM orders) AS total_orders,
      (SELECT COUNT(*)
       FROM products
       WHERE stock_quantity <= 10) AS low_stock_products,
      (SELECT COALESCE(SUM(total_amount), 0)
       FROM orders
       WHERE status != 'Cancelled') AS total_sales
  `);

  return result.rows[0];
};

// ========================
// GET RECENT ORDERS
// ========================
const getRecentOrders = async () => {

  const result = await pool.query(`
    SELECT
      orders.id,
      orders.status,
      orders.total_amount,
      orders.created_at,
      customers.first_name,
      customers.last_name
    FROM orders
    JOIN customers
      ON orders.customer_id = customers.id
    ORDER BY orders.created_at DESC
    LIMIT 5
  `);

  return result.rows;
};

module.exports = {
  getDashboardSummary,
  getRecentOrders
};