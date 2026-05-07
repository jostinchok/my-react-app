import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.resolve(appRoot, '.env') })

const app = express()
const port = Number(process.env.ADMIN_API_PORT || process.env.PORT) || 4002
const databaseName = process.env.DB_NAME || process.env.DB_DATABASE || 'park_guide_database'
const uploadRoot = path.join(__dirname, 'public', 'uploads')
const resourceUploadDir = path.join(uploadRoot, 'course-resources')
const moduleMediaDir = path.join(uploadRoot, 'module-media')
const blockedUploadExtensions = new Set(['.exe', '.bat', '.cmd', '.com', '.msi', '.ps1', '.sh'])

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')))

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: databaseName,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

const asyncRoute = (handler) => async (req, res) => {
  try {
    await handler(req, res)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Admin training API request failed. Check MySQL and database migrations.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
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
  const table = await rowOf(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
     LIMIT 1`,
    [databaseName, tableName]
  )
  return Boolean(table)
}

const formatDateOnly = (value) => {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

const dateToIso = (value) => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString()
}

const safeFileName = (value = 'resource') => {
  const parsed = path.parse(String(value))
  const name = parsed.name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'resource'
  const ext = parsed.ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 16)
  return `${name}${ext}`.slice(0, 220)
}

const formatBytes = (sizeBytes = 0) => {
  const size = Number(sizeBytes) || 0
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${size} B`
}

const parseDataUrl = (dataUrl) => {
  const match = /^data:([^;,]+);base64,([a-zA-Z0-9+/=]+)$/.exec(dataUrl || '')
  if (!match) return null
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}

const parseJsonArray = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return String(value)
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
}

const toJsonText = (value) => JSON.stringify(parseJsonArray(value))

const normalizeCourse = (course = {}) => ({
  ...course,
  start_date: formatDateOnly(course.start_date),
  end_date: formatDateOnly(course.end_date),
  module_count: Number(course.module_count || 0),
  resource_count: Number(course.resource_count || 0),
})

const normalizeModule = (module = {}) => ({
  ...module,
  objectives: parseJsonArray(module.objectives),
  sort_order: Number(module.sort_order || 0),
})

const normalizeResource = (resource = {}) => ({
  ...resource,
  id: resource.resource_id,
  name: resource.title || resource.file_name,
  size: formatBytes(resource.size_bytes),
  uploaded: formatDateOnly(resource.uploaded_at),
  download_url: `/api/courses/${encodeURIComponent(resource.course_id)}/resources/${resource.resource_id}/download`,
})

const percent = (value, total) => {
  const numerator = Number(value || 0)
  const denominator = Number(total || 0)
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0
}

const emptyAdminCanvasProgressSummary = (message = 'Canvas learning progress is unavailable.') => ({
  ok: true,
  persistence: 'unavailable',
  fallback: true,
  message,
  summary: {
    totalGuides: 0,
    total_guides: 0,
    totalAvailableItems: 0,
    total_available_items: 0,
    totalCompletedItems: 0,
    total_completed_items: 0,
    totalQuizAttempts: 0,
    total_quiz_attempts: 0,
    averageCompletionPercent: 0,
    average_completion_percent: 0,
  },
  guides: [],
  courses: [],
})

const ensureColumn = async (tableName, columnName, definition) => {
  const column = await rowOf(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [databaseName, tableName, columnName]
  )

  if (!column) {
    await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`)
  }
}

const ensureRole = async (roleName) => {
  await pool.query('INSERT IGNORE INTO roles (role_name) VALUES (?)', [roleName])
  const role = await rowOf('SELECT role_id FROM roles WHERE role_name = ? LIMIT 1', [roleName])
  return role?.role_id || null
}

const ensureAdminTrainingSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      role_id INT AUTO_INCREMENT PRIMARY KEY,
      role_name VARCHAR(50) NOT NULL UNIQUE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      role_id INT NULL,
      name VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      password_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(role_id)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guide_profiles (
      guide_id INT PRIMARY KEY,
      phone VARCHAR(20),
      organization VARCHAR(100),
      years_experience INT DEFAULT 0,
      address VARCHAR(255),
      avatar_url VARCHAR(255),
      status ENUM('active', 'inactive') DEFAULT 'active',
      FOREIGN KEY (guide_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS training_modules (
      module_id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      description TEXT,
      category VARCHAR(100),
      park VARCHAR(100),
      level VARCHAR(50),
      duration VARCHAR(50),
      format VARCHAR(50),
      image_url VARCHAR(255),
      accent_color VARCHAR(20),
      badge_name VARCHAR(100),
      objectives TEXT,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(user_id)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lessons (
      lesson_id INT AUTO_INCREMENT PRIMARY KEY,
      module_id INT,
      title VARCHAR(255),
      content TEXT,
      media_url VARCHAR(255),
      FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quizzes (
      quiz_id INT AUTO_INCREMENT PRIMARY KEY,
      module_id INT,
      title VARCHAR(255),
      FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      question_id INT AUTO_INCREMENT PRIMARY KEY,
      quiz_id INT,
      question_text TEXT,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`options\` (
      option_id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT,
      option_text TEXT,
      is_correct BOOLEAN,
      FOREIGN KEY (question_id) REFERENCES questions(question_id)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS progress (
      progress_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      module_id INT,
      completed_lessons TEXT,
      quiz_passed BOOLEAN DEFAULT FALSE,
      quiz_score INT DEFAULT 0,
      status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
      completion_date DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS certifications (
      cert_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      module_id INT,
      title VARCHAR(255),
      status VARCHAR(100) DEFAULT 'Pending',
      issue_date DATETIME,
      expiry_date DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      course_id VARCHAR(50) PRIMARY KEY,
      course_name VARCHAR(255) NOT NULL,
      description TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_contact_hours INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await ensureColumn('courses', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
  await ensureColumn('training_modules', 'course_id', 'course_id VARCHAR(50) NULL')
  await ensureColumn('training_modules', 'status', "status VARCHAR(50) DEFAULT 'Published'")
  await ensureColumn('training_modules', 'sort_order', 'sort_order INT DEFAULT 0')
  await ensureColumn('training_modules', 'criteria', 'criteria TEXT NULL')
  await ensureColumn('lessons', 'lesson_type', "lesson_type VARCHAR(50) DEFAULT 'Text'")
  await ensureColumn('lessons', 'sort_order', 'sort_order INT DEFAULT 0')
  await ensureColumn('quizzes', 'sort_order', 'sort_order INT DEFAULT 0')
  await ensureColumn('questions', 'sort_order', 'sort_order INT DEFAULT 0')
  await ensureColumn('options', 'sort_order', 'sort_order INT DEFAULT 0')
  await ensureColumn('progress', 'progress_percent', 'progress_percent INT DEFAULT 0')
  await ensureColumn('certifications', 'certificate_code', 'certificate_code VARCHAR(120) NULL')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS course_resources (
      resource_id INT AUTO_INCREMENT PRIMARY KEY,
      course_id VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      stored_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(120) DEFAULT 'application/octet-stream',
      size_bytes BIGINT UNSIGNED DEFAULT 0,
      file_url VARCHAR(512) NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
      INDEX idx_course_resources_course_uploaded (course_id, uploaded_at)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS course_enrollments (
      enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      course_id VARCHAR(50) NOT NULL,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      decided_at DATETIME NULL,
      decision_note TEXT NULL,
      UNIQUE KEY uniq_course_enrollment (user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_badges (
      badge_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100) DEFAULT 'General',
      require_quiz BOOLEAN DEFAULT TRUE,
      require_physical BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await fs.mkdir(resourceUploadDir, { recursive: true })
  await fs.mkdir(moduleMediaDir, { recursive: true })
}

const deleteModuleContent = async (moduleIds) => {
  if (!moduleIds.length) return
  await pool.query(
    `DELETE o FROM \`options\` o
     INNER JOIN questions q ON q.question_id = o.question_id
     INNER JOIN quizzes quiz ON quiz.quiz_id = q.quiz_id
     WHERE quiz.module_id IN (?)`,
    [moduleIds]
  )
  await pool.query(
    `DELETE q FROM questions q
     INNER JOIN quizzes quiz ON quiz.quiz_id = q.quiz_id
     WHERE quiz.module_id IN (?)`,
    [moduleIds]
  )
  await pool.query('DELETE FROM quizzes WHERE module_id IN (?)', [moduleIds])
  await pool.query('DELETE FROM lessons WHERE module_id IN (?)', [moduleIds])
  await pool.query('DELETE FROM progress WHERE module_id IN (?)', [moduleIds])
  await pool.query('DELETE FROM certifications WHERE module_id IN (?)', [moduleIds])
}

const loadModuleRows = async (courseId) => {
  const modules = await rowsOf(
    `SELECT
       module_id,
       course_id,
       title,
       description,
       category,
       park,
       level,
       duration,
       format,
       image_url,
       accent_color,
       badge_name,
       objectives,
       status,
       sort_order,
       created_at
     FROM training_modules
     WHERE course_id = ?
     ORDER BY sort_order ASC, created_at DESC, module_id DESC`,
    [courseId]
  )

  return modules.map(normalizeModule)
}

const loadResourceRows = async (courseId) => {
  const resources = await rowsOf(
    `SELECT resource_id, course_id, title, file_name, stored_name, mime_type, size_bytes, file_url, uploaded_at
     FROM course_resources
     WHERE course_id = ?
     ORDER BY uploaded_at DESC, resource_id DESC`,
    [courseId]
  )
  return resources.map(normalizeResource)
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({
    status: 'ok',
    message: 'Admin backend connected to MySQL',
    database: databaseName,
    features: ['courses', 'modules', 'course_resources', 'guide_management', 'badges', 'canvas_learning_progress_summary'],
  })
}))

