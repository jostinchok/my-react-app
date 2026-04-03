import React, { useState } from 'react';
import '../Login.css';

const Login = () => {
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
    } else if (email === "admin@example.com" && password === "admin" && role === "admin") {
      alert("Admin login successful!");
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
      <h1>Digital Park Guide Login</h1>
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
      <button onClick={handleLogin}>Login</button>
      <div className="login-links">
      <a href="/register" className="register">Register User</a>
      <a href="#" className="forgot">Forgot Password?</a>
      </div>
    </div>
  );
};

export default Login;