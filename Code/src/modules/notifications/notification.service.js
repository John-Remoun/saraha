import { NotificationModel } from "../../DB/model/notification.model.js";
import { find, findOne, updateOne, deleteMany, countDocuments } from "../../DB/database.service.js";

/**
 * Create a notification for a user
 */
export const createNotification = async ({ userId, type, title, body, meta = {} }) => {
  try {
    const notification = await NotificationModel.create({ userId, type, title, body, meta });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};

/**
 * Get all notifications for a user (paginated)
 */
export const getUserNotifications = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const notifications = await find({
    model: NotificationModel,
    filter: { userId },
    options: { skip, limit, sort: { createdAt: -1 } },
  });
  const total = await countDocuments({ model: NotificationModel, filter: { userId } });
  const unreadCount = await countDocuments({ model: NotificationModel, filter: { userId, isRead: false } });
  return { notifications, total, unreadCount, page, limit };
};

/**
 * Mark a single notification as read
 */
export const markNotificationRead = async (notificationId, userId) => {
  return await updateOne({
    model: NotificationModel,
    filter: { _id: notificationId, userId },
    update: { isRead: true },
  });
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsRead = async (userId) => {
  return await NotificationModel.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  );
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId, userId) => {
  return await NotificationModel.deleteOne({ _id: notificationId, userId });
};

/**
 * Get unread count for a user
 */
export const getUnreadCount = async (userId) => {
  return await countDocuments({ model: NotificationModel, filter: { userId, isRead: false } });
};
