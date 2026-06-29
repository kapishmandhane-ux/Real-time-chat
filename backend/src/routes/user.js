const express = require('express');
const { search } = require('../controllers/user');
const validate = require('../middleware/validate');
const { searchSchema } = require('../validators/user');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Wrap req.query into an object for Joi validation if needed, 
// but our validate middleware is for req.body. Let's create a custom validator for query.
// Wait, validate(searchSchema) checks req.body. 
// We should update the validate middleware to accept 'source' (body/query/params).
// For now, I'll update the validate middleware first.
// Let's use a custom inline validation for query here or fix validate middleware.

// Assuming validate middleware will be updated:
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        error: errorMessage
      });
    }
    next();
  };
};

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User operations
 */

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search for users by username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Username to search for
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 */
router.get('/search', protect, validateQuery(searchSchema), search);

module.exports = router;
