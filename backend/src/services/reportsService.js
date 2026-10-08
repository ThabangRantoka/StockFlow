
const pool = require("../config/database");

const LOW_STOCK_THRESHOLD = 5;

// ========================
// GET REPORTS DATA
// ========================
const getReportsData = async () => {
  const [
    summaryResult,
    salesResult,
    statusResult,
    sellersResult,
    growthResult,
    lowStockResult,
  ] = await Promise.all([
    // 1. Current-year revenue and orders
    pool.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS revenue,
        COUNT(*) AS total_orders
      FROM orders
      WHERE status != 'Cancelled'
        AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
        AND created_at < DATE_TRUNC('year', CURRENT_DATE)
                         + INTERVAL '1 year'
    `),

    // 2. Monthly sales for the current year
    pool.query(`
      SELECT
        EXTRACT(MONTH FROM created_at)::integer AS month_number,
        COALESCE(SUM(total_amount), 0) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE status != 'Cancelled'
        AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
        AND created_at < DATE_TRUNC('year', CURRENT_DATE)
                         + INTERVAL '1 year'
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month_number
    `),

    // 3. All-time orders grouped by status
    pool.query(`
      SELECT status, COUNT(*) AS total
      FROM orders
      GROUP BY status
      ORDER BY status
    `),

    // 4. Top-selling products this year
    pool.query(`
      SELECT
        p.id,
        p.name,
        p.sku,
        SUM(oi.quantity) AS units
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'Cancelled'
        AND o.created_at >= DATE_TRUNC('year', CURRENT_DATE)
        AND o.created_at < DATE_TRUNC('year', CURRENT_DATE)
                           + INTERVAL '1 year'
      GROUP BY p.id, p.name, p.sku
      ORDER BY units DESC
      LIMIT 6
    `),

    // 5. Customer registrations by month
    pool.query(`
      SELECT
        EXTRACT(MONTH FROM created_at)::integer AS month_number,
        COUNT(*) AS customers
      FROM customers
      WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)
        AND created_at < DATE_TRUNC('year', CURRENT_DATE)
                         + INTERVAL '1 year'
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month_number
    `),

    // 6. Products with low or no stock
    pool.query(`
      SELECT
        id,
        sku,
        name,
        category,
        stock_quantity
      FROM products
      WHERE stock_quantity <= $1
      ORDER BY stock_quantity ASC, name ASC
    `, [LOW_STOCK_THRESHOLD]),
  ]);

  const summary = summaryResult.rows[0];

  const revenue = Number(summary.revenue);
  const totalOrders = Number(summary.total_orders);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr",
    "May", "Jun", "Jul", "Aug",
    "Sep", "Oct", "Nov", "Dec",
  ];

  const sales = monthNames.map((month, index) => {
    const found = salesResult.rows.find(
      (row) => Number(row.month_number) === index + 1
    );

    return {
      month,
      revenue: found ? Number(found.revenue) : 0,
      orders: found ? Number(found.orders) : 0,
    };
  });

  const growth = monthNames.map((month, index) => {
    const found = growthResult.rows.find(
      (row) => Number(row.month_number) === index + 1
    );

    return {
      month,
      customers: found ? Number(found.customers) : 0,
    };
  });

  return {
    year: new Date().getFullYear(),

    summary: {
      revenue,
      total_orders: totalOrders,
      average_order_value:
        totalOrders > 0 ? revenue / totalOrders : 0,
      total_new_customers: growth.reduce(
        (sum, item) => sum + item.customers,
        0
      ),
    },

    sales,

    order_statuses: statusResult.rows.map((row) => ({
      status: row.status,
      total: Number(row.total),
    })),

    top_sellers: sellersResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      units: Number(row.units),
    })),

    customer_growth: growth,

    low_stock: lowStockResult.rows.map((row) => ({
      ...row,
      stock_quantity: Number(row.stock_quantity),
      reorder_level: LOW_STOCK_THRESHOLD,
      status:
        Number(row.stock_quantity) === 0
          ? "out_of_stock"
          : "low_stock",
    })),
  };
};

module.exports = {
  getReportsData,
};
