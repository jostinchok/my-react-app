import jwt from 'jsonwebtoken'
import helmet from 'helmet'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const appRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.resolve(appRoot, '..', '.env') })

const avatarUploadDir = path.join(appRoot, 'public', 'uploads', 'avatars')
const courseFileUploadDir = path.join(appRoot, 'public', 'uploads', 'course-files')
const adminPublicRoot = path.resolve(appRoot, '..', 'admin_page', 'public')

const port = Number(process.env.API_PORT || 4001)
const host = process.env.API_HOST || '0.0.0.0'
const defaultUserEmail = process.env.DEFAULT_USER_EMAIL || 'guide@test.com'
const databaseName = process.env.DB_NAME || process.env.DB_DATABASE || 'park_guide_database'
const adminApiPublicUrl = process.env.ADMIN_API_PUBLIC_URL || 'http://localhost:4002'

const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5176',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:8082',
  'http://127.0.0.1:8082',
  'http://localhost:19006',
  'http://127.0.0.1:19006',
]

const configuredCorsOrigins = !process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*'
  ? []
  : process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)

const corsOriginSetting = !process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*'
  ? true
  : [...new Set([...configuredCorsOrigins, ...defaultCorsOrigins])]

const corsOptions = {
  origin: corsOriginSetting,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

const app = express()
app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))

app.use(helmet({
  crossOriginResourcePolicy: false,
}))

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this'

const getBearerToken = (req) => {
  const authHeader = String(req.get('Authorization') || '').trim()
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim()

  // Mobile certificate download opens in the device browser via Linking.openURL,
  // which cannot send Authorization headers — allow a short-lived JWT in the query string.
  const queryToken = String(req.query.access_token || req.query.token || '').trim()
  if (queryToken) return queryToken

  return ''
}

const configuredApiRateLimit = Number.parseInt(process.env.API_RATE_LIMIT_MAX || '', 10)
const apiRateLimitMax = Number.isFinite(configuredApiRateLimit) && configuredApiRateLimit > 0
  ? configuredApiRateLimit
  : 2000

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: apiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => {
    const token = getBearerToken(req)
    if (token) {
      try {
        const user = jwt.verify(token, JWT_SECRET)
        const userKey = user.user_id ?? user.userId ?? user.sub ?? user.email
        if (userKey) return `user:${userKey}`
      } catch {
        // fall through to IP-based limiting for invalid tokens
      }
    }
    return ipKeyGenerator(req.ip ?? '')
  },
  message: { message: 'Too many requests, please try again later.' },
})
app.use('/api', apiLimiter)

const requireAuth = (allowedRoles = []) => {
  const normalizedAllowedRoles = allowedRoles.map((role) => String(role || '').toLowerCase())

  return (req, res, next) => {
    if (req.method === 'OPTIONS') {
      return next()
    }

    const token = getBearerToken(req)

    if (!token) {
      return res.status(401).json({ message: 'Login token is required.' })
    }

    try {
      const user = jwt.verify(token, JWT_SECRET)
      const userRole = String(user.role || '').toLowerCase()

      if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'You are not allowed to access this API.' })
      }

      req.user = {
        ...user,
        role: userRole,
      }
      next()
    } catch {
      return res.status(401).json({ message: 'Invalid or expired login token.' })
    }
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
})

app.use(express.json({ limit: '50mb' }))
app.use('/uploads', express.static(path.join(appRoot, 'public', 'uploads')))
// Admin course builder stores module media under admin_page/public/uploads.
app.use('/uploads', express.static(path.join(adminPublicRoot, 'uploads')))

const asyncRoute = (handler) => async (req, res) => {
  try {
    await handler(req, res)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Database request failed. Check that XAMPP MySQL is running and database/db.sql has been imported.',
      detail: process.env.NODE_ENV === 'production' ? undefined : error.message,
    })
  }
}

const rowsOf = async (sql, values = []) => {
  const [rows] = await pool.query(sql, values)
  return rows
}

const rowOf = async (sql, values = []) => {
  const rows = await rowsOf(sql, values)
  return rows[0] || null
}

