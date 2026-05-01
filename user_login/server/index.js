import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mqtt from 'mqtt'
import { createMemoryIncidentStore } from './src/incident/memoryIncidentStore.js'
import { createMysqlIncidentStore } from './src/incident/mysqlIncidentStore.js'
import {
  DEFAULT_MQTT_TOPIC,
  VALID_EVENT_TYPES,
  VALID_SEVERITIES,
  VALID_SOURCES,
  VALID_STATUSES,
} from './src/incident/incidentUtils.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')
const runtimeDataDir = path.join(__dirname, 'data')
const runtimeIncidentFile = path.join(runtimeDataDir, 'incidents.runtime.json')
const aiEvidenceDir = process.env.AI_EVIDENCE_DIR
  ? path.resolve(process.env.AI_EVIDENCE_DIR)
  : path.join(repoRoot, 'alerts', 'ai')
const iotEvidenceDir = process.env.IOT_EVIDENCE_DIR
  ? path.resolve(process.env.IOT_EVIDENCE_DIR)
  : path.join(repoRoot, 'alerts', 'iot')

fs.mkdirSync(aiEvidenceDir, { recursive: true })
fs.mkdirSync(iotEvidenceDir, { recursive: true })

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use('/evidence/ai', express.static(aiEvidenceDir))
app.use('/evidence/iot', express.static(iotEvidenceDir))

const MQTT_TOPIC = process.env.MQTT_TOPIC || DEFAULT_MQTT_TOPIC
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883'
const MQTT_ENABLED = process.env.MQTT_ENABLED !== 'false'
const INCIDENT_STORAGE = (process.env.INCIDENT_STORAGE || 'memory').toLowerCase()
const INCIDENT_MYSQL_FALLBACK = (process.env.INCIDENT_MYSQL_FALLBACK || 'memory').toLowerCase()
const MAX_RUNTIME_INCIDENTS = 250
const MAX_IOT_CAPTURE_BYTES = 500 * 1024

const flagEnabled = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase())
const DEVICE_TOKEN_AUTH_ENABLED = flagEnabled(process.env.DEVICE_TOKEN_AUTH_ENABLED)
const ROLE_CHECK_ENABLED = flagEnabled(process.env.ROLE_CHECK_ENABLED)
const AI_CAMERA_TOKEN = process.env.AI_CAMERA_TOKEN || ''
const IOT_SENSOR_TOKEN = process.env.IOT_SENSOR_TOKEN || ''
const ALLOWED_STATUS_ACTOR_ROLES = new Set(['admin', 'park_ranger'])

const mqttState = {
  enabled: MQTT_ENABLED,
  brokerUrl: MQTT_BROKER_URL,
  topic: MQTT_TOPIC,
  connected: false,
  lastMessageAt: null,
  lastError: null,
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'cos30049_assignment',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

const memoryIncidentStore = createMemoryIncidentStore({
  runtimeIncidentFile,
  maxRuntimeIncidents: MAX_RUNTIME_INCIDENTS,
})
const mysqlIncidentStore = createMysqlIncidentStore({ pool })
let incidentStore = memoryIncidentStore

const incidentStorageState = {
  requested: INCIDENT_STORAGE,
  active: 'memory',
  status: 'starting',
  fallback: INCIDENT_MYSQL_FALLBACK,
  lastError: null,
}

const incidentStorageInfo = () => ({
  requested: incidentStorageState.requested,
  active: incidentStorageState.active,
  status: incidentStorageState.status,
  fallback: incidentStorageState.fallback,
  lastError: incidentStorageState.lastError,
})

const errorMessage = (error) => error?.message || error?.code || String(error)

const securityControlInfo = () => ({
  deviceTokenAuthEnabled: DEVICE_TOKEN_AUTH_ENABLED,
  roleCheckEnabled: ROLE_CHECK_ENABLED,
  tokenSources: DEVICE_TOKEN_AUTH_ENABLED ? ['AI_CAMERA', 'IOT_SENSOR'] : [],
  statusUpdateRoles: ROLE_CHECK_ENABLED ? ['admin', 'park_ranger'] : ['demo-open'],
})

const safeTokenEqual = (provided, expected) => {
  if (!provided || !expected) return false
  const providedBuffer = Buffer.from(String(provided))
  const expectedBuffer = Buffer.from(String(expected))
  if (providedBuffer.length !== expectedBuffer.length) return false
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer)
}

