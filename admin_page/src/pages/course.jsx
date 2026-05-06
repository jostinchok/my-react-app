import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArticleIcon from "@mui/icons-material/Article";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ChecklistIcon from "@mui/icons-material/Checklist";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import LinkIcon from "@mui/icons-material/Link";
import QuizIcon from "@mui/icons-material/Quiz";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import VisibilityIcon from "@mui/icons-material/Visibility";

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
  duration: "45 minutes",
  format: "Blended",
  badge_name: "",
  objectivesText: "",
  status: "Published",
  sort_order: 0,
};

const emptyItemForm = {
  item_type: "page",
  title: "",
  description: "",
  content: "",
  external_url: "",
  status: "published",
  sort_order: 0,
  question: "",
  choicesText: "",
  correctAnswer: 0,
  checklistText: "",
  file: null,
};

const itemTypeMap = {
  page: { label: "Page", icon: <ArticleIcon />, helper: "Rich text learning page" },
  text: { label: "Text", icon: <ArticleIcon />, helper: "Short text lesson" },
  file: { label: "File", icon: <InsertDriveFileIcon />, helper: "PDF, document, slides, or resource" },
  image: { label: "Image", icon: <ImageIcon />, helper: "Screenshot, diagram, or evidence image" },
  video: { label: "Video", icon: <VideoLibraryIcon />, helper: "MP4 or training walkthrough" },
  link: { label: "External Link", icon: <LinkIcon />, helper: "Website, Canvas page, or reference" },
  quiz: { label: "Quiz", icon: <QuizIcon />, helper: "Scenario question with answer choices" },
  checklist: { label: "Checklist", icon: <ChecklistIcon />, helper: "Step-by-step completion list" },
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

const toObjectivesText = (objectives) =>
  Array.isArray(objectives) ? objectives.join("\n") : String(objectives || "");

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });

const splitLines = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const formatCourseDuration = (course) => {
  if (!course?.start_date && !course?.end_date) return "Date not set";
  if (course.start_date && course.end_date) return `${course.start_date} to ${course.end_date}`;
  return course.start_date || course.end_date;
};

