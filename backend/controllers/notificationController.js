const db = require('../models');
const { Op } = require('sequelize');
const socketService = require('../services/socketService');

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

    // Send real-time notification via Socket.io
    socketService.sendToUser(userId, 'new_notification', notification);

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

/**
 * Gửi thông báo cho toàn bộ người dùng thuộc một vai trò nhất định
 * @param {string} role - 'admin', 'warehouse_staff', 'accountant', 'staff', 'service_staff'
 * @param {object} param1 - { title, message, type }
 */
const createRoleNotification = async (role, { title, message, type }) => {
  try {
    // 1. Tìm tất cả người dùng có role này
    const users = await db.User.findAll({ where: { role } });
    
    // 2. Tạo bản ghi Notification cho từng người (để lưu vào DB)
    const notifications = await Promise.all(
      users.map(user => db.Notification.create({
        userId: user.id,
        title,
        message,
        type: type || null,
      }))
    );

    // 3. Gửi socket emit duy nhất 1 lần cho cả Room của Role đó
    // Lưu ý: Dữ liệu gửi đi có thể là thông báo chung, client sẽ tự fetch lại hoặc lấy data này
    socketService.sendToRole(role, 'new_role_notification', {
      title,
      message,
      type: type || null,
      createdAt: new Date()
    });

    return notifications;
  } catch (error) {
    console.error(`Failed to create role notification for ${role}:`, error.message);
    return [];
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  createRoleNotification,
};
