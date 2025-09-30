import React, { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import VideoPlayerWithCaptions from "./VideoPlayerWithCaptions";

const VideoUploader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedAudioUrl, setExtractedAudioUrl] = useState(null);
  const [captions, setCaptions] = useState(null);
  const [srtContent, setSrtContent] = useState(null);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [captionStyle, setCaptionStyle] = useState("bottom");
  const [captionFont, setCaptionFont] = useState(
    "Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
  );
  const [captionSize, setCaptionSize] = useState(28);
  const [captionWeight, setCaptionWeight] = useState(700);
  const [captionColor, setCaptionColor] = useState("#ffffff");
  const [isDragOver, setIsDragOver] = useState(false);
  const [useHinglishModel, setUseHinglishModel] = useState(true); // Default to Hinglish model
  const fileInputRef = useRef(null);
  const ffmpegRef = useRef(new FFmpeg());

  const API_BASE_URL = "https://simora-caption-generator.onrender.com/api";

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

      const endpoint = useHinglishModel
        ? "/upload-audio-hinglish"
        : "/upload-audio";
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

  return (
    <div className="video-uploader">
      <div className="header-section">
        <h1 className="title">Video Caption Generator</h1>
        <p className="subtitle">
          Upload a video file to extract audio and generate captions using AI
        </p>
      </div>

      <div className="main-content">
        {/* Upload Section */}
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
                <div className="file-icon">🎬</div>
                <div className="file-details">
                  <p className="file-name">{selectedFile.name}</p>
                  <p className="file-size">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📁</div>
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
                <div className="model-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={useHinglishModel}
                      onChange={(e) => setUseHinglishModel(e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">
                      {useHinglishModel
                        ? "🇮🇳 Hinglish Model"
                        : "🌐 Multilingual Model"}
                    </span>
                  </label>
                  <p className="model-description">
                    {useHinglishModel
                      ? "Optimized for Hindi + English mixed content"
                      : "Works with all languages including Hinglish"}
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

        {/* Results Section - Two Column Layout */}
        {extractedAudioUrl && (
          <div className="results-section">
            <div className="results-grid">
              {/* Left Column - Audio & Downloads */}
              <div className="audio-section">
                <div className="result">
                  <h3>Audio Extracted Successfully!!🎉🎉🎉</h3>
                  <div className="audio-player">
                    <audio controls src={extractedAudioUrl}></audio>
                  </div>
                  <div className="download-buttons">
                    <button onClick={downloadAudio} className="download-btn">
                      Download Audio (MP3)
                    </button>
                    {srtContent && (
                      <button onClick={downloadSRT} className="download-btn">
                        Download Captions (SRT)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Captions Preview */}
              {captions && captions.length > 0 && (
                <div className="captions-section">
                  <div className="captions-result">
                    <h3>Generated Captions are here</h3>
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

        {/* Video Player Section - Full Width */}
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
