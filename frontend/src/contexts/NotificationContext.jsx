import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const socket = useSocket();

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.getUnreadCount();
      const count = res.data?.totalUnread || res.totalUnread || 0;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [user]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (socket) {
      const handleUpdate = () => {
        refreshUnreadCount();
      };

      socket.on('new_notification', handleUpdate);
      socket.on('new_role_notification', handleUpdate);
      socket.on('notifications_updated', handleUpdate); // Sự kiện mới từ Backend hoặc tab khác

      return () => {
        socket.off('new_notification', handleUpdate);
        socket.off('new_role_notification', handleUpdate);
        socket.off('notifications_updated', handleUpdate);
      };
    }
  }, [socket, refreshUnreadCount]);

  const markAllReadOptimistic = () => {
    setUnreadCount(0);
    // Phát tín hiệu cho các tab khác (nếu có)
    if (socket) {
      socket.emit('notifications_updated_client');
    }
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, refreshUnreadCount, markAllReadOptimistic }}>
      {children}
    </NotificationContext.Provider>
  );
};
