# TamilOCR (தமிழ்OCR) — Handwritten Script Recognition System for Government Archives

> **Project Title**: Computer Vision-Based Handwritten Tamil Script Recognition System for Digitizing Legacy Government Records  
> **Version**: 2.4.0  
> **Domain**: Digital Governance, Historical Archives Preservation & Document AI  

---

## 1. System Overview

**TamilOCR** is an enterprise-grade full-stack computer vision and deep learning platform built to digitize, transcribe, and index legacy Tamil handwritten government documents, land records (*பட்டா / சிட்டா*), revenue deeds, and municipal archives.

The system bridges computer vision preprocessing algorithms with a customized Deep Convolutional Neural Network (**TamilCNN / T3.7 Indic Recognition Architecture**) trained on 156 standardized Tamil glyph classes, delivering canonical NFC Unicode text transcription with **97.30% Top-1 validation accuracy**.

---

## 2. Key Features

- **Document Ingestion & Multi-Format Support**: Upload high-resolution scans and photographs (`.jpg`, `.jpeg`, `.png`, `.webp`, `.tiff`, `.bmp`) up to 15 MB.
- **Adaptive Computer Vision Pipeline**:
  1. **Adaptive Deskewing**: Automatic angle estimation using minimum area bounding boxes and bilinear rotation.
  2. **Image Enhancement & Denoising**: CLAHE (Contrast Limited Adaptive Histogram Equalization) and bilateral filtering to eliminate aged parchment stains while preserving delicate pen strokes.
  3. **Non-Destructive Binarization**: Dual Otsu thresholding with binarized mask toggle for visual inspection.
  4. **Projection Profile Line Segmentation**: Horizontal density projection to extract distinct handwritten text lines.
  5. **Diacritic & Pulli-Aware Glyph Grouping**: Connected component analysis that merges floating dots (*புள்ளி*) and vowel modifiers (*கொம்பு, கால்*) with base consonants.
- **Deep CNN Classifier (TamilCNN T3.7)**:
  - 156 character classes covering independent vowels, Ayutham, pure consonants, base consonants, ligatures, and Grantha characters.
  - 2,566,012 parameters; pretrained weights achieving **97.30% Top-1 validation accuracy**.
- **Unicode Recomposition Engine**:
  - Recomposes split visual glyphs (e.g., *ஒற்றைக் கொம்பு* `ெ` + consonant + *கால்* `ா` into `ொ`).
  - Implements canonical NFC normalization and Open-Tamil character boundary alignment.
- **Government Records Archive & Dual Database**:
  - MongoDB Atlas cloud database support with resilient local SQLite fallback via `aiosqlite`/`sqlite3`.
  - Full audit metadata (Department, District, Year, Confidence Score, Record ID).
  - Searchable historical archive and aggregate portal dashboard analytics.
