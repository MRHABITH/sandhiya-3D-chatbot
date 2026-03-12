import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from app.config import settings
from app.orchestrator import handle_turn
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Autonomous Support Bot - Local 3D Generation")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for 3D models
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
os.makedirs(os.path.join(static_dir, "models"), exist_ok=True)
app.mount("/models", StaticFiles(directory=os.path.join(static_dir, "models")), name="models")

class ChatRequest(BaseModel):
    session_id: str
    user_id: str
    message: str
    channel: str = "web"

@app.get("/")
async def root():
    return {"status": "ok", "message": "Autonomous Support Bot API is running", "3d_generation": "local-lgm-model"}

@app.post("/chat")
async def chat(req: ChatRequest):
    logger.info(f"Chat request: session={req.session_id}, user={req.user_id}")
    result = await handle_turn(req.dict())
    return result

@app.get("/health")
async def health():
    """Health check endpoint for deployment monitoring."""
    return {"status": "healthy", "service": "autonomous-support-bot"}

class ApiKeyRequest(BaseModel):
    user_id: str
    groq_api_key: str
    tripo_api_key: str

@app.post("/config/api-keys")
async def save_api_keys(req: ApiKeyRequest):
    """
    Endpoint to save API keys (currently just a mock for the frontend).
    In production, this would save to a secure database.
    """
    logger.info(f"Saving API keys for user: {req.user_id}")
    return {"success": True, "message": "API keys saved successfully (mock)"}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Autonomous Support Bot with local LGM 3D generation")
    uvicorn.run(app, host="0.0.0.0", port=8000)

