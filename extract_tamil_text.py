"""
Standalone Tamil Text Extractor (Primary Model)
Adapted from Colab snippet to run locally in this compiler / environment without Google Colab dependencies:

Original Colab snippet:
    !apt install tesseract-ocr -y
    !apt install tesseract-ocr-tam -y
    !pip install pytesseract Pillow
    from google.colab import files
    uploaded = files.upload()
    from PIL import Image
    import pytesseract
    image_path = list(uploaded.keys())[0]
    img = Image.open(image_path)
    extracted_text = pytesseract.image_to_string(img, lang='tam')
    print(" Extracted Tamil Text:\n")
    print(extracted_text)

This script automatically configures the local Tesseract binary and Tamil language pack ('tam'),
loads the specified image, and prints the extracted Tamil text.
"""

import os
import sys
from pathlib import Path
from PIL import Image
import pytesseract

# Ensure UTF-8 output handling on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Automatically locate local portable Tesseract binary and tessdata
BASE_DIR = Path(__file__).resolve().parent
LOCAL_TESS_EXE = BASE_DIR / "backend" / "tesseract_bin" / "tesseract.exe"
LOCAL_TESSDATA = BASE_DIR / "backend" / "tesseract_bin" / "tessdata"

if not LOCAL_TESS_EXE.exists():
    LOCAL_TESS_EXE = BASE_DIR / "tesseract_bin" / "tesseract.exe"
    LOCAL_TESSDATA = BASE_DIR / "tesseract_bin" / "tessdata"

if LOCAL_TESS_EXE.is_file():
    pytesseract.pytesseract.tesseract_cmd = str(LOCAL_TESS_EXE)

if LOCAL_TESSDATA.is_dir():
    os.environ["TESSDATA_PREFIX"] = str(LOCAL_TESSDATA)


def extract_tamil_text_from_image(image_path: str) -> str:
    """Loads image with Pillow and extracts Tamil text using pytesseract."""
    if not os.path.isfile(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")

    img = Image.open(image_path)
    extracted_text = pytesseract.image_to_string(img, lang='tam')
    return extracted_text


if __name__ == "__main__":
    # Determine image path: command-line argument, or default test image
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        sample_path = BASE_DIR / "backend" / "data" / "test_image.webp"
        if sample_path.exists():
            image_path = str(sample_path)
        else:
            print("Usage: python extract_tamil_text.py <path_to_image>")
            sys.exit(1)

    print(f"Processing image: {image_path}")
    img = Image.open(image_path)
    extracted_text = pytesseract.image_to_string(img, lang='tam')

    print(" Extracted Tamil Text:\n")
    print(extracted_text)
