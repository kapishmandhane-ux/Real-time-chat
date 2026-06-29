const jwt = require('jsonwebtoken');
const User = require('../models/User');
const onlineUsersManager = require('./onlineUsers');
const messageService = require('../services/message');

const setupSocket = (io) => {
  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('Authentication error'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsersManager.addOnlineUser(userId, socket.id);

    // Send the current list of online friends to the connecting user
    const onlineFriends = socket.user.friends
      .map(fId => fId.toString())
      .filter(fId => onlineUsersManager.isUserOnline(fId));
    
    socket.emit('onlineFriends', { onlineFriends });

    // Broadcast to friends that user is online
    socket.user.friends.forEach((friendId) => {
      const friendSockets = onlineUsersManager.getUserSockets(friendId.toString());
      if (friendSockets.length > 0) {
        io.to(friendSockets).emit('friend_online', { userId });
      }
    });

    socket.on('disconnect', () => {
      onlineUsersManager.removeOnlineUser(userId, socket.id);
      
      // If user has no more active sockets, broadcast offline status
      if (!onlineUsersManager.isUserOnline(userId)) {
        socket.user.friends.forEach((friendId) => {
          const friendSockets = onlineUsersManager.getUserSockets(friendId.toString());
          if (friendSockets.length > 0) {
            io.to(friendSockets).emit('friend_offline', { userId });
          }
        });
      }
    });

    socket.on('sendMessage', async (data, callback) => {
      try {
        const { receiverId, text, mediaUrl, mediaType } = data;
        
        let messageData = {
          sender: userId,
          receiver: receiverId,
          text,
          mediaUrl,
          mediaType,
          status: 'sent'
        };

        const receiverSockets = onlineUsersManager.getUserSockets(receiverId);
        
        // If receiver is online, mark as delivered
        if (receiverSockets.length > 0) {
          messageData.status = 'delivered';
        }

        const message = await messageService.saveMessage(messageData);

        // Emit to receiver if online
        if (receiverSockets.length > 0) {
          io.to(receiverSockets).emit('receive_message', message);
          
          // Also let the sender know it was delivered immediately
          const senderSockets = onlineUsersManager.getUserSockets(userId);
          if (senderSockets.length > 0) {
            io.to(senderSockets).emit('messageDelivered', { tempId: data.tempId, messageId: message._id });
          }
        }

        // Acknowledge sender with the saved message
        if (typeof callback === 'function') {
          callback({ success: true, data: message });
        }

      } catch (error) {
        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    socket.on('messageRead', async (data) => {
      const { messageId, senderId } = data;
      if (messageId) {
         await messageService.updateMessageStatus([messageId], 'read');
      }
      const senderSockets = onlineUsersManager.getUserSockets(senderId);
      if (senderSockets.length > 0) {
        io.to(senderSockets).emit('messages_read', { readerId: userId });
      }
    });

    socket.on('typing', (data) => {
      const { receiverId, isTyping } = data;
      const receiverSockets = onlineUsersManager.getUserSockets(receiverId);
      if (receiverSockets.length > 0) {
        io.to(receiverSockets).emit('user_typing', { senderId: userId, isTyping });
      }
    });

  });
};

module.exports = setupSocket;
