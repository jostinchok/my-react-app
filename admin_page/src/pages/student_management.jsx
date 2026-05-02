import React, { useEffect, useState, useMemo, useContext } from "react";
import {
  Box, Typography, Paper, Button, Snackbar, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, Avatar, Skeleton,
  Alert, Tooltip, Divider, Stack, Card, CardContent, LinearProgress, Grid, FormControl, InputLabel
} from "@mui/material";
import {
  Delete as DeleteIcon, Add as AddIcon,
  Edit as EditIcon,
  Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon,
  School as SchoolIcon,
  LocationOn as LocationOnIcon, Work as WorkIcon, Badge as BadgeIcon,
  StarBorder as StarBorderIcon
} from "@mui/icons-material";
import { ParkContext } from "../ParkContext";

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  const [newStudent, setNewStudent] = useState({ 
    name: "", phone: "", email: "", organization: "", yearsExperience: "", address: "", parkId: ""
  });

  const { selectedPark } = useContext(ParkContext);
  const [parks, setParks] = useState([]);

  useEffect(() => {
    if (!selectedPark) return;
    setLoading(true);
    fetch(`http://localhost:4001/api/students?parkId=${selectedPark}`)
      .then(res => res.json())
      .then(data => { 
        const formatted = data.map(s => ({
          ...s,
          parkId: s.park_id,
          guideId: s.guide_id
        }))
        setStudents(data); setLoading(false); })
      .catch(err => {
        console.error("Failed to load students", err);
        setSnackbar({ open: true, message: "Failed to load students", severity: "error" });
        setLoading(false);
      });
  }, [selectedPark]); 

  useEffect(() => {
    fetch("http://localhost:4001/api/parks")
      .then(res => res.json())
      .then(data => setParks(data))
      .catch(err => console.error("Failed to load parks", err));
  }, []);

  useEffect(() => {
    if (addDialogOpen && selectedPark) {
      setNewStudent(prev => ({ ...prev, parkId: selectedPark }));
    }
  }, [addDialogOpen, selectedPark]);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    fetch(`http://localhost:4001/api/students/${id}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => {
        setStudents(prev => prev.filter(s => s.id !== id));
        setSnackbar({ open: true, message: "Guide deleted successfully", severity: "success" });
      })
      .catch(err => setSnackbar({ open: true, message: "Failed to delete guide", severity: "error" }));
  };

  const updateModule = (e, id, module) => {
    e.stopPropagation();
    fetch(`http://localhost:4001/api/students/${id}/module`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module })
    })
      .then(res => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then(updated => {
        setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
        setSnackbar({ open: true, message: `${updated.name} registered for ${updated.module}`, severity: "success" });
      })
      .catch(() => setSnackbar({ open: true, message: "Failed to update module", severity: "error" }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingStudent(prev => ({ ...prev, [name]: name === "parkId" ? Number(value) : value }));
  };

  const handleSaveEdit = () => {
    fetch(`http://localhost:4001/api/students/${editingStudent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingStudent)
    })
      .then(res => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then(updated => {
        setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
        setSnackbar({ open: true, message: `Account updated for ${updated.name}`, severity: "success" });
        setEditingStudent(null);
      })
      .catch(() => setSnackbar({ open: true, message: "Failed to update guide", severity: "error" }));
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: name === "parkId" ? Number(value) : value }));
  };

  const handleSaveNewStudent = () => {
    if (!newStudent.name.trim()) return setSnackbar({ open: true, message: "Name is required", severity: "warning" });
    if (!newStudent.email.trim()) return setSnackbar({ open: true, message: "Email is required", severity: "warning" });

    fetch("http://localhost:4001/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStudent)
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
        return data;
      })
      .then(created => {
        setStudents(prev => [...prev, created]);
        setSnackbar({ open: true, message: `New guide ${created.name} added`, severity: "success" });
        setNewStudent({ name: "", phone: "", email: "", organization: "", yearsExperience: "", address: "", parkId: "" });
        setAddDialogOpen(false);
      })
      .catch(err => setSnackbar({ open: true, message: err.message || "Failed to add guide", severity: "error" }));
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (!s) return false;
      const name = (s.name || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      return (filter === "all" || s.module === filter) && 
             (searchTerm === "" || name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase()));
    });
  }, [students, filter, searchTerm]);

  const getAvatarColor = (name) => {
    if (!name) return '#1976d2';
    const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#0288d1', '#7b1fa2'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

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

  // ✅ 统一输入框样式
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      height: 48,
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, bgcolor: "#fff" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 1 }}>
            <PersonIcon sx={{ color: "#1976d2" }} /> Guide Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage guide accounts and training details.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)} sx={{ borderRadius: 2, textTransform: "none", px: 3 }}>
          Add Guide
        </Button>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: "wrap", bgcolor: "#fff" }}>
        <TextField size="small" label="Search name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ flex: 1, minWidth: 200 }} />
        <Chip label={`${filteredStudents.length} Guides`} variant="outlined" />
      </Paper>

      {loading ? renderLoadingSkeletons() : filteredStudents.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <PersonIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No guides found</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)} sx={{ mt: 2 }}>Add Guide</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
          {filteredStudents.map((student) => (
            <Card key={student.id} onClick={() => setSelectedStudent(student)} sx={{ borderRadius: 3, overflow: 'hidden', transition: 'all 0.3s ease', border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 24px rgba(0,0,0,0.12)', borderColor: 'primary.main' }, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2.5, pb: 1.5, background: `linear-gradient(135deg, ${getAvatarColor(student.name)}15 0%, ${getAvatarColor(student.name)}05 100%)` }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Avatar src={student.avatar_url ? `http://localhost:4001/uploads/${student.avatar_url}` : undefined} sx={{ bgcolor: getAvatarColor(student.name), width: 56, height: 56, fontSize: '1.4rem', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    {!student.avatar_url && getInitials(student.name)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>{student.name || 'Unknown'}</Typography>
                    <Typography variant="body2" color="text.secondary">{student.email || 'No email'}</Typography>
                  </Box>
                </Box>
              </Box>
              <Divider />
              <CardContent sx={{ flex: 1, py: 2, px: 2.5 }}>
                {student.progressPercent !== undefined && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Progress</Typography>
                      <Typography variant="caption" fontWeight="bold" color="primary">{student.progressPercent}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={student.progressPercent || 0} sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                )}
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Module</Typography>
                      <Typography variant="body2" fontWeight={600}>{student.module === 'None' ? 'Not assigned' : student.module}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Park</Typography>
                      <Typography variant="body2" fontWeight={600}>{student.park_name || 'N/A'}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
              <Divider />
              <Box sx={{ p: 2, bgcolor: 'background.default', display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setEditingStudent(student); }} sx={{ flex: 1 }}>Edit</Button>
                <Button size="small" color="error" onClick={(e) => handleDelete(e, student.id)} sx={{ flex: 1 }}>Delete</Button>
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {/* ✅ Edit Dialog */}
      <Dialog open={!!editingStudent} onClose={() => setEditingStudent(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: 'primary.light', color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon /> Edit Guide Profile
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, bgcolor: '#f9fafb' }}>
          {editingStudent && (
            <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#fff', boxShadow: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Display Name" name="name" value={editingStudent.name || ''} onChange={handleEditChange} required InputLabelProps={{ shrink: true }} sx={inputSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Email" name="email" value={editingStudent.email || ''} onChange={handleEditChange} type="email" required InputLabelProps={{ shrink: true }} sx={inputSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Phone" name="phone" value={editingStudent.phone || ""} onChange={handleEditChange} InputLabelProps={{ shrink: true }} sx={inputSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Organization" name="organization" value={editingStudent.organization || ""} onChange={handleEditChange} InputLabelProps={{ shrink: true }} sx={inputSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Years of Experience" name="yearsExperience" value={editingStudent.yearsExperience || ""} onChange={handleEditChange} type="number" InputLabelProps={{ shrink: true }} sx={inputSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Address" name="address" value={editingStudent.address || ""} onChange={handleEditChange} InputLabelProps={{ shrink: true }} sx={inputSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={inputSx}>
                    <InputLabel shrink>Park Assignment</InputLabel>
                    <Select name="parkId" value={editingStudent.parkId || ""} label="Park Assignment" onChange={handleEditChange} displayEmpty>
                      <MenuItem value="" disabled>Select Park</MenuItem>
                      {parks.map(park => <MenuItem key={park.park_id} value={park.park_id}>{park.park_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Role" value="Guide" disabled InputLabelProps={{ shrink: true }} sx={inputSx} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Guide ID" value={editingStudent.guideId || "Auto-generated"} disabled InputLabelProps={{ shrink: true }} sx={inputSx} />
                </Grid>
              </Grid>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f9fafb' }}>
          <Button onClick={() => setEditingStudent(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Add Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: 'primary.light', color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon /> Add New Guide
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, bgcolor: '#f9fafb' }}>
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#fff', boxShadow: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField label="Name *" name="name" value={newStudent.name} onChange={handleAddChange} required InputLabelProps={{ shrink: true }} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email *" name="email" value={newStudent.email} onChange={handleAddChange} type="email" required InputLabelProps={{ shrink: true }} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Phone" name="phone" value={newStudent.phone} onChange={handleAddChange} InputLabelProps={{ shrink: true }} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Organization" name="organization" value={newStudent.organization} onChange={handleAddChange} InputLabelProps={{ shrink: true }} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Years of Experience" name="yearsExperience" value={newStudent.yearsExperience} onChange={handleAddChange} type="number" InputLabelProps={{ shrink: true }} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Address" name="address" value={newStudent.address} onChange={handleAddChange} InputLabelProps={{ shrink: true }} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel shrink>Park Assignment</InputLabel>
                  <Select name="parkId" value={newStudent.parkId || ""} label="Park Assignment *" onChange={handleAddChange} displayEmpty>
                    <MenuItem value="" disabled><em>Select Park</em></MenuItem>
                    {parks.map(park => <MenuItem key={park.park_id} value={park.park_id}>{park.park_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Role" value="Guide" disabled InputLabelProps={{ shrink: true }} sx={inputSx} />
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f9fafb' }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveNewStudent}>Add Guide</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ View Profile Dialog - 合并为一个卡片 */}
      <Dialog open={!!selectedStudent} onClose={() => setSelectedStudent(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: 'primary.light', color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon /> Guide Profile
        </DialogTitle>
        
        {selectedStudent && (
          <DialogContent sx={{ p: 0, bgcolor: '#f9fafb' }}>
            {/* ✅ 一个大卡片包裹所有内容 */}
            <Paper sx={{ 
              m: 2, 
              p: { xs: 2, md: 3 }, 
              borderRadius: 3, 
              bgcolor: '#fff', 
              boxShadow: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}>
              
              {/* 1. 头部信息区域 */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 3, 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 2 
              }}>
                <Avatar sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: getAvatarColor(selectedStudent.name), 
                  fontSize: '2rem', 
                  border: '4px solid #fff', 
                  boxShadow: 2 
                }}>
                  {getInitials(selectedStudent.name)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight="bold">{selectedStudent.name || 'Unknown'}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedStudent.email || 'No email'}</Typography>
                  <Chip label="Guide" color="primary" size="small" sx={{ mt: 0.5, fontWeight: 600 }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary">{selectedStudent.progressPercent || 0}%</Typography>
                  <Typography variant="caption" color="text.secondary">Progress</Typography>
                </Box>
              </Box>

              <Divider />

              {/* 2. 内容区域：左右两栏 */}
              <Grid container spacing={3}>
                
                {/* 左侧：个人信息 */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'primary.main' }}>
                      Personal Information
                    </Typography>
                    <Stack spacing={2}>
                      <InfoRow icon={<EmailIcon />} label="Email" value={selectedStudent.email || 'N/A'} />
                      <InfoRow icon={<PhoneIcon />} label="Phone" value={selectedStudent.phone || "Not provided"} />
                      <InfoRow icon={<WorkIcon />} label="Organization" value={selectedStudent.organization || "Not provided"} />
                      <InfoRow icon={<LocationOnIcon />} label="Address" value={selectedStudent.address || "Not provided"} />
                    </Stack>
                  </Box>
                </Grid>

                {/* 右侧：培训信息 */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'primary.main' }}>
                      Training Information
                    </Typography>
                    <Stack spacing={2}>
                      <InfoRow icon={<SchoolIcon />} label="Module" value={selectedStudent.module === 'None' ? 'Not assigned' : selectedStudent.module} />
                      <InfoRow icon={<BadgeIcon />} label="Guide ID" value={selectedStudent.guideId || "Auto-generated"} />
                      
                      {/* 进度条 */}
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Overall Progress
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={selectedStudent.progressPercent || 0} 
                          sx={{ height: 8, borderRadius: 4 }} 
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {selectedStudent.progressPercent || 0}% Complete
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Grid>

              </Grid>

            </Paper>
          </DialogContent>
        )}
        
        <DialogActions sx={{ p: 2, bgcolor: '#f9fafb' }}>
          <Button onClick={() => setSelectedStudent(null)}>Close</Button>
          <Button variant="contained" onClick={() => { setSelectedStudent(null); setEditingStudent(selectedStudent); }}>
            Edit Profile
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box sx={{ color: 'primary.main' }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  </Box>
);

export default StudentManagement;
