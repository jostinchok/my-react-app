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
      { id: "dashboard", label: "Dashboard", icon: "D", to: "/admin" },
    ],
  },
  {
    title: "Training",
    items: [
      { id: "course", label: "Courses", icon: "C", to: "/admin/course" },
      { id: "training", label: "Training Modules", icon: "M", to: "/admin/training" },
      { id: "course-requests", label: "Course Requests", icon: "R", to: "/admin/course-requests" },
      { id: "students", label: "Guides", icon: "G", to: "/admin/students" },
      { id: "certificates", label: "Certificates", icon: "C", to: "/admin/certificates" },
    ],
  },
  {
    title: "Operations",
    items: [
      { id: "detection", label: "Incident Detection", icon: "I", to: "/admin/detection" },
      { id: "ranger-review", label: "Ranger Review", icon: "R", to: "/admin/ranger-review" },
      { id: "sensor-rules", label: "Sensor Rules", icon: "S", to: "/admin/sensor-rules" },
    ],
  },
  {
    title: "Access",
    items: [
      { id: "users", label: "Users", icon: "U", to: "/admin/users" },
      { id: "permissions", label: "Permissions", icon: "P", to: "/admin/permissions" },
    ],
  },
  {
    title: "System",
    items: [
      { id: "announcements", label: "Announcements", icon: "A", to: "/admin/announcements" },
      { id: "inbox", label: "Inbox", icon: "N", to: "/admin/inbox" },
      { id: "help-desk", label: "Help Desk", icon: "H", to: "/admin/help-desk" },
      { id: "backend-map", label: "Backend Map", icon: "B", to: "/admin/backend-map" },
      { id: "audit-log", label: "Audit Log", icon: "L", to: "/admin/audit-log" },
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