const tableExists = async (tableName) => {
  const row = await rowOf(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
     LIMIT 1`,
    [databaseName, tableName]
  )
  return Boolean(row)
}

const columnExists = async (tableName, columnName) => {
  const row = await rowOf(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [databaseName, tableName, columnName]
  )
  return Boolean(row)
}

const ensureUserBirthdayColumn = async () => {
  if (await columnExists('users', 'birthday')) return
  await pool.query('ALTER TABLE users ADD COLUMN birthday DATE NULL AFTER email')
}

const PROFILE_SAVE_FIELDS = {
  displayName: { scope: 'user', column: 'name' },
  fullName: { scope: 'user', column: 'name' },
  name: { scope: 'user', column: 'name' },
  email: { scope: 'user', column: 'email' },
  birthday: { scope: 'user', column: 'birthday', ensureBirthday: true },
  phone: { scope: 'profile', column: 'phone' },
  phoneNumber: { scope: 'profile', column: 'phone' },
  yearsExperience: { scope: 'profile', column: 'years_experience' },
  address: { scope: 'profile', column: 'address' },
  assignedPark: { scope: 'profile', column: 'organization' },
  organization: { scope: 'profile', column: 'organization' },
}

const saveUserProfileField = async (userId, field, value) => {
  const config = PROFILE_SAVE_FIELDS[field]
  if (!config) {
    return { ok: false, message: `Profile field "${field}" cannot be saved.` }
  }
  if (config.ensureBirthday) await ensureUserBirthdayColumn()
  const normalized = value === '' ? null : (value ?? null)
  if (config.scope === 'user') {
    await pool.query(`UPDATE users SET ${config.column} = ? WHERE user_id = ?`, [normalized, userId])
    return { ok: true }
  }
  await pool.query(
    `INSERT INTO guide_profiles (guide_id, ${config.column})
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE ${config.column} = VALUES(${config.column})`,
    [userId, normalized]
  )
  return { ok: true }
}

const collectProfileUpdates = (source = {}) => [
  ['displayName', source.displayName ?? source.fullName ?? source.name],
  ['email', source.email],
  ['birthday', source.birthday],
  ['phone', source.phone ?? source.phoneNumber],
  ['address', source.address],
  ['assignedPark', source.assignedPark ?? source.organization],
  ['yearsExperience', source.yearsExperience ?? source.years_experience],
].filter(([, value]) => value !== undefined)

const loadUserProfileRow = async (userId) => {
  await ensureUserBirthdayColumn()
  return rowOf(
    `SELECT
       u.user_id,
       u.name,
       u.email,
       DATE_FORMAT(u.birthday, '%Y-%m-%d') AS birthday,
       r.role_name,
       gp.guide_id,
       gp.phone,
       gp.organization,
       gp.years_experience,
       gp.address,
       gp.avatar_url,
       gp.status
     FROM users u
     LEFT JOIN roles r ON r.role_id = u.role_id
     LEFT JOIN guide_profiles gp ON gp.guide_id = u.user_id
     WHERE u.user_id = ?
     LIMIT 1`,
    [userId]
  )
}

const formatUserProfileResponse = (profile) => ({
  ...profile,
  display_name: profile.name,
  real_name: profile.name,
  assigned_park: profile.organization,
  assignedPark: profile.organization,
  phone_number: profile.phone,
  avatar_url: profile.avatar_url || '',
})

const ensureCertificationCourseColumn = async () => {
  if (!await tableExists('certifications')) return
  if (!(await columnExists('certifications', 'course_id'))) {
    await pool.query('ALTER TABLE certifications ADD COLUMN course_id VARCHAR(50) NULL AFTER user_id')
  }
  if (!(await columnExists('certifications', 'certificate_code'))) {
    await pool.query('ALTER TABLE certifications ADD COLUMN certificate_code VARCHAR(120) NULL AFTER status')
  }
  if (!(await columnExists('certifications', 'certificate_file_url'))) {
    await pool.query('ALTER TABLE certifications ADD COLUMN certificate_file_url VARCHAR(512) NULL AFTER certificate_code')
  }
}

const resolveAdminCertificateFilePath = (fileUrl) => {
  const normalized = String(fileUrl || '').trim()
  if (!normalized.startsWith('/uploads/')) return null
  const relativePath = normalized.replace(/^\/+/, '')
  const absolutePath = path.resolve(adminPublicRoot, relativePath)
  if (!absolutePath.startsWith(adminPublicRoot)) return null
  return absolutePath
}

const MOBILE_CERTIFICATE_VIEWPORT =
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3, viewport-fit=cover" />'

const MOBILE_CERTIFICATE_STYLE_BLOCK = `<style id="sfc-mobile-certificate-view">
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
    -webkit-text-size-adjust: 100%;
    background: #fffdf5 !important;
  }
  .page {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: flex-start !important;
    width: 100% !important;
    max-width: 100vw !important;
    min-height: 100vh !important;
    padding: 8px !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }
  .certificate {
    position: relative !important;
    box-sizing: border-box !important;
    width: calc(100vw - 16px) !important;
    max-width: calc(100vw - 16px) !important;
    min-width: 0 !important;
    min-height: unset !important;
    height: auto !important;
    aspect-ratio: 920 / 620 !important;
    margin: 0 auto !important;
    padding: 15% 7% 17% !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    background-size: cover !important;
    background-position: center center !important;
    background-repeat: no-repeat !important;
    overflow: hidden !important;
  }
  .logo {
    top: 5% !important;
    left: 4% !important;
    width: 44px !important;
    height: 44px !important;
  }
  .content {
    width: 90% !important;
    max-width: 90% !important;
    margin-top: 8% !important;
    flex-shrink: 0 !important;
  }
  .org {
    font-size: 0.62rem !important;
    letter-spacing: 0.06em !important;
    line-height: 1.35 !important;
  }
  h1 {
    margin-top: 8px !important;
    font-size: 1.2rem !important;
    line-height: 1.2 !important;
  }
  .label {
    margin-top: 10px !important;
    font-size: 0.78rem !important;
  }
  .recipient {
    margin-top: 4px !important;
    font-size: 1.2rem !important;
    line-height: 1.15 !important;
    word-break: break-word !important;
  }
  .course {
    margin-top: 4px !important;
    font-size: 0.98rem !important;
    line-height: 1.25 !important;
    word-break: break-word !important;
  }
  .meta {
    margin-top: 12px !important;
    font-size: 0.7rem !important;
    line-height: 1.45 !important;
    word-break: break-word !important;
    padding-bottom: 2px !important;
  }
</style>`

const isMobileCertificateRequest = (req) => {
  const display = String(req.query.display || req.query.mobile || '').toLowerCase()
  if (['mobile', '1', 'true', 'yes'].includes(display)) return true
  const ua = String(req.get('user-agent') || '').toLowerCase()
  return /iphone|ipad|ipod|android|mobile/.test(ua)
}

const injectMobileCertificateStyles = (html) => {
  let output = String(html || '')
  if (output.includes('id="sfc-mobile-certificate-view"')) return output

  output = output.replace(/<meta[^>]*name=["']viewport["'][^>]*>/i, MOBILE_CERTIFICATE_VIEWPORT)
  if (!/name=["']viewport["']/i.test(output)) {
    output = output.replace(/<head>/i, `<head>\n  ${MOBILE_CERTIFICATE_VIEWPORT}`)
  }
  return output.replace(/<\/head>/i, `${MOBILE_CERTIFICATE_STYLE_BLOCK}\n</head>`)
}

const resolveAuthenticatedUserId = async (req) => {
  const token = getBearerToken(req) || String(req.query.access_token || '').trim()
  if (token) {
    try {
      const user = jwt.verify(token, JWT_SECRET)
      const userId = Number(user?.user_id)
      if (Number.isInteger(userId) && userId > 0) return userId
    } catch {
      // Fall back to query/body userId resolution below.
    }
  }
  return resolveUserId(req)
}


// The mobile/web client computes an overall module completion percentage from completed
// lessons + quiz score. We persist the result so the value survives refresh / re-login.
// `db.sql` ships the `progress` table without this column on older installs, so add it
// idempotently on demand.
const ensureProgressPercentColumn = async () => {
  if (!await tableExists('progress')) return
  if (await columnExists('progress', 'progress_percent')) return
  await pool.query(
    'ALTER TABLE progress ADD COLUMN progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER quiz_score'
  )
}

const ensureRole = async (roleName) => {
  await pool.query('INSERT IGNORE INTO roles (role_name) VALUES (?)', [roleName])
  const role = await rowOf('SELECT role_id FROM roles WHERE role_name = ? LIMIT 1', [roleName])
  return role?.role_id || null
}

const ensureDemoUser = async (userId) => {
  const existing = await rowOf('SELECT user_id FROM users WHERE user_id = ? LIMIT 1', [userId])
  if (existing) return

  const roleId = await ensureRole('guide')
  await pool.query(
    `INSERT INTO users (user_id, role_id, name, email, password_hash)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, roleId, `Demo Guide ${userId}`, `guide${userId}@demo.local`, 'demo-account-pending']
  )
  await pool.query(
    `INSERT INTO guide_profiles (guide_id, organization, status)
     VALUES (?, 'SFC Demo', 'active')
     ON DUPLICATE KEY UPDATE organization = VALUES(organization), status = VALUES(status)`,
    [userId]
  )
}

const resolveUserId = async (req) => {
  if (req.user?.user_id) return Number(req.user.user_id)

  const requestedUserId = Number(req.query.userId || req.body?.userId || req.body?.user_id || process.env.DEFAULT_USER_ID)
  if (Number.isInteger(requestedUserId) && requestedUserId > 0) return requestedUserId

  const user = await rowOf('SELECT user_id FROM users WHERE email = ? LIMIT 1', [defaultUserEmail])
  if (user?.user_id) return user.user_id

  const firstGuide = await rowOf(
    `SELECT u.user_id
     FROM users u
     LEFT JOIN roles r ON r.role_id = u.role_id
     WHERE r.role_name = 'guide'
     ORDER BY u.user_id ASC
     LIMIT 1`
  )
  if (firstGuide?.user_id) return firstGuide.user_id

  throw new Error(`No guide user found. Import database/db.sql or create ${defaultUserEmail}.`)
}

const resolveUserIdForTraining = async (req) => {
  try {
    return await resolveUserId(req)
  } catch (error) {
    if (String(error.message || '').startsWith('No guide user found')) return 0
    throw error
  }
}

const parseCompletedLessons = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item))
  }
}

const parseObjectives = (value) => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return String(value)
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
}

const formatDateOnly = (value) => {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

const ensureCourseFilesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS course_files (
      file_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      module_id INT NULL,
      course_key VARCHAR(120) NULL,
      original_name VARCHAR(255) NOT NULL,
      stored_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(120),
      size_bytes BIGINT UNSIGNED DEFAULT 0,
      file_url VARCHAR(512) NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES training_modules(module_id) ON DELETE SET NULL,
      INDEX idx_course_files_user_uploaded (user_id, uploaded_at),
      INDEX idx_course_files_module (module_id)
    )
  `)
}

const safeFileName = (value = 'course-file') => {
  const parsed = path.parse(String(value))
  const name = parsed.name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'course-file'
  const ext = parsed.ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 16)
  return `${name}${ext}`
}

const formatBytes = (sizeBytes = 0) => {
  const size = Number(sizeBytes) || 0
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${size} B`
}

const normalizeCourseFile = (row = {}) => ({
  id: row.file_id,
  userId: row.user_id,
  moduleId: row.module_id,
  course: row.course_key || row.module_title || 'Saved Resources',
  name: row.original_name,
  mimeType: row.mime_type || 'application/octet-stream',
  sizeBytes: Number(row.size_bytes || 0),
  size: formatBytes(row.size_bytes),
  uploaded: formatDateOnly(row.uploaded_at),
  uploadedAt: row.uploaded_at,
  url: row.file_url,
})

const normalizeCourseRow = (row = {}) => ({
  ...row,
  start_date: formatDateOnly(row.start_date),
  end_date: formatDateOnly(row.end_date),
  module_count: Number(row.module_count || 0),
  resource_count: Number(row.resource_count || 0),
  enrollment_status: row.enrollment_status || 'none',
  remarks: row.decision_note || '',
})

const parseMaybeJson = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const resolvePublicUploadUrl = (fileUrl, req) => {
  const normalized = String(fileUrl || '').trim()
  if (!normalized) return ''

  let relative = normalized
  if (/^https?:\/\//i.test(normalized)) {
    try {
      const parsed = new URL(normalized)
      if (parsed.pathname.startsWith('/uploads/')) {
        relative = `${parsed.pathname}${parsed.search}${parsed.hash}`
      } else {
        return normalized
      }
    } catch {
      return normalized
    }
  }

  if (!relative.startsWith('/uploads/')) return normalized

  const host = req?.get?.('host')
  if (host) {
    const proto = req?.protocol || 'http'
    return `${proto}://${host}${relative}`
  }

  return relative
}

