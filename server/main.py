# server/main.py
# Minimal FastAPI proxy for Google Cloud Translation v3
# Requires: pip install fastapi uvicorn[standard] google-cloud-translate google-auth
# Auth: set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON or configure ADC

from typing import List, Optional
import os
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import google.auth
from google.cloud import translate_v3

# Create FastAPI app
app = FastAPI()

# CORS: allow all origins/methods/headers for dev parity with Express example
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)
# [Reason: CORS middleware mirrors the Express cors() behavior and is the recommended way in FastAPI] [web:117]

# Create a single Translation client (reused across requests)
client = translate_v3.TranslationServiceClient()
# [Reason: translate_v3.TranslationServiceClient is the v3 client used to call translate_text] [web:126]

def resolve_project_id() -> str:
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
# [Reason: google.auth.default can return project ID from ADC; env vars are common fallbacks] [web:134][web:12][web:9]

class TranslateIn(BaseModel):
    src: Optional[str] = "en"
    tgt: str
    texts: List[str]

class TranslateOut(BaseModel):
    translations: List[str]

@app.post("/api/translate", response_model=TranslateOut)
async def translate(inb: TranslateIn):
    try:
        if not inb.tgt or not isinstance(inb.texts, list):
            raise HTTPException(status_code=400, detail="Missing tgt or texts[]")

        project_id = resolve_project_id()
        parent = f"projects/{project_id}/locations/global"  # standard location for basic translations

        # Construct v3 translate_text request
        request = {
            "parent": parent,
            "contents": inb.texts,
            "mime_type": "text/plain",
            "source_language_code": inb.src or "en",
            "target_language_code": inb.tgt,
        }

        # Execute request; order of translations matches input contents
        resp = client.translate_text(request=request)
        translations = [t.translated_text for t in resp.translations]

        return TranslateOut(translations=translations)
    except HTTPException:
        raise
    except Exception as err:
        logging.exception("translate error: %s", err)
        raise HTTPException(status_code=500, detail="Translation failed")
# [Reason: The v3 translate_text API accepts contents[], returns translations in order, and uses global location] [web:126][web:2]

# Optional: entrypoint for local runs via `python server/main.py`
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
# [Reason: Uvicorn is the standard ASGI server to run FastAPI, matching Express port 8000] [web:117]
