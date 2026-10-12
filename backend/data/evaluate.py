"""
Empirical Model Evaluation Script for Tamil Script Recognition.
Evaluates the model on the held-out test dataset without data leakage.
Computes:
  - Top-1 Classification Accuracy (%)
  - Top-5 Classification Accuracy (%)
  - Character Error Rate (CER) via Levenshtein / jiwer
  - Word Error Rate (WER)
  - Inference Latency per sample (ms)
Outputs formal evaluation report JSON.
"""

import json
import time
import cv2
import numpy as np
import torch
import torch.nn.functional as F
from pathlib import Path
from typing import Dict, Any, List
import logging
import jiwer

from app.config import DATA_DIR, DEVICE
from app.models.t37_model import load_tamil_model, get_model_metadata
from app.models.tamil_charset import TAMIL_156_CLASSES, get_char

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TamilOCR.Evaluation")


def run_evaluation() -> Dict[str, Any]:
    test_json_path = DATA_DIR / "splits" / "test.json"
    if not test_json_path.exists():
        raise FileNotFoundError(f"Test split not found at {test_json_path}. Run dataset_prep.py first.")

    with open(test_json_path, "r", encoding="utf-8") as f:
        test_samples = json.load(f)

    logger.info("Loaded %d held-out test samples.", len(test_samples))

    # Load Model
    model = load_tamil_model(device=DEVICE)
    model.eval()

    correct_top1 = 0
    correct_top5 = 0
    total = len(test_samples)

    ground_truths = []
    predictions = []
    latencies = []

    class_accuracies = {}

    start_eval_time = time.perf_counter()

    for idx, item in enumerate(test_samples):
        img_rel_path = item["image_path"]
        img_full_path = DATA_DIR / img_rel_path
        true_label = item["label"]
        true_class_idx = item["class_index"]

        # Read image
        img = cv2.imread(str(img_full_path), cv2.IMREAD_GRAYSCALE)
        if img is None:
            continue

        if img.shape != (64, 64):
            img = cv2.resize(img, (64, 64))

        # Convert to tensor (1, 1, 64, 64) with [-1, 1] normalization matching training
        norm = ((img.astype(np.float32) / 255.0) - 0.5) / 0.5
        tensor = torch.from_numpy(norm).unsqueeze(0).unsqueeze(0).to(DEVICE)

        t0 = time.perf_counter()
        with torch.no_grad():
            logits = model(tensor)
            probs = F.softmax(logits, dim=1)
            pred_top1 = torch.argmax(probs, dim=1).item()
            pred_top5 = torch.topk(probs, 5, dim=1).indices.squeeze().tolist()
        t1 = time.perf_counter()

        latencies.append((t1 - t0) * 1000)

        pred_char = get_char(pred_top1)
        ground_truths.append(true_label)
        predictions.append(pred_char)

        if pred_top1 == true_class_idx:
            correct_top1 += 1
        if true_class_idx in pred_top5:
            correct_top5 += 1

        if true_label not in class_accuracies:
            class_accuracies[true_label] = {"correct": 0, "total": 0}
        class_accuracies[true_label]["total"] += 1
        if pred_top1 == true_class_idx:
            class_accuracies[true_label]["correct"] += 1

    total_eval_duration = time.perf_counter() - start_eval_time

    # Compute Metrics
    top1_acc = round((correct_top1 / total) * 100.0, 2)
    top5_acc = round((correct_top5 / total) * 100.0, 2)
    avg_latency_ms = round(float(np.mean(latencies)), 2)

    # Character Error Rate (CER) and Word Error Rate (WER) using jiwer
    cer = round(float(jiwer.cer(ground_truths, predictions)) * 100.0, 2)
    wer = round(float(jiwer.wer(ground_truths, predictions)) * 100.0, 2)

    # Target compliance check
    target_met = top1_acc >= 90.0 or (100.0 - cer) >= 90.0

    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model": get_model_metadata(),
        "dataset": {
            "name": "Held-Out Tamil Handwritten Test Dataset (156 Classes)",
            "test_samples_count": total,
            "classes_evaluated": len(class_accuracies)
        },
        "metrics": {
            "top1_accuracy_percent": top1_acc,
            "top5_accuracy_percent": top5_acc,
            "character_error_rate_cer_percent": cer,
            "word_error_rate_wer_percent": wer,
            "exact_match_accuracy_percent": top1_acc,
            "target_threshold_percent": 90.0,
            "target_achieved": target_met,
            "average_inference_latency_ms": avg_latency_ms,
            "total_eval_time_seconds": round(total_eval_duration, 2)
        },
        "sample_predictions": [
            {"ground_truth": ground_truths[i], "prediction": predictions[i], "match": ground_truths[i] == predictions[i]}
            for i in range(min(20, len(ground_truths)))
        ]
    }

    report_path = DATA_DIR / "evaluation_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    logger.info(
        "\n=================== EVALUATION RESULTS ===================\n"
        "Held-Out Test Samples: %d\n"
        "Top-1 Accuracy:        %.2f%%\n"
        "Top-5 Accuracy:        %.2f%%\n"
        "Character Error Rate:  %.2f%%\n"
        "Word Error Rate:       %.2f%%\n"
        "Average CPU Latency:   %.2f ms / sample\n"
        "Target Status (>=90%%):  %s\n"
        "==========================================================",
        total, top1_acc, top5_acc, cer, wer, avg_latency_ms,
        "PASSED (>= 90%)" if target_met else "FAILED"
    )

    return report


if __name__ == "__main__":
    run_evaluation()
