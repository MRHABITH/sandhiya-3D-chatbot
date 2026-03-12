"""
Tripo 3D API integration for 3D model generation from text prompts.

Uses the official tripo3d Python SDK for text-to-model generation.
"""

import os
import uuid
import asyncio
import logging
import struct
import numpy as np
import shutil
from pathlib import Path
from app.config import settings

try:
    from tripo3d import TripoClient, TaskStatus
    TRIPO_SDK_AVAILABLE = True
except ImportError:
    TRIPO_SDK_AVAILABLE = False
    TaskStatus = None

logger = logging.getLogger(__name__)

# Path to the local static models directory
FRONTEND_MODELS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "models")
)

def _create_simple_sphere() -> np.ndarray:
    """Create vertices for a simple sphere."""
    vertices = []
    # Create a simple low-poly sphere
    segments = 16
    for i in range(segments + 1):
        phi = np.pi * i / segments
        for j in range(segments + 1):
            theta = 2 * np.pi * j / segments
            x = np.sin(phi) * np.cos(theta)
            y = np.cos(phi)
            z = np.sin(phi) * np.sin(theta)
            vertices.append([x, y, z])
    return np.array(vertices, dtype=np.float32)

def _create_glb_from_vertices(vertices: np.ndarray, filepath: str) -> bool:
    """Create a simple GLB file from vertices."""
    try:
        vertices = np.asarray(vertices, dtype=np.float32)
        
        if len(vertices) < 3:
            vertices = _create_simple_sphere()
        
        vertex_count = len(vertices)
        indices = list(range(vertex_count))
        indices = np.array(indices, dtype=np.uint32)
        
        vertex_bytes = vertices.tobytes()
        index_bytes = indices.tobytes()
        
        gltf_json = {
            "asset": {"version": "2.0"},
            "scene": 0,
            "scenes": [{"nodes": [0]}],
            "nodes": [{"mesh": 0}],
            "meshes": [{
                "primitives": [{
                    "attributes": {"POSITION": 0},
                    "indices": 1,
                    "mode": 0
                }]
            }],
            "accessors": [
                {
                    "bufferView": 0,
                    "componentType": 5126,
                    "count": vertex_count,
                    "type": "VEC3",
                    "min": vertices.min(axis=0).tolist(),
                    "max": vertices.max(axis=0).tolist()
                },
                {
                    "bufferView": 1,
                    "componentType": 5125,
                    "count": len(indices),
                    "type": "SCALAR"
                }
            ],
            "bufferViews": [
                {"buffer": 0, "byteLength": len(vertex_bytes), "byteOffset": 0, "target": 34962},
                {"buffer": 0, "byteLength": len(index_bytes), "byteOffset": len(vertex_bytes), "target": 34963}
            ],
            "buffers": [{"byteLength": len(vertex_bytes) + len(index_bytes)}]
        }
        
        import json
        json_str = json.dumps(gltf_json)
        json_bytes = json_str.encode('utf-8')
        json_padded = json_bytes + b' ' * (4 - (len(json_bytes) % 4))
        
        bin_data = vertex_bytes + index_bytes
        
        header_size = 12
        json_chunk_size = 8 + len(json_padded)
        bin_chunk_size = 8 + len(bin_data)
        total_length = header_size + json_chunk_size + bin_chunk_size
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'wb') as f:
            f.write(b'glTF')
            f.write(struct.pack('<I', 2))
            f.write(struct.pack('<I', total_length))
            f.write(struct.pack('<I', len(json_padded)))
            f.write(b'JSON')
            f.write(json_padded)
            f.write(struct.pack('<I', len(bin_data)))
            f.write(b'BIN\x00')
            f.write(bin_data)
        
        logger.info(f"Created fallback GLB: {os.path.getsize(filepath)} bytes")
        return True
        
    except Exception as e:
        logger.error(f"Error creating GLB: {e}", exc_info=True)
        return False

