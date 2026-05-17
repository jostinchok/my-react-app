#!/usr/bin/env python3
"""Download local-only AI/CV assets from a Google Drive folder."""

from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
import shutil
import subprocess
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DOWNLOAD_TMP = PROJECT_ROOT / ".asset-download-tmp"
ASSET_FOLDERS = ["artifacts", "models", "datasets"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download COS30049 local-only AI/CV assets from Google Drive."
    )
    parser.add_argument(
        "--url",
        required=True,
        help='Google Drive folder URL, for example "<GOOGLE_DRIVE_FOLDER_URL>".',
    )
    return parser.parse_args()


def require_gdown() -> None:
    try:
        import gdown  # noqa: F401
    except ImportError:
        print("gdown is required for Google Drive folder downloads.")
        print("Install it with:")
        print("  python -m pip install gdown")
        sys.exit(1)


def find_downloaded_folder(name: str, search_root: Path) -> Path | None:
    direct = search_root / name
    if direct.is_dir():
        return direct

    for candidate in search_root.rglob(name):
        if candidate.is_dir() and ".git" not in candidate.parts:
            return candidate
    return None


def copy_preserving_existing(source: Path, destination: Path) -> tuple[int, int]:
    copied = 0
    skipped = 0
    destination.mkdir(parents=True, exist_ok=True)

    for item in source.rglob("*"):
        relative_item = item.relative_to(source)
        target = destination / relative_item

        if item.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue

        if item.is_file():
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.exists():
                skipped += 1
                continue
            shutil.copy2(item, target)
            copied += 1

    return copied, skipped


def run_asset_check() -> int:
    check_script = PROJECT_ROOT / "scripts/check_required_assets.py"
    return subprocess.run([sys.executable, str(check_script)], cwd=PROJECT_ROOT).returncode


def main() -> int:
    args = parse_args()
    if args.url.strip() == "<GOOGLE_DRIVE_FOLDER_URL>":
        print("Replace <GOOGLE_DRIVE_FOLDER_URL> with the shared Google Drive folder link.")
        print("If the folder is private, set it to 'Anyone with the link can view' or download manually.")
        return 1

    require_gdown()

    DOWNLOAD_TMP.mkdir(parents=True, exist_ok=True)
    run_id = datetime.now().strftime("%Y%m%d-%H%M%S")
    download_target = DOWNLOAD_TMP / run_id
    download_target.mkdir(parents=True, exist_ok=True)

    print(f"Project root: {PROJECT_ROOT}")
    print(f"Downloading Google Drive folder into: {download_target}")
    print("This script never touches .git and does not commit anything.")

    result = subprocess.run(
        [sys.executable, "-m", "gdown", "--folder", args.url, "-O", str(download_target)],
        cwd=PROJECT_ROOT,
    )
    if result.returncode != 0:
        print("\nGoogle Drive download failed.")
        print("If the folder is private, set it to 'Anyone with the link can view' or download manually.")
        return result.returncode

    for folder_name in ASSET_FOLDERS:
        source_folder = find_downloaded_folder(folder_name, download_target)
        destination_folder = PROJECT_ROOT / folder_name
        if source_folder is None:
            print(f"[WARN] Download did not include {folder_name}/")
            continue

        copied, skipped = copy_preserving_existing(source_folder, destination_folder)
        print(f"[OK] {folder_name}/ copied={copied}, existing-skipped={skipped}")

    for evidence_dir in [PROJECT_ROOT / "alerts/ai", PROJECT_ROOT / "alerts/iot"]:
        evidence_dir.mkdir(parents=True, exist_ok=True)
        print(f"[OK] Ensured {evidence_dir.relative_to(PROJECT_ROOT)}")

    print("\nRunning asset check...")
    check_status = run_asset_check()

    print("\nNext steps:")
    print("  cp .env.example .env")
    print("  # Edit .env with local MySQL and token values.")
    print("  mysql -u root -p < database/db.sql")
    print("  python3 scripts/check_required_assets.py")
    print("  npm run dev")

    return check_status


if __name__ == "__main__":
    sys.exit(main())
