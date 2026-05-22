import { authFetch } from "../utils/authFetch";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
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
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import LinkIcon from "@mui/icons-material/Link";
import QuizIcon from "@mui/icons-material/Quiz";
import RefreshIcon from "@mui/icons-material/Refresh";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:4002";
const adminBasePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const userTrainingBaseUrl = (import.meta.env.VITE_USER_TRAINING_BASE_URL || "http://localhost:5175/user/training").replace(/\/$/, "");
const TRAINING_IMAGE_FILES = [
  "visitor-safety.webp",
  "bako-trail-guiding.webp",
  "safety-response.webp",
  "gunung-gading-conservation.webp",
  "biodiversity-lab.webp",
  "incident-ai-monitoring.webp",
  "ecotourism-briefing.webp",
  "conservation-law.webp",
  "biodiversity-basics.webp",
  "ecotourism-communication.webp",
  "batang-ai-community-protocol.webp",
  "kubah-rainforest-safety.webp",
  "protected-areas.webp",
  "rules-compliance.webp",
];

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
  image_url: "",
  imageFile: null,
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

const demoCanvasCourses = [
  {
    course_id: "SFC-FIELD-2026",
    course_name: "SFC Field Response Essentials",
    description: "Core field-response training for protected flora incidents, wildlife interaction, evidence handling, and visitor safety.",
    start_date: "2026-05-01",
    end_date: "2026-06-30",
    total_contact_hours: 12,
    status: "Published",
    updated_at: "2026-05-14",
    resources: [{ id: "RES-FIELD-1", title: "Field checklist" }],
    modules: [
      {
        module_id: "DEMO-FIELD-M1",
        title: "Incident response overview",
        description: "How guides recognize, document, and escalate protected-area incidents.",
        category: "Field Readiness",
        park: "All Parks",
        level: "Beginner",
        duration: "45 minutes",
        format: "Blended",
        status: "Published",
        sort_order: 1,
        image_url: `${userTrainingBaseUrl}/safety-response.webp`,
        items: [
          { item_id: "DEMO-FIELD-I1", item_type: "page", title: "Protected-area response policy", description: "Page", content: "Admin-ready response steps for visitor incidents.", status: "published" },
          { item_id: "DEMO-FIELD-I2", item_type: "checklist", title: "Evidence capture checklist", description: "Checklist", checklist: ["Confirm safety", "Record time and location", "Attach evidence", "Notify Admin"], status: "published" },
          { item_id: "DEMO-FIELD-I3", item_type: "quiz", title: "Response priority quiz", description: "Quiz", quiz: { question: "Who makes the official incident status decision?", choices: ["Park Ranger", "Admin", "Visitor"], answer: 1 }, status: "published" },
        ],
      },
    ],
  },
  {
    course_id: "SFC-WILDLIFE-2026",
    course_name: "Sarawak Protected Wildlife Awareness",
    description: "Awareness training for protected wildlife handling, visitor boundaries, and field reporting.",
    start_date: "2026-05-01",
    end_date: "2026-07-15",
    total_contact_hours: 10,
    status: "Published",
    updated_at: "2026-05-14",
    resources: [{ id: "RES-WILD-1", title: "Wildlife briefing" }],
    modules: [
      {
        module_id: "DEMO-WILD-M1",
        title: "Wildlife disturbance signals",
        description: "Recognize risky visitor behavior without disturbing wildlife.",
        category: "Wildlife Awareness",
        park: "Bako National Park",
        level: "Beginner",
        duration: "40 minutes",
        format: "Online",
        status: "Published",
        sort_order: 1,
        image_url: `${userTrainingBaseUrl}/biodiversity-basics.webp`,
        items: [
          { item_id: "DEMO-WILD-I1", item_type: "video", title: "Wildlife handling scenario", description: "Video", status: "published" },
          { item_id: "DEMO-WILD-I2", item_type: "text", title: "Visitor boundary script", description: "Text", content: "Use calm language and escalate repeated boundary breaches.", status: "published" },
          { item_id: "DEMO-WILD-I3", item_type: "link", title: "Protected wildlife reference", description: "Link", external_url: "https://sarawakforestry.com", status: "published" },
        ],
      },
    ],
  },
  {
    course_id: "SFC-ORIENTATION-2026",
    course_name: "SFC Park Guide Orientation",
    description: "Orientation for new park guides covering SFC portal use, route safety, and certification flow.",
    start_date: "2026-05-01",
    end_date: "2026-06-15",
    total_contact_hours: 8,
    status: "Published",
    updated_at: "2026-05-14",
    resources: [{ id: "RES-ORI-1", title: "Guide orientation pack" }],
    modules: [
      {
        module_id: "DEMO-ORI-M1",
        title: "Portal and certification basics",
        description: "Understand training requests, module completion, quizzes, and certificate release.",
        category: "Orientation",
        park: "All Parks",
        level: "Beginner",
        duration: "35 minutes",
        format: "Online",
        status: "Published",
        sort_order: 1,
        image_url: `${userTrainingBaseUrl}/ecotourism-briefing.webp`,
        items: [
          { item_id: "DEMO-ORI-I1", item_type: "image", title: "Portal navigation map", description: "Image", status: "published" },
          { item_id: "DEMO-ORI-I2", item_type: "file", title: "Orientation PDF", description: "File", file_name: "orientation-pack.pdf", status: "published" },
          { item_id: "DEMO-ORI-I3", item_type: "page", title: "Certificate release rules", description: "Page", content: "Certificates are released after full course completion and Admin review.", status: "published" },
        ],
      },
    ],
  },
];

