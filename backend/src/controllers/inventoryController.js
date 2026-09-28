const pool = require("../config/database");


// ========================
// GET INVENTORY
// ========================
const getInventory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        name,
        sku,
        category,
        price,
        stock_quantity
       FROM products
       ORDER BY name ASC`
    );

    res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get inventory"
    });
  }
};


// ========================
// GET LOW STOCK PRODUCTS
// ========================
const getLowStock = async (req, res) => {
  try {
    const threshold = 10;

    const result = await pool.query(
      `SELECT
        id,
        name,
        sku,
        category,
        price,
        stock_quantity
       FROM products
       WHERE stock_quantity <= $1
       ORDER BY stock_quantity ASC`,
      [threshold]
    );

    res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get low stock products"
    });
  }
};

// ========================
// RESTOCK PRODUCT
// ========================
const restockProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Restock quantity must be greater than 0"
      });
    }

    const result = await pool.query(
      `UPDATE products
       SET stock_quantity = stock_quantity + $1
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json({
      message: "Product restocked successfully",
      product: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to restock product"
    });
  }
};

// ========================
// GET INVENTORY SUMMARY
// ========================
const getInventorySummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_products,
        COALESCE(SUM(stock_quantity), 0) AS total_units,
        COUNT(*) FILTER (WHERE stock_quantity <= 10 AND stock_quantity > 0)
          AS low_stock_products,
        COUNT(*) FILTER (WHERE stock_quantity = 0)
          AS out_of_stock_products
      FROM products
    `);

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get inventory summary"
    });
  }
};

module.exports = {
  getInventory,
  getLowStock,
  restockProduct,
  getInventorySummary
};