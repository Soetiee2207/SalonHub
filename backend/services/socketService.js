let io;

module.exports = {
  init: (socketIoInstance) => {
    io = socketIoInstance;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
  sendToUser: (userId, event, data) => {
    if (io) {
      io.to(`user_${userId}`).emit(event, data);
    }
  },
  sendToRole: (role, event, data) => {
    if (io) {
      io.to(`role_${role}`).emit(event, data);
    }
  },
  broadcast: (event, data) => {
    if (io) {
      io.emit(event, data);
    }
  }
};
