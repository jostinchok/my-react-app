import React from "react";
import { Box, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useSidebarState } from "react-admin";

const SIDEBAR_WIDTH = 304;
const adminBasePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const logoSrc = `${adminBasePath}sfc-citrus-logo.webp`;

const menuGroups = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "📊", to: "/admin" },
      { id: "analytics", label: "Analytics", icon: "📈", to: "/admin/analytics" },
    ],
  },
  {
    title: "Training",
    items: [
      { id: "course", label: "Course", icon: "📚", to: "/admin/course" },
      { id: "training", label: "Training", icon: "📖", to: "/admin/training" },
      { id: "course-requests", label: "Requests", icon: "📝", to: "/admin/course-requests" },
      { id: "students", label: "Guides", icon: "👥", to: "/admin/students" },
      { id: "certificates", label: "Certificates", icon: "🎓", to: "/admin/certificates" },
    ],
  },
  {
    title: "Operations",
    items: [
      { id: "detection", label: "Incidents", icon: "⚠️", to: "/admin/detection" },
      { id: "ranger-review", label: "Ranger Review", icon: "🧭", to: "/admin/ranger-review" },
      { id: "sensor-rules", label: "Sensor Rules", icon: "📡", to: "/admin/sensor-rules" },
    ],
  },
  {
    title: "System",
    items: [
      { id: "announcements", label: "Announcements", icon: "📣", to: "/admin/announcements" },
      { id: "inbox", label: "Inbox", icon: "💬", to: "/admin/inbox" },
      { id: "help-desk", label: "Help Desk", icon: "🛟", to: "/admin/help-desk" },
      { id: "backend-map", label: "Backend Map", icon: "🗺️", to: "/admin/backend-map" },
      { id: "audit-log", label: "Audit Log", icon: "🔎", to: "/admin/audit-log" },
    ],
  },
];

const Sidebar = () => {
  const [open] = useSidebarState();

  return (
    <Box
      sx={{
        width: open ? `${SIDEBAR_WIDTH}px` : "0px",
        minWidth: open ? `${SIDEBAR_WIDTH}px` : "0px",
        transition: "width 0.35s ease, min-width 0.35s ease",
        overflow: "hidden",
      }}
    >
      <Box
        className="admin-sidebar admin-command-rail"
        sx={{
          width: `${SIDEBAR_WIDTH}px`,
          height: "calc(100vh + 86px)",
          marginTop: "-86px",
          paddingTop: "86px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box className="admin-sidebar-header admin-command-brand">
          <Box className="admin-sidebar-badge">
            <Box
              component="img"
              className="admin-sidebar-logo"
              src={logoSrc}
              alt="SFC Digital Portal logo"
            />
          </Box>

          <Box className="admin-command-brand-copy">
            <Typography className="admin-sidebar-title">SFC Digital Portal</Typography>
            <Typography component="span">Admin command center</Typography>
          </Box>
        </Box>

        <Box className="admin-sidebar-menu admin-command-menu">
          {menuGroups.map((group) => (
            <Box className="admin-nav-group" key={group.title}>
              <Typography component="p" className="admin-nav-group-title">
                {group.title}
              </Typography>

              {group.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  end={item.id === "dashboard"}
                  className={({ isActive }) => `nav-item admin-command-item ${isActive ? "active" : ""}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              ))}
            </Box>
          ))}
        </Box>

        <Box className="admin-sidebar-footer admin-command-footer">
          <Typography className="admin-sidebar-version">
            SFC-V1.0
          </Typography>
          <Typography component="span">
            Office dashboard
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