const normalizeCanvasCourseItem = (row = {}, req) => {
  const quiz = parseMaybeJson(row.quiz_json, null)
  const checklist = parseMaybeJson(row.checklist_json, [])
  const directFileUrl = resolvePublicUploadUrl(row.file_url, req)

  return {
    id: row.item_id,
    item_id: row.item_id,
    itemId: row.item_id,
    moduleId: row.module_id,
    module_id: row.module_id,
    courseId: row.course_id,
    course_id: row.course_id,
    type: row.item_type,
    item_type: row.item_type,
    itemType: row.item_type,
    title: row.title || 'Untitled item',
    description: row.description || '',
    content: row.content || '',
    external_url: row.external_url || '',
    externalUrl: row.external_url || '',
    url: row.external_url || directFileUrl,
    href: row.external_url || directFileUrl,
    file_name: row.file_name || '',
    fileName: row.file_name || '',
    file_url: directFileUrl,
    fileUrl: directFileUrl,
    media_url: directFileUrl,
    mediaUrl: directFileUrl,
    mime_type: row.mime_type || '',
    mimeType: row.mime_type || '',
    size_bytes: Number(row.size_bytes || 0),
    sizeBytes: Number(row.size_bytes || 0),
    status: row.status || 'published',
    sort_order: Number(row.sort_order || 0),
    sortOrder: Number(row.sort_order || 0),
    quiz,
    question: quiz?.question || '',
    options: quiz?.choices || quiz?.options || [],
    choices: quiz?.choices || quiz?.options || [],
    answer: Number(quiz?.answer ?? quiz?.correctAnswer ?? 0),
    checklist: Array.isArray(checklist) ? checklist : [],
  }
}

const canvasItemTypes = new Set(['page', 'text', 'file', 'image', 'video', 'link', 'quiz', 'checklist'])
const canvasProgressStatuses = new Set(['not_started', 'in_progress', 'completed'])

const ensureCanvasLearningProgressTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS canvas_item_progress (
      progress_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      course_id VARCHAR(64) NOT NULL,
      module_id INT NOT NULL,
      item_id INT NOT NULL,
      item_type ENUM('page','text','file','image','video','link','quiz','checklist') NOT NULL,
      status ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
      completed_at DATETIME NULL,
      last_viewed_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_canvas_progress_user_course_module_item (user_id, course_id, module_id, item_id),
      INDEX idx_canvas_progress_user_module (user_id, module_id),
      INDEX idx_canvas_progress_item (item_id),
      CONSTRAINT fk_canvas_progress_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
      CONSTRAINT fk_canvas_progress_module
        FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
        ON DELETE CASCADE,
      CONSTRAINT fk_canvas_progress_item
        FOREIGN KEY (item_id) REFERENCES course_module_items(item_id)
        ON DELETE CASCADE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS canvas_quiz_attempts (
      attempt_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      course_id VARCHAR(64) NOT NULL,
      module_id INT NOT NULL,
      item_id INT NOT NULL,
      selected_answer TEXT NULL,
      correct_answer TEXT NULL,
      is_correct BOOLEAN NOT NULL DEFAULT FALSE,
      score_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
      attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_canvas_quiz_user_item_attempted (user_id, item_id, attempted_at),
      INDEX idx_canvas_quiz_user_module (user_id, module_id),
      CONSTRAINT fk_canvas_quiz_attempt_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
      CONSTRAINT fk_canvas_quiz_attempt_module
        FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
        ON DELETE CASCADE,
      CONSTRAINT fk_canvas_quiz_attempt_item
        FOREIGN KEY (item_id) REFERENCES course_module_items(item_id)
        ON DELETE CASCADE
    )
  `)
}

const positiveInt = (value) => {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

const booleanValue = (value) => value === true || value === 1 || String(value).toLowerCase() === 'true'

const normalizeCanvasProgressStatus = (value) => {
  const status = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  return canvasProgressStatuses.has(status) ? status : 'completed'
}

const normalizeCanvasItemType = (value) => {
  const type = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  return canvasItemTypes.has(type) ? type : 'page'
}

const dateToIso = (value) => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString()
}

const normalizeCanvasProgressRow = (row = {}) => ({
  progressId: row.progress_id,
  progress_id: row.progress_id,
  userId: row.user_id,
  user_id: row.user_id,
  guideId: row.user_id,
  guide_id: row.user_id,
  courseId: row.course_id,
  course_id: row.course_id,
  moduleId: row.module_id,
  module_id: row.module_id,
  itemId: row.item_id,
  item_id: row.item_id,
  itemType: row.item_type,
  item_type: row.item_type,
  status: row.status,
  completed: row.status === 'completed',
  completedAt: dateToIso(row.completed_at),
  completed_at: dateToIso(row.completed_at),
  lastViewedAt: dateToIso(row.last_viewed_at),
  last_viewed_at: dateToIso(row.last_viewed_at),
  updatedAt: dateToIso(row.updated_at),
  updated_at: dateToIso(row.updated_at),
})

const normalizeCanvasQuizAttemptRow = (row = {}) => ({
  attemptId: row.attempt_id,
  attempt_id: row.attempt_id,
  userId: row.user_id,
  user_id: row.user_id,
  guideId: row.user_id,
  guide_id: row.user_id,
  courseId: row.course_id,
  course_id: row.course_id,
  moduleId: row.module_id,
  module_id: row.module_id,
  itemId: row.item_id,
  item_id: row.item_id,
  selectedAnswer: row.selected_answer || '',
  selected_answer: row.selected_answer || '',
  correctAnswer: row.correct_answer || '',
  correct_answer: row.correct_answer || '',
  isCorrect: Boolean(row.is_correct),
  is_correct: Boolean(row.is_correct),
  scorePercent: Number(row.score_percent || 0),
  score_percent: Number(row.score_percent || 0),
  attemptedAt: dateToIso(row.attempted_at),
  attempted_at: dateToIso(row.attempted_at),
  createdAt: dateToIso(row.created_at),
  created_at: dateToIso(row.created_at),
})

const loadCanvasProgressPayload = async (userId) => {
  await ensureCanvasLearningProgressTables()

  const [progressRows, quizRows, moduleSummaryRows] = await Promise.all([
    rowsOf(
      `SELECT progress_id, user_id, course_id, module_id, item_id, item_type, status,
              completed_at, last_viewed_at, created_at, updated_at
       FROM canvas_item_progress
       WHERE user_id = ?
       ORDER BY updated_at DESC, progress_id DESC`,
      [userId]
    ),
    rowsOf(
      `SELECT attempt_id, user_id, course_id, module_id, item_id, selected_answer, correct_answer,
              is_correct, score_percent, attempted_at, created_at
       FROM canvas_quiz_attempts
       WHERE user_id = ?
       ORDER BY attempted_at DESC, attempt_id DESC`,
      [userId]
    ),
    rowsOf(
      `SELECT
         cmi.course_id,
         cmi.module_id,
         tm.title AS module_title,
         COUNT(cmi.item_id) AS total_items,
         SUM(CASE WHEN cip.status = 'completed' THEN 1 ELSE 0 END) AS completed_items,
         MAX(cip.updated_at) AS last_updated_at
       FROM course_module_items cmi
       LEFT JOIN training_modules tm ON tm.module_id = cmi.module_id
       LEFT JOIN canvas_item_progress cip
         ON cip.user_id = ?
        AND cip.course_id = cmi.course_id
        AND cip.module_id = cmi.module_id
        AND cip.item_id = cmi.item_id
       WHERE ${publishedCanvasItemClause('cmi')}
       GROUP BY cmi.course_id, cmi.module_id, tm.title
       ORDER BY tm.title ASC, cmi.module_id ASC`,
      [userId]
    ),
  ])

  const itemProgress = progressRows.map(normalizeCanvasProgressRow)
  const quizAttempts = quizRows.map(normalizeCanvasQuizAttemptRow)
  const completedItemIds = itemProgress
    .filter((item) => item.status === 'completed')
    .map((item) => String(item.itemId))

  const modules = moduleSummaryRows.map((row) => {
    const totalItems = Number(row.total_items || 0)
    const completedItems = Number(row.completed_items || 0)
    return {
      courseId: row.course_id,
      course_id: row.course_id,
      moduleId: row.module_id,
      module_id: row.module_id,
      moduleTitle: row.module_title || '',
      module_title: row.module_title || '',
      totalItems,
      total_items: totalItems,
      completedItems,
      completed_items: completedItems,
      progressPercent: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      progress_percent: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      lastUpdatedAt: dateToIso(row.last_updated_at),
      last_updated_at: dateToIso(row.last_updated_at),
    }
  })

  const totalItems = modules.reduce((sum, module) => sum + module.totalItems, 0)
  const completedCount = completedItemIds.length

  return {
    ok: true,
    persistence: 'mysql',
    userId,
    user_id: userId,
    guideId: userId,
    guide_id: userId,
    completedItemIds,
    completed_item_ids: completedItemIds,
    itemProgress,
    item_progress: itemProgress,
    quizAttempts,
    quiz_attempts: quizAttempts,
    summary: {
      userId,
      user_id: userId,
      guideId: userId,
      guide_id: userId,
      totalItems,
      total_items: totalItems,
      completedCount,
      completed_count: completedCount,
      quizAttemptCount: quizAttempts.length,
      quiz_attempt_count: quizAttempts.length,
      progressPercent: totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0,
      progress_percent: totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0,
      modules,
    },
  }
}

const normalizeCourseResource = (row = {}) => ({
  id: `resource-${row.resource_id}`,
  source: 'admin_resource',
  readOnly: true,
  courseId: row.course_id,
  course: row.course_name || row.course_id || 'Admin Resources',
  name: row.title || row.file_name,
  mimeType: row.mime_type || 'application/octet-stream',
  sizeBytes: Number(row.size_bytes || 0),
  size: formatBytes(row.size_bytes),
  uploaded: formatDateOnly(row.uploaded_at),
  uploadedAt: row.uploaded_at,
  url: `${adminApiPublicUrl}/api/courses/${encodeURIComponent(row.course_id)}/resources/${row.resource_id}/download`,
})

const buildModules = async (userId, req) => {
  const hasCourseId = await columnExists('training_modules', 'course_id')
  const hasModuleSortOrder = await columnExists('training_modules', 'sort_order')
  const hasCoursesTable = hasCourseId ? await tableExists('courses') : false
  // Best-effort: make sure `progress_percent` is available on older `progress` tables so
  // the SELECT below doesn't fail. Safe to call repeatedly (no-op if column exists).
  await ensureProgressPercentColumn()
  const hasProgressPercent = await columnExists('progress', 'progress_percent')
  const moduleOrderClause = [
    hasCourseId ? 'tm.course_id ASC' : null,
    hasModuleSortOrder ? 'tm.sort_order ASC' : null,
    'tm.created_at DESC',
    'tm.module_id DESC',
  ].filter(Boolean).join(', ')
  const modules = await rowsOf(
    `SELECT
       tm.module_id,
       ${hasCourseId ? 'tm.course_id' : 'NULL AS course_id'},
       ${hasCoursesTable ? 'c.course_name' : 'NULL AS course_name'},
       ${hasCoursesTable ? 'c.description AS course_description' : 'NULL AS course_description'},
       ${hasCoursesTable ? "DATE_FORMAT(c.start_date, '%Y-%m-%d')" : 'NULL'} AS course_start_date,
       ${hasCoursesTable ? "DATE_FORMAT(c.end_date, '%Y-%m-%d')" : 'NULL'} AS course_end_date,
       ${hasCoursesTable ? 'c.total_contact_hours' : 'NULL'} AS course_contact_hours,
       tm.title,
       tm.description,
       tm.category,
       tm.park,
       tm.level,
       tm.duration,
       tm.format,
       tm.image_url,
       tm.accent_color,
       tm.badge_name,
       tm.objectives,
       ${hasModuleSortOrder ? 'tm.sort_order' : '0'} AS sort_order,
       tm.created_at,
       p.completed_lessons,
       p.quiz_passed,
       p.quiz_score,
       ${hasProgressPercent ? 'p.progress_percent' : '0'} AS progress_percent,
       p.status AS progress_status
     FROM training_modules tm
     ${hasCoursesTable ? 'LEFT JOIN courses c ON c.course_id = tm.course_id' : ''}
     LEFT JOIN progress p ON p.module_id = tm.module_id AND p.user_id = ?
     ORDER BY ${moduleOrderClause}`,
    [userId]
  )

  if (modules.length === 0) return []

  const moduleIds = modules.map((module) => module.module_id)
  const courseIds = hasCourseId
    ? [...new Set(modules.map((module) => module.course_id).filter(Boolean))]
    : []
  const hasCourseResources = courseIds.length > 0 && await tableExists('course_resources')

  const hasCanvasItems = await tableExists('course_module_items')

  const [lessons, quizRows, courseResources, canvasItemRows] = await Promise.all([
    rowsOf(
      `SELECT lesson_id, module_id, title, content, media_url
      FROM lessons
      WHERE module_id IN (?)
      ORDER BY lesson_id ASC`,
      [moduleIds]
    ),
    rowsOf(
      `SELECT
        q.quiz_id,
        q.module_id,
        q.title AS quiz_title,
        qs.question_id,
        qs.question_text,
        o.option_id,
        o.option_text,
        o.is_correct
      FROM quizzes q
      LEFT JOIN questions qs ON qs.quiz_id = q.quiz_id
      LEFT JOIN \`options\` o ON o.question_id = qs.question_id
      WHERE q.module_id IN (?)
      ORDER BY q.quiz_id ASC, qs.question_id ASC, o.option_id ASC`,
      [moduleIds]
    ),
    hasCourseResources
      ? rowsOf(
        `SELECT resource_id, course_id, title, file_name, mime_type, size_bytes, uploaded_at
        FROM course_resources
        WHERE course_id IN (?)
        ORDER BY uploaded_at DESC, resource_id DESC`,
        [courseIds]
      )
      : Promise.resolve([]),
    hasCanvasItems
      ? rowsOf(
        `SELECT
          item_id,
          module_id,
          course_id,
          item_type,
          title,
          description,
          content,
          external_url,
          file_name,
          stored_name,
          mime_type,
          size_bytes,
          file_url,
          quiz_json,
          checklist_json,
          status,
          sort_order,
          created_at,
          updated_at
        FROM course_module_items
        WHERE module_id IN (?)
        ORDER BY module_id ASC, sort_order ASC, item_id ASC`,
        [moduleIds]
      )
      : Promise.resolve([]),
  ])

  const lessonsByModule = new Map()
  for (const lesson of lessons) {
    const list = lessonsByModule.get(lesson.module_id) || []
    list.push(lesson)
    lessonsByModule.set(lesson.module_id, list)
  }

  const quizByModule = new Map()
  for (const row of quizRows) {
    if (!row.question_id) continue
    const quiz = quizByModule.get(row.module_id) || {
      question: row.question_text,
      options: [],
      answer: 0,
    }
    if (row.option_id) {
      if (row.is_correct) quiz.answer = quiz.options.length
      quiz.options.push(row.option_text)
    }
    quizByModule.set(row.module_id, quiz)
  }

  const resourcesByCourse = new Map()
  for (const resource of courseResources) {
    const list = resourcesByCourse.get(resource.course_id) || []
    list.push({
      id: `resource-${resource.resource_id}`,
      source: 'admin_resource',
      readOnly: true,
      title: resource.title || resource.file_name || 'Course resource',
      name: resource.title || resource.file_name || 'Course resource',
      type: resource.mime_type || 'Admin resource',
      size: formatBytes(resource.size_bytes),
      uploaded: formatDateOnly(resource.uploaded_at),
      url: `${adminApiPublicUrl}/api/courses/${encodeURIComponent(resource.course_id)}/resources/${resource.resource_id}/download`,
    })
    resourcesByCourse.set(resource.course_id, list)
  }

  const itemsByModule = new Map()

  for (const item of canvasItemRows) {
    const list = itemsByModule.get(item.module_id) || []
    list.push(normalizeCanvasCourseItem(item, req))
    itemsByModule.set(item.module_id, list)
  }

  return modules.map((module) => {
    const moduleLessons = lessonsByModule.get(module.module_id) || []
    return {
      ...module,
      id: module.module_id,
      courseId: module.course_id,
      course_id: module.course_id,
      courseName: module.course_name || module.course_id || 'SFC Training Course',
      course_name: module.course_name || module.course_id || 'SFC Training Course',
      courseTitle: module.course_name || module.course_id || 'SFC Training Course',
      courseDescription: module.course_description || '',
      course_description: module.course_description || '',
      courseStartDate: formatDateOnly(module.course_start_date),
      course_start_date: formatDateOnly(module.course_start_date),
      courseEndDate: formatDateOnly(module.course_end_date),
      course_end_date: formatDateOnly(module.course_end_date),
      courseContactHours: Number(module.course_contact_hours || 0),
      course_contact_hours: Number(module.course_contact_hours || 0),
      sortOrder: Number(module.sort_order || 0),
      sort_order: Number(module.sort_order || 0),
      image: module.image_url,
      accent: module.accent_color,
      badge: module.badge_name,
      subtitle: module.description,
      objectives: parseObjectives(module.objectives),
      lessons: moduleLessons.map((lesson) => lesson.title || lesson.content),
      items: itemsByModule.get(module.module_id) || [],
      resources: [
        ...moduleLessons
          .filter((lesson) => lesson.media_url)
          .map((lesson) => ({
            id: `lesson-${lesson.lesson_id}`,
            title: lesson.title || 'Lesson media',
            type: 'Media',
          })),
        ...(resourcesByCourse.get(module.course_id) || []),
      ],
      quiz: quizByModule.get(module.module_id) || {
        question: 'Assessment question will appear here.',
        options: [],
        answer: 0,
      },
      completedLessons: parseCompletedLessons(module.completed_lessons),
      quizPassed: Boolean(module.quiz_passed),
      quizScore: module.quiz_score || 0,
      progress: Number(module.progress_percent) || 0,
      progress_percent: Number(module.progress_percent) || 0,
    }
  })
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({
    status: 'ok',
    message: 'User backend connected to MySQL',
    database: databaseName,
  })
}))

