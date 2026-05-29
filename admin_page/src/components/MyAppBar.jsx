import React, { useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import SchoolIcon from "@mui/icons-material/School";
import SensorsIcon from "@mui/icons-material/Sensors";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useLocation, useNavigate } from "react-router-dom";
import "../Admin.css";

const adminBasePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const logoSrc = `${adminBasePath}sfc-citrus-logo.webp`;
const loginUrl = import.meta.env.VITE_LOGIN_URL || "http://localhost:5176/login/";

const clearAuthAndReturnToLogin = () => {
  try {
    localStorage.removeItem("sfc_token");
    localStorage.removeItem("sfc_session");
    sessionStorage.removeItem("sfc_token");
    sessionStorage.removeItem("sfc_session");
  } catch {
    // Storage can be unavailable in hardened browser modes; still navigate out.
  }

  window.location.assign(loginUrl);
};

const NotificationButton = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([
    {
      id: "guide-request",
      title: "Course request needs review",
      detail: "A park guide is waiting for an enrolment decision.",
      time: "Just now",
      route: "/admin/course-requests",
      type: "request",
      icon: PersonAddAlt1Icon,
      unread: true,
    },
    {
      id: "incident-alert",
      title: "AI / IoT incident queued",
      detail: "Protected flora alert is ready for Admin official status review.",
      time: "5 min ago",
      route: "/admin/detection",
      type: "incident",
      icon: SensorsIcon,
      unread: true,
    },
    {
      id: "training-update",
      title: "Training module updated",
      detail: "SFC Field Response Essentials has new module content.",
      time: "18 min ago",
      route: "/admin/training",
      type: "training",
      icon: SchoolIcon,
      unread: true,
    },
    {
      id: "certificate-ready",
      title: "Certificate ready to issue",
      detail: "A completed guide record is waiting for certificate action.",
      time: "Today",
      route: "/admin/certificates",
      type: "certificate",
      icon: VerifiedIcon,
      unread: false,
    },
  ]);

  const open = Boolean(anchorEl);
  const unreadCount = notifications.filter((note) => note.unread).length;

  const markAllReviewed = () => {
    setNotifications((current) => current.map((note) => ({ ...note, unread: false })));
  };

  const openNotification = (note) => {
    setNotifications((current) =>
      current.map((item) => (item.id === note.id ? { ...item, unread: false } : item))
    );
    setAnchorEl(null);
    navigate(note.route);
  };

  return (
    <Box>
      <Box
        component="button"
        className="admin-top-icon-btn"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label={`${unreadCount} unread admin notifications`}
      >
        <Badge badgeContent={unreadCount} color="error" className="admin-top-badge">
          <NotificationsIcon />
        </Badge>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          className: "admin-notification-menu",
          "aria-label": "Admin notifications",
        }}
        PaperProps={{
          className: "admin-notification-paper",
          sx: {
            width: 390,
            maxWidth: "calc(100vw - 32px)",
            mt: 1.2,
            overflow: "hidden",
            borderRadius: "20px",
            border: "1px solid #EADFBF",
            background: "#FFFDF5",
            boxShadow: "0 24px 60px rgba(11, 59, 40, 0.18)",
          },
        }}
      >
        <Box className="admin-notification-header">
          <Box>
            <Typography component="h2">Notifications</Typography>
            <Typography component="p">
              {unreadCount ? `${unreadCount} item${unreadCount === 1 ? "" : "s"} need attention` : "All admin updates reviewed"}
            </Typography>
          </Box>
          <Box component="span" className={unreadCount ? "notification-status live" : "notification-status"}>
            {unreadCount ? "Action needed" : "Reviewed"}
          </Box>
        </Box>

        <Divider />

        {notifications.map((note) => {
          const Icon = note.icon;

          return (
            <MenuItem
              key={note.id}
              className={`admin-notification-item ${note.unread ? "is-unread" : ""}`}
              onClick={() => openNotification(note)}
            >
              <Box className={`notification-icon ${note.type}`}>
                <Icon fontSize="small" />
              </Box>
              <Box className="notification-copy">
                <Box className="notification-title-row">
                  <Typography component="strong">{note.title}</Typography>
                  <Typography component="span">{note.time}</Typography>
                </Box>
                <Typography component="p">{note.detail}</Typography>
              </Box>
            </MenuItem>
          );
        })}

        <Divider />

        <Box className="admin-notification-footer">
          <Box component="button" type="button" onClick={markAllReviewed}>
            Mark all reviewed
          </Box>
          <Box
            component="button"
            type="button"
            onClick={() => {
              setAnchorEl(null);
              navigate("/admin/audit-log");
            }}
          >
            Open audit log
          </Box>
        </Box>
      </Menu>
    </Box>
  );
};

