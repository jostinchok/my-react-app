import React, { useState } from "react";
import { Box, Typography, Paper, Button, Snackbar, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, ButtonGroup 
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";

const AccountManagement = () => {
    const [students, setStudents] = useState([
      { id: 1, name: "Alice", phone: "", email: "alice@example.com", eligibility: "Pending", module: "None", cv: "Alice_CV.pdf", accountCreated: false },
      { id: 2, name: "Bob", phone: "", email: "bob@example.com", eligibility: "Rejected", module: "None", cv: "Bob_CV.pdf", accountCreated: false },
      { id: 3, name: "Charlie", phone: "0198765432", email: "charlie@example.com", eligibility: "Approved", module: "Specific", cv: "Charlie_CV.pdf", accountCreated: true },
      { id: 4, name: "David", phone: "", email: "david@example.com", eligibility: "Pending", module: "None", cv: "David_CV.pdf", accountCreated: false },
      { id: 5, name: "Eva", phone: "0123456789", email: "eva@example.com", eligibility: "Approved", module: "General", cv: "Eva_CV.pdf", accountCreated: true },
      { id: 6, name: "Frank", phone: "", email: "frank@example.com", eligibility: "Approved", module: "Physical", cv: "Frank_CV.pdf", accountCreated: true},
    ]);

    const [snackbar, setSnackbar] = useState({ open: false, message: "" });
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [editingStudent, setEditingStudent] = useState(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: "", phone: "", email: "", module: "None", cv: "" });

    const handleDelete = (id) => {
      setStudents(prev => prev.filter(s => s.id !== id));
      setSnackbar({ open: true, message: "Student deleted successfully" });
    };

    const updateEligibility = (id, status) => {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, eligibility: status } : s));
      setSnackbar({ open: true, message: `Eligibility updated to ${status}` });
    };

    const updateModule = (id, module) => {
      setStudents(prev => prev.map(s => 
        s.id === id 
          ? { ...s, module, registered: true } 
          : s
      ));
      const student = students.find(s => s.id === id);
      setSnackbar({ open: true, message: `${student.name} registered for ${module} module` });
    };

    const handleFilter = (e) => setFilter(e.target.value);

    const handleEditChange = (e) => {
      const {name, value} = e.target;
      setEditingStudent(prev => ({ ...prev, [name]: value}));
    }

    const handleSaveEdit = () => {
      setStudents(prev => 
        prev.map(s => s.id === editingStudent.id ? editingStudent : s)
      )
      setSnackbar({open: true, message: `Account updated for ${editingStudent.name}`});
      setEditingStudent(null);
    }

    const handleAddChange = (e) => {
      const { name, value } = e.target;
      setNewStudent(prev => ({ ...prev, [name]: value }));
    }

    const handleSaveNewStudent = () => {
      const newId = students.length ? Math.max(...students.map(s => s.id)) + 1 : 1;
      setStudents(prev => [...prev, { 
        id: newId, 
        ...newStudent, 
        eligibility: "Approved", 
        accountCreated: true 
      }]);
      setSnackbar({ open: true, message: `New student ${newStudent.name} added` });
      setNewStudent({ name: "", phone: "", email: "", module: "None", cv: "" });
      setAddDialogOpen(false);
    }

    const filteredStudents = students.filter(s =>
      (filter === "all" || s.module === filter) &&
      (searchTerm === "" || s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Account Management
        </Typography>

        {/* 搜索和筛选 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            size="small"
            label="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select size="small" value={filter} onChange={handleFilter}>
            <MenuItem value="all">All Modules</MenuItem>
            <MenuItem value="General">General</MenuItem>
            <MenuItem value="Specific">Specific</MenuItem>
            <MenuItem value="Physical">Physical</MenuItem>
          </Select>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
            Add Student
          </Button>
        </Box>

        {/* 学员卡片网格 */}
        {filteredStudents.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 5 }}>
            <Typography variant="h6" color="text.secondary">No students found</Typography>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={() => setAddDialogOpen(true)}>
              Add Student
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)'}, gap: 3 }}>
            {filteredStudents.map((student) => (
              <Paper key={student.id} sx={{
                p: 2,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                borderLeft: 4,
                borderColor:
                  student.eligibility === 'Approved' ? 'success.main' :
                  student.eligibility === 'Rejected' ? 'error.main' :
                  'warning.main'
              }}>

                {/* 顶部信息 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">{student.name}</Typography>

                  {student.eligibility === "Approved" && (
                    <IconButton size="small" color="primary" onClick={() => setEditingStudent(student)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>{student.email}</Typography>

                {/* 状态 Chips */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  <Chip label={student.eligibility} size="small"
                    color={student.eligibility === 'Approved' ? 'success' : student.eligibility === 'Rejected' ? 'error' : 'warning'} sx={{ height: 20 }} />
                  <Chip label={`Module: ${student.module}`} size="small" color="info" sx={{ height: 20 }} />
                  {student.accountCreated && <Chip label="Account Created" size="small" color="primary" sx={{ height: 20 }} />}
                  {student.registered && (
                    <Chip 
                      label={`Registered for ${student.name}`} 
                      size="small" 
                      color="secondary" 
                      sx={{ height: 20 }} 
                    />
                  )}
                </Box>

                {/* 操作按钮 */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', flexWrap: 'wrap'}}>
                  {student.eligibility === "Pending" ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      {/* 左侧：查看详情 */}
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => setSelectedStudent(student)}
                        sx={{ minWidth: 120 }}
                      >
                        View Details
                      </Button>

                      {/* 右侧：审批操作按钮组 */}
                      <ButtonGroup size="small" sx={{ minWidth: 240 }}>
                        <Button 
                          variant="contained" 
                          color="success"
                          sx={{ flex: 1 }}
                          onClick={() => {
                            setStudents(prev => prev.map(s => 
                              s.id === student.id 
                                ? { ...s, eligibility: "Approved", accountCreated: true } 
                                : s
                            ));
                            setSnackbar({ open: true, message: `Account created for ${student.name}` });
                          }}
                        >
                          Approve
                        </Button>
                        <Button 
                          color="error"
                          sx={{ flex: 1 }}
                          onClick={() => updateEligibility(student.id, "Rejected")}
                        >
                          Reject
                        </Button>
                      </ButtonGroup>
                    </Box>

                  ) : student.eligibility === "Approved" ? (
                    <>
                      <Select
                        size="small"
                        value={student.module}
                        onChange={(e) => updateModule(student.id, e.target.value)}
                      >
                        <MenuItem value="None">None</MenuItem>
                        <MenuItem value="General">General</MenuItem>
                        <MenuItem value="Specific">Specific</MenuItem>
                        <MenuItem value="Physical">Physical</MenuItem>
                      </Select>

                      <IconButton size="small" onClick={() => setSelectedStudent(student)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>

                      <IconButton size="small" color="error" onClick={() => handleDelete(student.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton size="small" onClick={() => setSelectedStudent(student)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(student.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {/* 编辑学员对话框 */}
        <Dialog open={!!editingStudent} onClose={() => setEditingStudent(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Account: {editingStudent?.name}</DialogTitle>
          <DialogContent sx={{ pt:2 }}>
            {editingStudent && (
              <Box sx={{display: 'flex', flexDirection: 'column', gap:2}}>
                <TextField
                  label="Name"
                  name="name"
                  value={editingStudent.name}
                  onChange={handleEditChange}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Phone"
                  name="phone"
                  value={editingStudent.phone || ""}
                  onChange={handleEditChange}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Email"
                  name="email"
                  value={editingStudent.email}
                  onChange={handleEditChange}
                  fullWidth
                  size="small"
                />

                {editingStudent.cv && (
                  <Typography variant="caption" color="text.secondary">
                    Current CV: {editingStudent.cv}
                  </Typography>
                )}
                <Button variant="outlined" component="label">
                  Upload CV
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files.length > 0) {
                        const file = e.target.files[0];
                        setEditingStudent(prev => ({ ...prev, cv: file.name }));
                      }
                    }}
                  />
                </Button>
                
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingStudent(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEdit}>Save Changes</Button>
          </DialogActions>
        </Dialog>

        {/* 新增学员对话框 */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogContent sx={{ pt:2 }}>
            <Box sx={{display: 'flex', flexDirection: 'column', gap:2}}>
              <TextField
                label="Name"
                name="name"
                value={newStudent.name}
                onChange={handleAddChange}
                fullWidth
                size="small"
              />
              <TextField
                label="Phone"
                name="phone"
                value={newStudent.phone}
                onChange={handleAddChange}
                fullWidth
                size="small"
              />
              <TextField
                label="Email"
                name="email"
                value={newStudent.email}
                onChange={handleAddChange}
                fullWidth
                size="small"
              />
              <Select
                name="module"
                size="small"
                value={newStudent.module}
                onChange={handleAddChange}
              >
                <MenuItem value="None">None</MenuItem>
                <MenuItem value="General">General</MenuItem>
                <MenuItem value="Specific">Specific</MenuItem>
                <MenuItem value="Physical">Physical</MenuItem>
              </Select>

              {/* 上传 CV */}
              {newStudent.cv && (
                <Typography variant="caption" color="text.secondary">
                  Selected file: {newStudent.cv}
                </Typography>
              )}

              <Button
                variant="outlined"
                component="label"
              >
                Upload CV
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      const file = e.target.files[0];
                      setNewStudent(prev => ({ ...prev, cv: file.name }));
                    }
                  }}
                />
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveNewStudent}>Add Student</Button>
          </DialogActions>
        </Dialog>

        {/* CV 查看对话框 */}
        <Dialog open={!!selectedStudent} onClose={() => setSelectedStudent(null)} maxWidth="md" fullWidth>
          <DialogTitle>Student Application</DialogTitle>
          <DialogContent>
            {selectedStudent && (
              <Box>
                <Typography>Name: {selectedStudent.name}</Typography>
                <Typography>Email: {selectedStudent.email}</Typography>
                <Typography>Phone: {selectedStudent.phone || "Not provided"}</Typography>
                <Typography>
                  Resume: {selectedStudent.cv || "No CV uploaded"}
                </Typography>
                <Typography>
                  Consultation: {selectedStudent.consultation || "No consultation info"}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedStudent(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={3000} 
          onClose={() => setSnackbar({ open: false, message: "" })} 
          message={snackbar.message} 
        />
      </Box>
    );
};

export default AccountManagement;