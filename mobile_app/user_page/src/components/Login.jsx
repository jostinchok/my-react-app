import React, { useState } from 'react';
import '../Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('guide');

  const handleLogin = () => {
    if (!email || !password) {
      alert("Please enter both email and password!");
      return;
    }
    if (email === "guide@example.com" && password === "1234" && role === "guide") {
      alert("Guide login successful!");
      onLogin();
    } else if (email === "admin@example.com" && password === "admin" && role === "admin") {
      alert("Admin login successful!");
      onLogin();
    } else {
      alert("Invalid credentials. Try again!");
    }
  };

  return (
    <div className="login-container">
      <img
        src="/OIP.jpg"
        alt="Digital Park Guide Logo"
        className="logo"
      />
      <h1 style={{color: 'var(--primary-dark)', marginBottom: '25px', fontWeight: '800'}}>Digital Park Login</h1>
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
        <option value="guide">Guide</option>
        <option value="admin">Admin</option>
      </select>
      <button onClick={handleLogin} style={{background: 'linear-gradient(135deg, var(--primary-mid), var(--accent-green))'}}>Login</button>
      <div className="login-links">
      <a href="/register" className="register">Register User</a>
      <a href="#" className="forgot">Forgot Password?</a>
      </div>
    </div>
  );
};

export default Login;