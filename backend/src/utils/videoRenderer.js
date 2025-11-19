// Server-side video rendering utility that burns SRT captions into video files using FFmpeg with user-selected styles
const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const util = require("util");

const execPromise = util.promisify(exec);

function hexToASSColor(hex) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `&H${b.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${r.toString(16).padStart(2, "0")}`;
}

async function renderVideoWithCaptions(videoPath, srtPath, outputPath, captionTheme = {}) {
  try {
    if (!(await fs.pathExists(srtPath))) {
      throw new Error(`SRT file not found: ${srtPath}`);
    }

    const srtContent = await fs.readFile(srtPath, "utf-8");
    if (!srtContent || srtContent.trim().length === 0) {
      throw new Error("SRT file is empty");
    }

    console.log("📝 SRT file content preview:", srtContent.substring(0, 200));

    const style = captionTheme.style || "bottom";
    const fontName = captionTheme.font ? captionTheme.font.split(",")[0].trim() : "Arial";
    const fontSize = captionTheme.fontSize || 24;
    const fontWeight = captionTheme.fontWeight || 700;
    const colorHex = captionTheme.color || "#ffffff";
    const assColor = hexToASSColor(colorHex);

    let alignment = "2";
    let marginV = 30;

    if (style === "topbar") {
      alignment = "5";
      marginV = 10;
    } else if (style === "karaoke") {
      alignment = "2";
      marginV = 30;
    }

    const forceStyle = `FontName=${fontName},FontSize=${fontSize},PrimaryColour=${assColor},OutlineColour=&H000000,Outline=2,Shadow=1,MarginV=${marginV},Alignment=${alignment},Bold=${fontWeight >= 600 ? 1 : 0}`;

    const srtPathEscaped = srtPath.replace(/'/g, "'\\''");
    const ffmpegCommand = `ffmpeg -i "${videoPath}" -vf "subtitles='${srtPathEscaped}':force_style='${forceStyle}'" -c:v libx264 -c:a copy -preset medium -crf 23 -y "${outputPath}"`;

    console.log("🎬 Starting video rendering with captions...");
    console.log(`Input video: ${videoPath}`);
    console.log(`SRT file: ${srtPath}`);
    console.log(`Output: ${outputPath}`);
    console.log(`🎨 Style: ${style}, Font: ${fontName}, Size: ${fontSize}, Color: ${colorHex}`);

    const { stdout, stderr } = await execPromise(ffmpegCommand);

    if (stderr && !stderr.includes("frame=") && !stderr.includes("time=") && stderr.includes("Error")) {
      console.error("FFmpeg error:", stderr);
      throw new Error(`FFmpeg error: ${stderr}`);
    }

    console.log("✅ Video rendered successfully");

    if (await fs.pathExists(outputPath)) {
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        throw new Error("Output file was created but is empty");
      }
      console.log(`📦 Output file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      return true;
    } else {
      throw new Error("Output file was not created");
    }
  } catch (error) {
    console.error("❌ Error rendering video:", error);
    throw error;
  }
}

module.exports = {
  renderVideoWithCaptions,
};

