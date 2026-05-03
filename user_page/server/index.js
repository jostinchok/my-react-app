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
dotenv.config({ path: path.resolve(appRoot, '..', 'user_login', 'server', '.env') })

const avatarUploadDir = path.join(appRoot, 'public', 'uploads', 'avatars')

const app = express()
const port = Number(process.env.API_PORT || 4001)
const host = process.env.API_HOST || '127.0.0.1'
const defaultUserEmail = process.env.DEFAULT_USER_EMAIL || 'guide@test.com'
const databaseName = process.env.DB_NAME || process.env.DB_DATABASE || 'park_guide_database'
const corsOrigin = !process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*'
  ? true
  : process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)

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

app.use(cors({ origin: corsOrigin }))
app.use(express.json({ limit: '8mb' }))
app.use('/uploads', express.static(path.join(appRoot, 'public', 'uploads')))

const asyncRoute = (handler) => async (req, res) => {
  try {
    await handler(req, res)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Database request failed. Check that XAMPP MySQL is running and user_login/server/db.sql has been imported.',
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

const resolveUserId = async (req) => {
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

  throw new Error(`No guide user found. Import user_login/server/db.sql or create ${defaultUserEmail}.`)
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

const buildModules = async (userId) => {
  const modules = await rowsOf(
    `SELECT
       tm.module_id,
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
       tm.created_at,
       p.completed_lessons,
       p.quiz_passed,
       p.quiz_score,
       p.status AS progress_status
     FROM training_modules tm
     LEFT JOIN progress p ON p.module_id = tm.module_id AND p.user_id = ?
     ORDER BY tm.created_at DESC, tm.module_id DESC`,
    [userId]
  )

  if (modules.length === 0) return []

  const moduleIds = modules.map((module) => module.module_id)
  const [lessons, quizRows] = await Promise.all([
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

  return modules.map((module) => {
    const moduleLessons = lessonsByModule.get(module.module_id) || []
    return {
      ...module,
      id: module.module_id,
      image: module.image_url,
      accent: module.accent_color,
      badge: module.badge_name,
      subtitle: module.description,
      objectives: parseObjectives(module.objectives),
      lessons: moduleLessons.map((lesson) => lesson.title || lesson.content),
      resources: moduleLessons
        .filter((lesson) => lesson.media_url)
        .map((lesson) => ({
          id: `lesson-${lesson.lesson_id}`,
          title: lesson.title || 'Lesson media',
          type: 'Media',
        })),
      quiz: quizByModule.get(module.module_id) || {
        question: 'Assessment question will appear here.',
        options: [],
        answer: 0,
      },
      completedLessons: parseCompletedLessons(module.completed_lessons),
      quizPassed: Boolean(module.quiz_passed),
      quizScore: module.quiz_score || 0,
    }
  })
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ ok: true, database: databaseName })
}))

app.get('/api/training-modules', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const modules = await buildModules(userId)
  res.json({ modules })
}))

app.get('/api/user-profile', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const profile = await rowOf(
    `SELECT
       u.user_id,
       u.name,
       u.email,
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

  if (!profile) {
    res.status(404).json({ message: 'User profile not found.' })
    return
  }

  res.json({
    profile: {
      ...profile,
      display_name: profile.name,
      real_name: profile.name,
      avatar_url: profile.avatar_url || '',
    },
  })
}))

app.patch('/api/user-profile', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const { field, value } = req.body || {}

  const userFieldMap = {
    displayName: 'name',
    email: 'email',
  }
  const profileFieldMap = {
    phone: 'phone',
    yearsExperience: 'years_experience',
    address: 'address',
  }

  if (userFieldMap[field]) {
    await pool.query(`UPDATE users SET ${userFieldMap[field]} = ? WHERE user_id = ?`, [value || null, userId])
  } else if (profileFieldMap[field]) {
    await pool.query(
      `INSERT INTO guide_profiles (guide_id, ${profileFieldMap[field]})
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE ${profileFieldMap[field]} = VALUES(${profileFieldMap[field]})`,
      [userId, value || null]
    )
  } else {
    res.status(400).json({ message: `Profile field "${field}" cannot be saved.` })
    return
  }

  res.json({ ok: true, field, value })
}))

app.post('/api/user-profile/avatar', asyncRoute(async (req, res) => {
  const userId = await resolveUserId(req)
  const { fileName = 'avatar.png', dataUrl } = req.body || {}
  const match = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([a-zA-Z0-9+/=]+)$/.exec(dataUrl || '')

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
  await fs.writeFile(avatarPath, Buffer.from(match[2], 'base64'))
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
  const certifications = await rowsOf(
    `SELECT
       c.cert_id,
       c.user_id,
       c.module_id,
       c.title,
       c.status,
       c.issue_date,
       c.expiry_date,
       tm.title AS module_title
     FROM certifications c
     LEFT JOIN training_modules tm ON tm.module_id = c.module_id
     WHERE c.user_id = ?
     ORDER BY c.issue_date DESC, c.cert_id DESC`,
    [userId]
  )
  res.json({ certifications })
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
