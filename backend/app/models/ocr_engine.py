import time
import unicodedata
import numpy as np
import cv2
import torch
import torch.nn.functional as F
from PIL import Image
import io
from typing import Dict, Any, List, Tuple, Optional, Union
import logging

from app.models.t37_model import load_tamil_model, get_model_metadata
from app.models.tamil_charset import TAMIL_156_CLASSES, get_char
from app.services.preprocessing import ImagePreprocessor
from app.config import DEVICE, CONFIDENCE_THRESHOLD

logger = logging.getLogger("TamilOCR.Engine")


def recompose_tamil_line(
    char_items: List[Tuple[str, float, int, int, int, int, int]],
    avg_char_w: float
) -> Tuple[str, List[Dict[str, Any]], List[float]]:
    """
    Reconstruct valid Tamil Unicode text from recognized glyphs in reading order.
    1. Inserts word spaces when character gap exceeds threshold.
    2. Composes visual pre-vowel modifiers (ெ, ே, ை) with consonants into canonical Unicode.
    3. Handles (ெ/ே + consonant + ா) combos into (ொ/ோ) and (ெ + consonant + ள) into ௌ.
    4. Applies canonical NFC Unicode normalization.
    """
    if not char_items:
        return "", [], []

    # Step A: Assemble sequence with word spaces
    tokens = []
    boxes = []
    confs = []
    last_x_end = None

    for char, conf, idx, abs_x, abs_y, cw, ch in char_items:
        # Check for word space
        if last_x_end is not None and (abs_x - last_x_end) > max(8.0, avg_char_w * 0.70):
            tokens.append(" ")

        tokens.append(char)
        confs.append(conf)
        last_x_end = abs_x + cw

        boxes.append({
            "x": int(abs_x),
            "y": int(abs_y),
            "w": int(cw),
            "h": int(ch),
            "text": char,
            "confidence": conf,
            "char_index": idx
        })

    # Step B: Logical Unicode Recomposition
    # Visual glyphs:
    # \u0BC6: ெ (Ottrai kombu)
    # \u0BC7: ே (Irattai kombu)
    # \u0BC8: ை (Inai kombu)
    # \u0BBE: ா (Kaal)
    # \u0BB3: ள (used for ௌ)
    result_chars = []
    i = 0
    n = len(tokens)

    while i < n:
        tok = tokens[i]

        # Handle pre-vowel signs: ெ, ே, ை
        if tok in ["\u0BC6", "\u0BC7", "\u0BC8"] and i + 1 < n:
            nxt = tokens[i + 1]
            if nxt == " ":
                result_chars.append(tok)
                i += 1
                continue

            # Check three-glyph combo: ெ/ே + consonant + ா
            if i + 2 < n and tokens[i + 2] == "\u0BBE":
                if tok == "\u0BC6":
                    result_chars.append(nxt + "\u0BCA")  # ொ
                elif tok == "\u0BC7":
                    result_chars.append(nxt + "\u0BCB")  # ோ
                else:
                    result_chars.append(nxt + "\u0BC8" + "\u0BBE")
                i += 3
                continue

            # Check ெ + consonant + ள -> ௌ
            elif i + 2 < n and tokens[i + 2] == "\u0BB3" and tok == "\u0BC6":
                result_chars.append(nxt + "\u0BCC")  # ௌ
                i += 3
                continue

            # Two-glyph combo: ெ/ே/ை + consonant
            else:
                result_chars.append(nxt + tok)
                i += 2
                continue

        # Post-consonant Kaal (ா) modifier
        elif i + 1 < n and tokens[i + 1] == "\u0BBE":
            result_chars.append(tok + "\u0BBE")
            i += 2
            continue

        else:
            result_chars.append(tok)
            i += 1

    composed_text = "".join(result_chars)
    normalized_text = unicodedata.normalize("NFC", composed_text).strip()

    return normalized_text, boxes, confs


