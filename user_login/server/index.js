import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import dotenv from 'dotenv'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mqtt from 'mqtt'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')
const runtimeDataDir = path.join(__dirname, 'data')
const runtimeIncidentFile = path.join(runtimeDataDir, 'incidents.runtime.json')
const aiEvidenceDir = process.env.AI_EVIDENCE_DIR
  ? path.resolve(process.env.AI_EVIDENCE_DIR)
  : path.join(repoRoot, 'Alerts', 'ai')

fs.mkdirSync(aiEvidenceDir, { recursive: true })

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use('/evidence/ai', express.static(aiEvidenceDir))

const VALID_SOURCES = new Set(['AI_CAMERA', 'IOT_SENSOR'])
const VALID_STATUSES = new Set(['New', 'Reviewed', 'False Alarm'])
const VALID_SEVERITIES = new Set(['low', 'medium', 'high'])
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'ctip/sensor/plant-zone-01/proximity'
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883'
const MQTT_ENABLED = process.env.MQTT_ENABLED !== 'false'
const MAX_RUNTIME_INCIDENTS = 250

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
  database: process.env.DB_DATABASE || 'park_guide_database',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

const readRuntimeIncidents = () => {
  try {
    if (!fs.existsSync(runtimeIncidentFile)) return []
    const parsed = JSON.parse(fs.readFileSync(runtimeIncidentFile, 'utf8'))
    return Array.isArray(parsed) ? parsed.map((item) => normalizeIncident(item)).filter(Boolean) : []
  } catch (error) {
    console.warn(`[incidents] Runtime incident store ignored: ${error.message}`)
    return []
  }
}

let runtimeIncidents = []

const persistRuntimeIncidents = async () => {
  await fsPromises.mkdir(runtimeDataDir, { recursive: true })
  await fsPromises.writeFile(runtimeIncidentFile, JSON.stringify(runtimeIncidents, null, 2), 'utf8')
}

const toNumber = (value, fallback = null) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const pickStatus = (value) => (VALID_STATUSES.has(value) ? value : 'New')

const pickSeverity = (value, source) => {
  const normalized = typeof value === 'string' ? value.toLowerCase() : ''
  if (VALID_SEVERITIES.has(normalized)) return normalized
  return source === 'IOT_SENSOR' ? 'low' : 'medium'
}

const pickSource = (value) => {
  if (VALID_SOURCES.has(value)) return value
  return null
}

