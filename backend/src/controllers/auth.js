const authService = require('../services/auth');

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    }
  });
};

exports.signup = async (req, res, next) => {
  try {
    const user = await authService.signupUser(req.body);
    sendTokenResponse(user, 201, res, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};
