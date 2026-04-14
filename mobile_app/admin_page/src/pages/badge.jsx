import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Snackbar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech"; // 发放徽章图标

const BadgeManagement = () => {
  const [badges, setBadges] = useState([
    {  
      id: 1,  
      name: "General Training",  
      type: "General",  
      requireQuiz: true,  
      requirePhysical: false,
      eligibleStudents: [
        { id: 1, name: "Alice", progressPercent: 80 },
        { id: 3, name: "Charlie", progressPercent: 100 }
      ]
    },
    {  
      id: 2,  
      name: "Bako Park Guide",  
      type: "Specific",  
      requireQuiz: true,  
      requirePhysical: true,
      eligibleStudents: [
        { id: 3, name: "Charlie", progressPercent: 100 }
      ]
    },
    {  
      id: 3,  
      name: "Gunung Gania Training",  
      type: "Specific",  
      requireQuiz: false,  
      requirePhysical: true,
      eligibleStudents: []
    }
  ]);

  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [selectedBadge, setSelectedBadge] = useState(null);

  const handleDelete = (id) => {
    setBadges(prev => prev.filter(b => b.id !== id));
    setSnackbar({ open: true, message: "Badge deleted successfully" });
  };

  const issueBadge = (studentId, badgeId) => {
    const badge = badges.find(b => b.id === badgeId);
    const student = badge.eligibleStudents.find(s => s.id === studentId);
    setSnackbar({ open: true, message: `Issued "${badge.name}" to ${student.name}` });
    setSelectedBadge(null); // 关闭弹窗
  };

  return (
    <Box sx={{ p:3 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold"}}>
        Badge Management
      </Typography>

      <Paper sx={{ p:2, mb:2, backgroundColor: "#e3f2fd" }}>
        <Typography variant="body2" color="text.secondary">
          Badges are now more flexible. You can assign them to students and track progress directly.
        </Typography>
      </Paper>

      <Button variant="outlined" startIcon={<AddIcon />} sx={{ mb:2 }}>
        Add Badge
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Conditions</TableCell>
              <TableCell>Eligible Students</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {badges.map(badge => (
              <TableRow key={badge.id}>
                <TableCell>{badge.name}</TableCell>
                <TableCell>{badge.type}</TableCell>
                <TableCell>
                  {badge.requireQuiz && <Chip label="Quiz" color="primary" size="small" sx={{ mr:1 }} />}
                  {badge.requirePhysical && <Chip label="Physical" color="secondary" size="small" />}
                </TableCell>
                <TableCell>
                  {badge.eligibleStudents.length > 0 ? (
                    badge.eligibleStudents.map(s => (
                      <Box key={s.id} sx={{ mb:1 }}>
                        <Typography variant="body2">{s.name}</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={s.progressPercent}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: s.progressPercent === 100 ? "green" : "orange"
                            }
                          }}
                        />
                        <Typography variant="caption">{s.progressPercent}%</Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">No eligible students</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {/* 发放徽章图标按钮（统一入口） */}
                  <IconButton color="success" onClick={() => setSelectedBadge(badge)}>
                    <MilitaryTechIcon />
                  </IconButton>
                  {/* 删除徽章图标按钮 */}
                  <IconButton color="error" onClick={() => handleDelete(badge.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 弹窗：选择学员发放徽章 */}
      <Dialog open={Boolean(selectedBadge)} onClose={() => setSelectedBadge(null)}>
        <DialogTitle>Issue Badge - {selectedBadge?.name}</DialogTitle>
        <DialogContent>
          {selectedBadge?.eligibleStudents.length > 0 ? (
            selectedBadge.eligibleStudents.map(s => (
              <Box key={s.id} sx={{ mb:2 }}>
                <Typography>{s.name}</Typography>
                <LinearProgress variant="determinate" value={s.progressPercent} sx={{ height: 6, borderRadius: 3 }} />
                <Button variant="contained" size="small" sx={{ mt:1 }} onClick={() => issueBadge(s.id, selectedBadge.id)}>
                  Issue to {s.name}
                </Button>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">No eligible students</Typography>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        message={snackbar.message}
      />
    </Box>
  )
}

export default BadgeManagement;
