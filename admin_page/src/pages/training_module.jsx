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

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const requestJson = async (url) => {
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
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
          <Grid item xs={12} sm={6} lg={2.4} key={label}>
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
