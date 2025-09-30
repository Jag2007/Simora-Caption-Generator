# Caption Generator

A full-stack web application that automatically generates and renders captions on videos using Remotion. Built as part of a full-stack internship task, this project supports Hinglish (Hindi + English mixed text) and provides multiple caption styling presets.

### Demo and Resources

##### Drive Folder (Demo Video + ZIP + Setup Instructions): [Google Drive Link](https://drive.google.com/drive/folders/1WZgkxjfm7ek-UGnnOwwV-YOspx4WOL6p?usp=sharing)

## Overview

This application allows users to upload MP4 videos, automatically generate captions using Whisper AI, preview the captioned video in real-time, and export the final result. The project demonstrates integration of speech-to-text technology with video rendering capabilities while handling multilingual text rendering.


## Features

- Upload MP4/MOV video files from local storage
- Automatic caption generation using OpenAI Whisper
- Full Hinglish support with proper font rendering (Devanagari + Latin characters)
- Multiple predefined caption styles:
  - Bottom-centered captions
  - Top-bar style
  - Karaoke-style word highlighting
- Real-time video preview with Remotion Player
- Export captioned videos as MP4
- Download captions in SRT format
- Clean, modular codebase with separate frontend and backend

## Tech Stack

**Frontend:**
- React with Vite
- Remotion for video rendering
- Modern JavaScript (ES6+)

**Backend:**
- Node.js with Express.js
- Python for Whisper integration
- FFmpeg for audio extraction

**AI/ML:**
- OpenAI Whisper (speech-to-text)

## Prerequisites

Before running this project locally, ensure you have the following installed:

- Node.js v18 or higher (check with `node -v`)
- npm or yarn package manager
- Python 3.8+ (for Whisper)
- VS Code (recommended for development)
- FFmpeg (for audio processing)

## Installation and Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Jag2007/Caption-Generator.git
cd Caption-Generator 
```
###  Step 2: Set Up Python Environment for Whisper
##### It's recommended to use a virtual environment for Python dependencies:

#### Create virtual environment
```bash
python -m venv venv
```
#### Activate virtual environment
#### On Linux/macOS:
```bash
source venv/bin/activate
```
#### On Windows:
```bash
venv\Scripts\activate
```
#### Install Whisper
```bash
pip install openai-whisper
```

### Step 3: Backend Setup
#### Open a terminal window and run:
```bash
cd backend
npm install
npm start
```
### Step 4: Frontend Setup
#### Open a terminal window and run:
```bash
cd frontend
npm install
npm run dev
```

### Usage

###### 1. **Upload Video**: Click the upload button and select an MP4 or MOV file from your device
###### 2. **Generate Captions**: Click "Auto-generate captions" to run speech-to-text processing
###### 3. **Select Style**: Choose from the available caption presets (bottom-centered, top-bar, or karaoke)
###### 4. **Preview**: View the video with captions in real-time using the Remotion Player
###### 5. **Export**: Download the final captioned video as MP4 or export captions as SRT file

### Project Structure

```bash
SimoraAI
|
├── backend/
│   ├── server.js          # Express server setup
│   ├── routes/            # API routes
│   ├── utils/             # Helper functions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── remotion/      # Remotion compositions
│   │   └── App.jsx        # Main application
│   ├── public/
│   └── package.json
└── README.md
```

### Key Implementation Details

#### Hinglish Support
###### The application uses Noto Sans Devanagari and Noto Sans fonts to properly render mixed Hindi and English text. Font loading is handled in the Remotion composition to ensure correct display of both scripts.

#### Caption Presets
###### Instead of implementing a complex timeline editor, the project provides three predefined caption styles that users can select from. This approach keeps the implementation simple while demonstrating the core functionality of caption rendering.

#### Speech-to-Text
###### The project uses OpenAI's Whisper model for automatic caption generation. Audio is extracted from the uploaded video using FFmpeg, processed through Whisper, and the resulting transcription is formatted with timestamps.

### Troubleshooting

#### Backend won't start:
###### Ensure Node.js v18+ is installed.
###### Check if port 3001 is available.
###### Verify all dependencies are installed with `npm install`.

#### Whisper errors:
###### Make sure Python virtual environment is activated.
###### Verify Whisper is installed: `pip list | grep whisper`.
###### Check Python version is 3.8 or higher.


#### Video preview not working:
###### Clear browser cache.
###### Ensure fonts are properly loaded in the Remotion composition.
###### Check network tab for font loading errors.

#### Acknowledgments
###### This project was developed as part of a full-stack internship task focusing on Remotion integration, speech-to-text processing, and multilingual text rendering.
###### This project was developed with the assistance of AI tools for code generation and optimization. I gained a strong understanding of the overall workflow, architecture, and integration process, ensuring that I can explain, maintain, and extend the project independently.
