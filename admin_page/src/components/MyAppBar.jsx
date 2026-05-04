import React, { useState, useMemo, useEffect, useContext } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation } from "react-router-dom";
import "../Admin.css";
import { ParkContext } from "../ParkContext";

const MyAppBar = ({ open, onToggleSidebar, sidebarWidth = 304 }) => {
  const theme = useTheme();
  const location = useLocation();
  const [userAnchor, setUserAnchor] = useState(null);

  const [parks, setParks] = useState([]);
  const {selectedPark, setSelectedPark} = useContext(ParkContext);

  useEffect(() => {
    fetch("http://localhost:4001/api/parks")
      .then(res => res.json())
      .then(data => {
        const parkList = Array.isArray(data) ? data : (data.parks || []);
        setParks(parkList);
        if (parkList.length > 0 && selectedPark === "") {
          setSelectedPark(parkList[0].park_id);
        }
      })
      .catch(err => console.error("Failed to load parks", err));
  }, [setSelectedPark, selectedPark]);

  const currentLabel = useMemo(() => {
    if (location.pathname.startsWith("/admin/course")) return "COURSE";
    if (location.pathname.startsWith("/admin/training")) return "TRAINING";
    if (location.pathname.startsWith("/admin/students")) return "STUDENTS";
    if (location.pathname.startsWith("/admin/badge")) return "BADGE";
    if (location.pathname.startsWith("/admin/detection")) return "DETECTION";
    if (location.pathname.startsWith("/admin/ranger")) return "RANGER";
    return "DASHBOARD";
  }, [location.pathname]);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        height: "86px",
        backdropFilter: "blur(14px)",
        backgroundColor: "rgba(255, 253, 244, 0.92)",
        color: "text.primary",
        boxShadow: "none",
        borderBottom: "1px solid",
        borderColor: "divider",
        justifyContent: "center",
        ml: open ? `${sidebarWidth}px` : "0px",
        width: open ? `calc(100% - ${sidebarWidth}px)` : "100%",
        transition: "margin-left 0.35s ease, width 0.35s ease",
      }}
    >
      <Toolbar
        sx={{
          minHeight: "86px !important",
          px: "32px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Box
            component="button"
            onClick={onToggleSidebar}
            sx={{
              width: "50px",
              height: "50px",
              borderRadius: "14px",
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: open ? "rgba(239, 247, 232, 0.9)" : theme.palette.background.paper,
              color: "text.primary",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.25s ease",
              boxShadow: "none",
              "&:hover": {
                transform: "translateY(-1px)",
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.light} 100%)`,
                color: theme.palette.secondary.contrastText,
                borderColor: "transparent",
              },
            }}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </Box>
          <Box
            sx={{
              fontWeight: 600,
              color: "primary.dark",
              letterSpacing: "0.2px",
              fontSize: "1rem",
            }}
          >
            SFC / {currentLabel}
          </Box>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Park</InputLabel>
            <Select
              value={selectedPark}
              label="Park"
              onChange={(e) => setSelectedPark(e.target.value)}
            >
              {(parks || []).map((park) => (
                <MenuItem key={park.park_id} value={park.park_id}>
                  {park.park_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box className="admin-top-actions">
          <Box
            component="button"
            className="admin-top-user-btn"
            onClick={(e) => setUserAnchor(e.currentTarget)}
          >
            U
          </Box>

          <Menu
            anchorEl={userAnchor}
            open={Boolean(userAnchor)}
            onClose={() => setUserAnchor(null)}
            PaperProps={{
              sx: {
                width: 220,
                mt: 1.2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "18px",
                boxShadow: "0 20px 48px rgba(58, 42, 22, 0.12)",
              },
            }}
          >
            <MenuItem
              onClick={() => {
                setUserAnchor(null);
                window.location.href = "/";
              }}
              sx={{ color: "error.main", fontWeight: 600 }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default MyAppBar;