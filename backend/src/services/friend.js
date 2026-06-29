const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

exports.sendRequest = async (senderId, receiverId) => {
  if (senderId.toString() === receiverId) {
    throw new ErrorResponse('Cannot send friend request to yourself', 400);
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new ErrorResponse('User not found', 404);
  }

  // Check if already friends
  if (receiver.friends.includes(senderId)) {
    throw new ErrorResponse('You are already friends', 400);
  }

  // Check if request already exists (either way)
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId }
    ],
    status: 'pending'
  });

  if (existingRequest) {
    throw new ErrorResponse('Friend request already pending', 400);
  }

  const newRequest = await FriendRequest.create({
    sender: senderId,
    receiver: receiverId
  });

  return newRequest;
};

exports.acceptRequest = async (userId, requestId) => {
  const request = await FriendRequest.findById(requestId);

  if (!request) {
    throw new ErrorResponse('Friend request not found', 404);
  }

  if (request.receiver.toString() !== userId.toString()) {
    throw new ErrorResponse('Not authorized to accept this request', 403);
  }

  if (request.status !== 'pending') {
    throw new ErrorResponse('Request already processed', 400);
  }

  request.status = 'accepted';
  await request.save();

  // Add to friends lists
  await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
  await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

  return request;
};

exports.rejectRequest = async (userId, requestId) => {
  const request = await FriendRequest.findById(requestId);

  if (!request) {
    throw new ErrorResponse('Friend request not found', 404);
  }

  if (request.receiver.toString() !== userId.toString()) {
    throw new ErrorResponse('Not authorized to reject this request', 403);
  }

  if (request.status !== 'pending') {
    throw new ErrorResponse('Request already processed', 400);
  }

  request.status = 'rejected';
  await request.save();

  return request;
};

exports.getFriends = async (userId) => {
  const user = await User.findById(userId).populate('friends', 'username email avatar bio');
  return user.friends;
};

exports.removeFriend = async (userId, friendId) => {
  await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
  await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
};

exports.getRequests = async (userId) => {
  const requests = await FriendRequest.find({ receiver: userId, status: 'pending' })
    .populate('sender', 'username email avatar bio');
  return requests;
};
