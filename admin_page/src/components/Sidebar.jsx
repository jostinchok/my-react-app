import React from "react";
import { Box } from "@mui/material";
import { NavLink } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SchoolIcon from "@mui/icons-material/School";
import GroupIcon from "@mui/icons-material/Group";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import WarningIcon from "@mui/icons-material/Warning";

const Sidebar = () => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <DashboardIcon />, to: "/admin" },
    { id: "training", label: "Training", icon: <SchoolIcon />, to: "/admin/training" },
    { id: "students", label: "Students", icon: <GroupIcon />, to: "/admin/students" },
    { id: "badge", label: "Badge", icon: <MilitaryTechIcon />, to: "/admin/badge" },
    { id: "detection", label: "Detection", icon: <WarningIcon />, to: "/admin/detection"},
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {menuItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.to}
          end={item.id === "dashboard"} 
          className="nav-item"
          style={({ isActive }) => ({
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            margin: "4px 8px",
            borderRadius: "20px",
            transition: "all 0.2s",
            backgroundColor: isActive ? "#ff2442" : "transparent",
            color: isActive ? "#fff" : "#666",
            fontWeight: isActive ? "600" : "400",
          })}
        >
          <Box sx={{ mr: 3, display: "flex", alignItems: "center", color: "inherit" }}>
            {item.icon}
          </Box>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </Box>
  );
};

export default Sidebar;