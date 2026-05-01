import React, { useState, useEffect, useMemo, useContext } from "react";
import { Admin, Resource } from "react-admin";
import {
  Paper, Card, CardContent, Typography, Box, LinearProgress, Chip, Skeleton, Alert, Divider
} from "@mui/material";
import { PieChart, LineChart, Line, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import simpleRestProvider from "ra-data-simple-rest";
import "./Admin.css";
import MyLayout from "./components/MyLayout";
import CourseManagement from "./pages/course.jsx";
import TrainingModuleSetup from "./pages/training_module.jsx";
import StudentManagement from "./pages/student_management.jsx";
import BadgeManagement from "./pages/badge.jsx";
import AIDetection from "./pages/AIDetection.jsx";
import { ParkContext } from "./ParkContext.jsx";
import { seededIncidents, summarizeIncidents } from "./data/incidents.js";
import { People, CheckCircle, School, Notifications as NotificationsIcon, Book as BookIcon } from '@mui/icons-material';

const API_BASE = "http://localhost:4001/api";
const CHART_COLORS = ["#4caf50", "#2196f3", "#f44336", "#ff9800"];
const dataProvider = simpleRestProvider(API_BASE);

function useDashboardData() {
  const { selectedPark } = useContext(ParkContext)
  const [state, setState] = useState({ loading: true, error: null, data: {} });

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [statsRes, studentsRes, guideTrendRes] = await Promise.all([
          fetch(`${API_BASE}/dashboard/stats?parkId=${selectedPark}`, { signal: controller.signal }),
          fetch(`${API_BASE}/students?parkId=${selectedPark}`, { signal: controller.signal }),
          fetch(`${API_BASE}/dashboard/guide-progress-trend?parkId=${selectedPark}`, { signal: controller.signal }),
        ]);

        const statsJson = await statsRes.json();
        const studentsJson = await studentsRes.json();
        const guideTrendJson = await guideTrendRes.json();

        if (isMounted) {
          setState({
            loading: false,
            error: null,
            data: {
              stats: [
                { label: "Active Guides", value: statsJson.activeGuides, change: "+3.1%", icon: <People sx={{ color: "#1976d2" }} />, progress: 70 },
                { label: "Total Modules", value: statsJson.totalModules, change: "+2.4%", icon: <BookIcon sx={{ color: "#9c27b0" }} />, progress: 100 },
                { label: "Certifications Issued", value: statsJson.certificationsIssued, change: "+6.2%", icon: <CheckCircle sx={{ color: "#4caf50" }} />, progress: 60 },
                { label: "Active Incidents", value: statsJson.activeIncidents, change: "-1.8%", icon: <NotificationsIcon sx={{ color: "#ff9800" }} />, progress: 40 },
              ],
              incidentSummary: summarizeIncidents(seededIncidents.filter(d => d.park_id === selectedPark)),
              students: studentsJson,
              monitoringData: {
                plant: seededIncidents.filter(d => d.eventType === "TouchingPlants" && d.park_id === selectedPark).length,
                wildlife: seededIncidents.filter(d => d.eventType === "TouchingWildlife" && d.park_id === selectedPark).length,
                trail: seededIncidents.filter(d => d.eventType === "TrailViolation" && d.park_id === selectedPark).length,
                object: seededIncidents.filter(d => d.eventType === "ObjectCloseToPlant" && d.park_id === selectedPark).length,
                trend: seededIncidents.filter(d => d.park_id === selectedPark),
              },
              guideTrend: guideTrendJson,
            },
          });
        }
      } catch (err) {
        if (err.name !== "AbortError" && isMounted) {
          setState(prev => ({ ...prev, loading: false, error: err.message || "Failed to load dashboard data" }));
        }
      }
    };

    fetchData();
    return () => { isMounted = false; controller.abort(); };
  }, [selectedPark]);

  return state;
}

