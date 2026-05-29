

#!/usr/bin/env python3
"""
Train the COS30049 CTIP activity classifier on the local ctip_activity_v2 dataset.

Expected dataset layout:

datasets/ctip_activity_v2/
  train_ready/
    positive/
      plucking_plant_positive/      or plucking_plant/
      touching_wildlife_positive/   or touching_wildlife/
    negative/
      hand_green/
      near_plant/
      near_wildlife/
      normal_nature/

This script intentionally trains three final classes:
  0. negative
  1. plucking_plant
  2. touching_wildlife

Manual-review images are ignored.
"""

from __future__ import annotations

import argparse
import csv
import json
import random
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple

import torch
from PIL import Image, ImageFile, UnidentifiedImageError
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms

ImageFile.LOAD_TRUNCATED_IMAGES = True

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
CLASS_NAMES = ["negative", "plucking_plant", "touching_wildlife"]


@dataclass(frozen=True)
class ImageRecord:
    path: Path
    label: int


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train CTIP activity classifier.")
    parser.add_argument(
        "--data-root",
        type=Path,
        default=Path("datasets/ctip_activity_v2"),
        help="Dataset root. Default: datasets/ctip_activity_v2",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("artifacts/ctip_activity_v2"),
        help="Output folder for model and reports. Default: artifacts/ctip_activity_v2",
    )
    parser.add_argument("--epochs", type=int, default=18, help="Training epochs. Default: 18")
    parser.add_argument("--batch-size", type=int, default=24, help="Batch size. Default: 24")
    parser.add_argument("--image-size", type=int, default=224, help="Input image size. Default: 224")
    parser.add_argument("--lr", type=float, default=3e-4, help="Learning rate. Default: 3e-4")
    parser.add_argument("--weight-decay", type=float, default=1e-4, help="Weight decay. Default: 1e-4")
    parser.add_argument("--val-ratio", type=float, default=0.2, help="Validation split ratio. Default: 0.2")
    parser.add_argument("--seed", type=int, default=42, help="Random seed. Default: 42")
    parser.add_argument(
        "--num-workers",
        type=int,
        default=0,
        help="DataLoader workers. Use 0 on macOS for fewer issues. Default: 0",
    )
    parser.add_argument(
        "--no-pretrained",
        action="store_true",
        help="Train MobileNetV3-Small without ImageNet weights.",
    )
    return parser.parse_args()


def choose_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def iter_images(folder: Path) -> Iterable[Path]:
    if not folder.exists():
        return []
    return (
        path
        for path in folder.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS and not path.name.startswith("._")
    )


def existing_dirs(*candidates: Path) -> List[Path]:
    return [path for path in candidates if path.exists() and path.is_dir()]


def collect_records(data_root: Path) -> List[ImageRecord]:
    train_ready = data_root / "train_ready"
    positive = train_ready / "positive"
    negative = train_ready / "negative"

    negative_dirs = existing_dirs(
        negative / "hand_green",
        negative / "near_plant",
        negative / "near_wildlife",
        negative / "normal_nature",
    )
    plucking_dirs = existing_dirs(
        positive / "plucking_plant",
        positive / "plucking_plant_positive",
    )
    wildlife_dirs = existing_dirs(
        positive / "touching_wildlife",
        positive / "touching_wildlife_positive",
    )

    class_dirs = {
        0: negative_dirs,
        1: plucking_dirs,
        2: wildlife_dirs,
    }

    records: List[ImageRecord] = []
    for label, folders in class_dirs.items():
        for folder in folders:
            records.extend(ImageRecord(path=path, label=label) for path in iter_images(folder))

    if not records:
        raise FileNotFoundError(
            f"No images found under {train_ready}. Check your dataset folder structure."
        )

    return records


def validate_images(records: Sequence[ImageRecord]) -> Tuple[List[ImageRecord], List[Tuple[str, str]]]:
    valid: List[ImageRecord] = []
    invalid: List[Tuple[str, str]] = []

    for record in records:
        try:
            with Image.open(record.path) as image:
                image.verify()
            valid.append(record)
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            invalid.append((str(record.path), str(exc)))

    return valid, invalid


