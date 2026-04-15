import React, { useState } from "react";
import { Layout } from "react-admin";
import { Drawer } from "@mui/material";
import Sidebar from "./Sidebar";
import MyAppBar from "./MyAppBar";

const SIDEBAR_WIDTH = 312;

const MyLayout = (props) => {
  const [open, setOpen] = useState(false);

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
        backgroundColor: "var(--bg-light)",

        "& .RaLayout-appFrame": {
          marginTop: "86px",
          minHeight: "calc(100vh - 86px)",
        },

        "& .RaLayout-contentWithSidebar": {
          backgroundColor: "var(--bg-light)",
          marginLeft: open ? `${SIDEBAR_WIDTH}px` : "0px",
          width: open ? `calc(100% - ${SIDEBAR_WIDTH}px)` : "100%",
          transition: "margin-left 0.35s ease, width 0.35s ease",
        },

        "& .RaLayout-content": {
          backgroundColor: "var(--bg-light)",
          minHeight: "calc(100vh - 86px)",
          marginLeft: "0 !important",
          padding: "44px 42px",
        },
      }}
      menu={() => (
        <Drawer
          variant="persistent"
          anchor="left"
          open={open}
          sx={{
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