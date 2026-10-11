
const LOW_STOCK_THRESHOLD = 10;

/**
 * Create low-stock notifications for active Admins
 * and Managers when a product crosses the threshold.
 *
 * Use the same PostgreSQL client as the stock update
 * so notifications can be part of the transaction.
 */
async function createLowStockNotifications(
  client,
  product,
  previousQuantity,
  newQuantity
) {
  const before = Number(previousQuantity);
  const after = Number(newQuantity);

  if (
    !Number.isFinite(before) ||
    !Number.isFinite(after)
  ) {
    throw new Error("Invalid stock quantities");
  }

  // Only alert when stock first reaches low-stock level.
  // Also alert when it reaches zero from positive stock.
  const crossedLowStock =
    before > LOW_STOCK_THRESHOLD &&
    after <= LOW_STOCK_THRESHOLD;

  const becameOutOfStock =
    before > 0 && after === 0;

  if (!crossedLowStock && !becameOutOfStock) {
    return 0;
  }

  const title =
    after === 0
      ? "Out of Stock Alert"
      : "Low Stock Alert";

  const message =
    after === 0
      ? `${product.name} (${product.sku}) is out of stock. Please restock.`
      : `${product.name} (${product.sku}) has only ${after} units remaining. Reorder soon.`;

  const result = await client.query(
    `INSERT INTO notifications (
       user_id,
       type,
       title,
       message
     )
     SELECT
       users.id,
       'low_stock',
       $1,
       $2
     FROM users
     WHERE users.role IN ('Admin', 'Manager')
       AND users.status = 'Active'
       AND NOT EXISTS (
         SELECT 1
         FROM notifications n
         WHERE n.user_id = users.id
           AND n.type = 'low_stock'
           AND n.is_read = FALSE
           AND n.message = $2
       )
     RETURNING id`,
    [title, message]
  );

  return result.rowCount;
}

module.exports = {
  LOW_STOCK_THRESHOLD,
  createLowStockNotifications,
};
