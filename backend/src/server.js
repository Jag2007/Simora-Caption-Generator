const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.ensureDirSync(uploadsDir);

app.use('/api', uploadRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Video Caption Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: true,
    message: error.message || 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Video Caption Backend server is running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  if (process.env.HINGLISH_PYTHON) {
    console.log(`🚀🚀🚀 Hinglish Python: ${process.env.HINGLISH_PYTHON}`);
  } else {
    console.log('🚀🚀 Hinglish Python not set. Using system python3. Set HINGLISH_PYTHON to override.');
  }
});