const MyAppBar = ({ open, onToggleSidebar, sidebarWidth = 304, collapsedSidebarWidth = 72 }) => {
  const location = useLocation();
  const [userAnchor, setUserAnchor] = useState(null);
  const appBarOffset = open ? sidebarWidth : collapsedSidebarWidth;

  const currentLabel = useMemo(() => {
    const routeLabels = [
      ["/admin/analytics", "ANALYTICS"],
      ["/admin/users", "USER MANAGEMENT"],
      ["/admin/permissions", "PERMISSIONS"],
      ["/admin/course-requests", "REQUESTS"],
      ["/admin/course", "COURSE"],
      ["/admin/training", "TRAINING"],
      ["/admin/accounts", "USER MANAGEMENT"],
      ["/admin/students", "USER MANAGEMENT"],
      ["/admin/badge", "CERTIFICATES"],
      ["/admin/certificates", "CERTIFICATES"],
      ["/admin/detection", "DETECTION"],
      ["/admin/ranger-review", "RANGER REVIEW"],
      ["/admin/sensor-rules", "SENSOR RULES"],
      ["/admin/announcements", "ANNOUNCEMENTS"],
      ["/admin/inbox", "INBOX"],
      ["/admin/help-desk", "HELP DESK"],
      ["/admin/backend-map", "BACKEND MAP"],
      ["/admin/audit-log", "AUDIT LOG"],
    ];

    return routeLabels.find(([path]) => location.pathname.startsWith(path))?.[1] || "DASHBOARD";
  }, [location.pathname]);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        height: "86px",
        background: "rgba(255, 253, 245, 0.96)",
        color: "#173126",
        boxShadow: "0 12px 28px rgba(255, 122, 26, 0.08)",
        borderBottom: "1px solid #EADFBF",
        backdropFilter: "blur(18px)",
        justifyContent: "center",
        ml: `${appBarOffset}px`,
        width: `calc(100% - ${appBarOffset}px)`,
        transition: "margin-left 0.28s ease, width 0.28s ease",
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
            type="button"
            onClick={onToggleSidebar}
            aria-label={open ? "Collapse admin sidebar" : "Expand admin sidebar"}
            aria-controls="admin-sidebar"
            aria-expanded={open}
            sx={{
              width: "50px",
              height: "50px",
              borderRadius: "14px",
              border: open ? "1px solid #D8EAC7" : "1px solid #EADFBF",
              background: open ? "#F6FFE8" : "#FFFFFF",
              color: "#173126",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.25s ease",
              boxShadow: "none",
              "&:hover": {
                transform: "translateY(-1px)",
                background: "linear-gradient(135deg, #FF7A1A, #FFD84D)",
                color: "#173126",
                borderColor: "#FF9F1C",
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
            type="button"
            className="admin-top-user-btn"
            aria-label="Open admin account menu"
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
                border: "1px solid #EADFBF",
                borderRadius: "18px",
                background: "#FFFDF5",
                boxShadow: "0 18px 45px rgba(255, 122, 26, 0.10)",
              },
            }}
          >
            <MenuItem
              onClick={() => {
                setUserAnchor(null);
                clearAuthAndReturnToLogin();
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
