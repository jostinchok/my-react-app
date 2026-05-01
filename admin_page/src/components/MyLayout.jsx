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

        "& .RaLayout-content": {
          backgroundColor: "var(--bg-light)",
          minHeight: "calc(100vh - 86px)",
          marginLeft: open ? `100px` : "-198px",
          padding: "44px 42px",
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