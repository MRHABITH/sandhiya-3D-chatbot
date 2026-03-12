from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime

@dataclass
class ConversationTurn:
    id: str
    session_id: str
    user_message: str
    bot_message: str
    intent: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class UserSession:
    session_id: str
    user_id: str
    history: List[ConversationTurn] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)
