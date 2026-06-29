const Message = require('../models/Message');

exports.saveMessage = async (messageData) => {
  const message = await Message.create(messageData);
  return message;
};

exports.getConversationHistory = async (userId, friendId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // Lean for performance

  return messages;
};

exports.updateMessageStatus = async (messageIds, status) => {
  await Message.updateMany(
    { _id: { $in: messageIds } },
    { $set: { status } }
  );
};

exports.markMessagesAsRead = async (senderId, receiverId) => {
  await Message.updateMany(
    { sender: senderId, receiver: receiverId, status: { $ne: 'read' } },
    { $set: { status: 'read' } }
  );
};
