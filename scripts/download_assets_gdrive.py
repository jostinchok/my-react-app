#!/usr/bin/env python3
"""Download and extract local-only COS30049 AI/CV assets from Google Drive."""

from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
import shutil
import subprocess
import sys
import zipfile


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DOWNLOAD_TMP = PROJECT_ROOT / ".asset-download-tmp"

ASSET_PACKAGES = {
    "alerts.zip": "alerts",
    "artifacts.zip": "artifacts",
    "datasets.zip": "datasets",
    "models.zip": "models",
}

SAFE_RUNTIME_DIRS = [
    Path("alerts/ai"),
    Path("alerts/iot"),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download and extract COS30049 local-only AI/CV assets from Google Drive."
    )
    parser.add_argument(
        "--url",
        required=True,
        help="Google Drive folder URL that contains alerts.zip, artifacts.zip, datasets.zip, and models.zip.",
    )
    parser.add_argument(
        "--keep-tmp",
        action="store_true",
        help="Keep the temporary Google Drive download folder after extraction.",
    )
    parser.add_argument(
        "--skip-check",
        action="store_true",
        help="Skip running scripts/check_required_assets.py after extraction.",
    )
    parser.add_argument(
        "--no-overwrite",
        action="store_true",
        help="Do not overwrite existing local asset files.",
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


def should_skip_path(path: Path) -> bool:
    ignored_parts = {"__MACOSX", ".git"}
    ignored_names = {".DS_Store", "Thumbs.db"}

    return any(part in ignored_parts for part in path.parts) or path.name in ignored_names


def find_downloaded_file(filename: str, search_root: Path) -> Path | None:
    direct = search_root / filename
    if direct.is_file():
        return direct

    for candidate in search_root.rglob(filename):
        if candidate.is_file() and not should_skip_path(candidate):
            return candidate

    return None


def find_downloaded_folder(folder_name: str, search_root: Path) -> Path | None:
    direct = search_root / folder_name
    if direct.is_dir():
        return direct

    for candidate in search_root.rglob(folder_name):
        if candidate.is_dir() and not should_skip_path(candidate):
            return candidate

    return None


def safe_extract_zip(zip_path: Path, destination: Path) -> int:
    destination.mkdir(parents=True, exist_ok=True)
    destination_resolved = destination.resolve()

    extracted_files = 0

    with zipfile.ZipFile(zip_path) as archive:
        for member in archive.infolist():
            target = destination / member.filename

            try:
                target.resolve().relative_to(destination_resolved)
            except ValueError as exc:
                raise RuntimeError(f"Unsafe ZIP path detected: {member.filename}") from exc

        for member in archive.infolist():
            if should_skip_path(Path(member.filename)):
                continue

            archive.extract(member, destination)

            if not member.is_dir():
                extracted_files += 1

    return extracted_files


def copy_tree(source: Path, destination: Path, overwrite: bool) -> tuple[int, int, int]:
    copied = 0
    overwritten = 0
    skipped = 0

    destination.mkdir(parents=True, exist_ok=True)

    for item in source.rglob("*"):
        if should_skip_path(item):
            continue

        relative_item = item.relative_to(source)
        target = destination / relative_item

        if item.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue

        if item.is_file():
            target.parent.mkdir(parents=True, exist_ok=True)

            if target.exists() and not overwrite:
                skipped += 1
                continue

            if target.exists() and overwrite:
                overwritten += 1
            else:
                copied += 1

            shutil.copy2(item, target)

    return copied, overwritten, skipped


def install_zip_package(zip_path: Path, target_folder_name: str, overwrite: bool) -> tuple[int, int, int]:
    extract_parent = DOWNLOAD_TMP / "_extract"
    extract_target = extract_parent / target_folder_name

    if extract_target.exists():
        shutil.rmtree(extract_target)

    extract_target.mkdir(parents=True, exist_ok=True)

    extracted_files = safe_extract_zip(zip_path, extract_target)
    print(f"[OK] Extracted {zip_path.name} ({extracted_files} files)")

    nested_folder = extract_target / target_folder_name
    source_folder = nested_folder if nested_folder.is_dir() else extract_target
    destination_folder = PROJECT_ROOT / target_folder_name

    return copy_tree(source_folder, destination_folder, overwrite=overwrite)


def install_folder_package(source_folder: Path, target_folder_name: str, overwrite: bool) -> tuple[int, int, int]:
    destination_folder = PROJECT_ROOT / target_folder_name
    return copy_tree(source_folder, destination_folder, overwrite=overwrite)


def run_asset_check() -> int:
    check_script = PROJECT_ROOT / "scripts/check_required_assets.py"

    if not check_script.is_file():
        print("\n[WARN] scripts/check_required_assets.py was not found. Skipping asset check.")
        return 0

    return subprocess.run([sys.executable, str(check_script)], cwd=PROJECT_ROOT).returncode


def print_next_steps() -> None:
    print("\nNext steps:")
    print("  cp .env.example .env")
    print("  # Edit .env with local MySQL and token values.")
    print("  mysql -u root -p -e \"CREATE DATABASE IF NOT EXISTS cos30049_assignment;\"")
    print("  mysql -u root -p -e \"CREATE DATABASE IF NOT EXISTS park_guide_database;\"")
    print("  mysql -u root -p cos30049_assignment < user_login/server/migrations/001_create_monitoring_incident_tables.sql")
    print("  mysql -u root -p park_guide_database < database/db.sql")
    print("  mysql -u root -p park_guide_database < user_login/server/migrations/002_training_platform_tables.sql")
    print("  mysql -u root -p park_guide_database < user_login/server/migrations/003_canvas_module_items.sql")
    print("  mysql -u root -p park_guide_database < user_login/server/migrations/004_canvas_learning_progress.sql")
    print("  mysql -u root -p park_guide_database < database/demo_canvas_courses.sql")
    print("  python3 scripts/check_required_assets.py")
    print("  npm run dev")


def main() -> int:
    args = parse_args()
    drive_url = args.url.strip()

    if not drive_url or drive_url == "<GOOGLE_DRIVE_FOLDER_URL>":
        print("Replace <GOOGLE_DRIVE_FOLDER_URL> with the shared Google Drive folder link.")
        print("Expected folder:")
        print("  https://drive.google.com/drive/folders/1CQjiJNnVJYRK3W0qHI2qcUDwjG2cA0qV?usp=sharing")
        return 1

    require_gdown()

    DOWNLOAD_TMP.mkdir(parents=True, exist_ok=True)
    run_id = datetime.now().strftime("%Y%m%d-%H%M%S")
    download_target = DOWNLOAD_TMP / run_id
    download_target.mkdir(parents=True, exist_ok=True)

    overwrite = not args.no_overwrite

    print(f"Project root: {PROJECT_ROOT}")
    print(f"Download target: {download_target}")
    print("This script does not touch .git and does not commit anything.")
    print("")

    result = subprocess.run(
        [sys.executable, "-m", "gdown", "--folder", drive_url, "-O", str(download_target)],
        cwd=PROJECT_ROOT,
    )

    if result.returncode != 0:
        print("\nGoogle Drive download failed.")
        print("If the folder is private, set it to 'Anyone with the link can view' or download the ZIP files manually.")
        return result.returncode

    missing_packages: list[str] = []

    print("\nInstalling local asset packages:")

    for zip_name, target_folder_name in ASSET_PACKAGES.items():
        zip_path = find_downloaded_file(zip_name, download_target)

        if zip_path is not None:
            copied, overwritten, skipped = install_zip_package(
                zip_path=zip_path,
                target_folder_name=target_folder_name,
                overwrite=overwrite,
            )
            print(
                f"[OK] Installed {target_folder_name}/ "
                f"copied={copied}, overwritten={overwritten}, skipped={skipped}"
            )
            continue

        fallback_folder = find_downloaded_folder(target_folder_name, download_target)

        if fallback_folder is not None:
            copied, overwritten, skipped = install_folder_package(
                source_folder=fallback_folder,
                target_folder_name=target_folder_name,
                overwrite=overwrite,
            )
            print(
                f"[OK] Installed {target_folder_name}/ from folder "
                f"copied={copied}, overwritten={overwritten}, skipped={skipped}"
            )
            continue

        print(f"[FAIL] Missing {zip_name} or {target_folder_name}/ in Google Drive download")
        missing_packages.append(zip_name)

    for runtime_dir in SAFE_RUNTIME_DIRS:
        absolute = PROJECT_ROOT / runtime_dir
        absolute.mkdir(parents=True, exist_ok=True)
        print(f"[OK] Ensured {runtime_dir.as_posix()}")

    if missing_packages:
        print("\nSome required asset packages were not found:")
        for package in missing_packages:
            print(f"  - {package}")

        print("\nThe Google Drive folder should contain:")
        for package in ASSET_PACKAGES:
            print(f"  - {package}")

        return 1

    check_status = 0

    if not args.skip_check:
        print("\nRunning asset check...")
        check_status = run_asset_check()

    print_next_steps()

    if not args.keep_tmp:
        shutil.rmtree(download_target, ignore_errors=True)
        print(f"\n[OK] Removed temporary download folder: {download_target}")
    else:
        print(f"\n[INFO] Temporary download folder kept: {download_target}")

    return check_status


if __name__ == "__main__":
    sys.exit(main())