const normalizeItem = (item) => ({
  ...item,
  item_type: item.item_type || item.itemType || "page",
  quiz: item.quiz || null,
  checklist: item.checklist || [],
});

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [selectedPreview, setSelectedPreview] = useState(null);

  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);

  const [editingCourseId, setEditingCourseId] = useState("");
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [activeModule, setActiveModule] = useState(null);

  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [itemForm, setItemForm] = useState(emptyItemForm);

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const modules = selectedCourse?.modules || [];
  const totalItems = modules.reduce((sum, module) => sum + (module.items?.length || 0), 0);
  const totalResources = selectedCourse?.resources?.length || 0;

  const activePreviewItem = useMemo(() => {
    if (selectedPreview?.item) return selectedPreview.item;
    const firstModule = modules[0];
    return firstModule?.items?.[0] || null;
  }, [modules, selectedPreview]);

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
    const loadedCourses = data.courses || [];
    setCourses(loadedCourses);
    setSelectedCourseId((prev) => prev || loadedCourses[0]?.course_id || "");
    return loadedCourses;
  };

  const loadCanvasCourse = async (courseId) => {
    if (!courseId) {
      setSelectedCourse(null);
      return;
    }
    const data = await requestJson(`${API_BASE_URL}/api/courses/${encodeURIComponent(courseId)}/canvas`);
    const course = data.course || null;
    if (course) {
      course.modules = (course.modules || []).map((module) => ({
        ...module,
        items: (module.items || []).map(normalizeItem),
      }));
    }
    setSelectedCourse(course);
    setExpandedModules((prev) => {
      if (Object.keys(prev).length) return prev;
      const firstId = course?.modules?.[0]?.module_id;
      return firstId ? { [firstId]: true } : {};
    });
    setSelectedPreview(null);
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      const loadedCourses = await loadCourses();
      const courseId = selectedCourseId || loadedCourses[0]?.course_id || "";
      await loadCanvasCourse(courseId);
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadCanvasCourse(selectedCourseId).catch((error) => showMessage(error.message, "error"));
    }
  }, [selectedCourseId]);

  const seedTemplates = async () => {
    if (!window.confirm("Insert demo Canvas-style SFC course templates? Existing demo template IDs will be replaced.")) return;
    setLoading(true);
    try {
      const data = await requestJson(`${API_BASE_URL}/api/demo/canvas-seed`, { method: "POST" });
      showMessage(data.message || "Demo templates inserted.");
      const loadedCourses = await loadCourses();
      setSelectedCourseId(loadedCourses.find((course) => course.course_id === "SFC-FIELD-2026")?.course_id || loadedCourses[0]?.course_id || "");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

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
        isEdit ? `${API_BASE_URL}/api/courses/${encodeURIComponent(editingCourseId)}` : `${API_BASE_URL}/api/courses`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...courseForm,
            total_contact_hours: Number(courseForm.total_contact_hours) || 0,
          }),
        }
      );
      setCourseDialogOpen(false);
      setSelectedCourseId(courseForm.course_id);
      await loadCourses();
      await loadCanvasCourse(courseForm.course_id);
      showMessage(isEdit ? "Course updated." : "Course created.");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course, modules, items, and resources?")) return;
    setLoading(true);
    try {
      await requestJson(`${API_BASE_URL}/api/courses/${encodeURIComponent(courseId)}`, { method: "DELETE" });
      const loadedCourses = await loadCourses();
      const nextId = loadedCourses[0]?.course_id || "";
      setSelectedCourseId(nextId);
      await loadCanvasCourse(nextId);
      showMessage("Course deleted.");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModule = () => {
    if (!selectedCourse) {
      showMessage("Create or select a course first.", "warning");
      return;
    }
    setEditingModuleId(null);
    setModuleForm({ ...emptyModuleForm, sort_order: modules.length + 1 });
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
      duration: module.duration || "45 minutes",
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

      setModuleDialogOpen(false);
      await loadCourses();
      await loadCanvasCourse(selectedCourse.course_id);
      showMessage(editingModuleId ? "Module updated." : "Module added.");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteModule = async (moduleId) => {
    if (!window.confirm("Delete this module and all Canvas-style items inside it?")) return;
    setLoading(true);
    try {
      await requestJson(`${API_BASE_URL}/api/modules/${moduleId}`, { method: "DELETE" });
      await loadCourses();
      await loadCanvasCourse(selectedCourse.course_id);
      showMessage("Module deleted.");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateItem = (module) => {
    setActiveModule(module);
    setEditingItem(null);
    setItemForm({
      ...emptyItemForm,
      sort_order: (module.items?.length || 0) + 1,
    });
    setItemDialogOpen(true);
  };

  const openEditItem = (module, item) => {
    const quiz = item.quiz || {};
    setActiveModule(module);
    setEditingItem(item);
    setItemForm({
      item_type: item.item_type || "page",
      title: item.title || "",
      description: item.description || "",
      content: item.content || "",
      external_url: item.external_url || "",
      status: item.status || "published",
      sort_order: item.sort_order || 0,
      question: quiz.question || "",
      choicesText: Array.isArray(quiz.choices) ? quiz.choices.join("\n") : "",
      correctAnswer: Number(quiz.answer || 0),
      checklistText: Array.isArray(item.checklist) ? item.checklist.join("\n") : "",
      file: null,
    });
    setItemDialogOpen(true);
  };

  const saveItem = async () => {
    if (!activeModule || !itemForm.title) {
      showMessage("Item title is required.", "warning");
      return;
    }

    setLoading(true);
    try {
      const dataUrl = await toDataUrl(itemForm.file);
      const choices = splitLines(itemForm.choicesText);
      const checklist = splitLines(itemForm.checklistText);

      const body = {
        item_type: itemForm.item_type,
        title: itemForm.title,
        description: itemForm.description,
        content: itemForm.content,
        external_url: itemForm.external_url,
        status: itemForm.status,
        sort_order: Number(itemForm.sort_order) || 0,
        quiz:
          itemForm.item_type === "quiz"
            ? {
                question: itemForm.question,
                choices,
                answer: Number(itemForm.correctAnswer) || 0,
              }
            : null,
        checklist: itemForm.item_type === "checklist" ? checklist : null,
        fileName: itemForm.file?.name || "",
        dataUrl,
      };

      await requestJson(
        editingItem
          ? `${API_BASE_URL}/api/modules/${activeModule.module_id}/items/${editingItem.item_id}`
          : `${API_BASE_URL}/api/modules/${activeModule.module_id}/items`,
        {
          method: editingItem ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      setItemDialogOpen(false);
      await loadCanvasCourse(selectedCourse.course_id);
      showMessage(editingItem ? "Module item updated." : "Module item added.");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (module, item) => {
    if (!window.confirm(`Delete "${item.title}" from this module?`)) return;
    setLoading(true);
    try {
      await requestJson(`${API_BASE_URL}/api/modules/${module.module_id}/items/${item.item_id}`, { method: "DELETE" });
      await loadCanvasCourse(selectedCourse.course_id);
      showMessage("Module item deleted.");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const renderPreview = () => {
    if (!activePreviewItem) {
      return (
        <Typography sx={{ color: "#607166", fontWeight: 800 }}>
          Select a module item to preview what Park Guides will see.
        </Typography>
      );
    }

    const type = activePreviewItem.item_type || "page";
    const config = itemTypeMap[type] || itemTypeMap.page;

    return (
      <Stack gap={1.5}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Box className="canvas-item-icon">{config.icon}</Box>
          <Box>
            <Typography sx={{ color: "#173126", fontWeight: 950, fontSize: "1.15rem" }}>
              {activePreviewItem.title}
            </Typography>
            <Typography sx={{ color: "#607166", fontWeight: 800 }}>{config.label}</Typography>
          </Box>
        </Stack>

        {activePreviewItem.description && (
          <Typography sx={{ color: "#53685a", fontWeight: 800 }}>{activePreviewItem.description}</Typography>
        )}

        {(type === "page" || type === "text") && (
          <Paper sx={{ p: 2, borderRadius: "16px", bgcolor: "#fffaf0", border: "1px solid #eadfbf" }}>
            <Typography sx={{ color: "#173126", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {activePreviewItem.content || "No page content yet."}
            </Typography>
          </Paper>
        )}

        {type === "link" && (
          <Button
            component="a"
            href={activePreviewItem.external_url}
            target="_blank"
            rel="noreferrer"
            startIcon={<LinkIcon />}
            sx={{ ...buttonSx, justifyContent: "flex-start", color: "#173126" }}
          >
            {activePreviewItem.external_url || "No URL provided"}
          </Button>
        )}

        {["file", "image", "video"].includes(type) && (
          <Paper sx={{ p: 2, borderRadius: "16px", bgcolor: "#fffaf0", border: "1px solid #eadfbf" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography sx={{ color: "#173126", fontWeight: 950 }}>
                  {activePreviewItem.file_name || "No uploaded file yet"}
                </Typography>
                <Typography sx={{ color: "#607166", fontWeight: 800 }}>
                  {activePreviewItem.mime_type || "File"} · {activePreviewItem.size || "0 B"}
                </Typography>
              </Box>
              {activePreviewItem.download_url && (
                <IconButton
                  component="a"
                  href={`${API_BASE_URL}${activePreviewItem.download_url}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileDownloadIcon />
                </IconButton>
              )}
            </Stack>
          </Paper>
        )}

        {type === "quiz" && (
          <Paper sx={{ p: 2, borderRadius: "16px", bgcolor: "#fffaf0", border: "1px solid #eadfbf" }}>
            <Typography sx={{ color: "#173126", fontWeight: 950 }}>
              {activePreviewItem.quiz?.question || "No quiz question yet."}
            </Typography>
            <Stack gap={1} sx={{ mt: 1.4 }}>
              {(activePreviewItem.quiz?.choices || []).map((choice, index) => (
                <Box
                  key={`${choice}-${index}`}
                  sx={{
                    p: 1.2,
                    borderRadius: "12px",
                    bgcolor: index === Number(activePreviewItem.quiz?.answer) ? "#dcf8c6" : "#ffffff",
                    border: "1px solid #eadfbf",
                    color: "#173126",
                    fontWeight: 800,
                  }}
                >
                  {index + 1}. {choice}
                </Box>
              ))}
            </Stack>
          </Paper>
        )}

        {type === "checklist" && (
          <Paper sx={{ p: 2, borderRadius: "16px", bgcolor: "#fffaf0", border: "1px solid #eadfbf" }}>
            <Stack gap={1}>
              {(activePreviewItem.checklist || []).map((step, index) => (
                <Stack key={`${step}-${index}`} direction="row" gap={1} alignItems="center">
                  <Chip label={String(index + 1).padStart(2, "0")} size="small" sx={{ bgcolor: "#ffd84d", color: "#173126", fontWeight: 950 }} />
                  <Typography sx={{ color: "#173126", fontWeight: 800 }}>{step}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        )}
      </Stack>
    );
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
            <Typography className="admin-dashboard-kicker">Canvas-style training builder</Typography>
            <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1 }}>
              Course modules
            </Typography>
            <Typography sx={{ mt: 1.4, color: "#173126", fontWeight: 850, maxWidth: 820 }}>
              Build SFC training like Canvas: courses contain modules, and modules contain pages, files, images,
              videos, links, quizzes, and checklists.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} gap={1.2} alignSelf={{ xs: "stretch", md: "center" }}>
            <Button onClick={refreshAll} startIcon={<RefreshIcon />} sx={{ ...buttonSx, bgcolor: "#fffdf5", color: "#173126" }}>
              Refresh
            </Button>
            <Button onClick={seedTemplates} startIcon={<AutoAwesomeIcon />} sx={{ ...buttonSx, bgcolor: "#dcf8c6", color: "#173126" }}>
              Insert Templates
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateCourse}
              sx={{ ...buttonSx, background: "linear-gradient(135deg, #FF7A1A, #FFD84D)", color: "#173126" }}
            >
              Create Course
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={2.4}>
        <Grid item xs={12} lg={3.2}>
          <Box sx={{ ...panelSx, p: 2.2 }}>
            <Typography className="admin-dashboard-kicker">Courses</Typography>
            <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950, mb: 2 }}>
              Course list
            </Typography>

            <Stack gap={1.2}>
              {courses.map((course) => {
                const active = selectedCourseId === course.course_id;
                return (
                  <Box
                    key={course.course_id}
                    onClick={() => setSelectedCourseId(course.course_id)}
                    sx={{
                      p: 1.6,
                      borderRadius: "16px",
                      cursor: "pointer",
                      border: active ? "2px solid #ff7a1a" : "1px solid #eadfbf",
                      bgcolor: active ? "#fff3c4" : "#fffaf0",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Chip label={course.course_id} size="small" sx={{ bgcolor: "#f3ffd4", color: "#173126", fontWeight: 950 }} />
                      <Stack direction="row">
                        <IconButton size="small" onClick={(event) => { event.stopPropagation(); openEditCourse(course); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={(event) => { event.stopPropagation(); deleteCourse(course.course_id); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                    <Typography sx={{ color: "#173126", fontWeight: 950, mt: 1 }}>{course.course_name}</Typography>
                    <Typography sx={{ color: "#607166", fontWeight: 750, fontSize: "0.86rem", mt: 0.4 }}>
                      {course.description || "No description yet."}
                    </Typography>
                  </Box>
                );
              })}

              {courses.length === 0 && (
                <Typography sx={{ color: "#607166", fontWeight: 800 }}>
                  No courses yet. Create one or insert the demo templates.
                </Typography>
              )}
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={12} lg={5.8}>
          <Box sx={{ ...panelSx, p: { xs: 2.2, md: 3 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={2}>
              <Box>
                <Typography className="admin-dashboard-kicker">Selected course</Typography>
                <Typography variant="h4" sx={{ color: "#173126", fontWeight: 950 }}>
                  {selectedCourse?.course_name || "No course selected"}
                </Typography>
                {selectedCourse && (
                  <Typography sx={{ color: "#607166", fontWeight: 800, mt: 0.5 }}>
                    {formatCourseDuration(selectedCourse)}
                  </Typography>
                )}
              </Box>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateModule}
                disabled={!selectedCourse}
                sx={{ ...buttonSx, background: "linear-gradient(135deg, #FF7A1A, #FFD84D)", color: "#173126" }}
              >
                Add Module
              </Button>
            </Stack>

            <Grid container spacing={1.4} sx={{ mt: 2 }}>
              {[
                ["Modules", modules.length],
                ["Items", totalItems],
                ["Resources", totalResources],
                ["Hours", selectedCourse?.total_contact_hours || 0],
              ].map(([label, value]) => (
                <Grid item xs={6} md={3} key={label}>
                  <Box sx={{ p: 1.4, borderRadius: "14px", bgcolor: "#fffaf0", border: "1px solid #eadfbf" }}>
                    <Typography className="admin-dashboard-kicker">{label}</Typography>
                    <Typography sx={{ color: "#173126", fontWeight: 950, fontSize: "1.55rem" }}>{value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {loading && <LinearProgress sx={{ my: 2, borderRadius: 999, "& .MuiLinearProgress-bar": { bgcolor: "#ff7a1a" } }} />}

            <Stack gap={1.6} sx={{ mt: 2.4 }}>
              {modules.map((module, moduleIndex) => {
                const expanded = Boolean(expandedModules[module.module_id]);
                return (
                  <Box key={module.module_id} className="canvas-module-card">
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.4}>
                      <Stack direction="row" alignItems="center" gap={1.4} sx={{ minWidth: 0 }}>
                        <IconButton onClick={() => toggleModule(module.module_id)} className="canvas-module-toggle">
                          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ color: "#173126", fontWeight: 950, fontSize: "1.08rem" }}>
                            Module {moduleIndex + 1}: {module.title}
                          </Typography>
                          <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mt: 0.8 }}>
                            <Chip label={module.status || "Published"} size="small" sx={{ bgcolor: "#dcf8c6", color: "#173126", fontWeight: 950 }} />
                            <Chip label={module.level || "Beginner"} size="small" sx={{ bgcolor: "#fff3c4", color: "#173126", fontWeight: 950 }} />
                            <Chip label={module.duration || "45 minutes"} size="small" sx={{ bgcolor: "#edf4ff", color: "#173126", fontWeight: 950 }} />
                            <Chip label={`${module.items?.length || 0} items`} size="small" sx={{ bgcolor: "#ffe2cf", color: "#173126", fontWeight: 950 }} />
                          </Stack>
                        </Box>
                      </Stack>

                      <Stack direction="row" gap={0.6}>
                        <Button size="small" startIcon={<AddIcon />} onClick={() => openCreateItem(module)} sx={{ ...buttonSx, bgcolor: "#ffcf45", color: "#173126" }}>
                          Item
                        </Button>
                        <IconButton size="small" onClick={() => openEditModule(module)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => deleteModule(module.module_id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>

                    <Collapse in={expanded}>
                      <Divider sx={{ my: 1.4 }} />
                      <Typography sx={{ color: "#607166", fontWeight: 800, mb: 1.3 }}>
                        {module.description || "No module description yet."}
                      </Typography>

                      <Stack gap={1}>
                        {(module.items || []).map((item) => {
                          const type = item.item_type || "page";
                          const config = itemTypeMap[type] || itemTypeMap.page;
                          return (
                            <Box
                              key={item.item_id}
                              className="canvas-item-row"
                              onClick={() => setSelectedPreview({ module, item })}
                            >
                              <Stack direction="row" alignItems="center" gap={1.2} sx={{ minWidth: 0 }}>
                                <Box className="canvas-item-icon">{config.icon}</Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ color: "#173126", fontWeight: 950 }}>{item.title}</Typography>
                                  <Typography sx={{ color: "#607166", fontWeight: 750, fontSize: "0.86rem" }}>
                                    {config.label} · {item.description || item.external_url || item.file_name || "No description"}
                                  </Typography>
                                </Box>
                              </Stack>

                              <Stack direction="row" alignItems="center" gap={0.6}>
                                <Chip label={item.status || "published"} size="small" sx={{ bgcolor: item.status === "draft" ? "#ffe2cf" : "#dcf8c6", color: "#173126", fontWeight: 900 }} />
                                <IconButton size="small" onClick={(event) => { event.stopPropagation(); setSelectedPreview({ module, item }); }}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={(event) => { event.stopPropagation(); openEditItem(module, item); }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={(event) => { event.stopPropagation(); deleteItem(module, item); }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Box>
                          );
                        })}

                        {(module.items || []).length === 0 && (
                          <Box sx={{ p: 2, borderRadius: "14px", bgcolor: "#fffaf0", border: "1px dashed #e8c777" }}>
                            <Typography sx={{ color: "#607166", fontWeight: 850 }}>
                              No module items yet. Add a page, file, video, link, quiz, or checklist.
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Collapse>
                  </Box>
                );
              })}

              {selectedCourse && modules.length === 0 && (
                <Box sx={{ p: 3, borderRadius: "18px", bgcolor: "#fffaf0", border: "1px dashed #e8c777" }}>
                  <Typography sx={{ color: "#173126", fontWeight: 950 }}>This course has no modules yet.</Typography>
                  <Typography sx={{ color: "#607166", fontWeight: 800, mt: 0.6 }}>
                    Add a module first, then place learning items inside it like Canvas.
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={12} lg={3}>
          <Box sx={{ ...panelSx, p: 2.2, position: { lg: "sticky" }, top: 100 }}>
            <Typography className="admin-dashboard-kicker">Park Guide Preview</Typography>
            <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950, mb: 1.6 }}>
              Preview
            </Typography>
            {renderPreview()}
          </Box>
        </Grid>
      </Grid>

      <Dialog open={courseDialogOpen} onClose={() => setCourseDialogOpen(false)} fullWidth maxWidth="sm" className="canvas-builder-dialog">
        <DialogTitle>{editingCourseId ? "Edit Course" : "Create Course"}</DialogTitle>
        <DialogContent className="canvas-dialog-grid">
          <TextField label="Course ID" value={courseForm.course_id} disabled={Boolean(editingCourseId)} onChange={(event) => setCourseForm((prev) => ({ ...prev, course_id: event.target.value }))} fullWidth />
          <TextField label="Course Name" value={courseForm.course_name} onChange={(event) => setCourseForm((prev) => ({ ...prev, course_name: event.target.value }))} fullWidth />
          <TextField label="Description" value={courseForm.description} onChange={(event) => setCourseForm((prev) => ({ ...prev, description: event.target.value }))} fullWidth multiline minRows={3} />
          <TextField label="Start Date" type="date" value={courseForm.start_date} onChange={(event) => setCourseForm((prev) => ({ ...prev, start_date: event.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="End Date" type="date" value={courseForm.end_date} onChange={(event) => setCourseForm((prev) => ({ ...prev, end_date: event.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Total Contact Hours" type="number" value={courseForm.total_contact_hours} onChange={(event) => setCourseForm((prev) => ({ ...prev, total_contact_hours: event.target.value }))} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCourseDialogOpen(false)} sx={buttonSx}>Cancel</Button>
          <Button variant="contained" onClick={saveCourse} sx={{ ...buttonSx, background: "linear-gradient(135deg, #FF7A1A, #FFD84D)", color: "#173126" }}>
            Save Course
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={moduleDialogOpen} onClose={() => setModuleDialogOpen(false)} fullWidth maxWidth="md" className="canvas-builder-dialog">
        <DialogTitle>{editingModuleId ? "Edit Module" : "Add Module"}</DialogTitle>
        <DialogContent className="canvas-dialog-grid">
          <TextField label="Module Title" value={moduleForm.title} onChange={(event) => setModuleForm((prev) => ({ ...prev, title: event.target.value }))} fullWidth />
          <TextField label="Short Description" value={moduleForm.description} onChange={(event) => setModuleForm((prev) => ({ ...prev, description: event.target.value }))} fullWidth multiline minRows={3} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField label="Category" value={moduleForm.category} onChange={(event) => setModuleForm((prev) => ({ ...prev, category: event.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={4}><TextField label="Park" value={moduleForm.park} onChange={(event) => setModuleForm((prev) => ({ ...prev, park: event.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={4}><TextField label="Level" value={moduleForm.level} onChange={(event) => setModuleForm((prev) => ({ ...prev, level: event.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={4}><TextField label="Duration" value={moduleForm.duration} onChange={(event) => setModuleForm((prev) => ({ ...prev, duration: event.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={4}><TextField label="Badge Name" value={moduleForm.badge_name} onChange={(event) => setModuleForm((prev) => ({ ...prev, badge_name: event.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={4}><TextField label="Sort Order" type="number" value={moduleForm.sort_order} onChange={(event) => setModuleForm((prev) => ({ ...prev, sort_order: event.target.value }))} fullWidth /></Grid>
          </Grid>
          <TextField label="Learning objectives, one per line" value={moduleForm.objectivesText} onChange={(event) => setModuleForm((prev) => ({ ...prev, objectivesText: event.target.value }))} fullWidth multiline minRows={4} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleDialogOpen(false)} sx={buttonSx}>Cancel</Button>
          <Button variant="contained" onClick={saveModule} sx={{ ...buttonSx, background: "linear-gradient(135deg, #FF7A1A, #FFD84D)", color: "#173126" }}>
            Save Module
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} fullWidth maxWidth="md" className="canvas-builder-dialog">
        <DialogTitle>{editingItem ? "Edit Module Item" : "Add Module Item"}</DialogTitle>
        <DialogContent className="canvas-dialog-grid">
          <Grid container spacing={1.4}>
            {Object.entries(itemTypeMap).map(([type, config]) => (
              <Grid item xs={6} md={3} key={type}>
                <Box
                  onClick={() => setItemForm((prev) => ({ ...prev, item_type: type }))}
                  className={`canvas-type-card ${itemForm.item_type === type ? "active" : ""}`}
                >
                  <Box className="canvas-item-icon">{config.icon}</Box>
                  <Typography sx={{ color: "#173126", fontWeight: 950 }}>{config.label}</Typography>
                  <Typography sx={{ color: "#607166", fontWeight: 750, fontSize: "0.78rem" }}>{config.helper}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <TextField label="Item Title" value={itemForm.title} onChange={(event) => setItemForm((prev) => ({ ...prev, title: event.target.value }))} fullWidth />
          <TextField label="Description" value={itemForm.description} onChange={(event) => setItemForm((prev) => ({ ...prev, description: event.target.value }))} fullWidth multiline minRows={2} />

          {(itemForm.item_type === "page" || itemForm.item_type === "text") && (
            <TextField label="Page / text content" value={itemForm.content} onChange={(event) => setItemForm((prev) => ({ ...prev, content: event.target.value }))} fullWidth multiline minRows={8} />
          )}

          {itemForm.item_type === "link" && (
            <TextField label="External URL" value={itemForm.external_url} onChange={(event) => setItemForm((prev) => ({ ...prev, external_url: event.target.value }))} fullWidth />
          )}

          {["file", "image", "video"].includes(itemForm.item_type) && (
            <Box sx={{ p: 2, borderRadius: "16px", border: "1px dashed #e8c777", bgcolor: "#fffaf0" }}>
              <Button component="label" startIcon={<UploadFileIcon />} sx={{ ...buttonSx, bgcolor: "#fff3c4", color: "#173126" }}>
                Choose {itemTypeMap[itemForm.item_type].label}
                <input hidden type="file" onChange={(event) => setItemForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))} />
              </Button>
              <Typography sx={{ mt: 1, color: "#607166", fontWeight: 800 }}>
                {itemForm.file ? itemForm.file.name : editingItem?.file_name || "No file selected"}
              </Typography>
            </Box>
          )}

          {itemForm.item_type === "quiz" && (
            <>
              <TextField label="Question" value={itemForm.question} onChange={(event) => setItemForm((prev) => ({ ...prev, question: event.target.value }))} fullWidth multiline minRows={2} />
              <TextField label="Choices, one per line" value={itemForm.choicesText} onChange={(event) => setItemForm((prev) => ({ ...prev, choicesText: event.target.value }))} fullWidth multiline minRows={4} />
              <TextField label="Correct answer index, starting from 0" type="number" value={itemForm.correctAnswer} onChange={(event) => setItemForm((prev) => ({ ...prev, correctAnswer: event.target.value }))} fullWidth />
            </>
          )}

          {itemForm.item_type === "checklist" && (
            <TextField label="Checklist items, one per line" value={itemForm.checklistText} onChange={(event) => setItemForm((prev) => ({ ...prev, checklistText: event.target.value }))} fullWidth multiline minRows={6} />
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField select label="Status" value={itemForm.status} onChange={(event) => setItemForm((prev) => ({ ...prev, status: event.target.value }))} fullWidth>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Sort Order" type="number" value={itemForm.sort_order} onChange={(event) => setItemForm((prev) => ({ ...prev, sort_order: event.target.value }))} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)} sx={buttonSx}>Cancel</Button>
          <Button variant="contained" onClick={saveItem} sx={{ ...buttonSx, background: "linear-gradient(135deg, #FF7A1A, #FFD84D)", color: "#173126" }}>
            Save Item
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3200} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CourseManagement;
