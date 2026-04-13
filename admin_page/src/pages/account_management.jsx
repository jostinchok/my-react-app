import React, { useState } from "react";
import { Box, Typography, Paper, Button, Snackbar, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem } from "@mui/material";
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

    const handleDelete = (id) => {
      setStudents(prev => prev.filter(s => s.id !== id));
      setSnackbar({ open: true, message: "Student deleted successfully" });
    };

    const updateEligibility = (id, status) => {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, eligibility: status } : s));
      setSnackbar({ open: true, message: `Eligibility updated to ${status}` });
    };

    const updateModule = (id, module) => {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, module } : s));
      setSnackbar({ open: true, message: `Module updated to ${module}` });
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

    const filteredStudents = students.filter(s =>
      (filter === "all" || s.module === filter) &&
      (searchTerm === "" || s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Account Management
        </Typography>

        <Paper sx={{ p: 2, mb: 2, backgroundColor: "#e3f2fd" }}>
          <Typography variant="body2" color="text.secondary">
            Manage accounts, verify eligibility, create accounts, and assign training modules.
          </Typography>
        </Paper>

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
        </Box>

        {/* 学员卡片网格 */}
        {filteredStudents.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 5 }}>
            <Typography variant="h6" color="text.secondary">No students found</Typography>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }}>
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
                </Box>

                {/* 操作按钮 */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', flexWrap: 'wrap'}}>
                  {student.eligibility === "Pending" ? (
                    <>
                      <Button size="small" variant="contained" color="success"
                        onClick={() => {
                          setStudents(prev => prev.map(s => s.id === student.id ? { ...s, eligibility: "Approved", accountCreated: true } : s));
                          setSnackbar({ open: true, message: `Account created for ${student.name}` });
                        }}>
                        Approve & Create Account
                      </Button>
                      <Button size="small" variant="outlined" color="error"
                        onClick={() => updateEligibility(student.id, "Rejected")}>
                        Reject
                      </Button>
                    </>
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
                    <IconButton size="small" color="error" onClick={() =>handleDelete(student.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    </>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        <Dialog open={!!editingStudent} onClose={() => setEditingStudent(null)} maxWidth="sm" fullWidth>\
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
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingStudent(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEdit}>Save Changes</Button>
          </DialogActions>
        </Dialog>

        {/* CV 查看对话框 */}
        <Dialog open={!!selectedStudent} onClose={() => setSelectedStudent(null)}>
          <DialogTitle>Student CV</DialogTitle>
          <DialogContent>
            {selectedStudent && (
              <Typography>{selectedStudent.name}'s CV: {selectedStudent.cv}</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedStudent(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: "" })} message={snackbar.message} />
      </Box>
    );
  };

export default AccountManagement;