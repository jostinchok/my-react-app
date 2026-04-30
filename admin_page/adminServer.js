import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

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

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({
      status: 'ok',
      message: 'Admin backend connected to MySQL',
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
    })
  }
})

app.get('/api/courses', async (req, res) => {
  try {
    const [courses] = await pool.query(`
      SELECT 
        course_id,
        course_name,
        description,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        total_contact_hours,
        created_at
      FROM courses
      ORDER BY created_at DESC
    `)

    res.json({ courses })
  } catch (error) {
    res.status(500).json({
      message: 'Unable to load courses.',
      error: error.message,
    })
  }
})

app.post('/api/courses', async (req, res) => {
  try {
    const {
      course_id,
      course_name,
      description,
      start_date,
      end_date,
      total_contact_hours,
    } = req.body

    if (!course_id || !course_name || !start_date || !end_date || !total_contact_hours) {
      return res.status(400).json({
        message: 'Course ID, Course Name, Start Date, End Date and Total Contact Hours are required.',
      })
    }

    await pool.query(
      `INSERT INTO courses 
       (course_id, course_name, description, start_date, end_date, total_contact_hours)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        course_id,
        course_name,
        description || '',
        start_date,
        end_date,
        Number(total_contact_hours),
      ]
    )

    res.status(201).json({
      message: 'Course created successfully.',
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'This Course ID already exists.',
      })
    }

    res.status(500).json({
      message: 'Unable to create course.',
      error: error.message,
    })
  }
})

app.delete('/api/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params

    const [result] = await pool.query(
      'DELETE FROM courses WHERE course_id = ?',
      [courseId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Course not found.',
      })
    }

    res.json({
      message: 'Course deleted successfully.',
    })
  } catch (error) {
    res.status(500).json({
      message: 'Unable to delete course.',
      error: error.message,
    })
  }
})

const port = Number(process.env.PORT) || 4001

app.listen(port, () => {
  console.log(`Admin database server running on http://localhost:${port}`)
})