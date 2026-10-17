import cv2
import numpy as np
from PIL import Image
import io
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional, Union

class ImagePreprocessor:
    """
    OpenCV and Pillow preprocessing pipeline for legacy Tamil manuscripts and historical prints.
    Handles contrast enhancement, adaptive deskewing, denoising, text-line segmentation,
    and diacritic/pulli-aware character segmentation.
    """

    MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}

    @classmethod
    def load_image(cls, file_bytes: bytes) -> np.ndarray:
        """Decode image bytes to BGR numpy array using OpenCV or Pillow."""
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            pil_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        # Cap max dimension to 1600px to maintain crisp OCR accuracy while preventing cloud OOM
        max_dim = max(img.shape[:2])
        if max_dim > 1600:
            scale = 1600.0 / max_dim
            new_w = int(img.shape[1] * scale)
            new_h = int(img.shape[0] * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        return img

    @classmethod
    def enhance_contrast_and_denoise(cls, img: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Convert to grayscale, apply CLAHE contrast enhancement, non-destructive denoising,
        and robust binarization for clear Tamil text extraction without background grain.
        Returns (gray_denoised, binary_mask) where binary text is 255 and background is 0.
        """
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img.copy()

        # CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # Gentle denoising to preserve fine Tamil stroke curves and pulli dots
        denoised = cv2.fastNlMeansDenoising(enhanced, h=8, templateWindowSize=7, searchWindowSize=21)

        # Otsu binarization combined with local thresholding to avoid background amplification
        _, otsu_bin = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # Local adaptive thresholding for unevenly illuminated areas
        adapt_bin = cv2.adaptiveThreshold(
            denoised, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            blockSize=25,
            C=11
        )

        # Combine with logical AND to strictly suppress paper texture noise in blank regions
        binary = cv2.bitwise_and(otsu_bin, adapt_bin)

        # Morphological opening with 1x1 kernel to drop single-pixel isolated salt noise
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

        return denoised, binary

    @classmethod
    def deskew(cls, img: np.ndarray) -> Tuple[np.ndarray, float]:
        """
        Estimate document or text skew angle and rotate to align horizontally.
        """
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img

        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        coords = np.column_stack(np.where(binary > 0))

        if len(coords) < 50:
            return img, 0.0

        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        elif angle > 45:
            angle = 90 - angle
        else:
            angle = -angle

        # If angle is negligible (< 0.5 degrees), don't interpolate
        if abs(angle) < 0.5 or abs(angle) > 40:
            return img, 0.0

        (h, w) = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            img, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        return rotated, float(angle)

    @classmethod
    def segment_lines(cls, binary: np.ndarray, min_line_height: int = 12) -> List[Tuple[int, int, int, int]]:
        """
        Horizontal projection profile to detect Tamil text lines.
        Crops tight horizontal bounds [min_x, max_x] to eliminate blank margins.
        Returns list of (x, y, w, h) bounding boxes.
        """
        proj = np.sum(binary, axis=1)
        h, w = binary.shape
        threshold = np.max(proj) * 0.04 if np.max(proj) > 0 else 0

        in_line = False
        start_y = 0
        line_boxes = []

        for y in range(h):
            if proj[y] > threshold and not in_line:
                in_line = True
                start_y = y
            elif proj[y] <= threshold and in_line:
                in_line = False
                line_height = y - start_y
                if line_height >= min_line_height:
                    y1 = max(0, start_y - 2)
                    y2 = min(h, y + 2)
                    # Find horizontal text span within this line
                    line_slice = binary[y1:y2, :]
                    col_proj = np.sum(line_slice, axis=0)
                    valid_cols = np.where(col_proj > 0)[0]
                    if len(valid_cols) > 0:
                        min_x = max(0, valid_cols[0] - 2)
                        max_x = min(w, valid_cols[-1] + 3)
                        line_boxes.append((min_x, y1, max_x - min_x, y2 - y1))

        if in_line and (h - start_y) >= min_line_height:
            y1 = max(0, start_y - 2)
            y2 = h
            line_slice = binary[y1:y2, :]
            col_proj = np.sum(line_slice, axis=0)
            valid_cols = np.where(col_proj > 0)[0]
            if len(valid_cols) > 0:
                min_x = max(0, valid_cols[0] - 2)
                max_x = min(w, valid_cols[-1] + 3)
                line_boxes.append((min_x, y1, max_x - min_x, y2 - y1))

        if not line_boxes:
            line_boxes = [(0, 0, w, h)]

        return line_boxes

    @classmethod
    def extract_character_candidates(
        cls,
        line_img: np.ndarray,
        line_bin: Optional[np.ndarray] = None,
        min_area: int = 12
    ) -> List[Tuple[np.ndarray, Tuple[int, int, int, int]]]:
        """
        Extract individual character candidates from a text line.
        1. Detects connected components.
        2. Merges pulli dots and diacritic marks with their respective base consonants.
        3. Filters isolated scanner noise specks.
        4. Sub-segments multi-character ligatures along vertical projection valleys.
        Returns list of (bilevel_char_crop, (x, y, w, h)) sorted left-to-right.
        """
        if len(line_img.shape) == 3:
            gray = cv2.cvtColor(line_img, cv2.COLOR_BGR2GRAY)
        else:
            gray = line_img

        if line_bin is None:
            _, line_bin = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        lh, lw = line_bin.shape[:2]
        bilevel = 255 - line_bin  # Text is 0 (black), Background is 255 (white)

        # Detect connected components inside the line
        n_labels, labels, stats, _ = cv2.connectedComponentsWithStats(line_bin, connectivity=8)
        raw_components = []
        for i in range(1, n_labels):
            x, y, w, h, area = stats[i]
            if area >= 3 and h >= 2 and w >= 2:
                raw_components.append([x, y, w, h, area])

        if not raw_components:
            return []

        # Separate into potential diacritics (pulli dots/curls) vs base consonants
        # In Tamil, a pulli dot is small (height <= 12, area <= 50) and positioned in upper half
        med_h = float(np.median([c[3] for c in raw_components])) if raw_components else 14.0

        used = set()
        merged_boxes = []

        # Find dots and associate with base consonants
        for i in range(len(raw_components)):
            if i in used:
                continue
            bx, by, bw, bh, b_area = raw_components[i]

            for j in range(len(raw_components)):
                if i == j or j in used:
                    continue
                ox, oy, ow, oh, o_area = raw_components[j]

                # Check horizontal overlap
                overlap = max(0, min(bx + bw, ox + ow) - max(bx, ox))
                min_w = min(bw, ow)

                if overlap >= min_w * 0.4:
                    top_b = raw_components[i] if by < oy else raw_components[j]
                    bot_b = raw_components[j] if by < oy else raw_components[i]

                    # Vertical gap between top component and bottom component
                    vert_gap = bot_b[1] - (top_b[1] + top_b[3])
                    # If top is a dot or diacritic (height <= 12) sitting above base consonant
                    if -4 <= vert_gap <= 14 and top_b[3] <= max(12, int(med_h * 0.7)):
                        nx = min(bx, ox)
                        ny = min(by, oy)
                        nw = max(bx + bw, ox + ow) - nx
                        nh = max(by + bh, oy + oh) - ny
                        bx, by, bw, bh = nx, ny, nw, nh
                        b_area += o_area
                        used.add(j)

            merged_boxes.append([bx, by, bw, bh, b_area])
            used.add(i)

        # Filter out tiny standalone dust specks (unmerged specks with area < 10 and h < 5)
        filtered_boxes = []
        for (x, y, w, h, area) in merged_boxes:
            if area < min_area and (h < 5 or w < 3):
                continue
            filtered_boxes.append((x, y, w, h))

        if not filtered_boxes:
            return []

        filtered_boxes.sort(key=lambda b: b[0])
        med_w = float(np.median([b[2] for b in filtered_boxes]))
        med_h = float(np.median([b[3] for b in filtered_boxes]))

        # Sub-segment wide joined glyphs across vertical projection valleys
        char_boxes = []
        for (x, y, w, h) in filtered_boxes:
            if w > 1.35 * med_h and w > 18:
                sub_bin = line_bin[y:y+h, x:x+w]
                v_proj = np.sum(sub_bin, axis=0) / 255.0
                target_w = max(12, int(med_h * 0.82))
                cur_start = 0
                while cur_start < w:
                    if (w - cur_start) <= int(target_w * 1.3):
                        char_boxes.append((x + cur_start, y, w - cur_start, h))
                        break
                    search_start = cur_start + int(target_w * 0.55)
                    search_end = min(w, cur_start + int(target_w * 1.4))
                    if search_end > search_start:
                        min_col = search_start + int(np.argmin(v_proj[search_start:search_end]))
                    else:
                        min_col = min(w, cur_start + target_w)
                    char_boxes.append((x + cur_start, y, min_col - cur_start, h))
                    cur_start = min_col
            else:
                char_boxes.append((x, y, w, h))

        char_boxes.sort(key=lambda b: b[0])

        candidates = []
        for (cx, cy, cw, ch) in char_boxes:
            char_crop = bilevel[cy:cy+ch, cx:cx+cw]
            candidates.append((char_crop, (cx, cy, cw, ch)))

        return candidates

    @classmethod
    def prepare_for_cnn(cls, char_crop: np.ndarray, target_size: int = 64) -> np.ndarray:
        """
        Square-pad and resize character crop to 64x64 for TamilCNN.
        Preserves natural polarity (white background 255, dark stroke 0) matching uTHCD training data.
        Normalizes pixel values to [-1.0, 1.0] using ((x / 255.0) - 0.5) / 0.5.
        """
        h, w = char_crop.shape[:2]
        pad_size = max(h, w) + 6
        padded = np.full((pad_size, pad_size), 255, dtype=np.uint8)

        y_offset = (pad_size - h) // 2
        x_offset = (pad_size - w) // 2
        padded[y_offset:y_offset+h, x_offset:x_offset+w] = char_crop

        resized = cv2.resize(padded, (target_size, target_size), interpolation=cv2.INTER_AREA)
        # Normalization matching uTHCD training dataset:
        # White background is +1.0, black stroke is -1.0
        normalized = ((resized.astype(np.float32) / 255.0) - 0.5) / 0.5
        return normalized

    @classmethod
    def preprocess_for_ocr(
        cls,
        img_input: Any
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Comprehensive document preprocessing for Tamil OCR:
        1. Decodes and converts input to OpenCV BGR / Grayscale.
        2. Detects document skew and rotates if between 0.5 and 35 degrees.
        3. Intelligent upscaling for low-resolution / small mobile scans.
        4. CLAHE contrast enhancement for faded or yellowed historical paper.
        5. Mild bilateral filtering to suppress scanner noise while preserving pulli dots.
        Returns: (processed_image, metadata_dict)
        """
        import unicodedata

        if isinstance(img_input, (bytes, bytearray)):
            img = cls.load_image(bytes(img_input))
        elif isinstance(img_input, (str, Path)):
            with open(str(img_input), "rb") as f:
                img = cls.load_image(f.read())
        elif isinstance(img_input, Image.Image):
            pil_rgb = img_input.convert("RGB")
            img = cv2.cvtColor(np.array(pil_rgb), cv2.COLOR_RGB2BGR)
        elif isinstance(img_input, np.ndarray):
            img = img_input.copy()
        else:
            raise ValueError(f"Unsupported image type: {type(img_input)}")

        if img is None or img.size == 0:
            raise ValueError("Empty or invalid image data passed to preprocessor.")

        h, w = img.shape[:2]
        meta = {
            "original_dimensions": f"{w}x{h}",
            "deskew_angle": 0.0,
            "upscaled": False,
            "contrast_enhanced": True
        }

        # 1. Check and upscale small or low-resolution images so character stroke height is >= 28px
        min_dim = min(h, w)
        if min_dim < 400:
            scale_factor = min(2.5, 600.0 / float(max(1, min_dim)))
            new_w = int(w * scale_factor)
            new_h = int(h * scale_factor)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
            meta["upscaled"] = True
            meta["scale_factor"] = round(scale_factor, 2)
            h, w = img.shape[:2]

        # 2. Deskew estimation and correction
        deskewed, angle = cls.deskew(img)
        meta["deskew_angle"] = round(angle, 2)

        # 3. Convert to Grayscale
        if len(deskewed.shape) == 3:
            gray = cv2.cvtColor(deskewed, cv2.COLOR_BGR2GRAY)
        else:
            gray = deskewed.copy()

        # 4. Adaptive Contrast Enhancement (CLAHE)
        # Prevents faded ancient handwriting from dropping below binarization thresholds
        clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # 5. Denoise with edge-preserving bilateral filter
        denoised = cv2.bilateralFilter(enhanced, d=5, sigmaColor=30, sigmaSpace=30)

        meta["final_dimensions"] = f"{w}x{h}"
        return denoised, meta


def clean_tamil_unicode_text(text: str) -> str:
    """
    Standardize and clean recognized Tamil text:
    1. Canonical NFC normalization (composing pre-vowels, pulli dots into proper Unicode sequences).
    2. Strips phantom zero-width spaces/characters while strictly preserving Tamil vowel signs,
       pulli (்), aytham (ஃ), grantha letters, punctuation, spaces, and line breaks.
    """
    import unicodedata
    if not text:
        return ""

    # NFC Normalization
    normalized = unicodedata.normalize("NFC", text)

    # Clean non-printable control characters (except newline, tab, carriage return)
    cleaned_chars = []
    for ch in normalized:
        if ch in ("\n", "\r", "\t", " "):
            cleaned_chars.append(ch)
        elif ch in ("\u200b", "\ufeff"):
            continue  # remove invisible zero-width spaces that corrupt string indexing
        elif ch.isprintable():
            cleaned_chars.append(ch)

    result = "".join(cleaned_chars)
    # Strip trailing whitespace on each line, collapse multiple blank lines
    lines = [line.strip() for line in result.splitlines()]
    clean_lines = []
    for line in lines:
        if line:
            clean_lines.append(line)
        elif clean_lines and clean_lines[-1] != "":
            clean_lines.append("")

    return "\n".join(clean_lines).strip()

