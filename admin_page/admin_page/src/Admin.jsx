import React from "react";
import { Admin, Resource } from "react-admin";
import { Card, CardContent, Typography, Grid, Box, LinearProgress, Chip
} from "@mui/material";
import { PieChart, LineChart, Line, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer  } from "recharts";
import  simpleRestProvider  from "ra-data-simple-rest"; 

import MyLayout from "./components/MyLayout";
import TrainingModuleSetup from "./pages/training_module.jsx"
import AccountManagement from "./pages/account_management.jsx";
import BadgeManagement from "./pages/badge.jsx";
import AIDetection from "./pages/AIDetection.jsx";

import { People, CheckCircle, School } from '@mui/icons-material';
import NotificationsIcon from "@mui/icons-material/Notifications";
import PeopleIcon from "@mui/icons-material/People";
import BookIcon from "@mui/icons-material/Book";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";


const dataProvider = simpleRestProvider("https://jsonplaceholder.typicode.com");

function Dashboard() {
  const stats = [
    { label: "Total Students", value: 8855, change: "+8.2%", icon: <PeopleIcon sx={{color:"blue"}} />, progress: 82 },
    { label: "Completed Courses", value: 1240, change: "+5.4%", icon: <BookIcon sx={{color:"purple"}} />, progress: 54 },
    { label: "Badges Issued", value: 124, change: "+12.5%", icon: <WorkspacePremiumIcon sx={{color:"green"}} />, progress: 50 },
    { label: "Pending Notifications", value: 45, change: "-2.1%", icon: <NotificationsIcon sx={{color:"orange"}} />, progress: 30 },
  ];

  return (
    <Box sx={{ mt: 1, py: 3, ml: 2, mr: 1, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Grid container spacing={4} sx={{ mt:1, ml: 2, mb: 4}}>
        {stats.map((s, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={i}>
              <Card sx={{
                minWidth: 255,
                minHeight: 170,
                borderRadius: 5,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                  "&:hover": { transform: 'translateY(-5px)'},
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                }}>

                <CardContent sx={{ flexGrow: 1, p: 3.5, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    {s.icon}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {s.label}
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color:"#1976d2" }}>
                    {s.value}
                  </Typography>
                  <Typography color={s.change.startsWith("+") ? "green" : "error"}>
                    {s.change} vs last month
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress 
                    variant="determinate" 
                    value={s.progress} 
                    sx={{height: 8, borderRadius: 5}}
                    />
                  </Box>
                </CardContent>
              </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4.5}>
        <Grid item xs={12} md={7}>
          <StudentProgressOverview />
        </Grid>
        <Grid item xs={12} md={5}>
          <MonitoringPieOnly />
        </Grid>
      </Grid>
      <Box sx={{ mb:5, mt:5 }}>
        <MonitoringTrendOnly />
      </Box>

      <Box sx={{ mb:4 }}>
        <GuideProgress />
      </Box>
    </Box>
  );
}

function StudentProgressOverview() {
  const students = [
    { id: 1, name: "Alice", module: "General", progressPercent: 80, badges: ["General Training"] },
    { id: 2, name: "Bob", module: "Specific", progressPercent: 100, badges: ["Bako Park Guide"] },
    { id: 3, name: "Charlie", module: "Physical", progressPercent: 60, badges: [] },
  ];

  return (
    // 外层容器：负责显示唯一的大标题
    <Card sx={{ 
      mt: 4, 
      ml: 2, 
      p: 4,
      width: "100%",
      flexShrink: 0,
      borderRadius: 5,
      backgroundColor: "#fff",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}>
      <Typography variant="h5" sx={{ 
        textAlign: "center", 
        mb: 3, 
        background: "linear-gradient(90deg, #1976d2, #42a5f5)", 
        WebkitBackgroundClip: "text", 
        webKitTextFillColor: "transparent",
        letterSpacing: 1,
      }}>
        Student Progress Overview
      </Typography>

      {/* 内部列表：垂直排列三个学生卡片 */}
      <Grid container spacing={2}>
        {students.map((s) => (
          <Grid item xs={12} key={s.id}>
            <Card sx={{ 
              borderRadius: 5, 
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)", // 稍微调淡了阴影，看起来更高级
              p: 3,
              height: "100%",
              border: "1px solid #e0e0e0", 
            }}>
              <CardContent>
                {/* 学生姓名 */}
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {s.name}
                </Typography>
                
                {/* 模块信息 */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Module: {s.module}
                </Typography>

                {/* 进度条 */}
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={s.progressPercent}
                    sx={{ height: 10, borderRadius: 5, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { backgroundColor: '#1976d2' } }}
                  />
                  <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'right', fontWeight: 'bold' }}>
                    {s.progressPercent}% Completed
                  </Typography>
                </Box>

                {/* 徽章 */}
                <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {s.badges.length > 0 ? (
                    s.badges.map((b, i) => (
                      <Chip key={i} label={b} color="success" size="medium" variant="outlined" />
                    ))
                  ) : (
                    <Chip label="No Badge Yet" color="warning" size="medium" variant="outlined" />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Card>
  );
}

const monitoringData = {
  plant: 12,
  wildlife: 5,
  trail: 8,
  object: 2,
  trend: [
    { day: "Mon", plant: 2, wildlife: 1, trail: 0, object: 0 },
    { day: "Tue", plant: 3, wildlife: 0, trail: 2, object: 1 },
    { day: "Wed", plant: 1, wildlife: 2, trail: 1, object: 0 },
    { day: "Thu", plant: 4, wildlife: 1, trail: 3, object: 0 },
    { day: "Fri", plant: 2, wildlife: 0, trail: 1, object: 1 },
    { day: "Sat", plant: 0, wildlife: 1, trail: 1, object: 0 },
    { day: "Sun", plant: 0, wildlife: 0, trail: 0, object: 0 },
  ]
}

function MonitoringPieOnly() {
  const pieData = [
    { name: "Plant Interaction", value: monitoringData.plant },
    { name: "Wildlife Interaction", value: monitoringData.wildlife },
    { name: "Trail Violation", value: monitoringData.trail },
    { name: "Suspicious Object", value: monitoringData.object },
  ]

  const COLORS = ["#4caf50", "#2196f3", "#f44336", "#ff9800"];

  return (
    <Card sx={{ 
      borderRadius: 5, 
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column", 
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)", 
      backgroundColor: "#fff" 
      }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%"}}>
        <Typography variant="h6" sx={{ mb:1, textAlign: "center", color:"text.primary" }}>
          Abnormal Activity Distribution
        </Typography>
          <ResponsiveContainer width="100%" minWidth={400} height={350}>
            <PieChart>
              <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend size="small" layout="vertical" align="right" verticalAlign="middle"/>
            </PieChart>
          </ResponsiveContainer>
        <Typography variant="caption" color="text.secondary">Current Distribution</Typography>
      </CardContent>
    </Card>
  )
}

function MonitoringTrendOnly() {
  return (
    <Card sx={{ borderRadius: 5, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", ml:2, mr:5 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb:2}}>
          Abnormal Activity Trend (Last 7 Days)
        </Typography>
        <ResponsiveContainer width="97%" height={365} mt={2}>
          <BarChart data={monitoringData.trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{marginLeft: 30}}/>
            <Bar dataKey="plant" stackId="a" fill="#4caf50" />
            <Bar dataKey="wildlife" stackId="a" fill="#2196f3" />
            <Bar dataKey="trail" stackId="a" fill="#f44336" />
            <Bar dataKey="object" stackId="a" fill="#ff9800" />
        </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function GuideProgress() {
  const guideData = {
    totalGuides: 120,
    completedModules: 85,
    certified: 40,
    pendingAssessments: 15,
    trend: [
      { week: "Week 1", completed: 10, certified: 5 },
      { week: "Week 2", completed: 20, certified: 10 },
      { week: "Week 3", completed: 30, certified: 15 },
      { week: "Week 4", completed: 25, certified: 10 },
    ],
  };

  const stats = [
    { label: "Total Guides", value: 12, total: 20, color: "#1976d2", icon: <People /> },
    { label: "Certified", value: 8, total: 12, color: "#4caf50", icon: <CheckCircle /> },
    { label: "In Training", value: 4, total: 12, color: "#ff9800", icon: <School /> },
  ];

  return (
    <Box sx={{ mt: 4, ml:2}}>
      <Grid container spacing={4}>
        {/* --- 左侧：统计卡片 (占 2 列，固定宽度感) --- */}
        <Grid item xs={12} md={2}>

         <Typography 
            variant="h5" 
            sx={{ 
              mb: 3.5, 
              fontWeight: 800, 
              color: '#333',
              pb: 1, // 底部内边距，留出下划线空间
              borderBottom: '3px solid',
              borderColor: 'primary.main', // 使用主题色
              display: 'inline-block',
              background: 'linear-gradient(120deg, #000000 0%, #252727a7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
          Park Guide Learning Progress
          </Typography>

          <Grid container spacing={2} direction="column">
            {stats.map((s, i) => (
              <Grid item xs={12} key={i}>
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)", // 1. 阴影更柔和
                  p: 2.5, // 稍微增加一点内边距，显得不那么挤
                  height: '100%',
                  border: '1px solid #f0f0f0', // 2. 增加极淡的边框，增加层次感
                  transition: 'transform 0.2s', // 3. 加个鼠标悬停的小动画
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }
                }}>
                  <CardContent sx={{ p: 0 }}> {/* 移除 CardContent 默认 padding，用 Card 的 padding 控制 */}
                   <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      {/* 图标样式：颜色跟随数据，大小适中 */}
                      <Box sx={{ color: s.color, display: 'flex' }}>
                        {s.icon}
                      </Box>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {s.label}
                      </Typography>
                    </Box>
                    
                    <Typography variant="h5" sx={{ fontWeight: "800", color: '#2c3e50', mb: 2 }}>
                      {s.value} <Typography component="span" variant="body2" sx={{ color: '#999', fontWeight: 'normal' }}>/ {s.total}</Typography>
                    </Typography>
                    
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(s.value / s.total) * 100}
                        sx={{ 
                          height: 6, // 4. 进度条稍微细一点，更精致
                          borderRadius: 5, 
                          backgroundColor: '#f0f2f5', // 5. 进度条背景改为浅灰蓝
                          '& .MuiLinearProgress-bar': { 
                            backgroundColor: s.color, // 颜色保留
                            borderRadius: 5,
                            
                          } 
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* --- 右侧：折线图 (自动占满剩余列) --- */}
        <Grid item xs={12} md={10} sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0}}>
          <Card sx={{ 
            borderRadius: 5, 
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)", 
            p: 2, 
            flexGrow: 1,
            height: "95%",
            width: "95.5%"
            }}>

            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Training Progress Trend (Last 4 Weeks)
              </Typography>
              {/* 关键：ResponsiveContainer 撑满父容器 */}
              <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={guideData.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                    <Line type="monotone" dataKey="completed" stroke="#4caf50" strokeWidth={3} />
                    <Line type="monotone" dataKey="certified" stroke="#9c27b0" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
  
}

function AdminPage() {
  return (
    <Admin dataProvider={dataProvider} dashboard={Dashboard} layout={MyLayout}>
      <Resource name="training" list={TrainingModuleSetup} />
      <Resource name="account" list={AccountManagement} />
      <Resource name="badge" list={BadgeManagement} />
      <Resource name="detection" list={AIDetection} />
    </Admin>
  );
}

export default AdminPage;