# 🚀 Backend Deployment Guide - Railway

## Prerequisites

- Node.js 18+ installed locally
- Python 3.9+ installed locally
- Railway account (free tier available)
- Git installed

---

## 📦 **STEP 1: Prepare Your Backend**

### 1.1 Install Dependencies Locally (Test First)

\`\`\`bash
cd backend

# Install Node.js dependencies

npm install

# Install Python dependencies

pip3 install -r requirements.txt

# Create .env file from example

cp .env.example .env
\`\`\`

### 1.2 Update .env File

Edit `backend/.env`:

\`\`\`env
PORT=3001
NODE_ENV=production
FRONTEND_URLS=https://caption-generator-smoky.vercel.app
WHISPER_MODEL=base
HINGLISH_PYTHON=
PLATFORM=railway
\`\`\`

### 1.3 Test Locally

\`\`\`bash

# Start the server

npm start

# In another terminal, test the health endpoint

curl http://localhost:3001/health
\`\`\`

---

## 🚂 **STEP 2: Deploy to Railway**

### 2.1 Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Select the `backend` folder as root directory

### 2.2 Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

\`\`\`
PORT=3001
NODE_ENV=production
FRONTEND_URLS=https://caption-generator-smoky.vercel.app
WHISPER_MODEL=base
PLATFORM=railway
\`\`\`

### 2.3 Configure Build Settings

Railway should auto-detect your setup, but verify:

- **Build Command**: `npm install && pip3 install -r requirements.txt`
- **Start Command**: `npm start`
- **Root Directory**: `/backend` (if your backend is in a subdirectory)

### 2.4 Deploy

1. Click "Deploy" in Railway dashboard
2. Wait for build to complete (5-10 minutes first time)
3. Railway will provide a public URL like: `https://your-app.railway.app`

---

## 🔗 **STEP 3: Connect Frontend to Backend**

### 3.1 Update Frontend Environment Variable

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add/Update:
   \`\`\`
   VITE_API_BASE_URL=https://your-app.railway.app/api
   \`\`\`
   (Replace with your actual Railway URL)

3. Redeploy your frontend

### 3.2 Update Backend CORS

In Railway, update the `FRONTEND_URLS` variable to include your Vercel URL:

\`\`\`
FRONTEND_URLS=https://caption-generator-smoky.vercel.app,http://localhost:5173
\`\`\`

---

## ✅ **STEP 4: Verify Deployment**

### 4.1 Test Backend Health

\`\`\`bash
curl https://your-app.railway.app/health
\`\`\`

Expected response:
\`\`\`json
{
"status": "OK",
"message": "Video Caption Backend is running",
"timestamp": "2025-09-30T...",
"environment": "production",
"platform": "railway"
}
\`\`\`

### 4.2 Test API Endpoint

\`\`\`bash
curl https://your-app.railway.app/api/test
\`\`\`

### 4.3 Test from Frontend

1. Go to your Vercel frontend URL
2. Upload a video file
3. Click "Auto-generate captions"
4. Check browser console for any errors

---

## 🐛 **STEP 5: Debugging**

### View Logs in Railway

1. Go to Railway dashboard
2. Click on your project
3. Go to **Deployments** tab
4. Click on latest deployment
5. View logs in real-time

### Common Issues & Solutions

#### Issue: "CORS blocked"

**Solution**: Verify `FRONTEND_URLS` in Railway includes your Vercel URL

#### Issue: "Whisper not found"

**Solution**: Check Railway logs. Whisper should install via `requirements.txt`

#### Issue: "Python module not found"

**Solution**: Ensure `requirements.txt` is in backend root and Railway build command includes `pip3 install -r requirements.txt`

#### Issue: "File upload fails"

**Solution**: Check Railway logs for disk space. Railway has 1GB ephemeral storage.

---

## 📊 **Monitoring & Logs**

### Key Log Messages to Watch

✅ **Success indicators:**
\`\`\`
🚀 Video Caption Backend Server Started
✅ File uploaded successfully
✅ Transcription complete: X segments
✅ Request completed in Xs
\`\`\`

❌ **Error indicators:**
\`\`\`
❌ No file uploaded
❌ Whisper failed
❌ Error processing audio
👺 CORS blocked origin
\`\`\`

### Add Console Logs for Debugging

The updated code includes comprehensive logging. Check Railway logs for:

- Request details (method, path, file size)
- Processing steps (upload → transcription → SRT generation)
- Error messages with stack traces
- Performance metrics (processing time)

---

## 🔒 **Security Checklist**

- ✅ CORS properly configured
- ✅ File size limits enforced (100MB)
- ✅ File type validation in multer
- ✅ Temporary files cleaned up after processing
- ✅ Error messages don't expose sensitive info in production
- ✅ Environment variables used for configuration

---

## 💰 **Cost Estimation**

**Railway Free Tier:**

- $5 free credit per month
- ~500 hours of runtime
- 1GB RAM, 1 vCPU
- 1GB ephemeral storage

**Estimated usage for your app:**

- Should fit within free tier for development/testing
- For production, consider Railway Pro ($20/month)

---

## 🚀 **Alternative: Deploy to Render**

If you prefer Render over Railway:

1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repo
4. Configure:
   - **Build Command**: `npm install && pip3 install -r requirements.txt`
   - **Start Command**: `npm start`
   - **Environment**: Add same variables as Railway
5. Deploy

---

## 📝 **Next Steps**

1. ✅ Deploy backend to Railway
2. ✅ Update frontend environment variable
3. ✅ Test end-to-end flow
4. ✅ Monitor logs for errors
5. ✅ Set up custom domain (optional)
6. ✅ Enable Railway metrics/monitoring

---

## 🆘 **Need Help?**

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check Railway logs for detailed error messages
- Verify all environment variables are set correctly

---

**Your backend is now production-ready! 🎉**
