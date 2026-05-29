"""
conda activate cos30049

python scripts/run_ai_camera_monitor.py \
  --model-path artifacts/ctip_activity_v2/best_ctip_activity_v2_mobilenet.pt \
  --hand-model-path models/hand_landmarker.task \
  --backend-url http://localhost:4000
"""

from __future__ import annotations

import argparse
import json
import os
import time
import urllib.error
import urllib.request
from collections import Counter, deque
from pathlib import Path

import cv2
import mediapipe as mp
import torch
from mediapipe.tasks.python import vision
from PIL import Image
from torchvision import models, transforms

CLASS_NAMES = ["negative", "plucking_plant", "touching_wildlife"]
ALERT_CLASSES = {"plucking_plant", "touching_wildlife"}
FRIENDLY_LABELS = {
    "negative": "No Alert",
    "plucking_plant": "Plucking Plants",
    "touching_wildlife": "Touching Wildlife",
    "Unknown": "Unknown / No Alert",
}

BACKEND_EVENT_TYPES = {
    "plucking_plant": "PluckingPlants",
    "touching_wildlife": "TouchingWildlife",
    "ManualSnapshot": "ManualSnapshot",
}

FRAME_SKIP = 3
ROLLING_WINDOW = 5
ALERT_MIN_TOUCHING = 3
COOLDOWN_SECONDS = 5

#
# Use a wider hand-context crop because the classifier needs to see what the
# hand is interacting with, not only the hand itself. This is important for
# separating plant plucking from wildlife contact during the live demo.
HAND_BOX_PADDING = 90
MIN_HAND_BOX_SIZE = 260

CLASS_CONF_THRESHOLD = 0.80
MIN_MARGIN = 0.20

MIN_BOX_AREA_RATIO = 0.01
MAX_BOX_AREA_RATIO = 0.60

CAMERA_LOCATION = "Demo Camera Zone"
INCIDENT_STATUS_NEW = "New"
INCIDENT_SEVERITY_MEDIUM = "medium"
WINDOW_NAME = "CTIP Realtime AI Activity Monitor"
REPO_ROOT = Path(__file__).resolve().parents[1]


def choose_device() -> str:
    if torch.cuda.is_available():
        return "cuda"
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def build_model(num_classes: int):
    model = models.mobilenet_v3_small(weights=None)
    in_features = model.classifier[-1].in_features
    model.classifier[-1] = torch.nn.Linear(in_features, num_classes)
    return model


def build_transform(image_size: int):
    return transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )


def draw_fullscreen_border(frame, color=(0, 0, 255), thickness=18):
    height, width = frame.shape[:2]
    cv2.rectangle(frame, (0, 0), (width - 1, height - 1), color, thickness)


def get_bbox_from_landmarks(landmarks, frame_w, frame_h, padding=30):
    xs = [landmark.x for landmark in landmarks]
    ys = [landmark.y for landmark in landmarks]

    x1 = max(0, int(min(xs) * frame_w) - padding)
    y1 = max(0, int(min(ys) * frame_h) - padding)
    x2 = min(frame_w - 1, int(max(xs) * frame_w) + padding)
    y2 = min(frame_h - 1, int(max(ys) * frame_h) + padding)

    if (x2 - x1) < MIN_HAND_BOX_SIZE or (y2 - y1) < MIN_HAND_BOX_SIZE:
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2
        half = MIN_HAND_BOX_SIZE // 2
        x1 = max(0, cx - half)
        y1 = max(0, cy - half)
        x2 = min(frame_w - 1, cx + half)
        y2 = min(frame_h - 1, cy + half)

    return x1, y1, x2, y2


def get_box_color(pred_class: str):
    if pred_class == "plucking_plant":
        return (0, 165, 255)
    if pred_class == "touching_wildlife":
        return (0, 0, 255)
    if pred_class == "negative":
        return (0, 180, 0)
    return (180, 180, 180)


def is_valid_alert_detection(det, frame_w, frame_h):
    if det["pred_class"] not in ALERT_CLASSES:
        return False

    x1, y1, x2, y2 = det["bbox"]
    area_ratio = ((x2 - x1) * (y2 - y1)) / float(frame_w * frame_h)

    return (
        det["top1"] >= CLASS_CONF_THRESHOLD
        and det["margin"] >= MIN_MARGIN
        and MIN_BOX_AREA_RATIO <= area_ratio <= MAX_BOX_AREA_RATIO
    )