app.get('/api/courses', asyncRoute(async (_req, res) => {
  const courses = await rowsOf(`
    SELECT
      c.course_id,
      c.course_name,
      c.description,
      DATE_FORMAT(c.start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(c.end_date, '%Y-%m-%d') AS end_date,
      c.total_contact_hours,
      c.created_at,
      COUNT(DISTINCT tm.module_id) AS module_count,
      COUNT(DISTINCT cr.resource_id) AS resource_count
    FROM courses c
    LEFT JOIN training_modules tm ON tm.course_id = c.course_id
    LEFT JOIN course_resources cr ON cr.course_id = c.course_id
    GROUP BY c.course_id, c.course_name, c.description, c.start_date, c.end_date, c.total_contact_hours, c.created_at
    ORDER BY c.created_at DESC, c.course_id ASC
  `)

  res.json({ courses: courses.map(normalizeCourse) })
}))

app.post('/api/courses', asyncRoute(async (req, res) => {
  const {
    course_id,
    course_name,
    description = '',
    start_date,
    end_date,
    total_contact_hours,
  } = req.body || {}

  if (!course_id || !course_name || !start_date || !end_date) {
    res.status(400).json({ message: 'Course ID, name, start date, and end date are required.' })
    return
  }

  await pool.query(
    `INSERT INTO courses
       (course_id, course_name, description, start_date, end_date, total_contact_hours)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [course_id, course_name, description, start_date, end_date, Number(total_contact_hours) || 0]
  )

  const course = await rowOf('SELECT * FROM courses WHERE course_id = ?', [course_id])
  res.status(201).json({ message: 'Course created successfully.', course: normalizeCourse(course) })
}))

app.put('/api/courses/:courseId', asyncRoute(async (req, res) => {
  const { courseId } = req.params
  const {
    course_name,
    description = '',
    start_date,
    end_date,
    total_contact_hours,
  } = req.body || {}

  if (!course_name || !start_date || !end_date) {
    res.status(400).json({ message: 'Course name, start date, and end date are required.' })
    return
  }

  await pool.query(
    `UPDATE courses
     SET course_name = ?, description = ?, start_date = ?, end_date = ?, total_contact_hours = ?
     WHERE course_id = ?`,
    [course_name, description, start_date, end_date, Number(total_contact_hours) || 0, courseId]
  )

  const course = await rowOf('SELECT * FROM courses WHERE course_id = ?', [courseId])
  if (!course) {
    res.status(404).json({ message: 'Course not found.' })
    return
  }

  res.json({ message: 'Course updated successfully.', course: normalizeCourse(course) })
}))

app.delete('/api/courses/:courseId', asyncRoute(async (req, res) => {
  const { courseId } = req.params
  const resources = await rowsOf('SELECT stored_name FROM course_resources WHERE course_id = ?', [courseId])
  const modules = await rowsOf('SELECT module_id FROM training_modules WHERE course_id = ?', [courseId])
  const moduleIds = modules.map((module) => module.module_id)

  await deleteModuleContent(moduleIds)
  if (moduleIds.length) {
    await pool.query('DELETE FROM training_modules WHERE module_id IN (?)', [moduleIds])
  }

  const [result] = await pool.query('DELETE FROM courses WHERE course_id = ?', [courseId])
  await Promise.all(
    resources.map((resource) =>
      fs.unlink(path.join(resourceUploadDir, resource.stored_name)).catch((error) => {
        if (error?.code !== 'ENOENT') throw error
      })
    )
  )

  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'Course not found.' })
    return
  }

  res.json({ message: 'Course deleted successfully.' })
}))

app.get('/api/courses/:courseId/modules', asyncRoute(async (req, res) => {
  const modules = await loadModuleRows(req.params.courseId)
  res.json({ modules })
}))

app.post('/api/courses/:courseId/modules', asyncRoute(async (req, res) => {
  const { courseId } = req.params
  const {
    title,
    description = '',
    category = 'Field Readiness',
    park = 'All Parks',
    level = 'Beginner',
    duration = '1 hour',
    format = 'Blended',
    image_url = '',
    accent_color = '#ff7a1a',
    badge_name = '',
    objectives = [],
    status = 'Published',
    sort_order = 0,
  } = req.body || {}

  if (!title) {
    res.status(400).json({ message: 'Module title is required.' })
    return
  }

  const course = await rowOf('SELECT course_id FROM courses WHERE course_id = ? LIMIT 1', [courseId])
  if (!course) {
    res.status(404).json({ message: 'Course not found.' })
    return
  }

  const [result] = await pool.query(
    `INSERT INTO training_modules
       (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      courseId,
      title,
      description,
      category,
      park,
      level,
      duration,
      format,
      image_url,
      accent_color,
      badge_name,
      toJsonText(objectives),
      status,
      Number(sort_order) || 0,
    ]
  )

  if (description) {
    await pool.query(
      `INSERT INTO lessons (module_id, title, content, lesson_type, sort_order)
       VALUES (?, ?, ?, 'Text', 1)`,
      [result.insertId, 'Overview', description]
    )
  }

  const module = await rowOf('SELECT * FROM training_modules WHERE module_id = ?', [result.insertId])
  res.status(201).json({ message: 'Module created successfully.', module: normalizeModule(module) })
}))

app.put('/api/modules/:moduleId', asyncRoute(async (req, res) => {
  const moduleId = Number(req.params.moduleId)
  const {
    title,
    description = '',
    category = 'Field Readiness',
    park = 'All Parks',
    level = 'Beginner',
    duration = '1 hour',
    format = 'Blended',
    image_url = '',
    accent_color = '#ff7a1a',
    badge_name = '',
    objectives = [],
    status = 'Published',
    sort_order = 0,
  } = req.body || {}

  if (!Number.isInteger(moduleId) || !title) {
    res.status(400).json({ message: 'A numeric module ID and title are required.' })
    return
  }

  await pool.query(
    `UPDATE training_modules
     SET title = ?, description = ?, category = ?, park = ?, level = ?, duration = ?, format = ?,
         image_url = ?, accent_color = ?, badge_name = ?, objectives = ?, status = ?, sort_order = ?
     WHERE module_id = ?`,
    [
      title,
      description,
      category,
      park,
      level,
      duration,
      format,
      image_url,
      accent_color,
      badge_name,
      toJsonText(objectives),
      status,
      Number(sort_order) || 0,
      moduleId,
    ]
  )

  const module = await rowOf('SELECT * FROM training_modules WHERE module_id = ?', [moduleId])
  if (!module) {
    res.status(404).json({ message: 'Module not found.' })
    return
  }

  res.json({ message: 'Module updated successfully.', module: normalizeModule(module) })
}))

app.delete('/api/modules/:moduleId', asyncRoute(async (req, res) => {
  const moduleId = Number(req.params.moduleId)
  if (!Number.isInteger(moduleId)) {
    res.status(400).json({ message: 'A numeric module ID is required.' })
    return
  }

  await deleteModuleContent([moduleId])
  const [result] = await pool.query('DELETE FROM training_modules WHERE module_id = ?', [moduleId])
  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'Module not found.' })
    return
  }
  res.json({ message: 'Module deleted successfully.' })
}))

app.post('/api/modules/:moduleId/media', asyncRoute(async (req, res) => {
  const moduleId = Number(req.params.moduleId)
  const { fileName = 'module-media', dataUrl, title = 'Module media', lessonType = 'Media' } = req.body || {}
  const parsed = parseDataUrl(dataUrl)

  if (!Number.isInteger(moduleId) || !parsed) {
    res.status(400).json({ message: 'A numeric module ID and base64 dataUrl are required.' })
    return
  }

  const module = await rowOf('SELECT module_id FROM training_modules WHERE module_id = ? LIMIT 1', [moduleId])
  if (!module) {
    res.status(404).json({ message: 'Module not found.' })
    return
  }

  const originalName = safeFileName(fileName)
  if (blockedUploadExtensions.has(path.extname(originalName).toLowerCase())) {
    res.status(400).json({ message: 'This file type is blocked for demo safety.' })
    return
  }

  const storedName = `module-${moduleId}-${Date.now()}-${originalName}`
  const filePath = path.join(moduleMediaDir, storedName)
  const mediaUrl = `/uploads/module-media/${storedName}`
  await fs.writeFile(filePath, parsed.buffer)
  const [result] = await pool.query(
    `INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
     VALUES (?, ?, ?, ?, ?, 99)`,
    [moduleId, title || originalName, originalName, mediaUrl, lessonType]
  )

  res.status(201).json({
    message: 'Module media uploaded successfully.',
    media: {
      lesson_id: result.insertId,
      file_name: originalName,
      mime_type: parsed.mimeType,
      media_url: mediaUrl,
    },
  })
}))


const ensureCanvasModuleItemsSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS course_module_items (
      item_id INT AUTO_INCREMENT PRIMARY KEY,
      module_id INT NOT NULL,
      course_id VARCHAR(64) NOT NULL,
      item_type ENUM('page','text','file','image','video','link','quiz','checklist') NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      content LONGTEXT NULL,
      external_url VARCHAR(1000) NULL,
      file_name VARCHAR(255) NULL,
      stored_name VARCHAR(255) NULL,
      mime_type VARCHAR(120) NULL,
      size_bytes BIGINT DEFAULT 0,
      file_url VARCHAR(1000) NULL,
      quiz_json JSON NULL,
      checklist_json JSON NULL,
      status ENUM('published','draft') DEFAULT 'published',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_module_items_module_sort (module_id, sort_order, item_id),
      INDEX idx_module_items_course (course_id),
      CONSTRAINT fk_course_module_items_module_id
        FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
        ON DELETE CASCADE
    )
  `)
}

const parseMaybeJson = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const normalizeModuleItem = (item = {}) => ({
  ...item,
  id: item.item_id,
  itemType: item.item_type,
  quiz: parseMaybeJson(item.quiz_json, null),
  checklist: parseMaybeJson(item.checklist_json, []),
  size: formatBytes(item.size_bytes),
  download_url: item.file_url ? `/api/module-items/${item.item_id}/download` : null,
})

const loadModuleItems = async (moduleId) => {
  await ensureCanvasModuleItemsSchema()
  const rows = await rowsOf(
    `SELECT *
     FROM course_module_items
     WHERE module_id = ?
     ORDER BY sort_order ASC, item_id ASC`,
    [moduleId]
  )
  return rows.map(normalizeModuleItem)
}

const loadCanvasCourse = async (courseId) => {
  await ensureCanvasModuleItemsSchema()
  const course = await rowOf(
    `SELECT
       c.course_id,
       c.course_name,
       c.description,
       DATE_FORMAT(c.start_date, '%Y-%m-%d') AS start_date,
       DATE_FORMAT(c.end_date, '%Y-%m-%d') AS end_date,
       c.total_contact_hours,
       c.created_at,
       COUNT(DISTINCT tm.module_id) AS module_count,
       COUNT(DISTINCT cr.resource_id) AS resource_count
     FROM courses c
     LEFT JOIN training_modules tm ON tm.course_id = c.course_id
     LEFT JOIN course_resources cr ON cr.course_id = c.course_id
     WHERE c.course_id = ?
     GROUP BY c.course_id, c.course_name, c.description, c.start_date, c.end_date, c.total_contact_hours, c.created_at
     LIMIT 1`,
    [courseId]
  )

  if (!course) return null

  const modules = await loadModuleRows(courseId)
  const modulesWithItems = await Promise.all(
    modules.map(async (module) => ({
      ...module,
      items: await loadModuleItems(module.module_id),
    }))
  )
  const resources = await loadResourceRows(courseId)

  return {
    ...normalizeCourse(course),
    modules: modulesWithItems,
    resources,
  }
}

app.get('/api/courses/:courseId/canvas', asyncRoute(async (req, res) => {
  const canvasCourse = await loadCanvasCourse(req.params.courseId)
  if (!canvasCourse) {
    res.status(404).json({ message: 'Course not found.' })
    return
  }
  res.json({ course: canvasCourse })
}))

app.get('/api/modules/:moduleId/items', asyncRoute(async (req, res) => {
  const moduleId = Number(req.params.moduleId)
  if (!Number.isInteger(moduleId)) {
    res.status(400).json({ message: 'A numeric module ID is required.' })
    return
  }
  res.json({ items: await loadModuleItems(moduleId) })
}))

app.post('/api/modules/:moduleId/items', asyncRoute(async (req, res) => {
  await ensureCanvasModuleItemsSchema()

  const moduleId = Number(req.params.moduleId)
  const {
    item_type,
    itemType,
    title,
    description = '',
    content = '',
    external_url = '',
    externalUrl = '',
    quiz_json = null,
    quiz = null,
    checklist_json = null,
    checklist = null,
    status = 'published',
    sort_order = 0,
    fileName = '',
    dataUrl = '',
  } = req.body || {}

  const type = item_type || itemType

  if (!Number.isInteger(moduleId) || !type || !title) {
    res.status(400).json({ message: 'Module ID, item type, and title are required.' })
    return
  }

  const module = await rowOf(
    'SELECT module_id, course_id FROM training_modules WHERE module_id = ? LIMIT 1',
    [moduleId]
  )

  if (!module) {
    res.status(404).json({ message: 'Module not found.' })
    return
  }

  let originalName = null
  let storedName = null
  let mimeType = null
  let sizeBytes = 0
  let fileUrl = null

  if (dataUrl) {
    const parsed = parseDataUrl(dataUrl)
    if (!parsed) {
      res.status(400).json({ message: 'Invalid upload dataUrl.' })
      return
    }

    originalName = safeFileName(fileName || `${type}-item`)
    if (blockedUploadExtensions.has(path.extname(originalName).toLowerCase())) {
      res.status(400).json({ message: 'This file type is blocked for demo safety.' })
      return
    }

    storedName = `module-item-${moduleId}-${Date.now()}-${originalName}`
    fileUrl = `/uploads/module-media/${storedName}`
    mimeType = parsed.mimeType
    sizeBytes = parsed.buffer.length

    await fs.mkdir(moduleMediaDir, { recursive: true })
    await fs.writeFile(path.join(moduleMediaDir, storedName), parsed.buffer)
  }

  const [result] = await pool.query(
    `INSERT INTO course_module_items
       (module_id, course_id, item_type, title, description, content, external_url,
        file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      moduleId,
      module.course_id,
      type,
      title,
      description,
      content,
      external_url || externalUrl,
      originalName,
      storedName,
      mimeType,
      sizeBytes,
      fileUrl,
      quiz_json || (quiz ? JSON.stringify(quiz) : null),
      checklist_json || (checklist ? JSON.stringify(checklist) : null),
      status === 'draft' ? 'draft' : 'published',
      Number(sort_order) || 0,
    ]
  )

  const item = await rowOf('SELECT * FROM course_module_items WHERE item_id = ?', [result.insertId])
  res.status(201).json({ message: 'Module item created successfully.', item: normalizeModuleItem(item) })
}))

app.put('/api/modules/:moduleId/items/:itemId', asyncRoute(async (req, res) => {
  await ensureCanvasModuleItemsSchema()

  const moduleId = Number(req.params.moduleId)
  const itemId = Number(req.params.itemId)
  const existing = await rowOf(
    'SELECT * FROM course_module_items WHERE module_id = ? AND item_id = ? LIMIT 1',
    [moduleId, itemId]
  )

  if (!existing) {
    res.status(404).json({ message: 'Module item not found.' })
    return
  }

  const {
    item_type,
    itemType,
    title,
    description = '',
    content = '',
    external_url = '',
    externalUrl = '',
    quiz_json = null,
    quiz = null,
    checklist_json = null,
    checklist = null,
    status = 'published',
    sort_order = 0,
    fileName = '',
    dataUrl = '',
  } = req.body || {}

  const type = item_type || itemType || existing.item_type

  let originalName = existing.file_name
  let storedName = existing.stored_name
  let mimeType = existing.mime_type
  let sizeBytes = existing.size_bytes
  let fileUrl = existing.file_url

  if (dataUrl) {
    const parsed = parseDataUrl(dataUrl)
    if (!parsed) {
      res.status(400).json({ message: 'Invalid upload dataUrl.' })
      return
    }

    if (storedName) {
      await fs.unlink(path.join(moduleMediaDir, storedName)).catch((error) => {
        if (error?.code !== 'ENOENT') throw error
      })
    }

    originalName = safeFileName(fileName || `${type}-item`)
    if (blockedUploadExtensions.has(path.extname(originalName).toLowerCase())) {
      res.status(400).json({ message: 'This file type is blocked for demo safety.' })
      return
    }

    storedName = `module-item-${moduleId}-${Date.now()}-${originalName}`
    fileUrl = `/uploads/module-media/${storedName}`
    mimeType = parsed.mimeType
    sizeBytes = parsed.buffer.length

    await fs.mkdir(moduleMediaDir, { recursive: true })
    await fs.writeFile(path.join(moduleMediaDir, storedName), parsed.buffer)
  }

  await pool.query(
    `UPDATE course_module_items
     SET item_type = ?, title = ?, description = ?, content = ?, external_url = ?,
         file_name = ?, stored_name = ?, mime_type = ?, size_bytes = ?, file_url = ?,
         quiz_json = ?, checklist_json = ?, status = ?, sort_order = ?
     WHERE module_id = ? AND item_id = ?`,
    [
      type,
      title || existing.title,
      description,
      content,
      external_url || externalUrl,
      originalName,
      storedName,
      mimeType,
      sizeBytes,
      fileUrl,
      quiz_json || (quiz ? JSON.stringify(quiz) : null),
      checklist_json || (checklist ? JSON.stringify(checklist) : null),
      status === 'draft' ? 'draft' : 'published',
      Number(sort_order) || 0,
      moduleId,
      itemId,
    ]
  )

  const item = await rowOf('SELECT * FROM course_module_items WHERE item_id = ?', [itemId])
  res.json({ message: 'Module item updated successfully.', item: normalizeModuleItem(item) })
}))

