const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

exports.signupUser = async (userData) => {
  const { username, email, password } = userData;

  // Check if username or email already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    if (existingUser.email === email) {
      throw new ErrorResponse('Email is already taken', 400);
    }
    if (existingUser.username === username) {
      throw new ErrorResponse('Username is already taken', 400);
    }
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password
  });

  return user;
};

exports.loginUser = async (email, password) => {
  // Check for user (include password because select: false by default)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  return user;
};
