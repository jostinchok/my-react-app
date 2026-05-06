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
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupsIcon from "@mui/icons-material/Groups";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import RefreshIcon from "@mui/icons-material/Refresh";
import SchoolIcon from "@mui/icons-material/School";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:4002";

const emptyBadgeForm = {
  name: "",
  type: "General",
  requireQuiz: true,
  requirePhysical: false,
};

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

const menuProps = {
  PaperProps: {
    sx: {
      maxHeight: 330,
      borderRadius: "14px",
      border: "1px solid rgba(234, 214, 167, 0.86)",
      boxShadow: "0 18px 38px rgba(255, 122, 26, 0.10)",
    },
  },
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

  const summary = useMemo(
    () => ({
      total: badges.length,
      module: badges.filter((badge) => badge.source === "module").length,
      admin: badges.filter((badge) => badge.source !== "module").length,
      eligible: eligibleStudents.length,
    }),
    [badges, eligibleStudents.length]
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

  const statCards = [
    { label: "Total badges", value: summary.total, detail: "Module and admin badges", icon: <WorkspacePremiumIcon />, tone: "linear-gradient(135deg, #FF7A1A, #FFD84D)" },
    { label: "Module badges", value: summary.module, detail: "Managed from modules", icon: <SchoolIcon />, tone: "linear-gradient(135deg, #DDFBD2, #A7E957)" },
    { label: "Admin badges", value: summary.admin, detail: "Created on this page", icon: <AutoAwesomeIcon />, tone: "linear-gradient(135deg, #FF9F1C, #FFD84D)" },
    { label: "Eligible guides", value: summary.eligible, detail: "Available for certificates", icon: <GroupsIcon />, tone: "linear-gradient(135deg, #F6FFE8, #DDFBD2)" },
  ];

  return (
    <Box className="admin-linked-page">
      <Box
        sx={{
          ...panelSx,
          mb: 2.4,
          p: { xs: 3, md: 4 },
          background:
            "radial-gradient(circle at 88% 0%, rgba(167,233,87,0.46), transparent 18rem), linear-gradient(135deg, #FF9F1C 0%, #FFD84D 45%, #DDFBD2 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={3}>
          <Box>
            <Typography sx={{ color: "#8d4f12", fontWeight: 950, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.8rem" }}>
              Certification
            </Typography>
            <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1, mt: 1 }}>
              Badge management
            </Typography>
            <Typography sx={{ mt: 1.4, color: "#173126", fontWeight: 800, maxWidth: 760 }}>
              Create admin badges, review module-derived badges, and issue certificates to eligible Park Guides.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.2} alignSelf={{ xs: "stretch", md: "center" }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              sx={{
                ...buttonSx,
                borderColor: "#EADFBF",
                color: "#173126",
                bgcolor: "rgba(255, 253, 245, 0.68)",
                px: 2.4,
                "&:hover": { borderColor: "#A7E957", bgcolor: "#F6FFE8" },
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setBadgeDialogOpen(true)}
              sx={{
                ...buttonSx,
                background: "linear-gradient(135deg, #FF7A1A, #FFD84D)",
                color: "#173126",
                px: 2.4,
                "&:hover": { background: "linear-gradient(135deg, #FF9F1C, #FFD84D)" },
              }}
            >
              Add Badge
            </Button>
          </Stack>
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

      <Grid container spacing={2.4}>
        {badges.map((badge) => {
          const moduleBadge = badge.source === "module";
          return (
            <Grid item xs={12} md={6} xl={4} key={`${badge.source || "admin"}-${badge.id}`}>
              <Card
                sx={{
                  ...panelSx,
                  minHeight: 340,
                  borderColor: moduleBadge ? "rgba(122, 181, 66, 0.62)" : "rgba(255, 122, 26, 0.72)",
                  background: moduleBadge
                    ? "linear-gradient(145deg, #fffdf7 0%, #f2fbdf 100%)"
                    : "linear-gradient(145deg, #fffdf7 0%, #fff0d6 100%)",
                  overflow: "hidden",
                }}
              >
                <CardContent sx={{ p: { xs: 2.2, md: 2.6 } }}>
                  <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
                    <Stack direction="row" gap={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          display: "grid",
                          placeItems: "center",
                          flex: "0 0 auto",
                          borderRadius: "16px",
                          color: "#173126",
                          background: moduleBadge
                            ? "linear-gradient(135deg, #DDFBD2, #A7E957)"
                            : "linear-gradient(135deg, #FF7A1A, #FFD84D)",
                          boxShadow: "0 14px 28px rgba(255, 122, 26, 0.12)",
                        }}
                      >
                        <MilitaryTechIcon />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Chip
                          label={moduleBadge ? "Module badge" : "Admin badge"}
                          size="small"
                          sx={{
                            bgcolor: moduleBadge ? "#e8f8d9" : "#fff3c4",
                            color: "#173126",
                            border: moduleBadge ? "1px solid #bde58d" : "1px solid #f3d57b",
                            fontWeight: 950,
                            mb: 1,
                          }}
                        />
                        <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1.12 }}>
                          {badge.name}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>

                  <Typography sx={{ mt: 1.5, color: "#53685a", fontWeight: 850 }}>
                    Type: {badge.type || "General"}
                  </Typography>
                  <Typography sx={{ mt: 0.8, color: moduleBadge ? "#3FAE5A" : "#8d4f12", fontWeight: 900 }}>
                    {moduleBadge
                      ? "Managed from module settings"
                      : "Admin-created badge, editable by deleting and recreating"}
                  </Typography>

                  <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                    <Chip label={badge.requireQuiz ? "Quiz required" : "No quiz gate"} size="small" sx={{ bgcolor: "#fff3c4", color: "#7a4710", fontWeight: 900 }} />
                    <Chip label={badge.requirePhysical ? "Physical required" : "No physical gate"} size="small" sx={{ bgcolor: "#e8f8d9", color: "#173126", fontWeight: 900 }} />
                    <Chip label={`${eligibleStudents.length} eligible guides`} size="small" sx={{ bgcolor: "#edf7ff", color: "#1a4e8a", fontWeight: 900 }} />
                  </Stack>

                  <Divider sx={{ my: 2, borderColor: "rgba(234, 214, 167, 0.86)" }} />

                  <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                    <Button
                      variant="contained"
                      startIcon={<MilitaryTechIcon />}
                      onClick={() => openIssueDialog(badge)}
                      sx={{
                        ...buttonSx,
                        flex: 1.2,
                        background: "linear-gradient(135deg, #FF7A1A, #FFD84D)",
                        color: "#173126",
                        "&:hover": { background: "linear-gradient(135deg, #FF9F1C, #FFD84D)" },
                      }}
                    >
                      Issue Certificate
                    </Button>
                    {moduleBadge ? (
                      <Button
                        component="span"
                        variant="outlined"
                        startIcon={<SchoolIcon />}
                        sx={{
                          ...buttonSx,
                          flex: 1,
                          borderColor: "#D8EAC7",
                          bgcolor: "#F6FFE8",
                          color: "#173126",
                          pointerEvents: "none",
                        }}
                      >
                        Course module controls
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => deleteBadge(badge)}
                        sx={{ ...buttonSx, flex: 1, bgcolor: "#fff7ef", borderColor: "#ff9b7e", color: "#9d2c19" }}
                      >
                        Delete Badge
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {badges.length === 0 && (
        <Box sx={{ ...panelSx, p: 4, mt: 2.4, textAlign: "center", background: "#fffdf7" }}>
          <Typography sx={{ color: "#173126", fontWeight: 950 }}>No badges yet</Typography>
          <Typography sx={{ mt: 1, color: "#607166", fontWeight: 800 }}>
            Create an admin badge or add a badge name to a training module.
          </Typography>
        </Box>
      )}

      <Dialog
        open={badgeDialogOpen}
        onClose={() => setBadgeDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "22px",
            border: "1px solid rgba(234, 214, 167, 0.9)",
            background: "#fffdf7",
            boxShadow: "0 22px 60px rgba(255, 122, 26, 0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#173126",
            fontWeight: 950,
            pb: 1,
            background: "linear-gradient(135deg, #FFF8D6, #F3FFD4, #FFFFFF)",
            borderBottom: "1px solid rgba(234, 214, 167, 0.86)",
          }}
        >
          Add Badge
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "20px !important" }}>
          <TextField label="Badge Name" value={badgeForm.name} onChange={(event) => setBadgeForm((prev) => ({ ...prev, name: event.target.value }))} fullWidth />
          <TextField label="Type" value={badgeForm.type} onChange={(event) => setBadgeForm((prev) => ({ ...prev, type: event.target.value }))} fullWidth />
          <FormControlLabel
            control={<Checkbox checked={badgeForm.requireQuiz} onChange={(event) => setBadgeForm((prev) => ({ ...prev, requireQuiz: event.target.checked }))} />}
            label="Require quiz completion"
            sx={{ color: "#173126", fontWeight: 800 }}
          />
          <FormControlLabel
            control={<Checkbox checked={badgeForm.requirePhysical} onChange={(event) => setBadgeForm((prev) => ({ ...prev, requirePhysical: event.target.checked }))} />}
            label="Require physical assessment"
            sx={{ color: "#173126", fontWeight: 800 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setBadgeDialogOpen(false)} sx={{ ...buttonSx, color: "#173126" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={createBadge} sx={{ ...buttonSx, background: "linear-gradient(135deg, #FF7A1A, #FFD84D)", color: "#173126" }}>
            Save Badge
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={issueDialogOpen}
        onClose={() => setIssueDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "22px",
            border: "1px solid rgba(234, 214, 167, 0.9)",
            background: "#fffdf7",
            boxShadow: "0 22px 60px rgba(255, 122, 26, 0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#173126",
            fontWeight: 950,
            pb: 1,
            background: "linear-gradient(135deg, #FFF8D6, #F3FFD4, #FFFFFF)",
            borderBottom: "1px solid rgba(234, 214, 167, 0.86)",
          }}
        >
          Issue Certificate
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "20px !important" }}>
          <Box sx={{ p: 2, borderRadius: "16px", bgcolor: "#FFF9E8", border: "1px solid #EADFBF" }}>
            <Typography sx={{ color: "#8d4f12", fontWeight: 950, textTransform: "uppercase", fontSize: "0.75rem" }}>
              Selected badge
            </Typography>
            <Typography sx={{ color: "#173126", fontWeight: 950, fontSize: "1.15rem" }}>
              {selectedBadge?.name || "Selected badge"}
            </Typography>
          </Box>
          <TextField
            label="Guide"
            select
            value={selectedStudentId}
            onChange={(event) => setSelectedStudentId(event.target.value)}
            SelectProps={{ MenuProps: menuProps }}
            fullWidth
          >
            {eligibleStudents.map((student) => (
              <MenuItem key={student.id} value={student.id}>
                {student.name} - {student.email}
              </MenuItem>
            ))}
          </TextField>
          {eligibleStudents.length === 0 && (
            <Box sx={{ p: 2, borderRadius: "14px", bgcolor: "#fff3c4", border: "1px solid #f3d57b" }}>
              <Typography sx={{ color: "#7a4710", fontWeight: 900 }}>
                No eligible guide accounts are available.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setIssueDialogOpen(false)} sx={{ ...buttonSx, color: "#173126" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={issueBadge}
            disabled={!selectedStudentId}
            sx={{
              ...buttonSx,
              bgcolor: "#DDFBD2",
              color: "#173126",
              border: "1px solid #A7E957",
              "&:hover": { bgcolor: "#A7E957" },
            }}
          >
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
