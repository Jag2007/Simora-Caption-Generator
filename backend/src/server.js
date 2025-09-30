const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs-extra");
require("dotenv").config();
const app = express();
app.use(cors());

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://simora-caption-generator.vercel.app/"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Private-Network", true);
  //  Firefox caps this at 24 hours (86400 seconds). Chromium (starting in v76) caps at 2 hours (7200 seconds). The default value is 5 seconds.
  res.setHeader("Access-Control-Max-Age", 7200);

  next();
});
const uploadRoutes = require("./routes/upload");

const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const uploadsDir = path.join(__dirname, "..", "uploads");
fs.ensureDirSync(uploadsDir);

app.use("/api", uploadRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Video Caption Backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(error.status || 500).json({
    error: true,
    message: error.message || "Internal server error",
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    error: true,
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Video Caption Backend server is running on port ${PORT}`);
  console.log(
    `📡 Health check: https://simora-caption-generator.onrender.com/health`
  );
  if (process.env.HINGLISH_PYTHON) {
    console.log(`🚀🚀🚀 Hinglish Python: ${process.env.HINGLISH_PYTHON}`);
  } else {
    console.log(
      "🚀🚀 Hinglish Python not set. Using system python3. Set HINGLISH_PYTHON to override."
    );
  }
});