const tokenForSource = (source) => {
  if (source === 'AI_CAMERA') return AI_CAMERA_TOKEN
  if (source === 'IOT_SENSOR') return IOT_SENSOR_TOKEN
  return ''
}

const deviceTokenFromPayload = (payload = {}) =>
  payload.device_token || payload.deviceToken || payload.iot?.device_token || payload.iot?.deviceToken || ''

const safeFilePart = (value, fallback = 'iot-capture') =>
  String(value || fallback)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96) || fallback

const saveIotEvidenceCapture = (payload = {}) => {
  const capture = payload.evidenceCapture || payload.iotEvidenceCapture
  if (!capture?.dataUrl || typeof capture.dataUrl !== 'string') return null

  const match = capture.dataUrl.match(/^data:image\/jpe?g;base64,([A-Za-z0-9+/=]+)$/)
  if (!match) {
    throw new Error('IoT evidence capture must be a JPEG data URL.')
  }

  const buffer = Buffer.from(match[1], 'base64')
  if (buffer.length > MAX_IOT_CAPTURE_BYTES) {
    throw new Error(`IoT evidence capture is too large. Keep it under ${Math.round(MAX_IOT_CAPTURE_BYTES / 1024)} KB.`)
  }

  const baseName = safeFilePart(payload.incident_id || payload.public_id || payload.id)
  const fileName = `${baseName}-${Date.now()}.jpg`
  const filePath = path.join(iotEvidenceDir, fileName)
  fs.writeFileSync(filePath, buffer)

  return {
    browserUrl: `/evidence/iot/${encodeURIComponent(fileName)}`,
    fileName,
    sizeBytes: buffer.length,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
  }
}

const withSavedIotEvidenceCapture = (payload = {}) => {
  if (payload.source !== 'IOT_SENSOR') return payload

  const savedCapture = saveIotEvidenceCapture(payload)
  if (!savedCapture) return payload

  const nextPayload = {
    ...payload,
    evidenceImage: savedCapture.browserUrl,
    evidence: {
      ...(payload.evidence || {}),
      image_path: savedCapture.browserUrl,
      browser_url: savedCapture.browserUrl,
    },
    notes:
      payload.notes ||
      `IoT trigger evidence saved to alerts/iot as ${savedCapture.fileName} (${savedCapture.sizeBytes} bytes).`,
  }

  delete nextPayload.evidenceCapture
  delete nextPayload.iotEvidenceCapture
  return nextPayload
}

const validateDeviceToken = ({ source, headerToken = '', payload = {} }) => {
  if (!DEVICE_TOKEN_AUTH_ENABLED) return null

  const expectedToken = tokenForSource(source)
  const providedToken = source === 'IOT_SENSOR'
    ? headerToken || deviceTokenFromPayload(payload)
    : headerToken

  if (!safeTokenEqual(providedToken, expectedToken)) {
    return {
      status: 401,
      message: `${source} requires a valid X-Device-Token when DEVICE_TOKEN_AUTH_ENABLED=true.`,
    }
  }

  return null
}

const eventTypeFromPayload = (payload = {}, source) =>
  payload.eventType ||
  payload.event_type ||
  (source === 'IOT_SENSOR' ? 'ObjectCloseToPlant' : payload.ai?.predictedClass || payload.ai?.predicted_class)

