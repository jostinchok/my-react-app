import React, { useEffect, useMemo, useRef, useState } from "react";
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

const sourceLabel = {
  AI_CAMERA: "AI Camera",
  IOT_SENSOR: "IoT Sensor",
};

const resolveEvidenceImageUrl = (evidenceImage) => {
  if (!evidenceImage) return null;
  if (evidenceImage.startsWith("http://") || evidenceImage.startsWith("https://")) {
    return evidenceImage;
  }
  if (evidenceImage.startsWith("/evidence/ai/")) {
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

const AIDetection = () => {
  const mqttClientRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const [incidents, setIncidents] = useState(seededIncidents);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedIncidentId, setSelectedIncidentId] = useState(seededIncidents[0]?.id);
  const [backendOnline, setBackendOnline] = useState(false);
  const [apiError, setApiError] = useState("");

  const [mqttStatus, setMqttStatus] = useState("Connecting...");
  const [lastMqttMessage, setLastMqttMessage] = useState("No trigger received yet");
  const [cameraStatus, setCameraStatus] = useState("Off");

  const startCamera = async () => {
    try {
      if (cameraStreamRef.current) {
        setCameraStatus("On");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraStatus("On");
    } catch (error) {
      console.error("Camera error:", error);
      setCameraStatus("Camera error");
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStatus("Off");
  };

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

        setBackendOnline(true);
        setApiError("");
        setIncidents(liveIncidents);
        setSelectedIncidentId((currentId) =>
          liveIncidents.some((incident) => incident.id === currentId)
            ? currentId
            : liveIncidents[0]?.id || null
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

      if (data.source === "IOT_SENSOR" && data.event_type === "ObjectCloseToPlant") {
        await startCamera();

        const newIncident = {
          id: `iot_${Date.now()}`,
          source: "IOT_SENSOR",
          eventType: data.event_type,
          severity: data.severity || "low",
          location: data.location || "Plant Zone 01",
          timestamp: Date.now(),
          status: "New",
          evidenceImage: null,
          notes: "Triggered by ESP32 ultrasonic sensor through MQTT.",
          iot: {
            sensorId: data.sensor_id || "plant-zone-01",
            distanceCm: data.distance_cm ?? "Unknown",
            thresholdCm: data.threshold_cm ?? 20,
            topic: MQTT_TOPIC,
          },
        };

        setIncidents((prev) => [newIncident, ...prev]);
        setSelectedIncidentId(newIncident.id);
      }
    });

    return () => {
      client.end(true);
      stopCamera();
    };
  }, []);

  const summary = useMemo(() => summarizeIncidents(incidents), [incidents]);
  const filteredIncidents = useMemo(
    () => getFilteredIncidents(incidents, activeFilter),
    [incidents, activeFilter]
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

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/incidents/${encodeURIComponent(incidentId)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
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
    }
  };

  const testTrigger = () => {
    const client = mqttClientRef.current;

    if (!client || !client.connected) {
      console.error("MQTT is not connected yet");
      return;
    }

    client.publish(
      MQTT_TOPIC,
      JSON.stringify({
        source: "IOT_SENSOR",
        event_type: "ObjectCloseToPlant",
        sensor_id: "plant-zone-01",
        location: "Plant Zone 01",
        distance_cm: 12.5,
        threshold_cm: 20,
        status: "triggered",
        severity: "low",
      })
    );
  };

  const statusMode = backendOnline ? "Live backend" : "Seeded fallback";

  const updateSelectedIncident = (incidentId) => {
    setSelectedIncidentId(incidentId);
  };

  const statusCards = [
    { label: "Total Incidents", value: summary.total, detail: backendOnline ? "Live in-memory incidents" : "Seeded fallback incidents" },
    { label: "AI Camera", value: summary.ai, detail: "TouchingPlants / TouchingWildlife" },
    { label: "IoT Sensor", value: summary.iot, detail: "ObjectCloseToPlant readings" },
    { label: "New", value: summary.new, detail: "Needs admin review" },
    { label: "Reviewed", value: summary.reviewed, detail: "Checked by admin" },
    { label: "False Alarm", value: summary.falseAlarm, detail: "Kept for audit trail" },
  ];

  const visibleCountLabel = `${filteredIncidents.length} visible`;
  const emptyState = filteredIncidents.length === 0;

  const connectionDetail = backendOnline
    ? "Polling live runtime incidents every 2.5 seconds"
    : `Backend offline, showing seeded fallback${apiError ? ` (${apiError})` : ""}`;

  return (
    <Box className="incident-dashboard">
      <Box className="incident-hero">
        <Box>
          <Typography className="incident-eyebrow">AI / IoT Monitoring</Typography>
          <Typography component="h1" className="incident-title">
            Admin Incident Dashboard
          </Typography>
          <Typography className="incident-subtitle">
            Live incident review for real-time AI camera alerts and IoT proximity sensor alerts.
            Express/MySQL is intentionally not connected yet.
          </Typography>
        </Box>
        <Box className="incident-contract-card">
          <span>{statusMode}</span>
          <strong>AI_CAMERA + IOT_SENSOR</strong>
          <small>{connectionDetail}</small>
        </Box>
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

          <Button variant="outlined" size="small" color="error" onClick={stopCamera}>
            Stop Camera
          </Button>
        </Box>
      </Paper>

      {mqttStatus !== "Connected" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          The app is not connected to MQTT yet. Make sure the laptop has internet and HiveMQ websocket access is available.
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Live Camera Preview
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
            <Typography>{visibleCountLabel}</Typography>
          </Box>

          {emptyState ? (
            <Box className="incident-empty-state">
              <Typography component="h3">No live incidents yet</Typography>
              <Typography>Post an AI incident or publish an IoT MQTT payload to populate the queue.</Typography>
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
                        <span className={`status-chip ${incident.status.toLowerCase().replace(" ", "-")}`}>
                          {incident.status}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          className="incident-detail-button"
                          onClick={() => updateSelectedIncident(incident.id)}
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
          onStatusChange={updateIncidentStatus}
        />
      </Box>
    </Box>
  );
};

const IncidentDetailPanel = ({ incident, onStatusChange }) => {
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

  return (
    <Paper className="incident-detail-panel">
      <Typography className="incident-eyebrow">{sourceLabel[incident.source]}</Typography>
      <Typography component="h2">{incident.eventType}</Typography>
      <Typography className="incident-detail-id">{incident.id}</Typography>

      {evidenceImageUrl ? (
        <Box className="incident-evidence-frame">
          <img src={evidenceImageUrl} alt={`${incident.eventType} evidence`} />
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
          <DetailItem label="Confidence" value={`${Math.round(incident.ai.confidence * 100)}%`} />
          <DetailItem label="Margin" value={incident.ai.margin.toFixed(2)} />
          <DetailItem label="BBox" value={`[${incident.ai.bbox.join(", ")}]`} />
          <DetailItem
            label="Probabilities"
            value={`Plants ${(probabilities.TouchingPlants * 100).toFixed(0)}% / Wildlife ${(probabilities.TouchingWildlife * 100).toFixed(0)}%`}
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
        </Box>
      )}

      <Box className="incident-notes">
        <Typography component="h3">Notes</Typography>
        <Typography>{incident.notes}</Typography>
      </Box>

      <Box className="incident-status-actions">
        {INCIDENT_STATUSES.map((status) => (
          <Button
            key={status}
            className={incident.status === status ? "active" : ""}
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
    <strong>{value}</strong>
  </Box>
);

export default AIDetection;