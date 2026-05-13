import { authFetch } from "../utils/authFetch";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Grid,
  IconButton,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import ChecklistIcon from "@mui/icons-material/Checklist";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import LinkIcon from "@mui/icons-material/Link";
import QuizIcon from "@mui/icons-material/Quiz";
import RefreshIcon from "@mui/icons-material/Refresh";
import SchoolIcon from "@mui/icons-material/School";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import { useNavigate } from "react-router-dom";

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

const itemTypeMap = {
  page: { label: "Page", icon: <ArticleIcon /> },
  text: { label: "Text", icon: <ArticleIcon /> },
  file: { label: "File", icon: <InsertDriveFileIcon /> },
  image: { label: "Image", icon: <ImageIcon /> },
  video: { label: "Video", icon: <VideoLibraryIcon /> },
  link: { label: "External Link", icon: <LinkIcon /> },
  quiz: { label: "Quiz", icon: <QuizIcon /> },
  checklist: { label: "Checklist", icon: <ChecklistIcon /> },
};

const TrainingModuleSetup = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [progressSummary, setProgressSummary] = useState(null);
  const [progressFallbackMessage, setProgressFallbackMessage] = useState("");

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const requestJson = async (url, options = {}) => {
    const response = await authFetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  };

  const loadAdminProgressSummary = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/admin/canvas-progress-summary`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Progress summary unavailable.");

      setProgressSummary(data);
      setProgressFallbackMessage(data.message || "");
    } catch (error) {
      setProgressSummary({
        fallback: true,
        summary: {},
        guides: [],
        courses: [],
      });
      setProgressFallbackMessage(error.message || "Progress summary unavailable.");
    }
  };

  const loadTrainingData = async () => {
    setLoading(true);
    try {
      const courseData = await requestJson(`${API_BASE_URL}/api/courses`);
      const courseList = courseData.courses || [];
      const canvasCourses = await Promise.all(
        courseList.map(async (course) => {
          const canvasData = await requestJson(`${API_BASE_URL}/api/courses/${encodeURIComponent(course.course_id)}/canvas`);
          return canvasData.course;
        })
      );

      setCourses(canvasCourses.filter(Boolean));
      setExpanded((prev) => {
        if (Object.keys(prev).length) return prev;
        const firstModule = canvasCourses[0]?.modules?.[0];
        return firstModule ? { [firstModule.module_id]: true } : {};
      });

      await loadAdminProgressSummary();
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainingData();
  }, []);

  const totals = useMemo(() => {
    const modules = courses.reduce((sum, course) => sum + (course.modules?.length || 0), 0);
    const items = courses.reduce(
      (sum, course) => sum + (course.modules || []).reduce((moduleSum, module) => moduleSum + (module.items?.length || 0), 0),
      0
    );
    const resources = courses.reduce((sum, course) => sum + (course.resources?.length || 0), 0);
    const hours = courses.reduce((sum, course) => sum + Number(course.total_contact_hours || 0), 0);
    return { modules, items, resources, hours };
  }, [courses]);

  const numberFrom = (...values) => {
    const value = values.find((entry) => entry !== undefined && entry !== null && entry !== "");
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const progressStats = progressSummary?.summary || {};
  const guideProgressRows = Array.isArray(progressSummary?.guides) ? progressSummary.guides : [];
  const courseProgressRows = Array.isArray(progressSummary?.courses) ? progressSummary.courses : [];

  const totalGuides = numberFrom(progressStats.totalGuides, progressStats.total_guides);
  const totalAvailableItems = numberFrom(progressStats.totalAvailableItems, progressStats.total_available_items);
  const totalCompletedItems = numberFrom(progressStats.totalCompletedItems, progressStats.total_completed_items);
  const totalQuizAttempts = numberFrom(progressStats.totalQuizAttempts, progressStats.total_quiz_attempts);
  const averageCompletion = numberFrom(progressStats.averageCompletionPercent, progressStats.average_completion_percent);

  const certificateReviewQueue = guideProgressRows
    .filter((guide) =>
      numberFrom(guide.completionPercent, guide.completion_percent) >= 100 ||
      numberFrom(guide.completedItems, guide.completed_items) > 0
    )
    .slice(0, 4);

  const toggleModule = (moduleId) => {
    setExpanded((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  return (
    <Box className="admin-linked-page canvas-builder-page">
      <Box
        sx={{
          ...panelSx,
          mb: 3,
          p: { xs: 3, md: 4 },
          background:
            "radial-gradient(circle at 88% 0%, rgba(167,233,87,0.40), transparent 18rem), linear-gradient(135deg, #FF8A1D 0%, #FFD84D 48%, #F3FFD4 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={3}>
          <Box>
            <Typography className="admin-dashboard-kicker">Canvas-style training library</Typography>
            <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1 }}>
              Live course module overview
            </Typography>
            <Typography sx={{ mt: 1.4, color: "#173126", fontWeight: 850, maxWidth: 820 }}>
              Read-only view of the course, module, and learning-item structure published from the Admin course builder.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.2} alignSelf={{ xs: "stretch", md: "center" }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadTrainingData}
              sx={{ ...buttonSx, background: "linear-gradient(135deg, #FF7A1A, #FFD84D)", color: "#173126" }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<SchoolIcon />}
              onClick={() => navigate("/admin/course")}
              sx={{
                ...buttonSx,
                borderColor: "#EADFBF",
                color: "#173126",
                backgroundColor: "rgba(255, 253, 245, 0.72)",
              }}
            >
              Manage Courses
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={2.4} sx={{ mb: 3 }}>
        {[
          ["Courses", courses.length, "Admin-created course records"],
          ["Modules", totals.modules, "Module blocks inside courses"],
          ["Items", totals.items, "Pages, files, videos, links, quizzes, checklists"],
          ["Resources", totals.resources, "Course-level downloadable resources"],
          ["Hours", totals.hours, "Total contact hours"],
        ].map(([label, value, desc]) => (
          <Grid item xs={12} sm={6} xl={2.4} key={label}>
            <Box sx={{ ...panelSx, p: 2.2 }}>
              <Typography className="admin-dashboard-kicker">{label}</Typography>
              <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950 }}>
                {value}
              </Typography>
              <Typography sx={{ color: "#607166", fontWeight: 800 }}>{desc}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ ...panelSx, p: { xs: 2.4, md: 3 }, mb: 3 }}>
        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 2.2 }}>
          <Box>
            <Typography className="admin-dashboard-kicker">Progress and certificate review</Typography>
            <Typography variant="h4" sx={{ color: "#173126", fontWeight: 950 }}>
              Learning evidence dashboard
            </Typography>
            <Typography sx={{ color: "#607166", fontWeight: 800, mt: 0.8, maxWidth: 840 }}>
              Admin can review learner completion evidence, quiz attempts, and certificate readiness from the same
              Canvas-style learning database used by the User Portal.
            </Typography>
          </Box>
          <Chip
            label={progressSummary?.fallback ? "Progress fallback mode" : "Database-linked progress"}
            sx={{
              alignSelf: { xs: "flex-start", lg: "center" },
              bgcolor: progressSummary?.fallback ? "#fff3c4" : "#dcf8c6",
              color: "#173126",
              fontWeight: 950,
            }}
          />
        </Stack>

        {progressFallbackMessage && progressSummary?.fallback && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: "14px" }}>
            {progressFallbackMessage}
          </Alert>
        )}

        <Grid container spacing={1.4} sx={{ mb: 2.4 }}>
          {[
            ["Guides", totalGuides, "Learner records"],
            ["Available Items", totalAvailableItems, "Published learning items"],
            ["Completed Items", totalCompletedItems, "Saved completion evidence"],
            ["Quiz Attempts", totalQuizAttempts, "Submitted quiz records"],
            ["Average", String(averageCompletion) + "%", "Average completion"],
          ].map(([label, value, desc]) => (
            <Grid item xs={12} sm={6} lg={2.4} key={label}>
              <Box sx={{ p: 1.6, borderRadius: "16px", bgcolor: "#fffaf0", border: "1px solid #eadfbf" }}>
                <Typography className="admin-dashboard-kicker">{label}</Typography>
                <Typography sx={{ color: "#173126", fontWeight: 950, fontSize: "1.8rem" }}>{value}</Typography>
                <Typography sx={{ color: "#607166", fontWeight: 800, fontSize: "0.86rem" }}>{desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={7}>
            <Box sx={{ p: 2, borderRadius: "18px", bgcolor: "#fffdf5", border: "1px solid #eadfbf" }}>
              <Typography sx={{ color: "#173126", fontWeight: 950, mb: 1 }}>
                Course completion snapshot
              </Typography>
              <Stack gap={1.4}>
                {courseProgressRows.slice(0, 4).map((course) => {
                  const percentValue = numberFrom(course.completionPercent, course.completion_percent);
                  const completed = numberFrom(course.completedItems, course.completed_items);
                  const available = numberFrom(course.availableItems, course.available_items, course.totalItems, course.total_items);
                  return (
                    <Box key={course.course_id || course.courseId || course.course_name}>
                      <Stack direction="row" justifyContent="space-between" gap={1}>
                        <Typography sx={{ color: "#173126", fontWeight: 900 }}>
                          {course.course_name || course.courseName || course.course_id || "Course"}
                        </Typography>
                        <Typography sx={{ color: "#173126", fontWeight: 950 }}>
                          {percentValue}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, Math.max(0, percentValue))}
                        sx={{ height: 9, borderRadius: 999, mt: 0.8, "& .MuiLinearProgress-bar": { bgcolor: "#ff7a1a" } }}
                      />
                      <Typography sx={{ color: "#607166", fontWeight: 800, fontSize: "0.82rem", mt: 0.5 }}>
                        {completed} of {available} learning items completed
                      </Typography>
                    </Box>
                  );
                })}

                {courseProgressRows.length === 0 && (
                  <Typography sx={{ color: "#607166", fontWeight: 800 }}>
                    No course progress records yet. Ask a Park Guide to complete module items in the User Portal.
                  </Typography>
                )}
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Box sx={{ p: 2, borderRadius: "18px", bgcolor: "#fffdf5", border: "1px solid #eadfbf" }}>
              <Typography sx={{ color: "#173126", fontWeight: 950, mb: 1 }}>
                Certificate review queue
              </Typography>
              <Stack gap={1}>
                {certificateReviewQueue.map((guide) => {
                  const percentValue = numberFrom(guide.completionPercent, guide.completion_percent);
                  const completed = numberFrom(guide.completedItems, guide.completed_items);
                  const available = numberFrom(guide.availableItems, guide.available_items, guide.totalItems, guide.total_items);
                  return (
                    <Box
                      key={String(guide.user_id || guide.userId || guide.email || "learner") + "-" + String(guide.course_id || guide.courseId || "course")}
                      sx={{ p: 1.4, borderRadius: "14px", bgcolor: "#fffaf0", border: "1px solid #eadfbf" }}
                    >
                      <Stack direction="row" justifyContent="space-between" gap={1}>
                        <Box>
                          <Typography sx={{ color: "#173126", fontWeight: 950 }}>
                            {guide.name || guide.user_name || guide.email || "Learner"}
                          </Typography>
                          <Typography sx={{ color: "#607166", fontWeight: 800, fontSize: "0.82rem" }}>
                            {guide.course_name || guide.courseName || guide.course_id || "Course"} · {completed}/{available} items
                          </Typography>
                        </Box>
                        <Chip
                          label={percentValue >= 100 ? "Ready" : String(percentValue) + "%"}
                          size="small"
                          sx={{ bgcolor: percentValue >= 100 ? "#dcf8c6" : "#fff3c4", color: "#173126", fontWeight: 950 }}
                        />
                      </Stack>
                    </Box>
                  );
                })}

                {certificateReviewQueue.length === 0 && (
                  <Typography sx={{ color: "#607166", fontWeight: 800 }}>
                    No certificate-ready learners yet. Completion evidence will appear here after full course items are completed.
                  </Typography>
                )}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 999, "& .MuiLinearProgress-bar": { bgcolor: "#ff7a1a" } }} />}

      <Stack gap={2.4}>
        {courses.map((course) => (
          <Box key={course.course_id} sx={{ ...panelSx, p: { xs: 2.4, md: 3 } }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
              <Box>
                <Chip label={course.course_id} sx={{ bgcolor: "#fff3c4", color: "#173126", fontWeight: 950, mb: 1 }} />
                <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950 }}>
                  {course.course_name}
                </Typography>
                <Typography sx={{ color: "#607166", fontWeight: 800 }}>{course.description || "No description yet."}</Typography>
              </Box>
              <Stack direction="row" flexWrap="wrap" gap={1} alignSelf={{ xs: "flex-start", md: "center" }}>
                <Chip label={`${course.modules?.length || 0} modules`} sx={{ bgcolor: "#dcf8c6", color: "#173126", fontWeight: 950 }} />
                <Chip label={`${course.resources?.length || 0} resources`} sx={{ bgcolor: "#fff3c4", color: "#173126", fontWeight: 950 }} />
              </Stack>
            </Stack>

            <Stack gap={1.4}>
              {(course.modules || []).map((module, index) => (
                <Box key={module.module_id} className="canvas-module-card">
                  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.2}>
                    <Stack direction="row" alignItems="center" gap={1.2}>
                      <IconButton onClick={() => toggleModule(module.module_id)} className="canvas-module-toggle">
                        {expanded[module.module_id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <Box>
                        <Typography sx={{ color: "#173126", fontWeight: 950 }}>
                          Module {index + 1}: {module.title}
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mt: 0.6 }}>
                          <Chip size="small" label={module.level || "Beginner"} sx={{ bgcolor: "#dcf8c6", color: "#173126", fontWeight: 900 }} />
                          <Chip size="small" label={module.duration || "45 minutes"} sx={{ bgcolor: "#fff3c4", color: "#173126", fontWeight: 900 }} />
                          <Chip size="small" label={`${module.items?.length || 0} items`} sx={{ bgcolor: "#ffe2cf", color: "#173126", fontWeight: 900 }} />
                        </Stack>
                      </Box>
                    </Stack>
                  </Stack>

                  <Collapse in={Boolean(expanded[module.module_id])}>
                    <Typography sx={{ color: "#607166", fontWeight: 800, mt: 1.2 }}>
                      {module.description || "No module description yet."}
                    </Typography>

                    <Stack gap={1} sx={{ mt: 1.4 }}>
                      {(module.items || []).map((item) => {
                        const config = itemTypeMap[item.item_type] || itemTypeMap.page;
                        return (
                          <Box key={item.item_id} className="canvas-item-row read-only">
                            <Stack direction="row" alignItems="center" gap={1.2}>
                              <Box className="canvas-item-icon">{config.icon}</Box>
                              <Box>
                                <Typography sx={{ color: "#173126", fontWeight: 950 }}>{item.title}</Typography>
                                <Typography sx={{ color: "#607166", fontWeight: 750, fontSize: "0.86rem" }}>
                                  {config.label} · {item.description || item.external_url || item.file_name || "Published item"}
                                </Typography>
                              </Box>
                            </Stack>
                            <Chip label={item.status || "published"} size="small" sx={{ bgcolor: "#dcf8c6", color: "#173126", fontWeight: 900 }} />
                          </Box>
                        );
                      })}
                    </Stack>
                  </Collapse>
                </Box>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>

      {courses.length === 0 && (
        <Box sx={{ ...panelSx, p: 4, textAlign: "center" }}>
          <Typography sx={{ color: "#173126", fontWeight: 950 }}>No Canvas-style courses yet</Typography>
          <Typography sx={{ mt: 1, color: "#607166", fontWeight: 800 }}>
            Go to Course modules and insert the three demo Canvas courses.
          </Typography>
        </Box>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={3200} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrainingModuleSetup;
