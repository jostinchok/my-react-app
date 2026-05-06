import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  normalizeIncidentRecord,
  seededIncidents,
  summarizeIncidents,
} from "../data/incidents";
import {
  demoParkUserProfile,
  parkRangerProfile,
} from "../data/roleProfiles";
import "../Admin.css";

const API_BASE_URL = import.meta.env.VITE_MONITORING_API_BASE_URL || "http://localhost:4000";
const backendBaseUrl = API_BASE_URL.replace(/\/$/, "");
const adminBasePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const logoSrc = `${adminBasePath}sfc-citrus-logo.webp`;
const NOT_AVAILABLE = "Not available";

const sourceLabel = {
  AI_CAMERA: "AI Camera",
  IOT_SENSOR: "IoT Sensor",
};

const rangerRecommendations = [
  { recommendation: "Recommend Acknowledged", label: "Recommend Acknowledged" },
  { recommendation: "Recommend In Review", label: "Recommend In Review" },
  { recommendation: "Recommend Resolved", label: "Recommend Resolved" },
  { recommendation: "Recommend False Alarm", label: "Recommend False Alarm" },
];

const MAX_FIELD_NOTE_LENGTH = 1000;

const responsePriority = {
  New: 1,
  Acknowledged: 2,
  "In Review": 3,
  Reviewed: 4,
  Resolved: 5,
  "False Alarm": 6,
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return NOT_AVAILABLE;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return NOT_AVAILABLE;

  return date.toLocaleString("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatTableTime = (timestamp) => {
  if (!timestamp) return NOT_AVAILABLE;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return NOT_AVAILABLE;

  return date.toLocaleString("en-MY", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPercent = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : NOT_AVAILABLE;
};

const formatDecimal = (value, digits = 2) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : NOT_AVAILABLE;
};

const displayValue = (value) => {
  if (value === null || value === undefined) return NOT_AVAILABLE;
  if (typeof value === "string" && value.trim() === "") return NOT_AVAILABLE;
  return value;
};

const formatCentimeters = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? `${number} cm` : NOT_AVAILABLE;
};

const statusClassName = (status = "") => String(status).toLowerCase().replace(/\s+/g, "-");

const getApiIncidents = (payload) => {
  const records = Array.isArray(payload) ? payload : payload?.incidents || [];
  return records.map(normalizeIncidentRecord).filter(Boolean);
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
  if (evidenceImage.startsWith("/incidents/") || evidenceImage.startsWith("/admin/incidents/")) {
    return evidenceImage;
  }
  return null;
};

