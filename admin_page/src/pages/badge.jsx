import React, { useState, useEffect, useContext } from "react";
import {
  Box, Typography, Card, Button, IconButton,
  Snackbar, Tooltip, Alert, Avatar, Chip, Paper,
  Divider, Stack, LinearProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Tabs, Tab
} from "@mui/material";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import StarIcon from "@mui/icons-material/Star";
import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import PendingIcon from "@mui/icons-material/Pending";
import SendIcon from "@mui/icons-material/Send";
import { ParkContext } from "../ParkContext";

const LEVEL_CONFIG = {
  beginner: { color: "#cd7f32", label: "Beginner", icon: <StarIcon />, bg: "linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)" },
  advance: { color: "#1976d2", label: "Advanced", icon: <MilitaryTechIcon />, bg: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)" },
  expert: { color: "#ffd700", label: "Expert", icon: <EmojiEventsIcon />, bg: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)" },
};

const BadgeManagement = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newBadge, setNewBadge] = useState({ 
    title: "", 
    level: "beginner",
    description: "",
    criteria: "Require 100% Progress",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const { selectedPark } = useContext(ParkContext);
  const filteredBadges = badges.filter(b => Number(b.park_id) === Number(selectedPark));

  useEffect(() => {
    const fetchBadges = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:4001/api/admin/badges?parkId=${selectedPark}`);
        const data = await res.json();
        setBadges(data.badges || []);
      } catch (err) {
        setSnackbar({ open: true, message: "Failed to load badges", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    if (selectedPark) fetchBadges();
  }, [selectedPark]);

  const handleAddBadge = async () => {
    if (!newBadge.title.trim()) {
      setSnackbar({ open: true, message: "Please enter a badge title", severity: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:4001/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newBadge, park_id: selectedPark }),   
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to add badge");

      setBadges(prev => [...prev, ...(result.badges || [])]);

      setSnackbar({ open: true, message: "Badge added successfully!", severity: "success" });
      setAddDialogOpen(false);
      setNewBadge({ title: "", level: "beginner", description: "", criteria: "Require 100% Progress"});
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:4001/api/admin/badges/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete badge");

      setBadges(prev => prev.filter(b => b.module_id !== id));
      setSnackbar({ open: true, message: "Badge deleted successfully", severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
  };

  const issueBadge = async (studentId, badgeId) => {
    try {
      const response = await fetch("http://localhost:4001/api/admin/issue-badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, badgeId })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to issue badge");

      if (result.updatedBadge) {
        setBadges(prev => prev.map(b => b.module_id === badgeId ? result.updatedBadge : b));
      }

      setSnackbar({ open: true, message: "Badge issued successfully!", severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setNewBadge({ title: "", level: "beginner", description: "", criteria: "Require 100% Progress" });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <Typography variant="h5" color="text.secondary">Loading Badge Management...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
      {/* 顶部标题栏 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, bgcolor: "#fff" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 1 }}>
            <EmojiEventsIcon sx={{ color: "#1976d2" }} />
            Badge Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage achievements and issue badges to eligible students.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Chip icon={<GroupsIcon />} label={`${filteredBadges.length} Badges Available`} color="primary" variant="outlined" />
          <Chip 
            icon={<CheckCircleIcon />} 
            label={`${filteredBadges.reduce((sum, b) => sum + (b.students || []).filter(s => s.badgeIssued).length, 0)} Issued Total`} 
            color="success" 
            variant="outlined" 
          />
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setAddDialogOpen(true)}
            sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
          >
            Add Badge
          </Button>
        </Box>
      </Paper>
      
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center", pb: 4 }}>
        {filteredBadges.length === 0 ? (
          <Typography variant="h6" color="text.secondary">
            No badges found for this park.
          </Typography>
        ) : (
          filteredBadges.map(badge => {
            const config = LEVEL_CONFIG[badge.level] || LEVEL_CONFIG.beginner;
            const completed = (badge.students || []).filter(s => s.progressPercent === 100).length;

            return (
              <Box key={badge.module_id} sx={{ width: 380, maxWidth: "100%", flexShrink: 0 }}>
                <Card sx={{ 
                  height: 680, // ✅ 固定卡片高度
                  borderRadius: 4, 
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)", 
                  border: "1px solid", 
                  borderColor: "divider",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden" // ✅ 防止内部内容溢出破坏固定尺寸
                }}>
                  {/* 卡片头部 */}
                  <Box sx={{ position: "relative", p: 3, pb: 2, background: config.bg, flexShrink: 0 }}>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <Avatar sx={{ bgcolor: config.color, width: 52, height: 52, fontSize: "1.4rem", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                        {config.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a1a2e", lineHeight: 1.2, mb: 0.5 }}>
                          {badge.title}
                        </Typography>
                        <Chip 
                          label={config.label} 
                          size="small" 
                          sx={{ bgcolor: config.color, color: "#fff", fontWeight: 600, height: 22 }} 
                        />
                      </Box>
                    </Box>

                    <Tooltip title="Delete Badge">
                      <IconButton 
                        onClick={() => handleDelete(badge.module_id)}
                        sx={{ 
                          position: "absolute", top: 12, right: 12,
                          bgcolor: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)",
                          color: "error.main", "&:hover": { bgcolor: "error.main", color: "#fff" }, boxShadow: 1
                        }}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* 卡片内容区域 */}
                  <Box sx={{ p: 3, pt: 2, flex: 1, display: "flex", flexDirection: "column", bgcolor: "rgba(255,255,255,0.5)", minHeight: 0 }}>
                    {/* 统计概览 (固定不压缩) */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, px: 1, flexShrink: 0 }}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>Students</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#333" }}>{(badge.students || []).length}</Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>Completed</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "success.main" }}>{completed}</Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>Issued</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
                          {(badge.students || []).filter(s => s.badgeIssued).length}
                        </Typography>
                      </Box>
                    </Box>

                    {/* 条件 (固定不压缩) */}
                    <Box sx={{ mb: 2, px: 1, flexShrink: 0 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Issuance Criteria:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {badge.criteria === null ? "No criteria set" : badge.criteria}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2, flexShrink: 0 }} />

                    {/* 学生列表 (自动填充剩余空间并滚动) */}
                    <Box sx={{ flex: 1, overflowY: "auto", pr: 1, minHeight: 0 }}>
                      {(badge.students || []).length > 0 ? (
                        <Stack spacing={1.5}>
                          {badge.students.map(s => (
                            <Paper key={`${badge.module_id}-${s.id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{s.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{s.progressPercent}%</Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={s.progressPercent} 
                                sx={{ height: 6, borderRadius: 3, mb: 1.5, bgcolor: "#eee", "& .MuiLinearProgress-bar": { bgcolor: s.progressPercent === 100 ? "success.main" : "primary.main" } }} 
                              />
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  {s.progressPercent === 100 ? (
                                    <CheckCircleIcon sx={{ color: "success.main", fontSize: 18 }} />
                                  ) : (
                                    <HourglassBottomIcon sx={{ color: "warning.main", fontSize: 18 }} />
                                  )}
                                  <Typography variant="caption" color={s.progressPercent === 100 ? "success.main" : "text.secondary"}>
                                    {s.progressPercent === 100 ? "Ready" : "In Progress"}
                                  </Typography>
                                </Box>
                                {s.badgeIssued ? (
                                  <Chip label="Issued" size="small" color="success" variant="outlined" icon={<MilitaryTechIcon fontSize="small" />} />
                                ) : (
                                  <Tooltip title={`Issue to ${s.name}`}>
                                    <IconButton 
                                      size="small" 
                                      color="primary" 
                                      onClick={() => issueBadge(s.id, badge.module_id)}
                                      disabled={s.progressPercent < 100}
                                    >
                                      <SendIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </Paper>
                          ))}
                        </Stack>
                      ) : (
                        <Box sx={{ textAlign: "center", py: 6, color: "text.disabled" }}>
                          <PendingIcon sx={{ fontSize: 40, mb: 1 }} />
                          <Typography>No students assigned</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* 底部按钮 (固定不压缩) */}
                    <Box sx={{ mt: 2, pt: 1, borderTop: "1px solid rgba(0,0,0,0.05)", flexShrink: 0 }}>
                      <Button 
                        variant="contained" 
                        fullWidth 
                        startIcon={<MilitaryTechIcon />}
                        sx={{ borderRadius: 2, textTransform: "none", py: 1.5 }}
                        onClick={() => { setSelectedBadge(badge); setTabValue(0); }}
                      >
                        Manage Issuance
                      </Button>
                    </Box>
                  </Box>
                </Card>
              </Box>
            );
          })
        )}
      </Box>


      {/* 添加徽章弹窗 */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Add New Badge</Typography>
          <IconButton onClick={handleCloseAddDialog} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" fullWidth value={newBadge.title} onChange={(e) => setNewBadge({ ...newBadge, title: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select value={newBadge.level} onChange={(e) => setNewBadge({ ...newBadge, level: e.target.value })}>
                <MenuItem value="beginner">beginner</MenuItem>
                <MenuItem value="advance">Advanced</MenuItem>
                <MenuItem value="expert">Expert</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Description" fullWidth value={newBadge.description} onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Criteria</InputLabel>
              <Select value={newBadge.criteria} onChange={(e) => setNewBadge({ ...newBadge, criteria: e.target.value })}>
                <MenuItem value="Require 100% Progress">Require 100% Progress</MenuItem>
                <MenuItem value="Require Quiz Completion">Require Quiz Completion</MenuItem>
                <MenuItem value="Require Field Training">Require Field Training</MenuItem>
                <MenuItem value="Require Quiz + Progress">Require Quiz + Progress</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button 
            onClick={handleAddBadge} 
            variant="contained" 
            disabled={!newBadge.title.trim() || isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 批量管理发放弹窗 */}
      <Dialog 
        open={Boolean(selectedBadge)} 
        onClose={() => setSelectedBadge(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "grey.50", px: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <MilitaryTechIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Manage Issuance</Typography>
              <Typography variant="body2" color="text.secondary">{selectedBadge?.title}</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setSelectedBadge(null)} size="small" sx={{ bgcolor: "background.paper", boxShadow: 1 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ bgcolor: "#fff", p: 0 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1 }}>
            <Tab label="All Students" />
            <Tab label="Eligible Only" />
          </Tabs>
          <Box sx={{ maxHeight: 500, overflowY: "auto", p: 3 }}>
            {(() => {
              const students = tabValue === 0 
                ? (selectedBadge?.students || []) 
                : (selectedBadge?.students || []).filter(s => s.progressPercent === 100 && !s.badgeIssued);

              return students.length > 0 ? (
                <Stack spacing={2}>
                  {students.map(s => (
                    <Box key={s.id} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{s.name}</Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                          <LinearProgress variant="determinate" value={s.progressPercent} sx={{ height: 4, borderRadius: 2, width: 150 }} />
                          <Typography variant="caption" color="text.secondary">{s.progressPercent}%</Typography>
                        </Box>
                      </Box>
                      <Button 
                        variant="contained" 
                        size="small"
                        startIcon={<SendIcon />}
                        onClick={() => issueBadge(s.id, selectedBadge?.module_id)}
                        disabled={s.badgeIssued}
                        sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
                      >
                        {s.badgeIssued ? "Issued" : "Issue Badge"}
                      </Button>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                  <Typography variant="body1">No eligible students available</Typography>
                </Box>
              );
            })()}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, bgcolor: "grey.50" }}>
          <Button variant="outlined" onClick={() => setSelectedBadge(null)} sx={{ borderRadius: 2 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar 提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2, boxShadow: 2, minWidth: 300, justifyContent: "center" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BadgeManagement;
