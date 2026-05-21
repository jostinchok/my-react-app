import { authFetch, consumeAuthHandoff } from "../utils/authFetch";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  displayEventType,
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
const loginUrl = import.meta.env.VITE_LOGIN_URL || "http://localhost:5176/login/";
const rangerLoginUrl = `${loginUrl}${loginUrl.includes("?") ? "&" : "?"}role=ranger`;
const NOT_AVAILABLE = "Not available";
const RANGER_PROFILE_STORAGE_KEY = "sfc_ranger_profile";

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

const isRangerRole = (role = "") => ["ranger", "park_ranger"].includes(String(role).toLowerCase());

const readStoredSession = () => {
  if (typeof window === "undefined") return null;
  consumeAuthHandoff();

  try {
    return JSON.parse(localStorage.getItem("sfc_session") || "null");
  } catch {
    return null;
  }
};

const clearStoredSession = () => {
  try {
    localStorage.removeItem("sfc_token");
    localStorage.removeItem("sfc_session");
    sessionStorage.removeItem("sfc_token");
    sessionStorage.removeItem("sfc_session");
  } catch {
    // Storage can be unavailable in hardened browser modes; navigation still completes logout.
  }
};

const readRangerProfile = (session) => {
  let savedProfile = {};
  try {
    savedProfile = JSON.parse(localStorage.getItem(RANGER_PROFILE_STORAGE_KEY) || "{}");
  } catch {
    savedProfile = {};
  }

  return {
    name: session?.name || parkRangerProfile.name,
    email: session?.email || "ranger1@demo.local",
    phone: savedProfile.phone || "+60 82 555 014",
    station: savedProfile.station || parkRangerProfile.station,
    patrolZone: savedProfile.patrolZone || parkRangerProfile.patrolZone,
    shift: savedProfile.shift || parkRangerProfile.shift,
    radioCallsign: savedProfile.radioCallsign || parkRangerProfile.radioCallsign,
  };
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
  const [rangerSession, setRangerSession] = useState(readStoredSession);
  const [rangerProfile, setRangerProfile] = useState(() => readRangerProfile(readStoredSession()));
  const [incidents, setIncidents] = useState(seededIncidents);
  const [selectedIncidentId, setSelectedIncidentId] = useState(seededIncidents[0]?.id || null);
  const [apiError, setApiError] = useState("");
  const [backendOnline, setBackendOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savingIncidentId, setSavingIncidentId] = useState(null);
  const [fieldNotes, setFieldNotes] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [recommendationError, setRecommendationError] = useState("");
  const rangerLoggedIn = isRangerRole(rangerSession?.role);

  useEffect(() => {
    if (!rangerLoggedIn) return;

    try {
      localStorage.setItem(RANGER_PROFILE_STORAGE_KEY, JSON.stringify({
        phone: rangerProfile.phone,
        station: rangerProfile.station,
        patrolZone: rangerProfile.patrolZone,
        shift: rangerProfile.shift,
        radioCallsign: rangerProfile.radioCallsign,
      }));
    } catch {
      // Profile edits remain in memory if local storage is unavailable.
    }
  }, [rangerLoggedIn, rangerProfile]);

  useEffect(() => {
    if (!rangerLoggedIn) {
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchIncidents = async () => {
      try {
        const response = await authFetch(`${API_BASE_URL}/api/incidents`, { cache: "no-store" });
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
  }, [rangerLoggedIn]);

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
  const escalatedIncidents = incidents.filter((incident) => incident.escalations?.length > 0);
  const highSeverityIncidents = incidents.filter((incident) =>
    incident.severity === "high" && !["Resolved", "False Alarm"].includes(incident.status)
  );
  const rangerNotifications = [
    ...escalatedIncidents.map((incident) => ({
      id: `escalated-${incident.id}`,
      incident,
      title: "Admin escalated incident",
      detail: incident.escalations?.[0]?.note || "Admin requested Park Ranger field review.",
      priority: incident.escalations?.[0]?.priority || "urgent",
      createdAt: incident.escalations?.[0]?.createdAt || incident.timestamp,
    })),
    ...highSeverityIncidents
      .filter((incident) => !escalatedIncidents.some((item) => item.id === incident.id))
      .map((incident) => ({
        id: `high-${incident.id}`,
        incident,
        title: "High severity incident",
        detail: "High severity incidents appear here automatically for Ranger attention.",
        priority: "urgent",
        createdAt: incident.timestamp,
      })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const activeResponseCount = incidents.filter((incident) =>
    ["New", "Acknowledged", "In Review"].includes(incident.status)
  ).length;
  const urgentCount = incidents.filter((incident) => incident.status === "New").length;
  const recommendationCount = incidents.reduce(
    (total, incident) => total + (incident.rangerRecommendations?.length || 0),
    0
  );
  const recommendationsSent = incidents
    .flatMap((incident) =>
      (incident.rangerRecommendations || []).map((item) => ({
        ...item,
        incidentId: incident.id,
        eventType: incident.eventType,
        officialStatus: incident.status,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const feedStatusLabel = backendOnline ? "Live backend connected" : "Demo fallback active";
  const feedStatusDetail = backendOnline
    ? `${responseQueue.length} incident records are syncing from the local monitoring API.`
    : "Seeded response data is shown so the Ranger workflow remains demo-ready.";
  const feedStatusMeta = isLoading
    ? "Loading incident queue"
    : backendOnline
      ? "Polling every 2.5 seconds"
      : apiError || "Local seeded incidents loaded";
  const rangerIdentityRows = [
    ["Ranger ID", parkRangerProfile.rangerId],
    ["Email", rangerProfile.email],
    ["Badge ID", parkRangerProfile.badgeId],
    ["Station", rangerProfile.station],
    ["Patrol zone", rangerProfile.patrolZone],
    ["Shift", rangerProfile.shift],
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
    { label: "Escalated / High", value: rangerNotifications.length, detail: "Ranger notifications needing attention" },
    { label: "Recommendations", value: recommendationCount, detail: "Advisory notes waiting for Admin review" },
  ];

  const updateRangerProfile = (field, value) => {
    setRangerProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const logoutRanger = () => {
    clearStoredSession();
    setRangerSession(null);
    window.location.assign(rangerLoginUrl);
  };

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
      setRecommendationError("Add a field note before sending a recommendation.");
      setSuccessMessage("");
      return;
    }

    setSavingIncidentId(incidentId);
    setApiError("");
    setRecommendationError("");
    setSuccessMessage("");

    if (!backendOnline) {
      appendLocalRecommendation(incidentId, recommendation, note);
      setFieldNotes((current) => ({ ...current, [incidentId]: "" }));
      setRecommendationError("");
      setSuccessMessage("Recommendation saved locally for this demo; start the backend to send it to Admin.");
      setSavingIncidentId(null);
      return;
    }

    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/incidents/${encodeURIComponent(incidentId)}/ranger-recommendation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
      setRecommendationError(`Recommendation was not saved to Admin: ${error.message}`);
      if (error instanceof TypeError) {
        setBackendOnline(false);
      }
    } finally {
      setSavingIncidentId(null);
    }
  };

  if (!rangerLoggedIn) {
    return (
      <RangerLoginGate
        session={rangerSession}
        onLogout={logoutRanger}
      />
    );
  }

  return (
    <Box className="ranger-standalone-shell">
      <Box className="ranger-standalone-topbar">
        <Box className="ranger-standalone-brand">
          <Box component="img" src={logoSrc} alt="SFC Digital Portal logo" />
          <Box>
            <strong>SFC Ranger Portal</strong>
            <span>{rangerProfile.name} / {rangerProfile.radioCallsign}</span>
          </Box>
        </Box>
        <Box className="ranger-standalone-links">
          <Button href="#ranger-profile">Profile</Button>
          <Button href="#ranger-recommendations">Sent recommendations</Button>
          <Button onClick={logoutRanger}>Logout</Button>
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
              name={rangerProfile.name}
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
          <span>{feedStatusLabel}</span>
          <strong>{feedStatusDetail}</strong>
          <small>{feedStatusMeta}</small>
        </Box>
      </Box>

      <Box className="ranger-boundary-card">
        <strong>Role boundary</strong>
        <span>Park Rangers can recommend outcomes. Admin remains responsible for official status updates.</span>
      </Box>

      <RangerNotificationPanel
        notifications={rangerNotifications}
        onSelectIncident={(incidentId) => setSelectedIncidentId(incidentId)}
      />

      <Box className="ranger-stat-grid">
        {statusCards.map((card) => (
          <Paper className="ranger-stat-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{String(card.value).padStart(2, "0")}</strong>
            <p>{card.detail}</p>
          </Paper>
        ))}
      </Box>

      <Box className="ranger-support-grid">
        <RangerProfilePanel
          profile={rangerProfile}
          onProfileChange={updateRangerProfile}
        />
        <RangerRecommendationSummary recommendations={recommendationsSent} />
      </Box>

      <Box className="ranger-workspace">
        <Paper className="ranger-table-panel">
          <Box className="incident-section-head">
            <Box>
              <Typography className="incident-eyebrow">Response queue</Typography>
              <Typography component="h2">AI / IoT incidents</Typography>
            </Box>
            <Typography>{isLoading ? "Loading queue..." : `${responseQueue.length} visible records`}</Typography>
          </Box>

          {responseQueue.length === 0 ? (
            <Box className="incident-empty-state">
              <Typography component="h3">No incidents available</Typography>
              <Typography>
                Start the backend and send an AI camera alert or IoT MQTT payload.
              </Typography>
            </Box>
          ) : (
            <Box className="ranger-response-list">
              {responseQueue.map((incident) => (
                <Box
                  key={incident.id}
                  component="button"
                  type="button"
                  className={`ranger-response-card ${incident.status === "New" ? "is-urgent" : ""} ${
                    selectedIncidentId === incident.id ? "is-selected" : ""
                  }`}
                  onClick={() => setSelectedIncidentId(incident.id)}
                >
                  <Box className="ranger-response-card-top">
                    <Box className="ranger-response-id">
                      <span>Incident ID</span>
                      <strong>{incident.id}</strong>
                    </Box>
                    <Box className="ranger-response-chip-row">
                      <span className={`source-chip ${(incident.source || "").toLowerCase()}`}>
                        {sourceLabel[incident.source] || incident.source}
                      </span>
                      <span className={`status-chip ${statusClassName(incident.status)}`}>
                        {displayValue(incident.status)}
                      </span>
                    </Box>
                  </Box>
                  <Typography className="ranger-response-event">
                    {displayValue(incident.eventType)}
                  </Typography>
                  <Box className="ranger-response-grid">
                    <Box>
                      <span>Severity</span>
                      <strong className={`severity-chip ${incident.severity}`}>
                        {displayValue(incident.severity)}
                      </strong>
                    </Box>
                    <Box>
                      <span>Location</span>
                      <strong>{displayValue(incident.location)}</strong>
                    </Box>
                    <Box>
                      <span>Timestamp</span>
                      <strong>{formatTableTime(incident.timestamp)}</strong>
                    </Box>
                    <Box>
                      <span>Ranger Action</span>
                      <strong>Open recommendation</strong>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        <RangerIncidentDetail
          incident={selectedIncident}
          savingIncidentId={savingIncidentId}
          fieldNote={fieldNotes[selectedIncident?.id] || ""}
          successMessage={successMessage}
          errorMessage={recommendationError}
          onFieldNoteChange={updateFieldNote}
          onRecommendationSubmit={submitRangerRecommendation}
        />
      </Box>
    </Box>
    </Box>
  );
};

const RangerLoginGate = ({ session, onLogout }) => (
  <Box className="ranger-standalone-shell">
    <Box className="ranger-login-gate">
      <Box className="ranger-login-brand">
        <Box component="img" src={logoSrc} alt="SFC Digital Portal logo" />
        <Box>
          <span>Park Ranger Portal</span>
          <strong>Login required</strong>
        </Box>
      </Box>
      <Typography component="h1">Ranger access is separate from Admin.</Typography>
      <Typography>
        Sign in with a Park Ranger account to view escalated incidents, high-severity alerts,
        manage your ranger profile, and review recommendations you have sent.
      </Typography>
      {session?.role && (
        <Alert severity="warning">
          Current session role is {session.role}. Log out and sign in as Park Ranger to submit live recommendations.
        </Alert>
      )}
      <Box className="ranger-login-actions">
        <Button href={rangerLoginUrl}>Open Ranger login</Button>
        {session?.role && <Button onClick={onLogout}>Logout current session</Button>}
      </Box>
      <Box className="ranger-login-demo">
        <span>Demo Ranger accounts</span>
        <strong>ranger1@demo.local / 1234</strong>
        <strong>ranger2@demo.local / 1234</strong>
        <strong>ranger3@demo.local / 1234</strong>
      </Box>
    </Box>
  </Box>
);

const RangerNotificationPanel = ({ notifications, onSelectIncident }) => (
  <Paper className="ranger-notification-panel">
    <Box className="incident-section-head">
      <Box>
        <Typography className="incident-eyebrow">Ranger notifications</Typography>
        <Typography component="h2">Escalated and high-severity incidents</Typography>
      </Box>
      <Typography>{notifications.length ? `${notifications.length} active` : "No active alerts"}</Typography>
    </Box>
    {notifications.length ? (
      <Box className="ranger-notification-list">
        {notifications.slice(0, 4).map((notification) => (
          <Box
            component="button"
            type="button"
            className="ranger-notification-card"
            key={notification.id}
            onClick={() => onSelectIncident(notification.incident.id)}
          >
            <Box>
              <span>{notification.title}</span>
              <strong>{notification.incident.eventType}</strong>
              <small>{notification.incident.id}</small>
            </Box>
            <Box>
              <span>{notification.priority}</span>
              <strong>{notification.incident.location}</strong>
              <small>{formatDateTime(notification.createdAt)}</small>
            </Box>
            <p>{notification.detail}</p>
          </Box>
        ))}
      </Box>
    ) : (
      <Box className="ranger-notification-empty">
        <strong>No Ranger notifications right now</strong>
        <span>High-severity incidents and Admin escalations will appear here.</span>
      </Box>
    )}
  </Paper>
);

const RangerProfilePanel = ({ profile, onProfileChange }) => (
  <Paper className="ranger-profile-panel" id="ranger-profile">
    <Box className="incident-section-head">
      <Box>
        <Typography className="incident-eyebrow">Profile management</Typography>
        <Typography component="h2">Ranger profile</Typography>
      </Box>
      <Typography>Local demo profile</Typography>
    </Box>
    <Box className="ranger-profile-form">
      <TextField
        label="Phone"
        value={profile.phone}
        onChange={(event) => onProfileChange("phone", event.target.value)}
      />
      <TextField
        label="Station"
        value={profile.station}
        onChange={(event) => onProfileChange("station", event.target.value)}
      />
      <TextField
        label="Patrol zone"
        value={profile.patrolZone}
        onChange={(event) => onProfileChange("patrolZone", event.target.value)}
      />
      <TextField
        label="Shift"
        value={profile.shift}
        onChange={(event) => onProfileChange("shift", event.target.value)}
      />
      <TextField
        label="Radio callsign"
        value={profile.radioCallsign}
        onChange={(event) => onProfileChange("radioCallsign", event.target.value)}
      />
    </Box>
  </Paper>
);

const RangerRecommendationSummary = ({ recommendations }) => (
  <Paper className="ranger-sent-panel" id="ranger-recommendations">
    <Box className="incident-section-head">
      <Box>
        <Typography className="incident-eyebrow">Recommendation review</Typography>
        <Typography component="h2">Recommendations sent</Typography>
      </Box>
      <Typography>{recommendations.length ? `${recommendations.length} sent` : "None sent"}</Typography>
    </Box>
    {recommendations.length ? (
      <Box className="ranger-sent-list">
        {recommendations.slice(0, 5).map((item) => (
          <Box className="ranger-sent-item" key={item.id || `${item.incidentId}-${item.createdAt}`}>
            <strong>{item.recommendation}</strong>
            <span>{item.eventType} / {item.officialStatus}</span>
            <p>{item.note || "No field note supplied."}</p>
            <small>{formatDateTime(item.createdAt)}</small>
          </Box>
        ))}
      </Box>
    ) : (
      <Box className="ranger-notification-empty">
        <strong>No recommendations submitted yet</strong>
        <span>Sent recommendations will stay visible here for the final demo.</span>
      </Box>
    )}
  </Paper>
);

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
  errorMessage,
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
        <DetailItem label="Official Status" value={incident.status} />
        <DetailItem label="Ranger Role" value="Recommendation only" />
      </Box>

      {incident.source === "AI_CAMERA" && incident.ai ? (
        <Box className="incident-metadata-card">
          <Typography component="h3">AI metadata</Typography>
          <DetailItem label="Predicted Class" value={displayEventType(incident.ai.predictedClass)} />
          <DetailItem label="Confidence" value={formatPercent(incident.ai.confidence)} />
          <DetailItem label="Margin" value={formatDecimal(incident.ai.margin)} />
          <DetailItem label="BBox" value={bbox.length ? `[${bbox.join(", ")}]` : NOT_AVAILABLE} />
          <DetailItem
            label="Probabilities"
            value={`Protected plants ${formatPercent(probabilities.PluckingPlants)} / Wildlife ${formatPercent(probabilities.TouchingWildlife)}`}
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
        <Typography className="ranger-form-helper">
          Add field observations for Admin review. This does not change the official incident status.
        </Typography>
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
              type="button"
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
        {errorMessage && (
          <Alert severity="error">
            {errorMessage}
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
