import React, { useState } from "react";
import { Box, Card, CardHeader, CardContent, Typography, TextField, Select, MenuItem, Button, IconButton, AppBar, Toolbar, Modal, Accordion, AccordionSummary, Paper, Tooltip, Divider, Snackbar, Alert
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import SaveIcon from "@mui/icons-material/Save";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from '@mui/icons-material/Refresh'
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import VideocamIcon from "@mui/icons-material/Videocam";
import QuizIcon from "@mui/icons-material/Quiz";
import AddIcon from "@mui/icons-material/Add";

const ModuleEditor = ({ module, onBack, onSave }) => {
    const defaultBlocks = [
      { id: 1, type: "text", title: "Introduction", content: "" },
      { id: 2, type: "text", title: "Description", content: "" },
      { 
        id: 3, 
        type: "quiz", 
        title: "Quiz", 
        questions: [
          { question: "", options: [], answer: "", score: 0 },
          { question: "", options: [], answer: "", score: 0 }
          
        ] 
      }
    ];

    const [moduleTitle, setModuleTitle] = useState(module?.title || "");

    const [description, setDescription] = useState(module?.description || "");

    const [contentBlocks, setContentBlocks] = useState
    (module?.contentBlocks?.length > 0 ? module.contentBlocks : defaultBlocks);
    const [previewMode, setPreviewMode] = useState(true);
    const [quizList, setQuizList] = useState([]);
    const [showAddQuizDialog, setShowAddQuizDialog] = useState(false);
    const [tempScore, setTempScore] = useState(1); 
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const addContentBlock = (type, extraData = {}) => {
      const newBlock = {
        id: Date.now(),
        type,
        title: "",
        file: null,
        questions: [
          { question: "", options: [], answer: "", score: 0 }
        ],
        ...extraData
      };
      setContentBlocks(prev => [...prev, newBlock]);
    };


    const handleSave = () => {
      const payload = {
        ...module,
        title: moduleTitle,
        description,
        contentBlocks,
      };
      onSave?.(payload);
      setSnackbarOpen(true); 
    };


    const handleFileSelect = (e, type) => {
      const file = e.target.files[0];
      if (file) {
        setContentBlocks(prev => [
          ...prev,
          { id: Date.now(), type, title: file.name, file }
        ]);
      }
      e.target.value = ""; 
    };

    const onDragEnd = (result) => {
      if (!result.destination) return;
      const newBlocks = Array.from(contentBlocks);
      const [moved] = newBlocks.splice(result.source.index, 1);
      newBlocks.splice(result.destination.index, 0, moved);
      setContentBlocks(newBlocks);
    };

    const removeContentBlock = (id) => {
      setContentBlocks(prev => prev.filter(b => b.id !== id));
    };

    return (
      <Box sx={{ height: "100vh", bgcolor: "#f6f7fb", display: "flex", flexDirection: "column" }}>
        <AppBar position="sticky" color="transparent" elevation={0}>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={() => {
                if (previewMode) {
                  onBack();              
                } else {
                  setPreviewMode(true);  
                }
              }}>
                <ArrowBackIcon />Back
              </IconButton>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              {previewMode ? (
                <Button variant="contained" onClick={() => setPreviewMode(false)}>Edit Module</Button>
              ) : (
                <Button startIcon={<SaveIcon />} variant="contained" color="success" onClick={handleSave}>
                  Save
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, p: 3, bgcolor: '#f9f9f9' }}>
        {previewMode ? (
          <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
            
          {/* 1. 模块头部信息 */}
          <Box sx={{ mb: 8, pb: 4, borderBottom: '2px solid #f0f0f0' }}>
            <Typography variant="h2" sx={{ fontSize: '2.5rem', fontWeight: 300, color: '#2c3e50', mb: 2 }}>
              {moduleTitle || "Untitled Module"}
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', fontSize: '1.1rem', lineHeight: 1.8 }}>
              {description || "No description provided."}
            </Typography>
          </Box>

          {/* 2. 内容区域 */}
          {contentBlocks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10, color: '#999', border: '2px dashed #ddd', borderRadius: 2 }}>
              <Typography variant="h6">Empty Module</Typography>
              <Typography variant="body2">Switch to Edit mode to add content.</Typography>
            </Box>
            ) : (
            contentBlocks.map((block) => (
              <Box key={block.id} sx={{ mb: 6, position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2.5 }}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      borderRadius: 1.5, 
                      bgcolor: block.type === 'text' ? '#333' : block.type === 'quiz' ? '#9c27b0' : block.type === 'image' ? '#1976d2' : '#d32f2f',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    {block.type === 'text' && <DescriptionIcon sx={{ color: 'white', fontSize: 24 }} />}
                    {block.type === 'image' && <ImageIcon sx={{ color: 'white', fontSize: 24 }} />}
                    {block.type === 'video' && <VideocamIcon sx={{ color: 'white', fontSize: 24 }} />}
                    {block.type === 'quiz' && <QuizIcon sx={{ color: 'white', fontSize: 24 }} />}
                  </Box>
                  
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#222', fontSize: '1.4rem' }}>
                    {block.type === "image" ? "Photo": 
                    block.type === "video" ? "Video" :
                    block.type === "quiz" ? "Quiz":
                    block.title || "Untitled Section"}
                  </Typography>
                </Box>

                {/* --- 内容主体 --- */}
                <Box sx={{ pl: { xs: 0, md: 8 } }}>
                  
                  {block.type === "text" && (
                    <Typography variant="body1" sx={{ color: '#444', lineHeight: 1.8, fontSize: '1.05rem', whiteSpace: 'pre-wrap', bgcolor: '#fafafa', p: 3, borderRadius: 2, borderLeft: '4px solid #eee' }}>
                      {block.content || block.title}
                    </Typography>
                  )}

                  {block.type === "image" && block.file && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ 
                        borderRadius: 2, 
                        overflow: 'hidden', 
                        border: '1px solid #e0e0e0',
                        maxWidth: '700px',
                        width: 'fit-content',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
                      }}>
                        <img 
                          src={URL.createObjectURL(block.file)} 
                          alt={block.caption}
                          style={{ display: 'block', width: '100%', height: 'auto' }} 
                        />
                      </Box>
                      {block.caption && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#666', ml: 0.5, fontStyle: 'italic' }}>
                          {block.caption}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {block.type === "video" && block.file && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ 
                        borderRadius: 2, 
                        overflow: 'hidden', 
                        border: '1px solid #e0e0e0',
                        maxWidth: '700px',
                        width: '100%',
                        aspectRatio: '16/9',
                        bgcolor: '#000',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                      }}>
                        <video 
                          src={URL.createObjectURL(block.file)}
                          controls 
                          style={{ width: '100%', height: '100%', display: 'block' }} 
                        />
                      </Box>
                      {block.caption && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#666', ml: 0.5, fontStyle: 'italic' }}>
                          {block.caption}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {block.type === "quiz" && Array.isArray(block.questions) && (
                    <Box sx={{ bgcolor: '#fafafa', p: 3, borderRadius: 2, borderLeft: '4px solid #eee' }}>
                      {block.questions.map((q, qIdx) => (
                        <Box key={qIdx} sx={{ mb: 3 }}>
                          {/* 题目 + 分数 */}
                          <Typography 
                            variant="subtitle1" 
                            sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <QuizIcon fontSize="small" />
                              {`Q${qIdx + 1}. ${q.question || "Untitled Question"}`}
                            </Box>
                            <Box sx={{ fontWeight: "bold", color: "#1976d2" }}>
                              {q.score} pts
                            </Box>
                          </Typography>

                          {/* 选项 + 答案 */}
                          <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                            {Array.isArray(q.options) && q.options.map((opt, idx) => (
                              <Typography 
                                component="li" 
                                key={idx} 
                                variant="body2" 
                                sx={{ mb: 0.5, color: q.answer === opt ? '#1976d2' : '#555', fontWeight: q.answer === opt ? 'bold' : 'normal' }}
                              >
                                {opt || `Option ${idx + 1}`} {q.answer === opt && "✓"}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
        ) : ( 
            // ----------- Edit Mode -----------
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ flex: 1, maxWidth: 1000, mx: 0}}>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="canvas">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        {contentBlocks.map((block, index) => (
                          <Draggable key={block.id} draggableId={String(block.id)} index={index}>
                            {(prov) => (
                              <Box
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                sx={{
                                  mb: 3,
                                  position: 'relative',
                                  '&:hover .action-buttons': { opacity: 1 }, 
                                  width: '100%'
                                }}
                              >
                                <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fff', width: '100%' }}>
                                  <Box 
                                    {...prov.dragHandleProps}
                                    sx={{ 
                                      p: 1, 
                                      bgcolor: '#fafafa', 
                                      borderBottom: '1px solid #f0f0f0',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      cursor: 'grab',
                                      borderRadius: '2px 2px 0 0'
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                                      <DragHandleIcon sx={{ color: '#999', fontSize: 20 }} />
                                      <Typography variant="caption" sx={{ color: '#999', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        {block.type}
                                      </Typography>
                                    </Box>

                                    <Box className="action-buttons" sx={{ display: 'flex', gap: 0.5, opacity: 0, transition: 'opacity 0.2s' }}>
                                      {(block.type === 'image' || block.type === 'video') && (
                                        <Tooltip title="Replace File">
                                          <IconButton
                                            size="small"
                                            onClick={() => document.getElementById(block.type === 'image' ? "upload-image" : "upload-video").click()}
                                          >
                                            <RefreshIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      <Tooltip title="Delete">
                                        <IconButton size="small" color="error" onClick={() => removeContentBlock(block.id)}>
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                  </Box>
                                </Box>

                                  {/* 4. 内容编辑区 */}
                                  <Box sx={{ p: 3 }}>
                                    
                                    {/* 文本块：区分标题和内容 */}
                                    {block.type === "text" && (
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                                        <TextField
                                            size="small"
                                            placeholder="Section Title (e.g. Introduction)"
                                            value={block.title || ""}
                                            onChange={(e) =>
                                              setContentBlocks(prev =>
                                                prev.map(b => b.id === block.id ? { ...b, title: e.target.value } : b)
                                              )
                                            }
                                            variant="standard"
                                        />
                                        <Divider />
                                        <TextField
                                            fullWidth
                                            multiline
                                            minRows={3}
                                            placeholder="Type content here..."
                                            value={block.content || ""}
                                            onChange={(e) =>
                                              setContentBlocks(prev =>
                                                prev.map(b => b.id === block.id ? { ...b, content: e.target.value } : b)
                                              )
                                            }
                                            variant="outlined"
                                            size="small"
                                        />
                                      </Box>
                                    )}
                                    {block.type === "image" && block.file && (
                                      <Box sx={{ mb:2 }}>
                                        <Box sx={{
                                          borderRadius: 2,
                                          maxWidth: '700px',
                                          width: '100%',
                                          aspectRatio: '4/3',
                                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                          alignSelf: 'flex-start'
                                          
                                        }}>
                                          <img src={URL.createObjectURL(block.file)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                                        </Box>
                                        {block.caption && (
                                          <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#666', ml: 0.5, fontStyle: 'italic' }}>
                                            {block.caption}
                                          </Typography>
                                        )}
                                      </Box>
                                    )}

                                    {block.type === "video" && block.file && (
                                      <Box sx={{ mb: 2 }}>
                                        <Box sx={{ 
                                          borderRadius: 2, 
                                          overflow: 'hidden', 
                                          border: '1px solid #e0e0e0',
                                          maxWidth: '700px',   // 限制最大宽度
                                          width: '100%',
                                          aspectRatio: '16/9',
                                          bgcolor: '#000',
                                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                          alignSelf: 'flex-start'  // 靠左
                                        }}>
                                        <video 
                                          src={URL.createObjectURL(block.file)} 
                                          controls 
                                          style={{ width: '100%', borderRadius: 4 }} 
                                        />
                                        </Box>
                                        {block.caption && (
                                          <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#666', ml: 0.5, fontStyle: 'italic' }}>
                                            {block.caption}
                                          </Typography>
                                        )}
                                      </Box>
                                    )}
                                    {block.type === "quiz" && Array.isArray(block.questions) && (
                                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                        {block.questions.map((q, qIdx) => (
                                          <Paper 
                                            key={qIdx} 
                                            variant="outlined" 
                                            sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}
                                          >
                                            <Typography 
                                              variant="subtitle1" 
                                              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
                                            >
                                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <QuizIcon fontSize="small" />
                                                {`Q${qIdx + 1}. ${q.question || "Untitled Question"}`}
                                              </Box>
                                              <Box sx={{ fontWeight: "bold", color: "#1976d2" }}>
                                                {q.score} pts
                                              </Box>
                                            </Typography>

                                            {/* 选项 + 答案 */}
                                            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                                              {Array.isArray(q.options) && q.options.map((opt, idx) => (
                                                <Typography 
                                                  component="li" 
                                                  key={idx} 
                                                  variant="body2" 
                                                  sx={{ mb: 1, color: q.answer === opt ? '#1976d2' : '#555', fontWeight: q.answer === opt ? 'bold' : 'normal' }}
                                                >
                                                  {opt || `Option ${idx + 1}`} {q.answer === opt && "✓"}
                                                </Typography>
                                              ))}
                                            </Box>
                                          </Paper>
                                        ))}

                                        {/* 编辑按钮 */}
                                        <Button
                                          size="small"
                                          onClick={() => setQuizList(block.questions)}
                                          sx={{ mt: 1, alignSelf: "flex-end" }}
                                        >
                                          Edit Questions
                                        </Button>
                                      </Box>
                                    )}
                                  </Box>
                                </Paper>
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                </Box>

              {/* 添加内容按钮 */}
              <Box sx={{width: 200, display: "flex", flexDirection: "column", gap: 2 }}>
                {/* 右侧工具栏 */}
                <Paper 
                  elevation={2} 
                  sx={{ 
                    width: 220, 
                    p: 2, 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: 2, 
                    position: "sticky", 
                    top: 80, 
                    borderRadius: 2, 
                    bgcolor: "#fafafa" 
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: "#555", fontWeight: 600, mb: 1 }}>
                    Add Content
                  </Typography>

                  <Button startIcon={<DescriptionIcon />} variant="outlined" onClick={() => addContentBlock("text")}>
                    Text
                  </Button>

                  <Button 
                    startIcon={<QuizIcon />} 
                    variant="outlined" 
                    onClick={() => {
                      const newQuizBlock = {
                        id: Date.now(),
                        type: "quiz",
                        title: "Quiz",
                        questions: [
                          { question: "", options: [], answer: "", score: 10 }
                        ]
                      };
                      setContentBlocks(prev => [...prev, newQuizBlock]);
                      setQuizList(newQuizBlock.questions); // 打开编辑器，传入这个 block 的 questions
                    }} 
                  >
                    Quiz 
                  </Button>
                  <Button startIcon={<ImageIcon />} variant="outlined" onClick={() => document.getElementById("upload-image").click()}>
                    Image
                  </Button>
                  <Button startIcon={<VideocamIcon />} variant="outlined" onClick={() => document.getElementById("upload-video").click()}>
                    Video
                  </Button>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="caption" sx={{ color: "#888", textAlign: "center" }}>
                    Use these tools to build your module
                  </Typography>
                </Paper>
              </Box>
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
            )}
            </Box>
            <Modal open={quizList.length > 0} onClose={() => setQuizList([])}>
              <Box sx={{
                maxWidth: 800,
                width: "90%",
                margin: "auto",
                mt: "5vh",
                bgcolor: "white",
                p: 4,
                borderRadius: 2,
                boxShadow: 24,
                maxHeight: "90vh",
                overflow: "auto"
              }}>
                {/* 标题区 */}
                <Box sx={{ display: 'flex', justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold">Quiz Management</Typography>
                  <IconButton onClick={() => setQuizList([])}><CloseIcon /></IconButton>
                </Box>

                {/* 题目列表 */}
                {quizList.map((quiz, quizIndex) => (
                  <Card key={quizIndex} sx={{ mb: 3 }}>
                    <CardHeader title={`Question ${quizIndex + 1}`} 
                    action={
                      <TextField
                        type="number"
                        label="Score"
                        value={quiz.score || 0}
                        onChange={(e) => {
                          const newScore = parseInt(e.target.value, 10) || 0;
                          setQuizList(prev => prev.map((q, i) => i === quizIndex ? { ...q, score: newScore } : q));
                        }}
                        sx={{ mb: 2, width: "150px" }}
                      />
                    }
                    />
                    <CardContent>
                      <TextField
                        fullWidth
                        label="Question Text"
                        value={quiz.question}
                        onChange={(e) => {
                          const newQuestion = e.target.value;
                          setQuizList(prev => prev.map((q, i) => i === quizIndex ? { ...q, question: newQuestion } : q));
                        }}
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="subtitle2" fontWeight="bold" mb={1}>Options</Typography>
                      {quiz.options.map((opt, optIdx) => (
                        <Box key={optIdx} display="flex" alignItems="center" mb={1} gap={1}>
                          <TextField
                            size="small"
                            value={opt}
                            placeholder={`Option ${optIdx + 1}`}
                            onChange={(e) => {
                              const newOpt = e.target.value;
                              setQuizList(prev => prev.map((q, i) => 
                                i === quizIndex 
                                  ? { ...q, options: q.options.map((o, j) => j === optIdx ? newOpt : o) } 
                                  : q
                              ));
                            }}
                            sx={{ flex: 1 }}
                          />
                          <IconButton size="small" color="error" onClick={() => {
                            setQuizList(prev => prev.map((q, i) => 
                              i === quizIndex 
                                ? { ...q, options: q.options.filter((_, j) => j !== optIdx) } 
                                : q
                            ));
                          }}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}

                      <Button size="small" variant="outlined" onClick={() => {
                        setQuizList(prev => prev.map((q, i) => 
                          i === quizIndex 
                            ? { ...q, options: [...q.options, ""] } 
                            : q
                        ));
                      }}>
                        + Add Option
                      </Button>

                      <Typography variant="subtitle2" fontWeight="bold" mt={2} mb={1}>Correct Answer</Typography>
                      <Select
                        fullWidth
                        size="small"
                        value={quiz.answer}
                        onChange={(e) => {
                          const newAnswer = e.target.value;
                          setQuizList(prev => prev.map((q, i) => i === quizIndex ? { ...q, answer: newAnswer } : q));
                        }}
                        displayEmpty
                      >
                        {quiz.options.map((opt, idx) => (
                          <MenuItem key={idx} value={opt}>
                            {opt || <em>Option {idx + 1}</em>}
                          </MenuItem>
                        ))}
                      </Select>
                    </CardContent>
                  </Card>
                ))}

                {/* 底部按钮区 */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                 <Button variant="contained" color="primary" 
                    onClick={() => setQuizList(prev => [...prev, { question: "", options: [""], answer: "", score: 0 }])}>
                    + Add Question
                  </Button>

                  <Button variant="outlined" onClick={() => {
                    setQuizList([]);
                  }}>
                    Cancel
                  </Button>

                  <Button variant="contained" 
                    onClick={() => {
                      setContentBlocks(prev => prev.map(b => 
                        b.type === "quiz" ? { ...b, questions: quizList } : b
                      ));
                      setQuizList([]);
                    }}>
                    Save All ({quizList.length})
                  </Button>
                </Box>
              </Box>
            </Modal>

            <Snackbar
              open={snackbarOpen}
              autoHideDuration={3000}
              onClose={() => setSnackbarOpen(false)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                Module saved successfully!
              </Alert>
            </Snackbar>
  </Box>
    );
};

const AdminTrainingModuleSetup = () => {
  const [course] = useState({
    id: 1,
    title: "Conservation Training",
    description: "Learn about conservation practices and specific national parks.",
    modules: [
      { id: 1, title: "Conservation Basics", description: "General introduction to conservation principles", contentBlocks: [], status: "Draft" },
      { id: 2, title: "Bako National Park", description: "Specific conservation practices in Bako", contentBlocks: [], status: "Published" },
      { id: 3, title: "Gunung Gania", description: "Exploring conservation in Gunung Gania", contentBlocks: [], status: "Draft" },
      { id: 4, title: "Physical Training", description: "Hands-on physical conservation training", contentBlocks: [], status: "Draft" }
    ]
  });
  const [selectedModule, setSelectedModule] = useState(null);

  const handleSaveModule = (updated) => {
    const exists = course.modules.some(m => m.id === updated.id);
    const updatedModules = exists
      ? course.modules.map(m => m.id === updated.id ? updated : m)
      : [...course.modules, updated];   // 如果是新模块就追加
    course.modules = updatedModules;
    setSelectedModule(updated);
  };

  return (
      <>
        {!selectedModule ? (
        <Box sx={{ mt:6, ml: 6}}>
          <Box sx={{ display: 'flex', justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h4">{course.title}</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 3, mr: 3}} 
              startIcon={<AddIcon />}
              onClick={() => {
                const newModule = {
                  id: Date.now(),
                  title: "New Module",
                  description: "",
                  contentBlocks: [],
                  status: "Draft"
                };
                setSelectedModule(newModule);
              }}
            >
              Add Module
            </Button>
          </Box>

          <Typography variant="body1" sx={{ mb:2 }}>{course.description}</Typography>

          {course.modules.map((m, idx) => (
            <Accordion key={m.id} 
            sx={{ 
              mt:2, 
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              bgcolor: '#fafafa'
              }}
              >
              <AccordionSummary 
              expandIcon={null}
              onClick={() => setSelectedModule(m)}
              sx={{ cursor: 'pointer', py:2, px: 3}}
              >
              <Typography sx={{ 
                fontSize: '1.2rem', 
                fontWeight: 500,
                "&:hover": { textDecoration: "underline" }}}>
                  Module {idx+1}: {m.title}</Typography>
              </AccordionSummary>
            </Accordion>
          ))}
          
        </Box>
      ) : (
        <Box sx={{ mt:3}}>
          <ModuleEditor 
          module={selectedModule} 
          onBack={() => setSelectedModule(null)} 
          onSave={handleSaveModule} 
          />
        </Box>
        
      )}
      </>
  );
};

export default AdminTrainingModuleSetup;