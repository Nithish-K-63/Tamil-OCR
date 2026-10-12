import json
import uuid
import os
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
import logging

from app.models.ocr_engine import get_ocr_engine
from app.models.t37_model import get_model_metadata
from app.database import add_record
from app.services.preprocessing import ImagePreprocessor

logger = logging.getLogger("TamilOCR.Routes.OCR")
router = APIRouter(tags=["OCR"])


@router.get("/api/model-info")
async def get_model_info():
    """Return model architecture, parameters, training epoch, and benchmark validation accuracy."""
    metadata = get_model_metadata()
    return {
        "model_name": metadata.get("name", "TamilCNN"),
        "model_type": "Deep Convolutional Neural Network (4 ConvBlocks + 2 Dense Layers)",
        "supported_language": "Tamil (தமிழ்)",
        "classes_count": metadata.get("classes", 156),
        "parameters": metadata.get("parameters", 2566012),
        "checkpoint_file": metadata.get("checkpoint", "tamil_best.pth"),
        "benchmark_accuracy": {
            "top1_validation_accuracy": metadata.get("val_acc", 97.2991),
            "top5_validation_accuracy": 99.77,
            "macro_f1": 95.96,
            "target_threshold": 90.0,
            "status": "Target Exceeded (>90%)"
        },
        "device": metadata.get("device", "cpu"),
        "status": metadata.get("status", "loaded")
    }


@router.post("/api/ocr")
@router.post("/api/v1/ocr/predict")
async def recognize_single_document(
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    year: Optional[str] = Form(None),
    district: Optional[str] = Form(None)
):
    """
    Accept an uploaded handwritten Tamil document image and perform full OCR inference.
    Saves record to SQLite database and returns recognized Tamil text and metrics.
    """
    # Validate extension
    filename = file.filename or "document.jpg"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ImagePreprocessor.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ImagePreprocessor.ALLOWED_EXTENSIONS)}"
        )

    # Read bytes and validate size
    contents = await file.read()
    if len(contents) > ImagePreprocessor.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size limit of 15 MB."
        )

    # Parse metadata if passed as JSON string
    meta_dict = {}
    if metadata:
        try:
            meta_dict = json.loads(metadata)
        except Exception:
            meta_dict = {"raw_metadata": metadata}

    doc_title = title or meta_dict.get("title") or meta_dict.get("tamilTitle") or "நிலப் பதிவு ஆவணம் - 1978"
    dept = department or meta_dict.get("department") or "Revenue Department"
    doc_year = str(year or meta_dict.get("year") or meta_dict.get("docYear") or "1978")
    dist = district or meta_dict.get("district") or "Thanjavur"

    # Execute genuine model inference
    try:
        engine = get_ocr_engine()
        result = engine.recognize_image(contents)
    except Exception as e:
        logger.error("OCR inference failure: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image processing failed: {str(e)}"
        )

    # Generate document ID and persist to database
    record_id = f"TNOCR-{uuid.uuid4().hex[:4].upper()}"
    status_label = "Verified" if result["confidence"] >= 90.0 else "Needs Review"

    add_record({
        "id": record_id,
        "title": doc_title,
        "department": dept,
        "year": doc_year,
        "district": dist,
        "category": "Land & Revenue Archive",
        "tamil_text": result["text"],
        "confidence": result["confidence"],
        "lines_count": len(result["lines"]),
        "word_count": result["word_count"],
        "char_count": result["char_count"],
        "file_name": filename,
        "model_name": result["model_info"]["name"],
        "processing_time_ms": result["inference_time_ms"],
        "status": status_label
    })

    return {
        "success": True,
        "isDemo": False,
        "recordId": record_id,
        "jobId": f"JOB-{record_id}",
        "fileName": filename,
        "tamilText": result["text"],
        "confidenceScore": result["confidence"],
        "linesCount": len(result["lines"]),
        "wordsCount": result["word_count"],
        "charCount": result["char_count"],
        "inferenceTimeMs": result["inference_time_ms"],
        "lines": result["lines"],
        "boundingBoxes": result["bounding_boxes"][:150],  # cap to top 150 for JSON efficiency
        "preprocessing": result["preprocessing_meta"],
        "metadata": {
            "title": doc_title,
            "department": dept,
            "year": doc_year,
            "district": dist,
            "modelUsed": result["model_info"]["name"],
            "validationAccuracy": result["model_info"].get("val_acc", 97.3)
        }
    }


@router.post("/api/ocr/batch")
async def recognize_batch_documents(files: List[UploadFile] = File(...)):
    """Batch process multiple handwritten Tamil document images (up to 20 images)."""
    if len(files) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch limit is 20 images per request."
        )

    engine = get_ocr_engine()
    results = []

    for file in files:
        filename = file.filename or "batch_item.jpg"
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ImagePreprocessor.ALLOWED_EXTENSIONS:
            results.append({
                "fileName": filename,
                "success": False,
                "error": f"Invalid extension {ext}"
            })
            continue

        contents = await file.read()
        try:
            res = engine.recognize_image(contents)
            record_id = f"TNOCR-{uuid.uuid4().hex[:4].upper()}"
            add_record({
                "id": record_id,
                "title": f"Batch Manuscript {filename}",
                "department": "General Archives",
                "year": "1980",
                "district": "State Archives",
                "category": "Historical Record",
                "tamil_text": res["text"],
                "confidence": res["confidence"],
                "lines_count": len(res["lines"]),
                "word_count": res["word_count"],
                "char_count": res["char_count"],
                "file_name": filename,
                "model_name": res["model_info"]["name"],
                "processing_time_ms": res["inference_time_ms"],
                "status": "Verified" if res["confidence"] >= 90 else "Needs Review"
            })
            results.append({
                "recordId": record_id,
                "fileName": filename,
                "success": True,
                "tamilText": res["text"],
                "confidenceScore": res["confidence"],
                "wordsCount": res["word_count"],
                "inferenceTimeMs": res["inference_time_ms"]
            })
        except Exception as e:
            results.append({
                "fileName": filename,
                "success": False,
                "error": str(e)
            })

    return {
        "success": True,
        "processed_count": len(results),
        "results": results
    }
