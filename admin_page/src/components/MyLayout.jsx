import React, { useState } from "react";
import { Layout } from "react-admin";
import { Drawer } from "@mui/material";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MyAppBar from "./MyAppBar";

const SIDEBAR_WIDTH = 312;

const MyLayout = (props) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isIncidentSurface =
    location.pathname.startsWith("/admin/detection") ||
    location.pathname.startsWith("/admin/ranger");
  const incidentBackground =
    "radial-gradient(circle at 12% 6%, rgba(255, 210, 63, 0.32), transparent 28rem), radial-gradient(circle at 86% 14%, rgba(168, 230, 74, 0.26), transparent 30rem), radial-gradient(circle at 48% 100%, rgba(255, 122, 26, 0.12), transparent 34rem), linear-gradient(135deg, #fff8e6 0%, #f4fbdf 18%, #dff0ca 34%, #2b6946 66%, #0b3b28 100%)";

  return (
    <Layout
      {...props}
      appBar={(appBarProps) => (
        <MyAppBar
          {...appBarProps}
          open={open}
          sidebarWidth={SIDEBAR_WIDTH}
          onToggleSidebar={() => setOpen((prev) => !prev)}
        />
      )}
      sx={{
        backgroundColor: isIncidentSurface ? "#1e2a22" : "var(--bg-light)",

        "& .RaLayout-appFrame": {
          marginTop: "86px",
          minHeight: "calc(100vh - 86px)",
          backgroundColor: isIncidentSurface ? "#1e2a22" : "var(--bg-light)",
        },

        "& .RaLayout-content": {
          "--incident-shell-max-width": isIncidentSurface
            ? open
              ? "1500px"
              : "1640px"
            : undefined,
          background: isIncidentSurface ? incidentBackground : "var(--bg-light)",
          minHeight: "calc(100vh - 86px)",
          marginLeft: isIncidentSurface ? 0 : open ? `100px` : "-198px",
          padding: isIncidentSurface
            ? {
                xs: "18px 12px",
                md: "24px 20px",
                lg: open ? "28px 22px" : "30px 28px",
              }
            : "44px 42px",
          overflowX: "hidden",
          transition: "padding 0.25s ease, margin-left 0.35s ease",
        },
      }}
      menu={() => (
        <Drawer
          variant="persistent"
          anchor="left"
          open={open}
          sx={{
            width: open ? `${SIDEBAR_WIDTH}px` : 0,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              position: "fixed",
              top: 0,
              left: 0,
              width: `${SIDEBAR_WIDTH}px`,
              height: "100vh",
              background: "transparent",
              borderRight: "none",
              paddingTop: 0,
              boxShadow: "none",
              overflowX: "hidden",
              zIndex: 1200, 
            },
          }}
        >
          <Sidebar />
        </Drawer>
      )}
    />
  );
};

export default MyLayout;
