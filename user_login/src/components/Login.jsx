import React, { useState } from 'react';
import '../Login.css';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('guide');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

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
        src="/OIP.jpg"
        alt="Digital Park Guide Logo"
        className="logo"
      />
      <h1>Digital Park Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="guide">Guide</option>
        <option value="admin">Admin</option>
      </select>
      <button onClick={handleLogin} disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
      {message && <p>{message}</p>}
      <div className="login-links">
      <a href="/register" className="register">Register User</a>
      <a href="#" className="forgot">Forgot Password?</a>
      </div>
    </div>
  );
};

export default Login;