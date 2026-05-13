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
  LinearProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import SchoolIcon from "@mui/icons-material/School";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:4002";
const adminBasePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const certificateBackgroundSrc = `${adminBasePath}certificates/sfc-course-certificate.webp`;
const logoSrc = `${adminBasePath}sfc-citrus-logo.png`;

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

const percent = (completed, total) => {
  const numerator = Number(completed || 0);
  const denominator = Number(total || 0);
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
};

const sameId = (left, right) => String(left || "") === String(right || "");

const getGuideCourseProgress = (guide, course) => {
  const courseId = course.courseId || course.course_id;
  const totalItems = Number(course.totalItems || course.total_items || 0);
  const completedItems = (guide.modules || [])
    .filter((module) => sameId(module.courseId || module.course_id, courseId))
    .reduce((sum, module) => sum + Number(module.completedItems || module.completed_items || 0), 0);

  return {
    completedItems,
    totalItems,
    completionPercent: percent(completedItems, totalItems),
    ready: totalItems > 0 && completedItems >= totalItems,
  };
};

const CertificateManagement = () => {
  const [students, setStudents] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(false);
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
      const [studentData, progressData] = await Promise.all([
        requestJson(`${API_BASE_URL}/api/students`),
        requestJson(`${API_BASE_URL}/api/admin/canvas-progress-summary`),
      ]);
      setStudents(studentData.students || []);
      setProgressSummary(progressData || null);
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const courses = useMemo(() => progressSummary?.courses || [], [progressSummary]);
  const guides = useMemo(() => {
    const progressGuides = progressSummary?.guides || [];
    if (students.length === 0) return progressGuides;

    const progressByUser = new Map(progressGuides.map((guide) => [String(guide.userId || guide.user_id), guide]));
    return students.map((student) => ({
      ...student,
      ...(progressByUser.get(String(student.id)) || {}),
      userId: student.id,
      user_id: student.id,
      name: student.name,
      email: student.email,
    }));
  }, [students, progressSummary]);

  const certificateRows = useMemo(() => {
    return guides.flatMap((guide) =>
      courses.map((course) => {
        const progress = getGuideCourseProgress(guide, course);
        const courseId = course.courseId || course.course_id;
        return {
          id: `${guide.userId || guide.user_id}-${courseId}`,
          userId: guide.userId || guide.user_id,
          guideName: guide.name || "Unnamed guide",
          email: guide.email || "",
          courseId,
          courseName: course.courseName || course.course_name || courseId,
          ...progress,
        };
      })
    );
  }, [guides, courses]);

  useEffect(() => {
    if (certificateRows.length === 0) return;
    const selectedStillExists = certificateRows.some(
      (row) => sameId(row.userId, selectedStudentId) && sameId(row.courseId, selectedCourseId)
    );
    if (selectedStillExists) return;

    const firstReady = certificateRows.find((row) => row.ready) || certificateRows[0];
    setSelectedStudentId(String(firstReady.userId));
    setSelectedCourseId(String(firstReady.courseId));
  }, [certificateRows, selectedCourseId, selectedStudentId]);

  const selectedRow = certificateRows.find(
    (row) => sameId(row.userId, selectedStudentId) && sameId(row.courseId, selectedCourseId)
  ) || certificateRows[0] || null;

  const summary = useMemo(() => {
    const ready = certificateRows.filter((row) => row.ready).length;
    return {
      courses: courses.length,
      guides: guides.length,
      ready,
      locked: Math.max(0, certificateRows.length - ready),
    };
  }, [certificateRows, courses.length, guides.length]);

  const issueCertificate = async () => {
    if (!selectedRow) {
      showMessage("Select a guide and course first.", "warning");
      return;
    }

    if (!selectedRow.ready) {
      showMessage("Certificate is locked until the full course reaches 100%.", "warning");
      return;
    }

    try {
      const data = await requestJson(`${API_BASE_URL}/api/admin/issue-certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedRow.userId,
          courseId: selectedRow.courseId,
          title: `${selectedRow.courseName} Certificate`,
        }),
      });
      showMessage(data.message || "Course certificate issued.");
      await loadData();
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const statCards = [
    { label: "Courses", value: summary.courses, detail: "Course-level certificate paths", icon: <SchoolIcon />, tone: "linear-gradient(135deg, #DDFBD2, #A7E957)" },
    { label: "Guides", value: summary.guides, detail: "Guide accounts tracked", icon: <CheckCircleIcon />, tone: "linear-gradient(135deg, #FF9F1C, #FFD84D)" },
    { label: "Ready", value: summary.ready, detail: "Full courses at 100%", icon: <WorkspacePremiumIcon />, tone: "linear-gradient(135deg, #FF7A1A, #FFD84D)" },
    { label: "Locked", value: summary.locked, detail: "Still in progress", icon: <RefreshIcon />, tone: "linear-gradient(135deg, #F6FFE8, #DDFBD2)" },
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
          <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Box
              component="img"
              src={logoSrc}
              alt="SFC Digital Portal logo"
              sx={{ width: 86, height: 86, borderRadius: "22px", boxShadow: "0 16px 32px rgba(23,49,38,0.16)" }}
            />
            <Box>
              <Typography sx={{ color: "#8d4f12", fontWeight: 950, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.8rem" }}>
                Certification
              </Typography>
              <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1, mt: 1 }}>
                Course certificates
              </Typography>
              <Typography sx={{ mt: 1.4, color: "#173126", fontWeight: 800, maxWidth: 760 }}>
                Issue certificates only after a full course reaches 100% completion. Completing one module does not unlock a certificate.
              </Typography>
            </Box>
          </Stack>
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
              startIcon={<WorkspacePremiumIcon />}
              onClick={issueCertificate}
              disabled={!selectedRow?.ready}
              sx={{
                ...buttonSx,
                background: selectedRow?.ready ? "linear-gradient(135deg, #FF7A1A, #FFD84D)" : "#dfe6d8",
                color: "#173126",
                px: 2.4,
              }}
            >
              Issue Certificate
            </Button>
          </Stack>
        </Stack>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 999, "& .MuiLinearProgress-bar": { bgcolor: "#ff7a1a" } }} />}

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
        <Grid item xs={12} lg={5}>
          <Box sx={{ ...panelSx, p: { xs: 2.4, md: 3 }, height: "100%" }}>
            <Typography className="admin-dashboard-kicker">Certificate selector</Typography>
            <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950, mb: 2 }}>
              Course completion gate
            </Typography>
            <Stack gap={2}>
              <TextField
                label="Guide"
                select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                SelectProps={{ MenuProps: menuProps }}
                fullWidth
              >
                {guides.map((guide) => (
                  <MenuItem key={guide.userId || guide.user_id} value={String(guide.userId || guide.user_id)}>
                    {guide.name} - {guide.email}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Course"
                select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                SelectProps={{ MenuProps: menuProps }}
                fullWidth
              >
                {courses.map((course) => (
                  <MenuItem key={course.courseId || course.course_id} value={String(course.courseId || course.course_id)}>
                    {course.courseName || course.course_name}
                  </MenuItem>
                ))}
              </TextField>

              <Paper sx={{ p: 2, borderRadius: "16px", bgcolor: selectedRow?.ready ? "#F3FFD4" : "#FFF9E8", border: "1px solid #EADFBF" }}>
                <Stack direction="row" justifyContent="space-between" gap={2}>
                  <Box>
                    <Typography sx={{ color: "#8d4f12", fontWeight: 950, textTransform: "uppercase", fontSize: "0.75rem" }}>
                      {selectedRow?.ready ? "Ready to issue" : "Locked"}
                    </Typography>
                    <Typography sx={{ color: "#173126", fontWeight: 950, fontSize: "1.1rem" }}>
                      {selectedRow?.completedItems || 0}/{selectedRow?.totalItems || 0} course items complete
                    </Typography>
                  </Box>
                  <Chip
                    label={`${selectedRow?.completionPercent || 0}%`}
                    sx={{ bgcolor: selectedRow?.ready ? "#DDFBD2" : "#fff3c4", color: "#173126", fontWeight: 950 }}
                  />
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Box sx={{ ...panelSx, p: { xs: 2.4, md: 3 }, minHeight: 360 }}>
            <Typography className="admin-dashboard-kicker">Preview</Typography>
            <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950, mb: 2 }}>
              SFC certificate
            </Typography>
            <Box
              sx={{
                position: "relative",
                minHeight: { xs: 260, md: 340 },
                borderRadius: "18px",
                overflow: "hidden",
                border: "1px solid #D9B85F",
                backgroundImage: `url(${certificateBackgroundSrc})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "grid",
                placeItems: "center",
                px: { xs: 3, md: 8 },
                textAlign: "center",
              }}
            >
              <Box component="img" src={logoSrc} alt="" sx={{ position: "absolute", top: 24, left: 28, width: 64, height: 64, borderRadius: "18px" }} />
              <Box sx={{ mt: 6 }}>
                <Typography sx={{ color: "#17452f", fontWeight: 950, letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.82rem" }}>
                  Sarawak Forestry Corporation
                </Typography>
                <Typography variant="h4" sx={{ color: "#173126", fontWeight: 950, mt: 1 }}>
                  Course Completion Certificate
                </Typography>
                <Typography sx={{ color: "#53685a", fontWeight: 900, mt: 2 }}>
                  Presented to
                </Typography>
                <Typography variant="h4" sx={{ color: "#173126", fontWeight: 950 }}>
                  {selectedRow?.guideName || "Park Guide"}
                </Typography>
                <Typography sx={{ color: "#53685a", fontWeight: 900, mt: 2 }}>
                  for completing
                </Typography>
                <Typography variant="h5" sx={{ color: "#8d4f12", fontWeight: 950 }}>
                  {selectedRow?.courseName || "Selected Course"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ ...panelSx, p: { xs: 2.4, md: 3 }, mt: 2.4 }}>
        <Typography className="admin-dashboard-kicker">All course states</Typography>
        <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950, mb: 2 }}>
          Guide certificate readiness
        </Typography>
        <Grid container spacing={1.4}>
          {certificateRows.map((row) => (
            <Grid item xs={12} md={6} xl={4} key={row.id}>
              <Paper
                sx={{
                  p: 1.8,
                  borderRadius: "16px",
                  border: row.ready ? "1px solid #A7E957" : "1px solid #EADFBF",
                  bgcolor: row.ready ? "#F3FFD4" : "#FFFDF5",
                }}
              >
                <Stack direction="row" justifyContent="space-between" gap={1.4}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: "#173126", fontWeight: 950 }}>{row.guideName}</Typography>
                    <Typography sx={{ color: "#607166", fontWeight: 800, fontSize: "0.86rem" }}>{row.courseName}</Typography>
                  </Box>
                  <Chip label={row.ready ? "Ready" : `${row.completionPercent}%`} sx={{ bgcolor: row.ready ? "#DDFBD2" : "#fff3c4", color: "#173126", fontWeight: 950 }} />
                </Stack>
                <Divider sx={{ my: 1.2 }} />
                <Typography sx={{ color: "#607166", fontWeight: 800 }}>
                  {row.completedItems}/{row.totalItems} course items complete
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        {certificateRows.length === 0 && (
          <Typography sx={{ color: "#607166", fontWeight: 800 }}>
            No course completion data is available yet.
          </Typography>
        )}
      </Box>

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

export default CertificateManagement;