const itemTypeMap = {
  page: { label: "Page", icon: <ArticleIcon />, helper: "Rich text learning page" },
  text: { label: "Text", icon: <ArticleIcon />, helper: "Short text lesson" },
  file: { label: "File", icon: <InsertDriveFileIcon />, helper: "PDF, worksheet, or downloadable resource" },
  image: { label: "Image", icon: <ImageIcon />, helper: "Evidence image, diagram, or screenshot" },
  video: { label: "Video", icon: <VideoLibraryIcon />, helper: "Training walkthrough or demonstration" },
  link: { label: "External Link", icon: <LinkIcon />, helper: "Reference page or external resource" },
  quiz: { label: "Quiz", icon: <QuizIcon />, helper: "Scenario question with answer choices" },
  checklist: { label: "Checklist", icon: <ChecklistIcon />, helper: "Step-by-step completion list" },
};

const itemTypeOptions = Object.keys(itemTypeMap);

const panelSx = {
  borderRadius: "22px",
  border: "1px solid #eadfbf",
  background: "linear-gradient(145deg, #ffffff 0%, #fffaf0 100%)",
  boxShadow: "0 18px 45px rgba(255, 122, 26, 0.10)",
};

const softCardSx = {
  borderRadius: "18px",
  border: "1px solid #eadfbf",
  background: "rgba(255, 253, 245, 0.92)",
};

const buttonSx = {
  borderRadius: "12px",
  textTransform: "none",
  fontWeight: 900,
  minHeight: 42,
  px: 1.8,
  transition: "transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 12px 24px rgba(255, 122, 26, 0.16)",
  },
  "&:focus-visible": {
    outline: "3px solid rgba(255, 122, 26, 0.35)",
    outlineOffset: 3,
  },
};

const primaryButtonSx = {
  ...buttonSx,
  background: "linear-gradient(135deg, #ff7a1a 0%, #ffd84d 100%)",
  color: "#173126",
  boxShadow: "0 10px 22px rgba(255, 122, 26, 0.18)",
  "&:hover": {
    ...buttonSx["&:hover"],
    background: "linear-gradient(135deg, #f06f0f 0%, #ffc928 100%)",
  },
};

const secondaryButtonSx = {
  ...buttonSx,
  bgcolor: "#fffdf5",
  color: "#173126",
  border: "1px solid #eadfbf",
  "&:hover": {
    ...buttonSx["&:hover"],
    bgcolor: "#f0ffe5",
    borderColor: "#a7e957",
  },
};

const demoButtonSx = {
  ...buttonSx,
  bgcolor: "#dcf8c6",
  color: "#173126",
  border: "1px solid #b9df84",
  "&:hover": {
    ...buttonSx["&:hover"],
    bgcolor: "#c9f08f",
    borderColor: "#7dbb32",
  },
};

const statusChipSx = {
  bgcolor: "#dcf8c6",
  color: "#173126",
  fontWeight: 950,
};

const dialogActionSx = {
  px: 3,
  py: 2,
  borderTop: "1px solid #eadfbf",
  background: "#fffaf0",
};

const dialogPaperProps = {
  className: "course-builder-dialog-paper",
};

const toObjectivesText = (objectives) =>
  Array.isArray(objectives) ? objectives.join("\n") : String(objectives || "");

const splitLines = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

function CourseDialogTitle({ title, subtitle, icon }) {
  return (
    <DialogTitle className="course-builder-dialog-title">
      <Stack direction="row" alignItems="center" gap={1.3}>
        <Box className="course-builder-dialog-icon">{icon}</Box>
        <Box>
          <Typography component="span" className="course-builder-dialog-kicker">
            Admin content builder
          </Typography>
          <Typography component="h2">{title}</Typography>
          <Typography component="p">{subtitle}</Typography>
        </Box>
      </Stack>
    </DialogTitle>
  );
}

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

const normalizeItem = (item) => ({
  ...item,
  item_type: item.item_type || item.itemType || "page",
  quiz: item.quiz || null,
  checklist: item.checklist || [],
});

const formatCourseDuration = (course) => {
  if (!course?.start_date && !course?.end_date) return "Date not set";
  if (course.start_date && course.end_date) return `${course.start_date} to ${course.end_date}`;
  return course.start_date || course.end_date;
};

const getItemTypeConfig = (type) => itemTypeMap[type] || itemTypeMap.page;

const trainingImageUrl = (fileName) => `${userTrainingBaseUrl}/${fileName}`;

