import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import AdminPage from './Admin';
import { ParkContext } from "./ParkContext";   // 引入 Context
import { useState } from "react";
import { sfcAdminTheme } from "./theme/sfcAdminTheme";
import './index.css'

function RootApp() {
  const [selectedPark, setSelectedPark] = useState(1);

  return (
    <ThemeProvider theme={sfcAdminTheme}>
      <CssBaseline enableColorScheme />
      <ParkContext.Provider value={{ selectedPark, setSelectedPark }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" />} />
            <Route path="/admin/*" element={<AdminPage />} />
          </Routes>
        </BrowserRouter>
      </ParkContext.Provider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootApp />
  </StrictMode>
);
