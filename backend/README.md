# AutoTally Backend API

Simple FastAPI backend server that provides secure API key management for the AutoTally React application.

## Features

- ✅ Gemini API key endpoint (`/ai/gemini-key`)
- ✅ API key authentication
- ✅ CORS configuration for React app
- ✅ Health check endpoints

## Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
BACKEND_API_KEY=your-backend-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

**Important:**
- `BACKEND_API_KEY` should match the `VITE_BACKEND_API_KEY` in your React app's `.env.local`
- `GEMINI_API_KEY` is your Google Gemini API key

### 3. Run the Server

```bash
# Development mode
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --port 8000
```

The server will start at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /
GET /health
```

### Validate API Key
```
GET /auth/validate
Headers: Authorization: Bearer <your-backend-api-key>
```

### Get Gemini API Key
```
GET /ai/gemini-key
Headers: Authorization: Bearer <your-backend-api-key>

Response:
{
  "success": true,
  "geminiApiKey": "your-gemini-key",
  "message": "API key retrieved successfully"
}
```

## Deployment

### Deploy to Render.com

1. Push this backend folder to a Git repository
2. Create a new Web Service on Render.com
3. Connect your repository
4. Configure:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `BACKEND_API_KEY`
   - `GEMINI_API_KEY`
6. Deploy!

### Update React App

After deploying, update your React app's `.env.local`:

```env
VITE_BACKEND_API_URL=https://your-backend-url.onrender.com
VITE_BACKEND_API_KEY=your-backend-api-key
```

## Security Notes

- Never commit `.env` file to Git
- Keep your API keys secure
- Use strong, random API keys in production
- Consider implementing rate limiting for production use
