import React, { useState } from "react";
import { Box, Grid, Card, CardHeader, CardContent, Typography, TextField, Select, MenuItem, Button, IconButton, FormGroup, FormControlLabel, Checkbox, Paper, AppBar, Toolbar, Modal
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import SaveIcon from "@mui/icons-material/Save";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const ModuleEditor = ({ module, onBack, onSave }) => {
  const [moduleTitle, setModuleTitle] = useState(module?.title || "");
  const [description, setDescription] = useState(module?.description || "");
  const [contentBlocks, setContentBlocks] = useState(module?.contentBlocks || []);
  const [badgeName, setBadgeName] = useState(module?.badge?.name || "");
  const [badgeType, setBadgeType] = useState(module?.badge?.type || "general");
  const [requireQuiz, setRequireQuiz] = useState(module?.badge?.requireQuiz || false);
  const [requirePhysical, setRequirePhysical] = useState(module?.badge?.requirePhysical || false);
  const [previewMode, setPreviewMode] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [editingQuiz, setEditingQuiz] = useState(null);

  const addContentBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type,
      title: type === "text" ? "New Text" : "",
      file: null
    };
    setContentBlocks(prev => [...prev, newBlock])
  };

  const addQuizBlock = () => {
    const newQuiz = {
      id: Date.now(),
      question: "",
      options: [],
      answer: ""
    }
    setQuizzes(prev => [...prev, newQuiz]);
  };


  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setContentBlocks(prev => [...prev, { id: Date.now(), type, title: file.name, file }]);
    }
    e.target.value = "";
  };

  const removeContentBlock = (id) => {
    setContentBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleSave = () => {
    const payload = {
      ...module,
      title: moduleTitle,
      description,
      contentBlocks,
      badge: { name: badgeName, type: badgeType, requireQuiz, requirePhysical }
    };
    onSave?.(payload);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newBlocks = Array.from(contentBlocks);
    const [moved] = newBlocks.splice(result.source.index, 1);
    newBlocks.splice(result.destination.index, 0, moved);
    setContentBlocks(newBlocks);
  };

  return (
    <Box sx={{ height: "100vh", bgcolor: "#f6f7fb", display: "flex", flexDirection: "column" }}>
      {/* 顶部工具栏 */}
      <AppBar position="sticky" color="transparent" elevation={0}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={onBack}><ArrowBackIcon /></IconButton>
            <Typography variant="h6">{moduleTitle}</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button startIcon={<VisibilityIcon />} onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? "Exit Preview" : "Preview"}
            </Button>
            <Button startIcon={<SaveIcon />} variant="contained" color="success" onClick={handleSave}>
              Save
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 主体区域：画布 + 侧边栏 */}
      <Box sx={{ flex: 1, display: "flex", gap: 3, p: 2 }}>
        {/* 左侧画布 */}
        <Box sx={{ flex: 1, bgcolor: "#fff", borderRadius: 2, p: 2, position: "relative", overflowY: "auto" }}>
          {/* 模块描述 */}
          {!previewMode && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">Module Info</Typography>
              <TextField fullWidth label="Title" value={moduleTitle} sx={{ mt: 2 }} />
              <TextField fullWidth label="Description" value={description} sx={{ mt: 2 }} multiline rows={3} />

              <Select
              fullWidth
              label="Module Type"
              value={badgeType}
              onChange={(e) => setBadgeType(e.target.value)}
              sx={{ mt:1 }}
              >
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="specific">Specific</MenuItem>
                <MenuItem value="physical">Physical</MenuItem>
              </Select>

              <Select
              fullWidth
              label="Badge"
              value={badgeName}
              onChange={(e) => setBadgeName(e.target.value)}
              sx={{ mt:1 }}
              >
                <MenuItem value="General Badge">General Badge</MenuItem>
                <MenuItem value="Bako Badge">Bako Badge</MenuItem>
                <MenuItem value="Gunung Gania Badge">Gunung Gania Badge</MenuItem>
                <MenuItem value="Physical Training Badge">Physical Training Badge</MenuItem>
                </Select>
              
              <FormGroup sx={{ mt:2 }}>
                <FormControlLabel
                control={<Checkbox checked={requireQuiz} onChange={(e) => setRequireQuiz(e.target.checked)} />}
                label="Require Quiz"
                />
                <FormControlLabel
                control={<Checkbox checked={requirePhysical} onChange={(e) => setRequirePhysical(e.target.checked)} />}
                label="Require Physical Training"
                />
              </FormGroup>
            </Paper>
          )}

          {/* 内容编辑区 */}
          {previewMode ? (
            <Box sx={{ width: "100%" }}>
              {contentBlocks.map((block) => (
                <Box key={block.id} sx={{ mb: 2, width: "100%" }}>
                  {block.type === "text" && <Typography sx={{ width: "100%" }}>{block.title}</Typography>}
                  {block.type === "image" && block.file && (
                    <img src={URL.createObjectURL(block.file)} alt={block.title}
                        style={{ width: "100%", maxHeight: 300, objectFit: "contain" }} />
                  )}
                  {block.type === "video" && block.file && (
                    <video controls style={{ width: "100%", maxHeight: 300 }}>
                      <source src={URL.createObjectURL(block.file)} />
                    </video>
                  )}
                </Box>
              ))}

              {quizzes.map((quiz) => (
                <Paper key={quiz.id} sx={{ p:2, mb:2}}>
                  <Typography variant="h6">Quiz: {quiz.question || "Untitled"}</Typography>
                  <Typography variant="body2">
                    Options: {quiz.options.length > 0 ? quiz.options.join(", ") : "No options"}
                  </Typography>
                  <Typography variant="body2">Answer: {quiz.answer || "Not set"}</Typography>
                  <Button size="small" onClick={() => setEditingQuiz(quiz)}>Edit Quiz</Button>
                </Paper>
              ))}
            </Box>
          ) : (
            <>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="canvas">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} style={{ width: "100%" }}>
                    {contentBlocks.map((block, index) => (
                      <Draggable key={block.id} draggableId={String(block.id)} index={index}>
                        {(prov) => (
                          <Paper ref={prov.innerRef} {...prov.draggableProps}
                                sx={{ p: 2, mb: 2, display: "flex", gap: 2, width: "100%" }}>
                            <Box {...prov.dragHandleProps}><DragHandleIcon /></Box>
                            <Box sx={{ flex: 1, width: "100%" }}>
                              {block.type === "text" && (
                                <TextField
                                  fullWidth
                                  value={block.title}
                                  onChange={(e) =>
                                    setContentBlocks(prev =>
                                      prev.map(b => b.id === block.id ? { ...b, title: e.target.value } : b)
                                    )
                                  }
                                />
                              )}
                              {block.type === "image" && block.file && (
                                <Box sx={{ position: "relative" }}>
                                  <img
                                    src={URL.createObjectURL(block.file)}
                                    alt={block.title}
                                    style={{ maxWidth: "100%", height: "auto", maxHeight: 200, objectFit: "contain" }}
                                  />
                                  <IconButton
                                    color="error"
                                    sx={{ position: "absolute", top: 8, right: 8 }}
                                    onClick={() => removeContentBlock(block.id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                  <Typography sx={{ flex: 1 }}>{block.title}</Typography>
                                </Box>
                              )}

                              
                              {block.type === "video" && block.file && (
                                <Box sx={{ positon: "relative"}}>
                                <video controls style={{ maxWidth: "100%", height: "auto", maxHeight: 200, objectFit: "contain" }}>
                                  <source src={URL.createObjectURL(block.file)} />
                                </video>
                                <IconButton
                                color="error"
                                sx={{ position: "absolute", top: 8, right: 8}}
                                onClick={() => removeContentBlock(block.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                                </Box>
                              )}
                              {block.type === "quiz" && (
                                <Paper variant="outlined" sx={{ flex: 1, p: 2, width: "100%" }}>
                                  <Typography variant="h6">Quiz: {block.question || "Untitled"}</Typography>
                                  <Typography variant="body2">
                                    Options: {block.options && block.options.length > 0 ? block.options.join(", ") : "No options"}
                                  </Typography>
                                  <Typography variant="body2">Answer: {block.answer || "Not set"}</Typography>
                                  <Button size="small" onClick={() => setEditingQuiz(block)}>Edit Quiz</Button>
                                </Paper>
                              )}
                            </Box>
                          </Paper>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {quizzes.map((quiz) => (
              <Paper key={quiz.id} sx={{ p:2, mb:2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="h6">Quiz: {quiz.question || "Untitled"}</Typography>
                  <Typography variant="body2">
                    Options: {quiz.options.length > 0 ? quiz.options.join(", ") : "No options"}
                  </Typography>
                  <Typography variant="body2">Answer: {quiz.answer || "Not set"}</Typography>
                  <Button size="small" onClick={() => setEditingQuiz(quiz)}>Edit Quiz</Button>
                </Box>
              <IconButton color="error" onClick={() => setQuizzes(prev => prev.filter(q => q.id !== quiz.id))}>
                <DeleteIcon />
              </IconButton>
              </Paper>
            ))}
            </>
          )}

          {!previewMode && (
            <Box 
            sx={{
              mt: 3,
              p: 4,
              border: "2px dashed #ccc",
              borderRadius: 2,
              textAlign: "center",
              cursor: "pointer",
              bgcolor: "#fafafa",
              "&:hover": { bgcolor: "#f0f0f0"}
            }}
            onClick={() => document.getElementById("upload-image").click()}
            >
              <Typography variant="h6">Drag a file here, or click ton upload</Typography>
              <Typography color="text.secondary" sx={{ mt:1 }}>
                Supported: Images & Videos
              </Typography>
            </Box>
          )}

          {!previewMode && (
            <Box sx={{ display: "flex", gap: 2, mt: 2}}>
              <Button variant="outlined" onClick={() => addContentBlock("text")}>Add Text</Button>
              <Button variant="outlined" onClick={addQuizBlock}>Add Quiz</Button>
            </Box>
          )}
          </Box>
      </Box>

       {/* Quiz 模态框编辑器 */}
      <Modal open={!!editingQuiz} onClose={() => setEditingQuiz(null)}>
        <Box sx={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "95%", md: "80%" },
          bgcolor: "white",
          p: 3,
          borderRadius: 2,
          boxShadow: 24
        }}>
          {editingQuiz && (
            <>
              <Box sx={{ display: 'flex', justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">Edit Quiz</Typography>
                <IconButton onClick={() => setEditingQuiz(null)}><CloseIcon /></IconButton>
              </Box>

              <TextField
                fullWidth
                label="Question"
                value={editingQuiz.question}
                onChange={(e) => setEditingQuiz({ ...editingQuiz, question: e.target.value })}
                sx={{ mt: 2 }}
              />

              <Typography variant="subtitle1" sx={{ mt: 2 }}>Options:</Typography>
              {editingQuiz.options.map((opt, idx) => (
                <Box key={idx} display="flex" alignItems="center" mb={1}>
                  <TextField
                    value={opt}
                    placeholder={`Option ${idx + 1}`}
                    onChange={(e) =>
                      setEditingQuiz({
                        ...editingQuiz,
                        options: editingQuiz.options.map((o, i) => i === idx ? e.target.value : o)
                      })
                    }
                  />
                  <IconButton
                    color="error"
                    onClick={() =>
                      setEditingQuiz({
                        ...editingQuiz,
                        options: editingQuiz.options.filter((_, i) => i !== idx)
                      })
                    }
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button onClick={() => setEditingQuiz({ ...editingQuiz, options: [...editingQuiz.options, ""] })}>
                Add Option
              </Button>

              <Typography variant="subtitle1" sx={{ mt: 2 }}>Correct Answer</Typography>
              <Select
                fullWidth
                value={editingQuiz.answer}
                onChange={(e) => setEditingQuiz({ ...editingQuiz, answer: e.target.value })}
              >
                {editingQuiz.options.map((opt, idx) => (
                  <MenuItem key={idx} value={opt}>{opt || `Option ${idx + 1}`}</MenuItem>
                ))}
              </Select>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Button onClick={() => setEditingQuiz(null)}>Cancel</Button>
                <Button
                  variant="contained"
                  onClick={() => {
                     setQuizzes(prev =>
                      prev.some(q => q.id === editingQuiz.id)
                        ? prev.map(b => b.id === editingQuiz.id ? editingQuiz : q)
                        : [...prev, editingQuiz]
                    );
                    setEditingQuiz(null);
                  }}
                >
                  Save Quiz
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      {/* 隐藏的文件上传 input */}
      <input
        type="file"
        accept="image/*"
        id="upload-image"
        style={{ display: "none" }}
        onChange={(e) => handleFileSelect(e, "image")}
      />
      <input
        type="file"
        accept="video/*"
        id="upload-video"
        style={{ display: "none" }}
        onChange={(e) => handleFileSelect(e, "video")}
      />
    </Box>
  );
};

// 顶层组件：模块选择 + 编辑器
const AdminTrainingModuleSetup = () => {
  const [modules, setModules] = useState([
    { id: 1, title: "Conservation Basics", type: "General", description: "", contentBlocks: [], status: "Draft" },
    { id: 2, title: "Bako National Park", type: "Specific", description: "", contentBlocks: [], status: "Published" }
  ]);
  const [selectedModule, setSelectedModule] = useState(null);

  const handleSaveModule = (updated) => {
    setModules(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    setSelectedModule(null);
  };

  return (
    <Box p={3}>
      {!selectedModule ? (
        <Grid container spacing={3}>
          {modules.map(m => (
            <Grid item xs={12} md={4} key={m.id}>
              <Card
                onClick={() => setSelectedModule(m)}
                sx={{
                  cursor: "pointer",
                  "&:hover": { boxShadow: 6, transform: "scale(1.02)" },
                  transition: "all 0.2s ease-in-out"
                }}
              >
                <CardHeader title={m.title} subheader={`Type: ${m.type}`} />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Status: {m.status}</Typography>
                  <Typography variant="body2" color="text.secondary">{m.description || "No description yet"}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <ModuleEditor
          module={selectedModule}
          onBack={() => setSelectedModule(null)}
          onSave={handleSaveModule}
        />
      )}
    </Box>
  );
};

export default AdminTrainingModuleSetup;