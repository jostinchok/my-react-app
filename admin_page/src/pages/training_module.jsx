import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SchoolIcon from "@mui/icons-material/School";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:4002";

const panelSx = {
  borderRadius: "22px",
  border: "1px solid #EADFBF",
  background: "linear-gradient(145deg, #FFFFFF 0%, #FFFCF2 100%)",
  boxShadow: "0 18px 45px rgba(255, 122, 26, 0.10)",
};

const TrainingModuleSetup = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [modulesByCourse, setModulesByCourse] = useState({});
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
      const loadedCourses = courseData.courses || [];
      const modulePairs = await Promise.all(
        loadedCourses.map(async (course) => {
          const moduleData = await requestJson(`${API_BASE_URL}/api/courses/${encodeURIComponent(course.course_id)}/modules`);
          return [course.course_id, moduleData.modules || []];
        })
      );
      setCourses(loadedCourses);
      setModulesByCourse(Object.fromEntries(modulePairs));
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainingData();
  }, []);

  const totalModules = useMemo(
    () => Object.values(modulesByCourse).reduce((total, modules) => total + modules.length, 0),
    [modulesByCourse]
  );

  return (
    <Box className="admin-linked-page">
      <Box
        sx={{
          ...panelSx,
          mb: 3,
          p: { xs: 3, md: 4 },
          background:
            "radial-gradient(circle at 88% 0%, rgba(167,233,87,0.42), transparent 18rem), linear-gradient(135deg, #FF8A1D 0%, #FFD84D 48%, #F3FFD4 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={3}>
          <Box>
            <Typography sx={{ color: "#8d4f12", fontWeight: 950, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.8rem" }}>
              Training library
            </Typography>
            <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1, mt: 1 }}>
              Live module overview
            </Typography>
            <Typography sx={{ mt: 1.4, color: "#173126", fontWeight: 800, maxWidth: 760 }}>
              Modules shown here are loaded from the admin backend and shared with the Park Guide user portal.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.2} alignSelf={{ xs: "stretch", md: "center" }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadTrainingData}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 900, background: "linear-gradient(135deg, #FF7A1A, #FFD84D)", color: "#173126" }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<SchoolIcon />}
              onClick={() => navigate("/admin/course")}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
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
        <Grid item xs={12} md={4}>
          <Card sx={panelSx}>
            <CardContent>
              <Typography className="admin-dashboard-kicker">Courses</Typography>
              <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950 }}>{courses.length}</Typography>
              <Typography sx={{ color: "#607166", fontWeight: 800 }}>Admin-created course records</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={panelSx}>
            <CardContent>
              <Typography className="admin-dashboard-kicker">Modules</Typography>
              <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950 }}>{totalModules}</Typography>
              <Typography sx={{ color: "#607166", fontWeight: 800 }}>Visible in the user training portal</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={panelSx}>
            <CardContent>
              <Typography className="admin-dashboard-kicker">Backend</Typography>
              <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950 }}>4002</Typography>
              <Typography sx={{ color: "#607166", fontWeight: 800 }}>Admin API course/module source</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 999, "& .MuiLinearProgress-bar": { bgcolor: "#ff7a1a" } }} />}

      <Stack gap={2.4}>
        {courses.map((course) => {
          const modules = modulesByCourse[course.course_id] || [];
          return (
            <Box key={course.course_id} sx={{ ...panelSx, p: { xs: 2.4, md: 3 } }}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
                <Box>
                  <Chip label={course.course_id} sx={{ bgcolor: "#fff3c4", color: "#173126", fontWeight: 900, mb: 1 }} />
                  <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950 }}>{course.course_name}</Typography>
                  <Typography sx={{ color: "#607166", fontWeight: 700 }}>{course.description || "No course description yet."}</Typography>
                </Box>
                <Chip label={`${modules.length} modules`} sx={{ alignSelf: { xs: "flex-start", md: "center" }, bgcolor: "#e8f8d9", color: "#173126", fontWeight: 900 }} />
              </Stack>

              <Grid container spacing={1.6}>
                {modules.map((module) => (
                  <Grid item xs={12} md={6} xl={4} key={module.module_id}>
                    <Box sx={{ p: 2, borderRadius: "16px", bgcolor: "#fffaf0", border: "1px solid rgba(234, 214, 167, 0.88)" }}>
                      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                        <Chip size="small" label={module.category || "Training"} sx={{ bgcolor: "#fff3c4", color: "#7a4710", fontWeight: 900 }} />
                        <Chip size="small" label={module.level || "Beginner"} sx={{ bgcolor: "#e8f8d9", color: "#173126", fontWeight: 900 }} />
                      </Stack>
                      <Typography sx={{ color: "#173126", fontWeight: 950 }}>{module.title}</Typography>
                      <Typography sx={{ mt: 0.6, color: "#607166", fontWeight: 700 }}>{module.description || "No module description yet."}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {modules.length === 0 && (
                <Box sx={{ p: 2.5, borderRadius: "16px", bgcolor: "#fffaf0", border: "1px dashed #e8c777" }}>
                  <Typography sx={{ color: "#173126", fontWeight: 900 }}>No modules have been published for this course.</Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>

      {courses.length === 0 && (
        <Box sx={{ ...panelSx, p: 4, textAlign: "center" }}>
          <Typography sx={{ color: "#173126", fontWeight: 950 }}>No backend courses yet</Typography>
          <Typography sx={{ mt: 1, color: "#607166", fontWeight: 700 }}>
            Use Course and module control to create the first training course.
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

export default TrainingModuleSetup;
