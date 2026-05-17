import React, { useState } from 'react';
import '../Login.css';

const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

const ForgotPassword = ({ onBack }) => {
  const [step, setStep] = useState(1); // 1: enter email, 2: set new password
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [resetDone, setResetDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';



  const handleRequestReset = async () => {
    if (!email) {
      setMessage({ text: 'Email is required.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage({ text: data.message || 'Request failed. Please try again.', type: 'error' });
        return;
      }

      setMessage({
        text: 'If that email is registered, a 6-digit OTP has been sent. Please check your inbox (and spam folder).',
        type: 'success',
      });
      setStep(2);
    } catch {
      setMessage({ text: 'Unable to connect to server. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token || !newPassword || !confirmPassword) {
      setMessage({ text: 'All fields are required.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ text: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage({ text: data.message || 'Reset failed. The OTP may be incorrect or expired.', type: 'error' });
        return;
      }

      setMessage({ text: 'Password reset successful! You can now log in.', type: 'success' });
      setResetDone(true);
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
      <h1>{step === 1 ? 'Forgot Password' : 'Set New Password'}</h1>

      {step === 1 && (
        <>
          <p className="form-hint">
            Enter your registered email and we will send you a 6-digit OTP.
          </p>
          <label className="field-label">Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </>
      )}

      {step === 2 && !resetDone && (
        <>
          <p className="form-hint">
            Enter the 6-digit OTP from your email and choose a new password.
          </p>
          <label className="field-label">Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <label className="field-label">6-digit OTP</label>
          <input
            type="text"
            placeholder="6-digit OTP"
            maxLength={6}
            inputMode="numeric"
            value={token}
            onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <label className="field-label">New Password</label>
          <div className="pw-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password (min 8 characters)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <button type="button" className="pw-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <EyeIcon open={showPassword} />
            </button>
          </div>
          <label className="field-label">Confirm New Password</label>
          <div className="pw-field">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <button type="button" className="pw-toggle" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
              <EyeIcon open={showConfirm} />
            </button>
          </div>
        </>
      )}

      {message.text && (
        <p className={message.type === 'success' ? 'msg-success' : 'msg-error'}>
          {message.text}
        </p>
      )}

      {step === 1 && (
        <button onClick={handleRequestReset} disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send OTP'}
        </button>
      )}

      {step === 2 && !resetDone && (
        <button onClick={handleResetPassword} disabled={isSubmitting}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      )}

      {resetDone && (
        <button onClick={onBack}>Back to Login</button>
      )}

      {!resetDone && (
        <div className="login-links">
          <a href="#" onClick={e => { e.preventDefault(); onBack && onBack(); }}>
            ← Back to Login
          </a>
          {step === 2 && (
            <a href="#" onClick={e => { e.preventDefault(); setStep(1); setMessage({ text: '', type: '' }); }}>
              Resend OTP
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
