"""
TamilOCR AI Assistant Service
Handles secure backend communication with Google Gemini API, OpenAI-compatible models,
and provides a built-in domain knowledge engine specialized in Tamil handwritten script recognition,
government archives, and the TamilOCR platform.
"""

import os
import re
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx

from app.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    OPENAI_API_KEY,
    OPENAI_MODEL,
    OPENAI_BASE_URL,
    CONFIDENCE_THRESHOLD,
)

logger = logging.getLogger("TamilOCR.ChatService")

# =====================================================================
# SYSTEM PROMPT FOR LIVE LLM (Gemini / OpenAI)
# =====================================================================
SYSTEM_PROMPT = """You are the official AI Assistant for the TamilOCR Government Archives Digitization Portal (தமிழ்OCR தமிழ்நாடு அரசு ஆவண காப்பக எண்மமயமாக்கல் உதவியாளர்).

Portal Context & Technical Capabilities:
- Application Name: TamilOCR — Handwritten Script Recognition System for Government Archives (Version 2.4.0).
- Domain: Digitization of legacy Tamil handwritten government records, land records (பட்டா / சிட்டா / அ-பதிவேடு), revenue deeds, and municipal archives.
- Core Machine Learning Model: TamilCNN based on the T3.7 Indic Recognition Architecture.
  - Parameters: 2,566,012 (~2.57M parameters).
  - Accuracy: 97.30% Top-1 validation accuracy. Character Error Rate (CER) < 2.8%, Word Error Rate (WER) < 6.4%.
  - Classes: 156 standardized Tamil glyph classes covering independent vowels (உயிர் 12), Ayutham (ஃ 1), pure consonants (மெய் 18), Grantha glyphs (ஜ, ஷ, ஸ, ஹ, க்ஷ, ஸ்ரீ), and compound vowel-consonant ligatures.
- Computer Vision Preprocessing Pipeline:
  1. Adaptive Deskewing: Minimum area bounding box and Hough transform rotation.
  2. Denoising & Enhancement: CLAHE (Contrast Limited Adaptive Histogram Equalization) and bilateral filtering to eliminate parchment stains while preserving delicate pen strokes.
  3. Binarization: Dual Otsu thresholding with non-destructive binarized mask.
  4. Line & Character Segmentation: Horizontal density projection profiling for line extraction, followed by connected component analysis merging diacritics and dots (புள்ளி).
  5. Unicode Recomposition: Open-Tamil NFC canonical recomposition for split glyphs (e.g., கொம்பு + மெய் + கால்).
- Government Record Types:
  - Patta (பட்டா): Legal title deed of land ownership issued by the Revenue Department.
  - Chitta (சிட்டா): Village revenue register listing land area, owner details, wet/dry classification (நஞ்சை/புஞ்சை), and tax assessment.
  - A-Register (அ-பதிவேடு): Master revenue register recording survey numbers, sub-divisions, soil classification, and assessment.
  - Adangal (அடங்கல்): Crop cultivation and tenancy register.
  - Inam deeds (இனாம் பட்டா): Historical tax-free royal or temple land grants.
- User Workflows:
  - Upload Documents (/upload): Supports JPG, PNG, TIFF, BMP, WEBP up to 15 MB. Captures department, district, record type, year.
  - OCR Pipeline (/pipeline): Real-time 4-stage pipeline visualization with progress tracking and confidence scoring.
  - Recognition Results (/results): Side-by-side zoom/pan image inspection, visual bounding boxes, editable recognized Tamil text, on-screen Tamil virtual keyboard, save to MongoDB Atlas / SQLite archive, and export to TXT, JSON, and CSV.
  - Digital Archive (/records): Searchable historical repository with filtering by department, district, date, or text.
  - Settings (/settings): Configure recognition engine (TamilCNN, Tesseract, Hybrid), confidence threshold (default 80%), database connectivity.

Interaction Guidelines:
- Language: You are fully bilingual in Tamil and English.
  - If the user writes in Tamil, reply in articulate, natural, professional, and grammatically correct Tamil.
  - If the user writes in English, reply in clear, professional, well-structured English with appropriate Tamil terminology in brackets where helpful.
  - If the user mixes Tamil and English (Tanglish), answer warmly in clear English with Tamil script terms.
- Tone: Professional, authoritative yet accessible, respectful of Tamil culture, language heritage, and archival preservation.
- Formatting: Use markdown headers, bold text, bullet points, and numbered steps to make explanations easy to read.
- Accuracy: Give specific, practical, actionable instructions related to the portal whenever asked about workflows.
"""

# =====================================================================
# LIVE API CONNECTORS (Gemini & OpenAI)
# =====================================================================

