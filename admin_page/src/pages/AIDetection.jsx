import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mqtt from "mqtt";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  INCIDENT_FILTERS,
  INCIDENT_STATUSES,
  normalizeIncidentRecord,
  seededIncidents,
  summarizeIncidents,
} from "../data/incidents";
import "../Admin.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const backendBaseUrl = API_BASE_URL.replace(/\/$/, "");

const MQTT_BROKER_URL = "wss://broker.hivemq.com:8884/mqtt";
const MQTT_TOPIC = "ctip/sensor/plant-zone-01/proximity";
const LOCAL_MQTT_INCIDENT_TTL_MS = 30000;
const CAPTURE_MAX_WIDTH = 1280;
const CAPTURE_MAX_HEIGHT = 720;
const CAPTURE_JPEG_QUALITY = 0.72;
const CAPTURE_WARMUP_DELAY_MS = 2000;
const MAX_LOCAL_CAPTURE_URLS = 5;

const sourceLabel = {
  AI_CAMERA: "AI Camera",
  IOT_SENSOR: "IoT Sensor",
};

const resolveEvidenceImageUrl = (evidenceImage) => {
  if (!evidenceImage || typeof evidenceImage !== "string") return null;
  if (evidenceImage.startsWith("/Users/")) return null;
  if (evidenceImage.startsWith("http://") || evidenceImage.startsWith("https://")) {
    return evidenceImage;
  }
  if (evidenceImage.startsWith("/evidence/ai/") || evidenceImage.startsWith("/evidence/iot/")) {
    return `${backendBaseUrl}${evidenceImage}`;
  }
  return evidenceImage;
};

const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatPercent = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "Unavailable";
};

const formatDecimal = (value, digits = 2) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "Unavailable";
};

const formatBytes = (value) => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusClassName = (status = "") => String(status).toLowerCase().replace(/\s+/g, "-");

const getFilteredIncidents = (incidents, activeFilter) => {
  if (activeFilter === "all") return incidents;
  if (activeFilter === "AI_CAMERA" || activeFilter === "IOT_SENSOR") {
    return incidents.filter((incident) => incident.source === activeFilter);
  }
  return incidents.filter((incident) => incident.status === activeFilter);
};

const getApiIncidents = (payload) => {
  const records = Array.isArray(payload) ? payload : payload?.incidents || [];
  return records.map(normalizeIncidentRecord).filter(Boolean);
};

const waitForVideoFrame = (video) =>
  new Promise((resolve, reject) => {
    if (!video) {
      reject(new Error("Camera preview is not ready."));
      return;
    }

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      resolve();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for a camera frame."));
    }, 4000);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener("loadedmetadata", handleReady);
      video.removeEventListener("canplay", handleReady);
      video.removeEventListener("playing", handleReady);
    };

    const handleReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        cleanup();
        resolve();
      }
    };

    video.addEventListener("loadedmetadata", handleReady);
    video.addEventListener("canplay", handleReady);
    video.addEventListener("playing", handleReady);
  });

const delay = (milliseconds) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error || new Error("Unable to read image capture.")));
    reader.readAsDataURL(blob);
  });

const numberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeBrowserIotPayload = (payload = {}, topic = MQTT_TOPIC) => {
  const source = payload.source || "IOT_SENSOR";
  const eventType = payload.event_type || payload.eventType || "ObjectCloseToPlant";
  if (source !== "IOT_SENSOR" || eventType !== "ObjectCloseToPlant") return null;

  const distanceCm = numberOrNull(
    payload.distance_cm ?? payload.distanceCm ?? payload.distance ?? payload.iot?.distance_cm ?? payload.iot?.distanceCm
  );
  const thresholdCm = numberOrNull(
    payload.threshold_cm ?? payload.thresholdCm ?? payload.threshold ?? payload.iot?.threshold_cm ?? payload.iot?.thresholdCm ?? 20
  );
  const status = String(payload.status || "").toLowerCase();
  const isTriggered =
    status === "triggered" ||
    (distanceCm !== null && thresholdCm !== null && distanceCm <= thresholdCm);

  if (!isTriggered) return null;

  const timestamp = payload.timestamp || payload.occurred_at || payload.occurredAt || new Date().toISOString();
  const sensorId = payload.sensor_id || payload.sensorId || payload.iot?.sensor_id || payload.iot?.sensorId || "plant-zone-01";

  return {
    ...payload,
    incident_id:
      payload.incident_id ||
      payload.public_id ||
      payload.id ||
      `IOT-BROWSER-${timestamp.replace(/[:.]/g, "-")}`,
    source: "IOT_SENSOR",
    event_type: "ObjectCloseToPlant",
    sensor_id: sensorId,
    location: payload.location || "Plant Zone 01",
    distance_cm: distanceCm ?? 0,
    threshold_cm: thresholdCm ?? 20,
    timestamp,
    status: "triggered",
    severity: payload.severity || "low",
    topic,
  };
};

