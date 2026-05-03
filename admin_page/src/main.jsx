import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import AdminPage from './Admin';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/admin" />} />
      <Route path="/admin/*" element={<AdminPage />} />
    </Routes>
    </BrowserRouter>
  </StrictMode>
)
