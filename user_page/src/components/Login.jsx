import React, { useState } from 'react';
import '../Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('park_guide');

  const handleLogin = () => {
    if (!email || !password) {
      alert("Please enter both email and password!");
      return;
    }
    const demoUsers = {
      'guide@example.com': { password: '1234', role: 'park_guide', redirect: '/user', label: 'Park Guide' },
      'admin@example.com': { password: 'admin', role: 'admin', redirect: '/admin', label: 'Admin' },
      'ranger@example.com': { password: 'ranger', role: 'park_ranger', redirect: '/admin/ranger', label: 'Park Ranger' },
    };
    const demoUser = demoUsers[email.toLowerCase()];

    if (demoUser && password === demoUser.password && role === demoUser.role) {
      localStorage.setItem('sfc_demo_session', JSON.stringify({
        email,
        role,
        label: demoUser.label,
        loginAt: new Date().toISOString(),
      }));
      alert(`${demoUser.label} demo login successful!`);
      window.location.href = demoUser.redirect;
    } else {
      alert("Invalid credentials. Try again!");
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
        Demo authentication only. Use guide@example.com / 1234, admin@example.com / admin,
        or ranger@example.com / ranger.
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
        <option value="admin">Admin</option>
        <option value="park_ranger">Park Ranger</option>
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
