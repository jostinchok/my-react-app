import React, { useState } from 'react';
import '../Login.css';

const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

const Register = ({ onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setMessage({ text: 'All fields are required.', type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }
    if (password.length < 8) {
      setMessage({ text: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage({ text: data.message || 'Registration failed. Please try again.', type: 'error' });
        return;
      }

      setMessage({ text: 'Account created successfully! You can now log in.', type: 'success' });
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setMessage({ text: 'Unable to connect to server. Please try again.', type: 'error' });
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
      <h1>Create Account</h1>
      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <div className="pw-field">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="button" className="pw-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
          <EyeIcon open={showPassword} />
        </button>
      </div>
      <div className="pw-field">
        <input
          type={showConfirm ? 'text' : 'password'}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />
        <button type="button" className="pw-toggle" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
          <EyeIcon open={showConfirm} />
        </button>
      </div>
      {message.text && (
        <p className={message.type === 'success' ? 'msg-success' : 'msg-error'}>
          {message.text}
        </p>
      )}
      <button onClick={handleRegister} disabled={isSubmitting}>
        {isSubmitting ? 'Creating Account...' : 'Register'}
      </button>
      <div className="login-links">
        <a
          href="#"
          onClick={e => { e.preventDefault(); onBack(); }}
        >
          ← Back to Login
        </a>
      </div>
    </div>
  );
};

export default Register;