app.delete('/api/modules/:moduleId/items/:itemId', asyncRoute(async (req, res) => {
  await ensureCanvasModuleItemsSchema()

  const moduleId = Number(req.params.moduleId)
  const itemId = Number(req.params.itemId)

  const existing = await rowOf(
    'SELECT * FROM course_module_items WHERE module_id = ? AND item_id = ? LIMIT 1',
    [moduleId, itemId]
  )

  if (!existing) {
    res.status(404).json({ message: 'Module item not found.' })
    return
  }

  await pool.query('DELETE FROM course_module_items WHERE item_id = ?', [itemId])

  if (existing.stored_name) {
    await fs.unlink(path.join(moduleMediaDir, existing.stored_name)).catch((error) => {
      if (error?.code !== 'ENOENT') throw error
    })
  }

  res.json({ message: 'Module item deleted successfully.' })
}))

app.get('/api/module-items/:itemId/download', asyncRoute(async (req, res) => {
  await ensureCanvasModuleItemsSchema()

  const itemId = Number(req.params.itemId)
  const item = await rowOf('SELECT * FROM course_module_items WHERE item_id = ? LIMIT 1', [itemId])

  if (!item || !item.stored_name) {
    res.status(404).json({ message: 'Module item file not found.' })
    return
  }

  res.download(path.join(moduleMediaDir, item.stored_name), item.file_name || item.stored_name)
}))

