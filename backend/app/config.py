import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "checkpoints"
DB_PATH = BASE_DIR / "tamil_ocr.db"

# Create directories if they do not exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# API Configuration
PORT = int(os.environ.get("PORT", 8000))
HOST = os.environ.get("HOST", "0.0.0.0")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:3001,http://localhost:8443,http://127.0.0.1:5173,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:8443").split(",")

# Model Configuration
HF_MODEL_REPO = os.environ.get("HF_MODEL_REPO", "dhruv10050/t3-7-indic-recognition")
DEVICE = os.environ.get("DEVICE", "cpu")
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", 80.0))

# Environment File Loader (lightweight without external dotenv dependency)
def _load_env_files():
    for env_candidate in [BASE_DIR / ".env", BASE_DIR.parent / ".env"]:
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

# MongoDB Atlas Configuration
import urllib.parse

MONGODB_DB_NAME = os.environ.get("MONGODB_DB_NAME", "tamil_ocr")
MONGODB_USER = os.environ.get("MONGODB_USER") or os.environ.get("DB_USERNAME") or os.environ.get("USERNAME", "Nithish")
MONGODB_PASSWORD = os.environ.get("MONGODB_PASSWORD", "nziGOtJuiu4sz1dB")
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

