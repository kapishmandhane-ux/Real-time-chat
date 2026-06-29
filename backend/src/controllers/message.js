const messageService = require('../services/message');

exports.getHistory = async (req, res, next) => {
  try {
    const friendId = req.params.friendId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;

    // Automatically mark messages as read when history is fetched
    await messageService.markMessagesAsRead(friendId, req.user._id);

    const messages = await messageService.getConversationHistory(req.user._id, friendId, page, limit);

    res.status(200).json({
      success: true,
      message: 'Conversation history retrieved',
      data: messages
    });
  } catch (error) {
    next(error);
  }
};
