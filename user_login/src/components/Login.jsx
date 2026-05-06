import React, { useState } from 'react';
import '../Login.css';

const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

const Login = ({ onLoginSuccess, onRegister, onForgot }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('guide');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

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
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(data.user);
      }
    } catch (error) {
      setMessage(error.message || 'Unable to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <img
        src="/images/sfc-citrus-logo.webp"
        alt="SFC Digital Guide logo"
        className="logo"
      />
      <h1>SFC Digital Portal Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <div className="pw-field">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="button" className="pw-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
          <EyeIcon open={showPassword} />
        </button>
      </div>
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="guide">Park Guide</option>
        <option value="admin">Admin</option>
        <option value="ranger">Park Ranger</option>
      </select>
      <button onClick={handleLogin} disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
      {message && <p>{message}</p>}
      <div className="login-links">
      <a href="#" className="register" onClick={e => { e.preventDefault(); onRegister && onRegister(); }}>Register User</a>
      <a href="#" className="forgot" onClick={e => { e.preventDefault(); onForgot && onForgot(); }}>Forgot Password?</a>
      </div>
    </div>
  );
};

export default Login;