- **Bilingual & Responsive Interface**:
  - Full Tamil and English localization (*தமிழ் / English*).
  - Dark / Light theme support.
  - Interactive transcription editor, text export, clipboard copy, and visual bounding box overlays.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite 8 with `@vitejs/plugin-react`
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`
- **Icons**: Lucide React
- **Routing**: React Router DOM v7

### Backend & Machine Learning
- **Framework**: FastAPI 0.115+ (Asynchronous REST API)
- **ASGI Server**: Uvicorn 0.30+
- **Deep Learning**: PyTorch 2.2+ (CPU & CUDA compatible)
- **Computer Vision**: OpenCV (`opencv-python` 4.10+), NumPy, Pillow
- **Language & Post-Processing**: Open-Tamil 1.1+, unicodedata
- **Evaluation**: jiwer 3.0+ (CER / WER metrics)
- **Database**: MongoDB Atlas Cloud (`pymongo`) with automatic SQLite 3 fallback (`aiosqlite`)

---

## 4. Project Directory Structure

```text
TamilOCR Web Application/
├── backend/
│   ├── app/
│   │   ├── api/                     # REST API route handlers
│   │   │   ├── routes_dashboard.py  # Portal statistics & aggregation
│   │   │   ├── routes_health.py     # Liveness & model load state
│   │   │   ├── routes_history.py    # Paginated archive CRUD operations
│   │   │   └── routes_ocr.py        # Single & batch OCR inference
│   │   ├── models/                  # PyTorch model definitions & engine
│   │   │   ├── ocr_engine.py        # End-to-end OCR pipeline coordinator
│   │   │   ├── t37_model.py         # TamilCNN 4-ConvBlock architecture
│   │   │   └── tamil_charset.py     # 156 standardized Tamil character classes
│   │   ├── services/
│   │   │   └── preprocessing.py     # OpenCV deskew, denoising & segmentation
│   │   ├── config.py                # Service configuration & environment vars
│   │   ├── database.py              # SQLite schema & persistence helpers
│   │   └── main.py                  # FastAPI application entrypoint & lifespan
│   ├── checkpoints/                 # Pretrained neural network weights
│   │   └── tamil_best.pth           # 97.30% val acc checkpoint (30.8 MB)
│   ├── data/                        # Dataset tools & evaluation benchmarks
│   ├── requirements.txt             # Python runtime dependencies
│   └── tamil_ocr.db                 # SQLite database file
├── frontend/
│   └── src/
│       ├── api/
│       │   └── ocrApi.js            # Frontend API client with proxy fallback
│       ├── components/              # Sidebar, navigation & shared UI cards
│       ├── context/                 # ThemeContext & LanguageContext
│       └── pages/                   # Main views
│           ├── Dashboard.jsx        # Digitization portal overview & metrics
│           ├── DocumentUpload.jsx   # Document drag-and-drop & metadata form
│           ├── OCRProcessing.jsx    # Live 4-stage pipeline tracker & error panel
│           ├── RecognitionResults.jsx # Recognized text inspection & export
│           ├── DigitizedRecords.jsx # Searchable record archive
│           └── Settings.jsx         # Engine configuration & model thresholding
├── public/                          # Static assets, logos & sample images
├── src/                             # Vite React bootstrap entrypoint
│   ├── App.tsx                      # Root application router
│   ├── index.css                    # Tailwind CSS v4 styling rules
│   └── main.tsx                     # React root mount
├── package.json                     # Node.js dependencies & scripts
├── vite.config.ts                   # Vite config with backend manager plugin & proxy
└── README.md                        # Project documentation (this file)
```

---

## 5. Getting Started & Installation

### Prerequisites
- **Python**: 3.10, 3.11, or 3.12 installed and added to `PATH`
- **Node.js**: v18.0.0 or higher
- **pnpm** or **npm**

### Step 1: Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### Step 2: Install Node Dependencies
```bash
npm install
# or: pnpm install
```

### Step 3: Run the Application

#### Option A: Single-Command Launch (Recommended)
The Vite configuration includes a supervisor plugin (`backendManagerPlugin`) that automatically checks if the backend is active at `http://127.0.0.1:8000/api/health`. If not running, it automatically spawns the Python Uvicorn service:

```bash
npm run dev
```

Open your browser at `http://localhost:3000` (or the configured `$PORT`).

#### Option B: Run Services Separately

**Terminal 1 — Python Inference Backend:**
```bash
npm run backend
# or:
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Backend Swagger Documentation will be available at: `http://localhost:8000/docs`

**Terminal 2 — Frontend Development Server:**
```bash
npm run dev
```

---

## 6. Pipeline Architecture: 4 Processing Stages

When a manuscript is submitted for recognition, it traverses four sequential processing stages:

```
[Uploaded Image]
       │
       ▼
 Stage 1: Adaptive Binarization & Deskewing
   • Computes minimum area bounding box to calculate skew angle θ
   • Applies CLAHE (ClipLimit=2.0, Grid=8x8) and bilateral filtering
   • Otsu non-destructive thresholding creates high-contrast binary mask
       │
       ▼
 Stage 2: Layout & Text Line Segmentation
   • Horizontal projection profile detects text baselines and inter-line valleys
   • Bounding box line slicing (minimum line height: 12px)
   • Contour analysis extracts individual candidate glyph bounding boxes
       │
       ▼
 Stage 3: Deep TamilCNN Script Recognition
   • Patches are aspect-ratio preserved, centered, and scaled to 64x64 pixels
   • Normalized tensor is passed to 4 Conv2d blocks + Dense Classifier
   • Softmax inference outputs top class index (0–155) and confidence score
       │
       ▼
 Stage 4: Unicode Reconstruction & Post-Processing
   • Inter-character spacing analysis inserts word delimiters
   • Recomposition logic merges pre-vowel signs (ெ, ே, ை) and post-vowel Kaal (ா)
   • NFC canonical Unicode normalization produces standard Tamil script
       │
       ▼
[Final Digitized Output & Archive Entry]
```

---

## 7. API Reference

### Health & Metadata

#### `GET /api/health`
Returns service availability, version, and loaded neural model status.
```json
{
  "status": "online",
  "service": "TamilOCR Government Archive Digitization Engine",
  "version": "2.4.0",
  "model_loaded": true,
  "model_name": "TamilCNN (T3.7 Indic Recognition Architecture)",
  "validation_accuracy": 97.2991,
  "device": "cpu"
}
```

#### `GET /api/model-info`
Returns neural network topology, parameter counts, and benchmark accuracy metrics.