async def generate_shape_model(prompt: str) -> str:
    """
    Generate a 3D model from a text prompt using Tripo 3D API.
    
    Uses the official tripo3d Python SDK.
    Falls back to local generation if Tripo API is unavailable.
    
    Args:
        prompt: Text description of the 3D model to generate
    
    Returns:
        URL path to the generated model file, or empty string if failed
    """
    
    if not TRIPO_SDK_AVAILABLE:
        logger.warning("tripo3d SDK not installed, using fallback generation")
        return await _fallback_generate_model(prompt)
    
    if not settings.TRIPO_API_KEY:
        logger.warning("TRIPO_API_KEY not configured, using fallback generation")
        return await _fallback_generate_model(prompt)
    
    try:
        logger.info(f"Starting Tripo 3D generation for: {prompt[:50]}...")
        import time
        start_time = time.time()
        
        # Use the TripoClient to generate the model
        async with TripoClient(api_key=settings.TRIPO_API_KEY) as client:
            # Submit text-to-model task
            logger.info("Submitting task to Tripo API...")
            task_id = await client.text_to_model(
                prompt=prompt,
                negative_prompt="low quality, blurry, distorted"
            )
            logger.info(f"Task submitted with ID: {task_id}")
            
            # Wait for task completion
            logger.info("Waiting for Tripo API to generate model...")
            task = await client.wait_for_task(task_id, verbose=True)
            
            # Check if successful
            if task.status != TaskStatus.SUCCESS:
                logger.error(f"Tripo task failed with status: {task.status}")
                return await _fallback_generate_model(prompt)
            
            # Create temporary directory for downloads
            temp_dir = os.path.join(FRONTEND_MODELS_DIR, ".tmp", uuid.uuid4().hex)
            os.makedirs(temp_dir, exist_ok=True)
            
            # Download the generated model
            logger.info(f"Downloading model files to {temp_dir}...")
            files = await client.download_task_models(task, temp_dir)
            
            # Find the GLB file
            glb_file = None
            for model_type, path in files.items():
                logger.info(f"Downloaded {model_type}: {path}")
                if path.endswith(".glb"):
                    glb_file = path
                    break
            
            if not glb_file:
                logger.error("No GLB file in downloaded models")
                shutil.rmtree(temp_dir, ignore_errors=True)
                return await _fallback_generate_model(prompt)
            
            # Move GLB to final location
            os.makedirs(FRONTEND_MODELS_DIR, exist_ok=True)
            filename = f"model_{uuid.uuid4().hex[:8]}.glb"
            destination = os.path.join(FRONTEND_MODELS_DIR, filename)
            shutil.copy2(glb_file, destination)
            
            # Cleanup temp directory
            shutil.rmtree(temp_dir, ignore_errors=True)
            
            duration = time.time() - start_time
            logger.info(f"Tripo 3D model generation complete in {duration:.2f}s: {filename}")
            
            return f"/models/{filename}"
    
    except Exception as e:
        logger.error(f"Error in Tripo 3D generation: {e}", exc_info=True)
        logger.warning("Falling back to local generation")
        return await _fallback_generate_model(prompt)

async def _fallback_generate_model(prompt: str) -> str:
    """
    Fallback 3D model generation when Tripo API is unavailable.
    Generates a simple cube via local computation.
    
    Args:
        prompt: Text description (logged for reference)
    
    Returns:
        URL path to the generated model file
    """
    try:
        logger.info(f"Using FALLBACK generation for: {prompt[:50]}...")
        import time
        start_time = time.time()
        
        os.makedirs(FRONTEND_MODELS_DIR, exist_ok=True)
        
        filename = f"model_{uuid.uuid4().hex[:8]}.glb"
        destination = os.path.join(FRONTEND_MODELS_DIR, filename)
        
        # Generate a simple sphere
        vertices = _create_simple_sphere()
        
        if _create_glb_from_vertices(vertices, destination):
            duration = time.time() - start_time
            logger.info(f"Fallback model created in {duration:.2f}s: {filename}")
            return f"/models/{filename}"
        else:
            logger.error("Failed to create fallback model")
            return ""
    
    except Exception as e:
        logger.error(f"Error in fallback generation: {e}", exc_info=True)
        return ""