const buildLocalIotIncident = (payload, topic, capture = null) =>
  normalizeIncidentRecord({
    incident_id: payload.incident_id || payload.public_id || payload.id || `IOT-MQTT-${Date.now()}`,
    source: "IOT_SENSOR",
    event_type: "ObjectCloseToPlant",
    severity: payload.severity || "low",
    timestamp: payload.timestamp || payload.occurred_at || new Date().toISOString(),
    location: payload.location || "Plant Zone 01",
    status: "New",
    evidence: { image_path: capture?.browserUrl || capture?.url || null },
    ai: null,
    iot: {
      sensor_id: payload.sensor_id || payload.sensorId || "plant-zone-01",
      distance_cm: payload.distance_cm ?? payload.distanceCm ?? 0,
      threshold_cm: payload.threshold_cm ?? payload.thresholdCm ?? 20,
      mqtt_topic: topic,
    },
    notes: capture
      ? `Browser MQTT listener received an IoT proximity trigger and captured one local ${capture.width}x${capture.height} JPEG preview (${formatBytes(capture.sizeBytes)}). The backend saves a copy to alerts/iot when reachable.`
      : "Browser MQTT listener received an IoT proximity trigger and opened the live camera preview for context.",
  });

const AIDetection = () => {
  const mqttClientRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const localMqttIncidentsRef = useRef([]);
  const localCaptureUrlsRef = useRef([]);

  const [incidents, setIncidents] = useState(seededIncidents);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedIncidentId, setSelectedIncidentId] = useState(seededIncidents[0]?.id);
  const [backendOnline, setBackendOnline] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [savingIncidentId, setSavingIncidentId] = useState(null);
  const [mqttStatus, setMqttStatus] = useState("Connecting...");
  const [lastMqttMessage, setLastMqttMessage] = useState("No trigger received yet");
  const [cameraStatus, setCameraStatus] = useState("Off");
  const [captureStatus, setCaptureStatus] = useState("No capture yet");
  const [capturedShot, setCapturedShot] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus("Unavailable");
        return false;
      }

      if (cameraStreamRef.current) {
        setCameraStatus("On");
        return true;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => null);
      }

      setCameraStatus("On");
      return true;
    } catch (error) {
      console.error("Camera error:", error);
      setCameraStatus("Camera error");
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStatus("Off");
  }, []);

  const rememberCaptureUrl = useCallback((url) => {
    localCaptureUrlsRef.current = [url, ...localCaptureUrlsRef.current];
    const expiredUrls = localCaptureUrlsRef.current.slice(MAX_LOCAL_CAPTURE_URLS);
    localCaptureUrlsRef.current = localCaptureUrlsRef.current.slice(0, MAX_LOCAL_CAPTURE_URLS);
    expiredUrls.forEach((expiredUrl) => URL.revokeObjectURL(expiredUrl));
  }, []);

  const captureOneShot = useCallback(async (label = "Manual evidence capture") => {
    setIsCapturing(true);
    setCaptureStatus("Opening camera...");

    try {
      const cameraReady = await startCamera();
      if (!cameraReady) {
        throw new Error("Camera is unavailable or permission was denied.");
      }

      const video = videoRef.current;
      await waitForVideoFrame(video);
      setCaptureStatus("Camera ready. Capturing in 2 seconds...");
      await delay(CAPTURE_WARMUP_DELAY_MS);
      await waitForVideoFrame(video);

      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;
      const scale = Math.min(
        CAPTURE_MAX_WIDTH / sourceWidth,
        CAPTURE_MAX_HEIGHT / sourceHeight,
        1
      );
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Unable to prepare image processor.");
      }

      context.drawImage(video, 0, 0, width, height);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", CAPTURE_JPEG_QUALITY)
      );
      if (!blob) {
        throw new Error("Unable to encode captured frame.");
      }

      const url = URL.createObjectURL(blob);
      const dataUrl = await blobToDataUrl(blob);
      rememberCaptureUrl(url);

      const capture = {
        url,
        dataUrl,
        label,
        width,
        height,
        sizeBytes: blob.size,
        capturedAt: new Date().toISOString(),
      };

      setCapturedShot(capture);
      setCaptureStatus(`Captured ${width}x${height} JPEG (${formatBytes(blob.size)})`);
      return capture;
    } catch (error) {
      console.error("Capture error:", error);
      setCaptureStatus(`Capture failed: ${error.message}`);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [rememberCaptureUrl, startCamera]);

  const addLocalMqttIncident = useCallback((incident) => {
    if (!incident) return;

    const createdAt = Date.now();
    localMqttIncidentsRef.current = [
      { incident, createdAt },
      ...localMqttIncidentsRef.current.filter((entry) => entry.incident.id !== incident.id),
    ].slice(0, 5);

    setIncidents((current) => [
      incident,
      ...current.filter((item) => item.id !== incident.id),
    ]);
    setSelectedIncidentId(incident.id);
  }, []);

  const saveIotIncidentToBackend = useCallback(async (payload, topic, capture = null, localIncidentId = null) => {
    const incidentPayload = {
      incident_id: payload.incident_id || payload.public_id || payload.id,
      source: "IOT_SENSOR",
      event_type: "ObjectCloseToPlant",
      sensor_id: payload.sensor_id || payload.sensorId || "plant-zone-01",
      location: payload.location || "Plant Zone 01",
      distance_cm: payload.distance_cm ?? payload.distanceCm ?? 0,
      threshold_cm: payload.threshold_cm ?? payload.thresholdCm ?? 20,
      timestamp: payload.timestamp || payload.occurred_at || new Date().toISOString(),
      status: "triggered",
      severity: payload.severity || "low",
      iot: {
        sensor_id: payload.sensor_id || payload.sensorId || "plant-zone-01",
        distance_cm: payload.distance_cm ?? payload.distanceCm ?? 0,
        threshold_cm: payload.threshold_cm ?? payload.thresholdCm ?? 20,
        mqtt_topic: topic,
      },
      notes: capture
        ? `IoT trigger captured by Admin browser camera as a compressed ${capture.width}x${capture.height} JPEG.`
        : "IoT proximity sensor detected an object inside the protected plant-zone threshold.",
      evidenceCapture: capture?.dataUrl
        ? {
            dataUrl: capture.dataUrl,
            width: capture.width,
            height: capture.height,
            sizeBytes: capture.sizeBytes,
            capturedAt: capture.capturedAt,
          }
        : undefined,
    };

    const response = await fetch(`${API_BASE_URL}/api/incidents/iot-capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Actor-Role": "admin",
      },
      body: JSON.stringify(incidentPayload),
    });

    if (!response.ok) {
      throw new Error(`Backend incident save failed with ${response.status}`);
    }

    const responsePayload = await response.json();
    const savedIncident = normalizeIncidentRecord(responsePayload.incident);
    if (!savedIncident) return null;

    if (localIncidentId && localIncidentId !== savedIncident.id) {
      localMqttIncidentsRef.current = localMqttIncidentsRef.current.filter(
        (entry) => entry.incident.id !== localIncidentId
      );
    }

    setIncidents((current) => [
      savedIncident,
      ...current.filter(
        (incident) => incident.id !== savedIncident.id && incident.id !== localIncidentId
      ),
    ]);
    setSelectedIncidentId(savedIncident.id);
    setCaptureStatus(
      savedIncident.evidenceImage
        ? `Saved IoT evidence to ${savedIncident.evidenceImage}`
        : "Saved IoT incident without evidence image"
    );
    return savedIncident;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchIncidents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/incidents`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const payload = await response.json();
        const liveIncidents = getApiIncidents(payload);
        if (cancelled) return;

        const now = Date.now();
        const freshLocalEntries = localMqttIncidentsRef.current.filter(
          (entry) => now - entry.createdAt < LOCAL_MQTT_INCIDENT_TTL_MS
        );
        localMqttIncidentsRef.current = freshLocalEntries;
        const liveIncidentsWithLocalCaptures = liveIncidents.map((incident) => {
          const localEntry = freshLocalEntries.find((entry) => entry.incident.id === incident.id);
          if (!localEntry) return incident;

          return {
            ...incident,
            evidenceImage: incident.evidenceImage || localEntry.incident.evidenceImage,
            notes: incident.notes || localEntry.incident.notes,
          };
        });
        const pendingLocalIncidents = freshLocalEntries
          .filter(
            (entry) =>
              !liveIncidentsWithLocalCaptures.some((incident) => incident.id === entry.incident.id)
          )
          .map((entry) => entry.incident);
        const mergedIncidents = [
          ...pendingLocalIncidents,
          ...liveIncidentsWithLocalCaptures,
        ];

        setBackendOnline(true);
        setApiError("");
        setLastUpdated(new Date());
        setIncidents(mergedIncidents);
        setSelectedIncidentId((currentId) =>
          mergedIncidents.some((incident) => incident.id === currentId)
            ? currentId
            : mergedIncidents[0]?.id || null
        );
      } catch (error) {
        if (cancelled) return;
        setBackendOnline(false);
        setApiError(error.message);
        setIncidents(seededIncidents);
        setSelectedIncidentId((currentId) =>
          seededIncidents.some((incident) => incident.id === currentId)
            ? currentId
            : seededIncidents[0]?.id || null
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchIncidents();
    const intervalId = window.setInterval(fetchIncidents, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const clientId = `sfc_admin_${Math.random().toString(16).slice(2)}`;
    const client = mqtt.connect(MQTT_BROKER_URL, {
      clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 2000,
    });

    mqttClientRef.current = client;

    client.on("connect", () => {
      setMqttStatus("Connected");
      client.subscribe(MQTT_TOPIC, (error) => {
        if (error) {
          setMqttStatus("Subscribe failed");
          console.error("MQTT subscribe error:", error);
        }
      });
    });

    client.on("reconnect", () => {
      setMqttStatus("Reconnecting...");
    });

    client.on("error", (error) => {
      setMqttStatus("Connection error");
      console.error("MQTT error:", error);
    });

    client.on("offline", () => {
      setMqttStatus("Offline");
    });

    client.on("message", async (topic, payload) => {
      const message = payload.toString();
      setLastMqttMessage(message);

      if (topic !== MQTT_TOPIC) return;

      let data;
      try {
        data = JSON.parse(message);
      } catch (error) {
        console.error("Invalid MQTT JSON payload:", message);
        return;
      }

      const iotPayload = normalizeBrowserIotPayload(data, topic);
      if (!iotPayload) return;

      const capture = await captureOneShot("IoT trigger evidence");
      const localIncident = buildLocalIotIncident(iotPayload, topic, capture);
      addLocalMqttIncident(localIncident);

      try {
        const savedIncident = await saveIotIncidentToBackend(iotPayload, topic, capture, localIncident?.id);
        if (savedIncident?.evidenceImage && capture) {
          capture.browserUrl = savedIncident.evidenceImage;
        }
      } catch (error) {
        console.error("Unable to save IoT incident evidence:", error);
        setApiError(error.message);
      }
    });

    return () => {
      client.end(true);
      mqttClientRef.current = null;
      stopCamera();
      localCaptureUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      localCaptureUrlsRef.current = [];
    };
  }, [addLocalMqttIncident, captureOneShot, saveIotIncidentToBackend, stopCamera]);

  const summary = useMemo(() => summarizeIncidents(incidents), [incidents]);
  const filteredIncidents = useMemo(
    () => getFilteredIncidents(incidents, activeFilter),
    [incidents, activeFilter]
  );
  const filterCounts = useMemo(
    () =>
      INCIDENT_FILTERS.reduce(
        (counts, filter) => ({
          ...counts,
          [filter.id]: getFilteredIncidents(incidents, filter.id).length,
        }),
        {}
      ),
    [incidents]
  );
  const selectedIncident = incidents.find((incident) => incident.id === selectedIncidentId);

  const updateIncidentStatus = async (incidentId, status) => {
    const applyLocalStatus = () => {
      setIncidents((current) =>
        current.map((incident) =>
          incident.id === incidentId ? { ...incident, status } : incident
        )
      );
    };

    if (!backendOnline) {
      applyLocalStatus();
      return;
    }

    setSavingIncidentId(incidentId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/incidents/${encodeURIComponent(incidentId)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Actor-Role": "admin",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error(`Status update failed with ${response.status}`);
      }

      const payload = await response.json();
      const updatedIncident = normalizeIncidentRecord(payload.incident);
      if (!updatedIncident) {
        applyLocalStatus();
        return;
      }

      setIncidents((current) =>
        current.map((incident) =>
          incident.id === updatedIncident.id ? updatedIncident : incident
        )
      );
    } catch (error) {
      setBackendOnline(false);
      setApiError(error.message);
      applyLocalStatus();
    } finally {
      setSavingIncidentId(null);
    }
  };

  const testTrigger = () => {
    const client = mqttClientRef.current;

    if (!client?.connected) {
      setMqttStatus((currentStatus) =>
        currentStatus === "Connected" ? "Publish unavailable" : currentStatus
      );
      return;
    }

    const timestamp = new Date().toISOString();

    client.publish(
      MQTT_TOPIC,
      JSON.stringify({
        incident_id: `IOT-BROWSER-${timestamp.replace(/[:.]/g, "-")}`,
        source: "IOT_SENSOR",
        event_type: "ObjectCloseToPlant",
        sensor_id: "plant-zone-01",
        location: "Plant Zone 01",
        distance_cm: 12.5,
        threshold_cm: 20,
        timestamp,
        status: "triggered",
        severity: "low",
      })
    );
  };

  const statusMode = backendOnline ? "Live backend" : "Seeded fallback";
  const statusCards = [
    { label: "Total", value: summary.total, detail: backendOnline ? "Backend incidents" : "Demo incidents" },
    { label: "AI Camera", value: summary.ai, detail: "TouchingPlants / TouchingWildlife" },
    { label: "IoT Sensor", value: summary.iot, detail: "ObjectCloseToPlant readings" },
    { label: "New", value: summary.new, detail: "Needs review" },
    { label: "In Review", value: summary.inReview, detail: "Being investigated" },
    { label: "Resolved", value: summary.resolved, detail: "Closed response" },
    { label: "False Alarm", value: summary.falseAlarm, detail: "Retained for audit" },
  ];

  const visibleCountLabel = `${filteredIncidents.length} visible`;
  const emptyState = filteredIncidents.length === 0;
  const lastUpdatedLabel = lastUpdated ? formatDateTime(lastUpdated.toISOString()) : "Not connected yet";
  const connectionDetail = backendOnline
    ? `Polling every 2.5 seconds. Last update: ${lastUpdatedLabel}`
    : `Backend offline, showing seeded fallback${apiError ? ` (${apiError})` : ""}`;

  return (
    <Box className="incident-dashboard">
      <Box className="incident-hero">
        <Box>
          <Typography className="incident-eyebrow">AI / IoT Monitoring</Typography>
          <Typography component="h1" className="incident-title">
            Admin Incident Detection
          </Typography>
          <Typography className="incident-subtitle">
            Command-center review for AI camera alerts, IoT proximity alerts, evidence metadata,
            and incident status decisions.
          </Typography>
        </Box>
        <Box className="incident-contract-card">
          <span>{statusMode}</span>
          <strong>AI_CAMERA + IOT_SENSOR</strong>
          <small>{connectionDetail}</small>
        </Box>
      </Box>

      <Box className={`incident-state-banner ${backendOnline ? "online" : "fallback"}`}>
        <strong>{backendOnline ? "Backend incident API connected" : "Using seeded fallback incidents"}</strong>
        <span>
          {backendOnline
            ? "Live memory/MySQL incident data is being rendered from /api/incidents."
            : "Start the backend to switch this dashboard from seeded evidence to live runtime incidents."}
        </span>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Typography sx={{ fontWeight: "bold" }}>MQTT:</Typography>
          <Chip
            label={mqttStatus}
            color={mqttStatus === "Connected" ? "success" : "warning"}
            variant="outlined"
          />

          <Typography sx={{ fontWeight: "bold" }}>Camera:</Typography>
          <Chip
            label={cameraStatus}
            color={cameraStatus === "On" ? "success" : "default"}
            variant="outlined"
          />

          <Typography variant="body2" color="text.secondary">
            Topic: {MQTT_TOPIC}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Last message: {lastMqttMessage}
          </Typography>

          <Button variant="outlined" size="small" onClick={testTrigger}>
            Test Trigger
          </Button>

          <Button variant="outlined" size="small" onClick={startCamera}>
            Start Camera
          </Button>

          <Button
            variant="outlined"
            size="small"
            disabled={isCapturing}
            onClick={() => captureOneShot("Manual evidence capture")}
          >
            Capture 720p Shot
          </Button>

          <Button variant="outlined" size="small" color="error" onClick={stopCamera}>
            Stop Camera
          </Button>
        </Box>
      </Paper>

      {mqttStatus !== "Connected" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          MQTT websocket is not connected yet. Check internet access and HiveMQ websocket availability.
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Live Camera Preview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          This browser preview opens on IoT triggers and captures one compressed 720p JPEG for local review. Stop it before running the standalone Python AI camera on the same physical camera.
        </Typography>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            maxWidth: "500px",
            borderRadius: "12px",
            backgroundColor: "#000",
          }}
        />
        <Box sx={{ mt: 1.5 }}>
          <Chip
            label={captureStatus}
            color={capturedShot ? "success" : "default"}
            variant="outlined"
          />
        </Box>
        {capturedShot && (
          <Box sx={{ mt: 2, display: "grid", gap: 1, maxWidth: 500 }}>
            <img
              src={capturedShot.url}
              alt="Compressed local camera capture"
              style={{
                width: "100%",
                borderRadius: "12px",
                border: "1px solid rgba(15, 76, 58, 0.18)",
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {capturedShot.label}: {capturedShot.width}x{capturedShot.height}, {formatBytes(capturedShot.sizeBytes)}. IoT-triggered captures are posted to the backend; manual preview shots stay local.
            </Typography>
          </Box>
        )}
      </Paper>

      <Box className="incident-stat-grid">
        {statusCards.map((card) => (
          <Paper className="incident-stat-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{String(card.value).padStart(2, "0")}</strong>
            <p>{card.detail}</p>
          </Paper>
        ))}
      </Box>

      <Box className="incident-filter-row">
        {INCIDENT_FILTERS.map((filter) => (
          <Button
            key={filter.id}
            className={activeFilter === filter.id ? "active" : ""}
            onClick={() => setActiveFilter(filter.id)}
            type="button"
          >
            {filter.label}
            <span>{filterCounts[filter.id] ?? 0}</span>
          </Button>
        ))}
      </Box>

      <Box className="incident-workspace">
        <Paper className="incident-table-panel">
          <Box className="incident-section-head">
            <Box>
              <Typography className="incident-eyebrow">Review queue</Typography>
              <Typography component="h2">Incident records</Typography>
            </Box>
            <Typography>{isLoading ? "Loading..." : visibleCountLabel}</Typography>
          </Box>

          {emptyState ? (
            <Box className="incident-empty-state">
              <Typography component="h3">No matching incidents</Typography>
              <Typography>
                Change the filter, post an AI incident, or publish an IoT MQTT payload to populate this queue.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table className="incident-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Incident ID</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredIncidents.map((incident) => (
                    <TableRow
                      key={incident.id}
                      hover
                      selected={selectedIncidentId === incident.id}
                      className={`incident-table-row ${selectedIncidentId === incident.id ? "is-selected" : ""}`}
                      onClick={() => setSelectedIncidentId(incident.id)}
                    >
                      <TableCell className="incident-id-cell">{incident.id}</TableCell>
                      <TableCell>
                        <span className={`source-chip ${(incident.source || "").toLowerCase()}`}>
                          {sourceLabel[incident.source] || incident.source}
                        </span>
                      </TableCell>
                      <TableCell>{incident.eventType}</TableCell>
                      <TableCell>
                        <span className={`severity-chip ${incident.severity}`}>
                          {incident.severity}
                        </span>
                      </TableCell>
                      <TableCell>{incident.location}</TableCell>
                      <TableCell>{formatDateTime(incident.timestamp)}</TableCell>
                      <TableCell>
                        <span className={`status-chip ${statusClassName(incident.status)}`}>
                          {incident.status}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          className="incident-detail-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedIncidentId(incident.id);
                          }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <IncidentDetailPanel
          incident={selectedIncident}
          savingIncidentId={savingIncidentId}
          onStatusChange={updateIncidentStatus}
        />
      </Box>
    </Box>
  );
};

const IncidentDetailPanel = ({ incident, savingIncidentId, onStatusChange }) => {
  if (!incident) {
    return (
      <Paper className="incident-detail-panel">
        <Typography component="h2">No incident selected</Typography>
        <Typography>Select a record to inspect incident metadata.</Typography>
      </Paper>
    );
  }

  const probabilities = incident.ai?.probabilities || {};
  const evidenceImageUrl = resolveEvidenceImageUrl(incident.evidenceImage);
  const isLocalCapture = evidenceImageUrl?.startsWith("blob:");
  const bbox = Array.isArray(incident.ai?.bbox) ? incident.ai.bbox : [];
  const isSaving = savingIncidentId === incident.id;

  return (
    <Paper className="incident-detail-panel">
      <Typography className="incident-eyebrow">{sourceLabel[incident.source]}</Typography>
      <Typography component="h2">{incident.eventType}</Typography>
      <Typography className="incident-detail-id">{incident.id}</Typography>
      <Typography className="incident-detail-kicker">
        {incident.source === "AI_CAMERA"
          ? "Evidence review, classification confidence, and bounding-box metadata"
          : "Sensor-only proximity alert with MQTT metadata"}
      </Typography>

      {evidenceImageUrl ? (
        <Box className="incident-evidence-frame">
          <img src={evidenceImageUrl} alt={`${incident.eventType} evidence`} />
          <span className="incident-evidence-caption">
            {isLocalCapture
              ? "Local compressed browser preview while backend save is pending or unavailable."
              : "Browser-safe evidence URL rendered through the app/backend."}
          </span>
        </Box>
      ) : (
        <Box className="incident-no-image">No image evidence for sensor-only alert</Box>
      )}

      <Box className="incident-detail-grid">
        <DetailItem label="Severity" value={incident.severity} />
        <DetailItem label="Status" value={incident.status} />
        <DetailItem label="Location" value={incident.location} />
        <DetailItem label="Timestamp" value={formatDateTime(incident.timestamp)} />
      </Box>

      {incident.source === "AI_CAMERA" && incident.ai && (
        <Box className="incident-metadata-card">
          <Typography component="h3">AI evidence metadata</Typography>
          <DetailItem label="Predicted Class" value={incident.ai.predictedClass || "Unknown"} />
          <DetailItem label="Confidence" value={formatPercent(incident.ai.confidence)} />
          <DetailItem label="Margin" value={formatDecimal(incident.ai.margin)} />
          <DetailItem label="BBox" value={bbox.length ? `[${bbox.join(", ")}]` : "Unavailable"} />
          <DetailItem
            label="Probabilities"
            value={`Plants ${formatPercent(probabilities.TouchingPlants)} / Wildlife ${formatPercent(probabilities.TouchingWildlife)}`}
          />
        </Box>
      )}

      {incident.source === "IOT_SENSOR" && incident.iot && (
        <Box className="incident-metadata-card">
          <Typography component="h3">IoT sensor metadata</Typography>
          <DetailItem label="Sensor ID" value={incident.iot.sensorId} />
          <DetailItem label="Distance" value={`${incident.iot.distanceCm} cm`} />
          <DetailItem label="Threshold" value={`${incident.iot.thresholdCm} cm`} />
          <DetailItem label="MQTT Topic" value={incident.iot.topic} />
          <DetailItem label="Location" value={incident.location} />
        </Box>
      )}

      <Box className="incident-notes">
        <Typography component="h3">Review notes</Typography>
        <Typography>{incident.notes || "No notes recorded for this incident."}</Typography>
      </Box>

      <Box className="incident-status-actions">
        <Typography component="h3">Update incident status</Typography>
        {INCIDENT_STATUSES.map((status) => (
          <Button
            key={status}
            className={incident.status === status ? "active" : ""}
            disabled={isSaving}
            onClick={() => onStatusChange(incident.id, status)}
          >
            {status}
          </Button>
        ))}
      </Box>
    </Paper>
  );
};

const DetailItem = ({ label, value }) => (
  <Box className="incident-detail-item">
    <span>{label}</span>
    <strong>{value ?? "Unavailable"}</strong>
  </Box>
);

export default AIDetection;
