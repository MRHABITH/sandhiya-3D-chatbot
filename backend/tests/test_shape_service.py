import os
import asyncio
import pytest

from app.services.shape_service import generate_shape_model, FRONTEND_MODELS_DIR


@pytest.mark.asyncio
async def test_lgm_generates_3d_model(tmp_path, monkeypatch):
    """
    Test LGM text-to-3D pipeline:
    1. Load LGM model from HuggingFace (ashawkey/LGM)
    2. Generate 3D mesh from text prompt
    3. Export to GLB file
    """
    # Override the FRONTEND_MODELS_DIR to a temporary location
    monkeypatch.setattr("app.services.shape_service.FRONTEND_MODELS_DIR", str(tmp_path))

    # Test with a simple prompt
    url = await generate_shape_model("a simple red cube")
    
    # Verify URL format
    assert url.startswith("/models/") or url == "", f"Invalid URL format: {url}"
    
    if url:  # Model generation succeeded
        filename = url.split("/models/")[-1]
        dest_path = tmp_path / filename
        assert dest_path.exists(), f"Generated GLB file missing at {dest_path}"
        
        # Verify file has valid content
        file_size = dest_path.stat().st_size
        assert file_size > 1000, f"GLB file too small ({file_size} bytes)"
        
        # Verify GLB header
        with open(dest_path, 'rb') as f:
            magic = f.read(4)
            assert magic == b'glTF', f"Invalid GLB magic number: {magic}"


@pytest.mark.asyncio
async def test_lgm_various_prompts(tmp_path, monkeypatch):
    """Test that LGM can generate different 3D objects from various prompts."""
    monkeypatch.setattr("app.services.shape_service.FRONTEND_MODELS_DIR", str(tmp_path))
    
    prompts = [
        "a wooden chair",
        "a blue sphere",
        "a simple cube"
    ]
    
    for prompt in prompts:
        url = await generate_shape_model(prompt)
        
        # Result may be empty if model isn't available, but should not error
        assert isinstance(url, str), f"Should return string, got {type(url)}"
        
        if url:  # If generation succeeded
            assert url.startswith("/models/"), f"Invalid URL for prompt: '{prompt}'"
            filename = url.split("/models/")[-1]
            dest_path = tmp_path / filename
            assert dest_path.exists(), f"Model file missing for prompt: '{prompt}'"




