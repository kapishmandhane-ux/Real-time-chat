// Maps userId to a Set of socketIds (to support multiple devices)
const onlineUsers = new Map();

exports.addOnlineUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketId);
};

exports.removeOnlineUser = (userId, socketId) => {
  if (onlineUsers.has(userId)) {
    const userSockets = onlineUsers.get(userId);
    userSockets.delete(socketId);
    if (userSockets.size === 0) {
      onlineUsers.delete(userId);
    }
  }
};

exports.getUserSockets = (userId) => {
  if (onlineUsers.has(userId)) {
    return Array.from(onlineUsers.get(userId));
  }
  return [];
};

exports.isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};
