const User = require('../models/User');

exports.searchUsers = async (query, currentUserId) => {
  // Case insensitive search
  const regex = new RegExp(query, 'i');
  
  // Find users matching query, exclude current user
  const users = await User.find({
    username: regex,
    _id: { $ne: currentUserId }
  }).select('username avatar bio');

  return users;
};
