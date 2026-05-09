import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware.js";
import { successResponse } from "../../common/utils/response/success.response.js";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
} from "./notification.service.js";
import { BadRequestException } from "../../common/utils/response/error.response.js";

const router = Router();

/**
 * GET /notification
 * Get paginated notifications for current user
 */
router.get("/", authentication(), async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const data = await getUserNotifications(req.user._id, { page, limit });
  return successResponse({ res, data });
});

/**
 * GET /notification/unread-count
 * Get unread notification count for badge display
 */
router.get("/unread-count", authentication(), async (req, res, next) => {
  const count = await getUnreadCount(req.user._id);
  return successResponse({ res, data: { count } });
});

/**
 * PATCH /notification/:id/read
 * Mark a specific notification as read
 */
router.patch("/:id/read", authentication(), async (req, res, next) => {
  const result = await markNotificationRead(req.params.id, req.user._id);
  if (!result?.modifiedCount) {
    throw BadRequestException({ message: "Notification not found or already read" });
  }
  return successResponse({ res, message: "Notification marked as read" });
});

/**
 * PATCH /notification/read-all
 * Mark all notifications as read
 */
router.patch("/read-all", authentication(), async (req, res, next) => {
  await markAllNotificationsRead(req.user._id);
  return successResponse({ res, message: "All notifications marked as read" });
});

/**
 * DELETE /notification/:id
 * Delete a specific notification
 */
router.delete("/:id", authentication(), async (req, res, next) => {
  const result = await deleteNotification(req.params.id, req.user._id);
  if (!result?.deletedCount) {
    throw BadRequestException({ message: "Notification not found" });
  }
  return successResponse({ res, message: "Notification deleted" });
});

export default router;
