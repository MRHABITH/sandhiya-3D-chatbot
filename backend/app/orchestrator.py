import json
import logging
import time
from groq import Groq
from app.config import settings

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
You are an Interactive AI Visualization Assistant.
Your goal is to explain concepts clearly AND determine if a 3D visualization would help the user understand.

You MUST always respond with ONLY a valid JSON object. Do not include markdown blocks like ```json.
The JSON object must have exactly these keys:
- "text_response": Detailed text explanation answering the user's prompt.
- "visualization_type": Must be exactly one of these strings: "house", "solar_system", "heart", "city", "engine", "dynamic", "asset", or "none". 
   -> Choose "asset" if the user asks for a real-world object (e.g., "car_accident", "dinosaur", "spaceship", "cell", "duck", "chair", "sword") to generate it with AI.
   -> Choose "dynamic" ONLY if the object is highly abstract and must be built from scratch.
   -> Choose "none" if no 3D model is relevant at all.
- "scene": Based on the visualization_type, return the React Component name:
   - "house" -> "HouseScene"
   - "asset" -> "AssetModelScene"
   - "dynamic" -> "DynamicScene"
   - "none" -> "none"
   ... (other types remain the same)
- "asset_id": If `visualization_type` is "asset", generate a normalized string ID (e.g., "car_accident").
- "shape_prompt": If `visualization_type` is "asset", you MUST generate a highly descriptive prompt for the local 3D generator (e.g. "a vivid red sports car", "a low poly wooden chair"). Otherwise "".
- "animation": boolean (true if the scene should be animated).
- "dynamic_objects": If visualization_type is "dynamic", generate a list of 3D primitive shapes. Otherwise [].

Example Asset Output (for "show me a car accident"):
{
  "text_response": "Here is a 3D visualization of a car accident simulation.",
  "visualization_type": "asset",
  "scene": "AssetModelScene",
  "asset_id": "car_accident",
  "shape_prompt": "two wrecked cars intricately colliding, blue and red",
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
    
    logger.info(f"[{session_id}] Handling turn with message: {user_message[:50]}...")
    
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
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": user_message,
                }
            ],
            model="llama-3.3-70b-versatile",
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