async def call_gemini_api(message: str, history: List[Dict[str, str]], language: str = "en") -> Optional[str]:
    """
    Calls Google Gemini REST API using secure backend environment credentials.
    """
    api_key = GEMINI_API_KEY
    if not api_key:
        return None

    # Supported Gemini models in order of preference
    model_candidates = [
        GEMINI_MODEL or "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
    ]
    # Remove duplicates preserving order
    seen = set()
    model_candidates = [m for m in model_candidates if not (m in seen or seen.add(m))]

    # Build Gemini conversation contents
    contents = []
    if history:
        for item in history[-8:]:  # Keep recent context window
            role = "user" if item.get("role") in ["user", "human"] else "model"
            text = item.get("content", "").strip()
            if text:
                contents.append({"role": role, "parts": [{"text": text}]})

    # Append current message
    contents.append({"role": "user", "parts": [{"text": message}]})

    payload = {
        "contents": contents,
        "systemInstruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "generationConfig": {
            "temperature": 0.35,
            "maxOutputTokens": 1024,
            "topP": 0.95
        }
    }

    async with httpx.AsyncClient(timeout=25.0) as client:
        last_error = None
        for model_name in model_candidates:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            try:
                res = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()
                else:
                    logger.warning(
                        "Gemini API returned status %d for model %s: %s",
                        res.status_code,
                        model_name,
                        res.text[:200]
                    )
                    last_error = f"HTTP {res.status_code}"
            except Exception as e:
                logger.warning("Error invoking Gemini model %s: %s", model_name, str(e))
                last_error = str(e)

        if last_error:
            logger.info("Live Gemini API call failed (%s); falling back to TamilOCR knowledge engine.", last_error)
    return None


async def call_openai_api(message: str, history: List[Dict[str, str]], language: str = "en") -> Optional[str]:
    """
    Calls OpenAI-compatible endpoint using secure backend environment credentials.
    """
    api_key = OPENAI_API_KEY
    if not api_key:
        return None

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        for item in history[-8:]:
            role = "user" if item.get("role") in ["user", "human"] else "assistant"
            content = item.get("content", "").strip()
            if content:
                messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    payload = {
        "model": OPENAI_MODEL or "gpt-4o-mini",
        "messages": messages,
        "temperature": 0.35,
        "max_tokens": 1024,
    }

    url = f"{OPENAI_BASE_URL}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            res = await client.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "").strip()
    except Exception as e:
        logger.warning("Error invoking OpenAI API: %s", str(e))
    return None


# =====================================================================
# BUILT-IN EXPERT DOMAIN KNOWLEDGE ENGINE
# =====================================================================

def is_tamil_query(text: str) -> bool:
    """Detects if query contains significant Tamil Unicode characters."""
    tamil_count = sum(1 for char in text if '\u0B80' <= char <= '\u0BFF')
    return tamil_count >= 2


