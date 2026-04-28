import React, { useState } from 'react'

const AuthPanel = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [role, setRole] = useState('admin')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

  const clearSensitive = () => {
    setPassword('')
    setNewPassword('')
    setOtp('')
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('Please enter both email and password.')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin' }),
      })

      const data = await response.json()
      if (!response.ok) {
        setMessage(data.message || 'Invalid credentials.')
        return
      }

      if (data?.user?.role_name !== 'admin') {
        setMessage('Access denied. Admin role is required for this portal.')
        return
      }

      onAuthSuccess(data.user)
    } catch (error) {
      setMessage(error.message || 'Unable to connect to server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setMessage('Please enter name, email, and password.')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await response.json()
      if (!response.ok) {
        setMessage(data.message || 'Registration failed.')
        return
      }

      setMessage(data.message || 'Registration complete. Please log in.')
      setMode('login')
      setRole('admin')
      clearSensitive()
    } catch (error) {
      setMessage(error.message || 'Unable to connect to server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestOtp = async () => {
    if (!email) {
      setMessage('Please enter your email.')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) {
        setMessage(data.message || 'Unable to send OTP.')
        return
      }

      setMode('reset')
      setMessage('A 6-digit OTP has been sent to your email. Enter it below with your new password.')
    } catch (error) {
      setMessage(error.message || 'Unable to connect to server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email || !otp || !newPassword) {
      setMessage('Please enter email, 6-digit OTP, and a new password.')
      return
    }

    if (!/^\d{6}$/.test(otp)) {
      setMessage('OTP must be exactly 6 digits.')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      })

      const data = await response.json()
      if (!response.ok) {
        setMessage(data.message || 'Unable to reset password.')
        return
      }

      setMessage(data.message || 'Password reset successful. Please log in.')
      setMode('login')
      clearSensitive()
    } catch (error) {
      setMessage(error.message || 'Unable to connect to server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>
          {mode === 'login' ? 'Admin Login' : mode === 'register' ? 'Register Account' : mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}
        </h1>

        {message && <p className="auth-message">{message}</p>}

        <div className="auth-form">
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          {(mode === 'login' || mode === 'register') && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}

          {mode === 'register' && (
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="admin">Admin</option>
              <option value="guide">Guide</option>
            </select>
          )}

          {mode === 'reset' && (
            <>
              <input
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </>
          )}

          {mode === 'login' && (
            <button type="button" onClick={handleLogin} disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          )}

          {mode === 'register' && (
            <button type="button" onClick={handleRegister} disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          )}

          {mode === 'forgot' && (
            <button type="button" onClick={handleRequestOtp} disabled={isSubmitting}>
              {isSubmitting ? 'Sending OTP...' : 'Send 6-digit OTP'}
            </button>
          )}

          {mode === 'reset' && (
            <button type="button" onClick={handleResetPassword} disabled={isSubmitting}>
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          )}
        </div>

        <div className="auth-links">
          <button
            type="button"
            onClick={() => {
              clearSensitive()
              setMessage('')
              setMode(mode === 'register' ? 'login' : 'register')
            }}
          >
            {mode === 'register' ? 'Back to Login' : 'Register'}
          </button>
          <button
            type="button"
            onClick={() => {
              clearSensitive()
              setMessage('')
              if (mode === 'forgot' || mode === 'reset') {
                setMode('login')
              } else {
                setMode('forgot')
              }
            }}
          >
            {mode === 'forgot' || mode === 'reset' ? 'Back to Login' : 'Forgot Password'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthPanel
