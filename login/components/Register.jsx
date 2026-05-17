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
  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [address, setAddress] = useState('');
  const [assignedPark, setAssignedPark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || !birthday || !phone || !address || !assignedPark) {
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
    if (yearsExperience !== '' && (isNaN(yearsExperience) || Number(yearsExperience) < 0)) {
      setMessage({ text: 'Years of experience must be a valid number.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, birthday, phone, yearsExperience: yearsExperience !== '' ? Number(yearsExperience) : 0, address, assignedPark }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage({ text: data.error ? `${data.message}: ${data.error}` : (data.message || 'Registration failed. Please try again.'), type: 'error' });
        return;
      }

      setMessage({ text: 'Account created successfully! Redirecting to login…', type: 'success' });
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setBirthday('');
      setPhone('');
      setYearsExperience('');
      setAddress('');
      setAssignedPark('');
      setTimeout(() => { onBack(); }, 1500);
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
      <h1>Create Account</h1>
      <label className="field-label">Full Name</label>
      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <label className="field-label">Email</label>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <label className="field-label">Phone Number</label>
      <input
        type="tel"
        placeholder="Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      />
      <label className="field-label">
        Birthday
      </label>
      <input
        type="date"
        placeholder="Birthday"
        value={birthday}
        onChange={e => setBirthday(e.target.value)}
        max={new Date().toISOString().split('T')[0]}
      />
      <label className="field-label">Years of Experience</label>
      <input
        type="number"
        placeholder="Years of Experience"
        value={yearsExperience}
        onChange={e => setYearsExperience(e.target.value)}
        min="0"
      />
      <label className="field-label">Address</label>
      <input
        type="text"
        placeholder="Address"
        value={address}
        onChange={e => setAddress(e.target.value)}
      />
      <label className="field-label">Assigned Park</label>
      <select
        value={assignedPark}
        onChange={e => setAssignedPark(e.target.value)}
      >
        <option value="" disabled>Select Assigned Park</option>
        <option>Bako National Park</option>
        <option>Kubah National Park</option>
        <option>Niah National Park</option>
        <option>Gunung Mulu National Park</option>
        <option>Semenggoh Nature Reserve</option>
      </select>
      <label className="field-label">Password</label>
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
      <label className="field-label">Confirm Password</label>
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
