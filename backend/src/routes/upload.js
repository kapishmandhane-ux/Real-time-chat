const express = require('express');
const upload = require('../middleware/upload');
const { uploadFile } = require('../controllers/upload');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Media upload operations
 */

/**
 * @swagger
 * /api/uploads:
 *   post:
 *     summary: Upload a file (image, PDF, document)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Unsupported file type or size limit exceeded
 */
router.post('/', protect, upload.single('file'), uploadFile);

module.exports = router;
