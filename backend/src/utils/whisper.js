const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");

/**
 * Process audio file using local Whisper model
 * @param {string} audioFilePath - Path to the audio file
 * @param {string} model - Whisper model to use (base, small, medium, large)
 * @returns {Promise<Array>} - Array of transcription segments with timestamps
 */
async function processAudioWithWhisper(audioFilePath, model = "base") {
  return new Promise((resolve, reject) => {
    console.log(`🚀🚀🚀 Starting Whisper transcription with model: ${model}`);

    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
      return reject(new Error("Audio file not found"));
    }

    // Prepare whisper command with word-level timestamps
    // Removing language parameter for auto-detection (works better for Hinglish)
    const whisperArgs = [
      "-m",
      "whisper",
      audioFilePath,
      "--model",
      model,
      "--output_format",
      "json",
      "--word_timestamps",
      "True",
    ];

    console.log("🔧 Whisper command:", "python", whisperArgs.join(" "));

    const whisperProcess = spawn("python", whisperArgs, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    whisperProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    whisperProcess.stderr.on("data", (data) => {
      stderr += data.toString();
      // Whisper logs progress to stderr, so we log it
      console.log("🚀🚀🚀 Whisper", data.toString().trim());
    });

    whisperProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("👺 Whisper process failed with code", code);
        console.error("👺 Stderr", stderr);
        return reject(new Error(`Whisper transcription failed: ${stderr}`));
      }

      try {
        // Parse Whisper JSON output
        const result = JSON.parse(stdout);

        if (!result.segments || !Array.isArray(result.segments)) {
          return reject(new Error("Invalid Whisper output format"));
        }

        // Transform segments for SRT generation
        const segments = result.segments
          .map((segment) => ({
            start: segment.start,
            end: segment.end,
            text: segment.text.trim(),
          }))
          .filter((segment) => segment.text.length > 0);

        console.log(
          `🚀🚀🚀 Transcription completed: ${segments.length} segments`
        );
        resolve(segments);
      } catch (parseError) {
        console.error("👺 Error parsing Whisper output", parseError);
        reject(new Error("Failed to parse Whisper transcription result"));
      }
    });

    whisperProcess.on("error", (error) => {
      console.error("👺 Error spawning Whisper process", error);
      reject(
        new Error(
          "Failed to start Whisper transcription. Make sure Whisper is installed: pip install openai-whisper"
        )
      );
    });
  });
}

/**
 * Alternative implementation using whisper with simpler JSON output
 * Uses multilingual model for better support of mixed languages
 */