def stratified_split(
    records: Sequence[ImageRecord], val_ratio: float, seed: int
) -> Tuple[List[ImageRecord], List[ImageRecord]]:
    rng = random.Random(seed)
    by_label: Dict[int, List[ImageRecord]] = {index: [] for index in range(len(CLASS_NAMES))}
    for record in records:
        by_label[record.label].append(record)

    train: List[ImageRecord] = []
    val: List[ImageRecord] = []

    for label, items in by_label.items():
        rng.shuffle(items)
        val_count = max(1, int(round(len(items) * val_ratio))) if len(items) > 1 else 0
        val.extend(items[:val_count])
        train.extend(items[val_count:])
        print(
            f"Class {label} ({CLASS_NAMES[label]}): total={len(items)}, "
            f"train={len(items) - val_count}, val={val_count}"
        )

    rng.shuffle(train)
    rng.shuffle(val)
    return train, val


class ActivityDataset(Dataset):
    def __init__(self, records: Sequence[ImageRecord], transform: transforms.Compose):
        self.records = list(records)
        self.transform = transform

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, index: int) -> Tuple[torch.Tensor, int]:
        record = self.records[index]
        with Image.open(record.path) as image:
            image = image.convert("RGB")
        return self.transform(image), record.label


def build_transforms(image_size: int) -> Tuple[transforms.Compose, transforms.Compose]:
    train_tfms = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(degrees=8),
            transforms.ColorJitter(brightness=0.18, contrast=0.18, saturation=0.14, hue=0.03),
            transforms.RandomAffine(degrees=0, translate=(0.04, 0.04), scale=(0.92, 1.08)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )
    val_tfms = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )
    return train_tfms, val_tfms


def build_model(num_classes: int, pretrained: bool = True) -> nn.Module:
    if pretrained:
        weights = models.MobileNet_V3_Small_Weights.DEFAULT
        model = models.mobilenet_v3_small(weights=weights)
    else:
        model = models.mobilenet_v3_small(weights=None)

    in_features = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(in_features, num_classes)
    return model


def class_weights(records: Sequence[ImageRecord], device: torch.device) -> torch.Tensor:
    counts = torch.zeros(len(CLASS_NAMES), dtype=torch.float32)
    for record in records:
        counts[record.label] += 1
    weights = counts.sum() / (len(CLASS_NAMES) * counts.clamp_min(1))
    return weights.to(device)


def run_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
    optimizer: torch.optim.Optimizer | None = None,
) -> Tuple[float, float, List[int], List[int]]:
    is_train = optimizer is not None
    model.train(is_train)

    total_loss = 0.0
    total_correct = 0
    total_items = 0
    y_true: List[int] = []
    y_pred: List[int] = []

    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)

        if is_train:
            optimizer.zero_grad(set_to_none=True)

        with torch.set_grad_enabled(is_train):
            logits = model(images)
            loss = criterion(logits, labels)
            if is_train:
                loss.backward()
                optimizer.step()

        predictions = logits.argmax(dim=1)
        batch_size = labels.size(0)
        total_loss += float(loss.item()) * batch_size
        total_correct += int((predictions == labels).sum().item())
        total_items += batch_size
        y_true.extend(labels.detach().cpu().tolist())
        y_pred.extend(predictions.detach().cpu().tolist())

    avg_loss = total_loss / max(total_items, 1)
    accuracy = total_correct / max(total_items, 1)
    return avg_loss, accuracy, y_true, y_pred


def macro_f1(y_true: Sequence[int], y_pred: Sequence[int], num_classes: int) -> float:
    scores: List[float] = []
    for label in range(num_classes):
        tp = sum(1 for actual, pred in zip(y_true, y_pred) if actual == label and pred == label)
        fp = sum(1 for actual, pred in zip(y_true, y_pred) if actual != label and pred == label)
        fn = sum(1 for actual, pred in zip(y_true, y_pred) if actual == label and pred != label)
        precision = tp / (tp + fp) if (tp + fp) else 0.0
        recall = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
        scores.append(f1)
    return sum(scores) / len(scores)


def confusion_matrix(y_true: Sequence[int], y_pred: Sequence[int], num_classes: int) -> List[List[int]]:
    matrix = [[0 for _ in range(num_classes)] for _ in range(num_classes)]
    for actual, pred in zip(y_true, y_pred):
        matrix[actual][pred] += 1
    return matrix


def save_manifest(records: Sequence[ImageRecord], output_path: Path) -> None:
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["path", "label", "class_name"])
        for record in records:
            writer.writerow([str(record.path), record.label, CLASS_NAMES[record.label]])


