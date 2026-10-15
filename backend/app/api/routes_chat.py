import os
import uuid
import io
import logging
import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from PIL import Image
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field

from app.services.chat_service import (
    process_chat_message,
    get_chat_status
)
from app.services.preprocessing import ImagePreprocessor
from app.models.tesseract_engine import get_tesseract_engine
from app.models.ocr_engine import get_ocr_engine
from app.models.indic_ocr_engine import get_indic_ocr_engine
from app.config import DATA_DIR

logger = logging.getLogger("TamilOCR.ChatAPI")
router = APIRouter(prefix="/api/chat", tags=["AI Assistant"])



class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of message sender ('user' or 'assistant')")
    content: str = Field(..., description="Content of the message")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="User prompt or question")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Recent conversation turns")
    language: Optional[str] = Field(default="en", description="Preferred response language ('en' or 'ta')")


class ChatResponse(BaseModel):
    reply: str
    provider: str
    model: str
    timestamp: str


@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Submit a user question to the TamilOCR AI Assistant.
    Securely coordinates with Google Gemini (if configured) or the high-fidelity
    built-in TamilOCR Knowledge Engine.
    """
    try:
        # Convert history objects to standard dict list
        hist_dicts = [
            {"role": m.role, "content": m.content}
            for m in (request.history or [])
        ]
        result = await process_chat_message(
            message=request.message,
            history=hist_dicts,
            language=request.language or "en"
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat assistant processing error: {str(e)}"
        )


@router.get("/status")
async def chat_status_endpoint():
    """
    Returns AI Assistant status, active model provider, and system capabilities.
    """
    return get_chat_status()


@router.get("/suggestions")
async def chat_suggestions(language: Optional[str] = "en"):
    """
    Returns curated quick prompt suggestions for the user interface.
    """
    is_tamil = (language or "").lower() in ["ta", "tamil"]
    if is_tamil:
        return {
            "suggestions": [
                {
                    "title": "ஆவணப் பதிவேற்றம்",
                    "prompt": "கையெழுத்து பட்டா அல்லது சிட்டா ஆவணங்களை எவ்வாறு பதிவேற்றுவது?"
                },
                {
                    "title": "துல்லியம் & மாதிரி",
                    "prompt": "TamilCNN (T3.7) மாதிரியின் துல்லியம் மற்றும் சிறப்பம்சங்கள் என்ன?"
                },
                {
                    "title": "முடிவுகள் திருத்தம்",
                    "prompt": "அடையாளம் காணப்பட்ட தமிழ் உரையை எவ்வாறு ஆய்வு செய்து திருத்துவது?"
                },
                {
                    "title": "தரவு ஏற்றுமதி",
                    "prompt": "அரசு ஆவணங்களை CSV அல்லது JSON வடிவங்களில் எவ்வாறு பதிவிறக்குவது?"
                }
            ]
        }
    else:
        return {
            "suggestions": [
                {
                    "title": "Upload Guidance",
                    "prompt": "How do I upload and prepare a Tamil land record for recognition?"
                },
                {
                    "title": "Model Architecture",
                    "prompt": "What is the TamilCNN (T3.7) architecture and its validation accuracy?"
                },
                {
                    "title": "Inline Editing",
                    "prompt": "How do I use the virtual Tamil keyboard to review and edit recognized text?"
                },
                {
                    "title": "Export Records",
                    "prompt": "How can I export digitized records to TXT, JSON, and CSV formats?"
                }
            ]
        }


@router.post("/ocr")
async def chat_ocr_upload(
    file: UploadFile = File(...),
    model: Optional[str] = Form(None),
    language: Optional[str] = Form("en"),
    prompt: Optional[str] = Form(None)
):
    """
    Accept an uploaded Tamil document image directly inside the AI Chatbot,
    run real OCR recognition using the configured OCR engine (Tesseract or TamilCNN),
    and return genuine recognized Tamil Unicode text for immediate inline editing and copying.
    Never produces fake OCR results.
    """
    filename = file.filename or "uploaded_document.jpg"
    ext = os.path.splitext(filename)[1].lower()
    allowed_exts = ImagePreprocessor.ALLOWED_EXTENSIONS

    # 1. Validate File Format
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Please upload an image file ({', '.join(sorted(allowed_exts))})."
        )

    # 2. Read bytes and validate file size
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}"
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded image file is empty (0 bytes)."
        )

    if len(contents) > ImagePreprocessor.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 15 MB maximum limit."
        )

    # 3. Validate Image Decodability & Integrity (Reject corrupted or unreadable images)
    try:
        pil_img = Image.open(io.BytesIO(contents))
        pil_img.verify()
        # Re-open to read dimensions (verify() invalidates image pointer)
        pil_img = Image.open(io.BytesIO(contents))
        width, height = pil_img.size
        if width < 15 or height < 15:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image dimensions ({width}x{height}) are too small to contain readable Tamil script."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unreadable or corrupted image file. Please upload a clear document image."
        )

    # 4. Save image for reference and in-chat preview
    uploads_dir = DATA_DIR / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    doc_id = f"CHAT-{uuid.uuid4().hex[:6].upper()}"
    saved_filename = f"{doc_id}_{filename}"
    saved_file_path = uploads_dir / saved_filename
    try:
        with open(saved_file_path, "wb") as f_out:
            f_out.write(contents)
        image_url = f"/api/uploads/{saved_filename}"
    except Exception as e:
        logger.warning("Could not persist chat upload image: %s", e)
        image_url = None

    # 5. Select Configured OCR Engine
    chosen_model = (model or "tesseract_primary").lower()
    if "t3" in chosen_model or "cnn" in chosen_model:
        engine = get_ocr_engine()
    elif "indic" in chosen_model or "bodhan" in chosen_model:
        engine = get_indic_ocr_engine()
    else:
        # Default Primary Engine: Tesseract OCR (lang='tam')
        engine = get_tesseract_engine()

    # 6. Execute Genuine OCR Inference (Strictly never fake)
    try:
        ocr_result = engine.recognize_image(contents, filename=filename)
    except Exception as err:
        logger.error("OCR execution error for chat upload: %s", err, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR recognition engine failed: {str(err)}"
        )

    recognized_text = (ocr_result.get("text") or "").strip()
    confidence = float(ocr_result.get("confidence", 0.0))
    lines = ocr_result.get("lines", [])
    word_count = int(ocr_result.get("word_count", 0))
    char_count = int(ocr_result.get("char_count", 0))
    model_name = ocr_result.get("model_info", {}).get("name", chosen_model)
    inference_time_ms = float(ocr_result.get("inference_time_ms", 0.0))
    has_text = bool(recognized_text)

    # 7. Generate Helpful Bilingual Assistant Notes
    is_tamil = (language or "").lower() in ["ta", "tamil"]
    if has_text:
        if is_tamil:
            ai_note = (
                f"**ஆவணம் வெற்றிகரமாக செயலாக்கப்பட்டது!**\n"
                f"• மாதிரி: `{model_name}`\n"
                f"• அடையாளம் காணப்பட்ட எழுத்துக்கள்: **{char_count}** ({len(lines)} வரிகள், {word_count} சொற்கள்)\n"
                f"• மாதிரி துல்லிய மதிப்பீடு: **{confidence:.1f}%**\n\n"
                f"*கீழே உள்ள உரைப்பெட்டியில் தமிழ் உரையை நீங்கள் நேரடியாகத் திருத்தலாம் மற்றும் **Copy Text** பொத்தானைப் பயன்படுத்தி நகலெடுத்துக்கொள்ளலாம்.*"
            )
        else:
            ai_note = (
                f"**Document OCR recognition completed successfully!**\n"
                f"• Engine: `{model_name}`\n"
                f"• Extracted: **{char_count}** characters across **{len(lines)}** lines ({word_count} words)\n"
                f"• Confidence rating: **{confidence:.1f}%**\n\n"
                f"*The recognized Tamil text is displayed below in an editable area. You can make inline corrections and click **Copy Text** to copy it.*"
            )

        # If user passed a question or custom prompt, analyze the recognized text
        if prompt and prompt.strip():
            clean_prompt = prompt.strip()
            # Avoid re-analyzing default upload phrases
            if not any(def_phrase in clean_prompt.lower() for def_phrase in ["uploaded document", "தமிழ் ஆவண ocr", "ocr this"]):
                try:
                    augmented_prompt = (
                        f"Document OCR extracted Tamil text:\n"
                        f"\"\"\"\n{recognized_text[:1200]}\n\"\"\"\n\n"
                        f"User Question: {clean_prompt}"
                    )
                    chat_res = await process_chat_message(
                        message=augmented_prompt,
                        history=[],
                        language=language or "en"
                    )
                    reply_text = chat_res.get("reply") if isinstance(chat_res, dict) else getattr(chat_res, "reply", None)
                    if reply_text:
                        header = "### உதவிக்குறிப்பு & ஆவண விளக்கம்" if is_tamil else "### Document Interpretation & Notes"
                        ai_note += f"\n\n{header}\n{reply_text}"
                except Exception as p_err:
                    logger.warning("Optional prompt interpretation error: %s", p_err)
    else:
        if is_tamil:
            ai_note = (
                f"**எழுத்துக்கள் எதுவும் கண்டறியப்படவில்லை.**\n\n"
                f"கணினி பார்வை செயலாக்கம் நிறைவடைந்தது, ஆனால் இந்த ஆவணப் படத்தில் தெளிவான தமிழ் எழுத்துக்கள் எதுவும் அடையாளம் காணப்படவில்லை.\n"
                f"• ஆவணப் படம் மங்கலாகவோ, குறைந்த வெளிச்சத்திலோ அல்லது சாய்வாகவோ உள்ளதா என சரிபார்க்கவும்.\n"
                f"• குறைந்தது 300 DPI தெளிவுத்திறன் கொண்ட தெளிவான படத்தை பதிவேற்ற பரிந்துரைக்கிறோம்."
            )
        else:
            ai_note = (
                f"**No readable Tamil script detected.**\n\n"
                f"The image preprocessing and OCR scan completed, but no legible Tamil text could be extracted from this image.\n"
                f"• Please ensure the scan has adequate contrast, uniform lighting, and sharp focus.\n"
                f"• For best results, use a document resolution of at least 300 DPI without severe motion blur or shadows."
            )

    return {
        "success": True,
        "has_text": has_text,
        "tamil_text": recognized_text,
        "confidence": round(confidence, 1),
        "lines_count": len(lines),
        "word_count": word_count,
        "char_count": char_count,
        "model_name": model_name,
        "inference_time_ms": round(inference_time_ms, 1),
        "image_url": image_url,
        "file_name": filename,
        "ai_note": ai_note,
        "timestamp": datetime.datetime.now().isoformat()
    }