function Dashboard() {
  const { data, loading, error } = useDashboardData();

  if (error) return <Alert severity="error" sx={{ m: 4 }}>Loading failed: {error}</Alert>;
  if (loading) return (
    <Box sx={{ p: 3, maxWidth: "1600px", mx: "auto" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 3 }}>
        {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={170} />)}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      width: "100%", 
      maxWidth: "1600px",
      margin: "0 auto", 
      backgroundColor: "var(--bg-light, #f5f7fa)", 
      minHeight: "100vh", 
      p: { xs: 2, md: 4, xl: 6 } 
    }}>
      <Box
        className="admin-hero-banner"
        sx={{
          borderRadius: "24px",
          padding: "40px",
          marginBottom: "40px",
        }}
      >
        <Typography
          className="admin-hero-title"
          sx={{ margin: 0, fontSize: { xs: "2.2rem", md: "3.6rem" }, fontWeight: 800 }}
        >
          SFC Guide Center
        </Typography>

        <Typography
          className="admin-hero-subtitle"
          sx={{ marginTop: "10px", fontSize: "1.1rem" }}
        >
          Professional digital training and certification for Sarawak's parks.
        </Typography>
      </Box> 

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 3, mb: 4 }}>
        {data.stats?.map((s, i) => <StatCard key={i} s={s} />)}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "var(--primary-dark, #333)", pb: 2, borderBottom: "2px solid #e0e0e0" }}>
          Incident Monitoring Overview
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 2 }}>
          {[
            { label: "Total Incidents", value: data.incidentSummary.total },
            { label: "AI Camera", value: data.incidentSummary.ai },
            { label: "IoT Sensor", value: data.incidentSummary.iot },
            { label: "New", value: data.incidentSummary.new },
            { label: "Reviewed", value: data.incidentSummary.reviewed },
            { label: "False Alarm", value: data.incidentSummary.falseAlarm },
          ].map((item) => (
            <Paper key={item.label} sx={{ p: 2, borderRadius: 3, textAlign: "center", transition: "transform 0.2s", "&:hover": { transform: "translateY(-3px)" } }}>
              <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mb: 1 }}>{item.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#1976d2" }}>
                {String(item.value).padStart(2, "0")}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 3, mb: 4 }}>
        <StudentProgressOverview students={data.students || []} />
        <MonitoringPieOnly monitoringData={data.monitoringData} />
      </Box>

      <MonitoringTrendOnly monitoringData={data.monitoringData} />
      <GuideProgress trend={data.guideTrend || []} />
    </Box>
  );
}

const StatCard = React.memo(({ s }) => (
  <Card sx={{
    minHeight: 170, borderRadius: 5, height: "100%",
    display: "flex", flexDirection: "column", transition: "all 0.2s ease",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    "&:hover": { transform: "translateY(-5px)", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" },
  }}>
    <CardContent sx={{ flexGrow: 1, p: 2, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        {s.icon}
        <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 500 }}>{s.label}</Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: "#1976d2", my: 1 }}>{s.value}</Typography>
      <Typography color={s.change.startsWith("+") ? "success.main" : "error.main"} sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
        {s.change} vs last month
      </Typography>
      <Box sx={{ mt: 2 }}>
        <LinearProgress variant="determinate" value={s.progress} sx={{ height: 6, borderRadius: 3 }} />
      </Box>
    </CardContent>
  </Card>
));

