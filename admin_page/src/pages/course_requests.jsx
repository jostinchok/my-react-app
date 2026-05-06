import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:4002";

const panelSx = {
  borderRadius: "22px",
  border: "1px solid rgba(234, 214, 167, 0.86)",
  background: "linear-gradient(145deg, #fffdf4 0%, #fff8e6 100%)",
  boxShadow: "0 18px 45px rgba(255, 122, 26, 0.10)",
};

const buttonSx = {
  borderRadius: "12px",
  textTransform: "none",
  fontWeight: 900,
};

const CourseRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const requestJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  };

  const loadRequests = async () => {
    try {
      const data = await requestJson(`${API_BASE_URL}/api/enrollments/requests`);
      setRequests(data.requests || []);
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateRequest = async (requestId, status) => {
    try {
      await requestJson(`${API_BASE_URL}/api/enrollments/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadRequests();
      showMessage(`Request ${status}.`);
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  return (
    <Box className="admin-linked-page">
      <Box
        sx={{
          ...panelSx,
          mb: 3,
          p: { xs: 3, md: 4 },
          background:
            "linear-gradient(135deg, rgba(255,122,26,0.96) 0%, rgba(255,210,63,0.92) 48%, rgba(255,248,230,0.96) 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={3}>
          <Box>
            <Typography className="admin-dashboard-kicker">Enrollment review</Typography>
            <Typography variant="h3" sx={{ color: "#0b3b28", fontWeight: 950, lineHeight: 1 }}>
              Course requests
            </Typography>
            <Typography sx={{ mt: 1.4, color: "#274a35", fontWeight: 700, maxWidth: 760 }}>
              Review Park Guide course enrollment requests from the shared training database.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadRequests} sx={{ ...buttonSx, alignSelf: { xs: "stretch", md: "center" }, bgcolor: "#0b3b28" }}>
            Refresh
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2.4}>
        {requests.map((request) => (
          <Grid item xs={12} md={6} xl={4} key={request.id}>
            <Card sx={panelSx}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" gap={2}>
                  <Box>
                    <Chip label={request.status} size="small" sx={{ bgcolor: request.status === "approved" ? "#e8f8d9" : request.status === "rejected" ? "#ffe0d8" : "#fff3c4", color: "#0b3b28", fontWeight: 900, mb: 1 }} />
                    <Typography sx={{ color: "#0b3b28", fontWeight: 950 }}>{request.student_name}</Typography>
                    <Typography sx={{ color: "#607166", fontWeight: 700 }}>{request.email}</Typography>
                  </Box>
                  <Typography sx={{ color: "#8d4f12", fontWeight: 950 }}>{request.course_id}</Typography>
                </Stack>
                <Typography sx={{ mt: 2, color: "#0b3b28", fontWeight: 900 }}>{request.course_name}</Typography>
                <Typography sx={{ color: "#607166", fontWeight: 700 }}>
                  Requested: {request.requested_at ? String(request.requested_at).slice(0, 10) : "Not available"}
                </Typography>
                <Stack direction="row" gap={1} sx={{ mt: 2 }}>
                  <Button variant="contained" disabled={request.status === "approved"} onClick={() => updateRequest(request.id, "approved")} sx={{ ...buttonSx, bgcolor: "#0b3b28" }}>
                    Approve
                  </Button>
                  <Button variant="outlined" disabled={request.status === "rejected"} onClick={() => updateRequest(request.id, "rejected")} sx={{ ...buttonSx, color: "#b53421", borderColor: "#ff9b7e" }}>
                    Reject
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {requests.length === 0 && (
        <Box sx={{ ...panelSx, p: 4, textAlign: "center" }}>
          <Typography sx={{ color: "#0b3b28", fontWeight: 950 }}>No course requests yet</Typography>
          <Typography sx={{ mt: 1, color: "#607166", fontWeight: 700 }}>
            Requests will appear here when guides ask to join a course.
          </Typography>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3200}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CourseRequestsPage;
