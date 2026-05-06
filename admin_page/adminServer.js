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

const formatDateOnly = (value) => {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
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
    features: ['courses', 'modules', 'course_resources', 'guide_management', 'badges'],
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
    students: students.map((student) => ({
      ...student,
      eligibility: student.status === 'inactive' ? 'Rejected' : 'Approved',
      module: student.module || 'None',
      progressPercent: Number(student.progressPercent || 0),
      accountCreated: true,
    })),
  })
}))

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