const normalizeTimestamp = (value) => {
  if (!value) return new Date().toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const datePart = (timestamp) => normalizeTimestamp(timestamp).slice(0, 10)

const buildIncidentId = (source, timestamp) => {
  const prefix = source === 'AI_CAMERA' ? 'AI' : 'IOT'
  const date = datePart(timestamp)
  const currentCount = runtimeIncidents.filter((item) => item.id?.startsWith(`${prefix}-${date}-`)).length
  return `${prefix}-${date}-${String(currentCount + 1).padStart(3, '0')}`
}

const makeUniqueIncidentId = (preferredId, source, timestamp) => {
  const baseId = preferredId || buildIncidentId(source, timestamp)
  if (!runtimeIncidents.some((item) => item.id === baseId)) return baseId

  let index = 2
  let nextId = `${baseId}-${index}`
  while (runtimeIncidents.some((item) => item.id === nextId)) {
    index += 1
    nextId = `${baseId}-${index}`
  }
  return nextId
}

const evidenceUrlFromPath = (value) => {
  if (!value || typeof value !== 'string') return null
  if (value.startsWith('/evidence/ai/') || value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  const normalizedPath = value.replaceAll('\\', '/')
  const filename = normalizedPath.split('/').filter(Boolean).at(-1)
  return filename ? `/evidence/ai/${encodeURIComponent(filename)}` : null
}

const normalizeAi = (value) => {
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

const normalizeIot = (value, topic) => {
  if (!value || typeof value !== 'object') return null

  return {
    sensorId: value.sensorId || value.sensor_id || 'plant-zone-01',
    distanceCm: toNumber(value.distanceCm ?? value.distance_cm, null),
    thresholdCm: toNumber(value.thresholdCm ?? value.threshold_cm, null),
    topic: value.topic || value.mqtt_topic || topic || MQTT_TOPIC,
  }
}

const normalizeIncident = (input = {}, options = {}) => {
  const source = pickSource(input.source || options.source)
  if (!source) return null

  const timestamp = normalizeTimestamp(input.timestamp)
  const eventType = input.eventType || input.event_type || (
    source === 'IOT_SENSOR' ? 'ObjectCloseToPlant' : input.ai?.predictedClass || input.ai?.predicted_class
  )

  if (!eventType) return null

  const ai = source === 'AI_CAMERA' ? normalizeAi(input.ai) : null
  const iot = source === 'IOT_SENSOR' ? normalizeIot(input.iot || input, options.topic) : null
  const evidenceImage = source === 'AI_CAMERA'
    ? evidenceUrlFromPath(input.evidenceImage || input.evidence?.image_path)
    : null

  return {
    id: input.id || input.incident_id || null,
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

const sortIncidents = (incidents) =>
  [...incidents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

const addRuntimeIncident = async (input, options = {}) => {
  const incident = normalizeIncident(input, options)
  if (!incident) {
    throw new Error('Incident must include source and event type.')
  }

  incident.id = makeUniqueIncidentId(incident.id, incident.source, incident.timestamp)
  runtimeIncidents = [incident, ...runtimeIncidents].slice(0, MAX_RUNTIME_INCIDENTS)
  await persistRuntimeIncidents()
  return incident
}

const summarizeRuntimeIncidents = () => ({
  total: runtimeIncidents.length,
  ai: runtimeIncidents.filter((item) => item.source === 'AI_CAMERA').length,
  iot: runtimeIncidents.filter((item) => item.source === 'IOT_SENSOR').length,
  new: runtimeIncidents.filter((item) => item.status === 'New').length,
  reviewed: runtimeIncidents.filter((item) => item.status === 'Reviewed').length,
  falseAlarm: runtimeIncidents.filter((item) => item.status === 'False Alarm').length,
})

runtimeIncidents = readRuntimeIncidents()

app.get('/api/health', async (req, res) => {
  const response = {
    status: 'ok',
    api: 'online',
    incidents: {
      runtimeCount: runtimeIncidents.length,
      persistence: 'local-json',
    },
    mqtt: mqttState,
    evidence: {
      route: '/evidence/ai',
      directory: aiEvidenceDir,
    },
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
      message: error.message,
    }
    res.json(response)
  }
})

app.get('/api/incidents', (req, res) => {
  res.json({
    incidents: sortIncidents(runtimeIncidents),
    count: runtimeIncidents.length,
    source: 'runtime-memory',
  })
})

app.get('/api/incidents/summary', (req, res) => {
  res.json({
    summary: summarizeRuntimeIncidents(),
    mqtt: mqttState,
    source: 'runtime-memory',
  })
})

app.post('/api/incidents', async (req, res) => {
  try {
    const incident = await addRuntimeIncident(req.body)
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
      message: 'Invalid status. Use New, Reviewed, or False Alarm.',
    })
  }

  const incidentIndex = runtimeIncidents.findIndex((item) => item.id === req.params.id)
  if (incidentIndex === -1) {
    return res.status(404).json({ message: 'Incident not found.' })
  }

  runtimeIncidents[incidentIndex] = {
    ...runtimeIncidents[incidentIndex],
    status,
  }
  await persistRuntimeIncidents()

  console.log(`[incidents] Updated ${req.params.id} -> ${status}`)
  return res.json({ incident: runtimeIncidents[incidentIndex] })
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
        const incident = await addRuntimeIncident(
          {
            ...payload,
            source: 'IOT_SENSOR',
            eventType: payload.eventType || payload.event_type || 'ObjectCloseToPlant',
          },
          { source: 'IOT_SENSOR', topic }
        )
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
  console.log(`[incidents] Runtime store loaded with ${runtimeIncidents.length} incident(s)`)
  console.log(`Serving AI evidence from: ${aiEvidenceDir}`)
  console.log('[evidence] Browser route: /evidence/ai')
  startMqttBridge()
})
