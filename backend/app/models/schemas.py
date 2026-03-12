from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatRequest(BaseModel):
    session_id: str
    user_id: str
    message: str
    channel: str = "web"

class Source(BaseModel):
    title: str
    url: str
    snippet: str
    score: float

class ChatResponse(BaseModel):
    reply: str
    sources: List[Source] = []
    escalated: bool = False
    ticket_id: Optional[str] = None
    debug_info: Optional[Dict[str, Any]] = None