const ParkRangerConsole = () => {
  const [incidents, setIncidents] = useState(seededIncidents);
  const [selectedIncidentId, setSelectedIncidentId] = useState(seededIncidents[0]?.id || null);
  const [apiError, setApiError] = useState("");
  const [backendOnline, setBackendOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savingIncidentId, setSavingIncidentId] = useState(null);
  const [fieldNotes, setFieldNotes] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

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
        setIncidents(liveIncidents);
        setApiError("");
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

  const responseQueue = useMemo(
    () =>
      [...incidents].sort((a, b) => {
        const priorityDiff = (responsePriority[a.status] || 99) - (responsePriority[b.status] || 99);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }),
    [incidents]
  );
  const summary = useMemo(() => summarizeIncidents(incidents), [incidents]);
  const selectedIncident = incidents.find((incident) => incident.id === selectedIncidentId);
  const activeResponseCount = incidents.filter((incident) =>
    ["New", "Acknowledged", "In Review"].includes(incident.status)
  ).length;
  const urgentCount = incidents.filter((incident) => incident.status === "New").length;
  const rangerIdentityRows = [
    ["Ranger ID", parkRangerProfile.rangerId],
    ["Staff ID", parkRangerProfile.staffId],
    ["Badge ID", parkRangerProfile.badgeId],
    ["Station", parkRangerProfile.station],
    ["Patrol zone", parkRangerProfile.patrolZone],
    ["Shift", parkRangerProfile.shift],
  ];
  const parkUserIdentityRows = [
    ["Guide ID", demoParkUserProfile.guideId],
    ["Training ID", demoParkUserProfile.trainingId],
    ["Email", demoParkUserProfile.email],
    ["Assigned park", demoParkUserProfile.assignedPark],
    ["Course track", demoParkUserProfile.courseTrack],
    ["Certification", demoParkUserProfile.certificationStatus],
  ];

  const statusCards = [
    { label: "Active Response", value: activeResponseCount, detail: "New, acknowledged, or in review" },
    { label: "Urgent / New", value: urgentCount, detail: "Needs field acknowledgement" },
    { label: "AI Camera", value: summary.ai, detail: "Image evidence available when captured" },
    { label: "IoT Sensor", value: summary.iot, detail: "Distance-threshold proximity alerts" },
  ];

  const appendLocalRecommendation = (incidentId, recommendation, note) => {
    const localRecommendation = {
      id: `LOCAL-${Date.now()}`,
      recommendation,
      note,
      actorRole: "park_ranger",
      actorLabel: "Park Ranger alert console",
      createdAt: new Date().toISOString(),
    };

    setIncidents((current) =>
      current.map((incident) =>
        incident.id === incidentId
          ? {
              ...incident,
              rangerRecommendations: [
                localRecommendation,
                ...(incident.rangerRecommendations || []),
              ],
            }
          : incident
      )
    );
  };

  const updateFieldNote = (incidentId, note) => {
    setFieldNotes((current) => ({
      ...current,
      [incidentId]: note.slice(0, MAX_FIELD_NOTE_LENGTH),
    }));
  };

  const submitRangerRecommendation = async (incidentId, recommendation) => {
    const note = String(fieldNotes[incidentId] || "").trim();
    if (!note) {
      setApiError("Add a field note before sending a recommendation.");
      setSuccessMessage("");
      return;
    }

    setSavingIncidentId(incidentId);
    setApiError("");
    setSuccessMessage("");

    if (!backendOnline) {
      appendLocalRecommendation(incidentId, recommendation, note);
      setFieldNotes((current) => ({ ...current, [incidentId]: "" }));
      setSuccessMessage("Recommendation saved locally for this demo; start the backend to send it to Admin.");
      setSavingIncidentId(null);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/incidents/${encodeURIComponent(incidentId)}/ranger-recommendation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Actor-Role": "park_ranger",
          },
          body: JSON.stringify({ recommendation, note }),
        }
      );

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.message || `Recommendation failed with ${response.status}`);
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
      setFieldNotes((current) => ({ ...current, [incidentId]: "" }));
      setSuccessMessage(payload.message || "Recommendation sent to Admin for review.");
    } catch (error) {
      setApiError(error.message);
      if (error instanceof TypeError) {
        setBackendOnline(false);
      }
    } finally {
      setSavingIncidentId(null);
    }
  };

  return (
    <Box className="ranger-standalone-shell">
      <Box className="ranger-standalone-topbar">
        <Box className="ranger-standalone-brand">
          <Box component="img" src={logoSrc} alt="SFC Digital Portal logo" />
          <Box>
            <strong>SFC Ranger Portal</strong>
            <span>{parkRangerProfile.rangerId} / {parkRangerProfile.radioCallsign}</span>
          </Box>
        </Box>
        <Box className="ranger-standalone-links">
          <Button href="/admin/detection">Admin incident review</Button>
          <Button href="/admin">Admin dashboard</Button>
        </Box>
      </Box>

    <Box className="ranger-console">
      <Box component="header" className="ranger-header">
        <Box>
          <Box className="incident-page-brand">
            <Box component="img" src={logoSrc} alt="SFC Digital Portal logo" />
            <span>SFC Digital Portal</span>
          </Box>
          <Typography className="incident-eyebrow">Park Ranger</Typography>
          <Typography component="h1" className="ranger-title">
            Field Response Console
          </Typography>
          <Typography className="ranger-subtitle">
            Response-only view for live AI camera and IoT proximity incidents. Park Rangers can view
            evidence, add field notes, and recommend outcomes for Admin review.
          </Typography>

          <Box className="ranger-identity-grid">
            <RangerIdentityCard
              title="Current Park Ranger"
              name={parkRangerProfile.name}
              role={parkRangerProfile.roleLabel}
              rows={rangerIdentityRows}
            />
            <RangerIdentityCard
              title="Park User Reference"
              name={demoParkUserProfile.name}
              role={demoParkUserProfile.roleLabel}
              rows={parkUserIdentityRows}
            />
          </Box>
        </Box>
        <Box className="ranger-live-card">
          <span>{backendOnline ? "Live backend" : "Seeded fallback"}</span>
          <strong>{apiError || "GET /api/incidents"}</strong>
          <small>{isLoading ? "Loading incident queue" : "Polling every 2.5 seconds"}</small>
        </Box>
      </Box>

      <Box className="ranger-boundary-card">
        <strong>Role boundary</strong>
        <span>Park Ranger response scope only: recommendations and field notes are sent for Admin review.</span>
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
            <Typography>{isLoading ? "Loading..." : `${responseQueue.length} records`}</Typography>
          </Box>

          {responseQueue.length === 0 ? (
            <Box className="incident-empty-state">
              <Typography component="h3">No incidents available</Typography>
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
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Open</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {responseQueue.map((incident) => (
                    <TableRow
                      key={incident.id}
                      hover
                      selected={selectedIncidentId === incident.id}
                      className={`incident-table-row ${incident.status === "New" ? "is-urgent" : ""} ${
                        selectedIncidentId === incident.id ? "is-selected" : ""
                      }`}
                      onClick={() => setSelectedIncidentId(incident.id)}
                    >
                      <TableCell>
                        <span className={`source-chip ${(incident.source || "").toLowerCase()}`}>
                          {sourceLabel[incident.source] || incident.source}
                        </span>
                      </TableCell>
                      <TableCell className="ranger-event-cell">{displayValue(incident.eventType)}</TableCell>
                      <TableCell>
                        <span className={`severity-chip ${incident.severity}`}>
                          {displayValue(incident.severity)}
                        </span>
                      </TableCell>
                      <TableCell className="ranger-location-cell" title={incident.location}>
                        {displayValue(incident.location)}
                      </TableCell>
                      <TableCell className="ranger-time-cell" title={formatDateTime(incident.timestamp)}>
                        {formatTableTime(incident.timestamp)}
                      </TableCell>
                      <TableCell>
                        <span className={`status-chip ${statusClassName(incident.status)}`}>
                          {displayValue(incident.status)}
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
          fieldNote={fieldNotes[selectedIncident?.id] || ""}
          successMessage={successMessage}
          onFieldNoteChange={updateFieldNote}
          onRecommendationSubmit={submitRangerRecommendation}
        />
      </Box>
    </Box>
    </Box>
  );
};

const RangerIdentityCard = ({ title, name, role, rows }) => (
  <Box className="ranger-identity-card">
    <span>{title}</span>
    <strong>{name}</strong>
    <small>{role}</small>
    <Box className="ranger-identity-fields">
      {rows.map(([label, value]) => (
        <Box key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </Box>
      ))}
    </Box>
  </Box>
);

const RangerIncidentDetail = ({
  incident,
  savingIncidentId,
  fieldNote,
  successMessage,
  onFieldNoteChange,
  onRecommendationSubmit,
}) => {
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
  const bbox = Array.isArray(incident.ai?.bbox) ? incident.ai.bbox : [];
  const isSaving = savingIncidentId === incident.id;
  const recommendations = incident.rangerRecommendations || [];

  return (
    <Paper className="ranger-detail-panel">
      <Typography className="incident-eyebrow">{sourceLabel[incident.source]}</Typography>
      <Typography component="h2">{incident.eventType}</Typography>
      <Typography className="incident-detail-id">{incident.id}</Typography>
      <Typography className="incident-detail-kicker">
        Response package: location, severity, evidence, metadata, field note, and recommendation actions.
      </Typography>

      {evidenceImageUrl ? (
        <Box className="incident-evidence-frame ranger-evidence-frame">
          <img src={evidenceImageUrl} alt={`${incident.eventType} evidence`} />
          <span className="incident-evidence-caption">Evidence preview for response review.</span>
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

      {incident.source === "AI_CAMERA" && incident.ai ? (
        <Box className="incident-metadata-card">
          <Typography component="h3">AI metadata</Typography>
          <DetailItem label="Predicted Class" value={incident.ai.predictedClass} />
          <DetailItem label="Confidence" value={formatPercent(incident.ai.confidence)} />
          <DetailItem label="Margin" value={formatDecimal(incident.ai.margin)} />
        <DetailItem label="BBox" value={bbox.length ? `[${bbox.join(", ")}]` : NOT_AVAILABLE} />
          <DetailItem
            label="Probabilities"
            value={`Plants ${formatPercent(probabilities.PluckingPlants)} / Wildlife ${formatPercent(probabilities.TouchingWildlife)}`}
          />
        </Box>
      ) : incident.source === "AI_CAMERA" ? (
        <MetadataPlaceholder message="No AI metadata available for this incident." />
      ) : null}

      {incident.source === "IOT_SENSOR" && incident.iot ? (
        <Box className="incident-metadata-card">
          <Typography component="h3">IoT metadata</Typography>
          <DetailItem label="Sensor ID" value={incident.iot.sensorId} />
          <DetailItem label="Distance" value={formatCentimeters(incident.iot.distanceCm)} />
          <DetailItem label="Threshold" value={formatCentimeters(incident.iot.thresholdCm)} />
          <DetailItem label="MQTT Topic" value={incident.iot.topic} />
          <DetailItem label="Location" value={incident.location} />
        </Box>
      ) : incident.source === "IOT_SENSOR" ? (
        <MetadataPlaceholder message="No IoT metadata available for this incident." />
      ) : null}

      <Box className="incident-notes ranger-notes">
        <Typography component="h3">Incident notes</Typography>
        <Typography>{incident.notes || "No notes recorded for this incident."}</Typography>
      </Box>

      {recommendations.length > 0 && (
        <Box className="ranger-recommendation-history">
          <Typography component="h3">Ranger recommendations</Typography>
          {recommendations.slice(0, 3).map((item) => (
            <Box className="ranger-recommendation-item" key={item.id || `${item.recommendation}-${item.createdAt}`}>
              <strong>{item.recommendation}</strong>
              <span>{formatDateTime(item.createdAt)}</span>
              <p>{item.note || "No field note supplied."}</p>
            </Box>
          ))}
        </Box>
      )}

      <Box className="ranger-recommendation-form">
        <Typography component="h3">Field note</Typography>
        <TextField
          value={fieldNote}
          onChange={(event) => onFieldNoteChange(incident.id, event.target.value)}
          placeholder="Add what you observed in the field for Admin review."
          multiline
          minRows={3}
          fullWidth
          disabled={isSaving}
          inputProps={{ maxLength: MAX_FIELD_NOTE_LENGTH }}
        />
        <Typography className="ranger-note-count">
          {fieldNote.length}/{MAX_FIELD_NOTE_LENGTH}
        </Typography>

        <Box className="ranger-recommendation-actions">
          <Typography component="h3">Recommendation</Typography>
          {rangerRecommendations.map((action) => (
            <Button
              key={action.recommendation}
              disabled={isSaving || !fieldNote.trim()}
              onClick={() => onRecommendationSubmit(incident.id, action.recommendation)}
            >
              {action.label}
            </Button>
          ))}
        </Box>

        {successMessage && (
          <Alert className="ranger-success-alert" severity="success">
            {successMessage}
          </Alert>
        )}
      </Box>
    </Paper>
  );
};

const MetadataPlaceholder = ({ message }) => (
  <Box className="incident-metadata-placeholder">
    <Typography>{message}</Typography>
  </Box>
);

const DetailItem = ({ label, value }) => (
  <Box className="incident-detail-item">
    <span>{label}</span>
    <strong>{displayValue(value)}</strong>
  </Box>
);

export default ParkRangerConsole;