async function processAudioWithWhisperSimple(audioFilePath, model = "large") {
  return new Promise((resolve, reject) => {
    console.log(
      `🎙️ Starting Whisper transcription with multilingual model: ${model}`
    );

    const outputDir = path.dirname(audioFilePath);
    const baseName = path.basename(audioFilePath, path.extname(audioFilePath));

    // Use whisper CLI with SRT output - multilingual model for better language detection
    // Large model provides the best multilingual support and accuracy for Hinglish content
    // Omitting --language parameter allows automatic language detection (default behavior)
    const whisperArgs = [
      audioFilePath,
      "--model",
      model,
      "--output_dir",
      outputDir,
      "--output_format",
      "srt",
      "--verbose",
      "False", // Reduce verbose output
      "--task",
      "transcribe", // Explicitly set task to transcribe (not translate)
      "--temperature",
      "0.0", // Lower temperature for more consistent results
    ];

    console.log("🔧 Whisper command:", "whisper", whisperArgs.join(" "));

    const whisperProcess = spawn("whisper", whisperArgs, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";

    whisperProcess.stdout.on("data", (data) => {
      console.log("Whisper output:", data.toString().trim());
    });

    whisperProcess.stderr.on("data", (data) => {
      stderr += data.toString();
      console.log("Whisper:", data.toString().trim());
    });

    whisperProcess.on("close", async (code) => {
      if (code !== 0) {
        console.error("❌ Whisper process failed with code:", code);
        console.error("Stderr:", stderr);

        // Check if it's a model download issue
        if (
          stderr.includes("certificate verify failed") ||
          stderr.includes("SSL:")
        ) {
          return reject(
            new Error(
              `Whisper model download failed due to SSL/network issues. Please pre-download the model: python3 -c "import ssl; ssl._create_default_https_context = ssl._create_unverified_context; import whisper; whisper.load_model('${model}')"`
            )
          );
        }

        return reject(new Error(`Whisper transcription failed: ${stderr}`));
      }

      try {
        // Read the generated SRT file
        const srtPath = path.join(outputDir, `${baseName}.srt`);

        if (fs.existsSync(srtPath)) {
          const srtContent = await fs.readFile(srtPath, "utf8");

          // Parse SRT to segments
          const segments = parseSRTContent(srtContent);

          // Clean up generated files
          try {
            await fs.remove(srtPath);
            await fs.remove(path.join(outputDir, `${baseName}.txt`));
          } catch (cleanupError) {
            console.warn(
              "Warning: Could not clean up temporary files:",
              cleanupError.message
            );
          }

          console.log(
            `✅ Transcription completed: ${segments.length} segments`
          );
          resolve(segments);
        } else {
          reject(new Error("Whisper did not generate expected output file"));
        }
      } catch (error) {
        console.error("❌ Error processing Whisper output:", error);
        reject(error);
      }
    });

    whisperProcess.on("error", (error) => {
      console.error("❌ Error spawning Whisper process:", error);
      reject(
        new Error(
          "Failed to start Whisper transcription. Make sure Whisper is installed: pip install openai-whisper"
        )
      );
    });
  });
}

/**
 * Parse SRT content into segments
 */
function parseSRTContent(srtContent) {
  const segments = [];
  const entries = srtContent.trim().split("\n\n");

  for (const entry of entries) {
    const lines = entry.split("\n");
    if (lines.length >= 3) {
      const timeMatch = lines[1].match(
        /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/
      );
      if (timeMatch) {
        const start = srtTimeToSeconds(timeMatch[1]);
        const end = srtTimeToSeconds(timeMatch[2]);
        const text = lines.slice(2).join(" ").trim();

        segments.push({ start, end, text });
      }
    }
  }

  return segments;
}

/**
 * Convert SRT time format to seconds
 */
function srtTimeToSeconds(timeStr) {
  const [time, ms] = timeStr.split(",");
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds + parseInt(ms) / 1000;
}

/**
 * Process audio using specialized Hinglish Whisper model
 * @param {string} audioFilePath - Path to the audio file
 * @param {string} model - Hugging Face model identifier for Hinglish
 * @returns {Promise<Array>} - Array of transcription segments
 */
async function processAudioWithHinglishWhisper(
  audioFilePath,
  model = "Oriserve/Whisper-Hindi2Hinglish-Swift"
) {
  return new Promise((resolve, reject) => {
    console.log(
      `🎙️ Starting Hinglish Whisper transcription with model: ${model}`
    );

    const outputDir = path.dirname(audioFilePath);
    const baseName = path.basename(audioFilePath, path.extname(audioFilePath));
    const outputFile = path.join(outputDir, `${baseName}_hinglish.json`);

    const pythonScript = path.join(__dirname, "hinglish_whisper.py");

    // Use the specialized Hinglish Python script
    const pythonArgs = [
      pythonScript,
      audioFilePath,
      "--model",
      model,
      "--output",
      outputFile,
    ];

    const pythonBin = process.env.HINGLISH_PYTHON || "python3";
    console.log(
      "🔧 Hinglish Whisper command:",
      pythonBin,
      pythonArgs.join(" ")
    );

    const pythonProcess = spawn(pythonBin, pythonArgs, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      console.log("Hinglish Whisper output:", data.toString().trim());
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
      console.log("Hinglish Whisper:", data.toString().trim());
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Hinglish Whisper process failed with code:", code);
        console.error("Error output:", stderr);

        if (stderr.includes("SSL") || stderr.includes("certificate")) {
          return reject(
            new Error(
              `Hinglish model download failed due to SSL/network issues. Please check your internet connection.`
            )
          );
        }

        return reject(
          new Error(`Hinglish Whisper transcription failed: ${stderr}`)
        );
      }

      try {
        // Read the JSON output file
        if (!fs.existsSync(outputFile)) {
          return reject(
            new Error("Hinglish transcription output file not found")
          );
        }

        const transcriptionData = JSON.parse(
          fs.readFileSync(outputFile, "utf8")
        );

        console.log(
          `🚀🚀🚀 Hinglish transcription completed with ${
            transcriptionData.segments?.length || 0
          } segments`
        );

        // Clean up the output file
        fs.unlinkSync(outputFile);

        resolve(transcriptionData.segments || []);
      } catch (error) {
        console.error("Error parsing Hinglish transcription results:", error);
        reject(
          new Error(
            `Failed to parse Hinglish transcription results: ${error.message}`
          )
        );
      }
    });

    pythonProcess.on("error", (error) => {
      console.error("Failed to start Hinglish Python process:", error);
      reject(
        new Error(`Failed to start Hinglish transcription: ${error.message}`)
      );
    });
  });
}

module.exports = {
  processAudioWithWhisper: processAudioWithWhisperSimple,
  processAudioWithHinglishWhisper,
  processAudioWithWhisperSimple,
};