// SECURITY: protect all user/guide APIs after health check
app.use('/api', requireAuth(['guide']))

app.get('/api/training-modules', asyncRoute(async (req, res) => {
  const userId = await resolveUserIdForTraining(req)
  const modules = await buildModules(userId, req)
  res.json({ modules })
}))

app.get('/api/courses', asyncRoute(async (req, res) => {
  const userId = await resolveUserIdForTraining(req)
  const hasCourses = await tableExists('courses')
  if (!hasCourses) {
    res.json({ courses: [] })
    return
  }

  const [
    hasTrainingModuleCourseId,
    hasCourseResources,
    hasCourseEnrollments,
    hasDecisionNote,
  ] = await Promise.all([
    columnExists('training_modules', 'course_id'),
    tableExists('course_resources'),
    tableExists('course_enrollments'),
    columnExists('course_enrollments', 'decision_note'),
  ])

  const enrollmentJoin = hasCourseEnrollments
    ? 'LEFT JOIN course_enrollments ce ON ce.course_id = c.course_id AND ce.user_id = ?'
    : ''
  const moduleJoin = hasTrainingModuleCourseId
    ? 'LEFT JOIN training_modules tm ON tm.course_id = c.course_id'
    : ''
  const resourceJoin = hasCourseResources
    ? 'LEFT JOIN course_resources cr ON cr.course_id = c.course_id'
    : ''
  const enrollmentStatusSelect = hasCourseEnrollments
    ? "COALESCE(ce.status, 'none') AS enrollment_status"
    : "'none' AS enrollment_status"
  const decisionNoteSelect = hasCourseEnrollments && hasDecisionNote
    ? 'ce.decision_note'
    : 'NULL AS decision_note'
  const groupEnrollmentColumns = hasCourseEnrollments
    ? `, ce.status${hasDecisionNote ? ', ce.decision_note' : ''}`
    : ''

  const courses = await rowsOf(
    `SELECT
       c.course_id,
       c.course_name,
       c.description,
       DATE_FORMAT(c.start_date, '%Y-%m-%d') AS start_date,
       DATE_FORMAT(c.end_date, '%Y-%m-%d') AS end_date,
       c.total_contact_hours,
       c.created_at,
       ${hasTrainingModuleCourseId ? 'COUNT(DISTINCT tm.module_id)' : '0'} AS module_count,
       ${hasCourseResources ? 'COUNT(DISTINCT cr.resource_id)' : '0'} AS resource_count,
       ${enrollmentStatusSelect},
       ${decisionNoteSelect}
     FROM courses c
     ${moduleJoin}
     ${resourceJoin}
     ${enrollmentJoin}
     GROUP BY c.course_id, c.course_name, c.description, c.start_date, c.end_date, c.total_contact_hours, c.created_at${groupEnrollmentColumns}
     ORDER BY c.created_at DESC, c.course_id ASC`,
    hasCourseEnrollments ? [userId] : []
  )

  res.json({ courses: courses.map(normalizeCourseRow) })
}))

app.get('/api/canvas-progress', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const payload = await loadCanvasProgressPayload(userId)
  res.json(payload)
}))

app.get('/api/canvas-progress/summary', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const payload = await loadCanvasProgressPayload(userId)
  res.json({ ok: true, persistence: payload.persistence, summary: payload.summary })
}))

app.post('/api/canvas-progress/item', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const {
    courseId = null,
    course_id = null,
    moduleId = null,
    module_id = null,
    itemId = null,
    item_id = null,
    itemType = null,
    item_type = null,
    status = 'completed',
  } = req.body || {}

  const courseIdValue = String(courseId || course_id || '').trim()
  const moduleIdValue = positiveInt(moduleId || module_id)
  const itemIdValue = positiveInt(itemId || item_id)
  const itemTypeValue = normalizeCanvasItemType(itemType || item_type)
  const statusValue = normalizeCanvasProgressStatus(status)

  if (!courseIdValue || !moduleIdValue || !itemIdValue) {
    res.status(400).json({ message: 'course_id, module_id, and numeric item_id are required for Canvas progress.' })
    return
  }

  await ensureDemoUser(userId)
  await ensureCanvasLearningProgressTables()
  await pool.query(
    `INSERT INTO canvas_item_progress
       (user_id, course_id, module_id, item_id, item_type, status, completed_at, last_viewed_at)
     VALUES (?, ?, ?, ?, ?, ?, IF(? = 'completed', CURRENT_TIMESTAMP, NULL), CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       item_type = VALUES(item_type),
       status = VALUES(status),
       completed_at = CASE
         WHEN VALUES(status) = 'completed' THEN COALESCE(completed_at, CURRENT_TIMESTAMP)
         ELSE NULL
       END,
       last_viewed_at = CURRENT_TIMESTAMP`,
    [userId, courseIdValue, moduleIdValue, itemIdValue, itemTypeValue, statusValue, statusValue]
  )

  const payload = await loadCanvasProgressPayload(userId)
  res.json(payload)
}))

