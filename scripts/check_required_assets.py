#!/usr/bin/env python3
"""Check local-only COS30049 AI/CV assets for the demo repo."""

from __future__ import annotations

from pathlib import Path
import sys


def find_project_root(start: Path) -> Path:
    """Find the repository root from this script location."""
    current = start.resolve()

    for folder in [current, *current.parents]:
        if (folder / "package.json").is_file() and (folder / "README.md").is_file():
            return folder

    # Expected location is my-react-app/scripts/check_required_assets.py
    return Path(__file__).resolve().parents[1]


PROJECT_ROOT = find_project_root(Path(__file__).parent)

REQUIRED_FILES = [
    Path("artifacts/ctip_activity_v2/best_ctip_activity_v2_mobilenet.pt"),
    Path("artifacts/ctip_activity_v2/class_names.json"),
    Path("artifacts/ctip_activity_v2/final_model_evaluation.txt"),
    Path("artifacts/ctip_activity_v2/train_manifest.csv"),
    Path("artifacts/ctip_activity_v2/training_metrics.json"),
    Path("artifacts/ctip_activity_v2/val_manifest.csv"),
    Path("models/hand_landmarker.task"),
    Path(".env"),
]

REQUIRED_DATASET_DIRS = [
    Path("datasets/ctip_activity_v2/train_ready/negative/hand_green"),
    Path("datasets/ctip_activity_v2/train_ready/negative/near_plant"),
    Path("datasets/ctip_activity_v2/train_ready/negative/near_wildlife"),
    Path("datasets/ctip_activity_v2/train_ready/negative/normal_nature"),
    Path("datasets/ctip_activity_v2/train_ready/positive/plucking_plant_positive"),
    Path("datasets/ctip_activity_v2/train_ready/positive/touching_wildlife_positive"),
]

SAFE_RUNTIME_DIRS = [
    Path("alerts/ai"),
    Path("alerts/iot"),
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}


def relative(path: Path) -> str:
    return path.as_posix()


def human_size(size_bytes: int) -> str:
    units = ["B", "KB", "MB", "GB"]
    size = float(size_bytes)

    for unit in units:
        if size < 1024 or unit == units[-1]:
            if unit == "B":
                return f"{int(size)} {unit}"
            return f"{size:.1f} {unit}"
        size /= 1024

    return f"{size_bytes} B"


def count_images(folder: Path) -> int:
    return sum(
        1
        for item in folder.rglob("*")
        if item.is_file() and item.suffix.lower() in IMAGE_EXTENSIONS
    )


def print_fix_commands(missing: list[Path], empty_dataset_dirs: list[Path]) -> None:
    if not missing and not empty_dataset_dirs:
        return

    print("\nFix missing local assets:")
    print("  1. Download these files from the shared Google Drive folder:")
    print("     https://drive.google.com/drive/folders/1CQjiJNnVJYRK3W0qHI2qcUDwjG2cA0qV?usp=sharing")
    print("")
    print("     alerts.zip")
    print("     artifacts.zip")
    print("     datasets.zip")
    print("     models.zip")
    print("")
    print("  2. Extract all four ZIP files into the repository root:")
    print("     my-react-app/")
    print("")
    print("  3. Run this check again:")
    print("     python3 scripts/check_required_assets.py")

    if Path(".env") in missing:
        print("\nCreate local backend environment file:")
        print("  cp .env.example .env")
        print("  # Then edit .env with local MySQL/token values.")

    print("\nExpected key paths after extraction:")
    print("  artifacts/ctip_activity_v2/best_ctip_activity_v2_mobilenet.pt")
    print("  artifacts/ctip_activity_v2/class_names.json")
    print("  datasets/ctip_activity_v2/train_ready/negative/")
    print("  datasets/ctip_activity_v2/train_ready/positive/")
    print("  models/hand_landmarker.task")
    print("  alerts/ai/")
    print("  alerts/iot/")


def main() -> int:
    print("COS30049 local asset check")
    print(f"Project root: {PROJECT_ROOT}")
    print("")

    missing: list[Path] = []
    empty_dataset_dirs: list[Path] = []

    print("Runtime evidence folders:")
    for runtime_dir in SAFE_RUNTIME_DIRS:
        absolute = PROJECT_ROOT / runtime_dir

        if not absolute.exists():
            absolute.mkdir(parents=True, exist_ok=True)
            print(f"[CREATED] {relative(runtime_dir)}")
        elif absolute.is_dir():
            print(f"[PASS] Found {relative(runtime_dir)}")
        else:
            print(f"[FAIL] {relative(runtime_dir)} exists but is not a folder")
            missing.append(runtime_dir)

    print("\nRequired files:")
    for file_path in REQUIRED_FILES:
        absolute = PROJECT_ROOT / file_path

        if absolute.is_file():
            size_note = ""
            if file_path.parts[0] in {"artifacts", "models"}:
                size_note = f" ({human_size(absolute.stat().st_size)})"
            print(f"[PASS] Found {relative(file_path)}{size_note}")
        else:
            print(f"[FAIL] Missing {relative(file_path)}")
            missing.append(file_path)

    print("\nRequired dataset folders:")
    total_images = 0

    for folder_path in REQUIRED_DATASET_DIRS:
        absolute = PROJECT_ROOT / folder_path

        if absolute.is_dir():
            image_count = count_images(absolute)
            total_images += image_count

            if image_count == 0:
                print(f"[WARN] Found {relative(folder_path)}, but it contains 0 image files")
                empty_dataset_dirs.append(folder_path)
            else:
                print(f"[PASS] Found {relative(folder_path)} ({image_count} image files)")
        else:
            print(f"[FAIL] Missing {relative(folder_path)}")
            missing.append(folder_path)

    print(f"\nTotal dataset images found: {total_images}")

    env_example = PROJECT_ROOT / ".env.example"
    env_file = PROJECT_ROOT / ".env"

    if env_example.is_file() and not env_file.is_file():
        print("\n[WARN] .env.example exists but .env is missing.")

    print_fix_commands(missing, empty_dataset_dirs)

    if missing:
        print("\nAsset check failed. Missing local-only demo requirements are listed above.")
        return 1

    if empty_dataset_dirs:
        print("\nAsset check completed with warnings. Some dataset folders contain no image files.")
        return 0

    print("\nAsset check passed. Local AI/CV assets and root .env are ready.")
    return 0


if __name__ == "__main__":
    sys.exit(main())