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
  Grid,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";

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
  border: "1px solid rgba(234, 214, 167, 0.86)",
  background: "linear-gradient(145deg, #fffdf4 0%, #fff8e6 100%)",
  boxShadow: "0 18px 45px rgba(255, 122, 26, 0.10)",
};

const buttonSx = {
  borderRadius: "12px",
  textTransform: "none",
  fontWeight: 900,
};

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const requestJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentData, courseData] = await Promise.all([
        requestJson(`${API_BASE_URL}/api/students`),
        requestJson(`${API_BASE_URL}/api/courses`),
      ]);
      setStudents(studentData.students || []);
      setCourses(courseData.courses || []);
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const moduleOptions = useMemo(() => ["None", ...courses.map((course) => course.course_name)], [courses]);

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const matchesFilter = filter === "all" || student.module === filter || student.eligibility === filter;
        const text = `${student.name || ""} ${student.email || ""} ${student.module || ""}`.toLowerCase();
        return matchesFilter && text.includes(searchTerm.toLowerCase());
      }),
    [filter, searchTerm, students]
  );

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
          mb: 3,
          p: { xs: 3, md: 4 },
          background:
            "linear-gradient(135deg, rgba(255,122,26,0.96) 0%, rgba(255,210,63,0.92) 48%, rgba(255,248,230,0.96) 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={3}>
          <Box>
            <Typography className="admin-dashboard-kicker">Guide management</Typography>
            <Typography variant="h3" sx={{ color: "#0b3b28", fontWeight: 950, lineHeight: 1 }}>
              Park Guide accounts
            </Typography>
            <Typography sx={{ mt: 1.4, color: "#274a35", fontWeight: 700, maxWidth: 760 }}>
              Manage guide records, course assignments, and account readiness from the shared MySQL training database.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.2} alignSelf={{ xs: "stretch", md: "center" }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} sx={{ ...buttonSx, borderColor: "#0b3b28", color: "#0b3b28" }}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog} sx={{ ...buttonSx, bgcolor: "#0b3b28" }}>
              Add Guide
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ ...panelSx, p: 2, mb: 2.4 }}>
        <Stack direction={{ xs: "column", md: "row" }} gap={1.5}>
          <TextField
            label="Search guides"
            size="small"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            fullWidth
          />
          <TextField
            label="Filter"
            select
            size="small"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">All records</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
            {moduleOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </Box>

      <Grid container spacing={2.4}>
        {filteredStudents.map((student) => (
          <Grid item xs={12} md={6} xl={4} key={student.id}>
            <Card sx={panelSx}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
                  <Stack direction="row" gap={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: "#0b3b28", color: "#fff8e6", fontWeight: 950 }}>
                      {(student.name || "G").slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography sx={{ color: "#0b3b28", fontWeight: 950 }}>{student.name}</Typography>
                      <Typography sx={{ color: "#607166", fontWeight: 700 }}>{student.email}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" gap={0.5}>
                    <IconButton size="small" onClick={() => openEditDialog(student)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteStudent(student.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                  <Chip
                    label={student.eligibility}
                    size="small"
                    sx={{
                      bgcolor: student.eligibility === "Rejected" ? "#ffe0d8" : "#e8f8d9",
                      color: "#0b3b28",
                      fontWeight: 900,
                    }}
                  />
                  <Chip label={`Progress ${student.progressPercent || 0}%`} size="small" sx={{ bgcolor: "#fff3c4", color: "#7a4710", fontWeight: 900 }} />
                </Stack>

                <TextField
                  label="Assigned course"
                  select
                  size="small"
                  value={student.module || "None"}
                  onChange={(event) => assignModule(student, event.target.value)}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  {moduleOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredStudents.length === 0 && (
        <Box sx={{ ...panelSx, p: 4, textAlign: "center" }}>
          <Typography sx={{ color: "#0b3b28", fontWeight: 950 }}>No guide accounts found</Typography>
          <Typography sx={{ mt: 1, color: "#607166", fontWeight: 700 }}>
            Add a guide account or clear the current filter.
          </Typography>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: "#0b3b28", fontWeight: 950 }}>
          {studentForm.id ? "Edit Guide Account" : "Add Guide Account"}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <TextField label="Name" value={studentForm.name} onChange={(event) => setStudentForm((prev) => ({ ...prev, name: event.target.value }))} fullWidth />
          <TextField label="Phone" value={studentForm.phone} onChange={(event) => setStudentForm((prev) => ({ ...prev, phone: event.target.value }))} fullWidth />
          <TextField label="Email" value={studentForm.email} onChange={(event) => setStudentForm((prev) => ({ ...prev, email: event.target.value }))} fullWidth />
          <TextField label="Assigned Course" select value={studentForm.module} onChange={(event) => setStudentForm((prev) => ({ ...prev, module: event.target.value }))} fullWidth>
            {moduleOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          <TextField label="Eligibility" select value={studentForm.eligibility} onChange={(event) => setStudentForm((prev) => ({ ...prev, eligibility: event.target.value }))} fullWidth>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} sx={buttonSx}>Cancel</Button>
          <Button variant="contained" onClick={saveStudent} disabled={loading} sx={{ ...buttonSx, bgcolor: "#ff7a1a" }}>
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
