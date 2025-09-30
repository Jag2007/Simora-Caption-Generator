const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsPath = path.join(__dirname, '..', '..', 'uploads');
    fs.ensureDirSync(uploadsPath);
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `audio-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'audio/x-m4a',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
    'audio/flac',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/avi'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log(`❌ Rejected file with MIME type: ${file.mimetype}`);
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: ${allowedMimes.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: fileFilter
});

module.exports = upload;