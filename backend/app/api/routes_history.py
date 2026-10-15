from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import logging

from app.database import (
    get_records, 
    get_record, 
    update_record, 
    delete_record, 
    get_processing_history,
    delete_history_event
)

logger = logging.getLogger("TamilOCR.Routes.History")
router = APIRouter(tags=["History"])


class RecordUpdateRequest(BaseModel):
    tamil_text: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    department: Optional[str] = None
    district: Optional[str] = None
    year: Optional[str] = None


@router.get("/api/history")
async def list_recognition_history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: str = Query("", max_length=100),
    status: Optional[str] = Query(None)
):
    """Retrieve recognition history records from MongoDB Atlas database with optional search and status filtering."""
    records = get_records(limit=limit, offset=offset, search=search, status=status or "")
    return {
        "success": True,
        "count": len(records),
        "limit": limit,
        "offset": offset,
        "records": records
    }


@router.get("/api/processing-history")
async def list_processing_audit_history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Retrieve persistent OCR processing events and audit logs from MongoDB Atlas."""
    events = get_processing_history(limit=limit, offset=offset)
    return {
        "success": True,
        "count": len(events),
        "limit": limit,
        "offset": offset,
        "events": events
    }


@router.get("/api/history/{record_id}")
async def get_single_record(record_id: str):
    """Retrieve details of a single digitized archive record."""
    rec = get_record(record_id)
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record '{record_id}' not found."
        )
    return {"success": True, "record": rec}


@router.put("/api/history/{record_id}")
async def modify_record(record_id: str, body: RecordUpdateRequest):
    """Save permitted text corrections and metadata back to database without losing original OCR output."""
    updates = body.model_dump(exclude_unset=True)
    updated = update_record(record_id, updates)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record '{record_id}' not found."
        )
    return {"success": True, "message": "Record updated successfully.", "record": updated}


@router.delete("/api/history/{record_id}")
@router.delete("/api/records/{record_id}")
async def remove_record(record_id: str):
    """Delete a document record from MongoDB Atlas, clean history, and remove image file."""
    success = delete_record(record_id, delete_image=True)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record '{record_id}' not found or already deleted."
        )
    return {"success": True, "message": f"Record '{record_id}' and all associated history deleted successfully."}


@router.delete("/api/processing-history/{event_id}")
async def remove_history_event(
    event_id: str,
    delete_document: bool = Query(False, description="Also delete associated document record and image")
):
    """Delete an audit history entry from processing_history in MongoDB Atlas."""
    success = delete_history_event(event_id, delete_document=delete_document)
    if not success:
        # Fallback check if event_id matches a record_id
        success = delete_record(event_id, delete_image=delete_document)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"History entry '{event_id}' not found or already deleted."
        )
    return {
        "success": True, 
        "message": f"History entry '{event_id}' deleted successfully.",
        "document_deleted": delete_document
    }
