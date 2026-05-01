import React, { useState } from "react";
import {
  Box, Paper, Typography, Card, CardContent, CardActions, Chip, LinearProgress,
  Button, ButtonGroup, Accordion, AccordionSummary, AccordionDetails, IconButton, Snackbar,
  Dialog, DialogTitle, DialogContent, Grid, Tooltip, TextField, Checkbox, FormControlLabel
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
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
      { id: 1, name: "Alice", progressPercent: 80, physicalCompleted: false, badgeIssued: false },
      { id: 3, name: "Charlie", progressPercent: 100, physicalCompleted: true, badgeIssued: false }
    ]},
    { id: 2, name: "Bako Park Guide", type: "Specific", requireQuiz: true, requirePhysical: true, eligibleStudents: [
      { id: 3, name: "Charlie", progressPercent: 100, physicalCompleted: true, badgeIssued: false }
    ]},
    { id: 3, name: "Gunung Gania Training", type: "Specific", requireQuiz: false, requirePhysical: true, eligibleStudents: [
      { id: 4, name: "David", progressPercent: 100, physicalCompleted: false, badgeIssued: false }
    ]}
  ]);

  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [selectedBadge, setSelectedBadge] = useState(null);

  // 新增徽章相关状态
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newBadge, setNewBadge] = useState({ name: "", type: "", requireQuiz: false, requirePhysical: false });

  const handleDelete = (id) => {
    setBadges(prev => prev.filter(b => b.id !== id));
    setSnackbar({ open: true, message: "Badge deleted successfully" });
  };

  const markPhysicalCompleted = (studentId, badgeId) => {
    setBadges(prev => prev.map(b =>
      b.id === badgeId
        ? { ...b, eligibleStudents: b.eligibleStudents.map(st =>
            st.id === studentId ? { ...st, physicalCompleted: true } : st
          )}
        : b
    ));
    const student = badges.find(b => b.id === badgeId)?.eligibleStudents.find(s => s.id === studentId);
    setSnackbar({ open: true, message: `${student?.name} marked Physical Training completed` });
  };

  const issueBadge = (studentId, badgeId) => {
    const badge = badges.find(b => b.id === badgeId);
    const student = badge.eligibleStudents.find(s => s.id === studentId);

    if (badge.requirePhysical && !student.physicalCompleted) {
      setSnackbar({ open: true, message: `${student.name} has not completed physical training` });
      return;
    }
    if (student.progressPercent < 100) {
      setSnackbar({ open: true, message: `${student.name} has not completed training progress` });
      return;
    }

    setBadges(prev => prev.map(b =>
      b.id === badgeId
        ? { ...b, eligibleStudents: b.eligibleStudents.map(st =>
            st.id === studentId ? { ...st, badgeIssued: true } : st
          )}
        : b
    ));

    setSnackbar({ open: true, message: `Issued "${badge.name}" to ${student.name}` });
    setSelectedBadge(null);
  };

  const handleAddBadge = () => {
    const id = badges.length + 1;
    setBadges([...badges, { ...newBadge, id, eligibleStudents: [] }]);
    setSnackbar({ open: true, message: `Badge "${newBadge.name}" added successfully` });
    setAddDialogOpen(false);
    setNewBadge({ name: "", type: "General", requireQuiz: false, requirePhysical: false });
  };

  return (
    <Box sx={{ p:3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3}}>
        <Typography variant="h4" sx={{ mb:3, fontWeight:"bold" }}>Badge Management</Typography>
        <Button 
        variant="contained" 
        color="primary" 
        startIcon={<AddIcon />}
        onClick={() => setAddDialogOpen(true)}>
          Add Badge
        </Button>
      </Box>
      <Grid container spacing={2}>
        {badges.map(badge => (
          <Grid item xs={12} md={6} lg={4} key={badge.id}>
            <Card sx={{ height: 360, borderRadius:3, boxShadow:4, display: "flex", flexDirection:"column"}}>
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
                            <Button size="small" variant="outlined" color="secondary" sx={{ mt:1 }} onClick={() => markPhysicalCompleted(s.id, badge.id)}>
                              Mark Physical Completed
                            </Button>
                        )}
                        
                        {s.badgeIssued && (
                        <Box sx={{ mt:1, display:"flex", gap:1 }}>
                          <Chip label="Badge Issued" color="primary" size="small" />
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => setSnackbar({ open: true, message: `Certificate generated for ${s.name}` })}
                          >
                            Generate Certificate
                          </Button>
                        </Box>
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
      <Dialog open={Boolean(selectedBadge)} onClose={() => setSelectedBadge(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Badge - {selectedBadge?.name}</DialogTitle>
        <DialogContent dividers>
          {selectedBadge?.eligibleStudents.length > 0 ? (
            selectedBadge.eligibleStudents.map(s => (
              <Paper key={s.id} sx={{ p:2, mb:2, borderRadius:2, boxShadow:1 }}>
                <Typography variant="subtitle1" fontWeight="bold">{s.name}</Typography>

                <Box sx={{ display:"flex", alignItems:"center", gap:1, mt:1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={s.progressPercent} 
                    sx={{ flex:1, height:6, borderRadius:3 }} 
                  />
                  <Typography variant="caption">{s.progressPercent}%</Typography>
                </Box>

                {selectedBadge.requirePhysical && (
                  s.physicalCompleted ? 
                    <Chip label="Physical Confirmed" color="success" size="small" sx={{ mt:1 }} /> : 
                    <Chip label="Physical Pending" color="warning" size="small" sx={{ mt:1 }} />
                )}
                
                <ButtonGroup variant="contained" size="small" sx={{ mt:2 }}>
                  <Button onClick={() => issueBadge(s.id, selectedBadge.id)}>
                    Issue Badge
                  </Button>
                  <Button 
                    color="secondary" 
                    onClick={() => setSnackbar({ open: true, message: `Notification sent to ${s.name}` })}
                  >
                    Send Notification
                  </Button>
                </ButtonGroup>
              </Paper>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">No eligible students</Typography>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add New Badge</DialogTitle>
        <DialogContent>
          <TextField
            label="Badge Name"
            fullWidth
            margin="dense"
            value={newBadge.name}
            onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
          />
          <TextField
            label="Type"
            fullWidth
            margin="dense"
            value={newBadge.type}
            onChange={(e) => setNewBadge({ ...newBadge, type: e.target.value })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newBadge.requireQuiz}
                onChange={(e) => setNewBadge({ ...newBadge, requireQuiz: e.target.checked })}
              />
            }
            label="Require Quiz"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newBadge.requirePhysical}
                onChange={(e) => setNewBadge({ ...newBadge, requirePhysical: e.target.checked })}
              />
            }
            label="Require Physical"
          />
          <Button variant="contained" sx={{ mt:2 }} onClick={handleAddBadge}>
            Save
          </Button>
        </DialogContent>
      </Dialog>

        {/* Snackbar 提示 */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={3000} 
          onClose={() => setSnackbar({ open:false, message:"" })} 
          message={snackbar.message} 
        />

    </Box>
  );
};

export default BadgeManagement;