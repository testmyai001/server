from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="AutoTally Backend API")

# CORS configuration - Allow your React app to access this API
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
]

# Add production origins from environment variable
prod_origins = os.getenv("ALLOWED_ORIGINS", "")
if prod_origins:
    origins.extend(prod_origins.split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple API key validation (you can enhance this later)
VALID_API_KEYS = os.getenv("BACKEND_API_KEY", "").split(",")

def validate_api_key(authorization: str = Header(None)):
    """Validate the user's backend API key"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    api_key = authorization.replace("Bearer ", "")
    
    if api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return api_key


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "AutoTally Backend API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Backend is running"}


@app.get("/auth/validate")
async def validate_key(authorization: str = Header(None)):
    """Validate user's API key"""
    try:
        validate_api_key(authorization)
        return {
            "success": True,
            "message": "API key is valid"
        }
    except HTTPException as e:
        return {
            "success": False,
            "message": e.detail
        }


@app.get("/ai/gemini-key")
async def get_gemini_key(authorization: str = Header(None)):
    """
    Get Gemini API key for authenticated users
    This endpoint returns the Gemini API key to the React frontend
    """
    # Validate user's API key
    validate_api_key(authorization)
    
    # Get Gemini API key from environment
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if not gemini_key:
        raise HTTPException(
            status_code=500, 
            detail="Gemini API key not configured on server"
        )
    
    return {
        "success": True,
        "geminiApiKey": gemini_key,
        "message": "API key retrieved successfully"
    }


class GeminiKeyResponse(BaseModel):
    success: bool
    geminiApiKey: str = None
    message: str


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
