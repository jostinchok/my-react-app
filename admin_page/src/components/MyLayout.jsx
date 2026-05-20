import React, { useEffect } from "react";
import { Layout, useSidebarState } from "react-admin";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MyAppBar from "./MyAppBar";

const SIDEBAR_WIDTH = 304;
const COLLAPSED_SIDEBAR_WIDTH = 72;

const MyLayout = (props) => {
  const [open, setOpen] = useSidebarState();
  const location = useLocation();
  const isIncidentSurface =
    location.pathname.startsWith("/admin/detection");
  const incidentBackground =
    "radial-gradient(circle at 10% 6%, rgba(255, 216, 77, 0.32), transparent 28rem), radial-gradient(circle at 88% 14%, rgba(167, 233, 87, 0.25), transparent 30rem), radial-gradient(circle at 48% 100%, rgba(255, 122, 26, 0.10), transparent 34rem), linear-gradient(135deg, #fffdf5 0%, #fff9e8 42%, #f6ffe8 100%)";
  const shellBackground =
    "radial-gradient(circle at 8% 0%, rgba(255, 216, 77, 0.22), transparent 24rem), radial-gradient(circle at 94% 10%, rgba(167, 233, 87, 0.18), transparent 20rem), linear-gradient(135deg, #fffdf5 0%, #fff9e8 48%, #f6ffe8 100%)";

  useEffect(() => {
    document.querySelector(".RaLayout-content")?.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  return (
    <Layout
      {...props}
      appBar={(appBarProps) => (
        <MyAppBar
          {...appBarProps}
          open={open}
          sidebarWidth={SIDEBAR_WIDTH}
          collapsedSidebarWidth={COLLAPSED_SIDEBAR_WIDTH}
          onToggleSidebar={() => setOpen(!open)}
        />
      )}
      sx={{
        height: "100vh",
        minHeight: "100vh",
        overflow: "hidden",
        background: shellBackground,

        "& .RaLayout-contentWithSidebar": {
          background: shellBackground,
          alignItems: "stretch",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
        },

        "& .RaSidebar-paper": {
          width: open ? `${SIDEBAR_WIDTH}px !important` : `${COLLAPSED_SIDEBAR_WIDTH}px !important`,
          minWidth: open ? `${SIDEBAR_WIDTH}px !important` : `${COLLAPSED_SIDEBAR_WIDTH}px !important`,
          top: "0px !important",
          height: "100vh !important",
          maxHeight: "100vh !important",
          zIndex: 1201,
          transition: "width 0.28s ease, min-width 0.28s ease !important",
          overflow: "hidden",
        },

        "& .RaSidebar-fixed": {
          width: open ? `${SIDEBAR_WIDTH}px !important` : `${COLLAPSED_SIDEBAR_WIDTH}px !important`,
          top: "0px !important",
          height: "100vh !important",
          maxHeight: "100vh !important",
          zIndex: 1201,
          transition: "width 0.28s ease !important",
          overflow: "hidden",
        },

        "& .RaLayout-appFrame": {
          marginTop: "86px",
          height: "calc(100vh - 86px)",
          minHeight: 0,
          overflow: "hidden",
          background: shellBackground,
        },

        "& .RaLayout-content": {
          "--incident-shell-max-width": isIncidentSurface ? "1440px" : undefined,
          background: isIncidentSurface ? incidentBackground : shellBackground,
          height: "100%",
          minHeight: 0,
          width: "100%",
          marginLeft: "0px",
          padding: {
            xs: "18px 14px",
            md: "26px 22px",
            lg: "30px 28px",
          },
          overflowX: "hidden",
          overflowY: "auto",
          scrollbarGutter: "stable",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          transition: "padding 0.25s ease, margin-left 0.35s ease, width 0.35s ease",
        },
      }}
      menu={() => <Sidebar />}
    />
  );
};

export default MyLayout;
