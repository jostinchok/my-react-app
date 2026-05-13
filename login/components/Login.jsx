import React, { useState } from 'react';
import '../Login.css';

const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

const ROLE_REDIRECTS = {
  guide: import.meta.env.VITE_USER_URL || 'http://localhost:5175/user',
  admin: import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174/admin',
  ranger: `${import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174/admin'}/ranger`,
};

const DEMO_ACCOUNTS = [
  { label: 'Admin Demo', email: 'admin@example.com', password: '1234', role: 'admin', roleLabel: 'Admin' },
  { label: 'User 1', email: 'user1@demo.local', password: '1234', role: 'guide', roleLabel: 'Park Guide' },
  { label: 'User 2', email: 'user2@demo.local', password: '1234', role: 'guide', roleLabel: 'Park Guide' },
  { label: 'User 3', email: 'user3@demo.local', password: '1234', role: 'guide', roleLabel: 'Park Guide' },
  { label: 'Ranger 1', email: 'ranger1@demo.local', password: '1234', role: 'ranger', roleLabel: 'Park Ranger' },
  { label: 'Ranger 2', email: 'ranger2@demo.local', password: '1234', role: 'ranger', roleLabel: 'Park Ranger' },
  { label: 'Ranger 3', email: 'ranger3@demo.local', password: '1234', role: 'ranger', roleLabel: 'Park Ranger' },
];

const Login = ({ onRegister, onForgot }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('guide');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

  const handleDemoAccountSelect = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setRole(account.role);
    setMessage({ text: `${account.label} selected. Press Login to continue.`, type: 'success' });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage({ text: 'Please enter both email and password.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage({ text: data.message || 'Invalid credentials. Try again.', type: 'error' });
        return;
      }

      const user = data.user;

      localStorage.setItem('sfc_token', data.token);

      localStorage.setItem('sfc_session', JSON.stringify({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role_name,
        token: data.token,
        loginAt: new Date().toISOString(),
      }));

      setMessage({ text: 'Login successful. Redirecting…', type: 'success' });
      const redirect = ROLE_REDIRECTS[user.role_name] || '/user';
      setTimeout(() => { window.location.href = redirect; }, 600);
    } catch {
      setMessage({ text: 'Unable to connect to server. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <img
        src={`${import.meta.env.BASE_URL}images/sfc-citrus-logo.webp`}
        alt="SFC Digital Guide logo"
        className="logo"
      />
      <h1>SFC Digital Park Portal Login</h1>
      <label className="field-label">Email</label>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
      />
      <label className="field-label">Password</label>
      <div className="pw-field">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <button type="button" className="pw-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
          <EyeIcon open={showPassword} />
        </button>
      </div>
      <label className="field-label">Login As</label>
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="guide">Park Guide</option>
        <option value="admin">Admin</option>
        <option value="ranger">Park Ranger</option>
      </select>
      <section className="demo-account-panel" aria-label="Demo accounts">
        <div className="demo-account-header">
          <span className="demo-account-title">Demo accounts</span>
          <span className="demo-account-password">Password: 1234</span>
        </div>
        <div className="demo-account-grid">
          {DEMO_ACCOUNTS.map((account) => {
            const active = email === account.email && role === account.role;
            return (
              <button
                type="button"
                className={`demo-account-button${active ? ' active' : ''}`}
                key={account.email}
                onClick={() => handleDemoAccountSelect(account)}
              >
                <span className="account-name">{account.label}</span>
                <span className="account-role">{account.roleLabel}</span>
              </button>
            );
          })}
        </div>
      </section>
      {message.text && (
        <p className={message.type === 'success' ? 'msg-success' : 'msg-error'}>
          {message.text}
        </p>
      )}
      <button onClick={handleLogin} disabled={isSubmitting}>
        {isSubmitting ? 'Logging in…' : 'Login'}
      </button>
      <div className="login-links">
      <a href="#" className="register" onClick={e => { e.preventDefault(); onRegister && onRegister(); }}>Register User</a>
      <a href="#" className="forgot" onClick={e => { e.preventDefault(); onForgot && onForgot(); }}>Forgot Password?</a>
      </div>
    </div>
  );
};

export default Login;
