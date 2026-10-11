
const express = require("express");
const router = express.Router();

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

// All notification endpoints require authentication.
router.use(authenticateToken);

// Get notifications for the logged-in user.
router.get("/", getNotifications);

// Get the number of unread notifications.
router.get("/unread-count", getUnreadCount);

// Mark all notifications as read.
router.patch("/read-all", markAllNotificationsRead);

// Mark one notification as read.
router.patch("/:id/read", markNotificationRead);

module.exports = router;
