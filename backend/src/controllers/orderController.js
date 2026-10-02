const pool = require("../config/database");


// ========================
// GET ALL ORDERS
// ========================
const getOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        orders.id,
        orders.customer_id,
        customers.first_name,
        customers.last_name,
        orders.status,
        orders.total_amount,
        orders.created_at
      FROM orders
      JOIN customers
        ON orders.customer_id = customers.id
      ORDER BY orders.id ASC
    `);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get orders"
    });
  }
};


// ========================
// GET ONE ORDER BY ID
// ========================
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        orders.id,
        orders.status,
        orders.total_amount,
        orders.created_at,
        customers.id AS customer_id,
        customers.first_name,
        customers.last_name,
        customers.email
       FROM orders
       JOIN customers
         ON orders.customer_id = customers.id
       WHERE orders.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

   
        const itemsResult = await pool.query(
    `SELECT
        order_items.id,
        order_items.product_id,
        products.name,
        products.sku,
        order_items.quantity,
        order_items.unit_price
    FROM order_items
    JOIN products
        ON order_items.product_id = products.id
    WHERE order_items.order_id = $1
    ORDER BY order_items.id ASC`,
    [id]
    );

    res.status(200).json({
  ...result.rows[0],
  items: itemsResult.rows
});


  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get order"
    });
  }
};


// ========================
// CREATE ORDER
// ========================
const createOrder = async (req, res) => {
  try {
    const { customer_id, status } = req.body;

    const result = await pool.query(
      `INSERT INTO orders
       (customer_id, status, total_amount)
       VALUES ($1, $2, 0)
       RETURNING *`,
      [customer_id, status || "Pending"]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create order"
    });
  }
};


// ========================
// ADD ITEM TO ORDER
// ========================
const addOrderItem = async (req, res) => {
  const client = await pool.connect();

  try {
    const { order_id, product_id, quantity } = req.body;

    // Start transaction
    await client.query("BEGIN");


    // 1. Check that the order exists
    const orderResult = await client.query(
      "SELECT id FROM orders WHERE id = $1",
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Order not found"
      });
    }


    // 2. Find product and lock the row
    const productResult = await client.query(
      "SELECT * FROM products WHERE id = $1 FOR UPDATE",
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Product not found"
      });
    }

    const product = productResult.rows[0];


    // 3. Validate quantity
    if (!quantity || quantity <= 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Quantity must be greater than 0"
      });
    }


    // 4. Check available stock
    if (product.stock_quantity < quantity) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Not enough stock available"
      });
    }


    // 5. Get trusted product price from PostgreSQL
    const unit_price = product.price;


    // 6. Add item to the order
    const result = await client.query(
      `INSERT INTO order_items
       (order_id, product_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [order_id, product_id, quantity, unit_price]
    );


    // 7. Reduce product stock
    await client.query(
      `UPDATE products
       SET stock_quantity = stock_quantity - $1
       WHERE id = $2`,
      [quantity, product_id]
    );


    // 8. Recalculate the order total
    await client.query(
      `UPDATE orders
       SET total_amount = (
         SELECT COALESCE(SUM(quantity * unit_price), 0)
         FROM order_items
         WHERE order_id = $1
       )
       WHERE id = $1`,
      [order_id]
    );


    // 9. Save all transaction changes
    await client.query("COMMIT");

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    // Undo transaction if something fails
    await client.query("ROLLBACK");

    res.status(500).json({
      message: "Failed to add order item"
    });

  } finally {

    // Return connection to PostgreSQL pool
    client.release();
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status"
      });
    }

    const result = await pool.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update order status"
    });
  }
};


// ========================
// EXPORT CONTROLLERS
// ========================
module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  addOrderItem,
  updateOrderStatus
};