def classify_crop(crop_bgr, image_transform, model, device):
    rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
    image = Image.fromarray(rgb)
    tensor = image_transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(tensor)
        probs_tensor = torch.softmax(logits, dim=1)[0].detach().cpu()
        probs = probs_tensor.tolist()
        pred_idx = int(torch.argmax(probs_tensor).item())

    probs_dict = {name: float(probability) for name, probability in zip(CLASS_NAMES, probs)}
    pred_class = CLASS_NAMES[pred_idx]
    sorted_probs = sorted(probs, reverse=True)
    top1 = float(sorted_probs[0])
    top2 = float(sorted_probs[1]) if len(sorted_probs) > 1 else 0.0
    margin = top1 - top2

    return pred_class, probs_dict, top1, margin


def build_ai_incident_payload(
    timestamp_file,
    timestamp_iso,
    image_path,
    json_path,
    detections,
    history,
    touch_votes,
    event_class,
    prefix,
):
    strongest = max(detections, key=lambda item: float(item.get("top1", 0.0))) if detections else None
    ai_details = None

    if strongest is not None:
        ai_details = {
            "predictedClass": strongest.get("pred_class"),
            "displayClass": strongest.get("display_class"),
            "confidence": float(strongest.get("top1", 0.0)),
            "margin": float(strongest.get("margin", 0.0)),
            "bbox": list(strongest.get("bbox", [])),
            "probabilities": {
                key: float(value)
                for key, value in strongest.get("probs", {}).items()
            },
        }

    backend_event_type = BACKEND_EVENT_TYPES.get(event_class, event_class)

    return {
        "id": f"AI-{timestamp_file}-{prefix}-{backend_event_type}",
        "source": "AI_CAMERA",
        "eventType": backend_event_type,
        "severity": INCIDENT_SEVERITY_MEDIUM if event_class != "ManualSnapshot" else "low",
        "timestamp": timestamp_iso,
        "location": CAMERA_LOCATION,
        "status": INCIDENT_STATUS_NEW,
        "evidenceImage": str(image_path),
        "evidenceJson": str(json_path),
        "ai": ai_details,
        "iot": None,
        "runtime": {
            "history": list(history),
            "alert_votes": int(touch_votes),
            "rolling_window": int(ROLLING_WINDOW),
            "alert_min_touching": int(ALERT_MIN_TOUCHING),
            "class_conf_threshold": float(CLASS_CONF_THRESHOLD),
            "min_margin": float(MIN_MARGIN),
            "class_names": list(CLASS_NAMES),
        },
        "detections": [
            {
                "bbox": list(item.get("bbox", [])),
                "pred_class": item.get("pred_class"),
                "display_class": item.get("display_class"),
                "top1": float(item.get("top1", 0.0)),
                "margin": float(item.get("margin", 0.0)),
                "probs": {
                    key: float(value)
                    for key, value in item.get("probs", {}).items()
                },
            }
            for item in detections
        ],
        "notes": "AI camera detected potential plucking of protected plants or touching wildlife. Review evidence before action.",
    }