def generate_expert_response(message: str, history: List[Dict[str, str]] = None, language: str = "en") -> str:
    """
    Intelligent knowledge-based domain engine that provides comprehensive,
    accurate answers on TamilOCR, machine learning architectures, Tamil linguistics,
    government archives, and portal workflows in both Tamil and English.
    """
    q = message.lower().strip()
    user_tamil = is_tamil_query(message) or language.lower() in ["ta", "tamil"]

    # 1. GREETINGS & INTRODUCTIONS
    if any(greet in q for greet in ["hello", "hi", "hey", "வணக்கம்", "vanakkam", "who are you", "யார் நீ", "உதவி"]):
        if user_tamil:
            return (
                "**வணக்கம்! நான் தமிழ்OCR செயற்கை நுண்ணறிவு உதவியாளர் (TamilOCR AI Assistant).**\n\n"
                "தமிழ்நாடு அரசு ஆவணக் காப்பக எண்மமயமாக்கல் அமைப்பில் உங்களுக்கு உதவ நான் தயாராக உள்ளேன். பின்வரும் தலைப்புகளில் நீங்கள் என்னிடம் வினவலாம்:\n\n"
                "• **ஆவணப் பதிவேற்றம்:** கையெழுத்துப் பட்டா, சிட்டா, அ-பதிவேடு போன்ற ஆவணங்களை பதிவேற்றுவது எப்படி?\n"
                "• **OCR மாதிரி & துல்லியம்:** TamilCNN T3.7 கட்டமைப்பு (97.30% துல்லியம்), 156 எழுத்து வகுப்புகள்.\n"
                "• **முன் செயலாக்க படிகள்:** படங்களை சீரமைத்தல் (Deskewing), சத்தம் நீக்கம் (CLAHE), கோடு பிரித்தல்.\n"
                "• **முடிவுகள் & திருத்தம்:** உரை திருத்தம், தமிழ் விசைப்பலகை, தரவு ஏற்றுமதி (TXT, JSON, CSV).\n\n"
                "*உங்களுக்கு எதில் வழிகாட்ட வேண்டும்? தாராளமாகக் கேளுங்கள்!*"
            )
        else:
            return (
                "**Hello! I am your TamilOCR AI Assistant.**\n\n"
                "I am here to assist you with the Tamil Nadu Government Archives Digitization Portal. Here is how I can help you:\n\n"
                "• **Document Upload & Digitization:** How to upload, prepare, and ingest handwritten records.\n"
                "• **Deep Learning Models:** TamilCNN (T3.7 Indic Architecture with 97.30% validation accuracy) & Tesseract hybrid mode.\n"
                "• **Preprocessing Pipeline:** Image deskewing, CLAHE denoising, Otsu binarization, and line/glyph segmentation.\n"
                "• **Results & Export:** Reviewing confidence scores, inline editing with on-screen Tamil keyboard, and exporting to CSV/JSON/TXT.\n"
                "• **Government Land Records:** Understanding Patta, Chitta, A-Register, and municipal deeds.\n\n"
                "*How can I assist your archival digitization workflow today?*"
            )

    # 2. UPLOAD & FILE REQUIREMENTS
    if any(k in q for k in ["upload", "file format", "file size", "பதிவேற்ற", "கோப்பு", "எந்த வகை", "mb", "jpg", "png"]):
        if user_tamil:
            return (
                "### 📄 ஆவணப் பதிவேற்ற வழிகாட்டுதல் (Document Upload Guidelines)\n\n"
                "தமிழ்OCR தளத்தில் கையெழுத்து ஆவணங்களை பதிவேற்ற:\n\n"
                "1. **பாதை:** இடது பக்க வழிசெலுத்தலில் **'Upload Documents'** (ஆவணப் பதிவேற்றம்) பக்கத்திற்குச் செல்லவும்.\n"
                "2. **ஏற்றுக்கொள்ளப்படும் கோப்பு வடிவங்கள்:** `JPG`, `JPEG`, `PNG`, `WEBP`, `TIFF`, `BMP`.\n"
                "3. **அதிகபட்ச கோப்பு அளவு:** ஒரு ஆவணத்திற்கு **15 MB** வரை.\n"
                "4. **ஆவண விவரங்கள் (Metadata):**\n"
                "   • துறை (Department): வருவாய்த்துறை (Revenue), காப்பகம் (Archives), பதிவுத்துறை (Registration) போன்றவை.\n"
                "   • மாவட்டம் (District): ஆவணம் சார்ந்த மாவட்டம்.\n"
                "   • ஆவண வகை (Record Type): பட்டா (Patta), சிட்டா (Chitta), அ-பதிவேடு (A-Register) போன்றவை.\n"
                "   • ஆண்டு (Year): ஆவணம் உருவாக்கப்பட்ட ஆண்டு.\n"
                "5. **துல்லியத்திற்கான குறிப்பு:** 300 DPI தெளிவுத்திறன் கொண்ட சமச்சீரான வெளிச்சத்தில் ஸ்கேன் செய்யப்பட்ட ஆவணங்கள் மிகச் சிறந்த முடிவுகளைத் தரும்!"
            )
        else:
            return (
                "### 📄 Document Upload & Specifications\n\n"
                "To ingest and prepare historical documents for OCR recognition:\n\n"
                "1. **Navigate:** Open the **'Upload Documents'** page (`/upload`) from the sidebar.\n"
                "2. **Supported Formats:** `JPG`, `JPEG`, `PNG`, `TIFF`, `WEBP`, and `BMP`.\n"
                "3. **Maximum File Size:** Up to **15 MB** per document.\n"
                "4. **Document Metadata:** Enter department (e.g., Revenue, Archives), district, record type (Patta, Chitta, Deed), and estimated year for archival tracking.\n"
                "5. **Quality Best Practices:**\n"
                "   • Minimum recommended resolution: **300 DPI**.\n"
                "   • Avoid uneven flash shadows or excessive perspective distortion.\n"
                "   • The system automatically applies adaptive deskewing and CLAHE contrast enhancement during processing."
            )

    # 3. OCR MODEL & ARCHITECTURE
    if any(k in q for k in ["model", "tamilcnn", "t3.7", "accuracy", "cnn", "architecture", "மாதிரி", "துல்லியம்", "கட்டமைப்பு", "பாராமீட்டர்"]):
        if user_tamil:
            return (
                "### 🧠 TamilCNN (T3.7 Indic) மாதிரியின் கட்டமைப்பு & துல்லியம்\n\n"
                "தமிழ்OCR அமைப்பு அதிநவீன ஆழமான கற்றல் (Deep Learning) மாதிரியைப் பயன்படுத்துகிறது:\n\n"
                "• **மாதிரிப் பெயர்:** **TamilCNN** (T3.7 Indic Script Recognition Architecture).\n"
                "• **துல்லிய விகிதம் (Validation Accuracy):** **97.30% Top-1 Accuracy** (எழுத்து பிழை விகிதம் CER < 2.8%).\n"
                "• **அளபுருக்கள் (Parameters):** 2,566,012 (சுமார் 2.57 மில்லியன் பயிற்சி பெற்ற எடைகள்).\n"
                "• **எழுத்து வகுப்புகள் (Classes):** **156 நிலையான தமிழ் எழுத்து வகுப்புகள்**:\n"
                "  - 12 உயிர் எழுத்துகள் (அ முதல் ஔ)\n"
                "  - 1 ஆய்த எழுத்து (ஃ)\n"
                "  - 18 மெய் எழுத்துகள் (க் முதல் ன்)\n"
                "  - உயிர்மெய் சேர்க்கைகள் & கிரந்த எழுத்துகள் (ஜ, ஷ, ஸ, ஹ, க்ஷ, ஸ்ரீ)\n"
                "• **கட்டமைப்பு அம்சங்கள்:** 4 கன்வல்யூஷனல் தொகுதிகள் (Conv Blocks), பேட்ச் நார்மலைசேஷன், மேக்ஸ் பூலிங், மற்றும் ஓவர்ஃபிட்டிங்கைத் தடுக்கும் டிராப்அவுட் அடுக்குகளைக் கொண்டுள்ளது."
            )
        else:
            return (
                "### 🧠 TamilCNN Deep Learning Model Architecture\n\n"
                "The core recognition engine of TamilOCR is powered by **TamilCNN (T3.7 Indic Architecture)**:\n\n"
                "• **Architecture:** 4-Block Deep Convolutional Neural Network with Batch Normalization, ReLU activations, Max-Pooling, and Dropout (0.25 / 0.40).\n"
                "• **Total Trainable Parameters:** **2,566,012 parameters** (~30.8 MB model weights).\n"
                "• **Validation Accuracy:** **97.30% Top-1 Accuracy** on standardized handwritten Tamil benchmarks.\n"
                "• **Error Metrics:** Character Error Rate (CER) < 2.8%, Word Error Rate (WER) < 6.4%.\n"
                "• **Character Classes (156 Classes):**\n"
                "  - 12 Independent Vowels (உயிர்: அ–ஔ)\n"
                "  - 1 Ayutham (ஃ)\n"
                "  - 18 Pure Consonants (மெய்: க்–ன்)\n"
                "  - High-frequency Uyirmei ligatures & Grantha glyphs (ஜ, ஷ, ஸ, ஹ, க்ஷ, ஸ்ரீ).\n"
                "• **Unicode Recomposition:** Integrates with Open-Tamil NFC normalizer to combine multi-part glyphs (ஒற்றைக் கொம்பு, கால்) into canonical Unicode."
            )

    # 4. PREPROCESSING PIPELINE
    if any(k in q for k in ["pipeline", "preprocessing", "deskew", "clahe", "denois", "segmentation", "otsu", "முன் செயலாக்கம்", "சீரமைப்பு"]):
        if user_tamil:
            return (
                "### 🔬 கணினி பார்வை முன்செயலாக்க படிகள் (4-Stage Pipeline)\n\n"
                "பழைய ஆவணங்களின் எழுத்துக்களை துல்லியமாக படிக்க 4 முக்கிய படிகள் செயல்படுத்தப்படுகின்றன:\n\n"
                "1. **தானியங்கி கோண சீரமைப்பு (Adaptive Deskewing):**\n"
                "   ஆவணத்தின் சாய்வுக் கோணத்தை மினிமம் ஏரியா பவுண்டிங் பாக்ஸ் மூலம் கணக்கிட்டு தானாகவே நேராக்குகிறது.\n"
                "2. **சத்தம் நீக்கம் & மாறுபாடு மேம்பாடு (CLAHE & Bilateral Filtering):**\n"
                "   மங்கிய மை மற்றும் காகிதக் கறைகளை நீக்கி, மெல்லிய பேனா வரிகளை தெளிவாக்குகிறது.\n"
                "3. **பைனரைசேஷன் (Dual Otsu Thresholding):**\n"
                "   பின்னணி காகிதத்திலிருந்து முன்வரிசை எழுத்து மையை பிரித்தெடுக்கிறது.\n"
                "4. **வரிகள் & எழுத்துக்கள் பிரித்தல் (Line & Glyph Segmentation):**\n"
                "   கிடைமட்ட அடர்த்தி கணிப்பு (Horizontal Projection) மூலம் தனித்தனி வரிகளையும், புள்ளி மற்றும் கொம்புகளை இணைத்து எழுத்துக்களையும் பிரிக்கிறது."
            )
        else:
            return (
                "### 🔬 Computer Vision Preprocessing Pipeline\n\n"
                "Before text classification, the pipeline prepares damaged historical records through 4 stages:\n\n"
                "1. **Stage 1: Adaptive Deskewing:**\n"
                "   Calculates rotational skew angle via minimum-area bounding rectangles and rotates using bilinear interpolation.\n"
                "2. **Stage 2: Denoising & Contrast Enhancement:**\n"
                "   Uses CLAHE (Contrast Limited Adaptive Histogram Equalization) combined with Bilateral Filtering to remove parchment age stains while sharpening ink boundaries.\n"
                "3. **Stage 3: Dual Otsu Binarization:**\n"
                "   Generates an optimal foreground-background separation mask resilient against uneven lighting.\n"
                "4. **Stage 4: Line & Glyph Segmentation:**\n"
                "   Extracts horizontal text baselines via projection profiling, then performs diacritic-aware connected component grouping (keeping pulli dots with their base consonants)."
            )

    # 5. GOVERNMENT RECORD TYPES (PATTA / CHITTA / A-REGISTER)
    if any(k in q for k in ["patta", "chitta", "a-register", "adangal", "inam", "பட்டா", "சிட்டா", "அ-பதிவேடு", "அடங்கல்", "இனாம்"]):
        if user_tamil:
            return (
                "### 📜 அரசு ஆவண வகைகள் (Government Land Records Explained)\n\n"
                "தமிழ்நாடு அரசு வருவாய்த் துறையின் முக்கிய ஆவணங்கள்:\n\n"
                "• **பட்டா (Patta):**\n"
                "  ஒரு குறிப்பிட்ட நிலத்தின் சட்டப்பூர்வ உரிமையாளர் யார் என்பதை உறுதிப்படுத்தும் வருவாய்த் துறை ஆவணம். இதில் பட்டா எண், தாலுகா, கிராமம் மற்றும் உரிமையாளர் பெயர் இருக்கும்.\n"
                "• **சிட்டா (Chitta):**\n"
                "  கிராம நிர்வாக அலுவலரால் (VAO) பராமரிக்கப்படும் நில உரிமைப் பதிவேடு. நிலத்தின் வகைப்பாடு (நஞ்சை - நன்செய் / புஞ்சை - புன்செய்), விஸ்தீரணம் மற்றும் நில வரித் தொகை இதில் அடங்கும்.\n"
                "• **அ-பதிவேடு (A-Register):**\n"
                "  ஒவ்வொரு கிராமத்தின் அனைத்து நில சர்வே எண்கள், உட்பிரிவுகள், நிலத்தின் மண் தரம் மற்றும் அரசு பதிவுகளைக் கொண்ட முதன்மை பதிவேடு.\n"
                "• **இனாம் நில ஆவணங்கள் (Inam Deeds):**\n"
                "  மன்னர்கள் அல்லது ஆலயங்களால் வரலாற்று காலத்தில் வரியின்றி வழங்கப்பட்ட மானிய நில ஆவணங்கள்."
            )
        else:
            return (
                "### 📜 Tamil Nadu Government Historical Land Records\n\n"
                "Key document types digitized by the portal:\n\n"
                "• **Patta (பட்டா):**\n"
                "  Official legal title deed issued by the Revenue Department authenticating real estate ownership. Contains Patta Number, Taluk, Village, Survey Number, and Owner's Name.\n"
                "• **Chitta (சிட்டா):**\n"
                "  Village land revenue register maintained by the Village Administrative Officer (VAO). Specifies land area, soil classification (Wetland *Nanjai* / Dryland *Punjai*), and land tax assessment.\n"
                "• **A-Register (அ-பதிவேடு):**\n"
                "  The definitive master survey register of a village listing every survey number, sub-division, tenure classification, and municipal assessment.\n"
                "• **Inam Grants (இனாம் பட்டா):**\n"
                "  Historical tax-free land donations granted by rulers, chieftains, or temple trusts to scholars and institutions."
            )

    # 6. RESULTS, EDITING & KEYBOARD
    if any(k in q for k in ["results", "edit", "keyboard", "correct", "விளைவுகள்", "திருத்த", "விசைப்பலகை", "கீபோர்டு"]):
        if user_tamil:
            return (
                "### ✍️ முடிவுகள் ஆய்வு & உரை திருத்தம் (Reviewing & Editing Results)\n\n"
                "OCR செயல்முறை முடிந்ததும் **'Recognition Results'** பக்கத்தில்:\n\n"
                "1. **ஒப்பீட்டுப் பார்வை:** இடதுபுறத்தில் அசல் கையெழுத்து ஆவணம் மற்றும் வலதுபுறத்தில் அங்கீகரிக்கப்பட்ட தமிழ் உரை தோன்றும்.\n"
                "2. **பவுண்டிங் பாக்ஸ் (Bounding Boxes):** எழுத்துக்களின் இருப்பிடத்தைக் குறிக்கும் செவ்வகப் பெட்டிகளை 'Eye' ஐகான் மூலம் இயக்கலாம்.\n"
                "3. **நேரடி உரை திருத்தம் (Inline Editing):** 'Edit' பொத்தானை அழுத்தி உரையை மாற்றியமைக்கலாம்.\n"
                "4. **திரை விசைப்பலகை (Tamil Virtual Keyboard):** கணினியில் தமிழ் தட்டச்சு செய்யத் தெரியாவிட்டாலும், திரையில் தோன்றும் விசைப்பலகை பொத்தான்களைக் கிளிக் செய்து எளிதாகத் தட்டச்சு செய்யலாம்.\n"
                "5. **சேமிப்பு:** 'Save Record' என்பதைக் கிளிக் செய்து டிஜிட்டல் ஆவணக் காப்பகத்தில் சேமிக்கலாம்."
            )
        else:
            return (
                "### ✍️ Reviewing Results & Inline Editing\n\n"
                "On the **'Recognition Results'** page (`/results`):\n\n"
                "1. **Side-by-Side Verification:** Inspect the high-resolution source manuscript next to the transcribed Tamil Unicode text.\n"
                "2. **Bounding Box Overlays:** Toggle the Eye icon to see recognized word bounding boxes and individual glyph locations.\n"
                "3. **Confidence Scoring:** Overall document confidence and individual word metrics are displayed (highlighting low confidence words).\n"
                "4. **On-Screen Tamil Virtual Keyboard:** Click the keyboard icon to open a visual Tamil input pad (vowels, consonants, vowel markers) for effortless corrections without configuring external IME.\n"
                "5. **Save to Archive:** Click **'Save Record'** to persist verified transcriptions directly into MongoDB Atlas / SQLite."
            )

    # 7. EXPORT DATA (CSV, JSON, TXT)
    if any(k in q for k in ["export", "download", "csv", "json", "txt", "ஏற்றுமதி", "பதிவிறக்க", "எக்ஸ்போர்ட்"]):
        if user_tamil:
            return (
                "### 💾 ஆவண தரவு ஏற்றுமதி (Exporting Transcripts)\n\n"
                "அங்கீகரிக்கப்பட்ட தமிழ் உரையை பின்வரும் வடிவங்களில் பதிவிறக்கலாம்:\n\n"
                "1. **Plain Text (`.txt`):** தூய தமிழ் NFC யூனிகோட் உரை கோப்பு.\n"
                "2. **JSON Format (`.json`):** ஆவணத்தின் மெட்டாடேட்டா, சொல் துல்லிய மதிப்பெண்கள் (Confidence Scores) மற்றும் ஆய்வு நேர முத்திரைகள் அடங்கிய முழுமையான அமைப்பு.\n"
                "3. **CSV Format (`.csv`):** Excel அல்லது விரிதாள்களில் அட்டவணைப்படுத்தக்கூடிய வடிவம்.\n\n"
                "**எப்படி ஏற்றுமதி செய்வது?**\n"
                "• **Recognition Results** பக்கத்தில் உள்ள **'Download'** பொத்தானை அல்லது **Digital Archive** பட்டியலில் உள்ள பதிவிறக்க ஐகானை அழுத்தவும்."
            )
        else:
            return (
                "### 💾 Exporting Digitized Records\n\n"
                "Transcriptions and audit metadata can be exported in 3 formats:\n\n"
                "• **Plain Text (`.txt`):** Canonical NFC-normalized Tamil Unicode transcription, suitable for word processors.\n"
                "• **Structured JSON (`.json`):** Full technical payload including bounding boxes, word-level confidence ratings, department, district, and timestamp.\n"
                "• **Spreadsheet CSV (`.csv`):** Tabular format compatible with Excel and database management systems.\n\n"
                "**How to Export:**\n"
                "Click the **'Export'** or **'Download'** button on the Recognition Results page or Digital Archive table."
            )

    # 8. TROUBLESHOOTING & LOW CONFIDENCE
    if any(k in q for k in ["troubleshoot", "low confidence", "blur", "bad quality", "error", "பிழை", "குறைந்த", "மங்கலான", "சரியா வரல"]):
        if user_tamil:
            return (
                "### 🛠️ துல்லியத்தை அதிகரிப்பதற்கான தீர்வுகள் (Troubleshooting & Accuracy)\n\n"
                "துல்லிய மதிப்பெண் குறைவாக இருந்தால் (Low Confidence Score):\n\n"
                "1. **வெளிச்சம் & மாறுபாடு:** ஆவணத்தை ஸ்கேன் செய்யும்போது நிழல்கள் விழாமல் சமச்சீரான வெளிச்சத்தில் ஸ்கேன் செய்யவும்.\n"
                "2. **தெளிவுத்திறன் (Resolution):** குறைந்தபட்சம் **300 DPI** அல்லது அதற்கும் அதிகமான தெளிவுத்திறனைப் பயன்படுத்தவும்.\n"
                "3. **செட்டிங்ஸ் த்ரெஷோல்ட் (Settings):** இடதுபக்க **'Settings'** பக்கத்திற்குச் சென்று 'Confidence Threshold' அளவை சரிசெய்யலாம் (இயல்புநிலை: 80%).\n"
                "4. **ஹைப்ரிட் பயன்முறை (Hybrid Engine):** பழைய அச்சு மற்றும் கையெழுத்து இரண்டும் கலந்த ஆவணங்களுக்கு Settings-ல் **'Hybrid Engine'** தேர்ந்தெடுக்கலாம்."
            )
        else:
            return (
                "### 🛠️ Troubleshooting & Maximizing Recognition Accuracy\n\n"
                "If recognized text has lower than expected confidence:\n\n"
                "1. **Scan Resolution:** Ensure scans are at least **300 DPI**. Low-resolution mobile phone camera photos often lose delicate vowel dots (*pulli*).\n"
                "2. **Flatten Parchment:** Creased or curved palm leaf manuscripts create shadow distortions across lines. Use a flatbed scanner if possible.\n"
                "3. **Confidence Threshold:** Adjust the sensitivity slider in **Settings** (`/settings`, default is 80%).\n"
                "4. **Engine Mode:** Try switching to **'Hybrid Mode'** (TamilCNN + Tesseract) in Settings if the document contains mixed handwritten and printed headings.\n"
                "5. **Manual Inspection:** Review flagged low-confidence words on the Results page and use the virtual keyboard for quick touch-ups."
            )

    # 9. TAMIL SCRIPT & LINGUISTICS
    if any(k in q for k in ["tamil letter", "alphabet", "uyir", "mei", "pulli", "grantha", "எழுத்துக்கள்", "உயிர்", "மெய்", "கிரந்தம்", "புள்ளி"]):
        if user_tamil:
            return (
                "### 🔤 தமிழ் எழுத்துக்களின் கட்டமைப்பு (Tamil Character System)\n\n"
                "தமிழ்OCR தளம் கையாளும் தமிழ் எழுத்து அமைப்பு:\n\n"
                "• **உயிர் எழுத்துகள் (12):** அ, ஆ, இ, ஈ, உ, ஊ, எ, ஏ, ஐ, ஒ, ஓ, ஔ\n"
                "• **ஆய்த எழுத்து (1):** ஃ\n"
                "• **மெய் எழுத்துகள் (18):** க், ங், ச், ஞ், ட், ண், த், ந், ப், ம், ய், ர், ல், வ், ழ், ள், ற், ன் (புள்ளி வைத்த எழுத்துக்கள்)\n"
                "• **உயிர்மெய் எழுத்துகள் (216):** 18 மெய்களும் 12 உயிர்களும் இணைந்து தோன்றும் கூட்டு வடிவங்கள்.\n"
                "• **கிரந்த எழுத்துகள்:** வரலாற்று நில ஆவணங்களில் சமஸ்கிருத பெயர்களைக் குறிக்கப் பயன்பட்ட எழுத்துக்கள்: ஜ, ஷ, ஸ, ஹ, க்ஷ, ஸ்ரீ.\n"
                "• **மொத்த வகுப்புகள்:** TamilCNN மாதிரி இந்த 156 பிரதான எழுத்து வடிவங்களையும் அடையாளம் காண பயிற்சி பெற்றுள்ளது."
            )
        else:
            return (
                "### 🔤 Tamil Script & Linguistic Framework\n\n"
                "The Tamil writing system recognized by the TamilCNN engine comprises:\n\n"
                "• **12 Independent Vowels (உயிர் எழுத்துகள்):** அ, ஆ, இ, ஈ, உ, ஊ, எ, ஏ, ஐ, ஒ, ஓ, ஔ\n"
                "• **1 Ayutham (ஆய்த எழுத்து):** ஃ\n"
                "• **18 Pure Consonants with Pulli dots (மெய் எழுத்துகள்):** க், ங், ச், ஞ், ட், ண், த், ந், ப், ம், ய், ர், ல், வ், ழ், ள், ற், ன்\n"
                "• **216 Uyirmei Combinations (உயிர்மெய்):** Matrix of 18 consonants × 12 vowels forming ligatures with visual modifiers (*கொம்பு, கால், விலங்கு*).\n"
                "• **Grantha Characters:** Historical Sanskrit loan glyphs commonly found in temple deeds and royal land titles: ஜ, ஷ, ஸ, ஹ, க்ஷ, ஸ்ரீ.\n"
                "• **Open-Tamil Recomposition:** TamilCNN groups split visual glyphs into clean canonical Unicode NFC representations."
            )

    # 10. DATABASE & ARCHIVES
    if any(k in q for k in ["database", "mongodb", "sqlite", "atlas", "சேமிப்பு", "டேட்டாபேஸ்"]):
        if user_tamil:
            return (
                "### 🗄️ தரவுத்தள கட்டமைப்பு (Dual Database Architecture)\n\n"
                "தமிழ்OCR அமைப்பு இரு அடுக்கு தரவுத்தள பாதுகாப்பைக் கொண்டுள்ளது:\n\n"
                "1. **MongoDB Atlas Cloud:** இணையத்தில் இணைக்கப்பட்ட பொதுக் காப்பகங்களுக்கான மேகக்கணி தரவுத்தளம் (`cluster0.itpmyr3.mongodb.net`).\n"
                "2. **Resilient Local SQLite Fallback:** இணைய இணைப்பு இல்லாதபோதும் ஆஃப்லைனில் செயல்படும் வகையில் உள்ளமைக்கப்பட்ட லோக்கல் SQLite (`tamil_ocr.db`).\n"
                "3. **பாதுகாப்பு:** உங்கள் ஆவணங்கள் மற்றும் அங்கீகார முடிவுகள் பாதுகாப்பாக குறியாக்கம் செய்யப்பட்டு சேமிக்கப்படுகின்றன."
            )
        else:
            return (
                "### 🗄️ Database & Archival Storage Architecture\n\n"
                "TamilOCR features a resilient dual-database infrastructure:\n\n"
                "• **Primary: MongoDB Atlas Cloud (`tamilocrgov`):** Hosted on MongoDB Atlas cluster with automatic failover, storing documents, digitized transcripts, and audit timestamps.\n"
                "• **Automatic Fallback: Local SQLite 3 (`tamil_ocr.db`):** If cloud connectivity is intermittent, the system gracefully reads and writes locally using asynchronous SQLite.\n"
                "• **Data Integrity:** Transcriptions are saved with department code, district, confidence metric, and ISO verification timestamps."
            )

    # 11. GENERAL FALLBACK (Clear, helpful, and contextual)
    if user_tamil:
        return (
            f"**தமிழ்OCR உதவியாளர் வழிகாட்டல்:**\n\n"
            f"நீங்கள் கேட்ட கேள்விக்குரிய தகவல்களை அறிய:\n\n"
            f"• ஆவணங்களைப் பதிவேற்ற **'Upload Documents'** பக்கத்தைப் பயன்படுத்தவும்.\n"
            f"• துல்லியமான தமிழ் கையெழுத்து அங்கீகாரத்திற்கு **TamilCNN (T3.7)** மாதிரி பயன்படுகிறது (97.30% துல்லியம்).\n"
            f"• முடிவுகளை ஆய்வு செய்ய மற்றும் தமிழ் விசைப்பலகை மூலம் திருத்த **'Recognition Results'** பக்கத்திற்குச் செல்லவும்.\n"
            f"• ஆவணங்களை TXT, JSON அல்லது CSV வடிவங்களில் பதிவிறக்கம் செய்துகொள்ளலாம்.\n\n"
            f"*மேலும் குறிப்பிட்ட கேள்விகள் ஏதேனும் இருப்பின் கேட்கலாம்!*"
        )
    else:
        return (
            f"**TamilOCR Archival Assistant Response:**\n\n"
            f"Regarding your query about *\"{message}\"*:\n\n"
            f"• **Digitization Workflow:** Ingest documents via `/upload`, track CNN pipeline progress at `/pipeline`, and inspect results at `/results`.\n"
            f"• **High Accuracy:** TamilCNN achieves 97.30% Top-1 validation accuracy on 156 standardized Tamil character classes.\n"
            f"• **Export & Editing:** Edit transcribed Tamil text with the virtual Tamil keyboard and export as TXT, JSON, or CSV.\n"
            f"• **Archival Storage:** Verified records are automatically preserved in MongoDB Atlas with resilient SQLite fallback.\n\n"
            f"*Feel free to ask more specific questions about any stage of the TamilOCR workflow!*"
        )


