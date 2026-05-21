import { authFetch } from "../utils/authFetch";
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
import { Link as RouterLink } from "react-router-dom";
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

const demoGuideCourses = [
  { course_id: "SFC-FIELD-2026", course_name: "SFC Field Response Essentials" },
  { course_id: "SFC-WILDLIFE-2026", course_name: "Sarawak Protected Wildlife Awareness" },
  { course_id: "SFC-ORIENTATION-2026", course_name: "SFC Park Guide Orientation" },
];

const demoStudents = [
  {
    id: 1,
    name: "Aiden Tan",
    phone: "+60 16-901 1111",
    email: "aiden.tan@example.com",
    module: "SFC Field Response Essentials",
    eligibility: "Approved",
    canvasProgress: { completedCanvasItems: 3, totalAvailableItems: 3, completionPercent: 100, quizAttempts: 2, latestQuizScore: 92, modules: [{ moduleTitle: "Incident response overview" }] },
  },
  {
    id: 2,
    name: "Maya Ling",
    phone: "+60 12-661 8821",
    email: "maya.ling@example.com",
    module: "Sarawak Protected Wildlife Awareness",
    eligibility: "Approved",
    canvasProgress: { completedCanvasItems: 2, totalAvailableItems: 3, completionPercent: 67, quizAttempts: 1, latestQuizScore: 84, modules: [{ moduleTitle: "Wildlife disturbance signals" }] },
  },
  {
    id: 3,
    name: "Daniel Chai",
    phone: "+60 17-220 7711",
    email: "daniel.chai@example.com",
    module: "SFC Park Guide Orientation",
    eligibility: "Approved",
    canvasProgress: { completedCanvasItems: 0, totalAvailableItems: 3, completionPercent: 0, quizAttempts: 0, latestQuizScore: null, modules: [{ moduleTitle: "Portal and certification basics" }] },
  },
];

