const adminBasePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

const publicAsset = (path) => `${adminBasePath}${path}`;

export const INCIDENT_STATUSES = [
  "New",
  "Reviewed",
  "Acknowledged",
  "In Review",
  "Resolved",
  "False Alarm",
];

export const RANGER_INCIDENT_STATUSES = ["Acknowledged", "In Review", "Resolved", "False Alarm"];

export const INCIDENT_FILTERS = [
  { id: "all", label: "All" },
  { id: "AI_CAMERA", label: "AI Camera" },
  { id: "IOT_SENSOR", label: "IoT Sensor" },
  { id: "New", label: "New" },
  { id: "Acknowledged", label: "Acknowledged" },
  { id: "In Review", label: "In Review" },
  { id: "Reviewed", label: "Reviewed" },
  { id: "Resolved", label: "Resolved" },
  { id: "False Alarm", label: "False Alarm" },
];

export const normalizeIncidentRecord = (incident) => {
  if (!incident) return null;

  const probabilities = incident.ai?.probabilities || incident.ai?.probs || {};

  return {
    id: incident.id || incident.incident_id,
    source: incident.source,
    eventType: incident.eventType || incident.event_type,
    severity: incident.severity || "medium",
    timestamp: incident.timestamp,
    location: incident.location || "Unknown location",
    status: incident.status || "New",
    evidenceImage: incident.evidenceImage ?? incident.evidence?.image_path ?? null,
    ai: incident.ai
      ? {
          predictedClass: incident.ai.predictedClass || incident.ai.predicted_class || null,
          confidence: Number(incident.ai.confidence || 0),
          margin: Number(incident.ai.margin || 0),
          bbox: Array.isArray(incident.ai.bbox) ? incident.ai.bbox : [],
          probabilities: {
            TouchingPlants: Number(probabilities.TouchingPlants || 0),
            TouchingWildlife: Number(probabilities.TouchingWildlife || 0),
          },
        }
      : null,
    iot: incident.iot
      ? {
          sensorId: incident.iot.sensorId || incident.iot.sensor_id || "plant-zone-01",
          distanceCm: Number(incident.iot.distanceCm ?? incident.iot.distance_cm ?? 0),
          thresholdCm: Number(incident.iot.thresholdCm ?? incident.iot.threshold_cm ?? 0),
          topic: incident.iot.topic || incident.iot.mqtt_topic || "ctip/sensor/plant-zone-01/proximity",
        }
      : null,
    notes: incident.notes || "",
  };
};

