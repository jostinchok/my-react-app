import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
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
  RANGER_INCIDENT_STATUSES,
  normalizeIncidentRecord,
  summarizeIncidents,
} from "../data/incidents";
import "../Admin.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const backendBaseUrl = API_BASE_URL.replace(/\/$/, "");

const sourceLabel = {
  AI_CAMERA: "AI Camera",
  IOT_SENSOR: "IoT Sensor",
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
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "Unknown";
};

const statusClassName = (status = "") => status.toLowerCase().replace(/\s+/g, "-");

const getApiIncidents = (payload) => {
  const records = Array.isArray(payload) ? payload : payload?.incidents || [];
  return records.map(normalizeIncidentRecord).filter(Boolean);
};

const resolveEvidenceImageUrl = (evidenceImage) => {
  if (!evidenceImage || typeof evidenceImage !== "string") return null;
  if (evidenceImage.startsWith("http://") || evidenceImage.startsWith("https://")) {
    return evidenceImage;
  }
  if (evidenceImage.startsWith("/evidence/ai/")) {
    return `${backendBaseUrl}${evidenceImage}`;
  }
  if (evidenceImage.startsWith("/incidents/")) {
    return evidenceImage;
  }
  return null;
};

const ParkRangerConsole = () => {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingIncidentId, setSavingIncidentId] = useState(null);

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

        setIncidents(liveIncidents);
        setApiError("");
        setSelectedIncidentId((currentId) =>
          liveIncidents.some((incident) => incident.id === currentId)
            ? currentId
            : liveIncidents[0]?.id || null
        );
      } catch (error) {
        if (cancelled) return;
        setApiError(error.message);
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

  const summary = useMemo(() => summarizeIncidents(incidents), [incidents]);
  const selectedIncident = incidents.find((incident) => incident.id === selectedIncidentId);
  const activeResponseCount = incidents.filter((incident) =>
    ["New", "Acknowledged", "In Review"].includes(incident.status)
  ).length;

  const statusCards = [
    { label: "Live Incidents", value: summary.total, detail: "Backend runtime queue" },
    { label: "Active Response", value: activeResponseCount, detail: "New or being handled" },
    { label: "Resolved", value: summary.resolved, detail: "Closed by ranger" },
    { label: "False Alarm", value: summary.falseAlarm, detail: "Dismissed after review" },
  ];

  const updateIncidentStatus = async (incidentId, status) => {
    setSavingIncidentId(incidentId);
    setApiError("");

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
        throw new Error("Backend returned an unreadable incident.");
      }

      setIncidents((current) =>
        current.map((incident) =>
          incident.id === updatedIncident.id ? updatedIncident : incident
        )
      );
    } catch (error) {
      setApiError(error.message);
    } finally {
      setSavingIncidentId(null);
    }
  };

  return (
    <Box className="ranger-console">
      <Box component="header" className="ranger-header">
        <Box>
          <Typography className="incident-eyebrow">Park Ranger</Typography>
          <Typography component="h1" className="ranger-title">
            Alert Console
          </Typography>
          <Typography className="ranger-subtitle">
            Live AI camera and IoT proximity incidents from the backend response queue.
          </Typography>
        </Box>
        <Box className="ranger-live-card">
          <span>{apiError ? "Backend offline" : "Live backend"}</span>
          <strong>{apiError || "GET /api/incidents"}</strong>
          <small>{isLoading ? "Loading incident queue" : "Polling every 2.5 seconds"}</small>
        </Box>
      </Box>

      <Box className="ranger-stat-grid">
        {statusCards.map((card) => (
          <Paper className="ranger-stat-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{String(card.value).padStart(2, "0")}</strong>
            <p>{card.detail}</p>
          </Paper>
        ))}
      </Box>

      <Box className="ranger-workspace">
        <Paper className="ranger-table-panel">
          <Box className="incident-section-head">
            <Box>
              <Typography className="incident-eyebrow">Response queue</Typography>
              <Typography component="h2">AI / IoT incidents</Typography>
            </Box>
            <Typography>{incidents.length} live records</Typography>
          </Box>

          {incidents.length === 0 ? (
            <Box className="incident-empty-state">
              <Typography component="h3">No live incidents available</Typography>
              <Typography>
                Start the backend and send an AI camera alert or IoT MQTT payload.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table className="incident-table ranger-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Source</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Open</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incidents.map((incident) => (
                    <TableRow
                      key={incident.id}
                      hover
                      selected={selectedIncidentId === incident.id}
                    >
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
                          onClick={() => setSelectedIncidentId(incident.id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <RangerIncidentDetail
          incident={selectedIncident}
          savingIncidentId={savingIncidentId}
          onStatusChange={updateIncidentStatus}
        />
      </Box>
    </Box>
  );
};

const RangerIncidentDetail = ({ incident, savingIncidentId, onStatusChange }) => {
  if (!incident) {
    return (
      <Paper className="ranger-detail-panel">
        <Typography component="h2">No incident selected</Typography>
        <Typography>Select an incident from the response queue.</Typography>
      </Paper>
    );
  }

  const evidenceImageUrl = resolveEvidenceImageUrl(incident.evidenceImage);
  const probabilities = incident.ai?.probabilities || {};
  const isSaving = savingIncidentId === incident.id;

  return (
    <Paper className="ranger-detail-panel">
      <Typography className="incident-eyebrow">{sourceLabel[incident.source]}</Typography>
      <Typography component="h2">{incident.eventType}</Typography>
      <Typography className="incident-detail-id">{incident.id}</Typography>

      {evidenceImageUrl ? (
        <Box className="incident-evidence-frame ranger-evidence-frame">
          <img src={evidenceImageUrl} alt={`${incident.eventType} evidence`} />
        </Box>
      ) : (
        <Box className="incident-no-image">No image evidence for this alert</Box>
      )}

      <Box className="incident-detail-grid">
        <DetailItem label="Source" value={sourceLabel[incident.source] || incident.source} />
        <DetailItem label="Severity" value={incident.severity} />
        <DetailItem label="Location" value={incident.location} />
        <DetailItem label="Timestamp" value={formatDateTime(incident.timestamp)} />
        <DetailItem label="Status" value={incident.status} />
      </Box>

      {incident.source === "AI_CAMERA" && incident.ai && (
        <Box className="incident-metadata-card">
          <Typography component="h3">AI metadata</Typography>
          <DetailItem label="Predicted Class" value={incident.ai.predictedClass || "Unknown"} />
          <DetailItem label="Confidence" value={formatPercent(incident.ai.confidence)} />
          <DetailItem label="Margin" value={Number(incident.ai.margin || 0).toFixed(2)} />
          <DetailItem label="BBox" value={`[${incident.ai.bbox.join(", ")}]`} />
          <DetailItem
            label="Probabilities"
            value={`Plants ${formatPercent(probabilities.TouchingPlants)} / Wildlife ${formatPercent(probabilities.TouchingWildlife)}`}
          />
        </Box>
      )}

      {incident.source === "IOT_SENSOR" && incident.iot && (
        <Box className="incident-metadata-card">
          <Typography component="h3">IoT metadata</Typography>
          <DetailItem label="Sensor ID" value={incident.iot.sensorId} />
          <DetailItem label="Distance" value={`${incident.iot.distanceCm} cm`} />
          <DetailItem label="Threshold" value={`${incident.iot.thresholdCm} cm`} />
          <DetailItem label="MQTT Topic" value={incident.iot.topic} />
        </Box>
      )}

      <Box className="incident-status-actions ranger-status-actions">
        {RANGER_INCIDENT_STATUSES.map((status) => (
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

export default ParkRangerConsole;
