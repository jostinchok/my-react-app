export const VALID_SOURCES = new Set(['AI_CAMERA', 'IOT_SENSOR'])

export const VALID_EVENT_TYPES = new Set([
  'TouchingPlants',
  'TouchingWildlife',
  'ObjectCloseToPlant',
])

export const VALID_STATUSES = new Set([
  'New',
  'Reviewed',
  'Acknowledged',
  'In Review',
  'Resolved',
  'False Alarm',
])

export const VALID_SEVERITIES = new Set(['low', 'medium', 'high'])

export const DEFAULT_MQTT_TOPIC = 'ctip/sensor/plant-zone-01/proximity'

export const toNumber = (value, fallback = null) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export const pickStatus = (value) => (VALID_STATUSES.has(value) ? value : 'New')

export const pickSeverity = (value, source) => {
  const normalized = typeof value === 'string' ? value.toLowerCase() : ''
  if (VALID_SEVERITIES.has(normalized)) return normalized
  return source === 'IOT_SENSOR' ? 'low' : 'medium'
}

export const pickSource = (value) => {
  if (VALID_SOURCES.has(value)) return value
  return null
}

export const normalizeTimestamp = (value) => {
  if (!value) return new Date().toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

export const datePart = (timestamp) => normalizeTimestamp(timestamp).slice(0, 10)

export const buildIncidentId = (source, timestamp, count) => {
  const prefix = source === 'AI_CAMERA' ? 'AI' : 'IOT'
  const date = datePart(timestamp)
  return `${prefix}-${date}-${String(count + 1).padStart(3, '0')}`
}

export const evidenceUrlFromPath = (value) => {
  if (!value || typeof value !== 'string') return null
  if (
    value.startsWith('/evidence/ai/') ||
    value.startsWith('/evidence/iot/') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  ) {
    return value
  }

  const normalizedPath = value.replaceAll('\\', '/')
  const filename = normalizedPath.split('/').filter(Boolean).at(-1)
  if (!filename) return null

  const route = normalizedPath.includes('/alerts/iot/') || normalizedPath.includes('/Alerts/iot/')
    ? '/evidence/iot'
    : '/evidence/ai'
  return `${route}/${encodeURIComponent(filename)}`
}

const decodeFilename = (value) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const mimeTypeForFile = (filename) => {
  const extension = filename.toLowerCase().split('.').pop()
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  if (extension === 'png') return 'image/png'
  if (extension === 'gif') return 'image/gif'
  if (extension === 'webp') return 'image/webp'
  if (extension === 'json') return 'application/json'
  return 'application/octet-stream'
}

export const buildEvidenceFileMetadata = (value) => {
  const browserUrl = evidenceUrlFromPath(value)
  if (!browserUrl) return null

  const rawFileName = browserUrl.split('/').filter(Boolean).at(-1)
  const fileName = rawFileName ? decodeFilename(rawFileName) : 'evidence-file'
  const evidenceFolder = browserUrl.startsWith('/evidence/iot/') ? 'iot' : 'ai'

  return {
    evidenceType: mimeTypeForFile(fileName).startsWith('image/') ? 'image' : 'other',
    browserUrl,
    storageKey: `alerts/${evidenceFolder}/${fileName}`,
    fileName,
    mimeType: mimeTypeForFile(fileName),
    sizeBytes: null,
    sha256: null,
  }
}

export const normalizeAi = (value) => {
  if (!value || typeof value !== 'object') return null
  const probabilities = value.probabilities || value.probs || null

  return {
    predictedClass: value.predictedClass || value.predicted_class || null,
    confidence: toNumber(value.confidence, 0),
    margin: toNumber(value.margin, 0),
    bbox: Array.isArray(value.bbox) ? value.bbox.map((item) => toNumber(item, 0)) : [],
    probabilities: probabilities && typeof probabilities === 'object'
      ? {
          TouchingPlants: toNumber(probabilities.TouchingPlants, 0),
          TouchingWildlife: toNumber(probabilities.TouchingWildlife, 0),
        }
      : {
          TouchingPlants: 0,
          TouchingWildlife: 0,
        },
  }
}

export const normalizeIot = (value, topic = DEFAULT_MQTT_TOPIC) => {
  if (!value || typeof value !== 'object') return null

  return {
    sensorId: value.sensorId || value.sensor_id || 'plant-zone-01',
    distanceCm: toNumber(value.distanceCm ?? value.distance_cm, null),
    thresholdCm: toNumber(value.thresholdCm ?? value.threshold_cm, null),
    topic: value.topic || value.mqtt_topic || topic,
  }
}

export const normalizeIncident = (input = {}, options = {}) => {
  const source = pickSource(input.source || options.source)
  if (!source) return null

  const timestamp = normalizeTimestamp(input.timestamp || input.occurredAt || input.occurred_at)
  const aiInput = input.ai || input.aiMetadata || input.ai_metadata
  const eventType = input.eventType || input.event_type || (
    source === 'IOT_SENSOR' ? 'ObjectCloseToPlant' : aiInput?.predictedClass || aiInput?.predicted_class
  )

  if (!eventType || !VALID_EVENT_TYPES.has(eventType)) return null

  const ai = source === 'AI_CAMERA' ? normalizeAi(aiInput) : null
  const iot = source === 'IOT_SENSOR' ? normalizeIot(input.iot || input.iotMetadata || input.iot_metadata || input, options.topic) : null
  const evidenceImage = evidenceUrlFromPath(
    input.evidenceImage ||
    input.evidence_image ||
    input.evidenceUrl ||
    input.evidence_url ||
    input.evidence?.browser_url ||
    input.evidence?.image_path
  )

  return {
    id: input.id || input.public_id || input.incident_id || null,
    source,
    eventType,
    severity: pickSeverity(input.severity, source),
    timestamp,
    location: input.location || (source === 'IOT_SENSOR' ? 'Plant Zone 01' : 'Demo Camera Zone'),
    status: pickStatus(input.status),
    evidenceImage,
    ai,
    iot,
    notes: input.notes || (
      source === 'IOT_SENSOR'
        ? 'IoT proximity sensor detected an object inside the protected plant-zone threshold.'
        : 'AI camera detected human interaction with protected plant or wildlife.'
    ),
  }
}

export const sortIncidents = (incidents) =>
  [...incidents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

export const summarizeIncidents = (incidents) => ({
  total: incidents.length,
  ai: incidents.filter((item) => item.source === 'AI_CAMERA').length,
  iot: incidents.filter((item) => item.source === 'IOT_SENSOR').length,
  new: incidents.filter((item) => item.status === 'New').length,
  reviewed: incidents.filter((item) => item.status === 'Reviewed').length,
  acknowledged: incidents.filter((item) => item.status === 'Acknowledged').length,
  inReview: incidents.filter((item) => item.status === 'In Review').length,
  resolved: incidents.filter((item) => item.status === 'Resolved').length,
  falseAlarm: incidents.filter((item) => item.status === 'False Alarm').length,
})

export const sanitizeIncidentPayload = (input, normalizedIncident) => {
  if (!input || typeof input !== 'object') return null

  const sanitized = JSON.parse(JSON.stringify(input))
  delete sanitized.device_token
  delete sanitized.deviceToken

  if (sanitized.iot && typeof sanitized.iot === 'object') {
    delete sanitized.iot.device_token
    delete sanitized.iot.deviceToken
  }

  if (normalizedIncident?.evidenceImage) {
    sanitized.evidenceImage = normalizedIncident.evidenceImage
    if (sanitized.evidence && typeof sanitized.evidence === 'object') {
      sanitized.evidence.image_path = normalizedIncident.evidenceImage
      sanitized.evidence.browser_url = normalizedIncident.evidenceImage
    }
  }

  return sanitized
}
