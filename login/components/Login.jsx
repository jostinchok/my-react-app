import React, { useState } from 'react';
import '../Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const handleLogin = () => {
    if (!email || !password) {
      alert("Please enter both email and password!");
      return;
    }
    if (email === "user@example.com" && password === "1234" && role === "user") {
      alert("User login successful!");
      window.location.href = "/user";
    } else if (email === "admin@example.com" && password === "admin" && role === "admin") {
      alert("Admin login successful!");
      window.location.href = "/admin";
    } else {
      alert("Invalid credentials. Try again!");
    }
  };

  return (
    <div className="login-container">
      <img
        src="/fd87f0d6-56d3-49eb-b3e8-5a80cf4fc818.png"
        alt="Digital Park Portal Logo"
        className="logo"
      />
      <h1>SFC Digital Park Portal Login</h1>
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
        <option value="user">User</option>
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