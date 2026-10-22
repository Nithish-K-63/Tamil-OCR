"""
TamilOCRGOV v2.4 — Centralized Database Integration Layer
Supports MongoDB Atlas (Production Cloud Storage) with resilient SQLite fallback.
"""

import sqlite3
import datetime
import time
import logging
import hashlib
import hmac
import secrets
from typing import List, Dict, Any, Optional


import pymongo
from pymongo.errors import (
    OperationFailure,
    ServerSelectionTimeoutError,
    ConfigurationError,
    PyMongoError
)

from pathlib import Path
from app.config import (
    DB_PATH,
    DATA_DIR,
    MONGODB_URI,
    MONGODB_DB_NAME,
    MONGODB_CLUSTER,
    MONGODB_USER
)

logger = logging.getLogger("TamilOCR.Database")

DEFAULT_ADMIN_USER = {
    "id": "USR-TNGOV-001",
    "email": "admin@tamilocr.gov.in",
    "full_name": "Arun Kumar",
    "role": "Project Administrator",
    "department": "Tamil Nadu Heritage Records Division",
    "badge_id": "TN-ARCH-2025",
    "password": "TamilOCR@2026"
}

# Singleton Mongo client & database handles
_mongo_client: Optional[pymongo.MongoClient] = None
_mongo_db = None
_db_status = {
    "atlas_connected": False,
    "engine": "SQLite (Fallback)",
    "target_cluster": MONGODB_CLUSTER,
    "database_name": MONGODB_DB_NAME,
    "error_category": None,
    "diagnostic_message": "Not initialized yet.",
    "last_checked": None
}

SEED_RECORDS = [
    {
        "id": "TNOCR-0248",
        "title": "நிலப் பதிவு ஆவணம்",
        "department": "Revenue Department",
        "year": "1978",
        "district": "Thanjavur",
        "category": "Land Record",
        "status": "Verified",
        "confidence": 97.68,
        "char_count": 580,
        "word_count": 78,
        "lines_count": 14,
        "tamil_text": """தமிழ்நாடு அரசு — வருவாய்த்துறை
வருவாய் மற்றும் பேரிடர் மேலாண்மைத் துறை

நிலப் பதிவு ஆவணம் - 1978

பதிவு எண்: 452 / 1978
நாள்: 12 செப்டம்பர் 1978
மாவட்டம்: தஞ்சாவூர்
வட்டம் / தாலுகா: கும்பகோணம்
கிராமம்: சுந்தரபெருமாள் கோவில்
நில வகைப்பாடு: நன்செய் விவசாய நிலம்
சர்வே எண்: 108 / 3
பரப்பளவு: 2 ஏக்கர் 43 சென்ட்
பட்டா எண்: TR-78/914
தீர்வை: ரூ. 28.50

இவ்வாவணத்தின்படி, தஞ்சாவூர் மாவட்டம், கும்பகோணம் வட்டம், சுந்தரபெருமாள் கோவில் கிராமத்தில் அமைந்துள்ள மேற்கண்ட விபரமுடைய நன்செய் விவசாய நிலத்தின் உரிமை திரு. சுப்பிரமணியன் த/பெ. இராமசாமி என்பவருக்கு உறுதி செய்யப்பட்டு, தமிழ்நாடு நில வருவாய் சட்ட விதிகளின்படி புதிய பட்டா பதிவு செய்யப்படுகிறது.

வட்டாட்சியர் / துணைப் பதிவாளர்
கும்பகோணம், தஞ்சாவூர் மாவட்டம்""",
        "file_name": "land_record_1978.jpg",
        "image_path": "data/uploads/land_record_1978.jpg",
        "model_name": "Tesseract OCR (Primary Model - lang='tam')",
        "processing_time_ms": 138.5,
        "created_at": datetime.datetime.now().isoformat()
    },
    {
        "id": "TNOCR-0244",
        "title": "கோவில் மானியப் பட்டா",
        "department": "Endowments",
        "year": "1959",
        "district": "Thanjavur",
        "category": "Deed",
        "status": "Verified",
        "confidence": 96.90,
        "char_count": 520,
        "word_count": 68,
        "lines_count": 13,
        "tamil_text": """திருவாவடுதுறை ஆதீனம் — அருள்மிகு பிரகதீஸ்வரர் திருக்கோவில்
கோவில் மான்ய தான சாசனம் - 1959

ஆவண எண்: 142 / 1959
நாள்: அக்டோபர் 12, 1959 (தை 15)
மாவட்டம்: தஞ்சாவூர்
ஊர்: திருநாகேஸ்வரம்
தானம் வழங்கியவர்: விஸ்வநாத அய்யர் த/பெ. சோமசுந்தரம் அய்யர்
உரிமைப் பயன்: திருக்கோவில் நித்திய பூஜை கட்டளை
நில உரிமை: ஐந்து மா நன்செய்

இதன் மூலம் திருவாவடுதுறை ஆதீனம் அருள்மிகு பிரகதீஸ்வரர் திருக்கோவிலுக்கு தஞ்சாவூர் மாவட்டம், திருநாகேஸ்வரம் கிராமத்தில் அமைந்துள்ள ஐந்து மா நன்செய் விவசாய நிலம், சிவசுந்தரம் பிள்ளை அவர்களின் நற்பணி அறக்கட்டளை சார்பாக திரு. விஸ்வநாத அய்யர் அவர்களால் மனமுவந்து தானமாக வழங்கப்படுகிறது.

District Collector & District Magistrate
Thanjavur District""",
        "file_name": "temple_grant_1959.jpg",
        "image_path": "data/uploads/temple_grant_1959.jpg",
        "model_name": "Tesseract OCR (Primary Model - lang='tam')",
        "processing_time_ms": 125.0,
        "created_at": (datetime.datetime.now() - datetime.timedelta(days=7)).isoformat()
    },
    {
        "id": "TNOCR-0247",
        "title": "பிறப்புச் சான்றிதழ்",
        "department": "Municipal Department",
        "year": "1984",
        "district": "Madurai",
        "category": "Certificate",
        "status": "Verified",
        "confidence": 97.26,
        "char_count": 340,
        "word_count": 48,
        "lines_count": 10,
        "tamil_text": """மதுரை மாநகராட்சி — MADURAI MUNICIPAL CORPORATION
பிறப்பு பதிவு ஆவணம் — படிவம் எண். 5

பதிவு எண்: 1984 / MAD / 0491
பதிவு நாள்: 1984 ஆவணி 12 (18.06.1984)
குழந்தையின் பெயர்: மருதுபாண்டி
பாலினம்: ஆண்
பிறந்த தேதி: 04.06.1984
பிறந்த இடம்: மாநகராட்சி மகப்பேறு மருத்துவமனை, மதுரை
தந்தை பெயர்: சொக்கலிங்கம்
தாய் பெயர்: மீனாட்சி அம்மாள்
வசிப்பிடம்: 14, வடக்கு மாசி வீதி, மதுரை

கடைசிப் பதிவாளர் (ஆவணக் காப்பாளர்)
மதுரை மாநகராட்சி""",
        "file_name": "birth_cert_1984.png",
        "image_path": "data/uploads/birth_cert_1984.png",
        "model_name": "Tesseract OCR (Primary Model - lang='tam')",
        "processing_time_ms": 112.0,
        "created_at": (datetime.datetime.now() - datetime.timedelta(days=2)).isoformat()
    },
    {
        "id": "TNOCR-0246",
        "title": "வரி மதிப்பீட்டுப் பதிவு",
        "department": "Revenue Department",
        "year": "1966",
        "district": "Tiruchirappalli",
        "category": "Tax Record",
        "status": "Verified",
        "confidence": 97.15,
        "char_count": 420,
        "word_count": 58,
        "lines_count": 11,
        "tamil_text": """தமிழ்நாடு அரசு — வருவாய்த்துறை
திருச்சிராப்பள்ளி மாவட்ட வருவாய் தீர்வாயப் பதிவு

வருட கணக்கு: 1966
செலுத்தப்பட்ட நாள்: 1966 கார்த்திகை 20 (14-10-1966)
மாவட்டம்: திருச்சிராப்பள்ளி
தாலுகா: திருச்சிராப்பள்ளி
கிராமம் / கதவு: 2/45, உறையூர்
நில உரிமையாளர்: நடராஜ பிள்ளை த/பெ. முத்துசாமி
வரிசை எண்: 28
நில வகை: விவசாய நன்செய்
பரப்பு: 0.75 ஏக்கர்
வரித் தொகை: ரூ. 42 அணா 6 (செலுத்தப்பட்டது)

வட்டாட்சியர் / கலெக்டர் ஒப்புதல்
திருச்சிராப்பள்ளி மாவட்டம்""",
        "file_name": "tax_assessment_1966.jpg",
        "image_path": "data/uploads/tax_assessment_1966.jpg",
        "model_name": "Tesseract OCR (Primary Model - lang='tam')",
        "processing_time_ms": 135.2,
        "created_at": (datetime.datetime.now() - datetime.timedelta(days=3)).isoformat()
    },
    {
        "id": "TNOCR-0245",
        "title": "நீர்ப்பாசன நில அளவை",
        "department": "Public Works",
        "year": "1972",
        "district": "Thanjavur",
        "category": "Land Record",
        "status": "Verified",
        "confidence": 97.40,
        "char_count": 450,
        "word_count": 62,
        "lines_count": 12,
        "tamil_text": """தமிழ்நாடு அரசு — பொதுப்பணித் துறை
காவிரி டெல்டா பாசன நில அளவைப் பதிவு — 1972

ஆண்டு: 1972
ஆவணம் எண்: 142 / 1972
நாள்: 24 மே 1972
பாசனக் கால்வாய்: வெண்ணாறு கிளைக் கால்வாய்
மாவட்டம் / வட்டம்: தஞ்சாவூர் மாவட்டம், நாகப்பட்டினம் வட்டம்
கிராமம்: வடக்குப் பூதனூர்
ஆயக்கட்டு பரப்பு: 12 ஏக்கர்
புல எண்: 78, 79, 81
பாசன வகை: நேரடி கால்வாய் பாசனம்

உதவிப் பொறியாளர் — நில அளவை
P.W.D., Vennaru Division, Thanjavur""",
        "file_name": "irrigation_record_1972.png",
        "image_path": "data/uploads/irrigation_record_1972.png",
        "model_name": "Tesseract OCR (Primary Model - lang='tam')",
        "processing_time_ms": 142.1,
        "created_at": (datetime.datetime.now() - datetime.timedelta(days=4)).isoformat()
    }
]


# ============================================================================
# SQLite Local Helper Functions
# ============================================================================

def get_sqlite_connection():
    """Create local SQLite connection for fallback & backup synchronization."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_sqlite():
    """Ensure SQLite schema exists and has seed data."""
    conn = get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        year TEXT NOT NULL,
        district TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        confidence REAL NOT NULL,
        char_count INTEGER NOT NULL,
        word_count INTEGER NOT NULL,
        lines_count INTEGER NOT NULL,
        tamil_text TEXT NOT NULL,
        file_name TEXT NOT NULL,
        model_name TEXT NOT NULL,
        processing_time_ms REAL NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Archive Specialist',
        department TEXT NOT NULL DEFAULT 'Tamil Nadu Heritage Records Division',
        badge_id TEXT,
        reset_token TEXT,
        reset_token_expiry TEXT,
        created_at TEXT NOT NULL,
        last_login TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM records")
    count = cursor.fetchone()[0]
    if count == 0:
        for r in SEED_RECORDS:
            cursor.execute("""
            INSERT OR IGNORE INTO records (
                id, title, department, year, district, category, status,
                confidence, char_count, word_count, lines_count,
                tamil_text, file_name, model_name, processing_time_ms, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                r["id"], r["title"], r["department"], r["year"], r["district"],
                r["category"], r["status"], r["confidence"], r["char_count"],
                r["word_count"], r["lines_count"], r["tamil_text"], r["file_name"],
                r["model_name"], r["processing_time_ms"], r["created_at"]
            ))
        conn.commit()

    # Seed default admin user in SQLite if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    if user_count == 0:
        admin_hash = hash_password(DEFAULT_ADMIN_USER["password"])
        cursor.execute("""
        INSERT INTO users (
            id, email, full_name, password_hash, role, department, badge_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            DEFAULT_ADMIN_USER["id"],
            DEFAULT_ADMIN_USER["email"].lower(),
            DEFAULT_ADMIN_USER["full_name"],
            admin_hash,
            DEFAULT_ADMIN_USER["role"],
            DEFAULT_ADMIN_USER["department"],
            DEFAULT_ADMIN_USER["badge_id"],
            datetime.datetime.now().isoformat()
        ))
        conn.commit()
    conn.close()


# ============================================================================
# MongoDB Atlas Connection Management
# ============================================================================

def connect_mongo_atlas() -> bool:
    """
    Connect to MongoDB Atlas using connection pooling and ping verification.
    Updates _db_status with detailed, sanitized diagnostics.
    """
    global _mongo_client, _mongo_db, _db_status

    _db_status["last_checked"] = datetime.datetime.now().isoformat()

    if not MONGODB_URI:
        _db_status["atlas_connected"] = False
        _db_status["engine"] = "SQLite (Fallback)"
        _db_status["error_category"] = "MissingConfiguration"
        _db_status["diagnostic_message"] = "MONGODB_URI is not set in environment or .env."
        logger.warning("[MongoDB Atlas] MONGODB_URI not set. Using SQLite storage.")
        return False

    client = None
    try:
        logger.info(f"[MongoDB Atlas] Attempting connection to cluster '{MONGODB_CLUSTER}' (database: '{MONGODB_DB_NAME}')...")
        client = pymongo.MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=4000,
            connectTimeoutMS=4000,
            socketTimeoutMS=8000,
            maxPoolSize=50,
            minPoolSize=0,
            retryWrites=True
        )

        # Test connection with ping command
        client.admin.command("ping")

        # Select target database
        db = client[MONGODB_DB_NAME]

        # Ensure collections & indexes
        db["records"].create_index([("id", pymongo.ASCENDING)], unique=True)
        db["records"].create_index([("created_at", pymongo.DESCENDING)])
        db["records"].create_index([("status", pymongo.ASCENDING)])
        db["records"].create_index([("title", pymongo.TEXT), ("tamil_text", pymongo.TEXT)])
        db["processing_history"].create_index([("created_at", pymongo.DESCENDING)])
        db["processing_history"].create_index([("record_id", pymongo.ASCENDING)])

        # Ensure user & session collections & indexes
        db["users"].create_index([("email", pymongo.ASCENDING)], unique=True)
        db["users"].create_index([("id", pymongo.ASCENDING)], unique=True)
        db["sessions"].create_index([("token", pymongo.ASCENDING)], unique=True)
        db["sessions"].create_index([("expires_at", pymongo.ASCENDING)])

        # Seed records if Atlas collection is empty
        if db["records"].count_documents({}) == 0:
            logger.info("[MongoDB Atlas] Seeding initial demonstration records into 'records' collection...")
            db["records"].insert_many([dict(r) for r in SEED_RECORDS])

        # Seed default admin user in Atlas if users collection is empty
        if db["users"].count_documents({}) == 0:
            logger.info("[MongoDB Atlas] Seeding initial administrator account into 'users' collection...")
            admin_doc = {
                "id": DEFAULT_ADMIN_USER["id"],
                "email": DEFAULT_ADMIN_USER["email"].lower(),
                "full_name": DEFAULT_ADMIN_USER["full_name"],
                "password_hash": hash_password(DEFAULT_ADMIN_USER["password"]),
                "role": DEFAULT_ADMIN_USER["role"],
                "department": DEFAULT_ADMIN_USER["department"],
                "badge_id": DEFAULT_ADMIN_USER["badge_id"],
                "reset_token": None,
                "reset_token_expiry": None,
                "created_at": datetime.datetime.now().isoformat(),
                "last_login": None
            }
            db["users"].insert_one(admin_doc)

        _mongo_client = client
        _mongo_db = db
        _db_status["atlas_connected"] = True
        _db_status["engine"] = "MongoDB Atlas"
        _db_status["error_category"] = None
        _db_status["diagnostic_message"] = f"Successfully connected to MongoDB Atlas cluster {MONGODB_CLUSTER}."
        logger.info(f"[MongoDB Atlas] CONNECTED: Database '{MONGODB_DB_NAME}' active with connection pooling.")
        return True

    except OperationFailure as e:
        if client is not None:
            try:
                client.close()
            except Exception:
                pass
        _mongo_client = None
        _mongo_db = None
        _db_status["atlas_connected"] = False
        _db_status["engine"] = "SQLite (Fallback)"
        if e.code in (18, 8000):
            _db_status["error_category"] = "AuthenticationFailure"
            _db_status["diagnostic_message"] = f"Atlas authentication failed (code {e.code}). The provided username or password was rejected by the cluster."
        else:
            _db_status["error_category"] = f"OperationFailure_Code_{e.code}"
            _db_status["diagnostic_message"] = f"MongoDB operation rejected by cluster (code {e.code})."
        logger.warning(f"[MongoDB Atlas] Connection failed: {_db_status['diagnostic_message']} Active storage is SQLite fallback.")
        return False

    except ServerSelectionTimeoutError:
        if client is not None:
            try:
                client.close()
            except Exception:
                pass
        _mongo_client = None
        _mongo_db = None
        _db_status["atlas_connected"] = False
        _db_status["engine"] = "SQLite (Fallback)"
        _db_status["error_category"] = "NetworkOrIPWhitelistRestriction"
        _db_status["diagnostic_message"] = "Server selection timeout. Atlas cluster did not respond. Check Network Access / IP Whitelist in Atlas."
        logger.warning(f"[MongoDB Atlas] {_db_status['diagnostic_message']} Active storage is SQLite fallback.")
        return False

    except ConfigurationError as e:
        if client is not None:
            try:
                client.close()
            except Exception:
                pass
        _mongo_client = None
        _mongo_db = None
        _db_status["atlas_connected"] = False
        _db_status["engine"] = "SQLite (Fallback)"
        _db_status["error_category"] = "ConfigurationOrDNSError"
        _db_status["diagnostic_message"] = f"MongoDB configuration or DNS resolution error: {str(e)}"
        logger.warning(f"[MongoDB Atlas] {_db_status['diagnostic_message']} Active storage is SQLite fallback.")
        return False

    except Exception as e:
        if client is not None:
            try:
                client.close()
            except Exception:
                pass
        _mongo_client = None
        _mongo_db = None
        _db_status["atlas_connected"] = False
        _db_status["engine"] = "SQLite (Fallback)"
        _db_status["error_category"] = type(e).__name__
        _db_status["diagnostic_message"] = f"Unexpected database error: {type(e).__name__}"
        logger.warning(f"[MongoDB Atlas] Connection error ({type(e).__name__}). Active storage is SQLite fallback.")
        return False


def init_db():
    """
    Initialize database systems:
    1. Always ensures SQLite fallback is initialized and ready.
    2. Attempts connection to MongoDB Atlas.
    """
    logger.info("[Database] Initializing database subsystems...")
    _init_sqlite()
    connect_mongo_atlas()


def close_db_connection():
    """Graceful shutdown of MongoDB Atlas client pool."""
    global _mongo_client, _mongo_db
    if _mongo_client:
        try:
            logger.info("[Database] Closing MongoDB Atlas connection pool.")
            _mongo_client.close()
        except Exception as e:
            logger.warning(f"[Database] Error closing MongoDB client: {e}")
        _mongo_client = None
        _mongo_db = None


def get_db_health() -> Dict[str, Any]:
    """Get sanitized database connectivity status."""
    return {
        "status": "connected" if _db_status["atlas_connected"] else "fallback_active",
        "active_engine": _db_status["engine"],
        "target_cluster": _db_status["target_cluster"],
        "database_name": _db_status["database_name"],
        "atlas_connected": _db_status["atlas_connected"],
        "error_category": _db_status["error_category"],
        "diagnostic_message": _db_status["diagnostic_message"],
        "last_checked": _db_status["last_checked"]
    }


# ============================================================================
# Centralized CRUD & Business Operations
# ============================================================================

def add_record(record_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Persist new recognized Tamil document metadata and OCR result.
    Saves to MongoDB Atlas as the primary persistent storage layer.
    """
    now_iso = datetime.datetime.now().isoformat()
    record = {
        "id": record_data["id"],
        "title": record_data.get("title", "நிலப் பதிவு ஆவணம்"),
        "department": record_data.get("department", "Revenue Department"),
        "year": str(record_data.get("year", "1978")),
        "district": record_data.get("district", "Thanjavur"),
        "category": record_data.get("category", "Government Record"),
        "status": record_data.get("status", "Verified"),
        "confidence": float(record_data.get("confidence", 95.0)),
        "char_count": int(record_data.get("char_count", 0)),
        "word_count": int(record_data.get("word_count", 0)),
        "lines_count": int(record_data.get("lines_count", 0)),
        "tamil_text": record_data.get("tamil_text", ""),
        "file_name": record_data.get("file_name", "upload.jpg"),
        "image_path": record_data.get("image_path", f"data/uploads/{record_data['id']}_{record_data.get('file_name', 'upload.jpg')}"),
        "model_name": record_data.get("model_name", "Tesseract OCR (Primary)"),
        "processing_time_ms": float(record_data.get("processing_time_ms", 100.0)),
        "created_at": record_data.get("created_at", now_iso)
    }

    # 1. Primary write directly to MongoDB Atlas
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            mongo_doc = dict(record)
            _mongo_db["records"].update_one(
                {"id": record["id"]},
                {"$set": mongo_doc},
                upsert=True
            )
            # Log to processing_history audit collection (upsert prevents duplicate history entries on retry)
            action = "DOCUMENT_UPLOADED" if record["status"] in ("Pending OCR", "Uploaded") else "OCR_PROCESSED"
            _mongo_db["processing_history"].update_one(
                {"document_id": record["id"], "action": action},
                {"$set": {
                    "document_id": record["id"],
                    "record_id": record["id"],
                    "action": action,
                    "status": record["status"],
                    "confidence": record["confidence"],
                    "model_name": record["model_name"],
                    "file_name": record["file_name"],
                    "image_path": record.get("image_path"),
                    "tamil_preview": (record.get("tamil_text") or "")[:120],
                    "error": None,
                    "created_at": record.get("created_at", now_iso)
                }},
                upsert=True
            )
            logger.info(f"[MongoDB Atlas] Document {record['id']} saved to 'records' collection (status: {record['status']}).")
            return record
        except Exception as e:
            logger.error(f"[MongoDB Atlas] Failed to write document to Atlas: {e}")

    # 2. Resilient fallback only if Atlas is not reachable
    try:
        conn = get_sqlite_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT OR REPLACE INTO records (
            id, title, department, year, district, category, status,
            confidence, char_count, word_count, lines_count,
            tamil_text, file_name, model_name, processing_time_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record["id"], record["title"], record["department"], record["year"],
            record["district"], record["category"], record["status"],
            record["confidence"], record["char_count"], record["word_count"],
            record["lines_count"], record["tamil_text"], record["file_name"],
            record["model_name"], record["processing_time_ms"], record["created_at"]
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"[SQLite Fallback] Failed to write document: {e}")

    clear_dashboard_cache()
    return record


def record_processing_failure(
    document_id: str,
    file_name: str,
    error_message: str,
    model_name: str = "Tesseract OCR (Primary)"
):
    """
    Record an uncompleted/failed OCR attempt in processing_history
    without creating a false digitized record in the primary records collection.
    """
    now_iso = datetime.datetime.now().isoformat()
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            _mongo_db["processing_history"].insert_one({
                "document_id": document_id,
                "record_id": document_id,
                "action": "OCR_FAILED",
                "status": "Failed",
                "confidence": 0.0,
                "model_name": model_name,
                "file_name": file_name,
                "error": error_message,
                "created_at": now_iso
            })
            logger.info("[MongoDB Atlas] Recorded OCR failure event for %s: %s", document_id, error_message)
        except Exception as err:
            logger.warning("Failed to record failure event in Atlas: %s", err)


def get_processing_history(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    """Retrieve persistent processing events from MongoDB Atlas 'processing_history' collection."""
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            cursor = (
                _mongo_db["processing_history"]
                .find({}, {"_id": 0})
                .sort("created_at", pymongo.DESCENDING)
                .skip(offset)
                .limit(limit)
            )
            return list(cursor)
        except Exception as e:
            logger.error(f"[MongoDB Atlas] get_processing_history failed: {e}")

    # Fallback from records
    recs = get_records(limit=limit, offset=offset)
    return [
        {
            "document_id": r.get("id"),
            "record_id": r.get("id"),
            "action": "OCR_PROCESSED",
            "status": r.get("status", "Verified"),
            "confidence": r.get("confidence", 90.0),
            "model_name": r.get("model_name", "Tesseract OCR"),
            "file_name": r.get("file_name", "document.jpg"),
            "error": None,
            "created_at": r.get("created_at")
        }
        for r in recs
    ]


def get_records(
    limit: int = 50,
    offset: int = 0,
    search: str = "",
    status: str = ""
) -> List[Dict[str, Any]]:
    """Retrieve digitized archive records (from MongoDB Atlas or SQLite fallback)."""
    # Try MongoDB Atlas first if connected
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            query = {}
            conditions = []
            if search:
                conditions.append({
                    "$or": [
                        {"title": {"$regex": search, "$options": "i"}},
                        {"id": {"$regex": search, "$options": "i"}},
                        {"tamil_text": {"$regex": search, "$options": "i"}},
                        {"file_name": {"$regex": search, "$options": "i"}}
                    ]
                })
            if status:
                st = status.strip().lower()
                if st in ("completed", "verified", "digitized", "processed", "completed_only"):
                    conditions.append({"status": {"$in": ["Completed", "Verified"]}})
                elif st in ("pending ocr", "pending_ocr", "uploaded"):
                    conditions.append({"status": {"$in": ["Pending OCR", "Uploaded"]}})
                elif st in ("pending", "review", "needs review"):
                    conditions.append({"status": {"$in": ["Pending OCR", "Needs Review", "Review", "Pending", "Draft", "Uploaded"]}})
                elif st != "all" and st != "all statuses":
                    conditions.append({"status": {"$regex": f"^{status}$", "$options": "i"}})

            if len(conditions) == 1:
                query = conditions[0]
            elif len(conditions) > 1:
                query = {"$and": conditions}

            cursor = (
                _mongo_db["records"]
                .find(query, {"_id": 0, "image_base64": 0})
                .sort("created_at", pymongo.DESCENDING)
                .skip(offset)
                .limit(limit)
            )
            return list(cursor)
        except Exception as e:
            logger.error(f"[MongoDB Atlas] Query failed, falling back to SQLite: {e}")

    # SQLite fallback
    conn = get_sqlite_connection()
    cursor = conn.cursor()
    where_clauses = []
    params = []
    if search:
        pattern = f"%{search}%"
        where_clauses.append("(title LIKE ? OR id LIKE ? OR tamil_text LIKE ? OR file_name LIKE ?)")
        params.extend([pattern, pattern, pattern, pattern])
    if status:
        st = status.strip().lower()
        if st in ("completed", "verified", "digitized", "processed", "completed_only"):
            where_clauses.append("status IN ('Completed', 'Verified')")
        elif st in ("pending ocr", "pending_ocr", "uploaded"):
            where_clauses.append("status IN ('Pending OCR', 'Uploaded')")
        elif st in ("pending", "review", "needs review"):
            where_clauses.append("status IN ('Pending OCR', 'Needs Review', 'Review', 'Pending', 'Draft', 'Uploaded')")
        elif st != "all" and st != "all statuses":
            where_clauses.append("status LIKE ?")
            params.append(status)

    where_str = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    sql = f"SELECT * FROM records {where_str} ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(sql, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_record(record_id: str, include_base64: bool = False) -> Optional[Dict[str, Any]]:
    """Retrieve a single digitized record by its ID."""
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            proj = {"_id": 0} if include_base64 else {"_id": 0, "image_base64": 0}
            doc = _mongo_db["records"].find_one({"id": record_id}, proj)
            if doc:
                return doc
        except Exception as e:
            logger.error(f"[MongoDB Atlas] get_record failed, trying SQLite: {e}")

    conn = get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM records WHERE id = ?", (record_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def _delete_persisted_image(image_path: Optional[str], record_id: str):
    """Safely remove uploaded image file from local storage upon record deletion."""
    try:
        deleted = False
        if image_path:
            p = Path(image_path)
            if not p.is_absolute():
                p = DATA_DIR.parent / p
            if p.exists() and p.is_file() and record_id in p.name:
                p.unlink()
                deleted = True
                logger.info(f"Deleted persisted image file: {p}")

        if not deleted:
            up_p = DATA_DIR / "uploads"
            if up_p.exists():
                for f in up_p.glob(f"{record_id}_*"):
                    if f.is_file():
                        f.unlink()
                        logger.info(f"Deleted persisted image file: {f}")
    except Exception as e:
        logger.warning(f"Could not delete image file for {record_id}: {e}")


def update_record(record_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update a document's metadata or completed Tamil OCR text.
    Preserves original_tamil_text if not already saved, so original OCR output is never lost.
    Updates both MongoDB Atlas and SQLite fallback.
    Synchronizes associated processing_history entry.
    """
    existing = get_record(record_id)
    if not existing:
        return None

    update_fields = {}
    now_iso = datetime.datetime.now().isoformat()

    if "tamil_text" in updates and updates["tamil_text"] is not None:
        new_text = updates["tamil_text"]
        # Preserve original OCR text if not already saved
        if "original_tamil_text" not in existing and existing.get("tamil_text"):
            update_fields["original_tamil_text"] = existing["tamil_text"]
        update_fields["tamil_text"] = new_text
        update_fields["char_count"] = len(new_text)
        update_fields["word_count"] = len(new_text.split())
        update_fields["lines_count"] = len([l for l in new_text.splitlines() if l.strip()])

    if "title" in updates and updates["title"]:
        update_fields["title"] = updates["title"]
    if "status" in updates and updates["status"]:
        update_fields["status"] = updates["status"]
    if "department" in updates and updates["department"]:
        update_fields["department"] = updates["department"]
    if "district" in updates and updates["district"]:
        update_fields["district"] = updates["district"]
    if "year" in updates and updates["year"]:
        update_fields["year"] = str(updates["year"])
    if "confidence" in updates and updates["confidence"] is not None:
        update_fields["confidence"] = float(updates["confidence"])
    if "model_name" in updates and updates["model_name"]:
        update_fields["model_name"] = updates["model_name"]
    if "processing_time_ms" in updates and updates["processing_time_ms"] is not None:
        update_fields["processing_time_ms"] = float(updates["processing_time_ms"])
    if "processed_at" in updates:
        update_fields["processed_at"] = updates["processed_at"]

    update_fields["updated_at"] = now_iso

    # 1. Update in MongoDB Atlas
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            _mongo_db["records"].update_one(
                {"id": record_id},
                {"$set": update_fields}
            )

            # Check if this was an OCR completion
            new_status = update_fields.get("status", existing.get("status"))
            if new_status in ("Completed", "Verified") and ("tamil_text" in update_fields or "confidence" in update_fields):
                # Upsert OCR_PROCESSED event in processing_history
                _mongo_db["processing_history"].update_one(
                    {"document_id": record_id, "action": "OCR_PROCESSED"},
                    {"$set": {
                        "document_id": record_id,
                        "record_id": record_id,
                        "action": "OCR_PROCESSED",
                        "status": new_status,
                        "confidence": update_fields.get("confidence", existing.get("confidence", 0.0)),
                        "model_name": update_fields.get("model_name", existing.get("model_name", "Tesseract OCR")),
                        "file_name": existing.get("file_name", "document.jpg"),
                        "image_path": existing.get("image_path"),
                        "tamil_preview": (update_fields.get("tamil_text") or existing.get("tamil_text") or "")[:120],
                        "error": None,
                        "created_at": now_iso
                    }},
                    upsert=True
                )
            else:
                # Log general text / metadata update event
                _mongo_db["processing_history"].insert_one({
                    "document_id": record_id,
                    "record_id": record_id,
                    "action": "RECORD_UPDATED",
                    "status": new_status,
                    "confidence": update_fields.get("confidence", existing.get("confidence", 0.0)),
                    "model_name": update_fields.get("model_name", existing.get("model_name", "Tesseract OCR")),
                    "file_name": existing.get("file_name", "document.jpg"),
                    "details": "Transcription or metadata updated.",
                    "created_at": now_iso
                })
        except Exception as e:
            logger.error(f"[MongoDB Atlas] update_record failed: {e}")

    # 2. Update SQLite
    try:
        conn = get_sqlite_connection()
        cursor = conn.cursor()
        set_parts = []
        sql_params = []
        for k, v in update_fields.items():
            if k in ("title", "department", "year", "district", "status", "confidence", "char_count", "word_count", "lines_count", "tamil_text", "model_name", "processing_time_ms"):
                set_parts.append(f"{k} = ?")
                sql_params.append(v)
        if set_parts:
            sql_params.append(record_id)
            cursor.execute(f"UPDATE records SET {', '.join(set_parts)} WHERE id = ?", tuple(sql_params))
            conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"[SQLite Fallback] update_record failed: {e}")

    clear_dashboard_cache()
    return get_record(record_id)


def delete_record(record_id: str, delete_image: bool = True) -> bool:
    """
    Delete a document record from database (Atlas and SQLite).
    Removes the document from 'records', purges all related 'processing_history' audit events,
    and removes the persisted image file from disk storage.
    """
    deleted_atlas = False
    existing = get_record(record_id)
    if not existing:
        return False

    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            res = _mongo_db["records"].delete_one({"id": record_id})
            deleted_atlas = res.deleted_count > 0
            if deleted_atlas:
                # Clean up associated history entries to keep database consistent
                _mongo_db["processing_history"].delete_many({
                    "$or": [{"document_id": record_id}, {"record_id": record_id}]
                })
                # Safely delete image file from persistent disk storage
                if delete_image:
                    _delete_persisted_image(existing.get("image_path"), record_id)
        except Exception as e:
            logger.error(f"[MongoDB Atlas] delete_record failed: {e}")

    conn = get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM records WHERE id = ?", (record_id,))
    deleted_sqlite = cursor.rowcount > 0
    conn.commit()
    conn.close()

    if deleted_sqlite and not deleted_atlas and delete_image:
        _delete_persisted_image(existing.get("image_path"), record_id)

    clear_dashboard_cache()
    return deleted_atlas or deleted_sqlite


def delete_history_event(event_id: str, delete_document: bool = False) -> bool:
    """
    Delete a specific history audit event from 'processing_history' in MongoDB Atlas.
    If delete_document=True, also removes the parent document record and image.
    """
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            from bson import ObjectId
            query = {}
            if ObjectId.is_valid(event_id):
                query = {"_id": ObjectId(event_id)}
            else:
                query = {"$or": [{"_id": event_id}, {"document_id": event_id}, {"record_id": event_id}]}

            # Find matching event before deleting
            evt = _mongo_db["processing_history"].find_one(query)
            res = _mongo_db["processing_history"].delete_one(query)
            deleted = res.deleted_count > 0

            if deleted and delete_document and evt:
                doc_id = evt.get("document_id") or evt.get("record_id")
                if doc_id:
                    delete_record(doc_id, delete_image=True)

            return deleted
        except Exception as e:
            logger.error(f"[MongoDB Atlas] delete_history_event failed: {e}")
            return False

    return False


# In-memory TTL cache for dashboard statistics (drastically speeds up dashboard loads)
_dashboard_cache: Dict[str, Any] = {}
DASHBOARD_CACHE_TTL = 15.0  # seconds

def clear_dashboard_cache():
    """Clear cached dashboard statistics when records are mutated."""
    global _dashboard_cache
    _dashboard_cache.clear()


def get_dashboard_stats(time_range: str = "6 months") -> Dict[str, Any]:
    """
    Calculate aggregate portal digitization statistics directly from database records.
    Uses high-speed $facet aggregation in MongoDB Atlas and in-memory TTL caching.
    Supports MongoDB Atlas and SQLite fallback with 100% data reconciliation.
    """
    now_ts = time.time()
    cached = _dashboard_cache.get(time_range)
    if cached and (now_ts - cached[0]) < DASHBOARD_CACHE_TTL:
        return cached[1]

    now = datetime.datetime.now()
    current_ym = f"{now.year:04d}-{now.month:02d}"

    # Generate timeline slots based on requested time_range
    timeline_labels = []
    month_slots = []
    if time_range == "12 months":
        for i in range(11, -1, -1):
            y = now.year - (1 if (now.month - i) <= 0 else 0)
            m = now.month - i if (now.month - i) > 0 else (now.month - i + 12)
            month_slots.append(f"{y:04d}-{m:02d}")
            timeline_labels.append(datetime.date(y, m, 1).strftime("%b"))
    elif time_range == "30 days":
        # 6 evenly spaced 5-day intervals across last 30 days
        date_intervals = []
        for i in range(5, -1, -1):
            start_d = now - datetime.timedelta(days=(i + 1) * 5)
            end_d = now - datetime.timedelta(days=i * 5)
            date_intervals.append((start_d.isoformat(), end_d.isoformat()))
            timeline_labels.append(end_d.strftime("%b %d"))
    else:  # Default: 6 months
        for i in range(5, -1, -1):
            y = now.year - (1 if (now.month - i) <= 0 else 0)
            m = now.month - i if (now.month - i) > 0 else (now.month - i + 12)
            month_slots.append(f"{y:04d}-{m:02d}")
            timeline_labels.append(datetime.date(y, m, 1).strftime("%b"))

    # 1. Try MongoDB Atlas if connected with single $facet pipeline
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            records_col = _mongo_db["records"]

            facet_stages = {
                "total": [{"$count": "count"}],
                "verified": [{"$match": {"status": {"$in": ["Completed", "Verified"]}}}, {"$count": "count"}],
                "review": [{"$match": {"status": {"$in": ["Review", "Needs Review"]}}}, {"$count": "count"}],
                "draft": [{"$match": {"status": "Draft"}}, {"$count": "count"}],
                "this_month_total": [{"$match": {"created_at": {"$regex": f"^{current_ym}"}}}, {"$count": "count"}],
                "this_month_verified": [{"$match": {"created_at": {"$regex": f"^{current_ym}"}, "status": {"$in": ["Completed", "Verified"]}}}, {"$count": "count"}],
                "conf_stats": [
                    {"$match": {"confidence": {"$ne": None, "$gt": 0}, "status": {"$in": ["Completed", "Verified"]}}},
                    {"$group": {
                        "_id": None,
                        "avg_conf": {"$avg": "$confidence"},
                        "valid_count": {"$sum": 1},
                        "high_count": {"$sum": {"$cond": [{"$gt": ["$confidence", 90]}, 1, 0]}},
                        "mod_count": {"$sum": {"$cond": [{"$and": [{"$gte": ["$confidence", 80]}, {"$lte": ["$confidence", 90]}]}, 1, 0]}},
                        "low_count": {"$sum": {"$cond": [{"$lt": ["$confidence", 80]}, 1, 0]}}
                    }}
                ],
                "recent": [
                    {"$project": {"_id": 0, "image_base64": 0}},
                    {"$sort": {"created_at": -1}},
                    {"$limit": 5}
                ]
            }

            if time_range != "30 days":
                facet_stages["monthly"] = [
                    {"$group": {"_id": {"$substr": ["$created_at", 0, 7]}, "count": {"$sum": 1}}}
                ]

            agg_res = list(records_col.aggregate([{"$facet": facet_stages}]))
            if agg_res:
                f_data = agg_res[0]
                total_docs = f_data["total"][0]["count"] if f_data.get("total") else 0
                verified_count = f_data["verified"][0]["count"] if f_data.get("verified") else 0
                review_count = f_data["review"][0]["count"] if f_data.get("review") else 0
                draft_count = f_data["draft"][0]["count"] if f_data.get("draft") else 0
                pending_count = total_docs - verified_count
                this_month_total = f_data["this_month_total"][0]["count"] if f_data.get("this_month_total") else 0
                this_month_verified = f_data["this_month_verified"][0]["count"] if f_data.get("this_month_verified") else 0

                conf_list = f_data.get("conf_stats", [])
                if conf_list:
                    c_info = conf_list[0]
                    avg_conf = round(float(c_info.get("avg_conf", 0.0)), 1)
                    valid_conf_count = int(c_info.get("valid_count", 0))
                    high_count = int(c_info.get("high_count", 0))
                    mod_count = int(c_info.get("mod_count", 0))
                    low_count = int(c_info.get("low_count", 0))
                else:
                    avg_conf = None
                    valid_conf_count = high_count = mod_count = low_count = 0

                timeline_counts = []
                if time_range == "30 days":
                    for start_iso, end_iso in date_intervals:
                        c = records_col.count_documents({"created_at": {"$gte": start_iso, "$lt": end_iso}})
                        timeline_counts.append(c)
                else:
                    counts_by_ym = {item["_id"]: item["count"] for item in f_data.get("monthly", []) if item.get("_id")}
                    timeline_counts = [counts_by_ym.get(ym, 0) for ym in month_slots]

                recent_docs = f_data.get("recent", [])

                if valid_conf_count > 0:
                    high_pct = round((high_count / valid_conf_count) * 100, 1)
                    mod_pct = round((mod_count / valid_conf_count) * 100, 1)
                    low_pct = round((low_count / valid_conf_count) * 100, 1)
                else:
                    high_pct = mod_pct = low_pct = 0.0

                result_data = {
                    "total_documents": total_docs,
                    "processed_records": verified_count,
                    "pending_documents": pending_count,
                    "review_needed_count": review_count,
                    "draft_count": draft_count,
                    "total_this_month": this_month_total,
                    "verified_this_month": this_month_verified,
                    "avg_confidence": avg_conf,
                    "valid_confidence_records": valid_conf_count,
                    "confidence_distribution": {
                        "high_confidence_count": high_count,
                        "high_confidence_pct": high_pct,
                        "moderate_confidence_count": mod_count,
                        "moderate_confidence_pct": mod_pct,
                        "low_confidence_count": low_count,
                        "low_confidence_pct": low_pct
                    },
                    "timeline": {
                        "range": time_range,
                        "labels": timeline_labels,
                        "counts": timeline_counts,
                        "max_val": max(timeline_counts) if timeline_counts else 0
                    },
                    "recent_records": recent_docs
                }
                _dashboard_cache[time_range] = (now_ts, result_data)
                return result_data
        except Exception as e:
            logger.error(f"[MongoDB Atlas] get_dashboard_stats facet failed, using SQLite: {e}")

    # 2. SQLite local fallback
    conn = get_sqlite_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            COUNT(DISTINCT id) as total_docs,
            SUM(CASE WHEN status IN ('Completed', 'Verified') THEN 1 ELSE 0 END) as verified_count,
            SUM(CASE WHEN status IN ('Review', 'Needs Review') THEN 1 ELSE 0 END) as review_count,
            SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft_count,
            SUM(CASE WHEN status NOT IN ('Completed', 'Verified') THEN 1 ELSE 0 END) as pending_count,
            COUNT(CASE WHEN confidence IS NOT NULL AND confidence > 0 AND status IN ('Completed', 'Verified') THEN 1 END) as valid_conf_count,
            AVG(CASE WHEN confidence IS NOT NULL AND confidence > 0 AND status IN ('Completed', 'Verified') THEN confidence END) as avg_conf,
            SUM(CASE WHEN confidence > 90 AND status IN ('Completed', 'Verified') THEN 1 ELSE 0 END) as high_conf,
            SUM(CASE WHEN confidence >= 80 AND confidence <= 90 AND status IN ('Completed', 'Verified') THEN 1 ELSE 0 END) as moderate_conf,
            SUM(CASE WHEN confidence < 80 AND confidence > 0 AND status IN ('Completed', 'Verified') THEN 1 ELSE 0 END) as low_conf,
            SUM(CASE WHEN substr(created_at, 1, 7) = ? THEN 1 ELSE 0 END) as this_month_total,
            SUM(CASE WHEN substr(created_at, 1, 7) = ? AND status IN ('Completed', 'Verified') THEN 1 ELSE 0 END) as this_month_verified
        FROM records
    """, (current_ym, current_ym))

    row = dict(cur.fetchone())
    total_docs = row["total_docs"] or 0
    verified_count = row["verified_count"] or 0
    pending_count = row["pending_count"] or 0
    review_count = row["review_count"] or 0
    draft_count = row["draft_count"] or 0
    valid_conf_count = row["valid_conf_count"] or 0
    this_month_total = row["this_month_total"] or 0
    this_month_verified = row["this_month_verified"] or 0
    avg_conf = round(row["avg_conf"], 1) if row["avg_conf"] is not None else None

    high_count = row["high_conf"] or 0
    mod_count = row["moderate_conf"] or 0
    low_count = row["low_conf"] or 0

    if valid_conf_count > 0:
        high_pct = round((high_count / valid_conf_count) * 100, 1)
        mod_pct = round((mod_count / valid_conf_count) * 100, 1)
        low_pct = round((low_count / valid_conf_count) * 100, 1)
    else:
        high_pct = mod_pct = low_pct = 0.0

    # Timeline calculation
    timeline_counts = []
    if time_range == "30 days":
        for start_iso, end_iso in date_intervals:
            cur.execute("""
                SELECT COUNT(*) FROM records 
                WHERE created_at >= ? AND created_at < ?
            """, (start_iso, end_iso))
            timeline_counts.append(cur.fetchone()[0])
    else:
        cur.execute("SELECT substr(created_at, 1, 7) as ym, COUNT(*) as cnt FROM records GROUP BY ym")
        counts_by_ym = dict(cur.fetchall())
        timeline_counts = [counts_by_ym.get(ym, 0) for ym in month_slots]

    # Recent records
    cur.execute("""
        SELECT id, title, department, year, district, category, status, confidence, file_name, created_at
        FROM records
        ORDER BY created_at DESC
        LIMIT 5
    """)
    recent_docs = [dict(r) for r in cur.fetchall()]
    conn.close()

    return {
        "total_documents": total_docs,
        "processed_records": verified_count,
        "pending_documents": pending_count,
        "review_needed_count": review_count,
        "draft_count": draft_count,
        "total_this_month": this_month_total,
        "verified_this_month": this_month_verified,
        "avg_confidence": avg_conf,
        "valid_confidence_records": valid_conf_count,
        "confidence_distribution": {
            "high_confidence_count": high_count,
            "high_confidence_pct": high_pct,
            "moderate_confidence_count": mod_count,
            "moderate_confidence_pct": mod_pct,
            "low_confidence_count": low_count,
            "low_confidence_pct": low_pct
        },
        "timeline": {
            "range": time_range,
            "labels": timeline_labels,
            "counts": timeline_counts,
            "max_val": max(timeline_counts) if timeline_counts else 0
        },
        "recent_records": recent_docs
    }


def test_temporary_atlas_crud() -> Dict[str, Any]:
    """
    Perform isolated temporary test document insert, read, and delete on MongoDB Atlas.
    Used for STEP 7 connectivity verification without modifying production records.
    """
    if not _db_status["atlas_connected"] or _mongo_db is None:
        return {
            "success": False,
            "reason": "Atlas not currently connected",
            "error_category": _db_status["error_category"],
            "diagnostic_message": _db_status["diagnostic_message"]
        }

    test_col = _mongo_db["test_connectivity_check"]
    test_id = f"TEST-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    test_doc = {
        "test_id": test_id,
        "description": "TamilOCR Atlas Connectivity Verification Document",
        "timestamp": datetime.datetime.now().isoformat()
    }

    try:
        # Insert
        test_col.insert_one(test_doc)
        # Read
        retrieved = test_col.find_one({"test_id": test_id})
        # Delete
        delete_result = test_col.delete_one({"test_id": test_id})

        return {
            "success": True,
            "inserted": True,
            "retrieved": retrieved is not None,
            "cleaned_up": delete_result.deleted_count > 0,
            "test_id": test_id
        }
    except Exception as e:
        return {
            "success": False,
            "reason": str(e)
        }


# ============================================================================
# User Authentication & Session Management (MongoDB Atlas + SQLite Fallback)
# ============================================================================

def hash_password(password: str) -> str:
    """Generate PBKDF2-HMAC-SHA256 hash with 100,000 iterations and random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"pbkdf2:sha256:100000${salt}${key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored PBKDF2 hash using timing-safe comparison."""
    try:
        parts = stored_hash.split("$")
        if len(parts) != 3 or not parts[0].startswith("pbkdf2:sha256"):
            return False
        salt = parts[1]
        expected_key = parts[2]
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return hmac.compare_digest(key.hex(), expected_key)
    except Exception:
        return False


def _sanitize_user(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize user object for secure client response (removes password_hash)."""
    name = user_doc.get("full_name") or user_doc.get("name") or "Archive Specialist"
    initials = "".join([part[0] for part in name.split() if part][:2]).upper() or "TN"
    return {
        "id": user_doc.get("id"),
        "email": user_doc.get("email"),
        "name": name,
        "fullName": name,
        "role": user_doc.get("role") or "Archive Specialist",
        "department": user_doc.get("department") or "Tamil Nadu Heritage Records Division",
        "badgeId": user_doc.get("badge_id") or "TN-ARCH",
        "avatar": initials,
        "createdAt": user_doc.get("created_at"),
        "lastLogin": user_doc.get("last_login")
    }


def create_user(
    full_name: str,
    email: str,
    password: str,
    department: str = "Tamil Nadu Heritage Records Division",
    role: str = "Project Administrator",
    badge_id: Optional[str] = None
) -> Dict[str, Any]:
    """Register and persist a new user in MongoDB Atlas and SQLite fallback."""
    clean_email = email.strip().lower()
    clean_name = full_name.strip()
    user_id = f"USR-{secrets.token_hex(4).upper()}"
    badge = badge_id or f"TN-GOV-{secrets.token_hex(2).upper()}"
    p_hash = hash_password(password)
    now_iso = datetime.datetime.now().isoformat()

    # Check for existing user in MongoDB Atlas
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            if _mongo_db["users"].find_one({"email": clean_email}):
                raise ValueError("An account with this email address already exists.")
        except ValueError:
            raise
        except Exception as e:
            logger.warning(f"[User] Atlas check error: {e}")

    # Check for existing user in SQLite
    conn = get_sqlite_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE LOWER(email) = ?", (clean_email,))
        if cur.fetchone():
            raise ValueError("An account with this email address already exists.")

        # Insert into SQLite
        cur.execute("""
        INSERT INTO users (
            id, email, full_name, password_hash, role, department, badge_id, created_at, last_login
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, clean_email, clean_name, p_hash, role, department, badge, now_iso, now_iso
        ))
        conn.commit()
    finally:
        conn.close()

    # Insert into MongoDB Atlas
    user_doc = {
        "id": user_id,
        "email": clean_email,
        "full_name": clean_name,
        "password_hash": p_hash,
        "role": role,
        "department": department,
        "badge_id": badge,
        "reset_token": None,
        "reset_token_expiry": None,
        "created_at": now_iso,
        "last_login": now_iso
    }
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            _mongo_db["users"].update_one(
                {"email": clean_email},
                {"$set": user_doc},
                upsert=True
            )
            logger.info(f"[MongoDB Atlas] User '{clean_email}' persisted to 'users' collection.")
        except Exception as e:
            logger.error(f"[MongoDB Atlas] Failed to persist user: {e}")

    return _sanitize_user(user_doc)


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Find user by email address across MongoDB Atlas and SQLite fallback."""
    if not email:
        return None
    clean_email = email.strip().lower()
    user_doc = None

    # Try MongoDB Atlas first
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            user_doc = _mongo_db["users"].find_one({"email": clean_email})
        except Exception as e:
            logger.warning(f"[Database] Atlas user lookup error: {e}")

    # Fallback to SQLite
    if not user_doc:
        conn = get_sqlite_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT * FROM users WHERE LOWER(email) = ?", (clean_email,))
            row = cur.fetchone()
            if row:
                user_doc = dict(row)
        finally:
            conn.close()

    if not user_doc:
        return None

    return _sanitize_user(user_doc)


def update_user_last_login(email: str, timestamp_iso: Optional[str] = None) -> bool:
    """Update last login timestamp for user across MongoDB Atlas and SQLite."""
    if not email:
        return False
    clean_email = email.strip().lower()
    now_iso = timestamp_iso or datetime.datetime.now().isoformat()

    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            _mongo_db["users"].update_one(
                {"email": clean_email},
                {"$set": {"last_login": now_iso}}
            )
        except Exception as e:
            logger.warning(f"[Database] Atlas last_login update error: {e}")

    conn = get_sqlite_connection()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE users SET last_login = ? WHERE LOWER(email) = ?", (now_iso, clean_email))
        conn.commit()
    finally:
        conn.close()

    return True


def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Verify credentials and return user info if authentic."""
    clean_email = email.strip().lower()
    user_doc = None

    # Try MongoDB Atlas first
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            user_doc = _mongo_db["users"].find_one({"email": clean_email})
        except Exception as e:
            logger.warning(f"[Auth] Atlas lookup error: {e}")

    # Fallback to SQLite
    if not user_doc:
        conn = get_sqlite_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT * FROM users WHERE LOWER(email) = ?", (clean_email,))
            row = cur.fetchone()
            if row:
                user_doc = dict(row)
        finally:
            conn.close()

    if not user_doc:
        return None

    # Verify password hash
    stored_hash = user_doc.get("password_hash") or ""
    if not verify_password(password, stored_hash):
        return None

    # Update last login timestamp
    now_iso = datetime.datetime.now().isoformat()
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            _mongo_db["users"].update_one(
                {"email": clean_email},
                {"$set": {"last_login": now_iso}}
            )
        except Exception:
            pass

    conn = get_sqlite_connection()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE users SET last_login = ? WHERE LOWER(email) = ?", (now_iso, clean_email))
        conn.commit()
    finally:
        conn.close()

    user_doc["last_login"] = now_iso
    return _sanitize_user(user_doc)


def create_user_session(user_id: str, days: int = 7) -> str:
    """Generate and store an active session token in MongoDB and SQLite."""
    token = secrets.token_hex(32)
    now = datetime.datetime.now()
    expires_at = (now + datetime.timedelta(days=days)).isoformat()
    now_iso = now.isoformat()

    session_doc = {
        "token": token,
        "user_id": user_id,
        "created_at": now_iso,
        "expires_at": expires_at
    }

    # Save to MongoDB Atlas
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            _mongo_db["sessions"].insert_one(session_doc)
        except Exception as e:
            logger.warning(f"[Session] Failed to persist in Atlas: {e}")

    # Save to SQLite
    conn = get_sqlite_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
        INSERT INTO sessions (token, user_id, created_at, expires_at)
        VALUES (?, ?, ?, ?)
        """, (token, user_id, now_iso, expires_at))
        conn.commit()
    finally:
        conn.close()

    return token


def validate_session(token: str) -> Optional[Dict[str, Any]]:
    """Validate token and return active user profile."""
    if not token or len(token) < 16:
        return None

    now_iso = datetime.datetime.now().isoformat()
    user_id = None

    # Try MongoDB Atlas
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            sess = _mongo_db["sessions"].find_one({"token": token, "expires_at": {"$gt": now_iso}})
            if sess:
                user_id = sess.get("user_id")
        except Exception as e:
            logger.warning(f"[Session] Atlas lookup failed: {e}")

    # Fallback to SQLite
    if not user_id:
        conn = get_sqlite_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?", (token, now_iso))
            row = cur.fetchone()
            if row:
                user_id = row[0]
        finally:
            conn.close()

    if not user_id:
        return None

    # Fetch user doc
    user_doc = None
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            user_doc = _mongo_db["users"].find_one({"id": user_id})
        except Exception:
            pass

    if not user_doc:
        conn = get_sqlite_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cur.fetchone()
            if row:
                user_doc = dict(row)
        finally:
            conn.close()

    return _sanitize_user(user_doc) if user_doc else None


def revoke_session(token: str) -> bool:
    """Revoke/delete an active session token."""
    if not token:
        return True

    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            _mongo_db["sessions"].delete_one({"token": token})
        except Exception:
            pass

    conn = get_sqlite_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
    finally:
        conn.close()

    return True


def generate_password_reset_token(email: str) -> Optional[str]:
    """Generate a password recovery token valid for 60 minutes."""
    clean_email = email.strip().lower()
    token = secrets.token_urlsafe(32)
    expiry = (datetime.datetime.now() + datetime.timedelta(minutes=60)).isoformat()

    found = False
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            res = _mongo_db["users"].update_one(
                {"email": clean_email},
                {"$set": {"reset_token": token, "reset_token_expiry": expiry}}
            )
            found = res.matched_count > 0
        except Exception:
            pass

    conn = get_sqlite_connection()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE LOWER(email) = ?", (token, expiry, clean_email))
        conn.commit()
        if cur.rowcount > 0:
            found = True
    finally:
        conn.close()

    return token if found else None


def reset_password_with_token(token_or_email: str, new_password: str) -> bool:
    """Update password using reset token or verified email."""
    if not new_password or len(new_password) < 6:
        raise ValueError("Password must be at least 6 characters.")

    p_hash = hash_password(new_password)
    now_iso = datetime.datetime.now().isoformat()
    updated = False

    # Check MongoDB Atlas
    if _db_status["atlas_connected"] and _mongo_db is not None:
        try:
            res = _mongo_db["users"].update_one(
                {
                    "$or": [
                        {"reset_token": token_or_email, "reset_token_expiry": {"$gt": now_iso}},
                        {"email": token_or_email.strip().lower()}
                    ]
                },
                {
                    "$set": {"password_hash": p_hash, "reset_token": None, "reset_token_expiry": None}
                }
            )
            updated = res.matched_count > 0
        except Exception:
            pass

    # Check SQLite
    conn = get_sqlite_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
        UPDATE users 
        SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL
        WHERE (reset_token = ? AND reset_token_expiry > ?) OR LOWER(email) = ?
        """, (p_hash, token_or_email, now_iso, token_or_email.strip().lower()))
        conn.commit()
        if cur.rowcount > 0:
            updated = True
    finally:
        conn.close()

    return updated