app.post('/api/canvas-progress/quiz', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const {
    courseId = null,
    course_id = null,
    moduleId = null,
    module_id = null,
    itemId = null,
    item_id = null,
    selectedAnswer = null,
    selected_answer = null,
    correctAnswer = null,
    correct_answer = null,
    isCorrect = null,
    is_correct = null,
    scorePercent = null,
    score_percent = null,
  } = req.body || {}

  const courseIdValue = String(courseId || course_id || '').trim()
  const moduleIdValue = positiveInt(moduleId || module_id)
  const itemIdValue = positiveInt(itemId || item_id)
  const isCorrectValue = booleanValue(isCorrect ?? is_correct)
  const scorePercentValue = Number.isFinite(Number(scorePercent ?? score_percent))
    ? Math.max(0, Math.min(100, Number(scorePercent ?? score_percent)))
    : isCorrectValue ? 100 : 0

  if (!courseIdValue || !moduleIdValue || !itemIdValue) {
    res.status(400).json({ message: 'course_id, module_id, and numeric item_id are required for Canvas quiz progress.' })
    return
  }

  await ensureDemoUser(userId)
  await ensureCanvasLearningProgressTables()

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await connection.query(
      `INSERT INTO canvas_quiz_attempts
         (user_id, course_id, module_id, item_id, selected_answer, correct_answer, is_correct, score_percent, attempted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        userId,
        courseIdValue,
        moduleIdValue,
        itemIdValue,
        selectedAnswer ?? selected_answer ?? null,
        correctAnswer ?? correct_answer ?? null,
        isCorrectValue,
        scorePercentValue,
      ]
    )
    const quizProgressStatus = isCorrectValue ? 'completed' : 'in_progress'
    await connection.query(
      `INSERT INTO canvas_item_progress
         (user_id, course_id, module_id, item_id, item_type, status, completed_at, last_viewed_at)
       VALUES (?, ?, ?, ?, 'quiz', ?, ${isCorrectValue ? 'CURRENT_TIMESTAMP' : 'NULL'}, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         item_type = 'quiz',
         status = VALUES(status),
         completed_at = IF(VALUES(status) = 'completed', COALESCE(completed_at, CURRENT_TIMESTAMP), completed_at),
         last_viewed_at = CURRENT_TIMESTAMP`,
      [userId, courseIdValue, moduleIdValue, itemIdValue, quizProgressStatus]
    )
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  const payload = await loadCanvasProgressPayload(userId)
  res.status(201).json(payload)
}))

const publishedCanvasItemClause = (alias = 'cmi') =>
  `LOWER(TRIM(IFNULL(${alias}.status, 'published'))) = 'published'`

const upsertCanvasItemCompletion = async ({
  userId,
  courseId,
  moduleId,
  itemId,
  itemType,
  status = 'completed',
}) => {
  const itemIdValue = positiveInt(itemId)
  const moduleIdValue = positiveInt(moduleId)
  const courseIdValue = String(courseId || '').trim()
  if (!userId || !itemIdValue || !moduleIdValue || !courseIdValue) return false

  await ensureCanvasLearningProgressTables()
  const statusValue = normalizeCanvasProgressStatus(status)
  await pool.query(
    `INSERT INTO canvas_item_progress
       (user_id, course_id, module_id, item_id, item_type, status, completed_at, last_viewed_at)
     VALUES (?, ?, ?, ?, ?, ?, IF(? = 'completed', CURRENT_TIMESTAMP, NULL), CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       item_type = VALUES(item_type),
       status = VALUES(status),
       completed_at = CASE
         WHEN VALUES(status) = 'completed' THEN COALESCE(completed_at, CURRENT_TIMESTAMP)
         ELSE completed_at
       END,
       last_viewed_at = CURRENT_TIMESTAMP`,
    [
      userId,
      courseIdValue,
      moduleIdValue,
      itemIdValue,
      normalizeCanvasItemType(itemType),
      statusValue,
      statusValue,
    ]
  )
  return true
}

const syncModuleCanvasProgress = async (
  userId,
  moduleId,
  {
    courseId = '',
    completedLessons = [],
    completedItemIds = [],
    quizPassed = false,
    quizScore = 0,
    progressPercent = 0,
    markAllItems = false,
  } = {}
) => {
  const hasCanvasItems = await tableExists('course_module_items')
  if (!hasCanvasItems) return { syncedItems: 0 }

  const moduleIdValue = positiveInt(moduleId)
  if (!moduleIdValue) return { syncedItems: 0 }

  const module = await rowOf(
    'SELECT course_id FROM training_modules WHERE module_id = ? LIMIT 1',
    [moduleIdValue]
  )
  const courseIdValue = String(courseId || module?.course_id || '').trim()
  if (!courseIdValue) return { syncedItems: 0 }

  await ensureCanvasLearningProgressTables()

  const items = await rowsOf(
    `SELECT item_id, item_type, sort_order
     FROM course_module_items cmi
     WHERE cmi.module_id = ? AND cmi.course_id = ? AND ${publishedCanvasItemClause('cmi')}
     ORDER BY cmi.sort_order ASC, cmi.item_id ASC`,
    [moduleIdValue, courseIdValue]
  )
  if (items.length === 0) return { syncedItems: 0 }

  const contentItems = items.filter((item) => String(item.item_type || '').toLowerCase() !== 'quiz')
  const quizItems = items.filter((item) => String(item.item_type || '').toLowerCase() === 'quiz')
  const itemIdsToComplete = new Set()

  for (const rawId of completedItemIds) {
    const itemIdValue = positiveInt(rawId)
    if (itemIdValue) itemIdsToComplete.add(itemIdValue)
  }

  const completedIndexes = Array.isArray(completedLessons)
    ? completedLessons.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0)
    : []

  for (const index of completedIndexes) {
    const item = contentItems[index]
    if (item?.item_id) itemIdsToComplete.add(Number(item.item_id))
  }

  const quizComplete = booleanValue(quizPassed) || Number(quizScore) >= 100
  const shouldMarkAll = markAllItems || Number(progressPercent) >= 100

  if (shouldMarkAll) {
    for (const item of items) itemIdsToComplete.add(Number(item.item_id))
  }

  if (quizComplete) {
    for (const item of quizItems) itemIdsToComplete.add(Number(item.item_id))
  }

  let syncedItems = 0
  for (const itemIdValue of itemIdsToComplete) {
    const item = items.find((row) => Number(row.item_id) === Number(itemIdValue))
    if (!item) continue
    const saved = await upsertCanvasItemCompletion({
      userId,
      courseId: courseIdValue,
      moduleId: moduleIdValue,
      itemId: itemIdValue,
      itemType: item.item_type,
      status: 'completed',
    })
    if (saved) syncedItems += 1
  }

  return { syncedItems }
}

// Persist per-module progress for the mobile/web Park Guide UI.
// Also mirrors completion into `canvas_item_progress` so Admin certificate progress matches mobile.
app.patch('/api/progress/:moduleId', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const moduleId = positiveInt(req.params.moduleId)
  if (!moduleId) {
    res.status(400).json({ message: 'A numeric module_id is required.' })
    return
  }

  const body = req.body || {}
  const completedRaw = body.completed_lessons ?? body.completedLessons ?? []
  const completedArray = Array.isArray(completedRaw)
    ? completedRaw.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 0)
    : []
  const completedJson = JSON.stringify([...new Set(completedArray)].sort((a, b) => a - b))

  const quizScoreRaw = Number(body.quiz_score ?? body.quizScore ?? 0)
  const quizScore = Number.isFinite(quizScoreRaw) ? Math.max(0, Math.min(100, Math.round(quizScoreRaw))) : 0
  const quizPassed = booleanValue(body.quiz_passed ?? body.quizPassed)

  const progressRaw = Number(body.progress_percent ?? body.progressPercent ?? 0)
  const progressPercent = Number.isFinite(progressRaw) ? Math.max(0, Math.min(100, progressRaw)) : 0

  const status = progressPercent >= 100
    ? 'completed'
    : progressPercent > 0
      ? 'in_progress'
      : 'not_started'
  const completionDate = status === 'completed' ? new Date() : null

  await ensureProgressPercentColumn()

  // The legacy `progress` table has no UNIQUE(user_id, module_id) constraint, so we
  // emulate an upsert with a SELECT + INSERT/UPDATE pair rather than ON DUPLICATE KEY.
  const existing = await rowOf(
    'SELECT progress_id FROM progress WHERE user_id = ? AND module_id = ? LIMIT 1',
    [userId, moduleId]
  )

  if (existing?.progress_id) {
    await pool.query(
      `UPDATE progress
         SET completed_lessons = ?,
             quiz_passed = ?,
             quiz_score = ?,
             progress_percent = ?,
             status = ?,
             completion_date = ?
       WHERE progress_id = ?`,
      [completedJson, quizPassed, quizScore, progressPercent, status, completionDate, existing.progress_id]
    )
  } else {
    await pool.query(
      `INSERT INTO progress
         (user_id, module_id, completed_lessons, quiz_passed, quiz_score, progress_percent, status, completion_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, moduleId, completedJson, quizPassed, quizScore, progressPercent, status, completionDate]
    )
  }

  let canvasSync = { syncedItems: 0 }
  try {
    const completedItemIds = Array.isArray(body.completed_item_ids ?? body.completedItemIds)
      ? body.completed_item_ids ?? body.completedItemIds
      : []
    canvasSync = await syncModuleCanvasProgress(userId, moduleId, {
      courseId: body.course_id ?? body.courseId,
      completedLessons: JSON.parse(completedJson),
      completedItemIds,
      quizPassed,
      quizScore,
      progressPercent,
      markAllItems: progressPercent >= 100,
    })
  } catch (error) {
    console.warn(`[progress] Canvas sync skipped for module ${moduleId}: ${error.message}`)
  }

  res.json({
    ok: true,
    canvasSync,
    progress: {
      module_id: moduleId,
      user_id: userId,
      progress_percent: progressPercent,
      completed_lessons: JSON.parse(completedJson),
      quiz_score: quizScore,
      quiz_passed: quizPassed,
      status,
    },
  })
}))

app.post('/api/canvas-progress/sync-module', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const body = req.body || {}
  const moduleId = positiveInt(body.module_id ?? body.moduleId)
  if (!moduleId) {
    res.status(400).json({ message: 'A numeric module_id is required.' })
    return
  }

  const completedRaw = body.completed_lessons ?? body.completedLessons ?? []
  const completedLessons = Array.isArray(completedRaw)
    ? completedRaw.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0)
    : []
  const completedItemIds = Array.isArray(body.completed_item_ids ?? body.completedItemIds)
    ? body.completed_item_ids ?? body.completedItemIds
    : []
  const quizScore = Number(body.quiz_score ?? body.quizScore ?? 0)
  const quizPassed = booleanValue(body.quiz_passed ?? body.quizPassed)
  const progressPercent = Number(body.progress_percent ?? body.progressPercent ?? 0)

  await ensureDemoUser(userId)
  const canvasSync = await syncModuleCanvasProgress(userId, moduleId, {
    courseId: body.course_id ?? body.courseId,
    completedLessons,
    completedItemIds,
    quizPassed,
    quizScore,
    progressPercent,
    markAllItems: booleanValue(body.mark_all_items ?? body.markAllItems) || progressPercent >= 100,
  })

  const payload = await loadCanvasProgressPayload(userId)
  res.json({
    ...payload,
    canvasSync,
    message: canvasSync.syncedItems > 0
      ? `Synced ${canvasSync.syncedItems} Canvas item(s) for Admin progress.`
      : 'No published Canvas items were found for this module.',
  })
}))

