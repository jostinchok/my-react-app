import React, { useState } from 'react';
import '../Login.css';

const Login = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState('guide');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

  const resetFields = () => {
    setPassword('');
    setNewPassword('');
    setOtp('');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'Invalid credentials. Try again.');
        return;
      }

      setMessage('Login successful.');
      if (typeof onLogin === 'function') {
        onLogin(data.user);
      }
    } catch (error) {
      setMessage(error.message || 'Unable to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setMessage('Please enter name, email, and password.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'Registration failed.');
        return;
      }

      setMessage(data.message || 'Registration successful. Please log in.');
      setMode('login');
      setPassword('');
    } catch (error) {
      setMessage(error.message || 'Unable to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!email) {
      setMessage('Please enter your email first.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'Unable to send OTP.');
        return;
      }

      setMode('reset');
      setMessage('A 6-digit OTP has been sent to your email. Enter it below with your new password.');
    } catch (error) {
      setMessage(error.message || 'Unable to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !otp || !newPassword) {
      setMessage('Please enter email, 6-digit OTP, and a new password.');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setMessage('OTP must be exactly 6 digits.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'Unable to reset password.');
        return;
      }

      setMessage(data.message || 'Password reset successful. Please log in.');
      setMode('login');
      resetFields();
    } catch (error) {
      setMessage(error.message || 'Unable to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <img
        src={`${import.meta.env.BASE_URL}OIP.jpg`}
        alt="Digital Park Guide Logo"
        className="logo"
      />
      <h1 style={{color: 'var(--primary-dark)', marginBottom: '25px', fontWeight: '800'}}>Digital Park {mode === 'login' ? 'Login' : mode === 'register' ? 'Register' : mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}</h1>
      {(mode === 'register') && (
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      {(mode === 'login' || mode === 'register') && (
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      )}

      {mode === 'reset' && (
        <>
          <input
            type="text"
            placeholder="6-digit OTP"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
        </>
      )}

      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="guide">Guide</option>
        <option value="admin">Admin</option>
      </select>

      {mode === 'login' && (
        <button onClick={handleLogin} disabled={isSubmitting} style={{background: 'linear-gradient(135deg, var(--primary-mid), var(--accent-green))'}}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      )}

      {mode === 'register' && (
        <button onClick={handleRegister} disabled={isSubmitting} style={{background: 'linear-gradient(135deg, var(--primary-mid), var(--accent-green))'}}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      )}

      {mode === 'forgot' && (
        <button onClick={handleRequestOtp} disabled={isSubmitting} style={{background: 'linear-gradient(135deg, var(--primary-mid), var(--accent-green))'}}>
          {isSubmitting ? 'Sending OTP...' : 'Send 6-digit OTP'}
        </button>
      )}

      {mode === 'reset' && (
        <button onClick={handleResetPassword} disabled={isSubmitting} style={{background: 'linear-gradient(135deg, var(--primary-mid), var(--accent-green))'}}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      )}

      {message && <p>{message}</p>}

      <div className="login-links">
        <a
          href="#"
          className="register"
          onClick={(event) => {
            event.preventDefault();
            resetFields();
            setMode(mode === 'register' ? 'login' : 'register');
            setMessage('');
          }}
        >
          {mode === 'register' ? 'Back to Login' : 'Register User'}
        </a>
        <a
          href="#"
          className="forgot"
          onClick={(event) => {
            event.preventDefault();
            resetFields();
            if (mode === 'forgot' || mode === 'reset') {
              setMode('login');
            } else {
              setMode('forgot');
            }
            setMessage('');
          }}
        >
          {mode === 'forgot' || mode === 'reset' ? 'Back to Login' : 'Forgot Password?'}
        </a>
      </div>
    </div>
  );
};

export default Login;