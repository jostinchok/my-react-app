import React from "react";
import { Box, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useSidebarState } from "react-admin";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import CrisisAlertOutlinedIcon from "@mui/icons-material/CrisisAlertOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import ReviewsOutlinedIcon from "@mui/icons-material/ReviewsOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SensorsOutlinedIcon from "@mui/icons-material/SensorsOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";

const SIDEBAR_WIDTH = 304;
const COLLAPSED_SIDEBAR_WIDTH = 72;
const adminBasePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const logoSrc = `${adminBasePath}sfc-citrus-logo.webp`;

const menuGroups = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <DashboardOutlinedIcon />, to: "/admin" },
    ],
  },
  {
    title: "Training",
    items: [
      { id: "course", label: "Courses", icon: <SchoolOutlinedIcon />, to: "/admin/course" },
      { id: "training", label: "Training Modules", icon: <ViewModuleOutlinedIcon />, to: "/admin/training" },
      { id: "course-requests", label: "Course Requests", icon: <AssignmentTurnedInOutlinedIcon />, to: "/admin/course-requests" },
      { id: "students", label: "Guides", icon: <PersonSearchOutlinedIcon />, to: "/admin/students" },
      { id: "certificates", label: "Certificates", icon: <WorkspacePremiumOutlinedIcon />, to: "/admin/certificates" },
    ],
  },
  {
    title: "Operations",
    items: [
      { id: "detection", label: "Incident Detection", icon: <CrisisAlertOutlinedIcon />, to: "/admin/detection" },
      { id: "ranger-review", label: "Ranger Review", icon: <ReviewsOutlinedIcon />, to: "/admin/ranger-review" },
      { id: "sensor-rules", label: "Sensor Rules", icon: <SensorsOutlinedIcon />, to: "/admin/sensor-rules" },
    ],
  },
  {
    title: "Access",
    items: [
      { id: "users", label: "Users", icon: <ManageAccountsOutlinedIcon />, to: "/admin/users" },
      { id: "permissions", label: "Permissions", icon: <AdminPanelSettingsOutlinedIcon />, to: "/admin/permissions" },
    ],
  },
  {
    title: "System",
    items: [
      { id: "announcements", label: "Announcements", icon: <CampaignOutlinedIcon />, to: "/admin/announcements" },
      { id: "inbox", label: "Inbox", icon: <InboxOutlinedIcon />, to: "/admin/inbox" },
      { id: "help-desk", label: "Help Desk", icon: <SupportAgentOutlinedIcon />, to: "/admin/help-desk" },
      { id: "backend-map", label: "Backend Map", icon: <AccountTreeOutlinedIcon />, to: "/admin/backend-map" },
      { id: "audit-log", label: "Audit Log", icon: <FactCheckOutlinedIcon />, to: "/admin/audit-log" },
    ],
  },
];

const Sidebar = () => {
  const [open] = useSidebarState();

  return (
    <Box
      sx={{
        width: open ? `${SIDEBAR_WIDTH}px` : `${COLLAPSED_SIDEBAR_WIDTH}px`,
        minWidth: open ? `${SIDEBAR_WIDTH}px` : `${COLLAPSED_SIDEBAR_WIDTH}px`,
        height: "100vh",
        transition: "width 0.35s ease, min-width 0.35s ease",
        overflow: "hidden",
      }}
    >
      <Box
        className={`admin-sidebar admin-command-rail ${open ? "is-open" : "is-collapsed"}`}
        sx={{
          width: open ? `${SIDEBAR_WIDTH}px` : `${COLLAPSED_SIDEBAR_WIDTH}px`,
          height: "100vh",
          marginTop: 0,
          paddingTop: 0,
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
                  title={item.label}
                  aria-label={item.label}
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
