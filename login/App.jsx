import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import './Login.css';  // Global CSS

function App() {
  const [view, setView] = useState('login');

  if (view === 'register') return <Register onBack={() => setView('login')} />;
  if (view === 'forgot') return <ForgotPassword onBack={() => setView('login')} />;
  return (
    <Login
      onRegister={() => setView('register')}
      onForgot={() => setView('forgot')}
    />
  );
}

export default App;
