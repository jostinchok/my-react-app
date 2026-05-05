import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  InputAdornment,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import OndemandVideoOutlinedIcon from "@mui/icons-material/OndemandVideoOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { ModuleEditor } from "./training_module.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4001";

const emptyForm = {
  course_id: "",
  course_name: "",
  description: "",
  start_date: "",
  end_date: "",
  total_contact_hours: "",
};

const formatDuration = (start, end) => {
  if (!start && !end) return "—";
  if (start && end) return `${start} → ${end}`;
  return start || end;
};

const formatFileSize = (bytes) => {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const formatUploadedAt = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleString();
};

function countFeatures(blocks = []) {
  return blocks.reduce(
    (acc, b) => {
      if (b.type === "text") acc.lesson += 1;
      else if (b.type === "quiz") acc.quiz += 1;
      else if (b.type === "video") acc.video += 1;
      else if (b.type === "image") acc.image += 1;
      return acc;
    },
    { lesson: 0, quiz: 0, video: 0, image: 0 }
  );
}

function blockLabel(block, idx) {
  const n = `${idx + 1}.0`;
  if (block.type === "quiz") return `${n} Quiz`;
  if (block.type === "video") return `${n} Video`;
  if (block.type === "image") return `${n} Image`;
  if (block.type === "text") return `${n} ${block.title || "Lesson"}`;
  return `${n} Content`;
}

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modulesByCourse, setModulesByCourse] = useState({});
  const [structureSearch, setStructureSearch] = useState("");
  const [mainTab, setMainTab] = useState(0);
  const [forumVisibility, setForumVisibility] = useState("private");
  const [selectedModule, setSelectedModule] = useState(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [editCourseForm, setEditCourseForm] = useState(emptyForm);
  const [editCourseLoading, setEditCourseLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [resourcesByCourse, setResourcesByCourse] = useState({});
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourceUploading, setResourceUploading] = useState(false);

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const loadCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load courses.");
      setCourses(data.courses || []);
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const loadModulesForCourse = useCallback(async (courseId) => {
    if (!courseId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/${encodeURIComponent(courseId)}/modules`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load modules.");
      setModulesByCourse((prev) => ({ ...prev, [courseId]: Array.isArray(data.modules) ? data.modules : [] }));
    } catch (error) {
      showMessage(error.message, "error");
    }
  }, []);

  const loadResourcesForCourse = useCallback(async (courseId) => {
    if (!courseId) return;
    setResourcesLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/${encodeURIComponent(courseId)}/resources`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load resources.");
      setResourcesByCourse((prev) => ({
        ...prev,
        [courseId]: Array.isArray(data.resources) ? data.resources : [],
      }));
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setResourcesLoading(false);
    }
  }, []);

  const handleResourceUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedCourse) return;
    setResourceUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `${API_BASE_URL}/api/courses/${encodeURIComponent(selectedCourse.course_id)}/resources`,
        { method: "POST", body: formData }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to upload resource.");
      await loadResourcesForCourse(selectedCourse.course_id);
      showMessage("Resource uploaded.");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setResourceUploading(false);
    }
  };

  const handleResourceDelete = async (resource) => {
    if (!selectedCourse || !resource) return;
    if (!window.confirm(`Delete "${resource.original_name}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/courses/${encodeURIComponent(selectedCourse.course_id)}/resources/${encodeURIComponent(resource.resource_id)}`,
        { method: "DELETE" }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to delete resource.");
      await loadResourcesForCourse(selectedCourse.course_id);
      showMessage("Resource deleted.");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const buildResourceDownloadUrl = (resource) => {
    if (!selectedCourse || !resource) return "#";
    return `${API_BASE_URL}/api/courses/${encodeURIComponent(selectedCourse.course_id)}/resources/${encodeURIComponent(resource.resource_id)}/download`;
  };

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  useEffect(() => {
    if (!selectedCourse?.course_id) return;
    loadModulesForCourse(selectedCourse.course_id);
    loadResourcesForCourse(selectedCourse.course_id);
  }, [selectedCourse?.course_id, loadModulesForCourse, loadResourcesForCourse]);

  const modulesForSelected = useMemo(() => {
    if (!selectedCourse) return [];
    const entry = modulesByCourse[selectedCourse.course_id];
    return Array.isArray(entry) ? entry : [];
  }, [modulesByCourse, selectedCourse]);

  const sortedCourses = useMemo(() => {
    return courses
      .filter(Boolean)
      .filter((c) => {
        if (!courseSearch.trim()) return true;
        const q = courseSearch.toLowerCase();
        return (
          String(c.course_name || "").toLowerCase().includes(q) ||
          String(c.course_id || "").toLowerCase().includes(q) ||
          String(c.description || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => String(a.course_id || "").localeCompare(String(b.course_id || "")));
  }, [courses, courseSearch]);

  const filteredStructureModules = useMemo(() => {
    if (!structureSearch.trim()) return modulesForSelected;
    const q = structureSearch.toLowerCase();
    return modulesForSelected.filter(
      (m) =>
        String(m.title || "").toLowerCase().includes(q) ||
        String(m.description || "").toLowerCase().includes(q)
    );
  }, [modulesForSelected, structureSearch]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCreate = async () => {
    if (!form.course_id || !form.course_name || !form.start_date || !form.end_date || !form.total_contact_hours) {
      showMessage("Please fill in Course ID, Course Name, Duration and Total Contact Hours.", "warning");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          total_contact_hours: Number(form.total_contact_hours),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to create course.");
      await loadCourses();
      setForm(emptyForm);
      setOpen(false);
      showMessage("Course created successfully.");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this course?");
    if (!confirmDelete) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/${encodeURIComponent(courseId)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete course.");
      setCourses((prev) => prev.filter((course) => course.course_id !== courseId));
      setModulesByCourse((prev) => {
        const next = { ...prev };
        delete next[courseId];
        return next;
      });
      if (selectedCourse?.course_id === courseId) {
        setSelectedCourse(null);
        setSelectedModule(null);
      }
      showMessage("Course deleted successfully.");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const openCourseEditor = (course) => {
    setEditCourseForm({
      course_id: course.course_id || "",
      course_name: course.course_name || "",
      description: course.description || "",
      start_date: course.start_date || "",
      end_date: course.end_date || "",
      total_contact_hours: String(course.total_contact_hours ?? ""),
    });
    setEditCourseOpen(true);
  };

  const handleEditCourseChange = (field) => (event) => {
    setEditCourseForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleUpdateCourse = async () => {
    if (!editCourseForm.course_id || !editCourseForm.course_name || !editCourseForm.start_date || !editCourseForm.end_date || !editCourseForm.total_contact_hours) {
      showMessage("Please fill in Course Name, Duration and Total Contact Hours.", "warning");
      return;
    }
    setEditCourseLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/courses/${encodeURIComponent(editCourseForm.course_id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_name: editCourseForm.course_name,
            description: editCourseForm.description,
            start_date: editCourseForm.start_date,
            end_date: editCourseForm.end_date,
            total_contact_hours: Number(editCourseForm.total_contact_hours),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update course.");
      await loadCourses();
      if (selectedCourse?.course_id === editCourseForm.course_id) {
        setSelectedCourse((prev) => ({
          ...prev,
          ...data.course,
        }));
      }
      setEditCourseOpen(false);
      showMessage("Course details updated.");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setEditCourseLoading(false);
    }
  };

  const handleAddModule = () => {
    if (!selectedCourse) return;
    const createModule = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/courses/${encodeURIComponent(selectedCourse.course_id)}/modules`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "New module",
              description: "",
              status: "Draft",
              contentBlocks: [],
            }),
          }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to create module.");
        await loadCourses();
        await loadModulesForCourse(selectedCourse.course_id);
        if (data.module) setSelectedModule(data.module);
      } catch (error) {
        showMessage(error.message, "error");
      }
    };
    createModule();
  };

  const handleSaveModule = (updated) => {
    if (!selectedCourse) return;
    const saveModule = async () => {
      try {
        const normalizeMediaBlocks = async () => {
          const blocks = Array.isArray(updated.contentBlocks) ? updated.contentBlocks : [];
          const nextBlocks = [];
          for (const block of blocks) {
            if ((block.type === "image" || block.type === "video") && block.file instanceof File) {
              const fd = new FormData();
              fd.append("file", block.file);
              const uploadResponse = await fetch(
                `${API_BASE_URL}/api/modules/${encodeURIComponent(updated.id)}/media`,
                {
                  method: "POST",
                  body: fd,
                }
              );
              const uploadData = await uploadResponse.json();
              if (!uploadResponse.ok) throw new Error(uploadData.message || "Unable to upload media file.");
              nextBlocks.push({
                ...block,
                media_url: uploadData.media_url,
                file: null,
              });
            } else {
              nextBlocks.push({
                ...block,
                file: null,
              });
            }
          }
          return nextBlocks;
        };

        const payload = {
          ...updated,
          contentBlocks: await normalizeMediaBlocks(),
        };

        const response = await fetch(
          `${API_BASE_URL}/api/courses/${encodeURIComponent(selectedCourse.course_id)}/modules/${encodeURIComponent(updated.id)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to save module.");
        await loadCourses();
        await loadModulesForCourse(selectedCourse.course_id);
        setSelectedModule(data.module || updated);
        showMessage("Module saved to database.");
      } catch (error) {
        showMessage(error.message, "error");
      }
    };
    saveModule();
  };

  const handleDeleteModule = (moduleId) => {
    if (!selectedCourse) return;
    if (!window.confirm("Remove this module from the course?")) return;
    const deleteModule = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/courses/${encodeURIComponent(selectedCourse.course_id)}/modules/${encodeURIComponent(moduleId)}`,
          { method: "DELETE" }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to remove module.");
        await loadCourses();
        await loadModulesForCourse(selectedCourse.course_id);
        if (selectedModule?.id === moduleId) setSelectedModule(null);
        showMessage("Module removed.");
      } catch (error) {
        showMessage(error.message, "error");
      }
    };
    deleteModule();
  };

  const handleRenameModule = (moduleItem) => {
    if (!selectedCourse) return;
    const renamed = window.prompt("Enter new module name:", moduleItem.title || "");
    if (renamed === null) return;
    const nextTitle = renamed.trim();
    if (!nextTitle || nextTitle === moduleItem.title) return;
    handleSaveModule({ ...moduleItem, title: nextTitle });
  };

  if (selectedModule && selectedCourse) {
    return (
      <ModuleEditor
        module={selectedModule}
        onBack={() => setSelectedModule(null)}
        onSave={handleSaveModule}
      />
    );
  }

  if (selectedCourse) {
    return (
      <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "background.default", pb: 4 }}>
        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
          <Button
            startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 14 }} />}
            onClick={() => {
              setSelectedCourse(null);
              setSelectedModule(null);
              setMainTab(0);
              setStructureSearch("");
            }}
            sx={{ mb: 2, textTransform: "none", fontWeight: 700, color: "primary.dark" }}
          >
            All courses
          </Button>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ flex: "1 1 280px" }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
                {selectedCourse.course_name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: "block", mt: 0.75, letterSpacing: "0.12em", color: "text.secondary", fontWeight: 700 }}
              >
                COURSE OVERVIEW
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                <Chip size="small" label={selectedCourse.course_id} color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                <Chip
                  size="small"
                  label={`${modulesForSelected.length} module${modulesForSelected.length === 1 ? "" : "s"}`}
                  sx={{ fontWeight: 700, bgcolor: "secondary.light", color: "secondary.contrastText" }}
                />
                <Chip size="small" label={`${selectedCourse.total_contact_hours} contact hrs`} variant="outlined" />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<EditOutlinedIcon />}
                onClick={() => openCourseEditor(selectedCourse)}
                sx={{ borderRadius: 2, px: 2.2, py: 1.1, fontWeight: 700 }}
              >
                Edit course
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddModule}
                sx={{ borderRadius: 2, px: 2.5, py: 1.1, fontWeight: 700 }}
              >
                Add module
              </Button>
            </Box>
          </Box>

          <Typography sx={{ color: "text.secondary", maxWidth: 900, mb: 3, lineHeight: 1.65 }}>
            {selectedCourse.description || "No description yet. Use modules below to add lessons, videos, images, and quizzes."}
          </Typography>

          <Box sx={{ display: "flex", gap: 3, alignItems: "stretch", flexDirection: { xs: "column", md: "row" } }}>
            <Box
              sx={{
                width: { xs: "100%", md: 300 },
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <TextField
                size="small"
                placeholder="Search modules…"
                value={structureSearch}
                onChange={(e) => setStructureSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "background.paper" },
                }}
              />

              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  py: 1.25,
                  px: 2,
                  borderRadius: 2,
                  bgcolor: "rgba(107, 220, 69, 0.22)",
                  color: "primary.dark",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                Course structure
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {filteredStructureModules.length === 0 ? (
                  <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: "background.paper" }}>
                    <CardContent sx={{ py: 3, textAlign: "center" }}>
                      <Typography color="text.secondary" variant="body2">
                        {modulesForSelected.length === 0
                          ? "No modules yet. Click “Add module”."
                          : "No modules match your search."}
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  filteredStructureModules.map((m, idx) => {
                    const counts = countFeatures(m.contentBlocks);
                    return (
                      <Accordion
                        key={m.id}
                        disableGutters
                        elevation={0}
                        sx={{
                          borderRadius: 3,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.paper",
                          "&:before": { display: "none" },
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", pr: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                              Module {idx + 1}: {m.title}
                            </Typography>
                            <IconButton
                              size="small"
                              aria-label="Edit module"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedModule(m);
                              }}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                            {counts.lesson > 0 && (
                              <Chip icon={<ClassOutlinedIcon />} size="small" label={`${counts.lesson} lesson`} variant="outlined" />
                            )}
                            {counts.quiz > 0 && (
                              <Chip icon={<QuizOutlinedIcon />} size="small" label={`${counts.quiz} quiz`} variant="outlined" />
                            )}
                            {counts.video > 0 && (
                              <Chip icon={<OndemandVideoOutlinedIcon />} size="small" label={`${counts.video} video`} variant="outlined" />
                            )}
                            {counts.image > 0 && (
                              <Chip icon={<ImageOutlinedIcon />} size="small" label={`${counts.image} image`} variant="outlined" />
                            )}
                          </Box>
                          {(m.contentBlocks || []).length > 0 ? (
                            <Box component="ul" sx={{ m: 0, pl: 2.5, color: "text.secondary", fontSize: "0.85rem" }}>
                              {(m.contentBlocks || []).map((b, i) => (
                                <Typography component="li" key={b.id} sx={{ py: 0.25 }}>
                                  {blockLabel(b, i)}
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Empty module — open editor to add content.
                            </Typography>
                          )}
                          <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<EditOutlinedIcon />}
                              onClick={() => setSelectedModule(m)}
                              sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                              Open editor
                            </Button>
                            <Button
                              size="small"
                              startIcon={<EditOutlinedIcon />}
                              sx={{ textTransform: "none" }}
                              onClick={() => handleRenameModule(m)}
                            >
                              Rename
                            </Button>
                            <Button size="small" color="error" sx={{ textTransform: "none" }} onClick={() => handleDeleteModule(m.id)}>
                              Remove
                            </Button>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })
                )}
              </Box>
            </Box>

            <Card
              sx={{
                flex: 1,
                minWidth: 0,
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 8px 28px rgba(135, 69, 0, 0.06)",
              }}
            >
              <Tabs
                value={mainTab}
                onChange={(_, v) => setMainTab(v)}
                sx={{
                  px: 2,
                  pt: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "& .MuiTab-root": { fontWeight: 800, textTransform: "none" },
                  "& .Mui-selected": { color: "primary.dark" },
                  "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0", bgcolor: "primary.main" },
                }}
              >
                <Tab label="Overview" />
                <Tab label="Resources" />
                <Tab label="Forum" />
              </Tabs>
              <CardContent sx={{ p: 3 }}>
                {mainTab === 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                      Course details
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 2 }}>
                      <Box sx={{ p: 2, borderRadius: 3, bgcolor: "rgba(255, 248, 193, 0.35)", border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          Schedule
                        </Typography>
                        <Typography sx={{ fontWeight: 700, mt: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
                          <CalendarMonthOutlinedIcon fontSize="small" color="primary" />
                          {formatDuration(selectedCourse.start_date, selectedCourse.end_date)}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, borderRadius: 3, bgcolor: "rgba(239, 247, 232, 0.9)", border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          Contact hours
                        </Typography>
                        <Typography sx={{ fontWeight: 700, mt: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
                          <ScheduleOutlinedIcon fontSize="small" color="primary" />
                          {selectedCourse.total_contact_hours} hours
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, borderRadius: 3, bgcolor: "background.default", border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          Structure
                        </Typography>
                        <Typography sx={{ fontWeight: 700, mt: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
                          <MenuBookOutlinedIcon fontSize="small" color="primary" />
                          {modulesForSelected.length} modules
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 3, lineHeight: 1.7 }}>
                      Build each module with the editor: add <strong>lessons</strong> (text), <strong>quizzes</strong>,{" "}
                      <strong>video learning</strong>, and <strong>images</strong>. Drag blocks to reorder. Content is saved
                      to the shared database through the admin API.
                    </Typography>
                  </Box>
                )}
                {mainTab === 1 && (
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Course resources
                      </Typography>
                      <Button
                        variant="contained"
                        component="label"
                        color="primary"
                        startIcon={<CloudUploadOutlinedIcon />}
                        disabled={resourceUploading}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                      >
                        {resourceUploading ? "Uploading…" : "Upload file"}
                        <input
                          type="file"
                          hidden
                          onChange={handleResourceUpload}
                        />
                      </Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Upload PDFs, documents, slides, images, or videos. Approved guides can download these from the mobile app.
                    </Typography>
                    {(() => {
                      const resourceList = resourcesByCourse[selectedCourse.course_id] || [];
                      if (resourcesLoading && resourceList.length === 0) {
                        return (
                          <Typography variant="body2" color="text.secondary">Loading resources…</Typography>
                        );
                      }
                      if (resourceList.length === 0) {
                        return (
                          <Box
                            sx={{
                              p: 4,
                              borderRadius: 3,
                              border: "1px dashed",
                              borderColor: "divider",
                              textAlign: "center",
                              color: "text.secondary",
                            }}
                          >
                            <Typography sx={{ fontWeight: 700 }}>No resources yet</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              Click "Upload file" to add the first resource.
                            </Typography>
                          </Box>
                        );
                      }
                      return (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                          {resourceList.map((res) => (
                            <Box
                              key={res.resource_id}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                p: 1.5,
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "background.paper",
                              }}
                            >
                              <InsertDriveFileOutlinedIcon color="primary" />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700 }} noWrap title={res.original_name}>
                                  {res.original_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatFileSize(res.size_bytes)} • {selectedCourse.course_name} • {formatUploadedAt(res.created_at)}
                                  {res.uploaded_by_name ? ` • by ${res.uploaded_by_name}` : ""}
                                </Typography>
                              </Box>
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                startIcon={<DownloadOutlinedIcon />}
                                href={buildResourceDownloadUrl(res)}
                                target="_blank"
                                rel="noopener"
                                sx={{ textTransform: "none", fontWeight: 700 }}
                              >
                                Download
                              </Button>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleResourceDelete(res)}
                                aria-label="delete resource"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      );
                    })()}
                  </Box>
                )}
                {mainTab === 2 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                      Discussion forum
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      value={forumVisibility}
                      onChange={(_, v) => v && setForumVisibility(v)}
                      sx={{ mb: 2 }}
                    >
                      <ToggleButton value="public" sx={{ textTransform: "none", fontWeight: 700, px: 2.5, borderRadius: "20px !important" }}>
                        Public
                      </ToggleButton>
                      <ToggleButton value="private" sx={{ textTransform: "none", fontWeight: 700, px: 2.5, borderRadius: "20px !important" }}>
                        Private
                      </ToggleButton>
                    </ToggleButtonGroup>
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        bgcolor: "background.paper",
                        border: "1px dashed",
                        borderColor: "divider",
                        color: "text.secondary",
                        minHeight: 160,
                      }}
                    >
                      {forumVisibility === "public"
                        ? "Showing public course discussions (placeholder — connect to your forum backend when ready)."
                        : "Showing private instructor-led discussions (placeholder)."}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "background.default", p: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
            Courses
          </Typography>
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 1, letterSpacing: "0.14em", color: "text.secondary", fontWeight: 700 }}
          >
            MANAGE TRAINING COURSES FOR PARK GUIDES
          </Typography>
          <Typography sx={{ mt: 1.5, color: "text.secondary", maxWidth: 560 }}>
            View every course, open a course overview, then add modules with lessons, quizzes, videos, and images.
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ borderRadius: 2, px: 2.5, fontWeight: 700 }}>
          New course
        </Button>
      </Box>

      <Card sx={{ mb: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ py: 2, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Search courses…"
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
            sx={{ flex: "1 1 220px", minWidth: 180 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {sortedCourses.length} course{sortedCourses.length === 1 ? "" : "s"}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {sortedCourses.map((course) => {
          const modCount = Number(course.module_count ?? modulesByCourse[course.course_id]?.length ?? 0);
          return (
            <Grid item xs={12} sm={6} lg={4} key={course.course_id}>
              <Card
                onClick={() => setSelectedCourse(course)}
                sx={{
                  borderRadius: "22px",
                  overflow: "hidden",
                  minHeight: 280,
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(6, 44, 30, 0.08)",
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "0.25s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 14px 34px rgba(135, 69, 0, 0.12)",
                  },
                }}
              >
                <Box
                  sx={{
                    minHeight: 120,
                    p: 2.2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 1,
                    background: "linear-gradient(135deg, rgba(255, 248, 193, 0.85) 0%, rgba(239, 247, 232, 1) 100%)",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.72rem", color: "primary.dark", fontWeight: 800, mb: 0.75 }}>
                      {course.course_id}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.25 }}>
                      {course.course_name}
                    </Typography>
                  </Box>
                  <IconButton
                    aria-label="edit course"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCourseEditor(course);
                    }}
                    sx={{ backgroundColor: "rgba(255,255,255,0.72)", "&:hover": { backgroundColor: "#fff" }, flexShrink: 0 }}
                  >
                    <EditOutlinedIcon />
                  </IconButton>
                  <IconButton
                    aria-label="delete course"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(course.course_id);
                    }}
                    sx={{ backgroundColor: "rgba(255,255,255,0.72)", "&:hover": { backgroundColor: "#fff" }, flexShrink: 0 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <CardContent sx={{ p: 2.3 }}>
                  <Typography sx={{ color: "secondary.dark", fontWeight: 800, mb: 1, fontSize: "0.9rem" }}>
                    {formatDuration(course.start_date, course.end_date)}
                  </Typography>
                  <Typography
                    sx={{
                      color: "text.secondary",
                      fontWeight: 600,
                      minHeight: 44,
                      fontSize: "0.88rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {course.description || "No description"}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, flexWrap: "wrap", gap: 1 }}>
                    <Chip
                      size="small"
                      icon={<MenuBookOutlinedIcon sx={{ "&&": { fontSize: 16 } }} />}
                      label={`${modCount} module${modCount === 1 ? "" : "s"}`}
                      sx={{ fontWeight: 700, bgcolor: "rgba(107, 220, 69, 0.2)" }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {course.total_contact_hours} hrs
                    </Typography>
                  </Box>
                  {course.created_at && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                      Updated: {String(course.created_at).slice(0, 10)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {sortedCourses.length === 0 && (
        <Box
          sx={{
            mt: 6,
            p: 5,
            textAlign: "center",
            borderRadius: "22px",
            bgcolor: "background.paper",
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Typography sx={{ fontWeight: 800 }}>{courses.length === 0 ? "No courses yet" : "No matches"}</Typography>
          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            {courses.length === 0 ? "Click “New course” to add your first course." : "Try a different search."}
          </Typography>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Create course</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <TextField label="Course ID" value={form.course_id} onChange={handleChange("course_id")} fullWidth />
          <TextField label="Course name" value={form.course_name} onChange={handleChange("course_name")} fullWidth />
          <TextField label="Description" value={form.description} onChange={handleChange("description")} fullWidth multiline minRows={3} />
          <TextField
            label="Start date"
            type="date"
            value={form.start_date}
            onChange={handleChange("start_date")}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End date"
            type="date"
            value={form.end_date}
            onChange={handleChange("end_date")}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Total contact hours"
            type="number"
            value={form.total_contact_hours}
            onChange={handleChange("total_contact_hours")}
            fullWidth
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading} sx={{ textTransform: "none" }}>
            {loading ? "Creating…" : "Create course"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editCourseOpen} onClose={() => setEditCourseOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Edit course details</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <TextField label="Course ID" value={editCourseForm.course_id} fullWidth disabled />
          <TextField label="Course name" value={editCourseForm.course_name} onChange={handleEditCourseChange("course_name")} fullWidth />
          <TextField label="Description" value={editCourseForm.description} onChange={handleEditCourseChange("description")} fullWidth multiline minRows={3} />
          <TextField
            label="Start date"
            type="date"
            value={editCourseForm.start_date}
            onChange={handleEditCourseChange("start_date")}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End date"
            type="date"
            value={editCourseForm.end_date}
            onChange={handleEditCourseChange("end_date")}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Total contact hours"
            type="number"
            value={editCourseForm.total_contact_hours}
            onChange={handleEditCourseChange("total_contact_hours")}
            fullWidth
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditCourseOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdateCourse} disabled={editCourseLoading} sx={{ textTransform: "none" }}>
            {editCourseLoading ? "Saving…" : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CourseManagement;
