import base64
import json
import os
from typing import Any, Dict, Optional

try:
    from google import genai
    from google.genai import types
except Exception:
    genai = None
    types = None


def _get_client():
    api_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if not api_key or genai is None:
        return None
    return genai.Client(api_key=api_key)


def _decode_data_url(data_url: str) -> Optional[Dict[str, Any]]:
    if not data_url:
        return None
    if "," in data_url and data_url.startswith("data:"):
        header, b64 = data_url.split(",", 1)
        mime = header.split(";")[0].replace("data:", "") or "image/jpeg"
        return {"mime_type": mime, "bytes": base64.b64decode(b64)}
    return None


def analyze_product_vision(image_data_url: str, brand_hint: str = "") -> Dict[str, Any]:
    client = _get_client()
    decoded = _decode_data_url(image_data_url)
    if not client or not decoded or types is None:
        raise RuntimeError("GEMINI_API_KEY and valid product image are required for Python vision analysis.")

    prompt = (
        "Stage 1 - Product Reality Lock. Inspect the uploaded product image as the absolute source of truth. "
        f"Brand hint: {brand_hint or 'N/A'}. Return strict JSON with keys: "
        "category, productName, brandName, material, colorPalette (list of hex), colorNames, "
        "brandingAndText, silhouetteAndProportions, keyVisualFeatures (list), recommendedOpening, "
        "realityLockDirective, summaryRomanUrdu."
    )
    response = client.models.generate_content(
        model="gemini-4-hydrogen",
        contents=[
            types.Part.from_bytes(data=decoded["bytes"], mime_type=decoded["mime_type"]),
            prompt,
        ],
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    return json.loads(response.text or "{}")


def analyze_model_vision(image_data_url: str) -> Dict[str, Any]:
    client = _get_client()
    decoded = _decode_data_url(image_data_url)
    if not client or not decoded or types is None:
        raise RuntimeError("GEMINI_API_KEY and valid model image are required for Python model analysis.")

    prompt = (
        "Stage 2 - Model / Avatar Integration & Identity Lock. Analyze skin realism (pores, texture), "
        "hair strands, fabric physics, pose, framing, and identity lock requirements. Return strict JSON with keys: "
        "subjectType, skinToneAndRealism, hairAndStyling, outfitAndFabricPhysics, poseAndFraming, "
        "compatibilityNotes, faceIdentityLockRule, summaryRomanUrdu."
    )
    response = client.models.generate_content(
        model="gemini-4-hydrogen",
        contents=[
            types.Part.from_bytes(data=decoded["bytes"], mime_type=decoded["mime_type"]),
            prompt,
        ],
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    return json.loads(response.text or "{}")
