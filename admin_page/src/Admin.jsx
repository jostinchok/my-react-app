import React from "react";
import { Admin, Resource, ListGuesser, Layout, useGetList, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";
import { Paper, Card, CardContent, Typography, Grid, Toolbar, Box, IconButton, Menu, MenuItem, Drawer, Badge, LinearProgress, Chip
} from "@mui/material";
import { PieChart, LineChart, Line, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import  simpleRestProvider  from "ra-data-simple-rest"; 
import "./Admin.css";
import MyLayout from "./components/MyLayout";
import CourseManagement from "./pages/course.jsx"
import TrainingModuleSetup from "./pages/training_module.jsx"
import StudentManagement from "./pages/student_management.jsx";
import BadgeManagement from "./pages/badge.jsx";
import AIDetection from "./pages/AIDetection.jsx";
import ParkRangerConsole from "./pages/ParkRangerConsole.jsx";
import { seededIncidents, summarizeIncidents } from "./data/incidents.js";

import { People, CheckCircle, School } from '@mui/icons-material';
import NotificationsIcon from "@mui/icons-material/Notifications";
import PeopleIcon from "@mui/icons-material/People";
import BookIcon from "@mui/icons-material/Book";


const dataProvider = simpleRestProvider("https://jsonplaceholder.typicode.com");

function Dashboard() {
  const incidentSummary = summarizeIncidents(seededIncidents);
  const activeIncidents = incidentSummary.new + incidentSummary.acknowledged + incidentSummary.inReview;
  const stats = [
    {
      label: "Total Incidents",
      value: incidentSummary.total,
      detail: "AI/IoT monitoring records",
      icon: <NotificationsIcon />,
      progress: Math.min(100, incidentSummary.total * 16),
      tone: "citrus",
    },
    {
      label: "AI Camera Alerts",
      value: incidentSummary.ai,
      detail: "TouchingPlants / TouchingWildlife",
      icon: <BookIcon />,
      progress: Math.min(100, incidentSummary.ai * 18),
      tone: "green",
    },
    {
      label: "IoT Sensor Alerts",
      value: incidentSummary.iot,
      detail: "ObjectCloseToPlant events",
      icon: <CheckCircle />,
      progress: Math.min(100, incidentSummary.iot * 28),
      tone: "lime",
    },
    {
      label: "Training Overview",
      value: "10",
      detail: "Seeded Park Guide modules",
      icon: <School />,
      progress: 100,
      tone: "sun",
    },
    {
      label: "Pending Actions",
      value: activeIncidents,
      detail: "New or under review",
      icon: <PeopleIcon />,
      progress: Math.min(100, activeIncidents * 22),
      tone: "amber",
    },
    {
      label: "System Health",
      value: "OK",
      detail: "Memory/MySQL-ready backend",
      icon: <CheckCircle />,
      progress: 92,
      tone: "healthy",
    },
  ];

  return (
    <Box className="admin-dashboard-shell">
      <Box
        className="admin-hero-banner admin-dashboard-hero"
        sx={{
          borderRadius: "20px",
          padding: { xs: "28px", md: "42px" },
          marginBottom: "28px",
        }}
      >
        <Typography className="admin-dashboard-kicker">Admin command center</Typography>
        <Typography
          className="admin-hero-title"
          sx={{ margin: 0, fontSize: { xs: "2.2rem", md: "3.6rem" }, fontWeight: 800 }}
        >
          SFC Operations Dashboard
        </Typography>

        <Typography
          className="admin-hero-subtitle"
          sx={{ marginTop: "10px", fontSize: "1.1rem", maxWidth: 760 }}
        >
          Training oversight, monitoring health, AI camera evidence, IoT sensor alerts, and ranger response readiness in one citrus command-center view.
        </Typography>
        <Box className="admin-hero-chip-row">
          <span>Memory / MySQL incidents</span>
          <span>AI_CAMERA + IOT_SENSOR</span>
          <span>Park Guide training seeded</span>
        </Box>
      </Box>

      <Box className="admin-dashboard-card-grid">
        {stats.map((item) => (
          <Card className={`admin-dashboard-card tone-${item.tone}`} key={item.label}>
            <CardContent>
              <Box className="admin-dashboard-card-top">
                <span>{item.icon}</span>
                <Typography>{item.label}</Typography>
              </Box>
              <Typography component="strong">{String(item.value).padStart(2, "0")}</Typography>
              <Typography component="p">{item.detail}</Typography>
              <LinearProgress className="admin-linear-progress" variant="determinate" value={item.progress} />
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box className="admin-dashboard-section">
        <Typography component="h2">Incident Monitoring Overview</Typography>
        <Box className="incident-stat-grid">
          {[
            { label: "Total", value: incidentSummary.total, detail: "All seeded/live records" },
            { label: "AI Camera", value: incidentSummary.ai, detail: "Image evidence alerts" },
            { label: "IoT Sensor", value: incidentSummary.iot, detail: "Distance threshold alerts" },
            { label: "New", value: incidentSummary.new, detail: "Needs review" },
            { label: "In Review", value: incidentSummary.inReview, detail: "Active investigation" },
            { label: "Resolved", value: incidentSummary.resolved, detail: "Closed response" },
            { label: "False Alarm", value: incidentSummary.falseAlarm, detail: "Audit trail" },
          ].map((item) => (
            <Paper className="incident-stat-card" key={item.label}>
              <span className="incident-label">{item.label}</span>
              <strong className="incident-value">{String(item.value).padStart(2, "0")}</strong>
              <p className="incident-detail">{item.detail}</p>
            </Paper>
          ))}
        </Box>
      </Box>

      <Box className="admin-chart-grid">
        <Box sx={{ flex: 1 }}>
          <StudentProgressOverview />
        </Box>
        <Box sx={{ flex: 1 }}>
          <MonitoringPieOnly />
        </Box>
      </Box>

      <Box className="admin-dashboard-section">
        <MonitoringTrendOnly />
      </Box>

      <Box className="admin-dashboard-section">
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
        background: "linear-gradient(90deg, #0b3b28, #ff7a1a)",
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
              p: 2,
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
                    sx={{ height: 10, borderRadius: 5, backgroundColor: '#edf3e8', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #8ac926, #ff7a1a)' } }}
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

  const COLORS = ["#1f6f44", "#ff7a1a", "#b6d94c", "#f3b23a"];

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
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" sx={{ mb:1, textAlign: "center", color:"text.primary" }}>
          Abnormal Activity Distribution
        </Typography>

        <Box sx={{ flexGrow: 1, width: "100%", minHeight: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
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
            </PieChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 2, mt: 2 }}>
          {pieData.map((entry, index) => (
            <Box key={entry.name} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: COLORS[index] }} />
              <Typography variant="body2">{entry.name}</Typography>
            </Box>
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", mt: 1 }}>
          Current Distribution
        </Typography>
      </CardContent>
    </Card>
  )
}

function MonitoringTrendOnly() {
  return (
    <Card sx={{ borderRadius: 5, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", ml:2, }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb:2}}>
          Abnormal Activity Trend (Last 7 Days)
        </Typography>
        <ResponsiveContainer width="100%" height={365} mt={2}>
          <BarChart data={monitoringData.trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{marginLeft: 30}}/>
            <Bar dataKey="plant" stackId="a" fill="#1f6f44" />
            <Bar dataKey="wildlife" stackId="a" fill="#ff7a1a" />
            <Bar dataKey="trail" stackId="a" fill="#d7553f" />
            <Bar dataKey="object" stackId="a" fill="#f3b23a" />
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
    { label: "Total Guides", value: 12, total: 20, color: "#1f6f44", icon: <People /> },
    { label: "Certified", value: 8, total: 12, color: "#8ac926", icon: <CheckCircle /> },
    { label: "In Training", value: 4, total: 12, color: "#ff7a1a", icon: <School /> },
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
              color: '#1e2a22',
              pb: 1, // 底部内边距，留出下划线空间
              borderBottom: '3px solid',
              borderColor: '#ff7a1a',
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
                  border: '1px solid #dce7d7',
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
                    
                    <Typography variant="h5" sx={{ fontWeight: "800", color: '#1e2a22', mb: 2 }}>
                      {s.value} <Typography component="span" variant="body2" sx={{ color: '#607166', fontWeight: 'normal' }}>/ {s.total}</Typography>
                    </Typography>
                    
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(s.value / s.total) * 100}
                        sx={{ 
                          height: 6, // 4. 进度条稍微细一点，更精致
                          borderRadius: 5, 
                          backgroundColor: '#edf3e8',
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
            width: "100%"
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
                    <Line type="monotone" dataKey="completed" stroke="#1f6f44" strokeWidth={3} />
                    <Line type="monotone" dataKey="certified" stroke="#ff7a1a" strokeWidth={3} />
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
      <Resource name="course" list={CourseManagement} />
      <Resource name="training" list={TrainingModuleSetup} />
      <Resource name="students" list={StudentManagement} />
      <Resource name="badge" list={BadgeManagement} />
      <Resource name="detection" list={AIDetection} />
      <CustomRoutes>
        <Route path="/ranger" element={<ParkRangerConsole />} />
      </CustomRoutes>
    </Admin>
  );
}

export default AdminPage;
