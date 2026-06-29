const multer = require('multer');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');

// Storage configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif/;
  const allowedDocTypes = /pdf|doc|docx|txt/;
  const allowedAudioTypes = /webm|mp3|wav|ogg|mp4|aac/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  const isImage = allowedImageTypes.test(extname) && allowedImageTypes.test(mimetype);
  const isDoc = allowedDocTypes.test(extname) && (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('text'));
  const isAudio = allowedAudioTypes.test(extname) || mimetype.startsWith('audio/') || mimetype.startsWith('video/webm'); // sometimes webm is recorded as video

  if (isImage || isDoc || isAudio) {
    return cb(null, true);
  } else {
    cb(new ErrorResponse('Unsupported file type. Only images, PDFs, documents, and audio are allowed.', 400), false);
  }
};

// Multer upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter
});

module.exports = upload;
