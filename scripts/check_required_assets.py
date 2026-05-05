#!/usr/bin/env python3
"""Check local-only COS30049 AI/CV assets for the demo repo."""

from __future__ import annotations

from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    Path("artifacts/clip_2class_touching_species.pt"),
    Path("models/hand_landmarker.task"),
    Path(".env"),
]

REQUIRED_DIRS = [
    Path("datasets/touching-plants"),
    Path("datasets/touching-wildlife"),
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


def print_fix_commands(missing: list[Path]) -> None:
    if not missing:
        return

    print("\nFix missing local assets:")
    print("  python3 -m pip install gdown")
    print('  python3 scripts/download_assets_gdrive.py --url "<GOOGLE_DRIVE_FOLDER_URL>"')
    print("  python3 scripts/check_required_assets.py")

    if Path(".env") in missing:
        print("\nCreate local backend environment file:")
        print("  cp .env.example .env")
        print("  # Then edit .env with local MySQL/token values.")

    print("\nManual fallback:")
    print("  Download artifacts/, models/, and datasets/ from Google Drive")
    print("  and place those folders directly inside this my-react-app folder.")


def main() -> int:
    print("COS30049 local asset check")
    print(f"Project root: {PROJECT_ROOT}")
    print("")

    missing: list[Path] = []

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

    print("")

    for file_path in REQUIRED_FILES:
        absolute = PROJECT_ROOT / file_path
        if absolute.is_file():
            size_note = ""
            if file_path.match("artifacts/*") or file_path.match("models/*"):
                size_note = f" ({human_size(absolute.stat().st_size)})"
            print(f"[PASS] Found {relative(file_path)}{size_note}")
        else:
            print(f"[FAIL] Missing {relative(file_path)}")
            missing.append(file_path)

    for folder_path in REQUIRED_DIRS:
        absolute = PROJECT_ROOT / folder_path
        if absolute.is_dir():
            image_count = count_images(absolute)
            print(f"[PASS] Found {relative(folder_path)} ({image_count} image files)")
        else:
            print(f"[FAIL] Missing {relative(folder_path)}")
            missing.append(folder_path)

    env_example = PROJECT_ROOT / ".env.example"
    env_file = PROJECT_ROOT / ".env"
    if env_example.is_file() and not env_file.is_file():
        print("\n[WARN] .env.example exists but .env is missing.")

    print_fix_commands(missing)

    if missing:
        print("\nAsset check failed. Missing local-only demo requirements are listed above.")
        return 1

    print("\nAsset check passed. Local AI/CV assets and root .env are ready.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
