import React, { useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Badge,
  Menu,
  MenuItem,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation } from "react-router-dom";
import "../Admin.css";

const adminBasePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const logoSrc = `${adminBasePath}sfc-citrus-logo.webp`;

const NotificationButton = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const notifications = [
    { id: 1, message: "New user registered" },
    { id: 2, message: "New post created" },
    { id: 3, message: "New course added" },
  ];

  const open = Boolean(anchorEl);

  return (
    <Box>
      <Box
        component="button"
        className="admin-top-icon-btn"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <Badge badgeContent={notifications.length} color="error" className="admin-top-badge">
          <NotificationsIcon />
        </Badge>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            width: 240,
            mt: 1.2,
            borderRadius: "18px",
            border: "1px solid #e5e5e5",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        {notifications.map((note) => (
          <MenuItem key={note.id}>{note.message}</MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

const MyAppBar = ({ open, onToggleSidebar, sidebarWidth = 304 }) => {
  const location = useLocation();
  const [userAnchor, setUserAnchor] = useState(null);

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
        background: "linear-gradient(135deg, #ffffff 0%, #fff8e6 58%, #f4fbdf 100%)",
        color: "var(--text-main)",
        boxShadow: "0 10px 28px rgba(11, 59, 40, 0.08)",
        borderBottom: "1px solid rgba(255, 210, 63, 0.38)",
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
              border: open ? "1px solid #cfe4c6" : "1px solid #f0c264",
              background: open ? "#fff8e6" : "#ffffff",
              color: "#0b3b28",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.25s ease",
              boxShadow: "none",
              "&:hover": {
                transform: "translateY(-1px)",
                background: "linear-gradient(135deg, #ff7a1a, #ffd23f)",
                color: "#102419",
                borderColor: "#ff7a1a",
              },
            }}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </Box>
          <Box className={`admin-top-brand ${open ? "sidebar-open" : "sidebar-closed"}`}>
            <Box
              component="img"
              className="admin-top-brand-logo"
              src={logoSrc}
              alt="SFC Digital Portal logo"
            />
            <Box className="admin-top-brand-copy">
              <span>SFC Dashboard</span>
              <strong>{currentLabel}</strong>
            </Box>
          </Box>
          </Box>
          
        <Box className="admin-top-actions">
          <NotificationButton />

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
                border: "1px solid #e5e5e5",
                borderRadius: "18px",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.12)",
              },
            }}
          >
            <MenuItem
              onClick={() => {
                setUserAnchor(null);
                window.location.href = "/";
              }}
              sx={{ color: "#e74c3c", fontWeight: 600 }}
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
