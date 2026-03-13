const db = require('../models');
const { Op } = require('sequelize');

// Get current user's notifications
const getMyNotifications = async (req, res, next) => {
  try {
    const { unread } = req.query;

    const where = { userId: req.user.id };

    if (unread === 'true') {
      where.isRead = false;
    }

    const notifications = await db.Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// Mark single notification as read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await db.Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    await notification.update({ isRead: true });

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res, next) => {
  try {
    await db.Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );

    res.status(200).json({
      success: true,
      data: { message: 'All notifications marked as read.' },
    });
  } catch (error) {
    next(error);
  }
};

// Delete a notification
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await db.Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    await notification.destroy();

    res.status(200).json({
      success: true,
      data: { message: 'Notification deleted successfully.' },
    });
  } catch (error) {
    next(error);
  }
};

// Internal helper - create notification for a user
const createNotification = async ({ userId, title, message, type }) => {
  try {
    const notification = await db.Notification.create({
      userId,
      title,
      message,
      type: type || null,
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
};
