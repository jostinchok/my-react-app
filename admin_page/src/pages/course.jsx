import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const emptyForm = {
  course_id: "",
  course_name: "",
  description: "",
  start_date: "",
  end_date: "",
  total_contact_hours: "",
};

const formatDuration = (start, end) => {
  if (!start && !end) return "-";
  if (start && end) return `${start} - ${end}`;
  return start || end;
};

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const sortedCourses = useMemo(() => {
    return courses
      .filter(Boolean)
      .sort((a, b) => String(a.course_id || "").localeCompare(String(b.course_id || "")));
  }, [courses]);

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const loadCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load courses.");
      }

      setCourses(data.courses || []);
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

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

      if (!response.ok) {
        throw new Error(data.message || "Unable to create course.");
      }

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

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete course.");
      }

      setCourses((prev) => prev.filter((course) => course.course_id !== courseId));
      showMessage("Course deleted successfully.");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", backgroundColor: "var(--bg-light)", p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--primary-dark)" }}>
            Course
          </Typography>
          <Typography sx={{ mt: 1, color: "#66736b" }}>
            Create, view and delete course files for the training portal.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{
            borderRadius: "14px",
            px: 3,
            py: 1.2,
            textTransform: "none",
            fontWeight: 700,
            backgroundColor: "#165c33",
            "&:hover": { backgroundColor: "#0f4727" },
          }}
        >
          Create Course File
        </Button>
      </Box>

      <Grid container spacing={3}>
        {sortedCourses.map((course) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={course.course_id}>
            <Card
              sx={{
                borderRadius: "22px",
                overflow: "hidden",
                minHeight: 285,
                boxShadow: "0 8px 24px rgba(6, 44, 30, 0.08)",
                border: "1px solid #edf2ed",
                transition: "0.25s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 14px 34px rgba(6, 44, 30, 0.14)",
                },
              }}
            >
              <Box
                sx={{
                  minHeight: 135,
                  p: 2.2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 1,
                  background: "linear-gradient(135deg, #b7cabc 0%, #e6f3e6 100%)",
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "0.78rem", color: "#31523f", fontWeight: 800, mb: 1 }}>
                    {course.course_id}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#032c1d", lineHeight: 1.25 }}>
                    {course.course_name}
                  </Typography>
                </Box>

                <IconButton
                  aria-label="delete course"
                  color="error"
                  onClick={() => handleDelete(course.course_id)}
                  sx={{ backgroundColor: "rgba(255,255,255,0.72)", "&:hover": { backgroundColor: "#fff" } }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <CardContent sx={{ p: 2.3 }}>
                <Typography sx={{ color: "#003f2a", fontWeight: 800, mb: 1 }}>
                  {formatDuration(course.start_date, course.end_date)}
                </Typography>
                <Typography sx={{ color: "#5c6d63", fontWeight: 700, minHeight: 48 }}>
                  {course.description || "Coming soon"}
                </Typography>
                <Typography sx={{ color: "#7b8b81", fontSize: "0.85rem", mt: 2 }}>
                  Total Contact Hours: {course.total_contact_hours}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {sortedCourses.length === 0 && (
        <Box
          sx={{
            mt: 8,
            p: 5,
            textAlign: "center",
            borderRadius: "22px",
            backgroundColor: "#fff",
            border: "1px dashed #cfdacf",
          }}
        >
          <Typography sx={{ fontWeight: 800, color: "#032c1d" }}>No course yet</Typography>
          <Typography sx={{ mt: 1, color: "#66736b" }}>Click “Create Course File” to add your first course.</Typography>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Create Course File</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <TextField label="Course ID" value={form.course_id} onChange={handleChange("course_id")} fullWidth />
          <TextField label="Course Name" value={form.course_name} onChange={handleChange("course_name")} fullWidth />
          <TextField
            label="Description"
            value={form.description}
            onChange={handleChange("description")}
            fullWidth
            multiline
            minRows={3}
          />
          <TextField
            label="Start Date"
            type="date"
            value={form.start_date}
            onChange={handleChange("start_date")}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            value={form.end_date}
            onChange={handleChange("end_date")}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Total Contact Hours"
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
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={loading}
            sx={{ textTransform: "none", backgroundColor: "#165c33", "&:hover": { backgroundColor: "#0f4727" } }}
          >
            {loading ? "Creating..." : "Create Course"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CourseManagement;
