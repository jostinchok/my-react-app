import { useMemo, useState } from 'react'
import './AuthPortal.css'

const toMessage = async (response, fallback) => {
  try {
    const payload = await response.json()
    return payload?.message || fallback
  } catch {
    return fallback
  }
}

function AuthPortal({ onAuthSuccess }) {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' })
  const [forgotForm, setForgotForm] = useState({
    email: '',
    token: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [tokenHint, setTokenHint] = useState('')

  const title = useMemo(() => {
    if (mode === 'register') return 'Create Admin Account'
    if (mode === 'forgot') return 'Forgot Admin Password'
    return 'Admin Login'
  }, [mode])

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setMessage('')
    setError('')
    setTokenHint('')
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!loginForm.email || !loginForm.password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
          role: 'admin',
        }),
      })

      if (!response.ok) {
        setError(await toMessage(response, 'Unable to login.'))
        return
      }

      const payload = await response.json()
      onAuthSuccess(payload.user)
    } catch {
      setError('Cannot connect to server. Please check backend service.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setError('Please complete all registration fields.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
          role: 'admin',
        }),
      })

      if (!response.ok) {
        setError(await toMessage(response, 'Unable to register account.'))
        return
      }

      setMessage('Admin registration successful. You can now login.')
      setLoginForm((prev) => ({ ...prev, email: registerForm.email }))
      setRegisterForm({ name: '', email: '', password: '' })
      setMode('login')
    } catch {
      setError('Cannot connect to server. Please check backend service.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!forgotForm.email) {
      setError('Please enter your email first.')
      return
    }

    setLoading(true)
    try {
      if (!tokenHint) {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotForm.email }),
        })

        if (!response.ok) {
          setError(await toMessage(response, 'Unable to process forgot password request.'))
          return
        }

        const payload = await response.json()
        setTokenHint(payload.resetToken || '')
        setMessage('Reset token generated. Use it below to set a new password.')
        return
      }

      if (!forgotForm.token || !forgotForm.newPassword || !forgotForm.confirmPassword) {
        setError('Please fill token, new password and confirm password.')
        return
      }

      if (forgotForm.newPassword !== forgotForm.confirmPassword) {
        setError('New password and confirm password do not match.')
        return
      }

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotForm.email,
          token: forgotForm.token,
          newPassword: forgotForm.newPassword,
        }),
      })

      if (!response.ok) {
        setError(await toMessage(response, 'Unable to reset password.'))
        return
      }

      setMessage('Password reset successful. Please login with your new password.')
      setForgotForm({ email: forgotForm.email, token: '', newPassword: '', confirmPassword: '' })
      setTokenHint('')
      setMode('login')
    } catch {
      setError('Cannot connect to server. Please check backend service.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>{title}</h1>

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <input
              type="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="auth-form">
            <input
              type="text"
              placeholder="Full name"
              value={registerForm.name}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              type="email"
              placeholder="Email"
              value={registerForm.email}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <input
              type="password"
              placeholder="Password"
              value={registerForm.password}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="auth-form">
            <input
              type="email"
              placeholder="Email"
              value={forgotForm.email}
              onChange={(event) => setForgotForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            {tokenHint ? (
              <>
                <input
                  type="text"
                  placeholder="Reset token"
                  value={forgotForm.token}
                  onChange={(event) => setForgotForm((prev) => ({ ...prev, token: event.target.value }))}
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={forgotForm.newPassword}
                  onChange={(event) => setForgotForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={forgotForm.confirmPassword}
                  onChange={(event) =>
                    setForgotForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                  }
                />
                <div className="auth-token">Demo token: {tokenHint}</div>
                <button type="submit" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </>
            ) : (
              <button type="submit" disabled={loading}>
                {loading ? 'Generating...' : 'Generate reset token'}
              </button>
            )}
          </form>
        )}

        <div className="auth-links">
          {mode !== 'login' && (
            <button type="button" onClick={() => switchMode('login')}>
              Login
            </button>
          )}
          {mode !== 'register' && (
            <button type="button" onClick={() => switchMode('register')}>
              Register
            </button>
          )}
          {mode !== 'forgot' && (
            <button type="button" onClick={() => switchMode('forgot')}>
              Forgot Password
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthPortal