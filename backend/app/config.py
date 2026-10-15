import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "checkpoints"
DB_PATH = BASE_DIR / "tamil_ocr.db"

# Create directories if they do not exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Environment File Loader (lightweight without external dotenv dependency)
def _load_env_files():
    for env_candidate in [BASE_DIR / ".env", BASE_DIR.parent / ".env", BASE_DIR.parent / "frontend" / ".env"]:
        if env_candidate.is_file():
            try:
                with open(env_candidate, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        if "=" in line:
                            key, val = line.split("=", 1)
                            key = key.strip().replace("export ", "")
                            val = val.strip().strip("'\"")
                            if key and key not in os.environ:
                                os.environ[key] = val
            except Exception:
                pass

_load_env_files()

# API Configuration
PORT = int(os.environ.get("PORT", 8000))
HOST = os.environ.get("HOST", "0.0.0.0")
raw_cors = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:3001,http://localhost:8443,http://127.0.0.1:5173,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:8443")
CORS_ORIGINS = [orig.strip() for orig in raw_cors.split(",") if orig.strip()]

# Model Configuration
HF_MODEL_REPO = os.environ.get("HF_MODEL_REPO", "dhruv10050/t3-7-indic-recognition")
DEVICE = os.environ.get("DEVICE", "cpu")
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", 80.0))

# Bodhan Indic-OCR Cloud Service Configuration (Backend-Only Secure Credentials)
BODHAN_API_KEY = os.environ.get("BODHAN_API_KEY", "").strip()
BODHAN_API_ENDPOINT = os.environ.get("BODHAN_API_ENDPOINT", "https://api.bodhan.ai/v1").strip().rstrip("/")
BODHAN_MODEL = os.environ.get("BODHAN_MODEL", "indic-ocr").strip()

# AI Assistant & LLM Configuration (Backend-Only Secure Credentials)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip() or os.environ.get("GOOGLE_API_KEY", "").strip()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip()
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").strip().rstrip("/")


# MongoDB Atlas Configuration
import urllib.parse

MONGODB_DB_NAME = os.environ.get("MONGODB_DB_NAME", "tamilocrgov")
MONGODB_USER = os.environ.get("MONGODB_USER") or os.environ.get("DB_USERNAME") or "nithishk63741_db_user"
MONGODB_PASSWORD = os.environ.get("MONGODB_PASSWORD", "")
MONGODB_CLUSTER = os.environ.get("MONGODB_CLUSTER", "cluster0.itpmyr3.mongodb.net")

raw_uri = os.environ.get("MONGODB_URI", "")
if raw_uri:
    # If raw_uri has placeholders, substitute them safely with URL-encoded credentials
    if "<db_username>" in raw_uri and MONGODB_USER:
        raw_uri = raw_uri.replace("<db_username>", urllib.parse.quote_plus(MONGODB_USER))
    if "<actual_username>" in raw_uri and MONGODB_USER:
        raw_uri = raw_uri.replace("<actual_username>", urllib.parse.quote_plus(MONGODB_USER))
    if "<URL_ENCODED_PASSWORD>" in raw_uri and MONGODB_PASSWORD:
        raw_uri = raw_uri.replace("<URL_ENCODED_PASSWORD>", urllib.parse.quote_plus(MONGODB_PASSWORD))
    if "<actual_password>" in raw_uri and MONGODB_PASSWORD:
        raw_uri = raw_uri.replace("<actual_password>", urllib.parse.quote_plus(MONGODB_PASSWORD))
    if "<db_password>" in raw_uri and MONGODB_PASSWORD:
        raw_uri = raw_uri.replace("<db_password>", urllib.parse.quote_plus(MONGODB_PASSWORD))
    if "<database_name>" in raw_uri and MONGODB_DB_NAME:
        raw_uri = raw_uri.replace("<database_name>", MONGODB_DB_NAME)
    MONGODB_URI = raw_uri
else:
    # Construct standard MongoDB Atlas SRV URI with URL-encoded username and password
    encoded_user = urllib.parse.quote_plus(MONGODB_USER) if MONGODB_USER else ""
    encoded_pw = urllib.parse.quote_plus(MONGODB_PASSWORD) if MONGODB_PASSWORD else ""
    if encoded_user and encoded_pw and MONGODB_CLUSTER:
        MONGODB_URI = f"mongodb+srv://{encoded_user}:{encoded_pw}@{MONGODB_CLUSTER}/{MONGODB_DB_NAME}?retryWrites=true&w=majority&appName=Cluster0"
    else:
        MONGODB_URI = ""