---

### OCR Inference

#### `POST /api/ocr`
Uploads a single handwritten document and performs end-to-end recognition.

- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: Document image file (`.jpg`, `.png`, `.webp`, `.tiff`, etc.)
  - `title` *(optional)*: Archive document title (e.g., `நிலப் பதிவு ஆவணம் - 1978`)
  - `department` *(optional)*: Department (e.g., `Revenue Department`)
  - `year` *(optional)*: Document year (e.g., `1978`)
  - `district` *(optional)*: District (e.g., `Thanjavur`)

**Sample Response**:
```json
{
  "success": true,
  "recordId": "TNOCR-A1B2",
  "jobId": "JOB-TNOCR-A1B2",
  "fileName": "land_record.jpg",
  "tamilText": "தமிழ்நாடு அரசு வருவாய் மற்றும் பேரிடர் மேலாண்மைத் துறை...",
  "confidenceScore": 96.4,
  "linesCount": 8,
  "wordsCount": 42,
  "charCount": 218,
  "inferenceTimeMs": 245.8,
  "lines": ["தமிழ்நாடு அரசு", "வருவாய் மற்றும் பேரிடர் மேலாண்மைத் துறை..."],
  "boundingBoxes": [
    { "x": 12, "y": 8, "w": 24, "h": 28, "text": "த", "confidence": 98.2 }
  ],
  "preprocessing": {
    "deskew_angle": -1.2,
    "dimensions": "1024x768",
    "lines_detected": 8,
    "characters_detected": 218
  }
}
```

#### `POST /api/ocr/batch`
Performs batch recognition for up to 20 documents simultaneously.

---

### Archive & Analytics

#### `GET /api/history`
Retrieves paginated archive records from the SQLite database.
- **Query Parameters**: `limit` (default: 50), `offset` (default: 0), `search` (optional)

#### `GET /api/history/{id}`
Retrieves a specific archive record by ID.

#### `DELETE /api/history/{id}`
Deletes an archive record by ID.

#### `GET /api/dashboard/stats`
Returns aggregated digitization statistics (total documents, average confidence, high-confidence ratio, department distributions).

---

## 8. Model Architecture & Benchmarks

The core recognition model is based on the **T3.7 Indic Recognition Architecture** trained on handwritten Tamil scripts (uTHCD dataset format):

| Layer | Type | Specifications |
|---|---|---|
| **Block 1** | Conv2D + BatchNorm + ReLU + MaxPool | 1 $\to$ 32 channels, kernel 3×3, stride 1, pool 2×2 |
| **Block 2** | Conv2D + BatchNorm + ReLU + MaxPool | 32 $\to$ 64 channels, kernel 3×3, stride 1, pool 2×2 |
| **Block 3** | Conv2D + BatchNorm + ReLU + MaxPool | 64 $\to$ 128 channels, kernel 3×3, stride 1, pool 2×2 |
| **Block 4** | Conv2D + BatchNorm + ReLU + MaxPool | 128 $\to$ 256 channels, kernel 3×3, stride 1, pool 2×2 |
| **Dense 1** | Flatten + Linear + ReLU + Dropout | $4096 \to 512$ units, Dropout rate = 0.5 |
| **Dense 2** | Linear (Classification Head) | $512 \to 156$ classes |

### Validation Performance
- **Parameters**: 2,566,012 (all trainable)
- **Top-1 Validation Accuracy**: **97.30%**
- **Top-5 Validation Accuracy**: **99.77%**
- **Macro F1-Score**: **95.96%**
- **Inference Latency**: ~35–60 ms per isolated line / ~1.5–3.2 s per full archival page (CPU)

---

## 9. Troubleshooting & FAQ

### 1. HTTP 502 Bad Gateway during OCR Inference
- **Cause**: The Python FastAPI backend was not running when the request reached the Vite dev proxy.
- **Fix**: The Vite dev server now includes an automated process supervisor that starts the backend automatically. Alternatively, run `npm run backend` in a separate terminal.

### 2. PyTorch Torch Not Found or Version Conflict
- Install standard CPU-only or CUDA PyTorch:
  ```bash
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
  ```

### 3. Port Conflicts (Port 8000 or 3000 in use)
- The backend port can be modified via environment variable:
  ```bash
  PORT=8001 python -m uvicorn app.main:app --port 8001
  ```
- If changed, update the proxy target in `vite.config.ts`.

---

## 10. License & Attribution

Designed for government archives preservation, cultural heritage digitization, and document intelligence research.  
Developed under the **Tamil Nadu Government Archives Digitization Initiative**.
#   T a m i l - O C R  
 #   T a m i l - O C R  
 