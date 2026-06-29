const friendService = require('../services/friend');

exports.sendRequest = async (req, res, next) => {
  try {
    const { receiverId } = req.body;
    const request = await friendService.sendRequest(req.user._id, receiverId);

    res.status(201).json({
      success: true,
      message: 'Friend request sent',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

exports.acceptRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const request = await friendService.acceptRequest(req.user._id, requestId);

    res.status(200).json({
      success: true,
      message: 'Friend request accepted',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const request = await friendService.rejectRequest(req.user._id, requestId);

    res.status(200).json({
      success: true,
      message: 'Friend request rejected',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

exports.getFriends = async (req, res, next) => {
  try {
    const friends = await friendService.getFriends(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Friends retrieved',
      data: friends
    });
  } catch (error) {
    next(error);
  }
};

exports.getRequests = async (req, res, next) => {
  try {
    const requests = await friendService.getRequests(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Friend requests retrieved',
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFriend = async (req, res, next) => {
  try {
    const { id } = req.params;
    await friendService.removeFriend(req.user._id, id);

    res.status(200).json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
