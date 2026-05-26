import { authFetch } from "../utils/authFetch";
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import SchoolIcon from "@mui/icons-material/School";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from "@mui/icons-material/Download";

// 🔹 PDF 导出依赖
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

const demoCertificateAccounts = [
  { id: 1, name: "Aiden Tan", email: "aiden.tan@example.com" },
  { id: 2, name: "Maya Ling", email: "maya.ling@example.com" },
  { id: 3, name: "Daniel Chai", email: "daniel.chai@example.com" },
];

const demoCertificateProgress = {
  fallback: true,
  courses: [
    { courseId: "SFC-FIELD-2026", courseName: "SFC Field Response Essentials", totalItems: 3 },
    { courseId: "SFC-WILDLIFE-2026", courseName: "Sarawak Protected Wildlife Awareness", totalItems: 3 },
    { courseId: "SFC-ORIENTATION-2026", courseName: "SFC Park Guide Orientation", totalItems: 3 },
  ],
  guides: [
    { userId: 1, name: "Aiden Tan", email: "aiden.tan@example.com", modules: [{ courseId: "SFC-FIELD-2026", completedItems: 3 }] },
    { userId: 2, name: "Maya Ling", email: "maya.ling@example.com", modules: [{ courseId: "SFC-WILDLIFE-2026", completedItems: 2 }] },
    { userId: 3, name: "Daniel Chai", email: "daniel.chai@example.com", modules: [{ courseId: "SFC-ORIENTATION-2026", completedItems: 0 }] },
  ],
};

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
  const [guideAccounts, setGuideAccounts] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [downloading, setDownloading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const previewRef = useRef(null);
  const certificateContentRef = useRef(null);

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
      const [accountData, progressData] = await Promise.all([
        requestJson(`${API_BASE_URL}/api/students`),
        requestJson(`${API_BASE_URL}/api/admin/canvas-progress-summary`),
      ]);
      setGuideAccounts(accountData.students || []);
      setProgressSummary(progressData || null);
      setFallbackMessage("");
    } catch (error) {
      setGuideAccounts(demoCertificateAccounts);
      setProgressSummary(demoCertificateProgress);
      setFallbackMessage("Demo fallback certificate records are displayed because the Admin training API is unavailable.");
      showMessage("Admin training API unavailable. Showing demo certificates.", "warning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const courses = useMemo(() => progressSummary?.courses || [], [progressSummary]);
  const guides = useMemo(() => {
    const progressGuides = progressSummary?.guides || [];
    if (guideAccounts.length === 0) return progressGuides;
    const progressByUser = new Map(progressGuides.map((guide) => [String(guide.userId || guide.user_id), guide]));
    return guideAccounts.map((guideAccount) => ({
      ...guideAccount,
      ...(progressByUser.get(String(guideAccount.id)) || {}),
      userId: guideAccount.id,
      user_id: guideAccount.id,
      name: guideAccount.name,
      email: guideAccount.email,
    }));
  }, [guideAccounts, progressSummary]);

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
      (row) => sameId(row.userId, selectedAccountId) && sameId(row.courseId, selectedCourseId)
    );
    if (selectedStillExists) return;
    const firstReady = certificateRows.find((row) => row.ready) || certificateRows[0];
    setSelectedAccountId(String(firstReady.userId));
    setSelectedCourseId(String(firstReady.courseId));
  }, [certificateRows, selectedCourseId, selectedAccountId]);

  const selectedRow = certificateRows.find(
    (row) => sameId(row.userId, selectedAccountId) && sameId(row.courseId, selectedCourseId)
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

  const handleSelectCertificate = (userId, courseId) => {
    setSelectedAccountId(String(userId));
    setSelectedCourseId(String(courseId));
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const downloadCertificate = async () => {
    if (!selectedRow || !certificateContentRef.current) {
      showMessage("Please select a certificate to download.", "warning");
      return;
    }

    setDownloading(true);
    try {
      const canvas = await html2canvas(certificateContentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgRatio = canvas.width / canvas.height;
      const pdfRatio = pdfWidth / pdfHeight;
      
      let drawWidth, drawHeight;
      if (imgRatio > pdfRatio) {
        drawWidth = pdfWidth;
        drawHeight = pdfWidth / imgRatio;
      } else {
        drawHeight = pdfHeight;
        drawWidth = pdfHeight * imgRatio;
      }
      
      const x = (pdfWidth - drawWidth) / 2;
      const y = (pdfHeight - drawHeight) / 2;
      
      pdf.addImage(imgData, "PNG", x, y, drawWidth, drawHeight);

      const fileName = `Certificate_${selectedRow.guideName}_${selectedRow.courseName.replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);

      showMessage("Certificate downloaded successfully!", "success");
    } catch (error) {
      console.error("Download error:", error);
      showMessage("Failed to download certificate. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const issueCertificate = async () => {
    if (!selectedRow) return showMessage("Select a guide and course first.", "warning");
    if (!selectedRow.ready) return showMessage("Certificate is locked until the full course reaches 100%.", "warning");
    if (fallbackMessage) return showMessage("Demo fallback certificate preview is ready for presentation.", "info");

    try {
      const data = await requestJson(`${API_BASE_URL}/api/admin/issue-certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedRow.userId, courseId: selectedRow.courseId, title: `${selectedRow.courseName} Certificate` }),
      });
      showMessage(data.message || "Course certificate issued.");
      await loadData();
    } catch (error) { showMessage(error.message, "error"); }
  };

  const statCards = [
    { label: "Courses", value: summary.courses, detail: "Course-level certificate paths", icon: <SchoolIcon />, tone: "linear-gradient(135deg, #DDFBD2, #A7E957)" },
    { label: "Guides", value: summary.guides, detail: "Guide accounts tracked", icon: <CheckCircleIcon />, tone: "linear-gradient(135deg, #FF9F1C, #FFD84D)" },
    { label: "Ready", value: summary.ready, detail: "Full courses at 100%", icon: <WorkspacePremiumIcon />, tone: "linear-gradient(135deg, #FF7A1A, #FFD84D)" },
    { label: "Locked", value: summary.locked, detail: "Still in progress", icon: <RefreshIcon />, tone: "linear-gradient(135deg, #F6FFE8, #DDFBD2)" },
  ];

  const filteredRows = useMemo(() => {
    return certificateRows.filter(row => {
      const matchSearch = !searchTerm ||
        row.guideName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.courseName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter === "ready") return row.ready;
      if (statusFilter === "pending") return !row.ready;
      return true;
    });
  }, [certificateRows, searchTerm, statusFilter]);

  const groupedByUser = useMemo(() => {
    const map = {};
    filteredRows.forEach(row => {
      const key = String(row.userId);
      if (!map[key]) map[key] = { id: key, name: row.guideName, email: row.email, courses: [] };
      map[key].courses.push(row);
    });
    return Object.values(map);
  }, [filteredRows]);

  return (
    <Box className="admin-linked-page">
      {/* Header */}
      <Box sx={{ ...panelSx, mb: 2.4, p: { xs: 3, md: 4 }, background: "radial-gradient(circle at 88% 0%, rgba(167,233,87,0.46), transparent 18rem), linear-gradient(135deg, #FF9F1C 0%, #FFD84D 45%, #DDFBD2 100%)" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={3}>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Box component="img" src={logoSrc} alt="SFC Digital Portal logo" sx={{ width: 86, height: 86, borderRadius: "22px", boxShadow: "0 16px 32px rgba(23,49,38,0.16)" }} />
            <Box>
              <Typography sx={{ color: "#8d4f12", fontWeight: 950, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.8rem" }}>Certification</Typography>
              <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1, mt: 1 }}>Course certificates</Typography>
              <Typography sx={{ mt: 1.4, color: "#173126", fontWeight: 800, maxWidth: 760 }}>Issue certificates only after a full course reaches 100% completion. Completing one module does not unlock a certificate.</Typography>
            </Box>
          </Stack>
          {/* 🔹 Header 按钮组：只保留 Refresh + Issue */}
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.2} alignSelf={{ xs: "stretch", md: "center" }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} sx={{ ...buttonSx, borderColor: "#EADFBF", color: "#173126", bgcolor: "rgba(255, 253, 245, 0.68)", px: 2.4, "&:hover": { borderColor: "#A7E957", bgcolor: "#F6FFE8" } }}>Refresh</Button>
            <Button variant="contained" startIcon={<WorkspacePremiumIcon />} onClick={issueCertificate} disabled={!selectedRow?.ready} sx={{ ...buttonSx, background: selectedRow?.ready ? "linear-gradient(135deg, #FF7A1A, #FFD84D)" : "#dfe6d8", color: "#173126", px: 2.4 }}>Issue Certificate</Button>
          </Stack>
        </Stack>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 999, "& .MuiLinearProgress-bar": { bgcolor: "#ff7a1a" } }} />}
      {fallbackMessage && <Alert severity="warning" sx={{ mb: 2.4, borderRadius: "16px", border: "1px solid #EADFBF" }}>{fallbackMessage}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 2.4 }}>
        {statCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={card.label}>
            <Card sx={{ ...panelSx, minHeight: 146, background: "#fffdf7" }}>
              <CardContent sx={{ height: "100%", display: "grid", gap: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography className="admin-dashboard-kicker" sx={{ mb: "0 !important", color: "#8d4f12 !important" }}>{card.label}</Typography>
                  <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: "14px", color: "#173126", background: card.tone, boxShadow: "0 10px 22px rgba(255, 122, 26, 0.14)" }}>{card.icon}</Box>
                </Stack>
                <Typography variant="h3" sx={{ color: "#173126", fontWeight: 950, lineHeight: 1 }}>{card.value}</Typography>
                <Typography sx={{ color: "#607166", fontWeight: 800 }}>{card.detail}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Selector & Preview */}
      <Grid container spacing={2.4}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Box sx={{ ...panelSx, p: { xs: 2.4, md: 3 }, height: "100%" }}>
            <Typography className="admin-dashboard-kicker">Certificate selector</Typography>
            <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950, mb: 2 }}>Course completion gate</Typography>
            <Stack gap={2}>
              <TextField label="Guide" select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} SelectProps={{ MenuProps: menuProps }} fullWidth>
                {guides.map((g) => <MenuItem key={g.userId || g.user_id} value={String(g.userId || g.user_id)}>{g.name} - {g.email}</MenuItem>)}
              </TextField>
              <TextField label="Course" select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} SelectProps={{ MenuProps: menuProps }} fullWidth>
                {courses.map((c) => <MenuItem key={c.courseId || c.course_id} value={String(c.courseId || c.course_id)}>{c.courseName || c.course_name}</MenuItem>)}
              </TextField>
              <Paper sx={{ p: 2, borderRadius: "16px", bgcolor: selectedRow?.ready ? "#F3FFD4" : "#FFF9E8", border: "1px solid #EADFBF" }}>
                <Stack direction="row" justifyContent="space-between" gap={2}>
                  <Box>
                    <Typography sx={{ color: "#8d4f12", fontWeight: 950, textTransform: "uppercase", fontSize: "0.75rem" }}>{selectedRow?.ready ? "Ready to issue" : "Locked"}</Typography>
                    <Typography sx={{ color: "#173126", fontWeight: 950, fontSize: "1.1rem" }}>{selectedRow?.completedItems || 0}/{selectedRow?.totalItems || 0} course items complete</Typography>
                  </Box>
                  <Chip label={`${selectedRow?.completionPercent || 0}%`} sx={{ bgcolor: selectedRow?.ready ? "#DDFBD2" : "#fff3c4", color: "#173126", fontWeight: 950 }} />
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Grid>

        {/* 🔹 证书预览区域：Download 按钮已移到右上角 */}
        <Grid size={{ xs: 12, lg: 7 }} ref={previewRef}>
          <Box sx={{ ...panelSx, p: { xs: 2.4, md: 3 }, minHeight: 360, position: "relative" }}>
            <Typography className="admin-dashboard-kicker">Preview</Typography>
            <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950, mb: 2 }}>SFC certificate</Typography>
            
            {/* 🔹 可截图的证书内容容器 */}
            <Box
              ref={certificateContentRef}
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
                bgcolor: "#fff",
              }}
            >
              {/* 🔹 Download 按钮：绝对定位到右上角 */}
              <Button
                variant="contained"
                startIcon={downloading ? null : <DownloadIcon />}
                onClick={downloadCertificate}
                disabled={!selectedRow?.ready || downloading}
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 10,
                  minWidth: 120,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 900,
                  background: selectedRow?.ready 
                    ? "linear-gradient(135deg, #FF7A1A, #FFD84D)" 
                    : "#dfe6d8",
                  color: "#173126",
                  boxShadow: "0 8px 24px rgba(255, 122, 26, 0.25)",
                  "&:hover": {
                    background: selectedRow?.ready 
                      ? "linear-gradient(135deg, #FF6A0A, #FFC83D)" 
                      : "#dfe6d8",
                    transform: "translateY(-1px)",
                  },
                  "&:disabled": {
                    opacity: 0.6,
                    cursor: "not-allowed",
                  },
                }}
              >
                {downloading ? "..." : "Download"}
              </Button>

              {/* 证书内容 */}
              <Box component="img" src={logoSrc} alt="" sx={{ position: "absolute", top: 24, left: 28, width: 64, height: 64, borderRadius: "18px" }} />
              <Box sx={{ mt: 6 }}>
                <Typography sx={{ color: "#17452f", fontWeight: 950, letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.82rem" }}>Sarawak Forestry Corporation</Typography>
                <Typography variant="h4" sx={{ color: "#173126", fontWeight: 950, mt: 1 }}>Course Completion Certificate</Typography>
                <Typography sx={{ color: "#53685a", fontWeight: 900, mt: 2 }}>Presented to</Typography>
                <Typography variant="h4" sx={{ color: "#173126", fontWeight: 950 }}>{selectedRow?.guideName || "Park Guide"}</Typography>
                <Typography sx={{ color: "#53685a", fontWeight: 900, mt: 2 }}>for completing</Typography>
                <Typography variant="h5" sx={{ color: "#8d4f12", fontWeight: 950 }}>{selectedRow?.courseName || "Selected Course"}</Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* 搜索 + 筛选 + 分组列表 */}
      <Box sx={{ ...panelSx, p: { xs: 2.4, md: 3 }, mt: 2.4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
          <Box>
            <Typography className="admin-dashboard-kicker">All course states</Typography>
            <Typography variant="h5" sx={{ color: "#173126", fontWeight: 950 }}>Guide certificate readiness</Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
            <TextField
              size="small"
              placeholder="Search guide or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: "100%", sm: 280 }, bgcolor: "#fffdf7", borderRadius: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#8d4f12" }} /></InputAdornment>,
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm("")}><ClearIcon sx={{ fontSize: 18 }} /></IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction="row" spacing={1}>
              {["all", "ready", "pending"].map((status) => (
                <Chip
                  key={status}
                  label={status === "all" ? "All" : status === "ready" ? "Ready" : "In Progress"}
                  onClick={() => setStatusFilter(status)}
                  sx={{
                    cursor: "pointer",
                    bgcolor: statusFilter === status ? (status === "ready" ? "#DDFBD2" : status === "pending" ? "#FFF9E8" : "#E8F4FE") : "#f5f5f5",
                    color: "#173126",
                    fontWeight: 900,
                    border: statusFilter === status ? "1px solid #FF7A1A" : "1px solid transparent",
                    "&:hover": { bgcolor: status === "ready" ? "#C8E6A3" : status === "pending" ? "#FFE9B8" : "#D4E9FF" },
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Stack>

        {groupedByUser.length === 0 ? (
          <Typography sx={{ color: "#607166", fontWeight: 800, textAlign: "center", py: 4 }}>No matching records found.</Typography>
        ) : (
          groupedByUser.map(user => {
            const readyCount = user.courses.filter(c => c.ready).length;
            const totalCount = user.courses.length;
            const hasPending = readyCount < totalCount;
            const allReady = readyCount === totalCount;

            return (
              <Accordion key={user.id} defaultExpanded={hasPending || !!searchTerm} sx={{ mb: 1.5, bgcolor: "#fffdf7", ...panelSx, "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#8d4f12" }} />}>
                  <Stack direction="row" alignItems="center" spacing={2} width="100%">
                    <Avatar sx={{ bgcolor: allReady ? "#A7E957" : "#FF9F1C", color: "#fff", fontWeight: 900 }}>{user.name.charAt(0)}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={900} sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</Typography>
                      <Typography variant="body2" color="#607166" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</Typography>
                    </Box>
                    <Chip size="small" label={`${readyCount}/${totalCount} Ready`} sx={{ bgcolor: allReady ? "#DDFBD2" : "#fff3c4", fontWeight: 900 }} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={1.5}>
                    {user.courses.map(row => {
                      const isPendingReady = row.ready;
                      return (
                        <Grid size={{ xs: 12, sm: 6 }} key={row.id}>
                          <Paper
                            onClick={() => handleSelectCertificate(row.userId, row.courseId)}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: row.ready ? "1px solid #A7E957" : "1px solid #EADFBF",
                              bgcolor: row.ready ? "#F3FFD4" : "#FFFDF5",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.08)", transform: "translateY(-2px)" },
                              ...(isPendingReady && { border: "2px dashed #FF7A1A", bgcolor: "#FFF8E6" }),
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" gap={1.4}>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ color: "#173126", fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.courseName}</Typography>
                                <Typography sx={{ color: "#607166", fontWeight: 800, fontSize: "0.86rem" }}>{row.completedItems}/{row.totalItems} items</Typography>
                              </Box>
                              <Chip label={row.ready ? "Ready" : `${row.completionPercent}%`} sx={{ bgcolor: row.ready ? "#DDFBD2" : "#fff3c4", color: "#173126", fontWeight: 950, flexShrink: 0 }} />
                            </Stack>
                            <Divider sx={{ my: 1.2 }} />
                            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                              <Typography sx={{ color: "#607166", fontWeight: 800, fontSize: "0.8rem" }}>
                                {row.ready ? "🎓 Eligible" : "📖 In progress"}
                              </Typography>
                              <Button 
                                size="small" 
                                sx={{ textTransform: "none", fontWeight: 900, color: "#8d4f12" }}
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleSelectCertificate(row.userId, row.courseId); 
                                }}
                              >
                                Preview
                              </Button>
                            </Stack>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })
        )}
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={3200} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CertificateManagement;