const StudentProgressOverview = React.memo(({ students }) => (
  <Card sx={{ borderRadius: 5, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", height: "100%" }}>
    <Box sx={{ p: 3, pb: 2 }}>
      <Typography variant="h5" sx={{ textAlign: "center", fontWeight: 600 }}>Student Progress Overview</Typography>
      <Divider sx={{ mt: 2 }} />
    </Box>
    <Box
      sx={{
        px: 3, pb: 3, maxHeight: 420, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 2,
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": { width: 6 },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#bdbdbd", borderRadius: 3 },
      }}
    >
      {students.map((s) => (
        <Card key={s.user_id} sx={{ width: 280, height: 200, borderRadius: 5, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", flexShrink: 0 }}>
          <CardContent sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
            <Box>
              <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600, mb: 0.5 }}>{s.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Email: {s.email}
              </Typography>
            </Box>
            <Box sx={{ mt: "auto" }}>
              <LinearProgress variant="determinate" value={s.progressPercent || 0} sx={{ height: 8, borderRadius: 4 }} />
              <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>{s.progressPercent || 0}% Completed</Typography>
              <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5, maxHeight: 32, overflow: "hidden" }}>
                {s.badges?.length > 0 ? s.badges.slice(0, 2).map((b, i) => (
                  <Chip key={i} label={b} color="success" size="small" sx={{ height: 24 }} />
                )) : (
                  <Chip label="No Badge Yet" color="warning" size="small" sx={{ height: 24 }} />
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  </Card>
));

const MonitoringPieOnly = React.memo(({ monitoringData }) => {
  const pieData = useMemo(() => [
    { name: "Plant Interaction", value: monitoringData.plant },
    { name: "Wildlife Interaction", value: monitoringData.wildlife },
    { name: "Trail Violation", value: monitoringData.trail },
    { name: "Suspicious Object", value: monitoringData.object },
  ], [monitoringData]);

  return (
    <Card sx={{ borderRadius: 5, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Abnormal Activity Distribution</Typography>
        <Divider sx={{ mt: 2 }} />
      </Box>
      <Box sx={{ flexGrow: 1, px: 2, pb: 2, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" labelLine={false}>
              {pieData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
});

const MonitoringTrendOnly = React.memo(({ monitoringData }) => (
  <Card sx={{ borderRadius: 5, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", mb: 4 }}>
    <Box sx={{ p: 3, pb: 1 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>Abnormal Activity Trend</Typography>
      <Divider sx={{ mt: 1 }} />
    </Box>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monitoringData.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
      </ResponsiveContainer>
    </CardContent>
  </Card>
));

const GuideProgress = React.memo(({ trend }) => {
  const [guideStats, setGuideStats] = useState([]);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE}/dashboard/stats`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setGuideStats([
            { label: "Total Guides", value: data.totalGuides, total: data.totalGuides, color: "#1976d2", icon: <People /> },
            { label: "Certified", value: data.certified, total: data.totalGuides, color: "#4caf50", icon: <CheckCircle /> },
            { label: "In Training", value: data.inTraining, total: data.totalGuides, color: "#ff9800", icon: <School /> },
          ]);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: "#333", pb: 1, borderBottom: "3px solid #1976d2", width: "fit-content" }}>
        Park Guide Learning Progress
      </Typography>
      
      {/* Flex 容器：左侧固定宽度，右侧 flex:1 占满剩余空间 */}
      <Box sx={{ display: "flex", gap: 3, width: "100%" }}>
        
        {/* 左侧统计列表 */}
        <Box sx={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {guideStats.map((s, i) => (
            <Card key={i} sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}>
                  <Box sx={{ color: s.color }}>{s.icon}</Box>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: 600 }}>
                    {s.label}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#2c3e50", mb: 1 }}>
                  {s.value} <Typography component="span" variant="body2" sx={{ color: "#999" }}>/ {s.total}</Typography>
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={s.total ? Math.min((s.value / s.total) * 100, 100) : 0} 
                  sx={{ height: 6, borderRadius: 3 }} 
                />
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* 右侧趋势图：flex:1 自适应剩余宽度，minWidth:0 防止图表溢出 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={{ borderRadius: 5, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", height: "100%" }}>
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Training Progress Trend (Last 4 Weeks)</Typography>
              <Divider sx={{ mt: 1 }} />
            </Box>
            <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ flexGrow: 1, width: "100%" }}>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke="#4caf50" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="certified" stroke="#9c27b0" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
});

function AdminPage() {
  return (
    <Admin dataProvider={dataProvider} dashboard={Dashboard} layout={MyLayout}>
      <Resource name="course" list={CourseManagement} />
      <Resource name="training" list={TrainingModuleSetup} />
      <Resource name="students" list={StudentManagement} />
      <Resource name="badge" list={BadgeManagement} />
      <Resource name="detection" list={AIDetection} />
    </Admin>
  );
}

export default AdminPage;
