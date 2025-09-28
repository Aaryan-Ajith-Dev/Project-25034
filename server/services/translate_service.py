from typing import List, Optional
import os
import logging
from fastapi import HTTPException
from google.cloud import translate_v3 as translate

# Create a single Translation client (reused across requests)
try:
    client = translate.TranslationServiceClient()
except Exception as e:
    logging.error("Failed to initialize TranslationServiceClient: %s", e)
    client = None


def resolve_project_id() -> str:
    """Resolve Google Cloud project ID from environment or raise"""
    project_id = (
        os.environ.get("GOOGLE_CLOUD_PROJECT")
        or os.environ.get("GCP_PROJECT")
    )
    if not project_id:
        raise RuntimeError(
            "Project ID not found. Please set GOOGLE_CLOUD_PROJECT "
            "in Render Environment Variables."
        )
    return project_id


async def translate_texts(
    src: Optional[str], tgt: str, texts: List[str]
) -> List[str]:
    """
    Translate a list of texts using Google Cloud Translation v3 API.
    """
    if not tgt or not isinstance(texts, list):
        raise HTTPException(status_code=400, detail="Missing tgt or texts[]")

    if not texts:
        return []

    if client is None:
        raise HTTPException(
            status_code=500,
            detail="Translation client not initialized",
        )

    try:
        project_id = resolve_project_id()
        parent = f"projects/{project_id}/locations/global"

        request = translate.TranslateTextRequest(
            parent=parent,
            contents=texts,
            mime_type="text/plain",
            source_language_code=src or "en",
            target_language_code=tgt,
        )

        response = client.translate_text(request=request)
        return [t.translated_text for t in response.translations]

    except HTTPException:
        raise
    except Exception as err:
        logging.exception("Translation error: %s", err)
        raise HTTPException(status_code=500, detail="Translation failed")