def main() -> None:
    args = parse_args()
    random.seed(args.seed)
    torch.manual_seed(args.seed)

    device = choose_device()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Dataset root: {args.data_root.resolve()}")
    print(f"Output dir:   {args.output_dir.resolve()}")
    print(f"Device:       {device}")

    records = collect_records(args.data_root)
    records, invalid = validate_images(records)
    if invalid:
        invalid_path = args.output_dir / "invalid_images.csv"
        with invalid_path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(["path", "error"])
            writer.writerows(invalid)
        print(f"Skipped {len(invalid)} invalid images. See {invalid_path}")

    train_records, val_records = stratified_split(records, args.val_ratio, args.seed)
    if not train_records or not val_records:
        raise RuntimeError("Train/validation split failed. Check dataset counts.")

    save_manifest(train_records, args.output_dir / "train_manifest.csv")
    save_manifest(val_records, args.output_dir / "val_manifest.csv")

    train_tfms, val_tfms = build_transforms(args.image_size)
    train_loader = DataLoader(
        ActivityDataset(train_records, train_tfms),
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.num_workers,
        pin_memory=device.type == "cuda",
    )
    val_loader = DataLoader(
        ActivityDataset(val_records, val_tfms),
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.num_workers,
        pin_memory=device.type == "cuda",
    )

    model = build_model(num_classes=len(CLASS_NAMES), pretrained=not args.no_pretrained).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights(train_records, device))
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=max(args.epochs, 1))

    best_macro_f1 = -1.0
    best_path = args.output_dir / "best_ctip_activity_v2_mobilenet.pt"
    history: List[Dict[str, float]] = []
    started_at = time.time()

    for epoch in range(1, args.epochs + 1):
        train_loss, train_acc, _, _ = run_epoch(model, train_loader, criterion, device, optimizer)
        val_loss, val_acc, y_true, y_pred = run_epoch(model, val_loader, criterion, device)
        val_macro_f1 = macro_f1(y_true, y_pred, len(CLASS_NAMES))
        scheduler.step()

        row = {
            "epoch": epoch,
            "train_loss": train_loss,
            "train_accuracy": train_acc,
            "val_loss": val_loss,
            "val_accuracy": val_acc,
            "val_macro_f1": val_macro_f1,
            "learning_rate": scheduler.get_last_lr()[0],
        }
        history.append(row)

        print(
            f"Epoch {epoch:02d}/{args.epochs} | "
            f"train_loss={train_loss:.4f} train_acc={train_acc:.3f} | "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.3f} val_macro_f1={val_macro_f1:.3f}"
        )

        if val_macro_f1 > best_macro_f1:
            best_macro_f1 = val_macro_f1
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "class_names": CLASS_NAMES,
                    "image_size": args.image_size,
                    "architecture": "mobilenet_v3_small",
                    "val_macro_f1": val_macro_f1,
                    "val_accuracy": val_acc,
                },
                best_path,
            )
            print(f"  Saved best model: {best_path}")

    final_loss, final_acc, y_true, y_pred = run_epoch(model, val_loader, criterion, device)
    final_macro_f1 = macro_f1(y_true, y_pred, len(CLASS_NAMES))
    matrix = confusion_matrix(y_true, y_pred, len(CLASS_NAMES))

    metrics = {
        "class_names": CLASS_NAMES,
        "device": str(device),
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "image_size": args.image_size,
        "train_count": len(train_records),
        "val_count": len(val_records),
        "best_val_macro_f1": best_macro_f1,
        "final_val_loss": final_loss,
        "final_val_accuracy": final_acc,
        "final_val_macro_f1": final_macro_f1,
        "confusion_matrix": matrix,
        "runtime_seconds": round(time.time() - started_at, 2),
        "history": history,
    }

    (args.output_dir / "class_names.json").write_text(json.dumps(CLASS_NAMES, indent=2), encoding="utf-8")
    (args.output_dir / "training_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print("\nTraining complete.")
    print(f"Best model: {best_path}")
    print(f"Best validation macro F1: {best_macro_f1:.4f}")
    print("Confusion matrix rows=true, columns=pred:")
    for name, row in zip(CLASS_NAMES, matrix):
        print(f"  {name:17s} {row}")


if __name__ == "__main__":
    main()