app.get('/api/user-profile', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const profile = await loadUserProfileRow(userId)

  if (!profile) {
    res.status(404).json({ message: 'User profile not found.' })
    return
  }

  res.json({ profile: formatUserProfileResponse(profile) })
}))

app.patch('/api/user-profile', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const body = req.body || {}

  if (body.field !== undefined && body.field !== null && body.field !== '') {
    const result = await saveUserProfileField(userId, body.field, body.value)
    if (!result.ok) {
      res.status(400).json({ message: result.message })
      return
    }
    res.json({ ok: true, field: body.field, value: body.value })
    return
  }

  const bulkSource = body.profile && typeof body.profile === 'object' ? body.profile : body
  const updates = collectProfileUpdates(bulkSource)
  if (updates.length === 0) {
    res.status(400).json({ message: 'No profile fields to update.' })
    return
  }

  for (const [field, value] of updates) {
    const result = await saveUserProfileField(userId, field, value)
    if (!result.ok) {
      res.status(400).json({ message: result.message })
      return
    }
  }

  const profile = await loadUserProfileRow(userId)
  if (!profile) {
    res.status(404).json({ message: 'User profile not found.' })
    return
  }

  res.json({ ok: true, profile: formatUserProfileResponse(profile) })
}))

app.post('/api/user-profile/avatar', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const { fileName = 'avatar.png', dataUrl } = req.body || {}
  const match = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([a-zA-Z0-9+/=]+)$/.exec(dataUrl || '')
  const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB

  const buffer = Buffer.from(match[2], 'base64')

  if (buffer.length > MAX_AVATAR_SIZE) {
    res.status(400).json({ message: 'Avatar file is too large. Maximum size is 2MB.' })
    return
  }
  if (!match) {
    res.status(400).json({ message: 'Send an image data URL as dataUrl.' })
    return
  }

  const extensionByType = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  const extension = extensionByType[match[1]] || path.extname(fileName).slice(1) || 'png'
  const avatarFileName = `user-${userId}-${Date.now()}.${extension}`
  const avatarPath = path.join(avatarUploadDir, avatarFileName)
  const avatarUrl = `/uploads/avatars/${avatarFileName}`

  await fs.mkdir(avatarUploadDir, { recursive: true })
  await fs.writeFile(avatarPath, buffer)
  await pool.query(
    `INSERT INTO guide_profiles (guide_id, avatar_url)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE avatar_url = VALUES(avatar_url)`,
    [userId, avatarUrl]
  )

  res.json({ ok: true, avatar_url: avatarUrl })
}))

app.get('/api/certifications', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  await ensureCertificationCourseColumn()
  const certifications = await rowsOf(
    `SELECT
       c.cert_id,
       c.user_id,
       c.module_id,
       c.title,
       c.status,
       c.certificate_code,
       c.certificate_file_url,
       c.issue_date,
       c.expiry_date,
       COALESCE(c.course_id, tm.course_id) AS course_id,
       tm.title AS module_title
     FROM certifications c
     LEFT JOIN training_modules tm ON tm.module_id = c.module_id
     WHERE c.user_id = ?
     ORDER BY c.issue_date DESC, c.cert_id DESC`,
    [userId]
  )
  res.json({ certifications })
}))

app.get('/api/certifications/:certId/download', asyncRoute(async (req, res) => {
  const userId = await resolveAuthenticatedUserId(req)
  await ensureCertificationCourseColumn()

  const certId = positiveInt(req.params.certId)
  if (!certId) {
    res.status(400).json({ message: 'A valid certificate id is required.' })
    return
  }

  const certification = await rowOf(
    `SELECT
       c.cert_id,
       c.user_id,
       c.course_id,
       c.title,
       c.status,
       c.certificate_code,
       c.certificate_file_url,
       c.issue_date,
       COALESCE(c.course_id, tm.course_id) AS resolved_course_id,
       COALESCE(co.course_name, c.title) AS course_name,
       u.name AS guide_name
     FROM certifications c
     LEFT JOIN training_modules tm ON tm.module_id = c.module_id
     LEFT JOIN courses co ON co.course_id = COALESCE(c.course_id, tm.course_id)
     LEFT JOIN users u ON u.user_id = c.user_id
     WHERE c.cert_id = ? AND c.user_id = ?
     LIMIT 1`,
    [certId, userId]
  )

  if (!certification) {
    res.status(404).json({ message: 'Certificate not found.' })
    return
  }

  const status = String(certification.status || '').toLowerCase()
  if (!['issued', 'approved'].includes(status)) {
    res.status(403).json({ message: 'Certificate is not issued yet.' })
    return
  }

  const filePath = resolveAdminCertificateFilePath(certification.certificate_file_url)
  if (!filePath) {
    res.status(404).json({
      message: 'Certificate file is not available yet. Ask Admin to click Issue Certificate again for this course.',
    })
    return
  }

  try {
    await fs.access(filePath)
  } catch {
    res.status(404).json({
      message: 'Certificate file is missing on the server. Ask Admin to click Issue Certificate again for this course.',
    })
    return
  }

  const courseName = String(certification.course_name || certification.title || 'Course').replace(/ Certificate$/i, '')
  const safeFileStem = courseName.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'course-certificate'
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Disposition', `inline; filename="${safeFileStem}-certificate.html"`)

  if (isMobileCertificateRequest(req)) {
    const html = await fs.readFile(filePath, 'utf8')
    res.send(injectMobileCertificateStyles(html))
    return
  }

  res.sendFile(filePath)
}))

// Park Guide self-service certificate request. Creates a course-level (module_id = NULL)
// `Pending` row in `certifications` that Admin can later approve and issue. The mobile
// UI already gates the request button on full course completion; we additionally guard
// against duplicate Pending/Issued rows so repeated clicks are idempotent.
app.post('/api/certifications/request', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  await ensureCertificationCourseColumn()

  const body = req.body || {}
  const courseId = String(body.course_id ?? body.courseId ?? '').trim()
  if (!courseId) {
    res.status(400).json({ message: 'A course_id is required to request a certificate.' })
    return
  }

  // Look up the course name (if the courses table exists) so the certificate has a
  // human-readable title. Falls back to the course id otherwise.
  let courseName = courseId
  if (await tableExists('courses')) {
    const course = await rowOf(
      'SELECT course_name FROM courses WHERE course_id = ? LIMIT 1',
      [courseId]
    )
    if (course?.course_name) courseName = course.course_name
  }

  const existing = await rowOf(
    `SELECT cert_id, status
     FROM certifications
     WHERE user_id = ? AND course_id = ? AND module_id IS NULL
     ORDER BY cert_id DESC
     LIMIT 1`,
    [userId, courseId]
  )

  if (existing) {
    const currentStatus = String(existing.status || '').toLowerCase()
    if (['issued', 'approved', 'pending'].includes(currentStatus)) {
      res.json({
        ok: true,
        message: currentStatus === 'pending'
          ? 'Certificate request is already pending Admin approval.'
          : 'Certificate has already been issued for this course.',
        certification: {
          cert_id: existing.cert_id,
          user_id: userId,
          course_id: courseId,
          status: existing.status,
        },
      })
      return
    }
  }

  const title = `${courseName} Certificate`
  const [result] = await pool.query(
    `INSERT INTO certifications (user_id, course_id, module_id, title, status)
     VALUES (?, ?, NULL, ?, 'Pending')`,
    [userId, courseId, title]
  )

  // Best-effort: notify Admin via the in-app notifications table if it exists.
  try {
    if (await tableExists('notifications')) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, type, message)
         VALUES (?, 'Certificate request submitted', 'certificate', ?)`,
        [userId, `Your certificate request for "${courseName}" is pending Admin approval.`]
      )
    }
  } catch {
    // Notifications are non-critical; swallow errors so the request still succeeds.
  }

  res.status(201).json({
    ok: true,
    message: 'Certificate request submitted for Admin approval.',
    certification: {
      cert_id: result.insertId,
      user_id: userId,
      course_id: courseId,
      title,
      status: 'Pending',
    },
  })
}))

app.get('/api/notifications', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const notifications = await rowsOf(
    `SELECT notification_id, user_id, title, type, message, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  )
  res.json({ notifications })
}))

app.patch('/api/notifications/read-all', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
    [userId]
  )
  res.json({ ok: true, message: 'All notifications marked as read.' })
}))

