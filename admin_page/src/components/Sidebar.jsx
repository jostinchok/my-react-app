import React from "react";
import { Box, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useSidebarState } from "react-admin";

const SIDEBAR_WIDTH = 312;

const Sidebar = () => {
  const [open] = useSidebarState();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", to: "/admin" },
    { id: "training", label: "Training", icon: "📖", to: "/admin/training" },
    { id: "students", label: "Students", icon: "👥", to: "/admin/students" },
    { id: "badge", label: "Badge", icon: "📜", to: "/admin/badge" },
    { id: "detection", label: "Incidents", icon: "⚠️", to: "/admin/detection" },
  ];

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
        className="admin-sidebar"
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
        <Box
          className="admin-sidebar-header"
          sx={{
            padding: "30px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
            fontSize: "1.4rem",
            fontWeight: 700,
          }}
        >
          <Box
            className="admin-sidebar-badge"
            sx={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            SFC
          </Box>

          <Typography
            className="admin-sidebar-title"
            sx={{
              fontWeight: 700,
              fontSize: "1.25rem",
              lineHeight: 1.2,
            }}
          >
            Digital Portal
          </Typography>
        </Box>

        <Box
          className="admin-sidebar-menu"
          sx={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.id === "dashboard"}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              style={{
                padding: "15px",
                textAlign: "left",
                borderRadius: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "15px",
                textDecoration: "none",
              }}
            >
              <span className="nav-icon" style={{ fontSize: "1.15rem", width: "24px", textAlign: "center" }}>
                {item.icon}
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </Box>

        <Box
          className="admin-sidebar-footer"
          sx={{
            marginTop: "auto",
            padding: "30px",
          }}
        >
          <Typography className="admin-sidebar-version" sx={{ fontSize: "0.8rem" }}>
            System: SFC-V1.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
