import os
import torch
import torch.nn as nn
from pathlib import Path
from typing import Optional, Dict, Any
import logging

from app.config import MODELS_DIR, HF_MODEL_REPO, DEVICE

logger = logging.getLogger("TamilOCR.Model")


class TamilCNN(nn.Module):
    """
    Standardized Deep CNN for 156-class Tamil Handwritten Character Recognition.
    Matches the dhruv10050/t3-7-indic-recognition (tamil_best.pth) checkpoint architecture:
      - 4 Conv2d(bias=False) + BatchNorm2d + ReLU + MaxPool2d blocks
      - Flatten -> Linear(4096, 512) -> ReLU -> Dropout(0.5) -> Linear(512, 156)
    Trained on 156 Tamil character classes with 97.3% Top-1 validation accuracy.
    """
    def __init__(self, num_classes: int = 156):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(64, 128, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(128, 256, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256 * 4 * 4, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.features(x))


_cached_model: Optional[TamilCNN] = None
_model_metadata: Dict[str, Any] = {
    "name": "TamilCNN (T3.7 Indic Recognition Architecture)",
    "repo": HF_MODEL_REPO,
    "checkpoint": "tamil_best.pth",
    "classes": 156,
    "top1_validation_acc": 97.2991,
    "status": "unloaded",
    "device": DEVICE,
    "parameters": 2566012,
}


def get_checkpoint_path() -> Path:
    """Find checkpoint locally in checkpoints/ or Hugging Face cache."""
    local_path = MODELS_DIR / "tamil_best.pth"
    if local_path.exists():
        return local_path

    # Try huggingface cache or download
    try:
        from huggingface_hub import hf_hub_download
        downloaded = hf_hub_download(repo_id=HF_MODEL_REPO, filename="tamil_best.pth")
        return Path(downloaded)
    except Exception as e:
        logger.error("Failed to find or download model checkpoint: %s", e)
        raise FileNotFoundError(f"Model checkpoint not found in {local_path} and HF download failed.")


def load_tamil_model(device: str = DEVICE) -> TamilCNN:
    """Load or return cached TamilCNN model loaded with pretrained weights."""
    global _cached_model, _model_metadata

    if _cached_model is not None:
        return _cached_model

    logger.info("Initializing TamilCNN (156 classes) on device: %s", device)
    model = TamilCNN(num_classes=156)

    ckpt_path = get_checkpoint_path()
    logger.info("Loading model weights from: %s", ckpt_path)

    checkpoint = torch.load(ckpt_path, map_location=device)
    val_acc = 97.2991
    epoch = 25
    if isinstance(checkpoint, dict):
        if "val_acc" in checkpoint:
            val_acc = checkpoint["val_acc"]
        if "epoch" in checkpoint:
            epoch = checkpoint["epoch"]

        if "state_dict" in checkpoint:
            state_dict = checkpoint["state_dict"]
        elif "model_state_dict" in checkpoint:
            state_dict = checkpoint["model_state_dict"]
        elif any(k.startswith("features.") for k in checkpoint.keys()):
            state_dict = checkpoint
        else:
            raise ValueError("Unrecognized checkpoint format")
    else:
        state_dict = checkpoint

    _model_metadata["val_acc"] = float(val_acc)
    _model_metadata["epoch"] = int(epoch)

    model.load_state_dict(state_dict, strict=True)
    model.to(device)
    model.eval()

    _cached_model = model
    _model_metadata["status"] = "loaded"
    _model_metadata["device"] = device
    logger.info("TamilCNN loaded successfully! (Val Acc: %.2f%%)", _model_metadata.get("val_acc", 97.3))
    return _cached_model


def get_model_metadata() -> Dict[str, Any]:
    """Return current model metadata and training metrics."""
    return _model_metadata