const seededIncidentRecords = [
  {
    incident_id: "AI-2026-04-27_10-30-00-alert-TouchingPlants",
    source: "AI_CAMERA",
    event_type: "TouchingPlants",
    severity: "medium",
    timestamp: "2026-04-27T10:30:00+08:00",
    location: "Demo Camera Zone - Plant Walkway",
    status: "New",
    evidence: {
      image_path: publicAsset("incidents/ai-touching-plants.jpg"),
      json_path: "alerts/ai/2026-04-27_10-30-00_alert_TouchingPlants.json",
    },
    ai: {
      predicted_class: "TouchingPlants",
      confidence: 0.81,
      margin: 0.62,
      bbox: [120, 80, 420, 360],
      probs: {
        TouchingPlants: 0.81,
        TouchingWildlife: 0.19,
      },
    },
    iot: null,
    notes:
      "AI camera detected human interaction with protected plant material. Review the image and metadata before assigning enforcement action.",
  },
  {
    incident_id: "AI-2026-04-27_11-12-44-alert-TouchingWildlife",
    source: "AI_CAMERA",
    event_type: "TouchingWildlife",
    severity: "high",
    timestamp: "2026-04-27T11:12:44+08:00",
    location: "Bako National Park - Trail Camera 02",
    status: "Reviewed",
    evidence: {
      image_path: publicAsset("incidents/ai-touching-wildlife.jpg"),
      json_path: "alerts/ai/2026-04-27_11-12-44_alert_TouchingWildlife.json",
    },
    ai: {
      predicted_class: "TouchingWildlife",
      confidence: 0.88,
      margin: 0.71,
      bbox: [96, 64, 384, 330],
      probs: {
        TouchingPlants: 0.12,
        TouchingWildlife: 0.88,
      },
    },
    iot: null,
    notes:
      "AI camera produced a high-confidence wildlife interaction alert. Evidence has been reviewed and should remain visible for audit trail discussion.",
  },
  {
    incident_id: "IOT-plant-zone-01-2026-04-27T11:35:10+08:00",
    source: "IOT_SENSOR",
    event_type: "ObjectCloseToPlant",
    severity: "low",
    timestamp: "2026-04-27T11:35:10+08:00",
    location: "Plant Zone 01",
    status: "New",
    evidence: {
      image_path: null,
      json_path: null,
    },
    ai: null,
    iot: {
      sensor_id: "plant-zone-01",
      distance_cm: 14.6,
      threshold_cm: 20,
      mqtt_topic: "ctip/sensor/plant-zone-01/proximity",
    },
    notes:
      "Ultrasonic proximity sensor detected an object inside the configured plant-zone threshold. This alert has no image evidence and should be reviewed using distance metadata.",
  },
  {
    incident_id: "AI-2026-04-27_12-05-33-alert-TouchingPlants",
    source: "AI_CAMERA",
    event_type: "TouchingPlants",
    severity: "medium",
    timestamp: "2026-04-27T12:05:33+08:00",
    location: "Gunung Gading - Sensitive Viewing Platform",
    status: "False Alarm",
    evidence: {
      image_path: publicAsset("incidents/ai-touching-plants.jpg"),
      json_path: "alerts/ai/2026-04-27_12-05-33_alert_TouchingPlants.json",
    },
    ai: {
      predicted_class: "TouchingPlants",
      confidence: 0.64,
      margin: 0.21,
      bbox: [180, 112, 438, 362],
      probs: {
        TouchingPlants: 0.64,
        TouchingWildlife: 0.36,
      },
    },
    iot: null,
    notes:
      "Low-margin plant alert retained as an example of the False Alarm workflow. Admins should keep the status editable while model thresholds are tuned.",
  },
  {
    incident_id: "IOT-plant-zone-01-2026-04-27T12:44:18+08:00",
    source: "IOT_SENSOR",
    event_type: "ObjectCloseToPlant",
    severity: "low",
    timestamp: "2026-04-27T12:44:18+08:00",
    location: "Plant Zone 01",
    status: "Reviewed",
    evidence: {
      image_path: null,
      json_path: null,
    },
    ai: null,
    iot: {
      sensor_id: "plant-zone-01",
      distance_cm: 18.2,
      threshold_cm: 20,
      mqtt_topic: "ctip/sensor/plant-zone-01/proximity",
    },
    notes:
      "Distance reading crossed the configured threshold briefly. Reviewed as a useful sensor calibration example.",
  },
];

export const seededIncidents = seededIncidentRecords.map(normalizeIncidentRecord).filter(Boolean);

export const summarizeIncidents = (incidents) => {
  const normalizedIncidents = incidents.map(normalizeIncidentRecord).filter(Boolean);
  const countByStatus = INCIDENT_STATUSES.reduce(
    (acc, status) => ({
      ...acc,
      [status]: normalizedIncidents.filter((item) => item.status === status).length,
    }),
    {}
  );

  return {
    total: normalizedIncidents.length,
    ai: normalizedIncidents.filter((item) => item.source === "AI_CAMERA").length,
    iot: normalizedIncidents.filter((item) => item.source === "IOT_SENSOR").length,
    new: countByStatus.New || 0,
    reviewed: countByStatus.Reviewed || 0,
    acknowledged: normalizedIncidents.filter((item) => item.status === "Acknowledged").length,
    inReview: normalizedIncidents.filter((item) => item.status === "In Review").length,
    resolved: normalizedIncidents.filter((item) => item.status === "Resolved").length,
    falseAlarm: countByStatus["False Alarm"] || 0,
  };
};
