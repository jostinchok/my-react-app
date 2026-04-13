import React, { useState } from "react";
import {
  Box, Typography, Card, CardContent, CardActions, Chip, LinearProgress,
  Button, Accordion, AccordionSummary, AccordionDetails, IconButton, Snackbar,
  Dialog, DialogTitle, DialogContent, Grid, Tooltip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import SchoolIcon from "@mui/icons-material/School";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";

const BadgeManagement = () => {
  const [badges, setBadges] = useState([
    { id: 1, name: "General Training", type: "General", requireQuiz: true, requirePhysical: false, eligibleStudents: [
      { id: 1, name: "Alice", progressPercent: 80, physicalCompleted: false },
      { id: 3, name: "Charlie", progressPercent: 100, physicalCompleted: true }
    ]},
    { id: 2, name: "Bako Park Guide", type: "Specific", requireQuiz: true, requirePhysical: true, eligibleStudents: [
      { id: 3, name: "Charlie", progressPercent: 100, physicalCompleted: true }
    ]},
    { id: 3, name: "Gunung Gania Training", type: "Specific", requireQuiz: false, requirePhysical: true, eligibleStudents: [
      { id: 4, name: "David", progressPercent: 100, physicalCompleted: false }
    ]}
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

    // 检查条件
    if (badge.requirePhysical && !student.physicalCompleted) {
      setSnackbar({ open: true, message: `${student.name} has not completed physical training` });
      return;
    }
    if (student.progressPercent < 100) {
      setSnackbar({ open: true, message: `${student.name} has not completed training progress` });
      return;
    }

    setSnackbar({ open: true, message: `Issued "${badge.name}" to ${student.name}` });
    setSelectedBadge(null);
  };

  return (
    <Box sx={{ p:3 }}>
      <Typography variant="h4" sx={{ mb:3, fontWeight:"bold" }}>Badge Management</Typography>

      <Grid container spacing={2}>
        {badges.map(badge => (
          <Grid item xs={12} md={6} lg={4} key={badge.id}>
            <Card sx={{ height: 340, borderRadius:3, boxShadow:4, display: "flex", flexDirection:"column"}}>
              <CardContent sx={{ flex:1 , overflowY: "auto"}}>
                <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", mb:1 }}>
                  <Box sx={{ borderLeft: `6px solid ${badge.type === "General" ? "#1976d2" : "#ff9800"}`, pl:2 }}>
                    <Typography variant="h6">{badge.name}</Typography>
                    <Typography variant="body2" color="text.secondary">Type: {badge.type}</Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Issue Badge">
                      <IconButton color="success" onClick={() => setSelectedBadge(badge)}>
                        <MilitaryTechIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Badge">
                      <IconButton color="error" onClick={() => handleDelete(badge.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box sx={{ mt:1 }}>
                  {badge.requireQuiz && <Chip icon={<SchoolIcon />} label="Quiz" color="primary" variant="outlined" size="small" sx={{ mr:1 }} />}
                  {badge.requirePhysical && <Chip icon={<FitnessCenterIcon />} label="Physical" color="secondary" variant="outlined" size="small" />}
                </Box>

                <Typography variant="body2" sx={{ mt:1 }}>
                  {badge.eligibleStudents.length} students, {badge.eligibleStudents.filter(s => s.progressPercent === 100).length} completed
                </Typography>
              </CardContent>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Eligible Students</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {badge.eligibleStudents.length > 0 ? (
                    badge.eligibleStudents.map(s => (
                      <Box key={s.id} sx={{ mb:2 }}>
                        <Typography>{s.name}</Typography>
                        <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                          <LinearProgress variant="determinate" value={s.progressPercent} sx={{ flex:1, height:6, borderRadius:3, "& .MuiLinearProgress-bar": { backgroundColor: s.progressPercent === 100 ? "green" : "orange" }}} />
                          {s.progressPercent === 100 ? <CheckCircleIcon color="success" /> : <HourglassBottomIcon color="warning" />}
                        </Box>
                        <Typography variant="caption">{s.progressPercent}%</Typography>
                        {badge.requirePhysical && (
                          s.physicalCompleted ? 
                            <Chip label="Physical Confirmed" color="success" size="small" sx={{ mt:1 }} /> : 
                            <Chip label="Physical Pending" color="warning" size="small" sx={{ mt:1 }} />
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">No eligible students</Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 弹窗：发放徽章 */}
      <Dialog open={Boolean(selectedBadge)} onClose={() => setSelectedBadge(null)}>
        <DialogTitle>Issue Badge - {selectedBadge?.name}</DialogTitle>
        <DialogContent>
          {selectedBadge?.eligibleStudents.length > 0 ? (
            selectedBadge.eligibleStudents.map(s => (
              <Box key={s.id} sx={{ mb:2 }}>
                <Typography>{s.name}</Typography>
                <LinearProgress variant="determinate" value={s.progressPercent} sx={{ height:6, borderRadius:3 }} />
                {selectedBadge.requirePhysical && (
                  s.physicalCompleted ? 
                    <Chip label="Physical Confirmed" color="success" size="small" sx={{ mt:1 }} /> : 
                    <Chip label="Physical Pending" color="warning" size="small" sx={{ mt:1 }} />
                )}
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

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open:false, message:"" })} message={snackbar.message} />
    </Box>
  );
};

export default BadgeManagement;