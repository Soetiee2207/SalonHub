import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Connect to the socket server
      const socketUrl = import.meta.env.VITE_API_URL || 'https://salonhub-3cg8.onrender.com';
      const newSocket = io(socketUrl, {
        withCredentials: true,
      });

      setSocket(newSocket);

      // Join personal and role rooms
      newSocket.emit('join', user.id);
      if (user.role) {
        newSocket.emit('join_role', user.role);
      }

      // Default notification listener for toasts
      newSocket.on('new_notification', (notification) => {
        toast.success(notification.title, {
          description: notification.message,
          duration: 5000,
        });
      });

      newSocket.on('new_role_notification', (data) => {
        toast.info(data.title, {
          description: data.message,
          duration: 6000,
        });
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