const formatTrainingImageLabel = (fileName) =>
  fileName
    .replace(/\.(webp|png|jpg|jpeg)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const resolveAdminImageUrl = (value) => {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return "";

  const trainingMatch = imageUrl.match(/\/(?:user\/)?training\/([^?#]+)/);
  if (trainingMatch) return `${adminBasePath}training/${trainingMatch[1]}`;
  if (imageUrl.startsWith("/uploads/")) return `${API_BASE_URL}${imageUrl}`;
  return imageUrl;
};

const getItemFileUrl = (item) => {
  if (!item) return "";
  if (item.download_url) return `${API_BASE_URL}${item.download_url}`;
  return item.file_url || "";
};

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);

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
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const modules = useMemo(() => selectedCourse?.modules || [], [selectedCourse]);
  const selectedModule = useMemo(
    () => modules.find((module) => String(module.module_id) === String(selectedModuleId)) || modules[0] || null,
    [modules, selectedModuleId]
  );
  const selectedItem = useMemo(() => {
    const items = selectedModule?.items || [];
    return items.find((item) => String(item.item_id) === String(selectedItemId)) || items[0] || null;
  }, [selectedModule, selectedItemId]);

  const totalItems = modules.reduce((sum, module) => sum + (module.items?.length || 0), 0);
  const totalResources = selectedCourse?.resources?.length || 0;
  const selectedCourseHeroImage = useMemo(() => {
    const moduleWithImage = modules.find((module) => module.image_url);
    return resolveAdminImageUrl(moduleWithImage?.image_url);
  }, [modules]);
  const itemTypeCounts = useMemo(() => {
    const counts = {};
    modules.forEach((module) => {
      (module.items || []).forEach((item) => {
        const type = item.item_type || "page";
        counts[type] = (counts[type] || 0) + 1;
      });
    });
    return counts;
  }, [modules]);

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const requestJson = async (url, options = {}) => {
    const response = await authFetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  };

  const loadCourses = async () => {
    const data = await requestJson(`${API_BASE_URL}/api/courses`);
    const loadedCourses = data.courses || [];
    setCourses(loadedCourses);
    setFallbackMessage("");
    setSelectedCourseId((prev) => prev || loadedCourses[0]?.course_id || "");
    return loadedCourses;
  };

  const loadCanvasCourse = async (courseId) => {
    if (!courseId) {
      setSelectedCourse(null);
      setSelectedModuleId(null);
      setSelectedItemId(null);
      return;
    }

    let course = null;
    try {
      const data = await requestJson(`${API_BASE_URL}/api/courses/${encodeURIComponent(courseId)}/canvas`);
      course = data.course || null;
      setFallbackMessage("");
    } catch (error) {
      course = demoCanvasCourses.find((item) => item.course_id === courseId) || null;
      if (!course) throw error;
      setFallbackMessage("Demo fallback course data is displayed because the Admin training API is unavailable.");
    }

    if (course) {
      course.modules = (course.modules || []).map((module) => ({
        ...module,
        items: (module.items || []).map(normalizeItem),
      }));
    }

    setSelectedCourse(course);
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      const loadedCourses = await loadCourses();
      const courseId = selectedCourseId || loadedCourses[0]?.course_id || "";
      await loadCanvasCourse(courseId);
    } catch (error) {
      setCourses(demoCanvasCourses);
      const courseId = demoCanvasCourses[0].course_id;
      setSelectedCourseId(courseId);
      setSelectedCourse(demoCanvasCourses[0]);
      setFallbackMessage("Demo fallback course data is displayed because the Admin training API is unavailable.");
      showMessage("Admin training API unavailable. Showing demo fallback courses.", "warning");
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

  useEffect(() => {
    if (!selectedCourse) return;
    const moduleExists = modules.some((module) => String(module.module_id) === String(selectedModuleId));
    if (!moduleExists) {
      setSelectedModuleId(modules[0]?.module_id || null);
    }
  }, [selectedCourse, modules, selectedModuleId]);

  useEffect(() => {
    if (!selectedModule) {
      setSelectedItemId(null);
      return;
    }

    const itemExists = (selectedModule.items || []).some((item) => String(item.item_id) === String(selectedItemId));
    if (!itemExists) {
      setSelectedItemId(selectedModule.items?.[0]?.item_id || null);
    }
  }, [selectedModule, selectedItemId]);

  const seedTemplates = async () => {
    if (!window.confirm("Load the three Canvas-style SFC demo course records through the backend insert helper? Existing demo course IDs will be replaced.")) return;
    setLoading(true);
    try {
      const data = await requestJson(`${API_BASE_URL}/api/demo/canvas-seed`, { method: "POST" });
      showMessage(data.message || "Demo course records loaded.");
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
      image_url: module.image_url || "",
      imageFile: null,
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
      const imageDataUrl = await toDataUrl(moduleForm.imageFile);
      const body = {
        title: moduleForm.title,
        description: moduleForm.description,
        category: moduleForm.category,
        park: moduleForm.park,
        level: moduleForm.level,
        duration: moduleForm.duration,
        format: moduleForm.format,
        image_url: moduleForm.image_url,
        imageFileName: moduleForm.imageFile?.name || "",
        imageDataUrl,
        badge_name: moduleForm.badge_name,
        objectives: moduleForm.objectivesText,
        status: moduleForm.status,
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

  const openCreateItem = (module = selectedModule) => {
    if (!module) {
      showMessage("Select a module first.", "warning");
      return;
    }
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

  const renderItemIcon = (type) => <Box className="canvas-item-icon">{getItemTypeConfig(type).icon}</Box>;

  const renderPreview = () => {
    if (!selectedItem) {
      return (
        <Typography sx={{ color: "#607166", fontWeight: 800 }}>
          Select an item from the selected module to preview the learner-facing content.
        </Typography>
      );
    }

    const type = selectedItem.item_type || "page";
    const config = getItemTypeConfig(type);
    const fileUrl = getItemFileUrl(selectedItem);

    return (
      <Stack gap={1.5}>
        <Stack direction="row" alignItems="center" gap={1.2}>
          {renderItemIcon(type)}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: "#173126", fontWeight: 950, fontSize: "1.12rem" }}>
              {selectedItem.title}
            </Typography>
            <Typography sx={{ color: "#607166", fontWeight: 800 }}>{config.label}</Typography>
          </Box>
        </Stack>

        {selectedItem.description && (
          <Typography sx={{ color: "#53685a", fontWeight: 800 }}>{selectedItem.description}</Typography>
        )}

        {(type === "page" || type === "text") && (
          <Paper sx={{ ...softCardSx, p: 2, maxHeight: 320, overflow: "auto" }}>
            <Typography sx={{ color: "#173126", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {selectedItem.content || "No page content yet."}
            </Typography>
          </Paper>
        )}

        {type === "link" && (
          <Paper sx={{ ...softCardSx, p: 2 }}>
            <Typography sx={{ color: "#607166", fontWeight: 800, mb: 1 }}>External learner resource</Typography>
            <Button
              component="a"
              href={selectedItem.external_url || undefined}
              target="_blank"
              rel="noreferrer"
              startIcon={<LinkIcon />}
              disabled={!selectedItem.external_url}
              sx={{ ...buttonSx, justifyContent: "flex-start", color: "#173126" }}
            >
              {selectedItem.external_url || "No URL provided"}
            </Button>
          </Paper>
        )}

        {["file", "image", "video"].includes(type) && (
          <Paper sx={{ ...softCardSx, p: 2 }}>
            {type === "image" && fileUrl && (
              <Box
                component="img"
                src={fileUrl}
                alt={selectedItem.title}
                sx={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: "14px", border: "1px solid #eadfbf", mb: 1.5 }}
              />
            )}
            <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="center">
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: "#173126", fontWeight: 950 }}>
                  {selectedItem.file_name || selectedItem.title || "No uploaded file yet"}
                </Typography>
                <Typography sx={{ color: "#607166", fontWeight: 800 }}>
                  {selectedItem.mime_type || config.label} {selectedItem.size ? `· ${selectedItem.size}` : ""}
                </Typography>
              </Box>
              {fileUrl && (
                <IconButton component="a" href={fileUrl} target="_blank" rel="noreferrer">
                  <FileDownloadIcon />
                </IconButton>
              )}
            </Stack>
          </Paper>
        )}

        {type === "quiz" && (
          <Paper sx={{ ...softCardSx, p: 2 }}>
            <Typography sx={{ color: "#173126", fontWeight: 950 }}>
              {selectedItem.quiz?.question || "No quiz question yet."}
            </Typography>
            <Stack gap={1} sx={{ mt: 1.4 }}>
              {(selectedItem.quiz?.choices || []).map((choice, index) => (
                <Box
                  key={`${choice}-${index}`}
                  sx={{
                    p: 1.2,
                    borderRadius: "12px",
                    bgcolor: index === Number(selectedItem.quiz?.answer) ? "#dcf8c6" : "#ffffff",
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
          <Paper sx={{ ...softCardSx, p: 2 }}>
            <Stack gap={1}>
              {(selectedItem.checklist || []).map((step, index) => (
                <Stack key={`${step}-${index}`} direction="row" gap={1} alignItems="center">
                  <Chip label={String(index + 1).padStart(2, "0")} size="small" sx={{ bgcolor: "#ffd84d", color: "#173126", fontWeight: 950 }} />
                  <Typography sx={{ color: "#173126", fontWeight: 800 }}>{step}</Typography>
                </Stack>
              ))}
              {(!selectedItem.checklist || selectedItem.checklist.length === 0) && (
                <Typography sx={{ color: "#607166", fontWeight: 800 }}>No checklist steps yet.</Typography>
              )}
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
        <Stack className="course-builder-hero-stack" direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={3}>
          <Box className="course-builder-hero-copy">
            <Typography className="admin-dashboard-kicker">Canvas-style training builder</Typography>
            <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1 }}>
              Course Builder
            </Typography>
            <Typography sx={{ mt: 1.4, color: "#173126", fontWeight: 850, maxWidth: 880 }}>
              Build complete SFC learning paths. Select a course, organize its modules, inspect the active module, and preview each learning item before it appears in the User Portal.
            </Typography>
          </Box>

          <Stack className="course-builder-hero-actions" direction={{ xs: "column", sm: "row" }} gap={1.2} alignSelf={{ xs: "stretch", lg: "center" }}>
            <Button className="course-builder-hero-button" onClick={refreshAll} startIcon={<RefreshIcon />} sx={secondaryButtonSx}>
              Refresh
            </Button>
            <Button className="course-builder-hero-button" onClick={seedTemplates} startIcon={<AutoAwesomeIcon />} sx={demoButtonSx}>
              Load Demo Course Records
            </Button>
            <Button
              className="course-builder-hero-button"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateCourse}
              sx={primaryButtonSx}
            >
              Create Course
            </Button>
          </Stack>
        </Stack>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 999, "& .MuiLinearProgress-bar": { bgcolor: "#ff7a1a" } }} />}
      {fallbackMessage && (
        <Alert severity="warning" className="course-fallback-alert">
          {fallbackMessage}
        </Alert>
      )}

      <Grid className="course-builder-layout-grid" container spacing={2.2} alignItems="flex-start">
        <Grid size={{ xs: 12 }} className="course-builder-layout-item course-builder-list-cell">
          <Box className="course-builder-panel course-builder-list-panel" sx={{ ...panelSx, p: 2.2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 1.6 }}>
              <Box>
                <Typography className="admin-dashboard-kicker">Courses</Typography>
                <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950 }}>
                  Course list
                </Typography>
              </Box>
              <Chip label={String(courses.length).padStart(2, "0")} sx={{ ...statusChipSx, bgcolor: "#f3ffd4" }} />
            </Stack>

            <Stack className="course-builder-course-cards" gap={1.1} sx={{ maxHeight: { xl: "calc(100vh - 310px)" }, overflow: "auto", pr: 0.3 }}>
              {courses.map((course) => {
                const active = selectedCourseId === course.course_id;
                return (
                  <Paper
                    key={course.course_id}
                    onClick={() => setSelectedCourseId(course.course_id)}
                    sx={{
                      p: 1.5,
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
                    <Typography sx={{ color: "#607166", fontWeight: 750, fontSize: "0.84rem", mt: 0.4 }}>
                      {course.description || "No description yet."}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mt: 1 }}>
                      <Chip label={course.status || "Published"} size="small" sx={statusChipSx} />
                      <Chip
                        label={`Updated ${course.updated_at || course.updatedAt || "not set"}`}
                        size="small"
                        sx={{ bgcolor: "#fff3c4", color: "#173126", fontWeight: 900 }}
                      />
                    </Stack>
                  </Paper>
                );
              })}

              {courses.length === 0 && (
                <Typography sx={{ color: "#607166", fontWeight: 800 }}>
                  No courses yet. Create one or load the demo course records.
                </Typography>
              )}
            </Stack>
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }} className="course-builder-layout-item course-builder-main-cell">
          <Stack className="course-builder-main-stack" gap={2.2}>
            <Box className="course-builder-panel" sx={{ ...panelSx, p: { xs: 2.2, md: 3 } }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
                {selectedCourseHeroImage && (
                  <Box
                    component="img"
                    src={selectedCourseHeroImage}
                    alt=""
                    sx={{
                      width: { xs: "100%", sm: 156 },
                      height: 116,
                      objectFit: "cover",
                      borderRadius: "18px",
                      border: "1px solid #eadfbf",
                      boxShadow: "0 14px 30px rgba(23, 49, 38, 0.10)",
                    }}
                  />
                )}
                <Box>
                  <Typography className="admin-dashboard-kicker">Selected course</Typography>
                  <Typography variant="h4" sx={{ color: "#173126", fontWeight: 950 }}>
                    {selectedCourse?.course_name || "No course selected"}
                  </Typography>
                  <Typography sx={{ color: "#607166", fontWeight: 800, mt: 0.5 }}>
                    {selectedCourse ? formatCourseDuration(selectedCourse) : "Choose a course from the list."}
                  </Typography>
                  {selectedCourse && (
                    <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mt: 1.1 }}>
                      <Chip label={selectedCourse.status || "Published"} size="small" sx={statusChipSx} />
                      <Chip
                        label={`Last updated ${selectedCourse.updated_at || selectedCourse.updatedAt || "not set"}`}
                        size="small"
                        sx={{ bgcolor: "#fff3c4", color: "#173126", fontWeight: 950 }}
                      />
                    </Stack>
                  )}
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreateModule}
                  disabled={!selectedCourse}
                  sx={{ ...primaryButtonSx, alignSelf: { xs: "stretch", sm: "center" } }}
                >
                  Add Module
                </Button>
              </Stack>

              {selectedCourse?.description && (
                <Typography sx={{ color: "#53685a", fontWeight: 800, mt: 1.3 }}>
                  {selectedCourse.description}
                </Typography>
              )}

              <Grid container spacing={1.2} sx={{ mt: 2 }}>
                {[
                  ["Modules", modules.length],
                  ["Items", totalItems],
                  ["Resources", totalResources],
                  ["Hours", selectedCourse?.total_contact_hours || 0],
                ].map(([label, value]) => (
                  <Grid size={{ xs: 6, md: 3 }} key={label}>
                    <Box sx={{ p: 1.35, borderRadius: "14px", bgcolor: "#fffaf0", border: "1px solid #eadfbf" }}>
                      <Typography className="admin-dashboard-kicker">{label}</Typography>
                      <Typography sx={{ color: "#173126", fontWeight: 950, fontSize: "1.45rem" }}>{value}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box className="course-builder-panel" sx={{ ...panelSx, p: { xs: 2.2, md: 3 } }}>
              <Typography className="admin-dashboard-kicker">Builder inspector</Typography>
              <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950, mb: 1 }}>
                Course structure
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mb: 1.5 }}>
                {itemTypeOptions.map((type) => (
                  <Chip
                    key={type}
                    icon={getItemTypeConfig(type).icon}
                    label={`${getItemTypeConfig(type).label}: ${itemTypeCounts[type] || 0}`}
                    sx={{ bgcolor: itemTypeCounts[type] ? "#dcf8c6" : "#fffaf0", color: "#173126", fontWeight: 850 }}
                  />
                ))}
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Typography sx={{ color: "#607166", fontWeight: 800 }}>
                This builder reads the same MySQL course records that the User Portal displays. Keep the demo data in SQL, not hardcoded frontend arrays.
              </Typography>
            </Box>

            <Box className="course-builder-panel" sx={{ ...panelSx, p: { xs: 2.2, md: 3 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.5} sx={{ mb: 2 }}>
                <Box>
                  <Typography className="admin-dashboard-kicker">Module outline</Typography>
                  <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950 }}>
                    Course flow
                  </Typography>
                </Box>
                <Chip label="Click a module to edit items" sx={{ bgcolor: "#fff3c4", color: "#173126", fontWeight: 900 }} />
              </Stack>

              <Stack gap={1.2}>
                {modules.map((module, moduleIndex) => {
                  const active = String(module.module_id) === String(selectedModule?.module_id);
                  const moduleImage = resolveAdminImageUrl(module.image_url);
                  return (
                    <Paper
                      key={module.module_id}
                      onClick={() => setSelectedModuleId(module.module_id)}
                      sx={{
                        p: 1.6,
                        borderRadius: "16px",
                        cursor: "pointer",
                        border: active ? "2px solid #ff7a1a" : "1px solid #eadfbf",
                        bgcolor: active ? "#fff3c4" : "#fffaf0",
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
                        <Stack direction="row" alignItems="center" gap={1.2} sx={{ minWidth: 0 }}>
                          {moduleImage ? (
                            <Box
                              component="img"
                              src={moduleImage}
                              alt=""
                              sx={{ width: 54, height: 42, borderRadius: "14px", objectFit: "cover", border: "1px solid #eadfbf", flexShrink: 0 }}
                            />
                          ) : (
                            <Box sx={{ width: 38, height: 38, borderRadius: "14px", background: "linear-gradient(135deg, #ff8a1d, #f3ffd4)", flexShrink: 0 }} />
                          )}
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ color: "#173126", fontWeight: 950 }}>
                              Module {moduleIndex + 1}: {module.title}
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mt: 0.7 }}>
                              <Chip label={module.level || "Beginner"} size="small" sx={statusChipSx} />
                              <Chip label={module.duration || "45 minutes"} size="small" sx={{ bgcolor: "#fff3c4", color: "#173126", fontWeight: 950 }} />
                              <Chip label={`${module.items?.length || 0} items`} size="small" sx={{ bgcolor: "#ffe2cf", color: "#173126", fontWeight: 950 }} />
                            </Stack>
                          </Box>
                        </Stack>
                        <Stack direction="row" gap={0.4} onClick={(event) => event.stopPropagation()}>
                          <IconButton size="small" onClick={() => openEditModule(module)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => deleteModule(module.module_id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}

                {modules.length === 0 && (
                  <Typography sx={{ color: "#607166", fontWeight: 800 }}>
                    No modules yet. Add the first module to start the course flow.
                  </Typography>
                )}
              </Stack>
            </Box>

            <Box className="course-builder-panel" sx={{ ...panelSx, p: { xs: 2.2, md: 3 } }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
                {resolveAdminImageUrl(selectedModule?.image_url) && (
                  <Box
                    component="img"
                    src={resolveAdminImageUrl(selectedModule?.image_url)}
                    alt=""
                    sx={{
                      width: { xs: "100%", sm: 150 },
                      height: 104,
                      objectFit: "cover",
                      borderRadius: "16px",
                      border: "1px solid #eadfbf",
                      boxShadow: "0 12px 26px rgba(23, 49, 38, 0.10)",
                    }}
                  />
                )}
                <Box>
                  <Typography className="admin-dashboard-kicker">Selected module detail</Typography>
                  <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950 }}>
                    {selectedModule ? selectedModule.title : "No module selected"}
                  </Typography>
                  {selectedModule?.description && (
                    <Typography sx={{ color: "#607166", fontWeight: 800, mt: 0.7 }}>
                      {selectedModule.description}
                    </Typography>
                  )}
                </Box>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => openCreateItem(selectedModule)}
                  disabled={!selectedModule}
                  sx={{ ...primaryButtonSx, alignSelf: { xs: "stretch", sm: "flex-start" } }}
                >
                  Add Item
                </Button>
              </Stack>

              {selectedModule && (
                <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mb: 1.8 }}>
                  <Chip label={selectedModule.status || "Published"} sx={statusChipSx} />
                  <Chip label={selectedModule.park || "All Parks"} sx={{ bgcolor: "#fff3c4", color: "#173126", fontWeight: 950 }} />
                  <Chip label={selectedModule.category || "Field Readiness"} sx={{ bgcolor: "#edf4ff", color: "#173126", fontWeight: 950 }} />
                </Stack>
              )}

              <Stack gap={1.1} sx={{ maxHeight: { md: 520 }, overflow: "auto", pr: 0.3 }}>
                {(selectedModule?.items || []).map((item, itemIndex) => {
                  const active = String(item.item_id) === String(selectedItem?.item_id);
                  const config = getItemTypeConfig(item.item_type);
                  return (
                    <Paper
                      key={item.item_id || `${item.title}-${itemIndex}`}
                      onClick={() => setSelectedItemId(item.item_id)}
                      sx={{
                        p: 1.25,
                        borderRadius: "15px",
                        cursor: "pointer",
                        border: active ? "2px solid #ff7a1a" : "1px solid #eadfbf",
                        bgcolor: active ? "#fff3c4" : "#fffdf5",
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.2}>
                        <Stack direction="row" alignItems="center" gap={1.1} sx={{ minWidth: 0 }}>
                          {renderItemIcon(item.item_type)}
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ color: "#173126", fontWeight: 950 }}>
                              {String(itemIndex + 1).padStart(2, "0")}. {item.title}
                            </Typography>
                            <Typography sx={{ color: "#607166", fontWeight: 750, fontSize: "0.84rem" }}>
                              {config.label} · {item.description || config.helper}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" gap={0.4} onClick={(event) => event.stopPropagation()}>
                          <IconButton size="small" onClick={() => setSelectedItemId(item.item_id)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => openEditItem(selectedModule, item)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => deleteItem(selectedModule, item)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}

                {selectedModule && (!selectedModule.items || selectedModule.items.length === 0) && (
                  <Typography sx={{ color: "#607166", fontWeight: 800 }}>
                    No items in this module yet. Add a page, file, quiz, or checklist.
                  </Typography>
                )}
              </Stack>
            </Box>

            <Box className="course-builder-panel" sx={{ ...panelSx, p: { xs: 2.2, md: 3 } }}>
              <Typography className="admin-dashboard-kicker">User Portal preview</Typography>
              <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950, mb: 1.6 }}>
                Item preview
              </Typography>
              {renderPreview()}
            </Box>
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={courseDialogOpen} onClose={() => setCourseDialogOpen(false)} maxWidth="md" fullWidth PaperProps={dialogPaperProps}>
        <CourseDialogTitle
          title={editingCourseId ? "Edit Course" : "Create Course"}
          subtitle="Keep the course shell short, searchable, and ready for module sequencing."
          icon={<SchoolOutlinedIcon />}
        />
        <DialogContent>
          <Grid container className="course-builder-form-grid" spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 4 }} className="course-dialog-span-4">
              <TextField label="Course ID" value={courseForm.course_id} disabled={Boolean(editingCourseId)} onChange={(event) => setCourseForm({ ...courseForm, course_id: event.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }} className="course-dialog-span-8">
              <TextField label="Course name" value={courseForm.course_name} onChange={(event) => setCourseForm({ ...courseForm, course_name: event.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12 }} className="course-dialog-span-12">
              <TextField label="Description" value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} fullWidth multiline minRows={3} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} className="course-dialog-span-4">
              <TextField label="Start date" type="date" value={courseForm.start_date} onChange={(event) => setCourseForm({ ...courseForm, start_date: event.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} className="course-dialog-span-4">
              <TextField label="End date" type="date" value={courseForm.end_date} onChange={(event) => setCourseForm({ ...courseForm, end_date: event.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} className="course-dialog-span-4">
              <TextField label="Contact hours" type="number" value={courseForm.total_contact_hours} onChange={(event) => setCourseForm({ ...courseForm, total_contact_hours: event.target.value })} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={dialogActionSx}>
          <Button onClick={() => setCourseDialogOpen(false)} sx={secondaryButtonSx}>Cancel</Button>
          <Button variant="contained" onClick={saveCourse} sx={primaryButtonSx}>Save Course</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={moduleDialogOpen} onClose={() => setModuleDialogOpen(false)} maxWidth="md" fullWidth PaperProps={dialogPaperProps}>
        <CourseDialogTitle
          title={editingModuleId ? "Edit Module" : "Add Module"}
          subtitle="Align the module label, hero image, learning level, and certificate metadata before saving."
          icon={<ViewModuleOutlinedIcon />}
        />
        <DialogContent>
          <Grid container className="course-builder-form-grid" spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 8 }} className="course-dialog-span-8">
              <TextField label="Module title" value={moduleForm.title} onChange={(event) => setModuleForm({ ...moduleForm, title: event.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} className="course-dialog-span-4">
              <TextField label="Sort order" type="number" value={moduleForm.sort_order} onChange={(event) => setModuleForm({ ...moduleForm, sort_order: event.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12 }} className="course-dialog-span-12">
              <TextField label="Description" value={moduleForm.description} onChange={(event) => setModuleForm({ ...moduleForm, description: event.target.value })} fullWidth multiline minRows={3} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} className="course-dialog-span-4">
              <TextField label="Category" value={moduleForm.category} onChange={(event) => setModuleForm({ ...moduleForm, category: event.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} className="course-dialog-span-4">
              <TextField label="Park" value={moduleForm.park} onChange={(event) => setModuleForm({ ...moduleForm, park: event.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} className="course-dialog-span-4">
              <TextField label="Level" value={moduleForm.level} onChange={(event) => setModuleForm({ ...moduleForm, level: event.target.value })} fullWidth select>
                {['Beginner', 'Intermediate', 'Advanced'].map((level) => <MenuItem key={level} value={level}>{level}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} className="course-dialog-span-4">
              <TextField label="Duration" value={moduleForm.duration} onChange={(event) => setModuleForm({ ...moduleForm, duration: event.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} className="course-dialog-span-4">
              <TextField label="Format" value={moduleForm.format} onChange={(event) => setModuleForm({ ...moduleForm, format: event.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} className="course-dialog-span-4">
              <TextField label="Status" value={moduleForm.status} onChange={(event) => setModuleForm({ ...moduleForm, status: event.target.value })} fullWidth select>
                {['Published', 'Draft', 'Archived'].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} className="course-dialog-span-6">
              <TextField
                label="Hero image"
                value={moduleForm.image_url}
                onChange={(event) => setModuleForm({ ...moduleForm, image_url: event.target.value, imageFile: null })}
                fullWidth
                select
                helperText="Uses the same training images shown in the User Portal."
              >
                <MenuItem value="">No hero image</MenuItem>
                {moduleForm.image_url && !TRAINING_IMAGE_FILES.some((fileName) => trainingImageUrl(fileName) === moduleForm.image_url) && (
                  <MenuItem value={moduleForm.image_url}>Current custom image</MenuItem>
                )}
                {TRAINING_IMAGE_FILES.map((fileName) => (
                  <MenuItem key={fileName} value={trainingImageUrl(fileName)}>
                    {formatTrainingImageLabel(fileName)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} className="course-dialog-span-6">
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                sx={{ ...secondaryButtonSx, width: "100%", height: 56 }}
              >
                Upload hero image
                <input
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setModuleForm((prev) => ({ ...prev, imageFile: file }));
                  }}
                />
              </Button>
              <Typography sx={{ mt: 0.8, color: "#607166", fontWeight: 800, fontSize: "0.82rem" }}>
                {moduleForm.imageFile ? `${moduleForm.imageFile.name} will replace the current hero after saving.` : "Uploads are stored by the Admin API and shown in the User Portal."}
              </Typography>
            </Grid>
            {resolveAdminImageUrl(moduleForm.image_url) && (
              <Grid size={{ xs: 12 }} className="course-dialog-span-12">
                <Box
                  component="img"
                  src={resolveAdminImageUrl(moduleForm.image_url)}
                  alt=""
                  sx={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: "18px", border: "1px solid #eadfbf" }}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 6 }} className="course-dialog-span-6">
              <TextField label="Certificate title" value={moduleForm.badge_name} onChange={(event) => setModuleForm({ ...moduleForm, badge_name: event.target.value })} fullWidth helperText="Used as a course-completion credential label, not a module certificate." />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} className="course-dialog-span-6">
              <TextField label="Objectives" value={moduleForm.objectivesText} onChange={(event) => setModuleForm({ ...moduleForm, objectivesText: event.target.value })} fullWidth multiline minRows={3} helperText="One objective per line" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={dialogActionSx}>
          <Button onClick={() => setModuleDialogOpen(false)} sx={secondaryButtonSx}>Cancel</Button>
          <Button variant="contained" onClick={saveModule} sx={primaryButtonSx}>Save Module</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="md" fullWidth PaperProps={dialogPaperProps}>
        <CourseDialogTitle
          title={editingItem ? "Edit Module Item" : "Add Module Item"}
          subtitle="Choose a clear item type first, then fill only the fields needed for that learning item."
          icon={getItemTypeConfig(itemForm.item_type).icon}
        />
        <DialogContent>
          <Grid container className="course-builder-form-grid" spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 4 }} className="course-dialog-span-4">
              <TextField label="Item type" value={itemForm.item_type} onChange={(event) => setItemForm({ ...itemForm, item_type: event.target.value })} fullWidth select>
                {itemTypeOptions.map((type) => (
                  <MenuItem key={type} value={type}>{getItemTypeConfig(type).label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} className="course-dialog-span-6">
              <TextField label="Title" value={itemForm.title} onChange={(event) => setItemForm({ ...itemForm, title: event.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }} className="course-dialog-span-2">
              <TextField label="Order" type="number" value={itemForm.sort_order} onChange={(event) => setItemForm({ ...itemForm, sort_order: event.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 12 }} className="course-dialog-span-12">
              <TextField label="Description" value={itemForm.description} onChange={(event) => setItemForm({ ...itemForm, description: event.target.value })} fullWidth />
            </Grid>

            {(itemForm.item_type === "page" || itemForm.item_type === "text") && (
              <Grid size={{ xs: 12 }} className="course-dialog-span-12">
                <TextField label="Content" value={itemForm.content} onChange={(event) => setItemForm({ ...itemForm, content: event.target.value })} fullWidth multiline minRows={6} />
              </Grid>
            )}

            {itemForm.item_type === "link" && (
              <>
                <Grid size={{ xs: 12 }} className="course-dialog-span-12">
                  <TextField label="External URL" value={itemForm.external_url} onChange={(event) => setItemForm({ ...itemForm, external_url: event.target.value })} fullWidth />
                </Grid>
                <Grid size={{ xs: 12 }} className="course-dialog-span-12">
                  <TextField label="Link instructions" value={itemForm.content} onChange={(event) => setItemForm({ ...itemForm, content: event.target.value })} fullWidth multiline minRows={3} />
                </Grid>
              </>
            )}

            {["file", "image", "video"].includes(itemForm.item_type) && (
              <Grid size={{ xs: 12 }} className="course-dialog-span-12">
                <Paper sx={{ ...softCardSx, p: 2 }}>
                  <Stack gap={1.2}>
                    <Button component="label" startIcon={<UploadFileIcon />} sx={{ ...secondaryButtonSx, alignSelf: "flex-start" }}>
                      Choose file
                      <input hidden type="file" onChange={(event) => setItemForm({ ...itemForm, file: event.target.files?.[0] || null })} />
                    </Button>
                    <Typography sx={{ color: "#607166", fontWeight: 800 }}>
                      {itemForm.file ? itemForm.file.name : "No new file selected. Existing uploaded file will remain if backend preserves it."}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            )}

            {itemForm.item_type === "quiz" && (
              <>
                <Grid size={{ xs: 12 }} className="course-dialog-span-12">
                  <TextField label="Question" value={itemForm.question} onChange={(event) => setItemForm({ ...itemForm, question: event.target.value })} fullWidth multiline minRows={3} />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }} className="course-dialog-span-8">
                  <TextField label="Choices" value={itemForm.choicesText} onChange={(event) => setItemForm({ ...itemForm, choicesText: event.target.value })} fullWidth multiline minRows={4} helperText="One answer choice per line" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} className="course-dialog-span-4">
                  <TextField label="Correct answer index" type="number" value={itemForm.correctAnswer} onChange={(event) => setItemForm({ ...itemForm, correctAnswer: event.target.value })} fullWidth helperText="0 means first choice" />
                </Grid>
              </>
            )}

            {itemForm.item_type === "checklist" && (
              <Grid size={{ xs: 12 }} className="course-dialog-span-12">
                <TextField label="Checklist steps" value={itemForm.checklistText} onChange={(event) => setItemForm({ ...itemForm, checklistText: event.target.value })} fullWidth multiline minRows={5} helperText="One step per line" />
              </Grid>
            )}

            <Grid size={{ xs: 12, md: 6 }} className="course-dialog-span-6">
              <TextField label="Status" value={itemForm.status} onChange={(event) => setItemForm({ ...itemForm, status: event.target.value })} fullWidth select>
                {['published', 'draft', 'archived'].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={dialogActionSx}>
          <Button onClick={() => setItemDialogOpen(false)} sx={secondaryButtonSx}>Cancel</Button>
          <Button variant="contained" onClick={saveItem} sx={primaryButtonSx}>Save Item</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CourseManagement;
