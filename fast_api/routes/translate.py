from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.translate_service import translate_texts

router = APIRouter()

class TranslateRequest(BaseModel):
    src: Optional[str] = "en"
    tgt: str
    texts: List[str]

class TranslateResponse(BaseModel):
    translations: List[str]

@router.post("/translate", response_model=TranslateResponse)
async def translate(request: TranslateRequest):
    """
    Translate texts using Google Cloud Translation API
    
    Args:
        request: TranslateRequest containing source language, target language, and texts
        
    Returns:
        TranslateResponse with translated texts
    """
    try:
        translations = await translate_texts(
            src=request.src,
            tgt=request.tgt,
            texts=request.texts
        )
        return TranslateResponse(translations=translations)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))