# =====================================================================
# MAIN DISPATCHER FUNCTION
# =====================================================================

async def process_chat_message(
    message: str,
    history: Optional[List[Dict[str, str]]] = None,
    language: str = "en"
) -> Dict[str, Any]:
    """
    Coordinates chat handling:
    1. Attempts live Google Gemini API if configured.
    2. Attempts OpenAI API if configured.
    3. Seamlessly falls back to Built-In TamilOCR Knowledge Engine.
    Guarantees a fast, relevant, and robust response at all times.
    """
    clean_msg = message.strip()
    if not clean_msg:
        return {
            "reply": "Please enter a question or topic about TamilOCR." if language == "en" else "தயவுசெய்து உங்கள் கேள்வியை உள்ளிடவும்.",
            "provider": "system",
            "model": "system",
            "timestamp": datetime.now().isoformat()
        }

    history = history or []

    # 1. Try Live Google Gemini API (if key present)
    if GEMINI_API_KEY:
        try:
            logger.info("Dispatching query to Google Gemini model (%s)...", GEMINI_MODEL)
            gemini_reply = await call_gemini_api(clean_msg, history, language)
            if gemini_reply:
                return {
                    "reply": gemini_reply,
                    "provider": "gemini",
                    "model": GEMINI_MODEL or "gemini-2.5-flash",
                    "timestamp": datetime.now().isoformat()
                }
        except Exception as e:
            logger.error("Gemini API invocation encountered error: %s", e)

    # 2. Try Live OpenAI API (if key present and Gemini not configured or failed)
    if OPENAI_API_KEY:
        try:
            logger.info("Dispatching query to OpenAI model (%s)...", OPENAI_MODEL)
            openai_reply = await call_openai_api(clean_msg, history, language)
            if openai_reply:
                return {
                    "reply": openai_reply,
                    "provider": "openai",
                    "model": OPENAI_MODEL or "gpt-4o-mini",
                    "timestamp": datetime.now().isoformat()
                }
        except Exception as e:
            logger.error("OpenAI API invocation encountered error: %s", e)

    # 3. Built-In TamilOCR Archival Intelligence Engine
    logger.info("Using Built-In TamilOCR Domain Knowledge Engine...")
    expert_reply = generate_expert_response(clean_msg, history, language)
    return {
        "reply": expert_reply,
        "provider": "tamilocr_knowledge_engine",
        "model": "TamilOCR Knowledge Engine v2.4 (Domain AI)",
        "timestamp": datetime.now().isoformat()
    }


def get_chat_status() -> Dict[str, Any]:
    """Returns AI Assistant status and active provider."""
    has_gemini = bool(GEMINI_API_KEY)
    has_openai = bool(OPENAI_API_KEY)
    
    if has_gemini:
        active_provider = "Google Gemini"
        active_model = GEMINI_MODEL or "gemini-2.5-flash"
    elif has_openai:
        active_provider = "OpenAI"
        active_model = OPENAI_MODEL or "gpt-4o-mini"
    else:
        active_provider = "TamilOCR Knowledge Engine"
        active_model = "TamilOCR Knowledge Engine v2.4 (Domain AI)"

    return {
        "status": "ready",
        "active_provider": active_provider,
        "active_model": active_model,
        "gemini_configured": has_gemini,
        "openai_configured": has_openai,
        "fallback_available": True,
        "capabilities": [
            "Tamil handwritten script recognition guidance",
            "TamilCNN architecture and validation metrics (97.30%)",
            "Computer vision preprocessing pipeline details",
            "Government records digitization (Patta, Chitta, A-Register)",
            "Results review and virtual Tamil keyboard guidance",
            "Data export and archival preservation",
            "Bilingual English and Tamil conversational support"
        ]
    }
