import React, { useState } from "react";
import {Box, Typography, Button, Card, CardContent, Chip, List, ListItem, ListItemText, Snackbar, Alert, Paper, IconButton, Dialog, Select, MenuItem } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloseIcon from "@mui/icons-material/Close";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const AIDetection = () => {
  const [events, setEvents] = useState([
    {
      id: 1,
      placeholder: "Unusual Plant Growth",
      time: "2026-04-03 14:20",
      location: "Bako Park",
      guideId: "G-101",
      gps: "1.732,110.345",
      action: "Inspect",
      alert: "Medium",
      image: "/images/detect1.jpeg",
      status: "pending",
      assigned: "",
    },
    {
      id: 2,
      placeholder: "Wildlife Movement",
      time: "2026-04-03 15:10",
      location: "Semenggoh",
      guideId: "G-102",
      gps: "1.456,110.234",
      action: "Immediate Response",
      alert: "High",
      image: "/images/detect2.jpeg",
      status: "pending",
      assigned: "",
    },
    {
      id: 3,
      placeholder: "Trail Obstruction",
      time: "2026-04-03 16:00",
      location: "Gunung Gading",
      guideId: "G-103",
      gps: "1.65,109.95",
      action: "Monitor",
      alert: "Low",
      image: "/images/detect3.jpeg",
      status: "pending",
      assigned: "",
    },
  ]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterAlert, setFilterAlert] = useState("All");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [openImage, setOpenImage] = useState(false);
  const [openMap, setOpenMap] = useState(false);

  const getAlertColor = (level) => {
    switch (level) {
      case "High":
        return "error";
      case "Medium":
        return "warning";
      case "Low":
        return "success";
      default:
        return "default";
    }
  };

  const parseGps = (gps) => gps.split(",").map(Number);

  const filteredEvents = events.filter((event) => {
    return filterAlert === "All" || event.alert === filterAlert;
  });

  const handleResolve = (id) => {
    const updatedEvents = events.map((ev) =>
      ev.id === id ? { ...ev, status: "resolved" } : ev
    );
    setEvents(updatedEvents);
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent({ ...selectedEvent, status: "resolved" });
    }
  };

  const handleAssign = (id, person) => {
    const updatedEvents = events.map((ev) =>
      ev.id === id ? { ...ev, assigned: person } : ev
    );
    setEvents(updatedEvents);
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent({ ...selectedEvent, assigned: person });
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    if (event.alert === "High") {
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ p: 3, height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 顶部标题和筛选 */}
      <Box sx={{ mb: 3, flexShrink: 0 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
          AI Abnormal Detection Dashboard
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {["All", "High", "Medium", "Low"].map((level) => (
            <Button
              key={level}
              variant={filterAlert === level ? "contained" : "outlined"}
              onClick={() => setFilterAlert(level)}
              sx={{ textTransform: "none" }}
            >
              {level === "High" ? <WarningAmberIcon sx={{ mr: 1, fontSize: "1.2rem" }} /> : null}
              {level}
            </Button>
          ))}
        </Box>
      </Box>

      {/* 主体内容：左右分栏 */}
      <Box sx={{ display: "flex", gap: 4, flex: 1, height: "100%" }}>
        {/* 左侧列表 */}
        <Box sx={{ flex: 0.4, overflowY: "auto", pr: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredEvents.map((event) => (
            <Card
              key={event.id}
              onClick={() => handleSelectEvent(event)}
              sx={{
                display: "flex",
                cursor: "pointer",
                transition: "all 0.2s",
                borderLeft: `5px solid`,
                borderColor: getAlertColor(event.alert),
                bgcolor: selectedEvent?.id === event.id ? "#e3f2fd" : "white",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box
                component="img"
                src={event.image}
                sx={{
                  width: 100,
                  objectFit: "cover",
                  borderTopLeftRadius: 4,
                  borderBottomLeftRadius: 4,
                }}
              />
              <CardContent sx={{ flex: "1 0 auto", py: 1.5, px: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {event.placeholder}
                  </Typography>
                  <Chip label={event.alert} size="small" color={getAlertColor(event.alert)} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {event.location} • {event.time}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <Chip icon={<PersonIcon />} label={event.guideId} size="small" variant="outlined" />
                  <Chip label={event.status} size="small" color={event.status === "resolved" ? "success" : "default"} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* 右侧详情 */}
        <Paper
          elevation={3}
          sx={{
            flex: 0.6,
            p: 3,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            borderRadius: 3,
          }}
        >
          {selectedEvent ? (
            <>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LocationOnIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    {selectedEvent.placeholder}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, flex: 1, minHeight: 0 }}>
                {/* 左侧图片 */}
                <Box sx={{ borderRadius: 2, p: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 2 }}>
                    Visual Feed
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      position: "relative",
                      borderRadius: 1,
                      overflow: "hidden",
                      cursor: "pointer",
                      "&:hover .overlay": { opacity: 1 },
                    }}
                    onClick={() => setOpenImage(true)}
                  >
                                        <img
                      src={selectedEvent.image}
                      alt="Event"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s"
                      }}
                    />
                    {/* 悬停遮罩 */}
                    <Box
                      className="overlay"
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        bgcolor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        opacity: 0,
                        transition: "opacity 0.3s"
                      }}
                    >
                      <Typography variant="body2" color="white">Click to Enlarge</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* 右侧地图 */}
                <Box sx={{ borderRadius: 2, p: 2, overflow: "hidden" }}>
                  <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 2 }}>
                    Location Map
                  </Typography>
                  <MapContainer
                    key={selectedEvent.id}
                    center={parseGps(selectedEvent.gps)}
                    zoom={13}
                    style={{ height: "100%", width: "100%", borderRadius: 8 }}
                    onClick={() => setOpenMap(true)}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={parseGps(selectedEvent.gps)}>
                      <Popup>{selectedEvent.location}</Popup>
                    </Marker>
                  </MapContainer>
                </Box>
              </Box>

              {/* 详细信息列表 */}
              <List dense sx={{ mb: 3, bgcolor: "#fafafa", borderRadius: 2 }}>
                <ListItem><ListItemText primary="Timeline" secondary={selectedEvent.time} /></ListItem>
                <ListItem><ListItemText primary="GPS Coordinates" secondary={selectedEvent.gps} /></ListItem>
                <ListItem><ListItemText primary="Guide ID" secondary={selectedEvent.guideId} /></ListItem>
                <ListItem><ListItemText primary="Assigned Responsible" secondary={selectedEvent.assigned || "Unassigned"} /></ListItem>
              </List>

              {/* 底部操作栏 */}
              <Box sx={{ mt: "auto", pt: 2, borderTop: "1px solid #eee" }}>
                {selectedEvent.status === "pending" ? (
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleResolve(selectedEvent.id)}
                    >
                      Mark as Resolved
                    </Button>

                    {/* 下拉框分配负责人 */}
                    <Select
                      value={selectedEvent.assigned || ""}
                      onChange={(e) => handleAssign(selectedEvent.id, e.target.value)}
                      displayEmpty
                      fullWidth
                    >
                      <MenuItem value="">
                        <em>Unassigned</em>
                      </MenuItem>
                      <MenuItem value="Admin A">Admin A</MenuItem>
                      <MenuItem value="Admin B">Admin B</MenuItem>
                      <MenuItem value="Guide G-101">Guide G-101</MenuItem>
                      <MenuItem value="Guide G-102">Guide G-102</MenuItem>
                    </Select>
                  </Box>
                ) : (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Incident Resolved"
                    color="success"
                    variant="outlined"
                    sx={{ width: "100%", py: 2 }}
                  />
                )}
              </Box>
            </>
          ) : (
            <Box sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "text.secondary"
            }}>
              <WarningAmberIcon sx={{ fontSize: 80, opacity: 0.2, mb: 2 }} />
              <Typography variant="h6">No Selection</Typography>
              <Typography>Select an incident from the list to view details</Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* 图片全屏 Dialog */}
      <Dialog open={openImage} onClose={() => setOpenImage(false)} fullScreen>
        <Box sx={{ bgcolor: "black", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <IconButton
            onClick={() => setOpenImage(false)}
            sx={{ position: "absolute", top: 10, right: 10, color: "white", zIndex: 10 }}
          >
            <CloseIcon />
          </IconButton>
          <TransformWrapper>
            <TransformComponent>
              <img
                src={selectedEvent?.image}
                alt="Event"
                style={{ maxHeight: "90vh", maxWidth: "90vw", borderRadius: 8 }}
              />
            </TransformComponent>
          </TransformWrapper>
        </Box>
      </Dialog>

      {/* 地图全屏 Dialog */}
      <Dialog open={openMap} onClose={() => setOpenMap(false)} fullScreen>
        <Box sx={{ minHeight: 300, p: 2, height: "100vh" }}>
          <IconButton
            onClick={() => setOpenMap(false)}
            sx={{ position: "absolute", top: 10, right: 10, color: "white", zIndex: 10, bgcolor: "#1e293b" }}
          >
            <CloseIcon />
          </IconButton>
          {selectedEvent?.gps && (
            <MapContainer
              center={parseGps(selectedEvent.gps)}
              zoom={13}
              style={{ height: "100%", width: "100%", borderRadius: 12 }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={parseGps(selectedEvent.gps)}>
                <Popup>{selectedEvent?.location}</Popup>
              </Marker>
            </MapContainer>
          )}
        </Box>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
        <Alert onClose={() => setSnackbarOpen(false)} severity="error" sx={{ width: "100%" }}>
            High Alert Notification!
        </Alert>
    </Snackbar>

    </Box>
  );
};

export default AIDetection;