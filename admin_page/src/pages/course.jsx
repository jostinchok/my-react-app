import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:4002";

const emptyCourseForm = {
  course_id: "",
  course_name: "",
  description: "",
  start_date: "",
  end_date: "",
  total_contact_hours: "",
};

const emptyModuleForm = {
  title: "",
  description: "",
  category: "Field Readiness",
  park: "All Parks",
  level: "Beginner",
  duration: "1 hour",
  format: "Blended",
  badge_name: "",
  objectivesText: "",
  status: "Published",
  sort_order: 0,
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });

const toObjectivesText = (objectives) =>
  Array.isArray(objectives) ? objectives.join("\n") : String(objectives || "");

const courseDuration = (course) => {
  if (!course?.start_date && !course?.end_date) return "Date not set";
  if (course.start_date && course.end_date) return `${course.start_date} to ${course.end_date}`;
  return course.start_date || course.end_date;
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

const CourseManagement = () => {
  const resourceInputRef = useRef(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [modules, setModules] = useState([]);
  const [resources, setResources] = useState([]);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState("");
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceFile, setResourceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const selectedCourse = useMemo(
    () => courses.find((course) => course.course_id === selectedCourseId) || courses[0] || null,
    [courses, selectedCourseId]
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

  const loadCourses = async () => {
    const data = await requestJson(`${API_BASE_URL}/api/courses`);
    setCourses(data.courses || []);
    setSelectedCourseId((prev) => prev || data.courses?.[0]?.course_id || "");
  };

  const loadCourseDetails = async (courseId) => {
    if (!courseId) {
      setModules([]);
      setResources([]);
      return;
    }

    const [moduleData, resourceData] = await Promise.all([
      requestJson(`${API_BASE_URL}/api/courses/${encodeURIComponent(courseId)}/modules`),
      requestJson(`${API_BASE_URL}/api/courses/${encodeURIComponent(courseId)}/resources`),
    ]);
    setModules(moduleData.modules || []);
    setResources(resourceData.resources || []);
  };

  useEffect(() => {
    loadCourses().catch((error) => showMessage(error.message, "error"));
  }, []);

  useEffect(() => {
    loadCourseDetails(selectedCourse?.course_id).catch((error) => showMessage(error.message, "error"));
  }, [selectedCourse?.course_id]);

  const openCreateCourse = () => {
    setEditingCourseId("");
    setCourseForm(emptyCourseForm);
    setCourseDialogOpen(true);
  };

  const openEditCourse = (course) => {
    setEditingCourseId(course.course_id);
    setCourseForm({
      course_id: course.course_id,
      course_name: course.course_name || "",
      description: course.description || "",
      start_date: course.start_date || "",
      end_date: course.end_date || "",
      total_contact_hours: course.total_contact_hours || "",
    });
    setCourseDialogOpen(true);
  };

  const saveCourse = async () => {
    if (!courseForm.course_id || !courseForm.course_name || !courseForm.start_date || !courseForm.end_date) {
      showMessage("Course ID, name, start date, and end date are required.", "warning");
      return;
    }

    setLoading(true);
    try {
      const isEdit = Boolean(editingCourseId);
      await requestJson(
        isEdit
          ? `${API_BASE_URL}/api/courses/${encodeURIComponent(editingCourseId)}`
          : `${API_BASE_URL}/api/courses`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...courseForm,
            total_contact_hours: Number(courseForm.total_contact_hours) || 0,
          }),
        }
      );
      await loadCourses();
      setSelectedCourseId(courseForm.course_id);
      setCourseDialogOpen(false);
      showMessage(isEdit ? "Course updated." : "Course created.");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course, modules, and resources?")) return;
    try {
      await requestJson(`${API_BASE_URL}/api/courses/${encodeURIComponent(courseId)}`, { method: "DELETE" });
      setSelectedCourseId("");
      await loadCourses();
      showMessage("Course deleted.");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const openCreateModule = () => {
    if (!selectedCourse) {
      showMessage("Create or select a course first.", "warning");
      return;
    }
    setEditingModuleId(null);
    setModuleForm(emptyModuleForm);
    setModuleDialogOpen(true);
  };

  const openEditModule = (module) => {
    setEditingModuleId(module.module_id);
    setModuleForm({
      title: module.title || "",
      description: module.description || "",
      category: module.category || "Field Readiness",
      park: module.park || "All Parks",
      level: module.level || "Beginner",
      duration: module.duration || "1 hour",
      format: module.format || "Blended",
      badge_name: module.badge_name || "",
      objectivesText: toObjectivesText(module.objectives),
      status: module.status || "Published",
      sort_order: module.sort_order || 0,
    });
    setModuleDialogOpen(true);
  };

  const saveModule = async () => {
    if (!selectedCourse || !moduleForm.title) {
      showMessage("Module title is required.", "warning");
      return;
    }

    setLoading(true);
    try {
      const body = {
        ...moduleForm,
        objectives: moduleForm.objectivesText,
        sort_order: Number(moduleForm.sort_order) || 0,
      };
      await requestJson(
        editingModuleId
          ? `${API_BASE_URL}/api/modules/${editingModuleId}`
          : `${API_BASE_URL}/api/courses/${encodeURIComponent(selectedCourse.course_id)}/modules`,
        {
          method: editingModuleId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      await loadCourseDetails(selectedCourse.course_id);
      setModuleDialogOpen(false);
      showMessage(editingModuleId ? "Module updated." : "Module added.");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteModule = async (moduleId) => {
    if (!window.confirm("Delete this module and its lesson/quiz progress links?")) return;
    try {
      await requestJson(`${API_BASE_URL}/api/modules/${moduleId}`, { method: "DELETE" });
      await loadCourseDetails(selectedCourse.course_id);
      showMessage("Module deleted.");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const uploadResource = async () => {
    if (!selectedCourse || !resourceTitle || !resourceFile) {
      showMessage("Choose a course, resource title, and file first.", "warning");
      return;
    }

    setLoading(true);
    try {
      const dataUrl = await readFileAsDataUrl(resourceFile);
      await requestJson(`${API_BASE_URL}/api/courses/${encodeURIComponent(selectedCourse.course_id)}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resourceTitle,
          fileName: resourceFile.name,
          dataUrl,
        }),
      });
      setResourceTitle("");
      setResourceFile(null);
      if (resourceInputRef.current) resourceInputRef.current.value = "";
      await loadCourseDetails(selectedCourse.course_id);
      await loadCourses();
      showMessage("Resource uploaded and published to the guide portal.");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteResource = async (resourceId) => {
    if (!selectedCourse || !window.confirm("Delete this course resource?")) return;
    try {
      await requestJson(
        `${API_BASE_URL}/api/courses/${encodeURIComponent(selectedCourse.course_id)}/resources/${resourceId}`,
        { method: "DELETE" }
      );
      await loadCourseDetails(selectedCourse.course_id);
      await loadCourses();
      showMessage("Resource deleted.");
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
            "linear-gradient(135deg, rgba(255,122,26,0.96) 0%, rgba(255,210,63,0.92) 48%, rgba(255,248,230,0.96) 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={3}>
          <Box>
            <Typography className="admin-dashboard-kicker">Training platform</Typography>
            <Typography variant="h3" sx={{ color: "#0b3b28", fontWeight: 950, lineHeight: 1 }}>
              Course and module control
            </Typography>
            <Typography sx={{ mt: 1.4, color: "#274a35", fontWeight: 700, maxWidth: 760 }}>
              Create courses, publish modules, and upload resources that Park Guides can download from the user portal.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateCourse}
            sx={{
              ...buttonSx,
              alignSelf: { xs: "stretch", md: "center" },
              background: "#0b3b28",
              color: "#fff8e6",
              px: 3,
              py: 1.25,
              "&:hover": { background: "#175f3e" },
            }}
          >
            Create Course
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2.4}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} lg={4} key={course.course_id}>
            <Card
              onClick={() => setSelectedCourseId(course.course_id)}
              sx={{
                ...panelSx,
                cursor: "pointer",
                minHeight: 230,
                borderColor:
                  selectedCourse?.course_id === course.course_id
                    ? "rgba(255,122,26,0.92)"
                    : "rgba(234, 214, 167, 0.86)",
                boxShadow:
                  selectedCourse?.course_id === course.course_id
                    ? "0 18px 45px rgba(255, 122, 26, 0.18)"
                    : panelSx.boxShadow,
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Chip label={course.course_id} sx={{ bgcolor: "#fff3c4", color: "#0b3b28", fontWeight: 900 }} />
                  <Stack direction="row" gap={0.5}>
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditCourse(course);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteCourse(course.course_id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
                <Typography variant="h5" sx={{ mt: 2, color: "#0b3b28", fontWeight: 950 }}>
                  {course.course_name}
                </Typography>
                <Typography sx={{ mt: 1, color: "#53685a", fontWeight: 700, minHeight: 48 }}>
                  {course.description || "No description yet."}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                  <Chip label={`${course.module_count} modules`} size="small" sx={{ bgcolor: "#e8f8d9", fontWeight: 900 }} />
                  <Chip label={`${course.resource_count} resources`} size="small" sx={{ bgcolor: "#fff3c4", fontWeight: 900 }} />
                  <Chip label={`${course.total_contact_hours || 0} hrs`} size="small" sx={{ bgcolor: "#ffe2cf", fontWeight: 900 }} />
                </Stack>
                <Typography sx={{ mt: 1.5, color: "#607166", fontWeight: 800 }}>{courseDuration(course)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {courses.length === 0 && (
        <Box sx={{ ...panelSx, mt: 3, p: 4, textAlign: "center" }}>
          <Typography sx={{ color: "#0b3b28", fontWeight: 950 }}>No courses yet</Typography>
          <Typography sx={{ mt: 1, color: "#607166", fontWeight: 700 }}>
            Create a course to start linking admin training content to the user portal.
          </Typography>
        </Box>
      )}

      {selectedCourse && (
        <Grid container spacing={2.4} sx={{ mt: 2.4 }}>
          <Grid item xs={12} lg={7}>
            <Box sx={{ ...panelSx, p: { xs: 2.4, md: 3 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{ mb: 2 }}>
                <Box>
                  <Typography className="admin-dashboard-kicker">Course modules</Typography>
                  <Typography variant="h5" sx={{ color: "#0b3b28", fontWeight: 950 }}>
                    {selectedCourse.course_name}
                  </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModule} sx={{ ...buttonSx, bgcolor: "#ff7a1a" }}>
                  Add Module
                </Button>
              </Stack>

              <Stack gap={1.4}>
                {modules.map((module) => (
                  <Box
                    key={module.module_id}
                    sx={{
                      border: "1px solid rgba(234, 214, 167, 0.88)",
                      borderRadius: "16px",
                      bgcolor: "#fffaf0",
                      p: 2,
                    }}
                  >
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
                      <Box>
                        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                          <Chip label={module.status || "Published"} size="small" sx={{ bgcolor: "#e8f8d9", color: "#0b3b28", fontWeight: 900 }} />
                          <Chip label={module.level || "Beginner"} size="small" sx={{ bgcolor: "#fff3c4", color: "#7a4710", fontWeight: 900 }} />
                          <Chip label={module.duration || "1 hour"} size="small" sx={{ bgcolor: "#edf4ff", color: "#1a4e8a", fontWeight: 900 }} />
                        </Stack>
                        <Typography sx={{ color: "#0b3b28", fontWeight: 950, fontSize: "1.08rem" }}>{module.title}</Typography>
                        <Typography sx={{ mt: 0.5, color: "#607166", fontWeight: 700 }}>{module.description || "No module description yet."}</Typography>
                        {module.badge_name && (
                          <Typography sx={{ mt: 0.8, color: "#a75d10", fontWeight: 900 }}>
                            Badge: {module.badge_name}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" gap={1} alignItems="center">
                        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => openEditModule(module)} sx={buttonSx}>
                          Edit
                        </Button>
                        <IconButton color="error" onClick={() => deleteModule(module.module_id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>

              {modules.length === 0 && (
                <Box sx={{ mt: 2, p: 3, borderRadius: "16px", bgcolor: "#fffaf0", border: "1px dashed #e8c777" }}>
                  <Typography sx={{ color: "#0b3b28", fontWeight: 900 }}>No modules in this course yet.</Typography>
                  <Typography sx={{ mt: 0.7, color: "#607166", fontWeight: 700 }}>Add a module to make it visible in the guide training portal.</Typography>
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Box sx={{ ...panelSx, p: { xs: 2.4, md: 3 } }}>
              <Typography className="admin-dashboard-kicker">Published resources</Typography>
              <Typography variant="h5" sx={{ color: "#0b3b28", fontWeight: 950 }}>
                Course files
              </Typography>
              <Typography sx={{ mt: 0.6, color: "#607166", fontWeight: 700 }}>
                Uploaded resources appear in the Park Guide file manager as admin resources.
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} gap={1.2} sx={{ mt: 2 }}>
                <TextField
                  label="Resource title"
                  size="small"
                  value={resourceTitle}
                  onChange={(event) => setResourceTitle(event.target.value)}
                  fullWidth
                />
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={buttonSx}>
                  File
                  <input
                    ref={resourceInputRef}
                    hidden
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,image/*,video/*"
                    onChange={(event) => setResourceFile(event.target.files?.[0] || null)}
                  />
                </Button>
              </Stack>
              <Typography sx={{ mt: 1, color: "#607166", fontSize: "0.86rem", fontWeight: 800 }}>
                {resourceFile ? resourceFile.name : "No file selected"}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                disabled={loading}
                onClick={uploadResource}
                sx={{ ...buttonSx, mt: 1.5, bgcolor: "#0b3b28", "&:hover": { bgcolor: "#175f3e" } }}
              >
                Upload Resource
              </Button>

              <Stack gap={1.2} sx={{ mt: 2.2 }}>
                {resources.map((resource) => (
                  <Box
                    key={resource.resource_id}
                    sx={{
                      border: "1px solid rgba(234, 214, 167, 0.88)",
                      borderRadius: "14px",
                      bgcolor: "#fffaf0",
                      p: 1.5,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                      <Box>
                        <Typography sx={{ color: "#0b3b28", fontWeight: 950 }}>{resource.title}</Typography>
                        <Typography sx={{ color: "#607166", fontWeight: 800, fontSize: "0.86rem" }}>
                          {resource.file_name} · {resource.size}
                        </Typography>
                      </Box>
                      <Stack direction="row" gap={0.5}>
                        <IconButton
                          component="a"
                          href={`${API_BASE_URL}${resource.download_url}`}
                          target="_blank"
                          rel="noreferrer"
                          sx={{ color: "#0b3b28" }}
                        >
                          <FileDownloadIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => deleteResource(resource.resource_id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>

              {resources.length === 0 && (
                <Box sx={{ mt: 2, p: 2.5, borderRadius: "14px", bgcolor: "#fffaf0", border: "1px dashed #e8c777" }}>
                  <Typography sx={{ color: "#0b3b28", fontWeight: 900 }}>No resources uploaded yet.</Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      )}

      {loading && <LinearProgress sx={{ mt: 2, borderRadius: 999, "& .MuiLinearProgress-bar": { bgcolor: "#ff7a1a" } }} />}

      <Dialog open={courseDialogOpen} onClose={() => setCourseDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: "#0b3b28", fontWeight: 950 }}>
          {editingCourseId ? "Edit Course" : "Create Course"}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <TextField label="Course ID" value={courseForm.course_id} disabled={Boolean(editingCourseId)} onChange={(event) => setCourseForm((prev) => ({ ...prev, course_id: event.target.value }))} fullWidth />
          <TextField label="Course Name" value={courseForm.course_name} onChange={(event) => setCourseForm((prev) => ({ ...prev, course_name: event.target.value }))} fullWidth />
          <TextField label="Description" value={courseForm.description} onChange={(event) => setCourseForm((prev) => ({ ...prev, description: event.target.value }))} fullWidth multiline minRows={3} />
          <TextField label="Start Date" type="date" value={courseForm.start_date} onChange={(event) => setCourseForm((prev) => ({ ...prev, start_date: event.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="End Date" type="date" value={courseForm.end_date} onChange={(event) => setCourseForm((prev) => ({ ...prev, end_date: event.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Total Contact Hours" type="number" value={courseForm.total_contact_hours} onChange={(event) => setCourseForm((prev) => ({ ...prev, total_contact_hours: event.target.value }))} fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCourseDialogOpen(false)} sx={buttonSx}>Cancel</Button>
          <Button variant="contained" onClick={saveCourse} disabled={loading} sx={{ ...buttonSx, bgcolor: "#ff7a1a" }}>
            {editingCourseId ? "Save Course" : "Create Course"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={moduleDialogOpen} onClose={() => setModuleDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ color: "#0b3b28", fontWeight: 950 }}>
          {editingModuleId ? "Edit Module" : "Add Module"}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField label="Module Title" value={moduleForm.title} onChange={(event) => setModuleForm((prev) => ({ ...prev, title: event.target.value }))} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Status" value={moduleForm.status} onChange={(event) => setModuleForm((prev) => ({ ...prev, status: event.target.value }))} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" value={moduleForm.description} onChange={(event) => setModuleForm((prev) => ({ ...prev, description: event.target.value }))} fullWidth multiline minRows={3} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Category" value={moduleForm.category} onChange={(event) => setModuleForm((prev) => ({ ...prev, category: event.target.value }))} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Park" value={moduleForm.park} onChange={(event) => setModuleForm((prev) => ({ ...prev, park: event.target.value }))} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Level" value={moduleForm.level} onChange={(event) => setModuleForm((prev) => ({ ...prev, level: event.target.value }))} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Duration" value={moduleForm.duration} onChange={(event) => setModuleForm((prev) => ({ ...prev, duration: event.target.value }))} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Format" value={moduleForm.format} onChange={(event) => setModuleForm((prev) => ({ ...prev, format: event.target.value }))} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Sort Order" type="number" value={moduleForm.sort_order} onChange={(event) => setModuleForm((prev) => ({ ...prev, sort_order: event.target.value }))} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Badge Name" value={moduleForm.badge_name} onChange={(event) => setModuleForm((prev) => ({ ...prev, badge_name: event.target.value }))} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Objectives, one per line" value={moduleForm.objectivesText} onChange={(event) => setModuleForm((prev) => ({ ...prev, objectivesText: event.target.value }))} fullWidth multiline minRows={3} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setModuleDialogOpen(false)} sx={buttonSx}>Cancel</Button>
          <Button variant="contained" onClick={saveModule} disabled={loading} sx={{ ...buttonSx, bgcolor: "#ff7a1a" }}>
            {editingModuleId ? "Save Module" : "Add Module"}
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

export default CourseManagement;
