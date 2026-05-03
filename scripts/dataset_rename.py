from pathlib import Path

folder = Path("datasets/touching-plants")
prefix = "touching_plants"

valid_exts = [".jpg", ".jpeg", ".png", ".webp"]

# Get image files only
files = [
    f for f in folder.iterdir()
    if f.is_file() and f.suffix.lower() in valid_exts
]

# Sort by current filename
files = sorted(files, key=lambda x: x.name.lower())

print(f"Found {len(files)} images.")

# Step 1: temporary rename to avoid filename conflicts
temp_files = []

for i, file in enumerate(files, start=1):
    temp_name = folder / f"__temp_{i:04d}{file.suffix.lower()}"
    file.rename(temp_name)
    temp_files.append(temp_name)

# Step 2: final clean rename
for i, file in enumerate(temp_files, start=1):
    new_name = folder / f"{prefix}_{i:04d}{file.suffix.lower()}"
    file.rename(new_name)
    print(f"Renamed to {new_name.name}")

print("Done. Dataset renamed properly.")