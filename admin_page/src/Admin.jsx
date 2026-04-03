import React from "react";
import { Admin, Resource, ListGuesser, Layout, useGetList } from "react-admin";
import { Card, CardContent, Typography, Grid, Toolbar, Box, IconButton, Menu, MenuItem, Drawer, Badge, LinearProgress 
} from "@mui/material";
import { PieChart, LineChart, Line, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import  simpleRestProvider  from "ra-data-simple-rest"; 

import MyLayout from "./components/MyLayout";
import TrainingModuleSetup from "./pages/training_module.jsx"
import StudentManagement from "./pages/student_management.jsx";
import BadgeManagement from "./pages/badge.jsx";
import AIDetection from "./pages/AIDetection.jsx";

import NotificationsIcon from "@mui/icons-material/Notifications";
import PeopleIcon from "@mui/icons-material/People";
import BookIcon from "@mui/icons-material/Book";


const dataProvider = simpleRestProvider("https://jsonplaceholder.typicode.com");

function Dashboard() {
  const stats = [
    { label: "Total Students", value: 8855, change: "+8.2%", icon: <PeopleIcon sx={{color:"blue"}} />, progress: 82 },
    { label: "Completed Courses", value: 1240, change: "+5.4%", icon: <BookIcon sx={{color:"purple"}} />, progress: 54 },
    { label: "Qualification", value: 124, change: "+12.5%", icon: <BookIcon sx={{color:"green"}} />, progress: 50 },
    { label: "Pending Notifications", value: 45, change: "-2.1%", icon: <NotificationsIcon sx={{color:"orange"}} />, progress: 30 },
  ];

  return (
    <Box sx={{ mt: 1, p: 3, backgroundColor: '#fafafa', minHeight: '100vh', maxWidth: "1200px"}}>
      <Grid container spacing={3} alignItems="stretch">
        {stats.map((s, i) => (
          <Grid item xs={12} md={3} key={i}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)', 
              height:"100%", 
              width:"100%" 
              }}>
              <CardContent 
              sx={{
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                height: "100%"
                }}
                >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  {s.icon}
                  <Typography variant="h6" sx={{ ml: 1, fontWeight:"600"}} noWrap>
                    {s.label}
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb:1 }}>
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

      <Box sx={{ mt: 4}}>
        < GuideProgress />
      </Box>
      
      <Box sx={{ mt: 4}}>
        < Monitoring />
      </Box>
    </Box>
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

const COLORS = ["#4caf50", "#2196f3", "#f44336", "#ff9800"];

function Monitoring() {
  const pieData = [
    { name: "Plant Interaction", value: monitoringData.plant },
    { name: "Wildlife Interaction", value: monitoringData.wildlife },
    { name: "Trail Violation", value: monitoringData.trail },
    { name: "Suspicious Object", value: monitoringData.object },
  ]

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb:3}}>
        Monitoring Overview
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.4)"}}>
            <CardContent>
              <Typography variant="h6" sx={{ mb:1 }}>
                Abnormal Activity Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb:2 }}>
                Data from this week
              </Typography>
              <PieChart width={450} height={320}>
                <Pie
                data={pieData}
                cx={190}
                cy={130}
                innerRadius={70}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.4)"}}>
            <CardContent>
              <Typography>
                Abnormal Activity Trend (Last 7Days)
              </Typography>
              <BarChart width={350} height={250} data={monitoringData.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="plant" stackId="a" fill="#4caf50" />
                <Bar dataKey="wildlife" stackId="a" fill="#2196f3" />
                <Bar dataKey="trail" stackId="a" fill="#f44336" />
                <Bar dataKey="object" stackId="a" fill="#ff9800" />
              </BarChart>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
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
    { label: "Completed Modules", value: guideData.completedModules, total: guideData.totalGuides, color: "green" },
    { label: "Certified", value: guideData.certified, total: guideData.totalGuides, color: "purple" },
    { label: "Pending Assessment", value: guideData.pendingAssessments, total: guideData.totalGuides, color: "orange" },
  ];

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        Park Guide Learning Progress
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {stats.map((s, i) => (
              <Card key={i} sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", p: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: s.color, mb: 1 }}>
                    {s.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {s.value} / {s.total}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(s.value / s.total) * 100}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", p: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Training Progress Trend (Last 4 Weeks)
              </Typography>
              <LineChart width={750} height={350} data={guideData.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#4caf50" strokeWidth={3} />
                <Line type="monotone" dataKey="certified" stroke="#9c27b0" strokeWidth={3} />
              </LineChart>
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
      <Resource name="students" list={StudentManagement} />
      <Resource name="badge" list={BadgeManagement} />
      <Resource name="detection" list={AIDetection} />
    </Admin>
  );
}

export default AdminPage;