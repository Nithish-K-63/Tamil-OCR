from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import logging

from app.database import get_records, get_record, delete_record

logger = logging.getLogger("TamilOCR.Routes.History")
router = APIRouter(tags=["History"])


class RecordUpdateRequest(BaseModel):
    tamil_text: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None


@router.get("/api/history")
async def list_recognition_history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: str = Query("", max_length=100)
):
    """Retrieve recognition history records from SQLite database."""
    records = get_records(limit=limit, offset=offset, search=search)
    return {
        "success": True,
        "count": len(records),
        "limit": limit,
        "offset": offset,
        "records": records
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


@router.delete("/api/history/{record_id}")
async def remove_record(record_id: str):
    """Delete a recognition record from SQLite database."""
    success = delete_record(record_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record '{record_id}' not found or already deleted."
        )
    return {"success": True, "message": f"Record '{record_id}' deleted successfully."}
