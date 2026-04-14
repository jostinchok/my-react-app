import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
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
    res.json({ status: 'ok' })
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed', error: error.message })
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
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
