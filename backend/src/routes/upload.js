// API routes for audio upload, transcription, and video rendering with captions
const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const upload = require("../middleware/upload");
const {
  processAudioWithWhisper,
  processAudioWithHinglishWhisper,
} = require("../utils/whisper");
const {
  generateSRT,
  generateRemotionCaptions,
  validateSRT,
} = require("../utils/srt");
const { renderVideoWithCaptions } = require("../utils/videoRenderer");

const router = express.Router();

router.post("/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: "No audio file uploaded",
      });
    }

    console.log(`🚀🚀🚀 File uploaded: ${req.file.filename}`);
    console.log(
      `🚀🚀🚀 File size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`
    );

    const audioFilePath = req.file.path;

    console.log("🚀🚀🚀 Processing audio with Whisper");
    const transcription = await processAudioWithWhisper(audioFilePath);

    console.log("🚀🚀🚀 Generating SRT file");
    const srtContent = generateSRT(transcription);

    const remotionCaptions = generateRemotionCaptions(transcription);

    const validation = validateSRT(srtContent);
    if (!validation.isValid) {
      console.warn("👺 SRT validation warnings", validation.errors);
    }

    await fs.remove(audioFilePath);
    console.log("🚀🚀🚀 Temporary file cleaned up");

    res.json({
      success: true,
      srt: srtContent,
      captions: remotionCaptions,
      filename: req.file.originalname,
      transcription: transcription,
      duration:
        transcription.length > 0
          ? transcription[transcription.length - 1].end
          : 0,
      segmentCount: transcription.length,
      validation: validation,
    });
  } catch (error) {
    console.error("👺 Error processing audio", error);

    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }

    res.status(500).json({
      error: true,
      message: error.message || "Failed to process audio file",
    });
  }
});

router.post(
  "/upload-audio-hinglish",
  upload.single("audio"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: true,
          message: "No audio file uploaded",
        });
      }

      console.log(`🚀 Hinglish file uploaded: ${req.file.filename}`);
      console.log(
        `🚀 File size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`
      );

      const audioFilePath = req.file.path;

      console.log("🚀 Processing audio with Hinglish Whisper model...");
      const transcription = await processAudioWithHinglishWhisper(
        audioFilePath
      );

      console.log("🚀 Generating SRT file...");
      const srtContent = generateSRT(transcription);

      const remotionCaptions = generateRemotionCaptions(transcription);

      const validation = validateSRT(srtContent);
      if (!validation.isValid) {
        console.warn("⚠️ SRT validation warnings:", validation.errors);
      }

      await fs.remove(audioFilePath);
      console.log("🧹 Temporary file cleaned up");

      res.json({
        success: true,
        srt: srtContent,
        captions: remotionCaptions,
        filename: req.file.originalname,
        transcription: transcription,
        duration:
          transcription.length > 0
            ? transcription[transcription.length - 1].end
            : 0,
        segmentCount: transcription.length,
        validation: validation,
        model: "Hinglish Whisper (Oriserve/Whisper-Hindi2Hinglish-Swift)",
        language: "Hinglish (Hindi + English)",
      });
    } catch (error) {
      console.error("❌ Error processing Hinglish audio:", error);

      if (req.file && req.file.path) {
        try {
          await fs.remove(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }

      res.status(500).json({
        error: true,
        message: error.message || "Failed to process Hinglish audio file",
      });
    }
  }
);

router.post(
  "/render-video",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "srt", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files || !req.files.video || !req.files.srt) {
        return res.status(400).json({
          error: true,
          message: "Both video and SRT files are required",
        });
      }

      const videoFile = req.files.video[0];
      const srtFile = req.files.srt[0];

      console.log(`🎬 Rendering video: ${videoFile.filename}`);
      console.log(`📝 Using SRT: ${srtFile.filename}`);

      const videoPath = videoFile.path;
      const srtPath = srtFile.path;
      const outputPath = path.join(
        path.dirname(videoPath),
        `rendered-${Date.now()}.mp4`
      );

      const captionStyle = req.body.captionStyle || "bottom";
      const captionFont = req.body.captionFont || "Arial";
      const captionSize = parseInt(req.body.captionSize) || 24;
      const captionWeight = parseInt(req.body.captionWeight) || 700;
      const captionColor = req.body.captionColor || "#ffffff";

      console.log("🎨 Caption settings received:", {
        captionStyle,
        captionFont,
        captionSize,
        captionWeight,
        captionColor,
      });

      await renderVideoWithCaptions(videoPath, srtPath, outputPath, {
        style: captionStyle,
        font: captionFont,
        fontSize: captionSize,
        fontWeight: captionWeight,
        color: captionColor,
      });

      res.download(outputPath, (err) => {
        if (err) {
          console.error("❌ Error sending file:", err);
          if (!res.headersSent) {
            res.status(500).json({
              error: true,
              message: "Error sending rendered video",
            });
          }
        }

        setTimeout(async () => {
          try {
            await Promise.all([
              fs.remove(videoPath).catch(() => {}),
              fs.remove(srtPath).catch(() => {}),
              fs.remove(outputPath).catch(() => {}),
            ]);
            console.log("🧹 Temporary files cleaned up");
          } catch (cleanupError) {
            console.error("Error cleaning up files:", cleanupError);
          }
        }, 5000);
      });
    } catch (error) {
      console.error("❌ Error rendering video:", error);

      if (req.files) {
        if (req.files.video) {
          fs.remove(req.files.video[0].path).catch(() => {});
        }
        if (req.files.srt) {
          fs.remove(req.files.srt[0].path).catch(() => {});
        }
      }

      res.status(500).json({
        error: true,
        message: error.message || "Failed to render video with captions",
      });
    }
  }
);

router.get("/test", (req, res) => {
  res.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    endpoints: {
      "POST /api/upload-audio":
        "Upload audio file for transcription (Large Whisper model)",
      "POST /api/upload-audio-hinglish":
        "Upload audio file for Hinglish transcription (Specialized model)",
      "POST /api/render-video":
        "Render video with captions (requires video and SRT files)",
    },
  });
});

module.exports = router;
