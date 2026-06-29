const userService = require('../services/user');

exports.search = async (req, res, next) => {
  try {
    const { query } = req.query;
    const users = await userService.searchUsers(query, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users
    });
  } catch (error) {
    next(error);
  }
};