app.patch('/api/notifications/:notificationId/read', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const notificationId = Number(req.params.notificationId)
  const read = req.body?.read ?? req.body?.is_read ?? true

  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    res.status(400).json({ message: 'A numeric notification ID is required.' })
    return
  }

  const [result] = await pool.query(
    'UPDATE notifications SET is_read = ? WHERE notification_id = ? AND user_id = ?',
    [Boolean(read), notificationId, userId]
  )

  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'Notification not found.' })
    return
  }

  res.json({ ok: true, message: 'Notification read state updated.' })
}))

app.delete('/api/notifications/:notificationId', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const notificationId = Number(req.params.notificationId)

  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    res.status(400).json({ message: 'A numeric notification ID is required.' })
    return
  }

  const [result] = await pool.query(
    'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?',
    [notificationId, userId]
  )

  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'Notification not found.' })
    return
  }

  res.json({ ok: true, message: 'Notification deleted.' })
}))

app.get('/api/schedule', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const schedule = await rowsOf(
    `SELECT schedule_id, user_id, module_id, title, date, location, type, status, created_at
     FROM schedule
     WHERE user_id = ?
     ORDER BY date ASC, created_at DESC`,
    [userId]
  )
  res.json({ schedule: schedule.map((item) => ({ ...item, date: formatDateOnly(item.date) })) })
}))

app.get('/api/course-files', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  await ensureCourseFilesTable()
  const userFiles = await rowsOf(
    `SELECT cf.*, tm.title AS module_title
     FROM course_files cf
     LEFT JOIN training_modules tm ON tm.module_id = cf.module_id
     WHERE cf.user_id = ?
     ORDER BY cf.uploaded_at DESC, cf.file_id DESC`,
    [userId]
  )

  const adminResources = await tableExists('course_resources')
    ? await rowsOf(
      `SELECT cr.*, c.course_name
       FROM course_resources cr
       LEFT JOIN courses c ON c.course_id = cr.course_id
       ORDER BY cr.uploaded_at DESC, cr.resource_id DESC`
    )
    : []

  res.json({
    files: [
      ...adminResources.map(normalizeCourseResource),
      ...userFiles.map(normalizeCourseFile),
    ],
  })
}))

app.post('/api/course-files', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const {
    fileName = 'course-file',
    mimeType = 'application/octet-stream',
    sizeBytes = 0,
    dataUrl,
    moduleId = null,
    module_id = null,
    course = null,
  } = req.body || {}
  const match = /^data:([^;,]+);base64,([a-zA-Z0-9+/=]+)$/.exec(dataUrl || '')

  if (!match) {
    res.status(400).json({ message: 'Send the uploaded file as a base64 dataUrl.' })
    return
  }

  await ensureCourseFilesTable()
  await fs.mkdir(courseFileUploadDir, { recursive: true })

  const originalName = safeFileName(fileName)
  const storedName = `user-${userId}-${Date.now()}-${originalName}`
  const filePath = path.join(courseFileUploadDir, storedName)
  const fileUrl = `/uploads/course-files/${storedName}`
  const buffer = Buffer.from(match[2], 'base64')
  const numericModuleId = Number(moduleId || module_id)
  const savedModuleId = Number.isInteger(numericModuleId) && numericModuleId > 0 ? numericModuleId : null

  await fs.writeFile(filePath, buffer)
  const [result] = await pool.query(
    `INSERT INTO course_files
       (user_id, module_id, course_key, original_name, stored_name, mime_type, size_bytes, file_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      savedModuleId,
      course || null,
      originalName,
      storedName,
      mimeType || match[1],
      Number(sizeBytes) || buffer.length,
      fileUrl,
    ]
  )

  const savedFile = await rowOf(
    `SELECT cf.*, tm.title AS module_title
     FROM course_files cf
     LEFT JOIN training_modules tm ON tm.module_id = cf.module_id
     WHERE cf.file_id = ?`,
    [result.insertId]
  )
  res.status(201).json({ file: normalizeCourseFile(savedFile) })
}))

app.post('/api/enrollments/requests', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const { courseId = null, course_id = null, moduleId = null, module_id = null } = req.body || {}
  let resolvedCourseId = courseId || course_id

  if (!resolvedCourseId && (moduleId || module_id) && await columnExists('training_modules', 'course_id')) {
    const module = await rowOf(
      'SELECT course_id FROM training_modules WHERE module_id = ? LIMIT 1',
      [Number(moduleId || module_id)]
    )
    resolvedCourseId = module?.course_id || null
  }

  if (!resolvedCourseId) {
    res.status(202).json({ ok: true, message: 'Module enrollment saved locally. No linked admin course was found.' })
    return
  }

  const courseResourcesReady = await tableExists('course_enrollments')
  if (!courseResourcesReady) {
    res.status(202).json({ ok: true, message: 'Module enrollment saved locally. Admin enrollment table has not been migrated yet.' })
    return
  }

  await ensureDemoUser(userId)

  await pool.query(
    `INSERT INTO course_enrollments (user_id, course_id, status)
     VALUES (?, ?, 'pending')
     ON DUPLICATE KEY UPDATE status = IF(status = 'rejected', 'pending', status), requested_at = CURRENT_TIMESTAMP`,
    [userId, resolvedCourseId]
  )

  const enrollment = await rowOf(
    'SELECT status FROM course_enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
    [userId, resolvedCourseId]
  )
  const enrollmentStatus = enrollment?.status || 'pending'

  res.status(enrollmentStatus === 'approved' ? 200 : 201).json({
    ok: true,
    message: enrollmentStatus === 'approved'
      ? 'Course enrollment is already approved.'
      : 'Course enrollment request sent to Admin.',
    courseId: resolvedCourseId,
    enrollment_status: enrollmentStatus,
  })
}))

app.delete('/api/course-files/:fileId', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const fileId = Number(req.params.fileId)

  if (!Number.isInteger(fileId)) {
    res.status(400).json({ message: 'A numeric file id is required.' })
    return
  }

  await ensureCourseFilesTable()
  const file = await rowOf('SELECT * FROM course_files WHERE file_id = ? AND user_id = ?', [fileId, userId])
  if (!file) {
    res.status(404).json({ message: 'File not found.' })
    return
  }

  await pool.query('DELETE FROM course_files WHERE file_id = ? AND user_id = ?', [fileId, userId])
  await fs.unlink(path.join(courseFileUploadDir, file.stored_name)).catch((error) => {
    if (error?.code !== 'ENOENT') throw error
  })
  res.json({ ok: true })
}))

app.post('/api/schedule', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const { moduleId = null, module_id = null, title, date, location = 'Self-paced', type = 'Reminder', status = 'Scheduled' } = req.body || {}

  if (!title || !date) {
    res.status(400).json({ message: 'Schedule title and date are required.' })
    return
  }

  const [result] = await pool.query(
    `INSERT INTO schedule (user_id, module_id, title, date, location, type, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, moduleId || module_id || null, title, date, location, type, status]
  )

  const scheduleItem = await rowOf('SELECT * FROM schedule WHERE schedule_id = ?', [result.insertId])
  res.status(201).json({ schedule: { ...scheduleItem, date: formatDateOnly(scheduleItem.date) } })
}))

app.patch('/api/schedule/:scheduleId', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const scheduleId = Number(req.params.scheduleId)
  const { title, date, location = 'Self-paced', type = 'Reminder', status = 'Scheduled' } = req.body || {}

  if (!Number.isInteger(scheduleId) || !title || !date) {
    res.status(400).json({ message: 'A numeric schedule id, title, and date are required.' })
    return
  }

  await pool.query(
    `UPDATE schedule
     SET title = ?, date = ?, location = ?, type = ?, status = ?
     WHERE schedule_id = ? AND user_id = ?`,
    [title, date, location, type, status, scheduleId, userId]
  )

  const scheduleItem = await rowOf('SELECT * FROM schedule WHERE schedule_id = ? AND user_id = ?', [scheduleId, userId])
  res.json({ schedule: scheduleItem ? { ...scheduleItem, date: formatDateOnly(scheduleItem.date) } : null })
}))

app.delete('/api/schedule/:scheduleId', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const scheduleId = Number(req.params.scheduleId)

  if (!Number.isInteger(scheduleId)) {
    res.status(400).json({ message: 'A numeric schedule id is required.' })
    return
  }

  await pool.query('DELETE FROM schedule WHERE schedule_id = ? AND user_id = ?', [scheduleId, userId])
  res.json({ ok: true })
}))

app.listen(port, host, () => {
  console.log(`User page API running at http://${host}:${port}`)
})