app.post('/api/demo/canvas-seed', asyncRoute(async (_req, res) => {
  await ensureCanvasModuleItemsSchema()
  const demoAssetBaseUrl = process.env.DEMO_TRAINING_ASSET_BASE_URL || 'http://localhost:5175/user/training'

  const demoCourses = [
    {
      id: 'SFC-FIELD-2026',
      name: 'SFC Field Response Essentials',
      description: 'Canvas-style training path for AI camera evidence, IoT proximity alerts, field notes, and Admin-ready recommendations.',
      start: '2026-05-01',
      end: '2026-06-15',
      hours: 12,
      modules: [
        {
          title: 'AI and IoT Incident Evidence Review',
          description: 'Review AI camera and IoT sensor evidence before writing a recommendation for Admin review.',
          category: 'Incident Evidence',
          park: 'Demo Camera Zone',
          level: 'Intermediate',
          duration: '1 hour',
          badge: 'AI Evidence Reviewer',
          objectives: [
            'Identify AI camera incident evidence',
            'Differentiate Plucking Plants, wildlife contact, and sensor proximity alerts',
            'Check timestamp, location, and metadata',
            'Avoid treating weak evidence as confirmed behavior too early'
          ],
          items: [
            { type: 'page', title: 'How AI camera evidence is reviewed', description: 'Step-by-step guide for reviewing camera evidence.', content: 'Start by checking the event type, timestamp, location, image clarity, and whether the image clearly shows prohibited visitor interaction. Do not mark a case as resolved from one weak image. Park Rangers should add field notes and recommendations only. Admin remains responsible for official status decisions.' },
            { type: 'text', title: 'Evidence triage note template', description: 'Short field-note pattern.', content: 'Observed behavior: what the evidence shows. Confidence: clear, partial, or unclear. Field action: what the ranger checked. Recommendation: the status outcome Admin should consider.' },
            { type: 'image', title: 'Example AI evidence frame', description: 'Evidence review image for discussion.', external_url: `${demoAssetBaseUrl}/incident-ai-monitoring.webp`, content: 'Use the frame to discuss event label, timestamp, location, and confidence before writing a field note.' },
            { type: 'video', title: 'Field evidence walkthrough', description: 'Short walkthrough reference.', external_url: 'https://sarawakforestry.com/', content: 'Open the linked reference during the demo or replace it with an uploaded MP4 from the Admin builder.' },
            { type: 'link', title: 'SFC field reporting reference', description: 'External guideline reference.', external_url: 'https://sarawakforestry.com/' },
            { type: 'file', title: 'Incident handover worksheet', description: 'Downloadable worksheet placeholder for field response handover.', external_url: `${demoAssetBaseUrl}/safety-response.webp`, content: 'Use this file item for incident handover evidence during the presentation.' },
            { type: 'checklist', title: 'Evidence quality checklist', description: 'Things to verify before recommending action.', checklist: ['Image is visible and not blurred', 'Event type matches the evidence', 'Location and timestamp are recorded', 'Sensor metadata is available for IoT alerts', 'Recommendation is written clearly for Admin review'] },
            { type: 'quiz', title: 'Is this incident ready for Admin review?', description: 'Quick scenario check.', quiz: { question: 'Who should officially change an incident status?', choices: ['Park Guide', 'Park Ranger', 'Admin', 'Visitor'], answer: 2 } }
          ]
        },
        {
          title: 'Park Ranger Recommendation Workflow',
          description: 'Explains how Rangers add field notes and recommendations without changing official incident status.',
          category: 'Ranger Workflow',
          park: 'Bako National Park',
          level: 'Intermediate',
          duration: '45 minutes',
          badge: 'Ranger Recommendation Ready',
          objectives: [
            'Understand Ranger recommendation-only boundaries',
            'Write useful field notes',
            'Recommend outcomes for Admin review'
          ],
          items: [
            { type: 'page', title: 'Ranger recommendation role boundary', description: 'Clear explanation of what Rangers can and cannot do.', content: 'Park Rangers may view incidents, inspect field evidence, add notes, and recommend outcomes. They should not directly change official incident status. This keeps accountability with Admin while still using Ranger field expertise.' },
            { type: 'text', title: 'Useful recommendation wording', description: 'Recommended field note phrasing.', content: 'Use neutral wording such as "Recommend In Review because the image is clear but field location needs confirmation." Avoid assigning intent to visitors.' },
            { type: 'checklist', title: 'Field note writing checklist', description: 'Checklist for useful Ranger notes.', checklist: ['Mention what was seen in the field', 'Mention whether evidence matches the location', 'Use neutral wording', 'Avoid guessing intent', 'Recommend next action clearly'] },
            { type: 'quiz', title: 'Official status vs recommendation', description: 'Role boundary quiz.', quiz: { question: 'A Ranger believes an incident is solved. What should they do?', choices: ['Change status to resolved', 'Delete the incident', 'Recommend resolved with field notes', 'Ignore the incident'], answer: 2 } }
          ]
        },
        {
          title: 'Visitor Interaction and Conservation Rules',
          description: 'Guides staff on explaining no-touch conservation rules to visitors.',
          category: 'Visitor Safety',
          park: 'All Parks',
          level: 'Beginner',
          duration: '40 minutes',
          badge: 'Visitor Guidance Basics',
          objectives: [
            'Explain conservation rules politely',
            'Reduce visitor contact with plants and wildlife',
            'Escalate repeat violations'
          ],
          items: [
            { type: 'page', title: 'Explaining rules to visitors', description: 'Simple script for visitor-facing communication.', content: 'Use friendly, direct language. Explain that protected plants and wildlife must not be touched, plucked, fed, or disturbed. Focus on safety, conservation, and visitor responsibility.' },
            { type: 'image', title: 'Visitor safety briefing card', description: 'Visual reminder for visitor briefing.', external_url: `${demoAssetBaseUrl}/visitor-safety.webp`, content: 'Use this image item to brief visitors before trail entry.' },
            { type: 'link', title: 'Bako National Park visitor guide', description: 'Visitor reference link.', external_url: 'https://sarawakforestry.com/parks/bako-national-park/' },
            { type: 'checklist', title: 'Visitor safety reminders', description: 'Before patrol checklist.', checklist: ['Brief visitors before trail entry', 'Remind them not to feed wildlife', 'Remind them not to pluck plants', 'Report suspicious behavior early'] }
          ]
        }
      ]
    },
    {
      id: 'SFC-WILDLIFE-2026',
      name: 'Sarawak Protected Wildlife Awareness',
      description: 'Training modules for recognizing wildlife interaction risk, enforcing no-touch policy, and escalating evidence.',
      start: '2026-05-01',
      end: '2026-06-30',
      hours: 10,
      modules: [
        {
          title: 'Wildlife Interaction Basics',
          description: 'Introduces common visitor-wildlife interaction risks in Sarawak protected parks.',
          category: 'Wildlife',
          park: 'All Parks',
          level: 'Beginner',
          duration: '1 hour',
          badge: 'Wildlife Awareness',
          objectives: ['Recognize unsafe wildlife interaction', 'Explain why feeding and touching wildlife is harmful', 'Record observation notes'],
          items: [
            { type: 'page', title: 'Why touching wildlife is dangerous', description: 'Basic conservation and safety explanation.', content: 'Touching wildlife can harm animals, create aggressive behavior, spread disease, and put visitors at risk. Staff should intervene early and record evidence when available.' },
            { type: 'text', title: 'Safe-distance briefing script', description: 'Plain-language visitor script.', content: 'Please keep a safe distance, do not feed wildlife, and let animals move away naturally. This protects visitors and the animals.' },
            { type: 'image', title: 'Protected wildlife awareness card', description: 'Training visual for no-contact wildlife rules.', external_url: `${demoAssetBaseUrl}/biodiversity-basics.webp`, content: 'Use this image to explain why protected wildlife should be observed from a distance.' },
            { type: 'video', title: 'Wildlife awareness reference', description: 'Reference video placeholder.', external_url: 'https://sarawakforestry.com/', content: 'Replace this with a local awareness video from Admin if available.' },
            { type: 'quiz', title: 'Wildlife safety check', description: 'Basic quiz.', quiz: { question: 'What should visitors do when they see wildlife?', choices: ['Feed it', 'Touch it gently', 'Observe from a safe distance', 'Chase it away'], answer: 2 } }
          ]
        },
        {
          title: 'No-touch Visitor Policy',
          description: 'Policy explanation for plants, wildlife, and protected natural resources.',
          category: 'Policy',
          park: 'All Parks',
          level: 'Beginner',
          duration: '35 minutes',
          badge: 'No-touch Policy Ready',
          objectives: ['Explain no-touch rules', 'Handle visitor questions', 'Escalate repeat issues'],
          items: [
            { type: 'page', title: 'No-touch policy explanation', description: 'Plain-language policy script.', content: 'Visitors should not touch, pick, pluck, feed, chase, or disturb plants and wildlife. Staff should explain the policy calmly and record incidents when evidence exists.' },
            { type: 'file', title: 'Policy reminder card', description: 'Downloadable reminder for guide briefing.', external_url: `${demoAssetBaseUrl}/rules-compliance.webp`, content: 'Use this as a file item for no-touch briefing evidence.' },
            { type: 'link', title: 'Sarawak Forestry policy reference', description: 'External policy reference.', external_url: 'https://sarawakforestry.com/' },
            { type: 'checklist', title: 'No-touch enforcement checklist', description: 'Quick enforcement steps.', checklist: ['Warn politely', 'Explain conservation reason', 'Record evidence if repeated', 'Escalate to Admin if needed'] }
          ]
        },
        {
          title: 'Evidence Escalation Guide',
          description: 'Shows when and how to escalate wildlife-related evidence to Admin.',
          category: 'Evidence',
          park: 'All Parks',
          level: 'Intermediate',
          duration: '45 minutes',
          badge: 'Evidence Escalation Ready',
          objectives: ['Judge evidence quality', 'Prepare escalation notes', 'Avoid false claims'],
          items: [
            { type: 'page', title: 'When to escalate', description: 'Escalation decision guide.', content: 'Escalate when evidence shows repeated contact, high-risk behavior, visitor refusal, wildlife distress, or unclear incidents needing Admin review.' },
            { type: 'text', title: 'Escalation summary format', description: 'Short structured summary.', content: 'Incident type, location, time, evidence quality, field note, recommended outcome, and any follow-up needed.' },
            { type: 'link', title: 'Sarawak Forestry Corporation', description: 'Official reference site.', external_url: 'https://sarawakforestry.com/' }
          ]
        }
      ]
    },
    {
      id: 'SFC-GUIDE-2026',
      name: 'SFC Park Guide Orientation',
      description: 'Orientation course for Park Guides using the digital portal, course resources, visitor briefings, and completion evidence.',
      start: '2026-05-01',
      end: '2026-07-15',
      hours: 8,
      modules: [
        {
          title: 'Digital Portal Orientation',
          description: 'Introduces the SFC Digital Portal, Canvas-style course shell, module items, progress, files, and certificates.',
          category: 'Orientation',
          park: 'All Parks',
          level: 'Beginner',
          duration: '40 minutes',
          badge: 'Portal Ready',
          objectives: [
            'Open assigned courses',
            'Use course-level navigation',
            'Complete module items',
            'Find files and completion evidence'
          ],
          items: [
            { type: 'page', title: 'Welcome to the SFC Digital Portal', description: 'Orientation page for new Park Guides.', content: 'The portal organizes training into courses. Each course contains an overview, modules, item detail, progress, files, and certificate state. Complete each item and quiz to build completion evidence for Admin.' },
            { type: 'text', title: 'Course shell quick reference', description: 'Short reference for course navigation.', content: 'Use Overview for course purpose, Modules for the learning sequence, Item Detail for the selected page or quiz, Progress for completion, Files for resources, and Completion for badge or certificate state.' },
            { type: 'image', title: 'Portal learning flow diagram', description: 'Visual guide for course navigation.', external_url: `${demoAssetBaseUrl}/ecotourism-briefing.webp`, content: 'Use this diagram as an orientation visual for the course shell.' },
            { type: 'video', title: 'Portal walkthrough reference', description: 'Short walkthrough placeholder.', external_url: 'https://sarawakforestry.com/', content: 'Replace with a recorded walkthrough during final polish if needed.' },
            { type: 'file', title: 'Guide onboarding checklist file', description: 'Orientation file item for onboarding.', external_url: `${demoAssetBaseUrl}/protected-areas.webp`, content: 'File item used for onboarding checklist evidence.' },
            { type: 'link', title: 'SFC official website', description: 'External organization reference.', external_url: 'https://sarawakforestry.com/' },
            { type: 'checklist', title: 'First login checklist', description: 'Steps for a new Park Guide.', checklist: ['Open the assigned course', 'Read the overview', 'Complete the first page item', 'Submit one quiz attempt', 'Review completion state'] },
            { type: 'quiz', title: 'Portal navigation check', description: 'Course shell quiz.', quiz: { question: 'Where should a Park Guide check certificate readiness?', choices: ['Files', 'Completion', 'Admin Detection', 'Park Ranger Console'], answer: 1 } }
          ]
        },
        {
          title: 'Visitor Briefing Standards',
          description: 'Covers practical visitor briefings, trail safety, and protected-area expectations.',
          category: 'Visitor Briefing',
          park: 'Kubah National Park',
          level: 'Beginner',
          duration: '45 minutes',
          badge: 'Visitor Briefing Ready',
          objectives: [
            'Prepare a clear visitor briefing',
            'Explain safety and conservation rules',
            'Use the correct escalation path'
          ],
          items: [
            { type: 'page', title: 'Trail briefing structure', description: 'Briefing sequence for guide teams.', content: 'Start with route expectations, safety reminders, no-contact conservation rules, weather awareness, and how visitors should ask for help.' },
            { type: 'image', title: 'Rainforest safety visual', description: 'Orientation image for safety briefing.', external_url: `${demoAssetBaseUrl}/kubah-rainforest-safety.webp`, content: 'Use this image item to support a clear safety briefing.' },
            { type: 'checklist', title: 'Before departure checklist', description: 'Quick checks before a guided route.', checklist: ['Confirm headcount', 'Confirm route and weather', 'Explain protected wildlife boundaries', 'Confirm emergency contact path'] },
            { type: 'quiz', title: 'Briefing readiness check', description: 'Visitor briefing scenario.', quiz: { question: 'What should be included before visitors enter a protected trail?', choices: ['Only the route name', 'Safety, conservation rules, and contact path', 'A souvenir list', 'No briefing is needed'], answer: 1 } }
          ]
        },
        {
          title: 'Completion Evidence and Certificates',
          description: 'Explains how item completion, quiz attempts, and Admin review connect to certificates.',
          category: 'Completion',
          park: 'All Parks',
          level: 'Beginner',
          duration: '30 minutes',
          badge: 'Certificate Ready',
          objectives: [
            'Complete all required items',
            'Submit quiz attempts',
            'Review certificate readiness'
          ],
          items: [
            { type: 'page', title: 'How completion evidence is built', description: 'Completion and certificate state explanation.', content: 'Each completed item and quiz attempt is saved through the User API when MySQL is running. Admin can review progress summaries and issue badges or certificates when the course requirements are complete.' },
            { type: 'text', title: 'Completion evidence summary', description: 'What Admin can review.', content: 'Admin sees available items, completed items, quiz attempts, latest score, and course-level progress. This demo keeps completion state separate from AI/IoT incident status.' },
            { type: 'file', title: 'Certificate readiness worksheet', description: 'Course completion file item.', external_url: `${demoAssetBaseUrl}/conservation-law.webp`, content: 'Use this file item as a certificate readiness worksheet during the demo.' },
            { type: 'link', title: 'Course completion support', description: 'External support reference.', external_url: 'https://sarawakforestry.com/' },
            { type: 'checklist', title: 'Certificate readiness checklist', description: 'Final course completion checks.', checklist: ['All module items completed', 'Quiz attempts submitted', 'Progress page reviewed', 'Completion page checked', 'Admin can issue badge if approved'] },
            { type: 'quiz', title: 'Completion state check', description: 'Final orientation quiz.', quiz: { question: 'What data should remain separate from training completion?', choices: ['Canvas item progress', 'Quiz attempts', 'AI and IoT incident status', 'Course certificates'], answer: 2 } }
          ]
        }
      ]
    }
  ]

  for (const course of demoCourses) {
    const existingModules = await rowsOf('SELECT module_id FROM training_modules WHERE course_id = ?', [course.id])
    const moduleIds = existingModules.map((module) => module.module_id)

    if (moduleIds.length) {
      await pool.query('DELETE FROM course_module_items WHERE module_id IN (?)', [moduleIds])
      await deleteModuleContent(moduleIds)
      await pool.query('DELETE FROM training_modules WHERE module_id IN (?)', [moduleIds])
    }

    await pool.query('DELETE FROM course_resources WHERE course_id = ?', [course.id])
    await pool.query('DELETE FROM course_enrollments WHERE course_id = ?', [course.id])
    await pool.query('DELETE FROM courses WHERE course_id = ?', [course.id])

    await pool.query(
      `INSERT INTO courses (course_id, course_name, description, start_date, end_date, total_contact_hours)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [course.id, course.name, course.description, course.start, course.end, course.hours]
    )

    for (const [moduleIndex, module] of course.modules.entries()) {
      const [moduleResult] = await pool.query(
        `INSERT INTO training_modules
           (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Blended', '', '#ff7a1a', ?, ?, 'Published', ?)`,
        [
          course.id,
          module.title,
          module.description,
          module.category,
          module.park,
          module.level,
          module.duration,
          module.badge,
          JSON.stringify(module.objectives),
          moduleIndex + 1,
        ]
      )

      const moduleId = moduleResult.insertId

      await pool.query(
        `INSERT INTO lessons (module_id, title, content, lesson_type, sort_order)
         VALUES (?, 'Overview', ?, 'Text', 1)`,
        [moduleId, module.description]
      )

      for (const [itemIndex, item] of module.items.entries()) {
        await pool.query(
          `INSERT INTO course_module_items
             (module_id, course_id, item_type, title, description, content, external_url, quiz_json, checklist_json, status, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
          [
            moduleId,
            course.id,
            item.type,
            item.title,
            item.description || '',
            item.content || '',
            item.external_url || '',
            item.quiz ? JSON.stringify(item.quiz) : null,
            item.checklist ? JSON.stringify(item.checklist) : null,
            itemIndex + 1,
          ]
        )
      }
    }
  }

  res.json({
    message: 'Canvas-style demo courses inserted into the training database.',
    courses: demoCourses.map((course) => ({
      id: course.id,
      name: course.name,
      modules: course.modules.length,
      items: course.modules.reduce((sum, module) => sum + module.items.length, 0),
    })),
  })
}))


app.get('/api/courses/:courseId/resources', asyncRoute(async (req, res) => {
  const resources = await loadResourceRows(req.params.courseId)
  res.json({ resources })
}))

app.post('/api/courses/:courseId/resources', asyncRoute(async (req, res) => {
  const { courseId } = req.params
  const { title, fileName = 'course-resource', dataUrl } = req.body || {}
  const parsed = parseDataUrl(dataUrl)

  if (!title || !parsed) {
    res.status(400).json({ message: 'Resource title and base64 dataUrl are required.' })
    return
  }

  const course = await rowOf('SELECT course_id FROM courses WHERE course_id = ? LIMIT 1', [courseId])
  if (!course) {
    res.status(404).json({ message: 'Course not found.' })
    return
  }

  const originalName = safeFileName(fileName)
  if (blockedUploadExtensions.has(path.extname(originalName).toLowerCase())) {
    res.status(400).json({ message: 'This file type is blocked for demo safety.' })
    return
  }

  const storedName = `${courseId}-${Date.now()}-${originalName}`
  const filePath = path.join(resourceUploadDir, storedName)
  const fileUrl = `/uploads/course-resources/${storedName}`
  await fs.writeFile(filePath, parsed.buffer)

  const [result] = await pool.query(
    `INSERT INTO course_resources
       (course_id, title, file_name, stored_name, mime_type, size_bytes, file_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [courseId, title, originalName, storedName, parsed.mimeType, parsed.buffer.length, fileUrl]
  )

  const resource = await rowOf('SELECT * FROM course_resources WHERE resource_id = ?', [result.insertId])
  res.status(201).json({ message: 'Resource uploaded successfully.', resource: normalizeResource(resource) })
}))

app.get('/api/courses/:courseId/resources/:resourceId/download', asyncRoute(async (req, res) => {
  const resource = await rowOf(
    'SELECT * FROM course_resources WHERE course_id = ? AND resource_id = ?',
    [req.params.courseId, Number(req.params.resourceId)]
  )
  if (!resource) {
    res.status(404).json({ message: 'Resource not found.' })
    return
  }

  res.download(path.join(resourceUploadDir, resource.stored_name), resource.file_name)
}))

app.delete('/api/courses/:courseId/resources/:resourceId', asyncRoute(async (req, res) => {
  const resource = await rowOf(
    'SELECT * FROM course_resources WHERE course_id = ? AND resource_id = ?',
    [req.params.courseId, Number(req.params.resourceId)]
  )
  if (!resource) {
    res.status(404).json({ message: 'Resource not found.' })
    return
  }

  await pool.query('DELETE FROM course_resources WHERE resource_id = ?', [resource.resource_id])
  await fs.unlink(path.join(resourceUploadDir, resource.stored_name)).catch((error) => {
    if (error?.code !== 'ENOENT') throw error
  })
  res.json({ message: 'Resource deleted successfully.' })
}))

app.get('/api/students', asyncRoute(async (_req, res) => {
  const students = await rowsOf(`
    SELECT
      u.user_id AS id,
      u.name,
      u.email,
      u.created_at,
      r.role_name,
      gp.phone,
      gp.organization AS module,
      gp.status,
      MAX(p.progress_percent) AS progressPercent,
      MAX(c.title) AS certificateTitle
    FROM users u
    LEFT JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN guide_profiles gp ON gp.guide_id = u.user_id
    LEFT JOIN progress p ON p.user_id = u.user_id
    LEFT JOIN certifications c ON c.user_id = u.user_id
    WHERE r.role_name IN ('guide', 'user') OR r.role_name IS NULL
    GROUP BY u.user_id, u.name, u.email, u.created_at, r.role_name, gp.phone, gp.organization, gp.status
    ORDER BY u.created_at DESC, u.user_id DESC
  `)

  res.json({
    students: students.map((student) => {
      const identityNumber = String(student.id).padStart(4, '0')
      return {
        ...student,
        guideId: `GUIDE-SFC-${identityNumber}`,
        trainingId: `TRN-SFC-${identityNumber}`,
        studentId: `TRN-SFC-${identityNumber}`,
        roleLabel: student.role_name === 'user' ? 'Park User' : 'Park Guide',
        eligibility: student.status === 'inactive' ? 'Rejected' : 'Approved',
        module: student.module || 'None',
        progressPercent: Number(student.progressPercent || 0),
        accountCreated: true,
      }
    }),
  })
}))

app.get('/api/admin/canvas-progress-summary', async (_req, res) => {
  try {
    const hasUsers = await tableExists('users')
    if (!hasUsers) {
      res.json(emptyAdminCanvasProgressSummary('Guide accounts table is not available yet.'))
      return
    }

    const [guideRows, hasCanvasItems, hasCanvasProgress, hasCanvasQuizAttempts] = await Promise.all([
      rowsOf(`
        SELECT
          u.user_id AS id,
          u.name,
          u.email,
          u.created_at,
          r.role_name,
          gp.organization AS assigned_course,
          gp.status
        FROM users u
        LEFT JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN guide_profiles gp ON gp.guide_id = u.user_id
        WHERE r.role_name IN ('guide', 'user') OR r.role_name IS NULL
        ORDER BY u.created_at DESC, u.user_id DESC
      `),
      tableExists('course_module_items'),
      tableExists('canvas_item_progress'),
      tableExists('canvas_quiz_attempts'),
    ])

    const guidesBase = guideRows.map((guide) => {
      const guideNumber = String(guide.id).padStart(4, '0')
      return {
        userId: guide.id,
        user_id: guide.id,
        guideId: guide.id,
        guide_id: guide.id,
        guideCode: `GUIDE-SFC-${guideNumber}`,
        guide_code: `GUIDE-SFC-${guideNumber}`,
        trainingId: `TRN-SFC-${guideNumber}`,
        training_id: `TRN-SFC-${guideNumber}`,
        name: guide.name || 'Unnamed guide',
        email: guide.email || '',
        roleLabel: guide.role_name === 'user' ? 'Park User' : 'Park Guide',
        role_label: guide.role_name === 'user' ? 'Park User' : 'Park Guide',
        assignedCourse: guide.assigned_course || 'None',
        assigned_course: guide.assigned_course || 'None',
        eligibility: guide.status === 'inactive' ? 'Rejected' : 'Approved',
      }
    })

    if (!hasCanvasItems) {
      const fallback = emptyAdminCanvasProgressSummary('Canvas module items table is not available yet.')
      res.json({
        ...fallback,
        summary: {
          ...fallback.summary,
          totalGuides: guidesBase.length,
          total_guides: guidesBase.length,
        },
        guides: guidesBase.map((guide) => ({
          ...guide,
          completedCanvasItems: 0,
          completed_canvas_items: 0,
          totalAvailableItems: 0,
          total_available_items: 0,
          completionPercent: 0,
          completion_percent: 0,
          quizAttempts: 0,
          quiz_attempts: 0,
          latestQuizScore: null,
          latest_quiz_score: null,
          latestQuizAt: null,
          latest_quiz_at: null,
          latestQuizLabel: 'No quiz attempts yet',
          latest_quiz_label: 'No quiz attempts yet',
          modules: [],
        })),
      })
      return
    }

    const moduleItemRows = await rowsOf(`
      SELECT
        cmi.course_id,
        COALESCE(c.course_name, cmi.course_id) AS course_name,
        cmi.module_id,
        COALESCE(tm.title, CONCAT('Module ', cmi.module_id)) AS module_title,
        COALESCE(tm.sort_order, 0) AS module_sort_order,
        COUNT(cmi.item_id) AS total_items
      FROM course_module_items cmi
      LEFT JOIN courses c ON c.course_id = cmi.course_id
      LEFT JOIN training_modules tm ON tm.module_id = cmi.module_id
      WHERE cmi.status = 'published'
      GROUP BY cmi.course_id, c.course_name, cmi.module_id, tm.title, tm.sort_order
      ORDER BY c.course_name ASC, module_sort_order ASC, tm.title ASC, cmi.module_id ASC
    `)

    const moduleTotals = new Map()
    const courseMap = new Map()

    for (const row of moduleItemRows) {
      const totalItems = Number(row.total_items || 0)
      const moduleKey = `${row.course_id}:${row.module_id}`
      moduleTotals.set(moduleKey, {
        courseId: row.course_id,
        courseName: row.course_name || row.course_id,
        moduleId: row.module_id,
        moduleTitle: row.module_title || `Module ${row.module_id}`,
        totalItems,
      })

      const course = courseMap.get(row.course_id) || {
        courseId: row.course_id,
        course_id: row.course_id,
        courseName: row.course_name || row.course_id,
        course_name: row.course_name || row.course_id,
        totalItems: 0,
        total_items: 0,
        modules: [],
      }
      course.totalItems += totalItems
      course.total_items = course.totalItems
      course.modules.push({
        moduleId: row.module_id,
        module_id: row.module_id,
        moduleTitle: row.module_title || `Module ${row.module_id}`,
        module_title: row.module_title || `Module ${row.module_id}`,
        totalItems,
        total_items: totalItems,
      })
      courseMap.set(row.course_id, course)
    }

    const totalAvailableItems = moduleItemRows.reduce((sum, row) => sum + Number(row.total_items || 0), 0)

    const [progressRows, quizRows] = await Promise.all([
      hasCanvasProgress
        ? rowsOf(`
          SELECT
            cip.user_id,
            cip.course_id,
            COALESCE(c.course_name, cip.course_id) AS course_name,
            cip.module_id,
            COALESCE(tm.title, CONCAT('Module ', cip.module_id)) AS module_title,
            COUNT(DISTINCT cip.item_id) AS completed_items,
            MAX(cip.updated_at) AS last_activity_at
          FROM canvas_item_progress cip
          INNER JOIN course_module_items cmi
            ON cmi.item_id = cip.item_id
           AND cmi.module_id = cip.module_id
           AND cmi.course_id = cip.course_id
          LEFT JOIN courses c ON c.course_id = cip.course_id
          LEFT JOIN training_modules tm ON tm.module_id = cip.module_id
          WHERE cip.status = 'completed'
            AND cmi.status = 'published'
          GROUP BY cip.user_id, cip.course_id, c.course_name, cip.module_id, tm.title
        `)
        : Promise.resolve([]),
      hasCanvasQuizAttempts
        ? rowsOf(`
          SELECT
            cqa.user_id,
            cqa.course_id,
            COALESCE(c.course_name, cqa.course_id) AS course_name,
            cqa.module_id,
            COALESCE(tm.title, CONCAT('Module ', cqa.module_id)) AS module_title,
            cqa.item_id,
            cmi.title AS item_title,
            cqa.score_percent,
            cqa.is_correct,
            cqa.attempted_at,
            cqa.attempt_id
          FROM canvas_quiz_attempts cqa
          LEFT JOIN course_module_items cmi ON cmi.item_id = cqa.item_id
          LEFT JOIN courses c ON c.course_id = cqa.course_id
          LEFT JOIN training_modules tm ON tm.module_id = cqa.module_id
          ORDER BY cqa.user_id ASC, cqa.attempted_at DESC, cqa.attempt_id DESC
        `)
        : Promise.resolve([]),
    ])

    const progressByUser = new Map()
    for (const row of progressRows) {
      const userId = Number(row.user_id)
      const current = progressByUser.get(userId) || {
        completedItems: 0,
        completed_items: 0,
        lastActivityAt: null,
        last_activity_at: null,
        modules: [],
      }
      const moduleKey = `${row.course_id}:${row.module_id}`
      const moduleTotal = moduleTotals.get(moduleKey)
      const completedItems = Number(row.completed_items || 0)
      current.completedItems += completedItems
      current.completed_items = current.completedItems
      const lastActivityAt = dateToIso(row.last_activity_at)
      if (lastActivityAt && (!current.lastActivityAt || lastActivityAt > current.lastActivityAt)) {
        current.lastActivityAt = lastActivityAt
        current.last_activity_at = lastActivityAt
      }
      current.modules.push({
        courseId: row.course_id,
        course_id: row.course_id,
        courseName: row.course_name || row.course_id,
        course_name: row.course_name || row.course_id,
        moduleId: row.module_id,
        module_id: row.module_id,
        moduleTitle: row.module_title || `Module ${row.module_id}`,
        module_title: row.module_title || `Module ${row.module_id}`,
        completedItems,
        completed_items: completedItems,
        totalItems: moduleTotal?.totalItems || 0,
        total_items: moduleTotal?.totalItems || 0,
        completionPercent: percent(completedItems, moduleTotal?.totalItems || 0),
        completion_percent: percent(completedItems, moduleTotal?.totalItems || 0),
        lastActivityAt,
        last_activity_at: lastActivityAt,
      })
      progressByUser.set(userId, current)
    }

    const quizByUser = new Map()
    for (const row of quizRows) {
      const userId = Number(row.user_id)
      const current = quizByUser.get(userId) || {
        quizAttempts: 0,
        quiz_attempts: 0,
        latestQuizScore: null,
        latest_quiz_score: null,
        latestQuizAt: null,
        latest_quiz_at: null,
        latestQuizLabel: 'No quiz attempts yet',
        latest_quiz_label: 'No quiz attempts yet',
        latestQuizPassed: null,
        latest_quiz_passed: null,
      }
      current.quizAttempts += 1
      current.quiz_attempts = current.quizAttempts
      if (!current.latestQuizAt) {
        const latestQuizAt = dateToIso(row.attempted_at)
        const labelParts = [row.course_name, row.module_title, row.item_title].filter(Boolean)
        current.latestQuizScore = Number(row.score_percent || 0)
        current.latest_quiz_score = current.latestQuizScore
        current.latestQuizAt = latestQuizAt
        current.latest_quiz_at = latestQuizAt
        current.latestQuizLabel = labelParts.length ? labelParts.join(' / ') : 'Canvas quiz'
        current.latest_quiz_label = current.latestQuizLabel
        current.latestQuizPassed = Boolean(row.is_correct)
        current.latest_quiz_passed = current.latestQuizPassed
      }
      quizByUser.set(userId, current)
    }

    const guides = guidesBase.map((guide) => {
      const progress = progressByUser.get(Number(guide.userId)) || {}
      const quiz = quizByUser.get(Number(guide.userId)) || {}
      const completedCanvasItems = Number(progress.completedItems || 0)
      const completionPercent = percent(completedCanvasItems, totalAvailableItems)

      return {
        ...guide,
        completedCanvasItems,
        completed_canvas_items: completedCanvasItems,
        totalAvailableItems,
        total_available_items: totalAvailableItems,
        completionPercent,
        completion_percent: completionPercent,
        quizAttempts: Number(quiz.quizAttempts || 0),
        quiz_attempts: Number(quiz.quizAttempts || 0),
        latestQuizScore: quiz.latestQuizScore ?? null,
        latest_quiz_score: quiz.latestQuizScore ?? null,
        latestQuizAt: quiz.latestQuizAt || null,
        latest_quiz_at: quiz.latestQuizAt || null,
        latestQuizLabel: quiz.latestQuizLabel || 'No quiz attempts yet',
        latest_quiz_label: quiz.latestQuizLabel || 'No quiz attempts yet',
        latestQuizPassed: quiz.latestQuizPassed ?? null,
        latest_quiz_passed: quiz.latestQuizPassed ?? null,
        lastActivityAt: progress.lastActivityAt || null,
        last_activity_at: progress.lastActivityAt || null,
        modules: (progress.modules || []).sort((a, b) => b.completionPercent - a.completionPercent),
      }
    })

    const totalCompletedItems = guides.reduce((sum, guide) => sum + guide.completedCanvasItems, 0)
    const totalQuizAttempts = guides.reduce((sum, guide) => sum + guide.quizAttempts, 0)
    const averageCompletionPercent = guides.length
      ? Math.round(guides.reduce((sum, guide) => sum + guide.completionPercent, 0) / guides.length)
      : 0

    const partial = !hasCanvasProgress || !hasCanvasQuizAttempts
    res.json({
      ok: true,
      persistence: partial ? 'partial' : 'mysql',
      fallback: partial,
      message: partial
        ? 'Canvas item or quiz progress tables are missing; Admin summary is showing available content with zeroed progress where needed.'
        : 'Admin Canvas learning progress summary loaded from MySQL.',
      summary: {
        totalGuides: guides.length,
        total_guides: guides.length,
        totalAvailableItems,
        total_available_items: totalAvailableItems,
        totalCompletedItems,
        total_completed_items: totalCompletedItems,
        totalQuizAttempts,
        total_quiz_attempts: totalQuizAttempts,
        averageCompletionPercent,
        average_completion_percent: averageCompletionPercent,
      },
      guides,
      courses: Array.from(courseMap.values()),
    })
  } catch (error) {
    console.warn('Admin Canvas progress summary fallback:', error)
    res.json(emptyAdminCanvasProgressSummary(`Canvas progress summary unavailable: ${error.message}`))
  }
})

app.post('/api/students', asyncRoute(async (req, res) => {
  const { name, email, phone = '', module = 'None' } = req.body || {}
  if (!name || !email) {
    res.status(400).json({ message: 'Name and email are required.' })
    return
  }

  const roleId = await ensureRole('guide')
  const [result] = await pool.query(
    'INSERT INTO users (role_id, name, email, password_hash) VALUES (?, ?, ?, ?)',
    [roleId, name, email, 'demo-account-pending']
  )
  await pool.query(
    `INSERT INTO guide_profiles (guide_id, phone, organization, status)
     VALUES (?, ?, ?, 'active')`,
    [result.insertId, phone, module]
  )

  const student = await rowOf('SELECT user_id AS id, name, email FROM users WHERE user_id = ?', [result.insertId])
  res.status(201).json({ message: 'Guide account created successfully.', student })
}))

app.put('/api/students/:studentId', asyncRoute(async (req, res) => {
  const studentId = Number(req.params.studentId)
  const { name, email, phone = '', module = 'None', eligibility = 'Approved' } = req.body || {}
  if (!Number.isInteger(studentId) || !name || !email) {
    res.status(400).json({ message: 'A numeric student ID, name, and email are required.' })
    return
  }

  await pool.query('UPDATE users SET name = ?, email = ? WHERE user_id = ?', [name, email, studentId])
  await pool.query(
    `INSERT INTO guide_profiles (guide_id, phone, organization, status)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE phone = VALUES(phone), organization = VALUES(organization), status = VALUES(status)`,
    [studentId, phone, module, eligibility === 'Rejected' ? 'inactive' : 'active']
  )

  res.json({ message: 'Guide account updated successfully.' })
}))

app.delete('/api/students/:studentId', asyncRoute(async (req, res) => {
  const studentId = Number(req.params.studentId)
  if (!Number.isInteger(studentId)) {
    res.status(400).json({ message: 'A numeric student ID is required.' })
    return
  }
  const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [studentId])
  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'Guide account not found.' })
    return
  }
  res.json({ message: 'Guide account deleted successfully.' })
}))

