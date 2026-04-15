import React, { useState } from "react";
import { Layout } from "react-admin";
import { Drawer } from "@mui/material";
import Sidebar from "./Sidebar";  
import MyAppBar from "./MyAppBar";  

const MyLayout = (props) => {
  const [open, setOpen] = useState(true);

  return (
    <>
      <Layout
        {...props}
        appBar={(appBarProps) => <MyAppBar {...appBarProps} onToggleSidebar={() => setOpen(!open)} />}
        
        sx={{
          "& .RaLayout-content": {
            marginLeft: open ? "20px" : "-170px",
            transition: "margin-left 0.3s ease",
          }
        }}
        
        menu={() => (
          <Drawer
            variant="permanent"
            anchor="left"
            open={open}
            sx={{
              "& .MuiDrawer-paper": {
                width: open ? "260px" : "73px",
                height: "100vh",
                backgroundColor: "#ffffff", 
                borderRight: "1px solid #f0f0f0",
                paddingTop: "20px",
                boxShadow: "none",
                transition: "width 0.3s ease",
                overflowX: "hidden"
              },
            }}
          >
            <Sidebar />
          </Drawer>
        )}
      />
    </>
  );
};

export default MyLayout;