const numberOrNull = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const normalizeIotMqttPayload = (payload = {}, topic = MQTT_TOPIC) => {
  const distance = numberOrNull(payload.distance_cm ?? payload.distanceCm ?? payload.distance)
  const threshold = numberOrNull(payload.threshold_cm ?? payload.thresholdCm ?? payload.threshold ?? 20)
  const status = String(payload.status || '').toLowerCase()
  const isTriggered = status === 'triggered' || (distance !== null && threshold !== null && distance <= threshold)
  if (!isTriggered) return null

  const timestamp = payload.timestamp || payload.occurred_at || payload.occurredAt || new Date().toISOString()

  return {
    ...payload,
    source: 'IOT_SENSOR',
    eventType: payload.eventType || payload.event_type || 'ObjectCloseToPlant',
    sensor_id: payload.sensor_id || payload.sensorId || 'plant-zone-01',
    location: payload.location || 'Plant Zone 01',
    distance_cm: distance ?? 0,
    threshold_cm: threshold ?? 20,
    timestamp,
    status: 'triggered',
    severity: payload.severity || 'low',
    topic,
  }
}

const validateIncidentInput = (payload = {}) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, message: 'Incident payload must be a JSON object.' }
  }

  const source = payload.source
  if (!VALID_SOURCES.has(source)) {
    return { valid: false, message: 'Invalid incident source. Use AI_CAMERA or IOT_SENSOR.' }
  }

  const eventType = eventTypeFromPayload(payload, source)
  if (!VALID_EVENT_TYPES.has(eventType)) {
    return { valid: false, message: 'Invalid event type. Use TouchingPlants, TouchingWildlife, or ObjectCloseToPlant.' }
  }

  const severity = typeof payload.severity === 'string' ? payload.severity.toLowerCase() : null
  if (payload.severity !== undefined && !VALID_SEVERITIES.has(severity)) {
    return { valid: false, message: 'Invalid severity. Use low, medium, or high.' }
  }

  const status = payload.status
  const isTriggeredSensorStatus = source === 'IOT_SENSOR' && status === 'triggered'
  if (status !== undefined && !VALID_STATUSES.has(status) && !isTriggeredSensorStatus) {
    return {
      valid: false,
      message: 'Invalid status. Use New, Reviewed, Acknowledged, In Review, Resolved, False Alarm, or IoT status triggered.',
    }
  }

  if (source === 'IOT_SENSOR') {
    const sensorId = payload.sensor_id || payload.sensorId || payload.iot?.sensor_id || payload.iot?.sensorId
    if (sensorId !== undefined && (typeof sensorId !== 'string' || sensorId.trim().length === 0)) {
      return { valid: false, message: 'Invalid sensor_id. Use a non-empty string.' }
    }

    const distance = payload.distance_cm ?? payload.distanceCm ?? payload.iot?.distance_cm ?? payload.iot?.distanceCm
    const threshold = payload.threshold_cm ?? payload.thresholdCm ?? payload.iot?.threshold_cm ?? payload.iot?.thresholdCm
    if (distance !== undefined && (!Number.isFinite(Number(distance)) || Number(distance) < 0)) {
      return { valid: false, message: 'Invalid distance_cm. Use a non-negative number.' }
    }
    if (threshold !== undefined && (!Number.isFinite(Number(threshold)) || Number(threshold) < 0)) {
      return { valid: false, message: 'Invalid threshold_cm. Use a non-negative number.' }
    }
  }

  return { valid: true, source, eventType }
}

const statusActorFromRequest = (req) => {
  if (!ROLE_CHECK_ENABLED) {
    return { allowed: true, actorRole: 'api', actorLabel: 'Incident API' }
  }

  const actorRole = String(req.get('X-Actor-Role') || '').toLowerCase()
  if (!ALLOWED_STATUS_ACTOR_ROLES.has(actorRole)) {
    return {
      allowed: false,
      status: 403,
      message: 'Status updates require X-Actor-Role admin or park_ranger when ROLE_CHECK_ENABLED=true.',
    }
  }

  return {
    allowed: true,
    actorRole,
    actorLabel: actorRole === 'admin' ? 'Admin incident dashboard' : 'Park Ranger alert console',
  }
}

