import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Button, Snackbar, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, Avatar, Skeleton,
  Alert, Tooltip, Divider, Stack, Card, CardContent, LinearProgress, Grid, Badge
} from "@mui/material";
import {
  Delete as DeleteIcon, Add as AddIcon, Visibility as VisibilityIcon,
  Edit as EditIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon,
  Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon,
  School as SchoolIcon, CloudUpload as CloudUploadIcon,
  Notifications as NotificationsIcon, CardGiftcard as CardGiftcardIcon,
  LocationOn as LocationOnIcon, Work as WorkIcon, Badge as BadgeIcon,
  ThumbUp as ThumbUpIcon, ThumbDown as ThumbDownIcon
} from "@mui/icons-material";

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  // Removed cv from newStudent initial state
  const [newStudent, setNewStudent] = useState({ 
    name: "", phone: "", email: "", module: "None",
    assignedPark: "", position: "", yearsExperience: "", address: ""
  });

  useEffect(() => {
    fetch("http://localhost:4001/api/students")
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load students", err);
        setSnackbar({ open: true, message: "Failed to load students", severity: "error" });
        setLoading(false);
      });
  }, []);

  const handleDelete = (id) => {
    fetch(`http://localhost:4001/api/students/${id}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => {
        setStudents(prev => prev.filter(s => s.id !== id));
        setSnackbar({ open: true, message: "Student deleted successfully", severity: "success" });
      })
      .catch(err => {
        console.error("Delete failed", err);
        setSnackbar({ open: true, message: "Failed to delete student", severity: "error" });
      });
  };

  const updateEligibility = (id, status) => {
    fetch(`http://localhost:4001/api/students/${id}/eligibility`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eligibility: status })
    })
      .then(res => res.json())
      .then(() => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, eligibility: status } : s));
        setSnackbar({ open: true, message: `Eligibility updated to ${status}`, severity: "success" });
      })
      .catch(err => {
        console.error("Update failed", err);
        setSnackbar({ open: true, message: "Failed to update eligibility", severity: "error" });
      });
  };

  const updateModule = (id, module) => {
    fetch(`http://localhost:4001/api/students/${id}/module`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module })
    })
      .then(res => res.json())
      .then(() => {
        setStudents(prev => prev.map(s =>
          s.id === id ? { ...s, module, registered: true } : s));
        const student = students.find(s => s.id === id);
        setSnackbar({ open: true, message: `${student?.name} registered for ${module} module`, severity: "success" });
      })
      .catch(err => {
        console.error("Module update failed", err);
        setSnackbar({ open: true, message: "Failed to update module", severity: "error" });
      });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = () => {
    fetch(`http://localhost:4001/api/students/${editingStudent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingStudent)
    })
      .then(res => res.json())
      .then(() => {
        setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s));
        setSnackbar({ open: true, message: `Account updated for ${editingStudent.name}`, severity: "success" });
        setEditingStudent(null);
      })
      .catch(err => {
        console.error("Edit failed", err);
        setSnackbar({ open: true, message: "Failed to update student", severity: "error" });
      });
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveNewStudent = () => {
    fetch("http://localhost:4001/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStudent)
    })
      .then(res => res.json())
      .then((created) => {
        setStudents(prev => [...prev, created]);
        setSnackbar({ open: true, message: `New student ${newStudent.name} added`, severity: "success" });
        // Removed cv from reset object
        setNewStudent({ name: "", phone: "", email: "", module: "None", assignedPark: "", position: "", yearsExperience: "", address: "" });
        setAddDialogOpen(false);
      })
      .catch(err => {
        console.error("Add failed", err);
        setSnackbar({ open: true, message: "Failed to add student", severity: "error" });
      });
  };

  const issueCertificate = (student) => {
    fetch("http://localhost:4001/api/admin/issue-badge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: student.id,
        certificateCode: student.certificate_code
      })
    })
      .then(res => res.json())
      .then(() => {
        setSnackbar({ open: true, message: `Certificate issued for ${student.name}`, severity: "success" });
      })
      .catch(err => {
        console.error("Issue badge failed", err);
        setSnackbar({ open: true, message: "Failed to issue certificate", severity: "error" });
      });
  };

  const sendNotification = (student) => {
    fetch("http://localhost:4001/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: student.id,
        title: "Training Update",
        message: `Hello ${student.name}, your account has been updated.`
      })
    })
      .then(res => res.json())
      .then(() => {
        setSnackbar({ open: true, message: `Notification sent to ${student.name}`, severity: "success" });
      })
      .catch(err => {
        console.error("Notification failed", err);
        setSnackbar({ open: true, message: "Failed to send notification", severity: "error" });
      });
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      (filter === "all" || s.module === filter) &&
      (searchTerm === "" || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [students, filter, searchTerm]);

  const getEligibilityColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      default: return 'warning';
    }
  };

  const getAvatarColor = (name) => {
    const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#0288d1', '#7b1fa2'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderLoadingSkeletons = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
      {[1, 2, 3].map(i => (
        <Paper key={i} sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={56} height={56} />
            <Box sx={{ ml: 2, width: '100%' }}>
              <Skeleton width="70%" height={24} />
              <Skeleton width="50%" height={18} />
            </Box>
          </Box>
          <Skeleton width="100%" height={60} />
          <Skeleton width="100%" height={40} />
        </Paper>
      ))}
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Header Section */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, bgcolor: "#fff" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 1 }}>
            <PersonIcon sx={{ color: "#1976d2" }} />
            Student Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage student accounts, eligibility, and certifications.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)} sx={{ borderRadius: 2, textTransform: "none", px: 3 }}>
          Add Student
        </Button>
      </Paper>

      {/* Filters Section */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: "wrap", bgcolor: "#fff" }}>
        <TextField
          size="small"
          label="Search name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{ startAdornment: <PersonIcon fontSize="small" color="action" sx={{ mr: 1 }} /> }}
        />
        <Chip label={`${filteredStudents.length} Students`} variant="outlined" />
      </Paper>

      {/* Student Grid */}
      {loading ? renderLoadingSkeletons() : filteredStudents.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <PersonIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No students found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Try adjusting your search or filter criteria.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
            Add Student
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
          {filteredStudents.map((student) => (
            <Card 
              key={student.id} 
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                border: '1px solid',
                borderColor: getEligibilityColor(student.eligibility) === 'success' ? 'success.light' : getEligibilityColor(student.eligibility) === 'error' ? 'error.light' : 'warning.light',
                '&:hover': { 
                  transform: 'translateY(-6px)', 
                  boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
                  borderColor: getEligibilityColor(student.eligibility) + '.main'
                },
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              {/* Status Badge - Top Right Corner */}
              <Box sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: getEligibilityColor(student.eligibility) + '.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                {student.eligibility === 'Approved' ? <CheckCircleIcon sx={{ color: '#fff', fontSize: 20 }} /> :
                 student.eligibility === 'Rejected' ? <CancelIcon sx={{ color: '#fff', fontSize: 20 }} /> :
                 <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.7rem' }}>⏳</Typography>}
              </Box>

              {/* Header Section */}
              <Box sx={{ 
                p: 2.5, 
                pb: 1.5,
                background: `linear-gradient(135deg, ${getAvatarColor(student.name)}15 0%, ${getAvatarColor(student.name)}05 100%)`
              }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', pr: 4 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: getAvatarColor(student.name), 
                      width: 56, 
                      height: 56, 
                      fontSize: '1.4rem',
                      border: '3px solid #fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    {getInitials(student.name)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>
                      {student.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {student.email}
                    </Typography>
                    <Chip 
                      label={student.eligibility} 
                      size="small" 
                      sx={{ 
                        bgcolor: getEligibilityColor(student.eligibility) + '.light',
                        color: getEligibilityColor(student.eligibility) + '.dark',
                        fontWeight: 600,
                        height: 22
                      }} 
                    />
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Content Section */}
              <CardContent sx={{ flex: 1, py: 2, px: 2.5 }}>
                {/* Progress Bar */}
                {student.progressPercent !== undefined && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}> Overall Progress</Typography>
                      <Typography variant="caption" fontWeight="bold" color="primary">{student.progressPercent}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={student.progressPercent || 0} 
                      sx={{ height: 8, borderRadius: 4, bgcolor: 'grey.200' }} 
                    />
                  </Box>
                )}

                {/* Key Info Grid */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SchoolIcon fontSize="inherit" /> Module
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                        {student.module === 'None' ? 'Not assigned' : student.module}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOnIcon fontSize="inherit" /> Park
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                        {student.assignedPark || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Module Quick Select (for Approved) */}
                {student.eligibility === "Approved" && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Assign Module:
                    </Typography>
                    <Select
                      size="small"
                      fullWidth
                      value={student.module || "None"}
                      onChange={(e) => updateModule(student.id, e.target.value)}
                      sx={{ 
                        fontSize: '0.85rem', 
                        "& .MuiSelect-select": { py: 0.75 },
                        bgcolor: 'background.paper'
                      }}
                    >
                      <MenuItem value="None">None</MenuItem>
                      <MenuItem value="General">General</MenuItem>
                      <MenuItem value="Specific">Specific</MenuItem>
                      <MenuItem value="Physical">Physical</MenuItem>
                    </Select>
                  </Box>
                )}
              </CardContent>

              <Divider />

              {/* Quick Action Buttons */}
              <Box sx={{ p: 2, pt: 1.5, bgcolor: 'background.default' }}>
                {student.eligibility === "Pending" ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      fullWidth
                      size="small" 
                      variant="contained" 
                      color="success" 
                      startIcon={<ThumbUpIcon />}
                      onClick={() => updateEligibility(student.id, "Approved")}
                      sx={{ fontWeight: 600, py: 1 }}
                    >
                      Approve
                    </Button>
                    <Button 
                      fullWidth
                      size="small" 
                      variant="outlined" 
                      color="error" 
                      startIcon={<ThumbDownIcon />}
                      onClick={() => updateEligibility(student.id, "Rejected")}
                      sx={{ fontWeight: 600, py: 1 }}
                    >
                      Reject
                    </Button>
                  </Box>
                ) : student.eligibility === "Approved" ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Issue Certificate">
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="primary"
                        onClick={() => issueCertificate(student)}
                        sx={{ minWidth: 0, px: 1.5 }}
                      >
                        <CardGiftcardIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Send Notification">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        onClick={() => sendNotification(student)}
                        sx={{ minWidth: 0, px: 1.5 }}
                      >
                        <NotificationsIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Edit Profile">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => setEditingStudent(student)}
                        sx={{ minWidth: 0, px: 1.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Box sx={{ flexGrow: 1 }} />
                    <Tooltip title="Delete">
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleDelete(student.id)}
                        sx={{ minWidth: 0, px: 1.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        onClick={() => setSelectedStudent(student)}
                        sx={{ minWidth: 0, px: 1.5 }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Approve">
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success"
                        onClick={() => updateEligibility(student.id, "Approved")}
                        sx={{ minWidth: 0, px: 1.5 }}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Box sx={{ flexGrow: 1 }} />
                    <Tooltip title="Delete">
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleDelete(student.id)}
                        sx={{ minWidth: 0, px: 1.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {/* Edit Student Dialog */}
      <Dialog open={!!editingStudent} onClose={() => setEditingStudent(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
          <EditIcon color="primary" /> Edit Student Profile
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {editingStudent && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Profile Summary Section */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: getAvatarColor(editingStudent.name), fontSize: '2rem' }}>
                    {getInitials(editingStudent.name)}
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">{editingStudent.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{editingStudent.email}</Typography>
                  <Chip label={editingStudent.eligibility} size="small" color={getEligibilityColor(editingStudent.eligibility)} sx={{ mt: 1 }} />
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Assigned Park</Typography>
                    <Typography variant="body2" fontWeight="bold">{editingStudent.assignedPark || "Not assigned"}</Typography>
                    {editingStudent.guideId && <Typography variant="caption" color="text.secondary">{editingStudent.guideId}</Typography>}
                  </Box>
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">{editingStudent.progressPercent || 0}%</Typography>
                      <Typography variant="caption" color="text.secondary">Progress</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">{editingStudent.module === 'None' ? '0' : '1'}</Typography>
                      <Typography variant="caption" color="text.secondary">Modules</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Editable Details Form */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                    Editable Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Display Name" name="name" value={editingStudent.name} onChange={handleEditChange} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Email" name="email" value={editingStudent.email} onChange={handleEditChange} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Phone" name="phone" value={editingStudent.phone || ""} onChange={handleEditChange} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Position" name="position" value={editingStudent.position || ""} onChange={handleEditChange} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Assigned Park" name="assignedPark" value={editingStudent.assignedPark || ""} onChange={handleEditChange} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Years of Experience" name="yearsExperience" value={editingStudent.yearsExperience || ""} onChange={handleEditChange} fullWidth size="small" type="number" />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Address" name="address" value={editingStudent.address || ""} onChange={handleEditChange} fullWidth size="small" multiline rows={2} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Guide ID" value={editingStudent.guideId || "Auto-generated"} disabled fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Role" value={editingStudent.role || "Student"} disabled fullWidth size="small" />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditingStudent(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AddIcon color="primary" /> Add New Student
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Name" name="name" value={newStudent.name} onChange={handleAddChange} fullWidth size="small" autoFocus />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" name="email" value={newStudent.email} onChange={handleAddChange} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Phone" name="phone" value={newStudent.phone} onChange={handleAddChange} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Position" name="position" value={newStudent.position} onChange={handleAddChange} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Assigned Park" name="assignedPark" value={newStudent.assignedPark} onChange={handleAddChange} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Years of Experience" name="yearsExperience" value={newStudent.yearsExperience} onChange={handleAddChange} fullWidth size="small" type="number" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Address" name="address" value={newStudent.address} onChange={handleAddChange} fullWidth size="small" multiline rows={2} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Select name="module" size="small" value={newStudent.module} onChange={handleAddChange} fullWidth displayEmpty>
                <MenuItem value="None">No Module</MenuItem>
                <MenuItem value="General">General</MenuItem>
                <MenuItem value="Specific">Specific</MenuItem>
                <MenuItem value="Physical">Physical</MenuItem>
              </Select>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveNewStudent}>Add Student</Button>
        </DialogActions>
      </Dialog>

      {/* View Student Dialog - Complete Profile */}
      <Dialog open={!!selectedStudent} onClose={() => setSelectedStudent(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 0 }}>
          Student Profile
        </DialogTitle>
        {selectedStudent && (
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Profile Header */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Avatar sx={{ width: 72, height: 72, bgcolor: getAvatarColor(selectedStudent.name), fontSize: '1.8rem' }}>
                    {getInitials(selectedStudent.name)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight="bold">{selectedStudent.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{selectedStudent.email}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip label={selectedStudent.eligibility} size="small" color={getEligibilityColor(selectedStudent.eligibility)} />
                      <Chip label={selectedStudent.role || "Student"} size="small" variant="outlined" />
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" fontWeight="bold">{selectedStudent.progressPercent || 0}%</Typography>
                    <Typography variant="caption" color="text.secondary">Overall Progress</Typography>
                  </Box>
                </Box>
              </Grid>
              
              {/* Personal Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                  Personal Information
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Display Name</Typography>
                      <Typography>{selectedStudent.name}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EmailIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography>{selectedStudent.email}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PhoneIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Phone</Typography>
                      <Typography>{selectedStudent.phone || "Not provided"}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <WorkIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Position</Typography>
                      <Typography>{selectedStudent.position || "Not provided"}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocationOnIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Address</Typography>
                      <Typography>{selectedStudent.address || "Not provided"}</Typography>
                    </Box>
                  </Box>
                </Stack>
              </Grid>
              
              {/* Training Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                  Training Information
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SchoolIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Current Module</Typography>
                      <Typography>{selectedStudent.module === 'None' ? 'Not assigned' : selectedStudent.module}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <BadgeIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Assigned Park</Typography>
                      <Typography>{selectedStudent.assignedPark || "Not assigned"}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Guide ID</Typography>
                      <Typography>{selectedStudent.guideId || "Auto-generated"}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Progress Overview</Typography>
                    <LinearProgress variant="determinate" value={selectedStudent.progressPercent || 0} sx={{ height: 8, borderRadius: 4 }} />
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{selectedStudent.progressPercent || 0}% Complete</Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedStudent(null)}>Close</Button>
          {selectedStudent?.eligibility === "Approved" && (
            <Button variant="contained" onClick={() => { setSelectedStudent(null); setEditingStudent(selectedStudent); }}>
              Edit Profile
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentManagement;
