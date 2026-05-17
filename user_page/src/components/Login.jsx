import React, { useState } from 'react';
import '../Login.css';

const AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:4000';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('park_guide');

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter both email and password!");
      return;
    }

    const roleMap = {
      park_guide: 'guide',
      admin: 'admin',
      park_ranger: 'park_ranger',
    };

    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: roleMap[role] }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || 'Invalid credentials.');
      }

      if (payload.user?.role_name !== 'guide') {
        alert('This page is for Park Guide users only.');
        return;
      }

      const session = {
        userId: payload.user.user_id,
        email: payload.user.email,
        name: payload.user.name,
        role: payload.user.role_name,
        loginAt: new Date().toISOString(),
      };
      localStorage.setItem('sfc_guide_session', JSON.stringify(session));
      onLogin?.(session);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="login-container">
      <img
        src="/user/sfc-citrus-logo.webp"
        alt="SFC Digital Guide logo"
        className="logo"
      />
      <h1 style={{color: 'var(--primary-dark)', marginBottom: '25px', fontWeight: '800'}}>Digital Park Login</h1>
      <p className="demo-auth-note">
        Use the database guide login, for example guide@test.com / 1234 after importing database/db.sql.
      </p>
      <input
        type="text"
        placeholder="Email / Username"
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
        <option value="park_guide">Park Guide</option>
      </select>
      <button onClick={handleLogin} style={{background: 'linear-gradient(135deg, var(--primary-mid), var(--accent-green))'}}>Login</button>
      <div className="login-links">
      <a href="#" className="register" onClick={(event) => { event.preventDefault(); alert('Demo registration is documented; production registration uses the backend /api/auth/register endpoint.'); }}>Register User</a>
      <a href="#" className="forgot" onClick={(event) => { event.preventDefault(); alert('Forgot password is demo/partial. Backend supports token generation if the MySQL auth schema is loaded.'); }}>Forgot Password?</a>
      </div>
    </div>
  );
};

export default Login;
