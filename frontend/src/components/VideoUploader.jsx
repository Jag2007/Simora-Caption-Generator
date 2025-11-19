// Main component for video upload, audio extraction, caption generation, and video rendering with user-selected caption styles
import React, { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import VideoPlayerWithCaptions from "./VideoPlayerWithCaptions";
import ENDPOINT from "../constants";

const VideoUploader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedAudioUrl, setExtractedAudioUrl] = useState(null);
  const [captions, setCaptions] = useState(null);
  const [srtContent, setSrtContent] = useState(null);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [captionStyle, setCaptionStyle] = useState("bottom");
  const [captionFont, setCaptionFont] = useState(
    "Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
  );
  const [captionSize, setCaptionSize] = useState(28);
  const [captionWeight, setCaptionWeight] = useState(700);
  const [captionColor, setCaptionColor] = useState("#ffffff");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const ffmpegRef = useRef(new FFmpeg());

  const API_BASE_URL = `${ENDPOINT}/api`;

  const loadFFmpeg = async () => {
    const ffmpeg = ffmpegRef.current;

    ffmpeg.on("progress", ({ progress }) => {
      setProgress(Math.round(progress * 100));
    });

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    setIsFFmpegLoaded(true);
  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
      setExtractedAudioUrl(null);
      setCaptions(null);
      setSrtContent(null);
    } else {
      alert("Please select a valid video file");
    }
  };

  const generateCaptions = async (audioBlob) => {
    setIsGeneratingCaptions(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "extracted_audio.mp3");
      const endpoint = "/upload-audio-hinglish";
      console.log(`${API_BASE_URL}${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setCaptions(result.transcription);
        setSrtContent(result.srt);
        console.log("🚀🚀🚀 Captions generated successfully");
      } else {
        throw new Error(result.message || "Failed to generate captions");
      }
    } catch (error) {
      console.error("👺 Error generating captions", error);
      alert(`Error generating captions: ${error.message}`);
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const extractAudio = async () => {
    if (!selectedFile) return;

    if (!isFFmpegLoaded) {
      setIsLoading(true);
      await loadFFmpeg();
    }

    setIsLoading(true);
    setProgress(0);

    const ffmpeg = ffmpegRef.current;
    const inputFileName = "input.mp4";
    const outputFileName = "output.mp3";

    try {
      await ffmpeg.writeFile(inputFileName, await fetchFile(selectedFile));
      await ffmpeg.exec([
        "-i",
        inputFileName,
        "-q:a",
        "0",
        "-map",
        "a",
        outputFileName,
      ]);
      const data = await ffmpeg.readFile(outputFileName);
      const audioBlob = new Blob([data.buffer], { type: "audio/mp3" });
      const audioUrl = URL.createObjectURL(audioBlob);

      setExtractedAudioUrl(audioUrl);
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
      console.log("🚀🚀🚀 Audio extracted, generating captions");
      await generateCaptions(audioBlob);
    } catch (error) {
      console.error("👺 Error extracting audio", error);
      alert("Error extracting audio. Please try again.");
    }

    setIsLoading(false);
    setProgress(0);
  };

  const downloadAudio = () => {
    if (extractedAudioUrl) {
      const a = document.createElement("a");
      a.href = extractedAudioUrl;
      a.download = `${selectedFile.name.split(".")[0]}_audio.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const downloadSRT = () => {
    if (srtContent) {
      const blob = new Blob([srtContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedFile.name.split(".")[0]}_captions.srt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadVideoWithCaptions = async () => {
    if (!selectedFile || !srtContent) {
      alert("Video file and captions are required");
      return;
    }

    setIsRenderingVideo(true);
    setRenderProgress(0);

    try {
      const formData = new FormData();
      formData.append("video", selectedFile);

      const srtBlob = new Blob([srtContent], { type: "text/plain" });
      formData.append("srt", srtBlob, "captions.srt");

      formData.append("captionStyle", captionStyle);
      formData.append("captionFont", captionFont);
      formData.append("captionSize", captionSize.toString());
      formData.append("captionWeight", captionWeight.toString());
      formData.append("captionColor", captionColor);

      console.log("📤 Sending video and SRT to backend for rendering...");
      console.log("🎨 Caption settings:", {
        captionStyle,
        captionFont,
        captionSize,
        captionWeight,
        captionColor,
      });

      const response = await fetch(`${API_BASE_URL}/render-video`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const blob = await response.blob();

      if (!blob || blob.size === 0) {
        throw new Error("Received empty video file from server");
      }

      console.log(
        "✅ Video received, size:",
        (blob.size / 1024 / 1024).toFixed(2),
        "MB"
      );

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedFile.name.split(".")[0]}_with_captions.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("✅ Video with captions downloaded successfully");
      alert("✅ Video with captions downloaded successfully!");
    } catch (error) {
      console.error("❌ Error downloading video with captions", error);
      alert(
        `Error rendering video: ${error.message}\n\nMake sure FFmpeg is installed on the server and the backend is running.`
      );
    } finally {
      setIsRenderingVideo(false);
      setRenderProgress(0);
    }
  };

  return (
    <div className="video-uploader">
      <div className="header-section">
        <h1 className="title">🎬 Video Caption Generator</h1>
        <p className="subtitle">
          Upload a video file to extract audio and generate captions using AI
        </p>
      </div>

      <div className="main-content">
        <div className="upload-section">
          <div
            className={`upload-zone ${isDragOver ? "drag-over" : ""} ${
              selectedFile ? "has-file" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileInputChange}
              className="file-input"
            />

            {selectedFile ? (
              <div className="file-info">
                <div className="file-icon">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                      stroke="#14b8a6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 2V8H20"
                      stroke="#14b8a6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="file-details">
                  <p className="file-name">{selectedFile.name}</p>
                  <p className="file-size">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">
                  <svg
                    width="48"
                    height="38"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                      stroke="#14b8a6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17 8L12 3L7 8"
                      stroke="#14b8a6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 3V15"
                      stroke="#14b8a6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p>Drag and drop a video file here, or click to select</p>
                <p className="supported-formats">
                  Supports: MP4, AVI, MOV, MKV, and more
                </p>
              </div>
            )}
          </div>

          {selectedFile && (
            <>
              <div className="model-selection">
                <div className="model-info">
                  <div className="model-badge">
                    <span className="model-icon">🇮🇳</span>
                    <span className="model-name">Hinglish Model</span>
                  </div>
                  <p className="model-description">
                    Optimized for Hindi + English mixed content
                  </p>
                </div>
              </div>

              <div className="model-selection" style={{ marginTop: 10 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <select
                    value={captionStyle}
                    onChange={(e) => setCaptionStyle(e.target.value)}
                  >
                    <option value="bottom">Bottom centered</option>
                    <option value="topbar">Top bar</option>
                    <option value="karaoke">Karaoke</option>
                  </select>
                  <select
                    value={captionFont}
                    onChange={(e) => setCaptionFont(e.target.value)}
                  >
                    <option value="Segoe UI, Tahoma, Geneva, Verdana, sans-serif">
                      Segoe UI
                    </option>
                    <option value="Arial, Helvetica, sans-serif">Arial</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Courier New, monospace">Courier New</option>
                  </select>
                  <input
                    type="number"
                    min="14"
                    max="64"
                    value={captionSize}
                    onChange={(e) => setCaptionSize(Number(e.target.value))}
                  />
                  <select
                    value={captionWeight}
                    onChange={(e) => setCaptionWeight(Number(e.target.value))}
                  >
                    <option value={400}>Regular</option>
                    <option value={600}>Semi Bold</option>
                    <option value={700}>Bold</option>
                  </select>
                  <input
                    type="color"
                    value={captionColor}
                    onChange={(e) => setCaptionColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="actions" style={{ marginTop: 10 }}>
                <button
                  onClick={extractAudio}
                  disabled={isLoading || isGeneratingCaptions}
                  className="extract-btn"
                >
                  {isLoading
                    ? `Extracting Audio... ${progress}%`
                    : isGeneratingCaptions
                    ? "Generating Captions..."
                    : "Extract Audio & Generate Captions"}
                </button>
              </div>
            </>
          )}

          {(isLoading || isGeneratingCaptions) && (
            <div className="progress-container">
              {isLoading && (
                <>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">
                    {progress}% Audio Extraction Complete
                  </p>
                </>
              )}
              {isGeneratingCaptions && (
                <p className="progress-text">
                  🎤 Generating captions with AI... This may take a few moments.
                </p>
              )}
            </div>
          )}
        </div>

        {extractedAudioUrl && (
          <div className="results-section">
            <div className="results-grid">
              <div className="audio-section">
                <div className="result">
                  <h3>🎉 Audio Extracted Successfully</h3>
                  <div className="audio-player">
                    <audio controls src={extractedAudioUrl}></audio>
                  </div>
                  <div className="download-buttons">
                    <div className="download-buttons-row">
                      <button onClick={downloadAudio} className="download-btn">
                        Download Audio (MP3)
                      </button>
                      {srtContent && (
                        <button onClick={downloadSRT} className="download-btn">
                          Download Captions (SRT)
                        </button>
                      )}
                    </div>
                    {srtContent && (
                      <div className="download-video-button">
                        <button
                          onClick={downloadVideoWithCaptions}
                          className="download-btn download-video-btn"
                          disabled={isRenderingVideo}
                        >
                          {isRenderingVideo
                            ? `⏳ Rendering Video... ${renderProgress}%`
                            : "🎥 Download Video with Captions"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {captions && captions.length > 0 && (
                <div className="captions-section">
                  <div className="captions-result">
                    <h3>✨ Generated Captions are here</h3>
                    <div className="captions-preview">
                      {captions.slice(0, 5).map((caption, index) => (
                        <div key={index} className="caption-segment">
                          <span className="caption-time">
                            {Math.floor(caption.start / 60)}:
                            {(caption.start % 60).toFixed(1).padStart(4, "0")} -{" "}
                            {Math.floor(caption.end / 60)}:
                            {(caption.end % 60).toFixed(1).padStart(4, "0")}
                          </span>
                          <span className="caption-text">{caption.text}</span>
                        </div>
                      ))}
                      {captions.length > 5 && (
                        <p className="caption-more">
                          ... and {captions.length - 5} more segments
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {captions && captions.length > 0 && selectedFile && (
          <div className="video-section">
            <VideoPlayerWithCaptions
              videoFile={selectedFile}
              captions={captions}
              captionStyle={captionStyle}
              captionTheme={{
                fontFamily: captionFont,
                fontWeight: captionWeight,
                fontSize: captionSize,
                color: captionColor,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
