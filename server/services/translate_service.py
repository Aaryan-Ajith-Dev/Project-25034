from typing import List, Optional
import os
import logging
from fastapi import HTTPException
import google.auth
from google.cloud import translate_v3

# Create a single Translation client (reused across requests)
client = translate_v3.TranslationServiceClient()

def resolve_project_id() -> str:
    """Resolve Google Cloud project ID from environment or ADC"""
    # Prefer explicit env (works everywhere)
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("GCP_PROJECT")
    if project_id:
        return project_id
    # Fallback to ADC discovery (may return None if not configured)
    try:
        _, discovered = google.auth.default()
        if discovered:
            return discovered
    except Exception:
        pass
    # If still unknown, ask the operator to set env or configure ADC
    raise RuntimeError(
        "Project ID not found. Set GOOGLE_CLOUD_PROJECT or configure ADC (gcloud auth application-default login) and active project."
    )

async def translate_texts(src: Optional[str], tgt: str, texts: List[str]) -> List[str]:
    """
    Translate a list of texts using Google Cloud Translation v3 API
    
    Args:
        src: Source language code (optional, defaults to "en")
        tgt: Target language code (required)
        texts: List of texts to translate
        
    Returns:
        List of translated texts
        
    Raises:
        HTTPException: If translation fails or invalid parameters
    """
    try:
        if not tgt or not isinstance(texts, list):
            raise HTTPException(status_code=400, detail="Missing tgt or texts[]")

        if not texts:
            return []

        project_id = resolve_project_id()
        parent = f"projects/{project_id}/locations/global"  # standard location for basic translations

        # Construct v3 translate_text request
        request = {
            "parent": parent,
            "contents": texts,
            "mime_type": "text/plain",
            "source_language_code": src or "en",
            "target_language_code": tgt,
        }

        # Execute request; order of translations matches input contents
        resp = client.translate_text(request=request)
        translations = [t.translated_text for t in resp.translations]

        return translations
    except HTTPException:
        raise
    except Exception as err:
        logging.exception("translate error: %s", err)
        raise HTTPException(status_code=500, detail="Translation failed")