const initializeIncidentStore = async () => {
  await memoryIncidentStore.init()

  if (INCIDENT_STORAGE !== 'mysql') {
    incidentStore = memoryIncidentStore
    incidentStorageState.active = 'memory'
    incidentStorageState.status = 'online'
    incidentStorageState.lastError = null
    return
  }

  try {
    await mysqlIncidentStore.init()
    incidentStore = mysqlIncidentStore
    incidentStorageState.active = 'mysql'
    incidentStorageState.status = 'online'
    incidentStorageState.lastError = null
  } catch (error) {
    const message = errorMessage(error)
    incidentStorageState.lastError = message

    if (INCIDENT_MYSQL_FALLBACK === 'memory') {
      incidentStore = memoryIncidentStore
      incidentStorageState.active = 'memory'
      incidentStorageState.status = 'degraded'
      console.warn(`[incidents] MySQL unavailable; using memory fallback: ${message}`)
      return
    }

    incidentStore = mysqlIncidentStore
    incidentStorageState.active = 'mysql'
    incidentStorageState.status = 'offline'
    console.warn(`[incidents] MySQL unavailable and fallback disabled: ${message}`)
  }
}

const runIncidentStoreOperation = async (operation) => {
  try {
    return await operation(incidentStore)
  } catch (error) {
    if (incidentStorageState.active === 'mysql' && INCIDENT_MYSQL_FALLBACK === 'memory') {
      incidentStore = memoryIncidentStore
      incidentStorageState.active = 'memory'
      incidentStorageState.status = 'degraded'
      incidentStorageState.lastError = errorMessage(error)
      console.warn(`[incidents] MySQL operation failed; switched to memory fallback: ${incidentStorageState.lastError}`)
      return operation(incidentStore)
    }

    throw error
  }
}

app.get('/api/health', async (req, res) => {
  let incidentCount = null
  try {
    incidentCount = await runIncidentStoreOperation((store) => store.countIncidents())
  } catch (error) {
    incidentStorageState.lastError = errorMessage(error)
  }

  const response = {
    status: incidentStorageState.status === 'online' ? 'ok' : 'degraded',
    api: 'online',
    incidents: {
      count: incidentCount,
      persistence: incidentStore.persistence,
      storage: incidentStorageInfo(),
    },
    mqtt: mqttState,
    evidence: {
      aiRoute: '/evidence/ai',
      iotRoute: '/evidence/iot',
      aiStorage: 'repo-local-alerts-ai',
      iotStorage: 'repo-local-alerts-iot',
    },
    security: securityControlInfo(),
    database: {
      status: 'not_required_for_live_incidents',
    },
  }

  try {
    await pool.query('SELECT 1')
    response.database = { status: 'connected' }
    res.json(response)
  } catch (error) {
    response.database = {
      status: 'offline',
      message: errorMessage(error),
    }
    res.json(response)
  }
})

app.get('/api/incidents', async (req, res) => {
  try {
    const incidents = await runIncidentStoreOperation((store) => store.listIncidents())
    res.json({
      incidents,
      count: incidents.length,
      source: incidentStorageState.active === 'mysql' ? 'mysql' : 'runtime-memory',
      storage: incidentStorageInfo(),
    })
  } catch (error) {
    res.status(500).json({ message: 'Unable to load incidents.', error: error.message })
  }
})

app.get('/api/incidents/summary', async (req, res) => {
  try {
    const summary = await runIncidentStoreOperation((store) => store.summarizeIncidents())
    res.json({
      summary,
      mqtt: mqttState,
      source: incidentStorageState.active === 'mysql' ? 'mysql' : 'runtime-memory',
      storage: incidentStorageInfo(),
    })
  } catch (error) {
    res.status(500).json({ message: 'Unable to load incident summary.', error: error.message })
  }
})

