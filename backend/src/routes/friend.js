const express = require('express');
const { sendRequest, acceptRequest, rejectRequest, getFriends, getRequests, removeFriend } = require('../controllers/friend');
const validate = require('../middleware/validate');
const { friendRequestSchema, handleRequestSchema } = require('../validators/friend');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Friends
 *   description: Friend operations
 */

/**
 * @swagger
 * /api/friends:
 *   get:
 *     summary: Get all friends
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Friends retrieved successfully
 */
router.get('/', getFriends);

/**
 * @swagger
 * /api/friends/requests:
 *   get:
 *     summary: Get pending friend requests
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending friend requests retrieved
 */
router.get('/requests', getRequests);

/**
 * @swagger
 * /api/friends/request:
 *   post:
 *     summary: Send a friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Friend request sent
 *       400:
 *         description: Cannot send to self / Already friends
 */
router.post('/request', validate(friendRequestSchema), sendRequest);

/**
 * @swagger
 * /api/friends/accept:
 *   post:
 *     summary: Accept a friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestId
 *             properties:
 *               requestId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Friend request accepted
 */
router.post('/accept', validate(handleRequestSchema), acceptRequest);

/**
 * @swagger
 * /api/friends/reject:
 *   post:
 *     summary: Reject a friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestId
 *             properties:
 *               requestId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Friend request rejected
 */
router.post('/reject', validate(handleRequestSchema), rejectRequest);

/**
 * @swagger
 * /api/friends/{id}:
 *   delete:
 *     summary: Remove a friend
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Friend removed successfully
 */
router.delete('/:id', removeFriend);

module.exports = router;
