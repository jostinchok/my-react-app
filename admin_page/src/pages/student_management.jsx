import React, { useState } from "react";
import { 
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, LinearProgress, IconButton, Snackbar, Select, MenuItem } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const StudentManagement = () => {
  const [students, setStudents] = useState([
    { id: 1, name: "Alice", email: "alice@example.com", progressPercent: 80, badges: ["General Training"], eligibility: "Pending", module: "None" },
    { id: 2, name: "Bob", email: "bob@example.com", progressPercent: 40, badges: [], eligibility: "Pending", module: "None" },
    { id: 3, name: "Charlie", email: "charlie@example.com", progressPercent: 100, badges: ["General Training"], eligibility: "Approved", module: "Specific" },
  ]);

  const [snackbar, setSnackbar] = useState({ open: false, message: ""});

  const handleDelete = (id) => {
    setStudents(prev => prev.filter(s => s.id !== id ));
    setSnackbar({ open: true, message: "Student deleted successfully"});
  };

  const updateEligibility = (id, status) => {
    setStudents(prev => 
      prev.map(s => s.id === id ? { ...s, eligibility: status} : s)
    );
    setSnackbar({ open: true, message: `Eligibility updated to ${status}`});
  };

  const updateModule = (id, module) => {
    setStudents(prev => 
      prev.map(s => s.id === id ? {...s, module} : s)
    );
    setSnackbar({ open: true, message: `Module updated to ${module}`});
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Student Management
      </Typography>

      <Paper sx={{ p: 2, mb:2, backgroundColor: "#e3f2fd"}}>
        <Typography variant="body2" color="text.secondary">
          Manage students, track their progress.
        </Typography>
      </Paper>

      <Button variant="outlined" startIcon={<AddIcon />} sx={{ mb:2 }}>
        Add Student
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Badges</TableCell>
              <TableCell>Eligibility</TableCell>
              <TableCell>Module</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map(student => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  <LinearProgress
                    variant="determinate"
                    value={student.progressPercent}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: student.progressPercent === 100 ? "green" : "orange"
                      }
                    }}
                  />
                  <Typography variant="caption">{student.progressPercent}%</Typography>
                </TableCell>
                <TableCell>
                  {student.badges.length > 0 ? student.badges.join(", ") : "No badges yet"}
                </TableCell>
                <TableCell>
                  <Select
                    value={student.eligibility}
                    onChange={(e) => updateEligibility(student.id, e.target.value)}
                    size="small"
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={student.module}
                    onChange={(e) => updateModule(student.id, e.target.value)}
                    size="small"
                  >
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="General">General</MenuItem>
                    <MenuItem value="Specific">Specific</MenuItem>
                    <MenuItem value="Physical">Physical</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <IconButton color="error" onClick={() => handleDelete(student.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: ""})}
        message={snackbar.message}
      />
    </Box>
  );
};

export default StudentManagement;