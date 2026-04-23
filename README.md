# CTIP 2-Class Touching Species Prototype

This project is a controlled-condition AI/CV prototype for the COS30049 Computing Technology Innovation Project (CTIP).

The current selected prototype model is a **2-class classifier**:

- **TouchingPlants**
- **TouchingWildlife**

It includes:

- dataset renaming and organization
- 90/10 train/test split
- CLIP-based 2-class training
- offline evaluation
- realtime webcam inference
- MediaPipe hand detection
- alert image saving
- JSON metadata saving

---

## Project Goal

The purpose of this notebook is to support a realtime abnormal-interaction prototype for a digital park guide system.

The current AI direction is intentionally narrow:
- detect a hand region
- classify the touching interaction as either **TouchingPlants** or **TouchingWildlife**
- trigger an alert under controlled conditions
- save evidence for later admin-side integration

This is a **prototype**, not a production-ready field detector.

---

## Files

Main notebook:
- `CTIP_2class_training_and_realtime_notebook.ipynb`

Dependency file:
- `requirements.txt`

Expected trained model output:
- `C:\COS30049 Assignment\Artifacts\clip_2class_touching_species.pt`

Expected realtime alert output:
- `C:\COS30049 Assignment\Alerts\`

---

## Recommended Folder Structure

Use this structure on Windows:

```text
C:\COS30049 Assignment
├── Alerts
├── Artifacts
├── Datasets
│   ├── TouchingPlants
│   └── TouchingWildlife
├── Models
│   └── hand_landmarker.task
└── CTIP_2class_training_and_realtime_notebook.ipynb
```

---

## Dataset

The 2-class experiment expects only these folders:

- `TouchingPlants`
- `TouchingWildlife`

The notebook will:
1. rename the image files
2. split the dataset into `train` and `test`
3. train the model
4. evaluate the model
5. run the realtime camera system

---

## Installation

Create and activate your Python environment first.

Then install dependencies:

```bash
pip install -r requirements.txt
```

### GPU note

If you want GPU support, install the correct PyTorch CUDA build first, then install the remaining requirements.

Example:

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt
```

After installation, verify CUDA inside Python:

```python
import torch
print(torch.cuda.is_available())
print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else "No CUDA")
```

---

## MediaPipe Hand Model

For the realtime notebook section, you must place the MediaPipe hand landmarker model here:

```text
C:\COS30049 Assignment\Models\hand_landmarker.task
```

If this file is missing, the realtime section will fail.

---

## How to Run

Open the notebook and run cells in order.

### Part A: Training pipeline
This section will:
- rename images
- count images
- split dataset into 90% train / 10% test
- train the 2-class CLIP model
- save the trained model
- evaluate the test set

Saved model path:

```text
C:\COS30049 Assignment\Artifacts\clip_2class_touching_species.pt
```

### Part B: Realtime camera system
This section will:
- load the trained 2-class model
- open the webcam
- detect hands using MediaPipe
- crop the hand region
- classify it as:
  - TouchingPlants
  - TouchingWildlife
  - or reject it as Unknown / No Alert
- trigger alerts
- save evidence images
- save JSON metadata

---

## Realtime Controls

Inside the realtime window:

- Press **`q`** to quit
- Press **`s`** to manually save a snapshot

Saved alert files go to:

```text
C:\COS30049 Assignment\Alerts
```

---

## Realtime Decision Logic

The realtime system uses:
- hand detection via MediaPipe
- CLIP classification on the hand crop
- confidence threshold
- top-1 vs top-2 margin check
- bounding box sanity filtering
- rolling touching votes
- cooldown to reduce repeated alerts

This is important because a 2-class model alone would otherwise force every image into one of the two touching classes.

---

## Expected Outputs

### Training
- renamed images
- train/test split
- saved model
- classification report
- confusion matrix

### Realtime
- bounding box around detected hand
- class label on screen
- confidence and margin display
- saved alert image
- saved JSON metadata

---

## Limitations

This prototype has several limitations:

- it is a **2-class touching-species classifier**, not a full abnormal detector
- it works best in **controlled conditions**
- it still depends on:
  - hand detection quality
  - crop quality
  - threshold tuning
  - dataset quality
- non-touching and unrelated scenes are handled through rejection logic, not a dedicated negative-class final model

Because of this, the system should be used as a **CTIP prototype** for demonstration and integration, not as a final deployment-ready park surveillance system.

---

## Troubleshooting

### 1. Webcam does not open
Check:
- camera permissions
- whether another app is already using the webcam
- whether `cv2.VideoCapture(0)` is correct for your machine

### 2. Model file not found
Make sure this file exists:

```text
C:\COS30049 Assignment\Artifacts\clip_2class_touching_species.pt
```

### 3. Hand model not found
Make sure this file exists:

```text
C:\COS30049 Assignment\Models\hand_landmarker.task
```

### 4. No GPU detected
Check:
- whether PyTorch was installed with CUDA support
- whether the notebook kernel is the correct environment
- whether `torch.cuda.is_available()` returns `True`

### 5. Alerts are not saving
Usually this means the alert condition is not being triggered.
Check:
- confidence threshold
- margin threshold
- rolling vote settings
- whether the hand detection box is valid

---

## Suggested Next Step

After confirming the notebook works, the next development step is:

- connect the alert image and JSON output into the backend
- show incidents on the admin page
- support review status such as:
  - New
  - Reviewed
  - False Alarm

---

## Author / Project Context

Course:
- **COS30049 Computing Technology Innovation Project**

Role:
- **AI / Computer Vision Lead**

Current AI prototype direction:
- **2-class TouchingPlants vs TouchingWildlife**
