# TamilOCR — Handwritten Script Recognition System for Government Archives

> **Project Title**: Computer Vision-Based Handwritten Tamil Script Recognition System for Digitizing Legacy Government Records  
> **Repository Subdirectory**: `backend/`  
> **API Version**: 2.4.0  

---

## 1. System Overview

This system provides an end-to-end computer vision and deep learning solution for automated transcription of legacy Tamil handwritten government documents, land records, revenue deeds, and municipal certificates.

The architecture consists of:
1. **OpenCV Preprocessing Engine**:
   - Adaptive deskewing via minimum area bounding box calculation.
   - Contrast Limited Adaptive Histogram Equalization (CLAHE).
   - Bilateral filtering to suppress paper grain while preserving stroke edges.
   - Non-destructive Otsu thresholding.
   - Horizontal projection profile line segmentation.
   - Connected component and contour extraction for character glyphs.
2. **Deep CNN Classifier (T3.7 Indic Recognition Architecture)**:
   - 4 Convolutional blocks (1 → 32 → 64 → 128 → 256 channels) with `bias=False`, `BatchNorm2d`, `ReLU`, and `MaxPool2d(2, 2)`.
   - Classification head: `Flatten` → `Linear(4096, 512)` → `ReLU` → `Dropout(0.5)` → `Linear(512, 156)`.
   - 156 standardized Tamil character classes covering independent vowels, Ayutham, pure consonants (Pulli), base consonants, vowel-consonant ligatures, and Grantha letters.
   - 2,566,012 parameters; pretrained checkpoint `tamil_best.pth` achieves **97.30% Top-1 validation accuracy**.
3. **Unicode Reconstruction & Open-Tamil Post-Processing**:
   - Assembles text lines preserving layout and spacing.
   - Applies canonical NFC Unicode normalization and Open-Tamil character boundary alignment.
4. **FastAPI & SQLite Persistence**:
   - High-throughput asynchronous REST endpoints with CORS support.
   - SQLite persistence for archive records, confidence scores, and historical audits.

---

## 2. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend status, version, and model load state |
| `GET` | `/api/model-info` | Model architecture, parameter count, and benchmark metrics |
| `POST` | `/api/ocr` | Upload handwritten Tamil document (`multipart/form-data`) |
| `POST` | `/api/ocr/batch` | Batch recognition for up to 20 documents |
| `GET` | `/api/history` | Paginated digitized record archive from SQLite |
| `GET` | `/api/history/{id}` | Single record retrieval |
| `DELETE` | `/api/history/{id}` | Delete archive record |
| `GET` | `/api/dashboard/stats` | Digitization portal statistics (counts, confidence averages) |

---

## 3. Quick Start: Running Backend & Frontend

### Running Backend (FastAPI + PyTorch)
```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Start backend server with Uvicorn
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend starts at `http://localhost:8000`.  
Interactive Swagger API documentation is available at `http://localhost:8000/docs`.

### Running Frontend (React + Vite)
```bash
# In the project root or frontend directory
npm run dev
```
The frontend is available at `http://localhost:3001` (or `$PORT`).

---

## 4. Benchmark Dataset & Evaluation

- **Dataset Generation**:
  ```bash
  python -m data.dataset_prep
  ```
  Generates 2,340 samples across all 156 Tamil classes split into:
  - `splits/train.json`: 1,560 samples (70%)
  - `splits/val.json`: 312 samples (15%)
  - `splits/test.json`: 468 samples (15%)

- **Model Evaluation**:
  ```bash
  python -m data.evaluate
  ```
  Evaluates the model on the held-out test split, measuring:
  - Top-1 and Top-5 Accuracy
  - Character Error Rate (CER) via `jiwer`
  - Word Error Rate (WER)
  - Latency (ms/sample)
  Outputs formal report to `data/evaluation_report.json`.

---

## 5. Sample API Request (cURL)

```bash
curl -X POST "http://localhost:8000/api/ocr" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample_manuscript.jpg" \
  -F "title=நிலப் பதிவு ஆவணம் - 1978" \
  -F "department=Revenue Department" \
  -F "year=1978" \
  -F "district=Thanjavur"
```
