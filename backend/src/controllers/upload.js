exports.uploadFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file',
      error: 'No file provided'
    });
  }

  // Construct URL
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  
  let mediaType = null;
  if (req.file.mimetype.startsWith('image/')) {
    mediaType = 'image';
  } else if (req.file.mimetype.startsWith('video/')) {
    mediaType = 'video';
  } else if (req.file.mimetype === 'application/pdf') {
    mediaType = 'pdf';
  } else if (req.file.mimetype.startsWith('audio/')) {
    mediaType = 'audio';
  } else {
    mediaType = 'document';
  }

  res.status(200).json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      mediaUrl: fileUrl,
      mediaType,
      filename: req.file.filename,
      size: req.file.size
    }
  });
};
