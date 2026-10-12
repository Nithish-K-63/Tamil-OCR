from fastapi import APIRouter
from app.models.t37_model import get_model_metadata
from app.database import get_db_health, test_temporary_atlas_crud

router = APIRouter(tags=["Health"])


@router.get("/health")
@router.get("/api/health")
async def health_check():
    """System health check, loaded OCR model status, and database status."""
    meta = get_model_metadata()
    db_health = get_db_health()
    return {
        "status": "online",
        "service": "TamilOCR Government Archive Digitization Engine",
        "version": "2.4.0",
        "model_loaded": meta.get("status") == "loaded",
        "model_name": meta.get("name"),
        "validation_accuracy": meta.get("val_acc", 97.2991),
        "device": meta.get("device", "cpu"),
        "database": db_health
    }


@router.get("/api/health/db")
async def database_health():
    """Detailed database connectivity diagnostic endpoint (no credentials exposed)."""
    return {
        "success": True,
        "database": get_db_health()
    }


@router.post("/api/health/db/test")
async def database_self_test():
    """Isolated test: insert, read, and remove temporary test document in MongoDB Atlas."""
    test_result = test_temporary_atlas_crud()
    return {
        "success": test_result.get("success", False),
        "result": test_result
    }
