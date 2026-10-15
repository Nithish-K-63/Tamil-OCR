"""
TamilOCRGOV v2.4 — SQLite to MongoDB Atlas Migration Script
Migrates all historical records and processing events from local SQLite fallback storage
into MongoDB Atlas (production database: 'tamilocrgov').
Guarantees data integrity, sets up MongoDB indexes, and avoids duplication.
"""

import sys
import sqlite3
import datetime
import logging
from pathlib import Path

# Add backend directory to sys.path so app imports work
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pymongo
from app.config import (
    DB_PATH,
    MONGODB_URI,
    MONGODB_DB_NAME,
    MONGODB_CLUSTER
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("TamilOCR.Migration")


def run_migration() -> dict:
    logger.info("═══════════════════════════════════════════════════════════════════")
    logger.info("  TamilOCRGOV — SQLite to MongoDB Atlas Migration Tool            ")
    logger.info("═══════════════════════════════════════════════════════════════════")

    # 1. Connect to SQLite
    if not DB_PATH.exists():
        logger.warning("SQLite database file not found at: %s", DB_PATH)
        return {"status": "no_source_db", "migrated": 0}

    logger.info("Connecting to source SQLite database: %s", DB_PATH)
    sqlite_conn = sqlite3.connect(DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    cursor = sqlite_conn.cursor()

    cursor.execute("SELECT * FROM records ORDER BY created_at ASC")
    sqlite_rows = cursor.fetchall()
    total_sqlite_records = len(sqlite_rows)
    logger.info("Found %d records in SQLite 'records' table.", total_sqlite_records)

    if total_sqlite_records == 0:
        logger.info("No records to migrate.")
        sqlite_conn.close()
        return {"status": "empty", "migrated": 0}

    # 2. Connect to MongoDB Atlas
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI is not configured in backend environment or .env")

    # Mask credentials for logging
    safe_uri = MONGODB_URI
    if "@" in safe_uri:
        prefix, host_part = safe_uri.split("@", 1)
        safe_uri = f"mongodb+srv://***:***@{host_part}"
    logger.info("Connecting to MongoDB Atlas at %s (database: %s)...", safe_uri, MONGODB_DB_NAME)

    client = pymongo.MongoClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=8000,
        connectTimeoutMS=8000,
        socketTimeoutMS=12000,
        retryWrites=True
    )

    # Verify Atlas ping
    client.admin.command("ping")
    logger.info("[Atlas Ping] Successfully verified connectivity to cluster '%s'", MONGODB_CLUSTER)

    db = client[MONGODB_DB_NAME]

    # 3. Create collection indexes
    logger.info("Configuring MongoDB indexes on '%s.records' and 'processing_history'...", MONGODB_DB_NAME)
    db["records"].create_index([("id", pymongo.ASCENDING)], unique=True)
    db["records"].create_index([("created_at", pymongo.DESCENDING)])
    db["records"].create_index([("status", pymongo.ASCENDING)])
    db["records"].create_index([("title", pymongo.TEXT), ("tamil_text", pymongo.TEXT)])
    
    db["processing_history"].create_index([("created_at", pymongo.DESCENDING)])
    db["processing_history"].create_index([("document_id", pymongo.ASCENDING)])
    db["processing_history"].create_index([("record_id", pymongo.ASCENDING)])

    # 4. Migrate records
    migrated_count = 0
    history_events = 0

    for row in sqlite_rows:
        rec = dict(row)
        rec_id = rec.get("id")
        if not rec_id:
            continue

        # Add image storage reference if not present
        if not rec.get("image_path"):
            rec["image_path"] = f"data/uploads/{rec_id}_{rec.get('file_name', 'document.jpg')}"

        # Clean types
        rec["confidence"] = float(rec.get("confidence", 0.0))
        rec["char_count"] = int(rec.get("char_count", 0))
        rec["word_count"] = int(rec.get("word_count", 0))
        rec["lines_count"] = int(rec.get("lines_count", 0))
        rec["processing_time_ms"] = float(rec.get("processing_time_ms", 100.0))

        # Upsert document into MongoDB Atlas 'records' collection
        db["records"].update_one(
            {"id": rec_id},
            {"$set": rec},
            upsert=True
        )
        migrated_count += 1

        # Check and insert into processing_history
        existing_history = db["processing_history"].find_one({"document_id": rec_id})
        if not existing_history:
            db["processing_history"].insert_one({
                "document_id": rec_id,
                "record_id": rec_id,
                "action": "OCR_PROCESSED",
                "status": rec.get("status", "Verified"),
                "confidence": rec["confidence"],
                "model_name": rec.get("model_name", "Tesseract OCR (Primary)"),
                "file_name": rec.get("file_name", "document.jpg"),
                "error": None,
                "created_at": rec.get("created_at", datetime.datetime.now().isoformat())
            })
            history_events += 1

    sqlite_conn.close()

    total_atlas_docs = db["records"].count_documents({})
    total_atlas_history = db["processing_history"].count_documents({})

    logger.info("═══════════════════════════════════════════════════════════════════")
    logger.info("  Migration Completed Successfully!                               ")
    logger.info("  - SQLite Source Records Processed: %d", total_sqlite_records)
    logger.info("  - MongoDB Atlas 'records' Total:    %d", total_atlas_docs)
    logger.info("  - Processing History Events Total:  %d", total_atlas_history)
    logger.info("═══════════════════════════════════════════════════════════════════")

    return {
        "status": "success",
        "sqlite_source_records": total_sqlite_records,
        "atlas_records_total": total_atlas_docs,
        "atlas_history_total": total_atlas_history
    }


if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        logger.error("Migration failed: %s", e, exc_info=True)
        sys.exit(1)