app.post('/api/students/:studentId/module', asyncRoute(async (req, res) => {
  const studentId = Number(req.params.studentId)
  const { module = 'None', courseId = null } = req.body || {}
  if (!Number.isInteger(studentId)) {
    res.status(400).json({ message: 'A numeric student ID is required.' })
    return
  }

  await pool.query(
    `INSERT INTO guide_profiles (guide_id, organization, status)
     VALUES (?, ?, 'active')
     ON DUPLICATE KEY UPDATE organization = VALUES(organization), status = 'active'`,
    [studentId, module]
  )

  if (courseId) {
    await pool.query(
      `INSERT INTO course_enrollments (user_id, course_id, status, decided_at)
       VALUES (?, ?, 'approved', NOW())
       ON DUPLICATE KEY UPDATE status = 'approved', decided_at = NOW()`,
      [studentId, courseId]
    )
  }

  res.json({ message: 'Guide module assignment updated successfully.' })
}))

app.get('/api/enrollments/requests', asyncRoute(async (_req, res) => {
  const requests = await rowsOf(`
    SELECT
      ce.enrollment_id AS id,
      ce.status,
      ce.requested_at,
      ce.decided_at,
      u.user_id,
      u.name AS student_name,
      u.email,
      c.course_id,
      c.course_name
    FROM course_enrollments ce
    INNER JOIN users u ON u.user_id = ce.user_id
    INNER JOIN courses c ON c.course_id = ce.course_id
    ORDER BY ce.requested_at DESC, ce.enrollment_id DESC
  `)
  res.json({ requests })
}))

