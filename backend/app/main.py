import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import CORS_ORIGINS, HOST, PORT
from app.database import init_db, close_db_connection
from app.models.t37_model import load_tamil_model
from app.api.routes_health import router as health_router
from app.api.routes_ocr import router as ocr_router
from app.api.routes_history import router as history_router
from app.api.routes_dashboard import router as dashboard_router
from app.api.routes_chat import router as chat_router

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("TamilOCR.API")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle handler."""
    logger.info("Initializing database subsystems (MongoDB Atlas + SQLite)...")
    init_db()

    logger.info("Pre-warming Tamil OCR Deep CNN Model...")
    try:
        load_tamil_model()
        logger.info("Model warmed up and ready for requests.")
    except Exception as e:
        logger.error("Error during model pre-warm: %s", e)

    yield

    logger.info("Shutting down TamilOCR API and closing database connections...")
    close_db_connection()


app = FastAPI(
    title="TamilOCR — Handwritten Script Recognition API",
    description="Computer Vision-Based Handwritten Tamil Script Recognition System for Digitizing Legacy Government Records",
    version="2.4.0",
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health_router)
app.include_router(ocr_router)
app.include_router(history_router)
app.include_router(dashboard_router)
app.include_router(chat_router)


# Mount dedicated document uploads storage
from fastapi.staticfiles import StaticFiles
from app.config import DATA_DIR
uploads_path = DATA_DIR / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


@app.get("/")
async def root():
    return {
        "title": "TamilOCR Government Script Recognition System",
        "description": "Digitization of Legacy Tamil Nadu Government Records",
        "version": "2.4.0",
        "endpoints": {
            "health": "/api/health",
            "model_info": "/api/model-info",
            "ocr_predict": "/api/ocr",
            "ocr_batch": "/api/ocr/batch",
            "history": "/api/history",
            "dashboard_stats": "/api/dashboard/stats"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False)
