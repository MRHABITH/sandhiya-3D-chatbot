import logging
import io
from pypdf import PdfReader

logger = logging.getLogger(__name__)

# Simple in-memory storage for session context
# In production, use Redis or a database
session_contexts = {}

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF file bytes."""
    try:
        pdf = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return ""

def store_session_context(session_id: str, text: str):
    """Store document text for a session."""
    if session_id not in session_contexts:
        session_contexts[session_id] = []
    
    session_contexts[session_id].append(text)
    logger.info(f"Stored document context for session: {session_id}")

def get_session_context(session_id: str) -> str:
    """Retrieve all document context for a session."""
    contexts = session_contexts.get(session_id, [])
    return "\n\n---\n\n".join(contexts) if contexts else ""
