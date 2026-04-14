import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Box, IconButton, Badge, Menu, MenuItem } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";

const NotificationButton = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([
      { id: 1, message: "New user registered" },
      { id: 2, message: "New post created" }, 
      { id: 3, message: "New course added" }
  ]);

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  }

  const handleClose = () => {
    setAnchorEl(null);
  }

  return (
    <Box>
      <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={notifications.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu 
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {width: 250, mt:1},
      }}
      >
        {notifications.map((note) => (
          <MenuItem key={note.id}>{note.message}</MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

const MyAppBar = ({ onToggleSidebar }) => {
const [anchorEl, setAnchorEl] = useState(null);
  
  return (
    <AppBar position="fixed" sx={{ 
      backgroundColor: '#fff', 
      color: '#000', 
      boxShadow: '0 1px 0 #eee', 
      height: '64px'
    }}>
      <Toolbar>
        <IconButton onClick={onToggleSidebar} sx={{ color: '#000', mr: 1 }}>
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000' }}>
          Admin Panel
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <NotificationButton />
        
        <IconButton sx={{ color: '#666' }} onClick={() => {
          localStorage.clear();
          window.location.href = "/login";
        }}>
          <LogoutIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};
export default MyAppBar;
