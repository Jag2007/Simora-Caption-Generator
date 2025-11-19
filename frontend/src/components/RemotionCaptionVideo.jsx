// Remotion composition component for rendering video with captions in different styles (bottom, topbar, karaoke)
import React from "react";
import { AbsoluteFill, Video, useCurrentFrame } from "remotion";

const RemotionCaptionVideo = ({
  videoSrc,
  captions,
  fps = 30,
  captionStyle = "bottom",
  captionTheme = {},
}) => {
  const frame = useCurrentFrame();
  const t = frame / fps;

  let currentText = "";
  if (Array.isArray(captions) && captions.length > 0) {
    const seg = captions.find((c) => t >= c.start && t <= c.end);
    if (seg && seg.text) currentText = seg.text;
  }

  const renderCaption = () => {
    if (!currentText) return null;

    if (captionStyle === "topbar") {
      return (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            background: "rgba(15,118,110,0.9)",
            color: captionTheme.color || "#fff",
            padding: 16,
            textAlign: "center",
            fontWeight: captionTheme.fontWeight || 700,
            fontFamily: captionTheme.fontFamily,
            fontSize: captionTheme.fontSize
              ? `${captionTheme.fontSize}px`
              : undefined,
          }}
        >
          {currentText}
        </div>
      );
    }
    if (captionStyle === "karaoke") {
      return (
        <div
          className="caption-overlay"
          style={{
            fontFamily: captionTheme.fontFamily,
            fontWeight: captionTheme.fontWeight,
            fontSize: captionTheme.fontSize
              ? `${captionTheme.fontSize}px`
              : undefined,
            color: captionTheme.color,
          }}
        >
          {currentText}
        </div>
      );
    }
    return (
      <div
        className="caption-overlay"
        style={{
          fontFamily: captionTheme.fontFamily,
          fontWeight: captionTheme.fontWeight,
          fontSize: captionTheme.fontSize
            ? `${captionTheme.fontSize}px`
            : undefined,
          color: captionTheme.color,
        }}
      >
        {currentText}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Video src={videoSrc} />
      {renderCaption()}
    </AbsoluteFill>
  );
};

export default RemotionCaptionVideo;
