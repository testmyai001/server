# Quick Setup Guide

## Step 1: Create .env file

In the `backend` folder, create a file named `.env` with this content:

```env
# Backend API Keys
BACKEND_API_KEY=test-backend-key-12345
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

**Important:** Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Google Gemini API key.

## Step 2: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Step 3: Run the Backend

```bash
python main.py
```

The backend will start at `http://localhost:8000`

## Step 4: Update React App

Make sure your React app's `.env.local` has:

```env
VITE_BACKEND_API_URL=http://localhost:8000
VITE_BACKEND_API_KEY=test-backend-key-12345
```

## Step 5: Test

1. Start the backend: `python main.py`
2. Start React: `npm run dev`
3. Open `http://localhost:3000` in your browser
4. Try the ChatBot or upload an invoice

## Get Your Gemini API Key

If you don't have a Gemini API key yet:

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file
