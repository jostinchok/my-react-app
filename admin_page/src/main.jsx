import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import AdminPage from './Admin';
import ParkRangerConsole from './pages/ParkRangerConsole.jsx';
import { ParkContext } from "./ParkContext";   // 引入 Context
import { useState } from "react";

function RootApp() {
  const [selectedPark, setSelectedPark] = useState(1);

  return (
    <ParkContext.Provider value={{ selectedPark, setSelectedPark }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" />} />
          <Route path="/admin/ranger" element={<ParkRangerConsole />} />
          <Route path="/admin/*" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </ParkContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootApp />
  </StrictMode>
);
