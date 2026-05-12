const db = require('../models');
const { Op } = require('sequelize');
const socketService = require('../services/socketService');

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

    const totalUnread = await db.Notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.status(200).json({
      success: true,
      data: notifications,
      totalUnread: totalUnread
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await db.Notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.status(200).json({
      success: true,
      totalUnread: count
    });
  } catch (error) {
    next(error);
  }
};

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

const createNotification = async ({ userId, title, message, type }) => {
  try {
    const notification = await db.Notification.create({
      userId,
      title,
      message,
      type: type || null,
    });

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
    const users = await db.User.findAll({ where: { role } });
    
    const notifications = await Promise.all(
      users.map(user => db.Notification.create({
        userId: user.id,
        title,
        message,
        type: type || null,
      }))
    );

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

/**
 * Gửi thông báo cho người dùng thuộc một vai trò + chi nhánh cụ thể
 * @param {string} role - 'warehouse_staff', 'accountant', etc.
 * @param {number} branchId - ID chi nhánh cần gửi
 * @param {object} param2 - { title, message, type }
 */
const createBranchRoleNotification = async (role, branchId, { title, message, type }) => {
  try {
    if (!branchId) {
      return await createRoleNotification(role, { title, message, type });
    }

    const users = await db.User.findAll({ where: { role, branchId } });
    
    const notifications = await Promise.all(
      users.map(user => db.Notification.create({
        userId: user.id,
        title,
        message,
        type: type || null,
      }))
    );

    notifications.forEach((notif, idx) => {
      socketService.sendToUser(users[idx].id, 'new_notification', notif);
    });

    return notifications;
  } catch (error) {
    console.error(`Failed to create branch role notification for ${role}@branch${branchId}:`, error.message);
    return [];
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  createRoleNotification,
  createBranchRoleNotification,
};
