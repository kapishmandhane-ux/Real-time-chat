const express = require('express');
const { getHistory } = require('../controllers/message');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message history
 */

/**
 * @swagger
 * /api/messages/{friendId}:
 *   get:
 *     summary: Get conversation history with a friend
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the friend
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Conversation history retrieved
 */
router.get('/:friendId', getHistory);

module.exports = router;
