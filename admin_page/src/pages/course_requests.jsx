import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4001";

const statusColor = {
  pending: "warning",
  approved: "success",
  declined: "error",
};

const CourseRequestsPage = () => {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [remarksById, setRemarksById] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/enrollments/requests?status=${encodeURIComponent(statusFilter)}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load registration requests.");
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort((a, b) => {
        const da = new Date(a.requested_at || 0).getTime();
        const db = new Date(b.requested_at || 0).getTime();
        return db - da;
      }),
    [requests]
  );

  const reviewRequest = async (request, decision) => {
    setActingId(request.enrollment_id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/enrollments/${request.enrollment_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decision,
          remarks: remarksById[request.enrollment_id] || "",
          reviewerId: 1,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update request.");
      showMessage(
        decision === "approved"
          ? "Registration approved and user notified."
          : "Registration declined and user notified."
      );
      await loadRequests();
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setActingId(null);
    }
  };

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "background.default", p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Course Registration Requests
          </Typography>
          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            Review park guide course registration requests and approve or decline enrollment.
          </Typography>
        </Box>
        <Select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 160, bgcolor: "background.paper" }}
        >
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="declined">Declined</MenuItem>
          <MenuItem value="all">All</MenuItem>
        </Select>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading requests...</Typography>
      ) : sortedRequests.length === 0 ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ py: 5, textAlign: "center" }}>
            <Typography sx={{ fontWeight: 700 }}>No requests found.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {sortedRequests.map((req) => (
            <Card key={req.enrollment_id} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                  <Box sx={{ minWidth: 240 }}>
                    <Typography sx={{ fontWeight: 800 }}>{req.course_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Course ID: {req.course_id} • {req.total_contact_hours} hours
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {req.start_date || "-"} to {req.end_date || "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 240 }}>
                    <Typography sx={{ fontWeight: 700 }}>{req.user_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {req.user_email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Requested: {req.requested_at ? new Date(req.requested_at).toLocaleString() : "-"}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    color={statusColor[req.status] || "default"}
                    label={String(req.status || "pending").toUpperCase()}
                    sx={{ fontWeight: 700, alignSelf: "flex-start" }}
                  />
                </Box>

                {(statusFilter === "pending" || req.status === "pending") && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Admin remark (optional)"
                      value={remarksById[req.enrollment_id] || ""}
                      onChange={(e) =>
                        setRemarksById((prev) => ({ ...prev, [req.enrollment_id]: e.target.value }))
                      }
                    />
                    <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        disabled={actingId === req.enrollment_id}
                        onClick={() => reviewRequest(req, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CloseIcon />}
                        disabled={actingId === req.enrollment_id}
                        onClick={() => reviewRequest(req, "declined")}
                      >
                        Decline
                      </Button>
                    </Box>
                  </Box>
                )}

                {req.status !== "pending" && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Reviewed: {req.reviewed_at ? new Date(req.reviewed_at).toLocaleString() : "-"}
                    {req.remarks ? ` • Remark: ${req.remarks}` : ""}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3200}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CourseRequestsPage;
