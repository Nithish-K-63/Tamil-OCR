from fastapi import APIRouter
import logging
from app.database import get_dashboard_stats
from app.models.t37_model import get_model_metadata

logger = logging.getLogger("TamilOCR.Routes.Dashboard")
router = APIRouter(tags=["Dashboard"])


@router.get("/api/dashboard/stats")
async def dashboard_statistics():
    """Aggregate statistics for Tamil Nadu Archives Digitization Portal."""
    stats = get_dashboard_stats()
    meta = get_model_metadata()
    return {
        "success": True,
        **stats,
        "active_model": meta.get("name", "TamilCNN"),
        "model_validation_accuracy": meta.get("val_acc", 97.2991),
        "target_accuracy": 90.0,
        "engine_version": "2.4.0"
    }
