
const pool = require("../config/database");

const {
  createLowStockNotifications,
} = require("../services/lowStockNotificationService");


const {
  createOrderNotification,
  createOrderStatusNotification,
} = require("../services/orderNotificationService");


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
    console.error("Get orders error:", error);

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
    console.error("Get order error:", error);

    res.status(500).json({
      message: "Failed to get order"
    });
  }
};


// ========================
// CREATE ORDER
// ========================
const createOrder = async (req, res) => {
  let client;

  try {
    const { customer_id, status } = req.body;

    const orderStatus = status || "Pending";

    client = await pool.connect();

    // Start transaction
    await client.query("BEGIN");

    // 1. Create the order
    const result = await client.query(
      `INSERT INTO orders
       (customer_id, status, total_amount)
       VALUES ($1, $2, 0)
       RETURNING *`,
      [customer_id, orderStatus]
    );

    const newOrder = result.rows[0];

    // 2. Create notifications for active
    //    Admins and Managers
    await createOrderNotification(
      client,
      newOrder.id,
      newOrder.status
    );

    // 3. Save order and notifications together
    await client.query("COMMIT");

    return res.status(201).json(newOrder);

  } catch (error) {
    console.error("Create order error:", error);

    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Create order rollback error:",
          rollbackError
        );
      }
    }

    return res.status(500).json({
      message: "Failed to create order"
    });

  } finally {
    if (client) {
      client.release();
    }
  }
};



// ========================
// ADD ITEM TO ORDER
// ========================
const addOrderItem = async (req, res) => {
  let client;

  try {
    const {
      order_id,
      product_id,
      quantity
    } = req.body;

    const requestedQuantity = Number(quantity);

    // Validate quantity before opening transaction
    if (
      !Number.isSafeInteger(requestedQuantity) ||
      requestedQuantity <= 0
    ) {
      return res.status(400).json({
        message: "Quantity must be a positive whole number"
      });
    }

    // Connect to PostgreSQL
    client = await pool.connect();

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


    // 2. Find product and lock its row
    const productResult = await client.query(
      `SELECT *
       FROM products
       WHERE id = $1
       FOR UPDATE`,
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Product not found"
      });
    }

    const product = productResult.rows[0];

    const previousQuantity = Number(
      product.stock_quantity
    );


    // 3. Check available stock
    if (previousQuantity < requestedQuantity) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Not enough stock available"
      });
    }


    // 4. Get trusted product price from PostgreSQL
    const unit_price = product.price;


    // 5. Add item to the order
    const result = await client.query(
      `INSERT INTO order_items
       (order_id, product_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        order_id,
        product_id,
        requestedQuantity,
        unit_price
      ]
    );


    // 6. Reduce product stock
    const stockResult = await client.query(
      `UPDATE products
       SET stock_quantity = stock_quantity - $1
       WHERE id = $2
       RETURNING stock_quantity`,
      [
        requestedQuantity,
        product_id
      ]
    );

    const newQuantity = Number(
      stockResult.rows[0].stock_quantity
    );


    // ================================
    // 7. AUTOMATIC LOW-STOCK ALERT
    // ================================

    await createLowStockNotifications(
      client,
      product,
      previousQuantity,
      newQuantity
    );


    // ================================
    // 8. RECALCULATE ORDER TOTAL
    // ================================

    await client.query(
      `UPDATE orders
       SET total_amount = (
         SELECT COALESCE(
           SUM(quantity * unit_price),
           0
         )
         FROM order_items
         WHERE order_id = $1
       )
       WHERE id = $1`,
      [order_id]
    );


    // ================================
    // 9. COMMIT TRANSACTION
    // ================================

    await client.query("COMMIT");

    return res.status(201).json(
      result.rows[0]
    );

  } catch (error) {
    console.error("Add order item error:", error);

    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError
        );
      }
    }

    return res.status(500).json({
      message: "Failed to add order item"
    });

  } finally {
    if (client) {
      client.release();
    }
  }
};


// ========================
// UPDATE ORDER STATUS
// ========================

// ========================
// UPDATE ORDER STATUS
// ========================
const updateOrderStatus = async (req, res) => {
  let client;

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

    // Validate requested status.
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status"
      });
    }

    // Validate order ID.
    const orderId = Number(id);

    if (
      !Number.isSafeInteger(orderId) ||
      orderId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid order ID"
      });
    }

    client = await pool.connect();

    await client.query("BEGIN");

    // 1. Find the order and lock it.
    const orderResult = await client.query(
      `SELECT id, status
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Order not found"
      });
    }

    const previousStatus = orderResult.rows[0].status;

    // 2. If the status hasn't changed,
    //    return the existing order without
    //    creating a notification.
    if (previousStatus === status) {
      const existingOrder = await client.query(
        `SELECT *
         FROM orders
         WHERE id = $1`,
        [orderId]
      );

      await client.query("COMMIT");

      return res.status(200).json(
        existingOrder.rows[0]
      );
    }

    // 3. Update the order status.
    const updatedOrder = await client.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, orderId]
    );

    // 4. Generate notifications for
    //    active Admins and Managers.
    await createOrderStatusNotification(
      client,
      orderId,
      previousStatus,
      status
    );

    // 5. Save status and notifications together.
    await client.query("COMMIT");

    return res.status(200).json(
      updatedOrder.rows[0]
    );

  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Order status rollback error:",
          rollbackError
        );
      }
    }

    return res.status(500).json({
      message: "Failed to update order status"
    });

  } finally {
    if (client) {
      client.release();
    }
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