app.patch('/api/enrollments/:enrollmentId', asyncRoute(async (req, res) => {
  const enrollmentId = Number(req.params.enrollmentId)
  const { status, note = '' } = req.body || {}
  if (!Number.isInteger(enrollmentId) || !['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ message: 'A numeric enrollment ID and valid status are required.' })
    return
  }

  await pool.query(
    `UPDATE course_enrollments
     SET status = ?, decision_note = ?, decided_at = NOW()
     WHERE enrollment_id = ?`,
    [status, note, enrollmentId]
  )
  res.json({ message: 'Enrollment request updated successfully.' })
}))

app.get('/api/admin/badges', asyncRoute(async (_req, res) => {
  const badges = await rowsOf(`
    SELECT badge_id AS id, name, type, require_quiz AS requireQuiz, require_physical AS requirePhysical, created_at
    FROM admin_badges
    ORDER BY created_at DESC, badge_id DESC
  `)

  const derived = await rowsOf(`
    SELECT
      module_id AS id,
      COALESCE(NULLIF(badge_name, ''), title) AS name,
      COALESCE(category, 'Training') AS type,
      TRUE AS requireQuiz,
      FALSE AS requirePhysical,
      created_at
    FROM training_modules
    WHERE badge_name IS NOT NULL AND badge_name <> ''
    ORDER BY created_at DESC, module_id DESC
  `)

  res.json({
    badges: [
      ...badges.map((badge) => ({ ...badge, eligibleStudents: [] })),
      ...derived.map((badge) => ({ ...badge, source: 'module', eligibleStudents: [] })),
    ],
  })
}))

app.post('/api/admin/badges', asyncRoute(async (req, res) => {
  const { name, type = 'General', requireQuiz = true, requirePhysical = false } = req.body || {}
  if (!name) {
    res.status(400).json({ message: 'Badge name is required.' })
    return
  }

  const [result] = await pool.query(
    'INSERT INTO admin_badges (name, type, require_quiz, require_physical) VALUES (?, ?, ?, ?)',
    [name, type, Boolean(requireQuiz), Boolean(requirePhysical)]
  )
  const badge = await rowOf('SELECT badge_id AS id, name, type, require_quiz AS requireQuiz, require_physical AS requirePhysical FROM admin_badges WHERE badge_id = ?', [result.insertId])
  res.status(201).json({ message: 'Badge created successfully.', badge })
}))

app.delete('/api/admin/badges/:badgeId', asyncRoute(async (req, res) => {
  const badgeId = Number(req.params.badgeId)
  if (!Number.isInteger(badgeId)) {
    res.status(400).json({ message: 'A numeric badge ID is required.' })
    return
  }

  const [result] = await pool.query('DELETE FROM admin_badges WHERE badge_id = ?', [badgeId])
  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'Badge not found or is module-derived.' })
    return
  }
  res.json({ message: 'Badge deleted successfully.' })
}))

app.post('/api/admin/issue-badge', asyncRoute(async (req, res) => {
  const { userId, moduleId = null, title } = req.body || {}
  if (!userId || !title) {
    res.status(400).json({ message: 'User ID and badge title are required.' })
    return
  }

  const certificateCode = `SFC-${Date.now()}-${userId}`
  const [result] = await pool.query(
    `INSERT INTO certifications (user_id, module_id, title, status, issue_date, certificate_code)
     VALUES (?, ?, ?, 'Issued', NOW(), ?)`,
    [Number(userId), moduleId ? Number(moduleId) : null, title, certificateCode]
  )

  res.status(201).json({
    message: 'Badge certificate issued successfully.',
    certification: { cert_id: result.insertId, certificate_code: certificateCode },
  })
}))

ensureAdminTrainingSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`Admin database server running on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Unable to start admin database server:', error)
    process.exit(1)
  })
