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

fs.mkdirSync(aiEvidenceDir, { recursive: true })

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use('/evidence/ai', express.static(aiEvidenceDir))

const MQTT_TOPIC = process.env.MQTT_TOPIC || DEFAULT_MQTT_TOPIC
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883'
const MQTT_ENABLED = process.env.MQTT_ENABLED !== 'false'
const INCIDENT_STORAGE = (process.env.INCIDENT_STORAGE || 'memory').toLowerCase()
const INCIDENT_MYSQL_FALLBACK = (process.env.INCIDENT_MYSQL_FALLBACK || 'memory').toLowerCase()
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
      route: '/evidence/ai',
      storage: 'repo-local-alerts-ai',
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

app.post('/api/incidents', async (req, res) => {
  try {
    const incident = await runIncidentStoreOperation((store) => store.addIncident(req.body))
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

  try {
    const incident = await runIncidentStoreOperation((store) => store.updateIncidentStatus(req.params.id, status, {
      actorRole: 'api',
      actorLabel: 'Incident API',
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
        const incident = await runIncidentStoreOperation((store) => store.addIncident(
          {
            ...payload,
            source: 'IOT_SENSOR',
            eventType: payload.eventType || payload.event_type || 'ObjectCloseToPlant',
          },
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
    console.log('[evidence] Browser route: /evidence/ai')
    startMqttBridge()
  })
}

startServer().catch((error) => {
  console.error(`[server] Unable to start: ${errorMessage(error)}`)
  process.exitCode = 1
})
