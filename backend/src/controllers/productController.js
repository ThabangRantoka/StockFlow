const pool = require("../config/database");
const { validateProduct } = require("../utils/validators");

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id ASC"
    );

    res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get products"
    });
  }
};


// GET ONE PRODUCT BY ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get product"
    });
  }
};

//Create Product Function
const createProduct = async (req, res) => {
  try {
const validation = validateProduct(req.body);

if (!validation.valid) {
  return res.status(400).json({
    message: validation.message
  });
}
    const {
      name,
      sku,
      category,
      price,
      stock_quantity
    } = req.body;

    const result = await pool.query(
      `INSERT INTO products
       (name, sku, category, price, stock_quantity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, sku, category, price, stock_quantity]
    );

    res.status(201).json(result.rows[0]);

  } 
    catch (error) {
    console.error(error);

    if (error.code === "23505") {
        return res.status(409).json({
        message: "A product with this SKU already exists"
        });
    }

    res.status(500).json({
        message: "Server error"
    });
    }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      sku,
      category,
      price,
      stock_quantity
    } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET name = $1,
           sku = $2,
           category = $3,
           price = $4,
           stock_quantity = $5
       WHERE id = $6
       RETURNING *`,
      [name, sku, category, price, stock_quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update product"
    });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      product: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete product"
    });
  }
};
// EXPORT FUNCTIONS
module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};