def load_env_file(env_path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not env_path.exists():
        return values

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            values[key] = value

    return values


def resolve_device_token(args, project_dir: Path) -> tuple[str | None, str]:
    if args.device_token:
        return args.device_token, "command line"

    env_token = os.environ.get("AI_CAMERA_TOKEN")
    if env_token:
        return env_token, "AI_CAMERA_TOKEN environment variable"

    candidate_env_paths = [
        project_dir / ".env",
        project_dir / "user_login" / "server" / ".env",
    ]

    for env_path in candidate_env_paths:
        file_env = load_env_file(env_path)
        file_token = file_env.get("AI_CAMERA_TOKEN")
        if file_token:
            return file_token, str(env_path)

    return None, "not found"


def post_incident_to_backend(payload, incident_api_url, device_token=None):
    try:
        body = json.dumps(payload).encode("utf-8")
        headers = {"Content-Type": "application/json"}
        if device_token:
            headers["X-Device-Token"] = device_token

        request = urllib.request.Request(
            incident_api_url,
            data=body,
            headers=headers,
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=2) as response:
            response.read()
            print(f"[SYNC] Posted incident to backend: HTTP {response.status}")
        return True
    except urllib.error.HTTPError as exc:
        print(f"[SYNC WARNING] Backend incident POST failed: HTTP {exc.code}. Local evidence saved.")
        if exc.code == 401:
            print("[SYNC WARNING] Backend token auth rejected this camera post. Pass --device-token or set AI_CAMERA_TOKEN in .env.")
        return False
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        print(f"[SYNC WARNING] Backend incident POST failed: {exc}. Local evidence saved.")
        return False


def save_alert_frame(
    frame,
    detections,
    history,
    touch_votes,
    event_class,
    alert_dir,
    incident_api_url,
    sync_backend,
    device_token=None,
    prefix="alert",
):
    timestamp_file = time.strftime("%Y-%m-%d_%H-%M-%S")
    timestamp_iso = time.strftime("%Y-%m-%dT%H:%M:%S") + "+08:00"

    image_path = alert_dir / f"{timestamp_file}_{prefix}_{event_class}.jpg"
    json_path = alert_dir / f"{timestamp_file}_{prefix}_{event_class}.json"

    ok = cv2.imwrite(str(image_path), frame)
    print(f"[SAVE] Image path: {image_path}")
    print(f"[SAVE] Image save success: {ok}")

    payload = build_ai_incident_payload(
        timestamp_file=timestamp_file,
        timestamp_iso=timestamp_iso,
        image_path=image_path,
        json_path=json_path,
        detections=detections,
        history=history,
        touch_votes=touch_votes,
        event_class=event_class,
        prefix=prefix,
    )

    with open(json_path, "w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2, ensure_ascii=False)

    print(f"[SAVE] JSON path: {json_path}")

    if prefix == "alert" and sync_backend:
        post_incident_to_backend(payload, incident_api_url, device_token=device_token)
    elif prefix == "alert":
        print("[SYNC] Backend sync disabled. Local evidence saved.")
    else:
        print("[SYNC] Manual snapshot saved locally and not posted as an incident.")

    return payload


def create_hand_landmarker(hand_model_path):
    base_options = mp.tasks.BaseOptions
    hand_landmarker = vision.HandLandmarker
    hand_landmarker_options = vision.HandLandmarkerOptions
    vision_running_mode = vision.RunningMode

    options = hand_landmarker_options(
        base_options=base_options(model_asset_path=str(hand_model_path)),
        running_mode=vision_running_mode.VIDEO,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    return hand_landmarker.create_from_options(options)


def parse_args():
    default_project_dir = Path(os.environ.get("CTIP_PROJECT_DIR", REPO_ROOT))
    default_evidence_dir = Path(os.environ.get("AI_EVIDENCE_DIR", REPO_ROOT / "alerts" / "ai"))
    default_backend_url = os.environ.get("BACKEND_URL", "http://localhost:4000")
    default_incident_api_url = os.environ.get("INCIDENT_API_URL")

    parser = argparse.ArgumentParser(description="Run the standalone CTIP realtime AI camera monitor.")
    parser.add_argument(
        "--project-dir",
        type=Path,
        default=default_project_dir,
        help="Project root containing local-only artifacts, datasets, and models. Defaults to this repo.",
    )
    parser.add_argument("--model-path", type=Path)
    parser.add_argument("--hand-model-path", type=Path)
    parser.add_argument(
        "--evidence-dir",
        type=Path,
        default=default_evidence_dir,
        help="Runtime alert evidence folder. Defaults to repo alerts/ai.",
    )
    parser.add_argument("--alert-dir", type=Path, help=argparse.SUPPRESS)
    parser.add_argument(
        "--camera-index",
        type=int,
        default=0,
        help="OpenCV camera index for normal webcams. iPhone camera availability is environment-dependent.",
    )
    parser.add_argument(
        "--backend-url",
        default=default_backend_url,
        help="Backend origin that serves /api/incidents and /evidence/ai. Defaults to http://localhost:4000.",
    )
    parser.add_argument("--incident-api-url", default=default_incident_api_url, help=argparse.SUPPRESS)
    parser.add_argument(
        "--device-token",
        default=None,
        help="Optional AI camera device token. Sent as X-Device-Token when backend token auth is enabled.",
    )
    parser.add_argument("--no-backend-sync", action="store_true")
    return parser.parse_args()


def resolve_incident_api_url(args):
    if args.incident_api_url:
        return args.incident_api_url

    backend_url = args.backend_url.rstrip("/")
    if backend_url.endswith("/api/incidents"):
        return backend_url
    return f"{backend_url}/api/incidents"


def load_model(model_path, device):
    checkpoint = torch.load(model_path, map_location="cpu")
    class_names = checkpoint.get("class_names", CLASS_NAMES)
    image_size = int(checkpoint.get("image_size", 224))

    if list(class_names) != CLASS_NAMES:
        raise ValueError(
            f"Model class_names {class_names} do not match expected {CLASS_NAMES}. "
            "Retrain or update the monitor mapping before demo."
        )

    model = build_model(num_classes=len(CLASS_NAMES))
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    image_transform = build_transform(image_size)
    return image_transform, model, checkpoint


def run_monitor(args):
    project_dir = args.project_dir.expanduser().resolve()
    model_path = (
        args.model_path
        or project_dir / "artifacts" / "ctip_activity_v2" / "best_ctip_activity_v2_mobilenet.pt"
    ).expanduser().resolve()
    hand_model_path = (args.hand_model_path or project_dir / "models" / "hand_landmarker.task").expanduser().resolve()
    evidence_dir_arg = args.alert_dir or args.evidence_dir
    alert_dir = evidence_dir_arg.expanduser().resolve()
    alert_dir.mkdir(parents=True, exist_ok=True)
    incident_api_url = resolve_incident_api_url(args)
    device_token, device_token_source = resolve_device_token(args, project_dir)

    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")
    if not hand_model_path.exists():
        raise FileNotFoundError(f"Hand landmarker model not found: {hand_model_path}")

    device = choose_device()
    print("===================================================")
    print("Standalone realtime MobileNetV3 monitor starting...")
    print("Using device:", device)
    print("CUDA available:", torch.cuda.is_available())
    if torch.cuda.is_available():
        print("GPU:", torch.cuda.get_device_name(0))
    print("Model path:", model_path)
    print("Hand model:", hand_model_path)
    print("Classes:", CLASS_NAMES)
    print("Alert classes:", sorted(ALERT_CLASSES))
    print("Class confidence threshold:", CLASS_CONF_THRESHOLD)
    print("Minimum margin:", MIN_MARGIN)
    print("Evidence dir:", alert_dir)
    print("Backend URL:", args.backend_url.rstrip("/"))
    print("Incident API:", incident_api_url)
    print("Device token header:", f"enabled ({device_token_source})" if device_token else "not provided")
    print("Press 'q' or ESC to quit | Press 's' to save snapshot")
    print("===================================================")

    image_transform, model, checkpoint = load_model(model_path, device)
    print(
        "Loaded model metrics:",
        {
            "architecture": checkpoint.get("architecture"),
            "val_macro_f1": checkpoint.get("val_macro_f1"),
            "val_accuracy": checkpoint.get("val_accuracy"),
        },
    )

    hand_landmarker = None
    cap = None

    try:
        hand_landmarker = create_hand_landmarker(hand_model_path)
        cap = cv2.VideoCapture(args.camera_index)

        if not cap.isOpened():
            raise RuntimeError(f"Could not open webcam index {args.camera_index}.")

        history = deque(maxlen=ROLLING_WINDOW)
        frame_count = 0
        last_alert_time = 0
        last_predictions = []
        last_hand_result = None

        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to read webcam frame.")
                break

            frame_count += 1
            display_frame = frame.copy()
            frame_h, frame_w = frame.shape[:2]

            if frame_count % FRAME_SKIP == 0:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                timestamp_ms = int(time.time() * 1000)

                hand_result = hand_landmarker.detect_for_video(mp_image, timestamp_ms)
                last_hand_result = hand_result
                last_predictions = []
                valid_alert_dets = []

                if hand_result.hand_landmarks:
                    for landmarks in hand_result.hand_landmarks:
                        x1, y1, x2, y2 = get_bbox_from_landmarks(
                            landmarks,
                            frame_w,
                            frame_h,
                            HAND_BOX_PADDING,
                        )
                        crop = frame[y1:y2, x1:x2]
                        if crop.size == 0:
                            continue

                        pred_class, probs_dict, top1, margin = classify_crop(
                            crop,
                            image_transform,
                            model,
                            device,
                        )
                        det = {
                            "bbox": (x1, y1, x2, y2),
                            "pred_class": pred_class,
                            "top1": top1,
                            "margin": margin,
                            "probs": probs_dict,
                        }

                        if is_valid_alert_detection(det, frame_w, frame_h):
                            det["display_class"] = pred_class
                            valid_alert_dets.append(det)
                        else:
                            det["display_class"] = "Unknown" if pred_class in ALERT_CLASSES else "negative"

                        last_predictions.append(det)

                history.append("Alert" if valid_alert_dets else "NoAlert")

            for item in last_predictions:
                x1, y1, x2, y2 = item["bbox"]
                display_class = item["display_class"]
                pred_class = item["pred_class"]
                top1 = item["top1"]
                margin = item["margin"]
                probs_dict = item["probs"]
                box_color = get_box_color(display_class)

                cv2.rectangle(display_frame, (x1, y1), (x2, y2), box_color, 3)
                y_text = max(30, y1 - 10)
                cv2.putText(display_frame, FRIENDLY_LABELS.get(display_class, display_class), (x1, y_text), cv2.FONT_HERSHEY_SIMPLEX, 0.60, box_color, 2)
                cv2.putText(display_frame, f"Pred: {pred_class}", (x1, y_text + 22), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
                cv2.putText(display_frame, f"Top1: {top1:.2f}  Margin: {margin:.2f}", (x1, y_text + 44), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
                cv2.putText(
                    display_frame,
                    f"NEG:{probs_dict['negative']:.2f}  PP:{probs_dict['plucking_plant']:.2f}  TW:{probs_dict['touching_wildlife']:.2f}",
                    (x1, y_text + 66),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.48,
                    (255, 255, 255),
                    2,
                )

            counts = Counter(history)
            now = time.time()
            alert_triggered = False
            valid_alert_dets = [
                item
                for item in last_predictions
                if item["display_class"] in ALERT_CLASSES
            ]

            if counts["Alert"] >= ALERT_MIN_TOUCHING and (now - last_alert_time) > COOLDOWN_SECONDS and valid_alert_dets:
                alert_triggered = True
                last_alert_time = now
                strongest = max(valid_alert_dets, key=lambda item: item["top1"])
                event_class = strongest["pred_class"]
                alert_frame = display_frame.copy()
                draw_fullscreen_border(alert_frame, color=(0, 0, 255), thickness=18)

                print(f"[ALERT] Triggered | votes={counts['Alert']}/{ROLLING_WINDOW} | event={event_class}")
                save_alert_frame(
                    frame=alert_frame,
                    detections=valid_alert_dets,
                    history=history,
                    touch_votes=counts["Alert"],
                    event_class=event_class,
                    alert_dir=alert_dir,
                    incident_api_url=incident_api_url,
                    sync_backend=not args.no_backend_sync,
                    device_token=device_token,
                    prefix="alert",
                )
                history.clear()

            cv2.putText(display_frame, f"Alert votes: {counts['Alert']}/{ROLLING_WINDOW}", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            cv2.putText(display_frame, f"Class conf: {CLASS_CONF_THRESHOLD:.2f}", (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            cv2.putText(display_frame, f"Min margin: {MIN_MARGIN:.2f}", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            cv2.putText(display_frame, f"Cooldown: {COOLDOWN_SECONDS}s", (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)

            if alert_triggered:
                draw_fullscreen_border(display_frame, color=(0, 0, 255), thickness=18)
                cv2.putText(display_frame, "ALERT TRIGGERED", (20, 160), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)

            if last_hand_result is None or not last_predictions:
                cv2.putText(display_frame, "No hand detected", (20, frame_h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (180, 180, 180), 2)

            cv2.imshow(WINDOW_NAME, display_frame)
            key = cv2.waitKey(1) & 0xFF

            if key == ord("s"):
                print("[MANUAL] Saving snapshot...")
                save_alert_frame(
                    frame=display_frame.copy(),
                    detections=last_predictions,
                    history=history,
                    touch_votes=counts["Alert"],
                    event_class="ManualSnapshot",
                    alert_dir=alert_dir,
                    incident_api_url=incident_api_url,
                    sync_backend=not args.no_backend_sync,
                    device_token=device_token,
                    prefix="manual",
                )

            if key in (ord("q"), 27):
                print("Quitting...")
                break

    except KeyboardInterrupt:
        print("Quitting...")
    finally:
        print("Cleaning up camera resources...")
        if cap is not None:
            cap.release()
        if hand_landmarker is not None:
            hand_landmarker.close()
        try:
            cv2.destroyWindow(WINDOW_NAME)
        except cv2.error:
            pass
        cv2.destroyAllWindows()
        for _ in range(5):
            cv2.waitKey(1)
        print("Realtime camera stopped safely.")


def main():
    run_monitor(parse_args())


if __name__ == "__main__":
    main()
