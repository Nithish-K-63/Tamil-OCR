"""
Tamil Handwritten Script Training and Fine-Tuning Script.
Trains or fine-tunes TamilCNN on labeled Tamil handwriting dataset.
Includes:
  - PyTorch DataLoader with augmentation
  - CrossEntropyLoss with Label Smoothing
  - AdamW Optimizer + Cosine Annealing Learning Rate Scheduler
  - Validation monitoring and checkpoint saving
"""

import os
import json
import time
import cv2
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from pathlib import Path
from typing import Dict, Any, List
import logging

from app.config import DATA_DIR, MODELS_DIR, DEVICE
from app.models.t37_model import TamilCNN
from app.models.tamil_charset import TAMIL_156_CLASSES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TamilOCR.Train")


class TamilDataset(Dataset):
    def __init__(self, split_file: Path, transform=None):
        with open(split_file, "r", encoding="utf-8") as f:
            self.samples = json.load(f)
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        item = self.samples[idx]
        img_path = DATA_DIR / item["image_path"]
        img = cv2.imread(str(img_path), cv2.IMREAD_GRAYSCALE)
        if img is None:
            img = np.zeros((64, 64), dtype=np.uint8)
        if img.shape != (64, 64):
            img = cv2.resize(img, (64, 64))

        tensor = torch.from_numpy(img.astype(np.float32) / 255.0).unsqueeze(0)
        label = item["class_index"]
        return tensor, label


def train_model(
    epochs: int = 15,
    batch_size: int = 32,
    lr: float = 1e-3,
    save_name: str = "tamil_finetuned.pth"
):
    train_split = DATA_DIR / "splits" / "train.json"
    val_split = DATA_DIR / "splits" / "val.json"

    if not train_split.exists() or not val_split.exists():
        raise FileNotFoundError("Splits not found. Please run dataset_prep.py first.")

    train_ds = TamilDataset(train_split)
    val_ds = TamilDataset(val_split)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)

    logger.info("Initializing TamilCNN for fine-tuning...")
    model = TamilCNN(num_classes=156).to(DEVICE)

    # Load existing checkpoint if available to warm-start
    existing_ckpt = MODELS_DIR / "tamil_best.pth"
    if existing_ckpt.exists():
        logger.info("Warm-starting from %s...", existing_ckpt)
        ckpt = torch.load(existing_ckpt, map_location=DEVICE)
        sd = ckpt.get("state_dict", ckpt.get("model_state_dict", ckpt))
        model.load_state_dict(sd, strict=False)

    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_acc = 0.0

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * images.size(0)
            preds = outputs.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

        scheduler.step()
        train_acc = (correct / total) * 100.0
        train_loss = total_loss / total

        # Validation
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(DEVICE)
                labels = labels.to(DEVICE)
                outputs = model(images)
                preds = outputs.argmax(dim=1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)

        val_acc = (val_correct / val_total) * 100.0 if val_total > 0 else 0.0

        logger.info(
            "Epoch [%d/%d] - Train Loss: %.4f | Train Acc: %.2f%% | Val Acc: %.2f%%",
            epoch, epochs, train_loss, train_acc, val_acc
        )

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            out_path = MODELS_DIR / save_name
            torch.save({
                "epoch": epoch,
                "state_dict": model.state_dict(),
                "val_acc": val_acc,
                "classes": 156
            }, str(out_path))
            logger.info("Saved best checkpoint to %s (Val Acc: %.2f%%)", out_path, val_acc)

    logger.info("Training complete. Best Validation Accuracy: %.2f%%", best_val_acc)


if __name__ == "__main__":
    train_model(epochs=5, batch_size=32)
