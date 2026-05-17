import React, { useState } from "react";
import { Layout } from "react-admin";
import { Drawer } from "@mui/material";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MyAppBar from "./MyAppBar";

const SIDEBAR_WIDTH = 304;
const REACT_ADMIN_MENU_OFFSET = 240;

const MyLayout = (props) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isIncidentSurface =
    location.pathname.startsWith("/admin/detection");
  const incidentBackground =
    "radial-gradient(circle at 10% 6%, rgba(255, 216, 77, 0.32), transparent 28rem), radial-gradient(circle at 88% 14%, rgba(167, 233, 87, 0.25), transparent 30rem), radial-gradient(circle at 48% 100%, rgba(255, 122, 26, 0.10), transparent 34rem), linear-gradient(135deg, #fffdf5 0%, #fff9e8 42%, #f6ffe8 100%)";
  const shellBackground =
    "radial-gradient(circle at 8% 0%, rgba(255, 216, 77, 0.22), transparent 24rem), radial-gradient(circle at 94% 10%, rgba(167, 233, 87, 0.18), transparent 20rem), linear-gradient(135deg, #fffdf5 0%, #fff9e8 48%, #f6ffe8 100%)";

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
        background: shellBackground,

        "& .RaLayout-appFrame": {
          marginTop: "86px",
          minHeight: "calc(100vh - 86px)",
          background: shellBackground,
        },

        "& .RaLayout-content": {
          "--incident-shell-max-width": isIncidentSurface ? "1440px" : undefined,
          background: isIncidentSurface ? incidentBackground : shellBackground,
          minHeight: "calc(100vh - 86px)",
          width: open ? `calc(100% - ${SIDEBAR_WIDTH}px)` : "100%",
          marginLeft: open ? `${SIDEBAR_WIDTH - REACT_ADMIN_MENU_OFFSET}px` : "0px",
          padding: {
            xs: "18px 14px",
            md: "26px 22px",
            lg: "30px 28px",
          },
          overflowX: "hidden",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          transition: "padding 0.25s ease, margin-left 0.35s ease, width 0.35s ease",
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
