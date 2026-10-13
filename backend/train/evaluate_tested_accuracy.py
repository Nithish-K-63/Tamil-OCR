"""
Rigorous Empirical Evaluation Script:
Tests models strictly by comparing predicted labels against ground truth test labels.
NO unverified or fabricated accuracy values.

Dataset: uTHCD (Tamil Handwritten Character Dataset)
Split: GroundTruth-Test.csv (Held-out Test Split)
"""

import os
import sys
import csv
import json
import time
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn.functional as F
import jiwer
import logging

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.config import DATA_DIR, MODELS_DIR, DEVICE
from app.models.tesseract_engine import get_tesseract_engine
from app.models.t37_model import load_tamil_model
from app.models.tamil_charset import TAMIL_156_CLASSES, get_char

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("TamilOCR.StrictEval")

DATASET_ROOT = BASE_DIR.parent / "Dataset" / "uTHCD_a(70-30-split)" / "70-30-split"
TEST_CSV = DATASET_ROOT / "GroundTruth-Test.csv"
TEST_IMG_DIR = DATASET_ROOT / "Test"


def run_strict_evaluation(num_samples: int = 1000):
    logger.info("==================================================================")
    logger.info("TamilOCR: Strict Empirical Test Evaluation (Predicted vs Ground Truth)")
    logger.info("Dataset: %s", TEST_CSV)
    logger.info("==================================================================")

    if not TEST_CSV.exists() or not TEST_IMG_DIR.exists():
        raise FileNotFoundError(f"uTHCD Test dataset not found at {DATASET_ROOT}")

    # 1. Load Ground Truth Test Samples
    test_samples = []
    with open(TEST_CSV, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader, None)  # skip header
        for row in reader:
            if len(row) >= 3:
                fname = row[1]
                gt_idx = int(row[2])
                gt_char = get_char(gt_idx)
                test_samples.append((fname, gt_idx, gt_char))
            if len(test_samples) >= num_samples:
                break

    total = len(test_samples)
    logger.info("Loaded %d ground-truth test samples for evaluation.", total)

    # =========================================================================
    # MODEL 1: Tesseract OCR (Primary Model - lang='tam')
    # =========================================================================
    logger.info("\n--- [Evaluating Model 1] Tesseract OCR (Primary - lang='tam') ---")
    tess_engine = get_tesseract_engine()

    tess_correct = 0
    tess_gts = []
    tess_preds = []
    tess_latencies = []

    for fname, gt_idx, gt_char in test_samples:
        img_path = TEST_IMG_DIR / fname
        if not img_path.exists():
            continue

        pil_img = Image.open(str(img_path))

        t0 = time.perf_counter()
        pred_text = tess_engine.extract_text(pil_img, config="--psm 10").strip()
        t1 = time.perf_counter()

        tess_latencies.append((t1 - t0) * 1000.0)

        # Normalize predicted character
        pred_clean = pred_text.replace("\n", "").replace(" ", "").strip()
        # Take first character if multi-char returned
        pred_char = pred_clean[0] if pred_clean else ""

        tess_gts.append(gt_char)
        tess_preds.append(pred_char if pred_char else " ")

        if pred_char == gt_char:
            tess_correct += 1

    tess_acc = (tess_correct / total) * 100.0 if total > 0 else 0.0
    tess_cer = jiwer.cer(" ".join(tess_gts), " ".join(tess_preds)) * 100.0
    tess_wer = jiwer.wer(" ".join(tess_gts), " ".join(tess_preds)) * 100.0
    tess_lat = float(np.mean(tess_latencies)) if tess_latencies else 0.0

    logger.info("Tesseract Results: Exactly Matched: %d/%d | Accuracy: %.2f%% | CER: %.2f%% | Avg Latency: %.2fms",
                tess_correct, total, tess_acc, tess_cer, tess_lat)

    # =========================================================================
    # MODEL 2: T3.7 TamilCNN (Secondary Model)
    # =========================================================================
    logger.info("\n--- [Evaluating Model 2] T3.7 TamilCNN (Secondary) ---")
    model_t37 = load_tamil_model(device=DEVICE)
    model_t37.eval()

    t37_correct = 0
    t37_gts = []
    t37_preds = []
    t37_latencies = []

    with torch.no_grad():
        for fname, gt_idx, gt_char in test_samples:
            img_path = TEST_IMG_DIR / fname
            if not img_path.exists():
                continue

            img = cv2.imread(str(img_path), cv2.IMREAD_GRAYSCALE)
            if img is None:
                img = np.zeros((64, 64), dtype=np.uint8)
            if img.shape != (64, 64):
                img = cv2.resize(img, (64, 64), interpolation=cv2.INTER_AREA)

            norm = ((img.astype(np.float32) / 255.0) - 0.5) / 0.5
            tensor = torch.from_numpy(norm).unsqueeze(0).unsqueeze(0).to(DEVICE)

            t0 = time.perf_counter()
            logits = model_t37(tensor)
            pred_idx = torch.argmax(logits, dim=1).item()
            t1 = time.perf_counter()

            t37_latencies.append((t1 - t0) * 1000.0)

            pred_char = get_char(pred_idx)
            t37_gts.append(gt_char)
            t37_preds.append(pred_char)

            if pred_idx == gt_idx:
                t37_correct += 1

    t37_acc = (t37_correct / total) * 100.0 if total > 0 else 0.0
    t37_cer = jiwer.cer(" ".join(t37_gts), " ".join(t37_preds)) * 100.0
    t37_wer = jiwer.wer(" ".join(t37_gts), " ".join(t37_preds)) * 100.0
    t37_lat = float(np.mean(t37_latencies)) if t37_latencies else 0.0

    logger.info("T3.7 TamilCNN Results: Exactly Matched: %d/%d | Accuracy: %.2f%% | CER: %.2f%% | Avg Latency: %.2fms",
                t37_correct, total, t37_acc, t37_cer, t37_lat)

    # =========================================================================
    # Write Strict Benchmark Report
    # =========================================================================
    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "evaluation_type": "Strict Predicted Label vs Ground Truth Test Label Matching",
        "dataset": {
            "name": "uTHCD (Tamil Handwritten Character Dataset)",
            "split": "GroundTruth-Test.csv",
            "samples_tested": total,
            "classes": 156
        },
        "models": {
            "tesseract_primary": {
                "name": "Tesseract OCR (Primary Model - lang='tam')",
                "role": "Primary OCR Engine",
                "engine": "pytesseract + LSTM Engine (UB-Mannheim 5.4.0)",
                "language": "Tamil (tam)",
                "samples_evaluated": total,
                "exactly_matched_labels": tess_correct,
                "character_accuracy": round(tess_acc, 2),
                "character_error_rate_cer": round(tess_cer, 2),
                "word_error_rate_wer": round(tess_wer, 2),
                "inference_latency_ms": round(tess_lat, 2),
                "status": "Active Primary"
            },
            "t3_7_tamilcnn": {
                "name": "T3.7 TamilCNN (Secondary Model)",
                "role": "Secondary Character Classifier",
                "architecture": "4 ConvBlocks + 2 Dense Layers (2.56M Parameters)",
                "samples_evaluated": total,
                "exactly_matched_labels": t37_correct,
                "character_accuracy": round(t37_acc, 2),
                "character_error_rate_cer": round(t37_cer, 2),
                "word_error_rate_wer": round(t37_wer, 2),
                "inference_latency_ms": round(t37_lat, 2),
                "status": "Secondary Available"
            }
        },
        "summary": {
            "primary_model": "Tesseract OCR (lang='tam')",
            "primary_accuracy": f"{round(tess_acc, 2)}%",
            "secondary_accuracy": f"{round(t37_acc, 2)}%",
            "note": "Accuracies computed exclusively from direct label-to-label comparisons on genuine test samples without inflated theoretical estimates."
        }
    }

    out_file = DATA_DIR / "model_comparison_report.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    logger.info("Saved verified evaluation report to: %s", out_file)
    logger.info("==================================================================")
    return report


if __name__ == "__main__":
    run_strict_evaluation(num_samples=100)
