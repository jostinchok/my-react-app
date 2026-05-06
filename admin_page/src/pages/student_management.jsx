import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GroupsIcon from "@mui/icons-material/Groups";
import RefreshIcon from "@mui/icons-material/Refresh";
import { buildGuideIdentity } from "../data/roleProfiles";

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:4002";

const emptyStudentForm = {
  id: "",
  name: "",
  phone: "",
  email: "",
  module: "None",
  eligibility: "Approved",
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

const assignedToCourse = (student) => Boolean(student.module && student.module !== "None");

const emptyCanvasProgress = {
  completedCanvasItems: 0,
  totalAvailableItems: 0,
  completionPercent: 0,
  quizAttempts: 0,
  latestQuizScore: null,
  latestQuizLabel: "No quiz attempts yet",
  latestQuizAt: null,
};

const normalizeCanvasProgress = (progress = {}) => {
  const latestScoreValue = progress.latestQuizScore ?? progress.latest_quiz_score ?? null;
  const latestQuizScore = latestScoreValue === null || latestScoreValue === undefined ? null : Number(latestScoreValue);

  return {
    completedCanvasItems: Number(progress.completedCanvasItems ?? progress.completed_canvas_items ?? 0),
    totalAvailableItems: Number(progress.totalAvailableItems ?? progress.total_available_items ?? 0),
    completionPercent: Number(progress.completionPercent ?? progress.completion_percent ?? 0),
    quizAttempts: Number(progress.quizAttempts ?? progress.quiz_attempts ?? 0),
    latestQuizScore: Number.isFinite(latestQuizScore) ? latestQuizScore : null,
    latestQuizLabel: progress.latestQuizLabel || progress.latest_quiz_label || "No quiz attempts yet",
    latestQuizAt: progress.latestQuizAt || progress.latest_quiz_at || null,
    modules: Array.isArray(progress.modules) ? progress.modules : [],
  };
};

const attachCanvasProgress = (students, progressPayload = {}) => {
  const progressByGuide = new Map(
    (progressPayload.guides || []).map((guide) => [
      String(guide.userId ?? guide.user_id ?? guide.guideId ?? guide.guide_id ?? ""),
      normalizeCanvasProgress(guide),
    ])
  );

  return students.map((student) => ({
    ...student,
    canvasProgress: progressByGuide.get(String(student.id)) || { ...emptyCanvasProgress },
  }));
};

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [canvasProgressSummary, setCanvasProgressSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [loading, setLoading] = useState(false);
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

  const loadData = async () => {
    setLoading(true);
    try {
      const progressRequest = requestJson(`${API_BASE_URL}/api/admin/canvas-progress-summary`).catch((error) => ({
        ok: false,
        fallback: true,
        message: error.message,
        summary: {},
        guides: [],
      }));
      const [studentData, courseData, progressData] = await Promise.all([
        requestJson(`${API_BASE_URL}/api/students`),
        requestJson(`${API_BASE_URL}/api/courses`),
        progressRequest,
      ]);
      setStudents(attachCanvasProgress(studentData.students || [], progressData));
      setCourses(courseData.courses || []);
      setCanvasProgressSummary(progressData);
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const moduleOptions = useMemo(() => ["None", ...courses.map((course) => course.course_name)], [courses]);

  const summary = useMemo(
    () => ({
      total: students.length,
      approved: students.filter((student) => student.eligibility === "Approved").length,
      rejected: students.filter((student) => student.eligibility === "Rejected").length,
      assigned: students.filter(assignedToCourse).length,
    }),
    [students]
  );
  const canvasTotals = canvasProgressSummary?.summary || {};

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const matchesFilter =
          filter === "all" ||
          student.module === filter ||
          student.eligibility === filter ||
          (filter === "assigned" && assignedToCourse(student)) ||
          (filter === "unassigned" && !assignedToCourse(student));
        const identity = buildGuideIdentity(student);
        const text = `${student.name || ""} ${student.email || ""} ${student.phone || ""} ${student.module || ""} ${identity.guideId} ${identity.trainingId}`.toLowerCase();
        return matchesFilter && text.includes(searchTerm.toLowerCase());
      }),
    [filter, searchTerm, students]
  );

  const statCards = [
    { label: "Total guides", value: summary.total, detail: "Guide account records", icon: <GroupsIcon />, tone: "linear-gradient(135deg, #FF7A1A, #FFD84D)" },
    { label: "Approved / active", value: summary.approved, detail: "Ready for course access", icon: <CheckCircleIcon />, tone: "linear-gradient(135deg, #DDFBD2, #A7E957)" },
    { label: "Rejected / inactive", value: summary.rejected, detail: "Not eligible for issue", icon: <CancelIcon />, tone: "#b53421" },
    { label: "Assigned to course", value: summary.assigned, detail: "Has a linked course", icon: <AssignmentTurnedInIcon />, tone: "linear-gradient(135deg, #FF9F1C, #FFD84D)" },
    {
      label: "Canvas average",
      value: `${Number(canvasTotals.averageCompletionPercent || 0)}%`,
      detail: `${Number(canvasTotals.totalCompletedItems || 0)} / ${Number(canvasTotals.totalAvailableItems || 0)} saved item completions`,
      icon: <AssignmentTurnedInIcon />,
      tone: "linear-gradient(135deg, #FFF3C4, #DDFBD2)",
    },
  ];

  const openCreateDialog = () => {
    setStudentForm(emptyStudentForm);
    setDialogOpen(true);
  };

  const openEditDialog = (student) => {
    setStudentForm({
      id: student.id,
      name: student.name || "",
      phone: student.phone || "",
      email: student.email || "",
      module: student.module || "None",
      eligibility: student.eligibility || "Approved",
    });
    setDialogOpen(true);
  };

  const saveStudent = async () => {
    if (!studentForm.name || !studentForm.email) {
      showMessage("Name and email are required.", "warning");
      return;
    }

    setLoading(true);
    try {
      const isEdit = Boolean(studentForm.id);
      await requestJson(
        isEdit
          ? `${API_BASE_URL}/api/students/${studentForm.id}`
          : `${API_BASE_URL}/api/students`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(studentForm),
        }
      );
      setDialogOpen(false);
      await loadData();
      showMessage(isEdit ? "Guide account updated." : "Guide account created.");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (studentId) => {
    if (!window.confirm("Delete this guide account?")) return;
    try {
      await requestJson(`${API_BASE_URL}/api/students/${studentId}`, { method: "DELETE" });
      await loadData();
      showMessage("Guide account deleted.");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const assignModule = async (student, moduleName) => {
    try {
      const course = courses.find((item) => item.course_name === moduleName);
      await requestJson(`${API_BASE_URL}/api/students/${student.id}/module`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: moduleName, courseId: course?.course_id || null }),
      });
      await loadData();
      showMessage(`${student.name} assigned to ${moduleName}.`);
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
            "radial-gradient(circle at 88% 0%, rgba(167,233,87,0.40), transparent 18rem), linear-gradient(135deg, #FF8A1D 0%, #FFD84D 48%, #F3FFD4 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={3}>
          <Box>
            <Typography className="admin-dashboard-kicker">Guide management</Typography>
            <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1 }}>
              Park Guide accounts
            </Typography>
            <Typography sx={{ mt: 1.4, color: "#173126", fontWeight: 800, maxWidth: 760 }}>
              Manage guide records, course assignments, and account readiness from the shared training database.
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
                bgcolor: "rgba(255, 253, 245, 0.76)",
                px: 2.4,
                "&:hover": { borderColor: "#A7E957", bgcolor: "#F6FFE8" },
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
              sx={{
                ...buttonSx,
                background: "linear-gradient(135deg, #FF7A1A, #FFD84D)",
                color: "#173126",
                px: 2.4,
                "&:hover": { background: "linear-gradient(135deg, #FF9F1C, #FFD84D)" },
              }}
            >
              Add Guide
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

      {canvasProgressSummary?.fallback && (
        <Alert severity="warning" sx={{ mb: 2.4, borderRadius: "16px", border: "1px solid #EADFBF" }}>
          {canvasProgressSummary.message || "Canvas progress summary is using a safe empty fallback."}
        </Alert>
      )}

      <Box sx={{ ...panelSx, p: { xs: 2, md: 2.4 }, mb: 2.4, background: "rgba(255, 253, 247, 0.96)" }}>
        <Stack direction={{ xs: "column", md: "row" }} gap={1.5} alignItems={{ xs: "stretch", md: "center" }}>
          <TextField
            label="Search guides"
            size="small"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "14px",
                bgcolor: "#FFFFFF",
                "& fieldset": { borderColor: "#D8EAC7" },
                fontWeight: 800,
              },
            }}
          />
          <TextField
            label="Filter"
            select
            size="small"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            SelectProps={{ MenuProps: menuProps }}
            sx={{
              minWidth: { xs: "100%", md: 260 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "14px",
                bgcolor: "#FFFFFF",
                "& fieldset": { borderColor: "#D8EAC7" },
                fontWeight: 800,
              },
            }}
          >
            <MenuItem value="all">All records</MenuItem>
            <MenuItem value="Approved">Approved / active</MenuItem>
            <MenuItem value="Rejected">Rejected / inactive</MenuItem>
            <MenuItem value="assigned">Assigned to course</MenuItem>
            <MenuItem value="unassigned">Unassigned</MenuItem>
            {moduleOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <Typography sx={{ color: "#607166", fontWeight: 900, minWidth: { md: 150 } }}>
            {filteredStudents.length} visible
          </Typography>
        </Stack>
        {loading && <LinearProgress sx={{ mt: 2, borderRadius: 999, "& .MuiLinearProgress-bar": { bgcolor: "#ff7a1a" } }} />}
      </Box>

      <Grid container spacing={2.4}>
        {filteredStudents.map((student) => {
          const isRejected = student.eligibility === "Rejected";
          const assigned = assignedToCourse(student);
          const identity = buildGuideIdentity(student);
          const canvasProgress = normalizeCanvasProgress(student.canvasProgress);
          const latestQuizScore = canvasProgress.latestQuizScore;
          const latestQuizText = latestQuizScore === null || latestQuizScore === undefined
            ? "No quiz attempts"
            : `Latest quiz ${Math.round(Number(latestQuizScore))}%`;
          const topModule = canvasProgress.modules?.[0];
          return (
            <Grid item xs={12} md={6} xl={4} key={student.id}>
              <Card
                sx={{
                  ...panelSx,
                  minHeight: 326,
                  borderColor: isRejected ? "rgba(255, 122, 86, 0.56)" : "rgba(122, 181, 66, 0.54)",
                  background: isRejected
                    ? "linear-gradient(145deg, #fffdf7 0%, #ffe9e1 100%)"
                    : "linear-gradient(145deg, #fffdf7 0%, #f3fbdf 100%)",
                }}
              >
                <CardContent sx={{ p: { xs: 2.2, md: 2.6 } }}>
                  <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
                    <Stack direction="row" gap={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          background: isRejected
                            ? "linear-gradient(135deg, #FFE0D8, #FF9B7E)"
                            : "linear-gradient(135deg, #DDFBD2, #A7E957)",
                          color: "#173126",
                          fontWeight: 950,
                          boxShadow: "0 12px 24px rgba(63, 174, 90, 0.10)",
                        }}
                      >
                        {(student.name || "G").slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: "#173126", fontWeight: 950, fontSize: "1.08rem" }}>
                          {student.name || "Unnamed guide"}
                        </Typography>
                        <Typography sx={{ color: "#53685a", fontWeight: 800, wordBreak: "break-word" }}>
                          {student.email || "No email recorded"}
                        </Typography>
                      </Box>
                    </Stack>
                    <Chip
                      label={student.eligibility || "Approved"}
                      size="small"
                      sx={{
                        bgcolor: isRejected ? "#ffe0d8" : "#e8f8d9",
                        color: isRejected ? "#9d2c19" : "#173126",
                        border: isRejected ? "1px solid #ffad97" : "1px solid #bde58d",
                        fontWeight: 950,
                      }}
                    />
                  </Stack>

                  <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                    <Chip
                      label={assigned ? "Course assigned" : "Unassigned"}
                      size="small"
                      sx={{ bgcolor: assigned ? "#fff3c4" : "#fffdf5", color: "#7a4710", fontWeight: 900 }}
                    />
                    <Chip
                      label={identity.guideId}
                      size="small"
                      sx={{ bgcolor: "#DDFBD2", color: "#173126", border: "1px solid #BDE58D", fontWeight: 900 }}
                    />
                    <Chip
                      label={identity.trainingId}
                      size="small"
                      sx={{ bgcolor: "#FFF3C4", color: "#173126", border: "1px solid #EADFBF", fontWeight: 900 }}
                    />
                    <Chip
                      label={`Canvas ${canvasProgress.completionPercent}%`}
                      size="small"
                      sx={{ bgcolor: "#edf7ff", color: "#1a4e8a", fontWeight: 900 }}
                    />
                    {student.phone && (
                      <Chip label={student.phone} size="small" sx={{ bgcolor: "#fffaf0", color: "#173126", fontWeight: 900 }} />
                    )}
                  </Stack>

                  <Box
                    sx={{
                      mt: 2,
                      p: 1.6,
                      borderRadius: "16px",
                      border: "1px solid #D8EAC7",
                      background: "linear-gradient(135deg, #FFFFFF 0%, #F6FFE8 100%)",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                      <Typography sx={{ color: "#173126", fontWeight: 950 }}>Canvas learning progress</Typography>
                      <Typography sx={{ color: "#FF7A1A", fontWeight: 950 }}>{canvasProgress.completionPercent}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.max(0, Math.min(100, canvasProgress.completionPercent))}
                      sx={{
                        my: 1,
                        height: 8,
                        borderRadius: 999,
                        bgcolor: "rgba(216, 234, 199, 0.72)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 999,
                          background: "linear-gradient(135deg, #FF7A1A, #A7E957)",
                        },
                      }}
                    />
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      <Chip
                        label={`${canvasProgress.completedCanvasItems}/${canvasProgress.totalAvailableItems} items complete`}
                        size="small"
                        sx={{ bgcolor: "#FFFFFF", color: "#173126", border: "1px solid #EADFBF", fontWeight: 900 }}
                      />
                      <Chip
                        label={`${canvasProgress.quizAttempts} quiz attempt${canvasProgress.quizAttempts === 1 ? "" : "s"}`}
                        size="small"
                        sx={{ bgcolor: "#FFF3C4", color: "#173126", border: "1px solid #EADFBF", fontWeight: 900 }}
                      />
                      <Chip
                        label={latestQuizText}
                        size="small"
                        sx={{ bgcolor: "#DDFBD2", color: "#173126", border: "1px solid #BDE58D", fontWeight: 900 }}
                      />
                    </Stack>
                    {topModule && (
                      <Typography sx={{ mt: 1, color: "#56685D", fontWeight: 850 }}>
                        Top module: {topModule.moduleTitle || topModule.module_title || "Canvas module"}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2, borderColor: "rgba(234, 214, 167, 0.86)" }} />

                  <Box className="guide-identity-grid">
                    <Box>
                      <span>Guide name</span>
                      <strong>{identity.name}</strong>
                    </Box>
                    <Box>
                      <span>Guide ID</span>
                      <strong>{identity.guideId}</strong>
                    </Box>
                    <Box>
                      <span>Training ID</span>
                      <strong>{identity.trainingId}</strong>
                    </Box>
                    <Box>
                      <span>Role</span>
                      <strong>{identity.roleLabel}</strong>
                    </Box>
                  </Box>

                  <TextField
                    label="Assigned course"
                    select
                    size="small"
                    value={student.module || "None"}
                    onChange={(event) => assignModule(student, event.target.value)}
                    SelectProps={{ MenuProps: menuProps }}
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        minHeight: 48,
                        borderRadius: "14px",
                        bgcolor: "#FFFFFF",
                        "& fieldset": { borderColor: "#D8EAC7" },
                        fontWeight: 850,
                      },
                    }}
                  >
                    {moduleOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Stack direction="row" gap={1} sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => openEditDialog(student)}
                      sx={{ ...buttonSx, flex: 1, borderColor: "#D8EAC7", color: "#173126", bgcolor: "#FFFFFF" }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => deleteStudent(student.id)}
                      sx={{ ...buttonSx, flex: 1, bgcolor: "#fff7ef", borderColor: "#ff9b7e", color: "#9d2c19" }}
                    >
                      Delete
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredStudents.length === 0 && (
        <Box sx={{ ...panelSx, p: 4, mt: 2.4, textAlign: "center", background: "#fffdf7" }}>
          <Typography sx={{ color: "#173126", fontWeight: 950 }}>No guide accounts found</Typography>
          <Typography sx={{ mt: 1, color: "#607166", fontWeight: 800 }}>
            Add a guide account or clear the current search and filter.
          </Typography>
        </Box>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
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
          {studentForm.id ? "Edit Guide Account" : "Add Guide Account"}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "20px !important" }}>
          <TextField label="Name" value={studentForm.name} onChange={(event) => setStudentForm((prev) => ({ ...prev, name: event.target.value }))} fullWidth />
          <TextField label="Phone" value={studentForm.phone} onChange={(event) => setStudentForm((prev) => ({ ...prev, phone: event.target.value }))} fullWidth />
          <TextField label="Email" value={studentForm.email} onChange={(event) => setStudentForm((prev) => ({ ...prev, email: event.target.value }))} fullWidth />
          <TextField
            label="Assigned Course"
            select
            value={studentForm.module}
            onChange={(event) => setStudentForm((prev) => ({ ...prev, module: event.target.value }))}
            SelectProps={{ MenuProps: menuProps }}
            fullWidth
          >
            {moduleOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Eligibility"
            select
            value={studentForm.eligibility}
            onChange={(event) => setStudentForm((prev) => ({ ...prev, eligibility: event.target.value }))}
            SelectProps={{ MenuProps: menuProps }}
            fullWidth
          >
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ ...buttonSx, color: "#173126" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveStudent}
            disabled={loading}
            sx={{ ...buttonSx, background: "linear-gradient(135deg, #FF7A1A, #FFD84D)", color: "#173126" }}
          >
            Save Account
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

export default StudentManagement;