class TamilOCREngine:
    """
    End-to-End Tamil Script Recognition Engine.
    Combines:
      1. OpenCV Preprocessing & Adaptive Deskew
      2. Document Layout Analysis & Text-Line Segmentation
      3. Diacritic / Pulli-Aware Connected-Component Extraction
      4. Standardized Deep CNN 156-Class Tamil Handwritten Character Classifier (uTHCD benchmark)
      5. Canonical Unicode Recomposition & NFC Normalization
    """
    def __init__(self, device: str = DEVICE):
        self.device = device
        self.model = load_tamil_model(device=self.device)
        self.classes = TAMIL_156_CLASSES

    def predict_patch(self, norm_patch: np.ndarray) -> Tuple[str, float, int]:
        """Classify a single 64x64 normalized character patch."""
        tensor = torch.from_numpy(norm_patch).unsqueeze(0).unsqueeze(0).to(self.device)
        with torch.no_grad():
            logits = self.model(tensor)
            probs = F.softmax(logits, dim=1)
            conf, pred_idx = torch.max(probs, dim=1)
            char = get_char(pred_idx.item())
            confidence_pct = round(conf.item() * 100.0, 2)
            return char, confidence_pct, pred_idx.item()

    def predict_batch_patches(self, patches: List[np.ndarray]) -> List[Tuple[str, float, int]]:
        """Batch classify multiple 64x64 character patches."""
        if not patches:
            return []

        tensors = [torch.from_numpy(p).unsqueeze(0).unsqueeze(0) for p in patches]
        batch = torch.cat(tensors, dim=0).to(self.device)

        with torch.no_grad():
            logits = self.model(batch)
            probs = F.softmax(logits, dim=1)
            confs, indices = torch.max(probs, dim=1)

            results = []
            for conf, idx in zip(confs, indices):
                c = get_char(idx.item())
                pct = round(conf.item() * 100.0, 2)
                results.append((c, pct, idx.item()))
            return results

    def recognize_image(
        self,
        image_input: Union[bytes, np.ndarray, str],
        filename: str = "document.jpg",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Perform complete Tamil manuscript / document OCR inference.
        """
        start_time = time.perf_counter()

        # Step 1: Decode image
        if isinstance(image_input, bytes):
            img_bgr = ImagePreprocessor.load_image(image_input)
        elif isinstance(image_input, str):
            with open(image_input, "rb") as f:
                img_bgr = ImagePreprocessor.load_image(f.read())
        elif isinstance(image_input, np.ndarray):
            img_bgr = image_input if len(image_input.shape) == 3 else cv2.cvtColor(image_input, cv2.COLOR_GRAY2BGR)
        else:
            raise ValueError("Unsupported image input type")

        # Step 2: Deskew and enhance
        deskewed, angle = ImagePreprocessor.deskew(img_bgr)
        denoised_gray, binary = ImagePreprocessor.enhance_contrast_and_denoise(deskewed)

        h, w = denoised_gray.shape
        total_confs = []
        recognized_lines = []
        all_boxes = []

        # If image is an isolated single-character sample
        if h <= 96 and w <= 96:
            bilevel = 255 - binary
            norm_patch = ImagePreprocessor.prepare_for_cnn(bilevel, 64)
            char, conf, idx = self.predict_patch(norm_patch)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "text": char,
                "confidence": conf,
                "inference_time_ms": duration_ms,
                "word_count": 1 if char else 0,
                "char_count": len(char),
                "lines": [char],
                "bounding_boxes": [{
                    "x": 0, "y": 0, "w": w, "h": h,
                    "text": char, "confidence": conf, "char_index": idx
                }],
                "model_info": get_model_metadata(),
                "preprocessing_meta": {
                    "deskew_angle": round(angle, 2),
                    "dimensions": f"{w}x{h}",
                    "mode": "isolated_character"
                }
            }

        # Step 3: Segment Lines
        line_boxes = ImagePreprocessor.segment_lines(binary, min_line_height=12)

        for lx, ly, lw, lh in line_boxes:
            line_gray = denoised_gray[ly:ly+lh, lx:lx+lw]
            line_bin = binary[ly:ly+lh, lx:lx+lw]
            if line_gray.size == 0 or line_bin.size == 0:
                continue

            # Extract character/glyph candidates with diacritic & pulli merging
            candidates = ImagePreprocessor.extract_character_candidates(line_gray, line_bin, min_area=12)
            if not candidates:
                continue

            # Prepare normalized 64x64 patches
            patches = [ImagePreprocessor.prepare_for_cnn(crop, 64) for crop, _ in candidates]
            predictions = self.predict_batch_patches(patches)

            char_items = []
            for (crop, (cx, cy, cw, ch)), (pred_char, conf, idx) in zip(candidates, predictions):
                abs_x = lx + cx
                abs_y = ly + cy
                char_items.append((pred_char, conf, idx, abs_x, abs_y, cw, ch))

            avg_char_w = float(np.mean([box[2] for _, box in candidates])) if candidates else 18.0
            norm_line, line_boxes_list, line_confs = recompose_tamil_line(char_items, avg_char_w)

            if norm_line:
                recognized_lines.append(norm_line)
                all_boxes.extend(line_boxes_list)
                total_confs.extend(line_confs)

        # Assemble full document text
        from app.services.preprocessing import clean_tamil_unicode_text
        if recognized_lines:
            full_text = clean_tamil_unicode_text("\n".join(recognized_lines))
            avg_confidence = round(float(np.mean(total_confs)), 2) if total_confs else 85.0
            lines_output = [l for l in full_text.splitlines() if l.strip()]
        else:
            full_text = ""
            avg_confidence = 0.0
            lines_output = []

        words = full_text.split()
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "text": full_text,
            "confidence": avg_confidence,
            "inference_time_ms": duration_ms,
            "word_count": len(words),
            "char_count": len(full_text.replace("\n", "").replace(" ", "")),
            "lines": lines_output,
            "has_text": bool(full_text.strip()),
            "bounding_boxes": all_boxes,
            "model_info": get_model_metadata(),
            "preprocessing_meta": {
                "deskew_angle": round(angle, 2),
                "dimensions": f"{w}x{h}",
                "lines_detected": len(recognized_lines),
                "characters_detected": len(all_boxes)
            }
        }


_engine_instance: Optional[TamilOCREngine] = None


def get_ocr_engine() -> TamilOCREngine:
    """Singleton getter for TamilOCREngine."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = TamilOCREngine()
    return _engine_instance
