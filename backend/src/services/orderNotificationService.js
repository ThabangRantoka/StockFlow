
/**
 * StockFlow Order Notification Service
 *
 * Creates notifications for active Admins and Managers:
 * 1. When a new order is created.
 * 2. When an existing order changes status.
 *
 * Uses the PostgreSQL connection or transaction
 * client supplied by the controller.
 */

// ========================
// NEW ORDER NOTIFICATION
// ========================
const createOrderNotification = async (
  db,
  orderId,
  status = "Pending"
) => {
  if (!db || typeof db.query !== "function") {
    throw new Error("A database connection is required");
  }

  const id = Number(orderId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid order ID");
  }

  const title = "New Order Created";

  const message =
    `Order #${id} has been created ` +
    `with status ${status}.`;

  const result = await db.query(
    `INSERT INTO notifications (
       user_id,
       type,
       title,
       message
     )
     SELECT
       u.id,
       'order',
       $1::varchar,
       $2::text
     FROM users u
     WHERE u.role IN ('Admin', 'Manager')
       AND u.status = 'Active'
       AND NOT EXISTS (
         SELECT 1
         FROM notifications n
         WHERE n.user_id = u.id
           AND n.type = 'order'
           AND n.title = $1::varchar
           AND n.message = $2::text
       )
     RETURNING id`,
    [title, message]
  );

  return result.rowCount;
};


// ========================
// ORDER STATUS NOTIFICATION
// ========================
const createOrderStatusNotification = async (
  db,
  orderId,
  oldStatus,
  newStatus
) => {
  if (!db || typeof db.query !== "function") {
    throw new Error("A database connection is required");
  }

  const id = Number(orderId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid order ID");
  }

  // No notification if status did not change.
  if (oldStatus === newStatus) {
    return 0;
  }

  const title = "Order Status Updated";

  const message =
    `Order #${id} has changed ` +
    `from ${oldStatus} to ${newStatus}.`;

  const result = await db.query(
    `INSERT INTO notifications (
       user_id,
       type,
       title,
       message
     )
     SELECT
       u.id,
       'order',
       $1::varchar,
       $2::text
     FROM users u
     WHERE u.role IN ('Admin', 'Manager')
       AND u.status = 'Active'
     RETURNING id`,
    [title, message]
  );

  return result.rowCount;
};


// ========================
// EXPORT SERVICES
// ========================
module.exports = {
  createOrderNotification,
  createOrderStatusNotification,
};
