import React, { useEffect, useRef, useState } from "react";
import mqtt from "mqtt";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const MQTT_BROKER_URL = "wss://broker.hivemq.com:8884/mqtt";
const MQTT_TOPIC = "esp32/sensor";

const formatDateTime = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

const AIDetection = () => {
  const mqttClientRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [lastMqttMessage, setLastMqttMessage] = useState("No trigger received yet");
  const [cameraStatus, setCameraStatus] = useState("Off");

  const [events, setEvents] = useState([
    { id: 1, time: "2026-04-03 14:20", location: "Bako Park", type: "Plant", severity: "Medium", status: "New", source: "Demo" },
    { id: 2, time: "2026-04-03 15:10", location: "Semenggoh", type: "Wildlife", severity: "High", status: "New", source: "Demo" },
    { id: 3, time: "2026-04-03 16:00", location: "Gunung Gading", type: "Trail", severity: "Low", status: "Resolved", source: "Demo" },
  ]);

  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [selectedEvent, setSelectedEvent] = useState(null);

  const startCamera = async () => {
    try {
      if (cameraStreamRef.current) {
        setCameraStatus("On");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraStatus("On");
      setSnackbar({ open: true, message: "Camera turned on" });
    } catch (error) {
      console.error("Camera error:", error);
      setCameraStatus("Camera error");
      setSnackbar({ open: true, message: "Camera permission denied or unavailable" });
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStatus("Off");
  };

  useEffect(() => {
    const clientId = `sfc_admin_${Math.random().toString(16).slice(2)}`;

    const client = mqtt.connect(MQTT_BROKER_URL, {
      clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 2000,
    });

    mqttClientRef.current = client;

    client.on("connect", () => {
      setConnectionStatus("Connected");
      client.subscribe(MQTT_TOPIC, (error) => {
        if (error) {
          setConnectionStatus("Subscribe failed");
          console.error("MQTT subscribe error:", error);
        } else {
          console.log(`Subscribed to ${MQTT_TOPIC}`);
        }
      });
    });

    client.on("reconnect", () => {
      setConnectionStatus("Reconnecting...");
    });

    client.on("error", (error) => {
      setConnectionStatus("Connection error");
      console.error("MQTT error:", error);
    });

    client.on("close", () => {
      setConnectionStatus("Disconnected");
    });

    client.on("message", async (topic, payload) => {
      const message = payload.toString();
      console.log("MQTT received:", topic, message);
      setLastMqttMessage(message);

      if (topic === MQTT_TOPIC && message === "Triggered!") {
        const newEvent = {
          id: Date.now(),
          time: formatDateTime(),
          location: "Camera Zone",
          type: "Object",
          severity: "High",
          status: "New",
          source: "ESP32 MQTT",
        };

        setEvents((prev) => [newEvent, ...prev]);
        setSnackbar({ open: true, message: "ESP32 trigger received. Turning on camera..." });

        await startCamera();
      }
    });

    return () => {
      client.end(true);
      stopCamera();
    };
  }, []);

  const markResolved = (id) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "Resolved" } : e)));
    setSnackbar({ open: true, message: "Event marked as resolved" });
  };

  const testTrigger = () => {
    const client = mqttClientRef.current;

    if (!client || !client.connected) {
      setSnackbar({ open: true, message: "MQTT is not connected yet" });
      return;
    }

    client.publish(MQTT_TOPIC, "Triggered!");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
        AI Abnormal Detection
      </Typography>

      <Paper sx={{ p: 2, mb: 2, backgroundColor: "#fce4ec" }}>
        <Typography variant="body2" color="text.secondary">
          Monitoring abnormal activities in protected areas: Plant, Wildlife, Trail, Object.
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Typography sx={{ fontWeight: "bold" }}>MQTT Status:</Typography>
          <Chip
            label={connectionStatus}
            color={connectionStatus === "Connected" ? "success" : "warning"}
            variant="outlined"
          />

          <Typography sx={{ fontWeight: "bold" }}>Camera:</Typography>
          <Chip
            label={cameraStatus}
            color={cameraStatus === "On" ? "success" : "default"}
            variant="outlined"
          />

          <Typography variant="body2" color="text.secondary">
            Topic: {MQTT_TOPIC}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Last message: {lastMqttMessage}
          </Typography>

          <Button variant="outlined" size="small" onClick={testTrigger}>
            Test Trigger
          </Button>

          <Button variant="outlined" size="small" onClick={startCamera}>
            Start Camera
          </Button>

          <Button variant="outlined" size="small" color="error" onClick={stopCamera}>
            Stop Camera
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Live Camera Preview
        </Typography>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            maxWidth: "500px",
            borderRadius: "12px",
            backgroundColor: "#000",
          }}
        />
      </Paper>

      {connectionStatus !== "Connected" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          The app is not connected to MQTT yet. Make sure the laptop has internet and HiveMQ websocket
          access is available.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.time}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>{event.type}</TableCell>
                <TableCell>{event.severity}</TableCell>
                <TableCell>{event.status}</TableCell>
                <TableCell>{event.source}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => setSelectedEvent(event)}>
                    <WarningIcon />
                  </IconButton>
                  <IconButton color="success" onClick={() => markResolved(event.id)}>
                    <CheckCircleIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)}>
        <DialogTitle>Event Details - {selectedEvent?.type}</DialogTitle>
        <DialogContent>
          <Typography>Time: {selectedEvent?.time}</Typography>
          <Typography>Location: {selectedEvent?.location}</Typography>
          <Typography>Severity: {selectedEvent?.severity}</Typography>
          <Typography>Status: {selectedEvent?.status}</Typography>
          <Typography>Source: {selectedEvent?.source}</Typography>

          <Typography sx={{ mt: 2, fontWeight: "bold" }}>AI Analysis</Typography>
          <Typography>Confidence Level: Pending</Typography>
          <Typography>Model: Waiting for camera + AI integration</Typography>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default AIDetection;