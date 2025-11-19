// Multer middleware configuration for handling file uploads (audio, video, and SRT files)
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsPath = path.join(__dirname, "..", "uploads");
    fs.ensureDirSync(uploadsPath);
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname).toLowerCase();
    let prefix = "audio";

    if (
      extension === ".srt" ||
      file.mimetype === "text/plain" ||
      file.mimetype === "application/x-subrip" ||
      file.mimetype === "text/x-subrip"
    ) {
      prefix = "srt";
    } else if (file.mimetype && file.mimetype.startsWith("video/")) {
      prefix = "video";
    }

    cb(null, `${prefix}-${uniqueSuffix}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/x-m4a",
    "audio/ogg",
    "audio/webm",
    "audio/aac",
    "audio/flac",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/avi",
    "text/plain",
    "application/x-subrip",
    "text/x-subrip",
  ];

  const extension = path.extname(file.originalname).toLowerCase();
  const isSRT = extension === ".srt";

  if (allowedMimes.includes(file.mimetype) || isSRT) {
    cb(null, true);
  } else {
    console.log(
      `❌ Rejected file with MIME type: ${file.mimetype}, extension: ${extension}`
    );
    cb(
      new Error(
        `Unsupported file type: ${
          file.mimetype
        }. Allowed types: ${allowedMimes.join(", ")}, or .srt files`
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

module.exports = upload;
