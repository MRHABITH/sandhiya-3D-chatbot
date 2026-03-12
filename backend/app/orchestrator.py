import json
import logging
import time
from groq import Groq
from app.config import settings
from .services.document_service import get_session_context

# Setup logging
logger = logging.getLogger(__name__)

# Initialize Groq client
client = None
if settings.GROQ_API_KEY:
    from .services.shape_service import generate_shape_model
    client = Groq(api_key=settings.GROQ_API_KEY)
    logger.info("Groq client initialized")
else:
    logger.warning("GROQ_API_KEY not configured")

# Define the allowed visualization types
VALID_VISUALIZATIONS = ["house", "solar_system", "heart", "city", "engine", "dynamic", "asset", "none"]

SYSTEM_PROMPT = """
You are "GoGenix Enterprise AI", a highly sophisticated AI assistant designed for corporate and professional environments.
Your objective is to provide precise, accurate, and insightful information based on internal documents and general knowledge.

TONE & STYLE:
- Professional, helpful, and concise.
- Use structured responses (bullet points, clear paragraphs).
- If information is extracted from documents, cite the source generally (e.g., "According to the uploaded company guidelines...").

PROMPT ENGINEERING FOR 3D:
When generating a "shape_prompt", be extremely detailed. Instead of "a car", use "a sleek, silver enterprise electric sedan with glowing blue headlights, high detail, studio lighting".

3D VISUALIZATION CAPABILITY:
Your goal is to explain concepts clearly AND determine if a 3D visualization would help the user understand.
If 3D visualizations are DISABLED (check context below), you MUST set "visualization_type" to "none" and "scene" to "none".

OUTPUT FORMAT:
You MUST always respond with ONLY a valid JSON object. Do not include markdown blocks like ```json.
The JSON object must have exactly these keys:
- "text_response": Detailed, professional text response answering the user's prompt.
- "visualization_type": Must be exactly one of: "house", "solar_system", "heart", "city", "engine", "dynamic", "asset", or "none". 
   -> "asset": For real-world objects to generate via AI (cars, equipment, tools).
   -> "none": If no 3D model is relevant (e.g., answering a question about benefits or policy).
- "scene": Component name: "house" -> "HouseScene", "asset" -> "AssetModelScene", etc.
- "asset_id": Normalized string ID for "asset" type (e.g., "industrial_pump").
- "shape_prompt": Descriptive prompt for the 3D generator.
- "animation": boolean.
- "dynamic_objects": [].

Example:
{
  "text_response": "The company's core values focus on innovation and integrity. Here is a 3D representation of an industrial hub representing our scale.",
  "visualization_type": "asset",
  "scene": "AssetModelScene",
  "asset_id": "industrial_hub",
  "shape_prompt": "modern glass industrial building with solar panels, high-tech aesthetic",
  "animation": false,
  "dynamic_objects": []
}
"""

async def handle_turn(payload: dict):
    """
    Handle a single conversation turn with LLM processing and 3D model generation.
    
    Args:
        payload: dict with keys 'message', 'session_id', 'user_id', 'channel'
        
    Returns:
        dict with reply, visualization_type, scene, asset_id, and other metadata
    """
    start_time = time.time()
    user_message = payload.get("message", "")
    session_id = payload.get("session_id", "unknown")
    enable_3d = payload.get("enable_3d", True)
    
    logger.info(f"[{session_id}] Handling turn with message: {user_message[:50]}... (3D Enabled: {enable_3d})")
    
    # Get document context for this session
    context = get_session_context(session_id)
    dynamic_system_prompt = SYSTEM_PROMPT
    if context:
        # TRUNCATE: Only use first 5000 characters to stay within tokens-per-minute limits
        truncated_context = context[:5000] + ("..." if len(context) > 5000 else "")
        logger.info(f"[{session_id}] Adding truncated document context to prompt...")
        dynamic_system_prompt += f"\n\nDOCUMENTS CONTEXT (TRUNCATED):\n{truncated_context}\n\nUse the above context to answer the user's question if relevant."

    if not enable_3d:
        logger.info(f"[{session_id}] 3D generation is DISABLED for this request.")
        dynamic_system_prompt += "\n\nCRITICAL: 3D generation is currently DISABLED. You MUST set 'visualization_type' to 'none' and 'scene' to 'none' for this specific response."

    if not client:
        logger.error("Groq API Key is missing")
        return {
            "reply": "Groq API Key is missing. Please configure GROQ_API_KEY in backend/.env",
            "visualization_type": "none",
            "scene": "none",
            "animation": False
        }
        
    try:
        # Step 1: Call LLM to determine intent and visualization type
        logger.debug(f"[{session_id}] Calling Groq LLM...")
        llm_start = time.time()
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": dynamic_system_prompt
                },
                {
                    "role": "user",
                    "content": user_message,
                }
            ],
            model="llama-3.1-8b-instant", # Switched to 8b for significantly higher TPM limits
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        llm_duration = time.time() - llm_start
        logger.info(f"[{session_id}] LLM response received in {llm_duration:.2f}s")
        
        # Parse the JSON response
        raw_content = chat_completion.choices[0].message.content
        parsed_data = json.loads(raw_content)
        
        # Validate format
        vis_type = parsed_data.get("visualization_type", "none")
        if vis_type not in VALID_VISUALIZATIONS:
            logger.warning(f"[{session_id}] Invalid visualization type: {vis_type}, defaulting to 'none'")
            vis_type = "none"
        
        # Step 2: Generate 3D model if needed
        asset_id = parsed_data.get("asset_id", "")
        if vis_type == "asset" and parsed_data.get("shape_prompt"):
            logger.info(f"[{session_id}] Generating 3D model for: {parsed_data['shape_prompt'][:50]}...")
            model_start = time.time()
            
            generated_url = await generate_shape_model(parsed_data["shape_prompt"])
            
            model_duration = time.time() - model_start
            if generated_url:
                logger.info(f"[{session_id}] 3D model generated in {model_duration:.2f}s: {generated_url}")
                asset_id = generated_url
            else:
                logger.warning(f"[{session_id}] Failed to generate 3D model")
        
        total_duration = time.time() - start_time
        logger.info(f"[{session_id}] Turn completed in {total_duration:.2f}s")

        return {
            "reply": parsed_data.get("text_response", "I could not generate an explanation."),
            "text_response": parsed_data.get("text_response", "I could not generate an explanation."),
            "visualization_type": vis_type,
            "scene": parsed_data.get("scene", "none"),
            "asset_id": asset_id,
            "animation": parsed_data.get("animation", False),
            "dynamic_objects": parsed_data.get("dynamic_objects", []),
            "sources": [],
            "escalated": False
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"[{session_id}] JSON decode error: {e}")
        return {
            "reply": "Sorry, I had trouble formatting my response with a 3D scene.",
            "visualization_type": "none",
            "scene": "none"
        }
    except Exception as e:
        logger.error(f"[{session_id}] Error: {str(e)}", exc_info=True)
        return {
            "reply": f"Error communicating with AI Assistant: {str(e)}",
            "visualization_type": "none",
            "scene": "none"
        }