const demoStaffAccounts = [
  {
    key: "ranger-rgr-sfc-014",
    type: "staff",
    roleLabel: "Park Ranger",
    name: "Ranger Daniel Ling",
    email: "daniel.ling@sfc.demo",
    phone: "+60 16-442 7714",
    uniqueUserId: "RGR-SFC-014",
    secondaryId: "SFC-RANGER-014",
    status: "Approved",
    location: "Bako National Park Field Station",
    assignment: "Incident review and field recommendations",
    accountNote: "Receives high severity and Admin-escalated incident notifications.",
    managementNote: "Login, logout, profile, and recommendation history are handled in the Ranger portal.",
  },
  {
    key: "admin-adm-sfc-001",
    type: "staff",
    roleLabel: "Admin",
    name: "SFC Admin Desk",
    email: "admin@sfc.demo",
    phone: "+60 82-555 010",
    uniqueUserId: "ADM-SFC-001",
    secondaryId: "SFC-OPS-ADMIN",
    status: "Approved",
    location: "SFC Operations Office",
    assignment: "Official incident status, course approvals, certificates, and access control",
    accountNote: "Admin remains responsible for official status and account decisions.",
    managementNote: "Protected system account. Identity is unique and should not be duplicated.",
  },
];

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
  const [fallbackMessage, setFallbackMessage] = useState("");
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
      setFallbackMessage("");
    } catch (error) {
      setStudents(demoStudents);
      setCourses(demoGuideCourses);
      setCanvasProgressSummary({
        fallback: true,
        message: "Demo fallback guide progress is displayed because the Admin training API is unavailable.",
        summary: {
          averageCompletionPercent: 56,
          totalCompletedItems: 5,
          totalAvailableItems: 9,
        },
        guides: demoStudents,
      });
      setFallbackMessage("Demo fallback user account records are displayed because the Admin training API is unavailable.");
      showMessage("Admin training API unavailable. Showing demo account progress.", "warning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const moduleOptions = useMemo(() => ["None", ...courses.map((course) => course.course_name)], [courses]);

  const accountRecords = useMemo(
    () => [
      ...students.map((student) => {
        const identity = buildGuideIdentity(student);
        return {
          key: `guide-${student.id}`,
          type: "guide",
          roleLabel: "Park Guide",
          name: student.name || "Unnamed guide",
          email: student.email || "No email recorded",
          phone: student.phone || "",
          uniqueUserId: identity.guideId,
          secondaryId: identity.trainingId,
          status: student.eligibility || "Approved",
          location: student.module && student.module !== "None" ? student.module : "Unassigned",
          assignment: student.module && student.module !== "None" ? student.module : "No course assigned",
          accountNote: "Course assignment, Canvas progress, quiz attempts, and certificate readiness are managed here.",
          managementNote: "Guide account fields can be edited, but the generated User ID stays unique for this person.",
          student,
          identity,
        };
      }),
      ...demoStaffAccounts,
    ],
    [students]
  );

  const summary = useMemo(
    () => ({
      total: accountRecords.length,
      approved: accountRecords.filter((account) => account.status === "Approved").length,
      rejected: accountRecords.filter((account) => account.status === "Rejected").length,
      assigned: students.filter(assignedToCourse).length,
      rangers: accountRecords.filter((account) => account.roleLabel === "Park Ranger").length,
    }),
    [accountRecords, students]
  );
  const canvasTotals = canvasProgressSummary?.summary || {};

  const filteredAccounts = useMemo(
    () =>
      accountRecords.filter((account) => {
        const matchesFilter =
          filter === "all" ||
          account.roleLabel === filter ||
          account.status === filter ||
          account.assignment === filter ||
          account.location === filter ||
          (filter === "assigned" && account.type === "guide" && assignedToCourse(account.student)) ||
          (filter === "unassigned" && account.type === "guide" && !assignedToCourse(account.student));
        const text = `${account.name || ""} ${account.email || ""} ${account.phone || ""} ${account.roleLabel || ""} ${account.status || ""} ${account.assignment || ""} ${account.location || ""} ${account.uniqueUserId || ""} ${account.secondaryId || ""}`.toLowerCase();
        return matchesFilter && text.includes(searchTerm.toLowerCase());
      }),
    [accountRecords, filter, searchTerm]
  );

  const statCards = [
    { label: "Total accounts", value: summary.total, detail: "Guides, rangers, and admins", icon: <GroupsIcon />, tone: "linear-gradient(135deg, #FF7A1A, #FFD84D)" },
    { label: "Active accounts", value: summary.approved, detail: "Approved for portal access", icon: <CheckCircleIcon />, tone: "linear-gradient(135deg, #DDFBD2, #A7E957)" },
    { label: "Inactive accounts", value: summary.rejected, detail: "Rejected or disabled records", icon: <CancelIcon />, tone: "#b53421" },
    { label: "Park ranger profiles", value: summary.rangers, detail: "Incident review and recommendation role", icon: <AssignmentTurnedInIcon />, tone: "linear-gradient(135deg, #FF9F1C, #FFD84D)" },
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
            <Typography className="admin-dashboard-kicker">User management</Typography>
            <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1 }}>
              User Accounts
            </Typography>
            <Typography sx={{ mt: 1.4, color: "#173126", fontWeight: 800, maxWidth: 760 }}>
              Manage one clear account surface for Park Guides, Park Rangers, and Admins. Each person keeps one unique User ID; roles and profile details can be reviewed without duplicating the user.
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
              Add Guide Account
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box className="guide-stat-fit-grid">
        {statCards.map((card) => (
          <Box className="guide-fit-cell" key={card.label}>
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
          </Box>
        ))}
      </Box>

      <Box sx={{ ...panelSx, p: { xs: 2, md: 2.4 }, mb: 2.4, background: "linear-gradient(135deg, #FFFFFF 0%, #F6FFE8 100%)" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5} alignItems={{ xs: "flex-start", md: "center" }}>
          <Box>
            <Typography sx={{ color: "#173126", fontWeight: 950 }}>Unique user identity rule</Typography>
            <Typography sx={{ color: "#56685D", fontWeight: 800 }}>
              One person should appear once in this page. The User ID is treated as the stable identity; use role, assignment, and permission fields to manage access.
            </Typography>
          </Box>
          <Chip
            label="Unique IDs"
            sx={{
              flexShrink: 0,
              bgcolor: "#DDFBD2",
              color: "#173126",
              border: "1px solid #BDE58D",
              fontWeight: 950,
            }}
          />
        </Stack>
      </Box>

      {canvasProgressSummary?.fallback && (
        <Alert
          severity="warning"
          sx={{
            mb: 2.4,
            borderRadius: "16px",
            border: "1px solid #EADFBF",
            bgcolor: "#fffaf0",
            color: "#173126",
            "& .MuiAlert-icon": { color: "#C65D00" },
            "& .MuiAlert-message": { color: "#173126", fontWeight: 850 },
          }}
        >
          {fallbackMessage || canvasProgressSummary.message || "Canvas progress summary is using a safe empty fallback."}
        </Alert>
      )}

      <Box className="guide-filter-toolbar" sx={{ ...panelSx, p: { xs: 2, md: 2.4 }, mb: 2.4 }}>
        <Stack className="guide-filter-toolbar-inner" direction={{ xs: "column", md: "row" }} gap={1.5} alignItems={{ xs: "stretch", md: "center" }}>
          <TextField
            label="Search accounts"
            className="guide-filter-control"
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
            className="guide-filter-control"
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
            <MenuItem value="all">All accounts</MenuItem>
            <MenuItem value="Park Guide">Park Guides</MenuItem>
            <MenuItem value="Park Ranger">Park Rangers</MenuItem>
            <MenuItem value="Admin">Admins</MenuItem>
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
          <Typography className="guide-visible-count" sx={{ minWidth: { md: 150 } }}>
            {filteredAccounts.length} visible
          </Typography>
        </Stack>
        {loading && <LinearProgress sx={{ mt: 2, borderRadius: 999, "& .MuiLinearProgress-bar": { bgcolor: "#ff7a1a" } }} />}
      </Box>

      <Box className="guide-card-fit-grid">
        {filteredAccounts.map((account) => {
          if (account.type !== "guide") {
            const isRanger = account.roleLabel === "Park Ranger";
            return (
              <Box className="guide-fit-cell" key={account.key}>
                <Card
                  sx={{
                    ...panelSx,
                    minHeight: 326,
                    borderColor: isRanger ? "rgba(255, 159, 28, 0.48)" : "rgba(122, 181, 66, 0.54)",
                    background: isRanger
                      ? "linear-gradient(145deg, #fffdf7 0%, #fff3c4 100%)"
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
                            background: isRanger
                              ? "linear-gradient(135deg, #FF9F1C, #FFD84D)"
                              : "linear-gradient(135deg, #DDFBD2, #A7E957)",
                            color: "#173126",
                            fontWeight: 950,
                            boxShadow: "0 12px 24px rgba(63, 174, 90, 0.10)",
                          }}
                        >
                          {(account.name || "U").slice(0, 1).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ color: "#173126", fontWeight: 950, fontSize: "1.08rem" }}>
                            {account.name}
                          </Typography>
                          <Typography sx={{ color: "#53685a", fontWeight: 800, wordBreak: "break-word" }}>
                            {account.email}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip
                        label={account.status}
                        size="small"
                        sx={{
                          bgcolor: "#e8f8d9",
                          color: "#173126",
                          border: "1px solid #bde58d",
                          fontWeight: 950,
                        }}
                      />
                    </Stack>

                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                      <Chip label={account.roleLabel} size="small" sx={{ bgcolor: "#FFF3C4", color: "#173126", border: "1px solid #EADFBF", fontWeight: 900 }} />
                      <Chip label={account.uniqueUserId} size="small" sx={{ bgcolor: "#DDFBD2", color: "#173126", border: "1px solid #BDE58D", fontWeight: 900 }} />
                      <Chip label={account.secondaryId} size="small" sx={{ bgcolor: "#edf7ff", color: "#1a4e8a", border: "1px solid #cde4f6", fontWeight: 900 }} />
                      <Chip label={account.phone} size="small" sx={{ bgcolor: "#fffaf0", color: "#173126", fontWeight: 900 }} />
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
                      <Typography sx={{ color: "#173126", fontWeight: 950 }}>Account responsibility</Typography>
                      <Typography sx={{ mt: 0.8, color: "#56685D", fontWeight: 850 }}>{account.assignment}</Typography>
                      <Typography sx={{ mt: 1, color: "#173126", fontWeight: 850 }}>{account.accountNote}</Typography>
                    </Box>

                    <Divider sx={{ my: 2, borderColor: "rgba(234, 214, 167, 0.86)" }} />

                    <Box className="guide-identity-grid">
                      <Box>
                        <span>User name</span>
                        <strong>{account.name}</strong>
                      </Box>
                      <Box>
                        <span>Unique User ID</span>
                        <strong>{account.uniqueUserId}</strong>
                      </Box>
                      <Box>
                        <span>Role</span>
                        <strong>{account.roleLabel}</strong>
                      </Box>
                      <Box>
                        <span>Location</span>
                        <strong>{account.location}</strong>
                      </Box>
                    </Box>

                    <Alert severity="info" sx={{ borderRadius: "14px", border: "1px solid #cde4f6", bgcolor: "#f5fbff", color: "#173126" }}>
                      {account.managementNote}
                    </Alert>

                    <Stack direction="row" gap={1} sx={{ mt: 2 }}>
                      <Button
                        component={RouterLink}
                        to="/admin/permissions"
                        variant="outlined"
                        sx={{ ...buttonSx, flex: 1, borderColor: "#D8EAC7", color: "#173126", bgcolor: "#FFFFFF" }}
                      >
                        Permissions
                      </Button>
                      {isRanger && (
                        <Button
                          component={RouterLink}
                          to="/ranger"
                          variant="outlined"
                          sx={{ ...buttonSx, flex: 1, bgcolor: "#fff7ef", borderColor: "#ff9f1c", color: "#173126" }}
                        >
                          Ranger portal
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            );
          }
          const student = account.student;
          const isRejected = student.eligibility === "Rejected";
          const assigned = assignedToCourse(student);
          const identity = account.identity;
          const canvasProgress = normalizeCanvasProgress(student.canvasProgress);
          const latestQuizScore = canvasProgress.latestQuizScore;
          const latestQuizText = latestQuizScore === null || latestQuizScore === undefined
            ? "No quiz attempts"
            : `Latest quiz ${Math.round(Number(latestQuizScore))}%`;
          const topModule = canvasProgress.modules?.[0];
          const certificateStatus = canvasProgress.completionPercent >= 100
            ? "Certified"
            : canvasProgress.completionPercent > 0
              ? "Needs Review"
              : "In Progress";
          return (
            <Box className="guide-fit-cell" key={account.key}>
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
                    <Chip
                      label={certificateStatus}
                      size="small"
                      sx={{
                        bgcolor: certificateStatus === "Certified" ? "#DDFBD2" : "#FFF3C4",
                        color: "#173126",
                        border: "1px solid #EADFBF",
                        fontWeight: 900,
                      }}
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
                      <span>User name</span>
                      <strong>{identity.name}</strong>
                    </Box>
                    <Box>
                      <span>Unique User ID</span>
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
            </Box>
          );
        })}
      </Box>

      {filteredAccounts.length === 0 && (
        <Box sx={{ ...panelSx, p: 4, mt: 2.4, textAlign: "center", background: "#fffdf7" }}>
          <Typography sx={{ color: "#173126", fontWeight: 950 }}>No user accounts found</Typography>
          <Typography sx={{ mt: 1, color: "#607166", fontWeight: 800 }}>
            Add a guide account or clear the current search and filter.
          </Typography>
        </Box>
      )}

      <Dialog
        className="guide-account-dialog"
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          className: "guide-account-dialog-paper",
          sx: {
            borderRadius: "22px",
            border: "1px solid rgba(234, 214, 167, 0.9)",
            background: "#fffdf7",
            boxShadow: "0 22px 60px rgba(255, 122, 26, 0.12)",
          },
        }}
      >
        <DialogTitle
          className="guide-account-dialog-title"
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
        <DialogContent className="guide-account-dialog-content" sx={{ display: "grid", gap: 2, pt: "20px !important" }}>
          <TextField className="guide-account-dialog-field" label="Name" value={studentForm.name} onChange={(event) => setStudentForm((prev) => ({ ...prev, name: event.target.value }))} fullWidth />
          <TextField className="guide-account-dialog-field" label="Phone" value={studentForm.phone} onChange={(event) => setStudentForm((prev) => ({ ...prev, phone: event.target.value }))} fullWidth />
          <TextField className="guide-account-dialog-field" label="Email" value={studentForm.email} onChange={(event) => setStudentForm((prev) => ({ ...prev, email: event.target.value }))} fullWidth />
          <TextField
            className="guide-account-dialog-field"
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
            className="guide-account-dialog-field"
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
        <DialogActions className="guide-account-dialog-actions" sx={{ px: 3, pb: 3, gap: 1 }}>
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
