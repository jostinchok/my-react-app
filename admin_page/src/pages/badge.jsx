import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:4002";

const emptyBadgeForm = {
  name: "",
  type: "General",
  requireQuiz: true,
  requirePhysical: false,
};

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

const BadgeManagement = () => {
  const [badges, setBadges] = useState([]);
  const [students, setStudents] = useState([]);
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [badgeForm, setBadgeForm] = useState(emptyBadgeForm);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const eligibleStudents = useMemo(
    () => students.filter((student) => student.eligibility !== "Rejected"),
    [students]
  );

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const requestJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  };

  const loadData = async () => {
    try {
      const [badgeData, studentData] = await Promise.all([
        requestJson(`${API_BASE_URL}/api/admin/badges`),
        requestJson(`${API_BASE_URL}/api/students`),
      ]);
      setBadges(badgeData.badges || []);
      setStudents(studentData.students || []);
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createBadge = async () => {
    if (!badgeForm.name) {
      showMessage("Badge name is required.", "warning");
      return;
    }

    try {
      await requestJson(`${API_BASE_URL}/api/admin/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badgeForm),
      });
      setBadgeDialogOpen(false);
      setBadgeForm(emptyBadgeForm);
      await loadData();
      showMessage("Badge created.");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const deleteBadge = async (badge) => {
    if (badge.source === "module") {
      showMessage("Module-derived badges are managed from the Course module badge field.", "info");
      return;
    }
    if (!window.confirm("Delete this badge?")) return;

    try {
      await requestJson(`${API_BASE_URL}/api/admin/badges/${badge.id}`, { method: "DELETE" });
      await loadData();
      showMessage("Badge deleted.");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const openIssueDialog = (badge) => {
    setSelectedBadge(badge);
    setSelectedStudentId(eligibleStudents[0]?.id || "");
    setIssueDialogOpen(true);
  };

  const issueBadge = async () => {
    if (!selectedBadge || !selectedStudentId) {
      showMessage("Select a badge and guide first.", "warning");
      return;
    }

    try {
      await requestJson(`${API_BASE_URL}/api/admin/issue-badge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedStudentId,
          moduleId: selectedBadge.source === "module" ? selectedBadge.id : null,
          title: selectedBadge.name,
        }),
      });
      setIssueDialogOpen(false);
      showMessage("Badge certificate issued.");
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
            "linear-gradient(135deg, #0b3b28 0%, #175f3e 54%, rgba(168,230,74,0.52) 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={3}>
          <Box>
            <Typography sx={{ color: "#ffd23f", fontWeight: 950, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.8rem" }}>
              Certification
            </Typography>
            <Typography variant="h3" sx={{ color: "#fffdf4", fontWeight: 950, lineHeight: 1, mt: 1 }}>
              Badge management
            </Typography>
            <Typography sx={{ mt: 1.4, color: "#f2ffe6", fontWeight: 700, maxWidth: 760 }}>
              Create admin badges, review module-derived badges, and issue certificates to eligible Park Guides.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.2} alignSelf={{ xs: "stretch", md: "center" }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} sx={{ ...buttonSx, borderColor: "#fff8e6", color: "#fff8e6" }}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setBadgeDialogOpen(true)} sx={{ ...buttonSx, bgcolor: "#ff7a1a" }}>
              Add Badge
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={2.4}>
        {badges.map((badge) => (
          <Grid item xs={12} md={6} xl={4} key={`${badge.source || "admin"}-${badge.id}`}>
            <Card sx={panelSx}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
                  <Box>
                    <Chip
                      label={badge.source === "module" ? "Module badge" : "Admin badge"}
                      size="small"
                      sx={{ bgcolor: badge.source === "module" ? "#e8f8d9" : "#fff3c4", color: "#0b3b28", fontWeight: 900, mb: 1 }}
                    />
                    <Typography variant="h5" sx={{ color: "#0b3b28", fontWeight: 950 }}>{badge.name}</Typography>
                    <Typography sx={{ color: "#607166", fontWeight: 800 }}>Type: {badge.type || "General"}</Typography>
                  </Box>
                  <Stack direction="row" gap={0.5}>
                    <IconButton color="success" onClick={() => openIssueDialog(badge)}>
                      <MilitaryTechIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => deleteBadge(badge)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Stack>

                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                  <Chip label={badge.requireQuiz ? "Quiz required" : "No quiz gate"} size="small" sx={{ bgcolor: "#fff3c4", color: "#7a4710", fontWeight: 900 }} />
                  <Chip label={badge.requirePhysical ? "Physical required" : "No physical gate"} size="small" sx={{ bgcolor: "#e8f8d9", color: "#0b3b28", fontWeight: 900 }} />
                </Stack>

                <Typography sx={{ mt: 2, color: "#607166", fontWeight: 700 }}>
                  {eligibleStudents.length} active guide account{eligibleStudents.length === 1 ? "" : "s"} available for issue.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {badges.length === 0 && (
        <Box sx={{ ...panelSx, p: 4, textAlign: "center" }}>
          <Typography sx={{ color: "#0b3b28", fontWeight: 950 }}>No badges yet</Typography>
          <Typography sx={{ mt: 1, color: "#607166", fontWeight: 700 }}>
            Create a badge or add a badge name to a training module.
          </Typography>
        </Box>
      )}

      <Dialog open={badgeDialogOpen} onClose={() => setBadgeDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: "#0b3b28", fontWeight: 950 }}>Add Badge</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <TextField label="Badge Name" value={badgeForm.name} onChange={(event) => setBadgeForm((prev) => ({ ...prev, name: event.target.value }))} fullWidth />
          <TextField label="Type" value={badgeForm.type} onChange={(event) => setBadgeForm((prev) => ({ ...prev, type: event.target.value }))} fullWidth />
          <FormControlLabel
            control={<Checkbox checked={badgeForm.requireQuiz} onChange={(event) => setBadgeForm((prev) => ({ ...prev, requireQuiz: event.target.checked }))} />}
            label="Require quiz completion"
          />
          <FormControlLabel
            control={<Checkbox checked={badgeForm.requirePhysical} onChange={(event) => setBadgeForm((prev) => ({ ...prev, requirePhysical: event.target.checked }))} />}
            label="Require physical assessment"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setBadgeDialogOpen(false)} sx={buttonSx}>Cancel</Button>
          <Button variant="contained" onClick={createBadge} sx={{ ...buttonSx, bgcolor: "#ff7a1a" }}>
            Save Badge
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={issueDialogOpen} onClose={() => setIssueDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: "#0b3b28", fontWeight: 950 }}>Issue Badge</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <Typography sx={{ color: "#0b3b28", fontWeight: 900 }}>
            {selectedBadge?.name || "Selected badge"}
          </Typography>
          <TextField label="Guide" select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)} fullWidth>
            {eligibleStudents.map((student) => (
              <MenuItem key={student.id} value={student.id}>
                {student.name} · {student.email}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setIssueDialogOpen(false)} sx={buttonSx}>Cancel</Button>
          <Button variant="contained" onClick={issueBadge} sx={{ ...buttonSx, bgcolor: "#ff7a1a" }}>
            Issue Certificate
          </Button>
        </DialogActions>
      </Dialog>

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

export default BadgeManagement;
