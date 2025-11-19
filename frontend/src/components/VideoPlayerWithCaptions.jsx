// Video player component that displays video with dynamically rendered captions using Remotion
import React, { useEffect, useMemo, useState } from "react";
import { Player } from "@remotion/player";
import RemotionCaptionVideo from "./RemotionCaptionVideo";

const VideoPlayerWithCaptions = ({
  videoFile,
  captions,
  captionStyle = "bottom",
  captionTheme,
}) => {
  const [videoUrl, setVideoUrl] = useState(null);
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoFile]);
  const durationInSeconds = useMemo(() => {
    if (!Array.isArray(captions) || captions.length === 0) return 0;
    const last = captions[captions.length - 1];
    return Math.max(0, Number(last.end) || 0);
  }, [captions]);
  const fps = 30;
  const durationInFrames = Math.max(
    1,
    Math.round(durationInSeconds * fps) || 1
  );

  if (!videoFile) {
    return null;
  }

  return (
    <div className="video-player-container">
      <h3>🎥 Video with Generated Captions</h3>
      <div className="video-wrapper">
        {videoUrl ? (
          <Player
            component={RemotionCaptionVideo}
            inputProps={{
              videoSrc: videoUrl,
              captions,
              fps,
              captionStyle,
              captionTheme: captionTheme || {
                fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
                fontWeight: 700,
                fontSize: 28,
                color: "#ffffff",
              },
            }}
            durationInFrames={durationInFrames}
            fps={fps}
            compositionWidth={1280}
            compositionHeight={720}
            controls
            style={{
              width: "100%",
              maxWidth: 800,
              borderRadius: 12,
              overflow: "hidden",
            }}
          />
        ) : (
          <div className="video-loading">Loading video...</div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerWithCaptions;
