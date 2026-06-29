// ============================================
// KapChat Socket.IO Manager
// ============================================

let socket = null;

const socketManager = {
  connect(token) {
    if (socket && socket.connected) return;

    socket = io('http://localhost:5001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    // ---- Initial online friends ----
    socket.on('onlineFriends', ({ onlineFriends }) => {
      onlineFriends.forEach(userId => app.handleFriendOnline(userId, true));
    });

    // ---- Incoming message ----
    socket.on('receive_message', (message) => {
      app.handleIncomingMessage(message);
    });

    // ---- Typing indicators ----
    socket.on('user_typing', ({ senderId, isTyping }) => {
      app.handleTypingEvent(senderId, isTyping);
    });

    // ---- Online status ----
    socket.on('friend_online', ({ userId }) => {
      app.handleFriendOnline(userId, true);
    });
    socket.on('friend_offline', ({ userId }) => {
      app.handleFriendOnline(userId, false);
    });

    // ---- Read/Delivery receipts ----
    socket.on('messages_read', ({ readerId }) => {
      app.handleMessagesRead(readerId);
    });
    
    socket.on('messageDelivered', ({ tempId, messageId }) => {
      if (app.handleMessageDelivered) app.handleMessageDelivered(tempId, messageId);
    });
  },

  sendMessage(recipientId, content, type = 'text', mediaUrl = null, tempId = null) {
    if (!socket || !socket.connected) {
      showToast('Not connected to server. Please refresh.', 'error');
      return;
    }
    socket.emit('sendMessage', { receiverId: recipientId, text: content, mediaType: type, mediaUrl, tempId });
  },

  emitTyping(recipientId, isTyping) {
    if (socket && socket.connected) {
      socket.emit('typing', { receiverId: recipientId, isTyping });
    }
  },

  markRead(senderId) {
    if (socket && socket.connected) {
      socket.emit('messageRead', { senderId });
    }
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }
};
