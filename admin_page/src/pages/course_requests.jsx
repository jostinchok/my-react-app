import { authFetch } from "../utils/authFetch";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import RateReviewIcon from "@mui/icons-material/RateReview";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:4002";

const panelSx = {
  borderRadius: "22px",
  border: "1px solid #EADFBF",
  background: "linear-gradient(145deg, #FFFFFF 0%, #FFFCF2 100%)",
  boxShadow: "0 18px 45px rgba(255, 122, 26, 0.10)",
};

const buttonSx = {
  borderRadius: "12px",
  textTransform: "none",
  fontWeight: 900,
};

const statusFilters = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const normalizeStatus = (status) => String(status || "pending").toLowerCase();

const statusLabel = (status) => {
  const normalized = normalizeStatus(status);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const statusTone = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === "approved") {
    return {
      bg: "#e8f8d9",
      border: "rgba(167, 233, 87, 0.82)",
      color: "#173126",
      shadow: "0 14px 30px rgba(63, 174, 90, 0.10)",
    };
  }
  if (normalized === "rejected") {
    return {
      bg: "#ffe5dc",
      border: "rgba(255, 122, 86, 0.66)",
      color: "#9d2c19",
      shadow: "0 14px 30px rgba(157, 44, 25, 0.08)",
    };
  }
  return {
    bg: "#fff3c4",
    border: "rgba(255, 122, 26, 0.82)",
    color: "#7a4710",
    shadow: "0 18px 42px rgba(255, 122, 26, 0.18)",
  };
};

const formatRequestedDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium" }).format(date);
};

const CourseRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const requestJson = async (url, options = {}) => {
    const response = await authFetch(url, options);
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

  const summary = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((request) => normalizeStatus(request.status) === "pending").length,
      approved: requests.filter((request) => normalizeStatus(request.status) === "approved").length,
      rejected: requests.filter((request) => normalizeStatus(request.status) === "rejected").length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(
    () =>
      requests.filter((request) => {
        if (statusFilter === "all") return true;
        return normalizeStatus(request.status) === statusFilter;
      }),
    [requests, statusFilter]
  );

  const statCards = [
    { label: "Total requests", value: summary.total, detail: "All enrollment reviews", icon: <RateReviewIcon />, tone: "linear-gradient(135deg, #FF7A1A, #FFD84D)" },
    { label: "Pending", value: summary.pending, detail: "Needs admin action", icon: <PendingActionsIcon />, tone: "linear-gradient(135deg, #FF9F1C, #FFD84D)" },
    { label: "Approved", value: summary.approved, detail: "Granted course access", icon: <CheckCircleIcon />, tone: "linear-gradient(135deg, #DDFBD2, #A7E957)" },
    { label: "Rejected", value: summary.rejected, detail: "Declined requests", icon: <CancelIcon />, tone: "#b53421" },
  ];

  const filterCount = (filterKey) => {
    if (filterKey === "all") return summary.total;
    return summary[filterKey] || 0;
  };

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
          mb: 2.4,
          p: { xs: 3, md: 4 },
          background:
            "radial-gradient(circle at 90% 0%, rgba(167,233,87,0.44), transparent 17rem), linear-gradient(135deg, #FF8A1D 0%, #FFD84D 48%, #F3FFD4 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={3}>
          <Box>
            <Typography className="admin-dashboard-kicker">Enrollment review</Typography>
            <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1 }}>
              Course requests
            </Typography>
            <Typography sx={{ mt: 1.4, color: "#173126", fontWeight: 800, maxWidth: 760 }}>
              Review Park Guide enrollment requests, approve course access, and keep rejected records visible for demo audit.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadRequests}
            sx={{
              ...buttonSx,
              alignSelf: { xs: "stretch", md: "center" },
              background: "linear-gradient(135deg, #FF7A1A, #FFD84D)",
              color: "#173126",
              px: 3,
              py: 1.2,
              "&:hover": { background: "linear-gradient(135deg, #FF9F1C, #FFD84D)" },
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2.4 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.label}>
            <Card sx={{ ...panelSx, minHeight: 146, background: "#fffdf7" }}>
              <CardContent sx={{ height: "100%", display: "grid", gap: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography className="admin-dashboard-kicker" sx={{ mb: "0 !important", color: "#8d4f12 !important" }}>
                    {card.label}
                  </Typography>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "14px",
                      color: "#173126",
                      background: card.tone,
                      boxShadow: "0 10px 22px rgba(255, 122, 26, 0.14)",
                    }}
                  >
                    {card.icon}
                  </Box>
                </Stack>
                <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1 }}>
                  {card.value}
                </Typography>
                <Typography sx={{ color: "#607166", fontWeight: 800 }}>{card.detail}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ ...panelSx, p: { xs: 2, md: 2.4 }, mb: 2.4, background: "rgba(255, 253, 247, 0.96)" }}>
        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", lg: "center" }} gap={1.5}>
          <Box>
            <Typography className="admin-dashboard-kicker">Request queue</Typography>
              <Typography sx={{ color: "#173126", fontWeight: 950 }}>
              {filteredRequests.length} visible request{filteredRequests.length === 1 ? "" : "s"}
            </Typography>
          </Box>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {statusFilters.map((filter) => {
              const active = statusFilter === filter.key;
              return (
                <Chip
                  key={filter.key}
                  label={`${filter.label} ${filterCount(filter.key)}`}
                  clickable
                  onClick={() => setStatusFilter(filter.key)}
                  sx={{
                    minHeight: 36,
                    borderRadius: "999px",
                border: active ? "1px solid rgba(255,122,26,0.88)" : "1px solid #EADFBF",
                    bgcolor: active ? "#ff7a1a" : "#fffdf5",
                    color: "#173126",
                    fontWeight: 950,
                    boxShadow: active ? "0 10px 22px rgba(255, 122, 26, 0.18)" : "none",
                    "&:hover": { bgcolor: active ? "#ff8a20" : "#fff3c4" },
                  }}
                />
              );
            })}
          </Stack>
        </Stack>
      </Box>

      <Stack gap={1.6}>
        {filteredRequests.map((request) => {
          const normalizedStatus = normalizeStatus(request.status);
          const tone = statusTone(request.status);
          const isPending = normalizedStatus === "pending";
          return (
            <Card
              key={request.id}
              sx={{
                ...panelSx,
                borderColor: tone.border,
                background: isPending
                  ? "linear-gradient(135deg, #FFFFFF 0%, #FFF8D6 100%)"
                  : "linear-gradient(145deg, #FFFFFF 0%, #FFFCF2 100%)",
                boxShadow: tone.shadow,
                overflow: "hidden",
              }}
            >
              <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
                <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2.2}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1.2 }}>
                      <Chip
                        label={statusLabel(request.status)}
                        size="small"
                        sx={{ bgcolor: tone.bg, color: tone.color, border: `1px solid ${tone.border}`, fontWeight: 950 }}
                      />
                      {isPending && (
                        <Chip
                          label="Needs review"
                          size="small"
                          sx={{ bgcolor: "#ff7a1a", color: "#173126", fontWeight: 950 }}
                        />
                      )}
                    </Stack>
                    <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1.1 }}>
                      {request.student_name || "Unnamed guide"}
                    </Typography>
                    <Typography sx={{ mt: 0.7, color: "#53685a", fontWeight: 800, wordBreak: "break-word" }}>
                      {request.email || "No email recorded"}
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems={{ xs: "stretch", lg: "center" }}>
                    {normalizedStatus === "approved" ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Approved"
                        sx={{
                          minHeight: 38,
                          borderRadius: "12px",
                          bgcolor: "#DDFBD2",
                          color: "#173126",
                          border: "1px solid #A7E957",
                          fontWeight: 950,
                          "& .MuiChip-icon": { color: "#173126" },
                        }}
                      />
                    ) : (
                      <Button
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => updateRequest(request.id, "approved")}
                        sx={{
                          ...buttonSx,
                          bgcolor: "#DDFBD2",
                          color: "#173126",
                          border: "1px solid #A7E957",
                          "&:hover": { bgcolor: "#A7E957" },
                        }}
                      >
                        Approve
                      </Button>
                    )}

                    {normalizedStatus === "rejected" ? (
                      <Chip
                        icon={<CancelIcon />}
                        label="Rejected"
                        sx={{
                          minHeight: 38,
                          borderRadius: "12px",
                          bgcolor: "#ffe5dc",
                          color: "#9d2c19",
                          border: "1px solid #ff9b7e",
                          fontWeight: 950,
                          "& .MuiChip-icon": { color: "#9d2c19" },
                        }}
                      />
                    ) : (
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => updateRequest(request.id, "rejected")}
                        sx={{
                          ...buttonSx,
                          color: "#9d2c19",
                          borderColor: "#ff9b7e",
                          bgcolor: "#fff7ef",
                          "&:hover": { borderColor: "#ff7a1a", bgcolor: "#ffe8df" },
                        }}
                      >
                        Reject
                      </Button>
                    )}
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2, borderColor: "rgba(234, 214, 167, 0.86)" }} />

                <Grid container spacing={1.2}>
                  <Grid item xs={12} sm={6} lg={3}>
                    <Box sx={{ p: 1.4, borderRadius: "14px", bgcolor: "#fffaf0", border: "1px solid rgba(234, 214, 167, 0.82)" }}>
                      <Typography sx={{ color: "#8d4f12", fontSize: "0.74rem", fontWeight: 950, textTransform: "uppercase" }}>
                        Course ID
                      </Typography>
                      <Typography sx={{ mt: 0.4, color: "#173126", fontWeight: 950 }}>{request.course_id || "Not set"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} lg={4}>
                    <Box sx={{ p: 1.4, borderRadius: "14px", bgcolor: "#fffaf0", border: "1px solid rgba(234, 214, 167, 0.82)" }}>
                      <Typography sx={{ color: "#8d4f12", fontSize: "0.74rem", fontWeight: 950, textTransform: "uppercase" }}>
                        Course name
                      </Typography>
                      <Typography sx={{ mt: 0.4, color: "#173126", fontWeight: 950 }}>{request.course_name || "Unnamed course"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} lg={3}>
                    <Box sx={{ p: 1.4, borderRadius: "14px", bgcolor: "#fffaf0", border: "1px solid rgba(234, 214, 167, 0.82)" }}>
                      <Typography sx={{ color: "#8d4f12", fontSize: "0.74rem", fontWeight: 950, textTransform: "uppercase" }}>
                        Requested date
                      </Typography>
                      <Typography sx={{ mt: 0.4, color: "#173126", fontWeight: 950 }}>
                        {formatRequestedDate(request.requested_at)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} lg={2}>
                    <Box sx={{ p: 1.4, borderRadius: "14px", bgcolor: tone.bg, border: `1px solid ${tone.border}` }}>
                      <Typography sx={{ color: "#8d4f12", fontSize: "0.74rem", fontWeight: 950, textTransform: "uppercase" }}>
                        Current status
                      </Typography>
                      <Typography sx={{ mt: 0.4, color: tone.color, fontWeight: 950 }}>
                        {statusLabel(request.status)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {filteredRequests.length === 0 && (
        <Box sx={{ ...panelSx, p: 4, mt: 2.4, textAlign: "center", background: "#fffdf7" }}>
          <Typography sx={{ color: "#173126", fontWeight: 950 }}>
            {requests.length === 0 ? "No course requests yet" : `No ${statusFilter} requests`}
          </Typography>
          <Typography sx={{ mt: 1, color: "#607166", fontWeight: 800 }}>
            {requests.length === 0
              ? "Requests will appear here when guides ask to join a course."
              : "Switch filters to review the rest of the enrollment queue."}
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