app.post('/api/incidents/iot-capture', async (req, res) => {
  const actor = statusActorFromRequest(req)
  if (!actor.allowed) {
    return res.status(actor.status).json({ message: actor.message })
  }

  try {
    const validation = validateIncidentInput({
      ...req.body,
      source: 'IOT_SENSOR',
      eventType: req.body.eventType || req.body.event_type || 'ObjectCloseToPlant',
    })
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message })
    }

    const incidentPayload = withSavedIotEvidenceCapture({
      ...req.body,
      source: 'IOT_SENSOR',
      eventType: req.body.eventType || req.body.event_type || 'ObjectCloseToPlant',
    })
    const incident = await runIncidentStoreOperation((store) => store.addIncident(incidentPayload))
    console.log(`[incidents] IoT evidence saved for ${incident.id}`)
    res.status(201).json({ incident })
  } catch (error) {
    res.status(400).json({ message: 'Unable to save IoT evidence capture.', error: error.message })
  }
})

app.post('/api/incidents', async (req, res) => {
  try {
    const validation = validateIncidentInput(req.body)
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message })
    }

    const tokenError = validateDeviceToken({
      source: validation.source,
      headerToken: req.get('X-Device-Token'),
      payload: req.body,
    })
    if (tokenError) {
      return res.status(tokenError.status).json({ message: tokenError.message })
    }

    const incidentPayload = withSavedIotEvidenceCapture(req.body)
    const incident = await runIncidentStoreOperation((store) => store.addIncident(incidentPayload))
    console.log(`[incidents] Created ${incident.id} (${incident.source} / ${incident.eventType})`)
    res.status(201).json({ incident })
  } catch (error) {
    res.status(400).json({ message: 'Unable to create incident.', error: error.message })
  }
})

app.patch('/api/incidents/:id/status', async (req, res) => {
  const { status } = req.body
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({
      message: 'Invalid status. Use New, Reviewed, Acknowledged, In Review, Resolved, or False Alarm.',
    })
  }

  const actor = statusActorFromRequest(req)
  if (!actor.allowed) {
    return res.status(actor.status).json({ message: actor.message })
  }

  try {
    const incident = await runIncidentStoreOperation((store) => store.updateIncidentStatus(req.params.id, status, {
      actorRole: actor.actorRole,
      actorLabel: actor.actorLabel,
    }))

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found.' })
    }

    console.log(`[incidents] Updated ${req.params.id} -> ${status}`)
    return res.json({ incident })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update incident status.', error: error.message })
  }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' })
    }

    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email])
    if (existing.length > 0) {
      return res.status(409).json({ message: 'This email is already registered.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (role_id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [2, name, email, passwordHash]
    )

    await pool.query(
      'INSERT INTO guide_profiles (guide_id, phone, organization) VALUES (?, ?, ?)',
      [result.insertId, '', '']
    )

    return res.status(201).json({
      user: {
        user_id: result.insertId,
        name,
        email,
        role_name: 'guide',
      },
      message: 'User registered successfully.',
    })
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed.', error: error.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const [rows] = await pool.query(
      'SELECT u.user_id, u.name, u.email, u.password_hash, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.email = ?',
      [email]
    )

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    const user = rows[0]
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    if (role && user.role_name !== role) {
      return res.status(403).json({ message: `Access denied for role ${role}.` })
    }

    return res.json({
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role_name: user.role_name,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.', error: error.message })
  }
})

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' })
    }

    const [users] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email])
    let resetToken

    if (users.length > 0) {
      const user = users[0]
      resetToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

      await pool.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.user_id])
      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [user.user_id, tokenHash, expiresAt]
      )
    }

    return res.json({
      message: 'If the email exists, a reset token has been generated.',
      resetToken: resetToken || null,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to process forgot password request.', error: error.message })
  }
})

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Email, token and new password are required.' })
    }

    const [users] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email])
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid reset token or expired token.' })
    }

    const user = users[0]
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const [tokens] = await pool.query(
      `SELECT token_id
       FROM password_reset_tokens
       WHERE user_id = ? AND token_hash = ? AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.user_id, tokenHash]
    )

    if (tokens.length === 0) {
      return res.status(400).json({ message: 'Invalid reset token or expired token.' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [passwordHash, user.user_id])
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE token_id = ?', [tokens[0].token_id])

    return res.json({ message: 'Password reset successful. Please login with your new password.' })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to reset password.', error: error.message })
  }
})

const port = Number(process.env.PORT) || 4000

const startMqttBridge = () => {
  if (!MQTT_ENABLED) {
    console.log('[mqtt] Bridge disabled with MQTT_ENABLED=false')
    return
  }

  try {
    const client = mqtt.connect(MQTT_BROKER_URL, {
      clientId: `ctip-admin-incident-bridge-${process.pid}-${Math.random().toString(16).slice(2)}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 5000,
    })

    client.on('connect', () => {
      mqttState.connected = true
      mqttState.lastError = null
      console.log(`[mqtt] Connected to ${MQTT_BROKER_URL}`)
      client.subscribe(MQTT_TOPIC, { qos: 1 }, (error) => {
        if (error) {
          mqttState.lastError = error.message
          console.warn(`[mqtt] Subscribe failed: ${error.message}`)
          return
        }
        console.log(`[mqtt] Subscribed to ${MQTT_TOPIC}`)
      })
    })

    client.on('reconnect', () => {
      mqttState.connected = false
    })

    client.on('close', () => {
      mqttState.connected = false
    })

    client.on('error', (error) => {
      mqttState.connected = false
      mqttState.lastError = error.message
      console.warn(`[mqtt] ${error.message}`)
    })

    client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString())
        const normalizedPayload = normalizeIotMqttPayload(payload, topic)
        if (!normalizedPayload) {
          mqttState.lastMessageAt = new Date().toISOString()
          console.log(`[mqtt] Non-trigger IoT reading ignored from ${topic}`)
          return
        }

        const validation = validateIncidentInput(normalizedPayload)
        if (!validation.valid) {
          throw new Error(validation.message)
        }

        const tokenError = validateDeviceToken({
          source: 'IOT_SENSOR',
          payload: normalizedPayload,
        })
        if (tokenError) {
          throw new Error(tokenError.message)
        }

        const incident = await runIncidentStoreOperation((store) => store.addIncident(
          normalizedPayload,
          { source: 'IOT_SENSOR', topic }
        ))
        mqttState.lastMessageAt = new Date().toISOString()
        console.log(`[mqtt] Incident ${incident.id} received from ${topic}`)
      } catch (error) {
        mqttState.lastError = error.message
        console.warn(`[mqtt] Invalid message ignored: ${error.message}`)
      }
    })
  } catch (error) {
    mqttState.connected = false
    mqttState.lastError = error.message
    console.warn(`[mqtt] Bridge did not start: ${error.message}`)
  }
}

const startServer = async () => {
  await initializeIncidentStore()

  app.listen(port, async () => {
    let incidentCount = 'unavailable'
    try {
      incidentCount = await runIncidentStoreOperation((store) => store.countIncidents())
    } catch (error) {
      incidentStorageState.lastError = errorMessage(error)
    }

    console.log(`Server running on http://localhost:${port}`)
    console.log(`[incidents] ${incidentStorageState.active} store loaded with ${incidentCount} incident(s)`)
    console.log(`Serving AI evidence from: ${aiEvidenceDir}`)
    console.log(`Serving IoT evidence from: ${iotEvidenceDir}`)
    console.log('[evidence] Browser route: /evidence/ai')
    console.log('[evidence] Browser route: /evidence/iot')
    startMqttBridge()
  })
}

startServer().catch((error) => {
  console.error(`[server] Unable to start: ${errorMessage(error)}`)
  process.exitCode = 1
})
