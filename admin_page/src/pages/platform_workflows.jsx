import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CrisisAlertOutlinedIcon from "@mui/icons-material/CrisisAlertOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import LocalLibraryOutlinedIcon from "@mui/icons-material/LocalLibraryOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import ReviewsOutlinedIcon from "@mui/icons-material/ReviewsOutlined";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import { Link as RouterLink } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { seededIncidents, summarizeIncidents } from "../data/incidents";

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:4002";
const MONITORING_API_BASE_URL = import.meta.env.VITE_MONITORING_API_BASE_URL || "http://localhost:4000";

const requestJson = async (url, options = {}) => {
  const response = await authFetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
};

const panelSx = {
  borderRadius: 5,
  border: "1px solid rgba(225, 169, 69, 0.28)",
  background: "rgba(255, 255, 255, 0.86)",
  boxShadow: "0 20px 48px rgba(255, 122, 26, 0.10)",
};

const darkPanelSx = {
  borderRadius: 5,
  border: "1px solid rgba(225, 169, 69, 0.28)",
  background: "rgba(255, 255, 255, 0.92)",
  boxShadow: "0 18px 44px rgba(23, 49, 38, 0.10)",
};

const headingSx = {
  color: "#173126",
  fontWeight: 950,
  letterSpacing: "-0.04em",
};

const kickerSx = {
  color: "#ff7a1a",
  fontSize: "0.74rem",
  fontWeight: 950,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

const mutedSx = {
  color: "#667565",
  fontWeight: 750,
};

const tableHeaderSx = {
  color: "#738272",
  fontSize: "0.72rem",
  fontWeight: 950,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

const navTargets = [
  { label: "Manage Courses", path: "/admin/course", icon: <SchoolOutlinedIcon />, detail: "Create courses, modules, and items" },
  { label: "Training Modules", path: "/admin/training", icon: <ViewModuleOutlinedIcon />, detail: "Review Canvas-style course structure" },
  { label: "Course Requests", path: "/admin/course-requests", icon: <AssignmentTurnedInOutlinedIcon />, detail: "Approve or reject guide enrollment" },
  { label: "Guide Progress", path: "/admin/students", icon: <RouteOutlinedIcon />, detail: "Completion, quiz attempts, and assignments" },
  { label: "Certificates", path: "/admin/certificates", icon: <WorkspacePremiumOutlinedIcon />, detail: "Issue course-level certificates" },
  { label: "Incident Detection", path: "/admin/detection", icon: <CrisisAlertOutlinedIcon />, detail: "Official AI/IoT incident queue" },
  { label: "Ranger Review", path: "/admin/ranger-review", icon: <ReviewsOutlinedIcon />, detail: "Recommendation-only field workflow" },
  { label: "Backend Map", path: "/admin/backend-map", icon: <AccountTreeOutlinedIcon />, detail: "Tables, APIs, and integration order" },
  { label: "Audit Log", path: "/admin/audit-log", icon: <FactCheckOutlinedIcon />, detail: "Security traceability events" },
];

const initialAccounts = [
  {
    id: "USR-1001",
    name: "Aiden Tan",
    email: "aiden.tan@example.com",
    role: "Park Guide",
    location: "Bako National Park",
    account: "Approved",
    document: "Approved",
    phone: "+60 16-901 1111",
    emergency: "+60 13-223 1111",
  },
  {
    id: "USR-1002",
    name: "Alicia Wong",
    email: "alicia.wong@example.com",
    role: "Applicant",
    location: "Bako National Park",
    account: "Pending",
    document: "Pending",
    phone: "+60 16-901 2234",
    emergency: "+60 13-223 9981",
  },
  {
    id: "USR-1003",
    name: "Maya Ling",
    email: "maya.ling@example.com",
    role: "Park Ranger",
    location: "Niah National Park",
    account: "Approved",
    document: "Approved",
    phone: "+60 12-661 8821",
    emergency: "+60 19-777 6611",
  },
  {
    id: "USR-1004",
    name: "Siti Rahman",
    email: "siti.rahman@example.com",
    role: "Admin",
    location: "Semenggoh Nature Reserve",
    account: "Approved",
    document: "Approved",
    phone: "+60 18-880 1102",
    emergency: "+60 17-555 8800",
  },
];

const initialIncidents = [
  {
    id: "INC-AI-2048",
    source: "AI Camera",
    severity: "High",
    zone: "Trail A",
    status: "New",
    assigned: "Maya Ling",
    title: "Plucking / touching protected plants",
    location: "Bako National Park",
    evidence: "Frame 12:33, hand near protected plant",
    hash: "sha256:ai91e-plant-2048",
    rangerRecommendation: "Recommend In Review",
    adminDecision: "Not decided",
    note: "Ranger Maya Ling requests Admin review before any official status change.",
  },
  {
    id: "INC-IOT-1182",
    source: "IoT Sensor Cluster",
    severity: "Medium",
    zone: "Plant Zone A",
    status: "Clustered",
    assigned: "Maya Ling",
    title: "Repeated proximity trigger",
    location: "Bako National Park",
    evidence: "37 triggers in 20 minutes, latest snapshot saved",
    hash: "sha256:iot-1182-cluster",
    rangerRecommendation: "Recommend Acknowledged",
    adminDecision: "Not decided",
    note: "Likely repeated visitor movement near the same protected flora zone.",
  },
  {
    id: "INC-AI-2037",
    source: "AI Camera",
    severity: "High",
    zone: "River Walk",
    status: "Under Review",
    assigned: "Daniel Chai",
    title: "Disturbing / handling wildlife",
    location: "Bako National Park",
    evidence: "Frame 08:12, hand near protected wildlife",
    hash: "sha256:ai37e-wildlife-2037",
    rangerRecommendation: "Escalate",
    adminDecision: "Not decided",
    note: "Ranger requested admin decision.",
  },
  {
    id: "INC-IOT-1179",
    source: "IoT Sensor Cluster",
    severity: "Low",
    zone: "Garden Entry",
    status: "Grouped",
    assigned: "Maya Ling",
    title: "Object approaching protected flora",
    location: "Bako National Park",
    evidence: "8 grouped triggers, no high-risk AI frame yet",
    hash: "sha256:iot-1179-grouped",
    rangerRecommendation: "Monitor",
    adminDecision: "Not decided",
    note: "",
  },
];

const initialRules = [
  {
    id: "RULE-001",
    name: "Plant Zone proximity grouping",
    source: "IoT Sensor",
    location: "Plant Zone A",
    threshold: "5 triggers",
    window: "20 minutes",
    cooldown: "15 minutes",
    action: "Group into one incident",
    status: "Active",
  },
  {
    id: "RULE-002",
    name: "High-risk AI plant plucking",
    source: "AI Camera",
    location: "All trails",
    threshold: "Confidence ≥ 80%",
    window: "Immediate",
    cooldown: "None",
    action: "Create high priority incident",
    status: "Active",
  },
  {
    id: "RULE-003",
    name: "Wildlife contact escalation",
    source: "AI Camera",
    location: "Wildlife zones",
    threshold: "Confidence ≥ 75%",
    window: "Immediate",
    cooldown: "None",
    action: "Assign ranger review",
    status: "Active",
  },
  {
    id: "RULE-004",
    name: "Noise reduction for repeated sensors",
    source: "IoT Sensor",
    location: "Garden Entry",
    threshold: "10 triggers",
    window: "30 minutes",
    cooldown: "30 minutes",
    action: "Suppress duplicate incidents",
    status: "Draft",
  },
];

const initialAnnouncements = [
  {
    id: "ANN-1001",
    title: "Bako trail briefing updated",
    audience: "Park Guides",
    location: "Bako National Park",
    priority: "High",
    channel: "In-app + Email",
    status: "Sent",
    pinned: true,
    message: "All guides assigned to Trail A must review the updated visitor briefing and protected flora handling notes before the next shift.",
  },
  {
    id: "ANN-1002",
    title: "Sensor maintenance window",
    audience: "Park Rangers",
    location: "Bako National Park",
    priority: "Medium",
    channel: "In-app",
    status: "Scheduled",
    pinned: false,
    message: "Plant Zone A sensors will undergo maintenance. Rangers should expect lower sensor availability during the maintenance period.",
  },
  {
    id: "ANN-1003",
    title: "Certificate release policy",
    audience: "All Users",
    location: "All locations",
    priority: "Low",
    channel: "In-app",
    status: "Sent",
    pinned: false,
    message: "Certificates are generated after full course completion, then released after admin evidence review.",
  },
];

const initialTickets = [
  {
    id: "TIC-1001",
    subject: "Question about latest announcement",
    requester: "Current User",
    role: "Park Guide",
    location: "Bako National Park",
    category: "Announcement Clarification",
    priority: "High",
    status: "Open",
    details: "I need clarification before my next shift.",
  },
  {
    id: "TIC-1002",
    subject: "Cannot open required PDF checklist",
    requester: "Aiden Tan",
    role: "Park Guide",
    location: "Bako National Park",
    category: "Course Access",
    priority: "High",
    status: "Open",
    details: "The park-safety-checklist.pdf link does not open on my device.",
  },
  {
    id: "TIC-1003",
    subject: "Need clarification on grouped sensor alert",
    requester: "Maya Ling",
    role: "Park Ranger",
    location: "Bako National Park",
    category: "Incident Evidence",
    priority: "High",
    status: "In Progress",
    details: "Need admin confirmation whether the grouped sensor alert should remain as one incident.",
  },
];

const auditEvents = [
  { id: "AUD-901", actor: "Admin", area: "Course Management", action: "Published SFC Field Response Essentials", risk: "Low" },
  { id: "AUD-902", actor: "Admin", area: "User Management", action: "Approved account profile for Aiden Tan", risk: "Low" },
  { id: "AUD-903", actor: "System", area: "Incident Operations", action: "Grouped 37 raw IoT triggers into 1 incident", risk: "Low" },
  { id: "AUD-904", actor: "Park Ranger", area: "Incident Operations", action: "Recommended escalation for INC-AI-2037", risk: "Medium" },
  { id: "AUD-905", actor: "Admin", area: "Certificate Review", action: "Released certificate after evidence review", risk: "Low" },
  { id: "AUD-906", actor: "System", area: "Messaging", action: "Blocked broadcast announcement reply thread", risk: "Low" },
  { id: "AUD-907", actor: "Current User", area: "Help Desk", action: "Created help request linked to announcement", risk: "Medium" },
];

function statusColor(status) {
  const text = String(status || "").toLowerCase();
  if (text.includes("high") || text.includes("reject") || text.includes("escalate")) return "error";
  if (text.includes("medium") || text.includes("pending") || text.includes("draft") || text.includes("review")) return "warning";
  if (text.includes("approved") || text.includes("released") || text.includes("sent") || text.includes("active") || text.includes("resolved")) return "success";
  return "info";
}

function PageShell({ title, subtitle, children, action }) {
  return (
    <Box className="admin-dashboard-shell admin-workflow-page">
      <Stack className="admin-page-header" direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography sx={kickerSx}>SFC platform workflow</Typography>
          <Typography variant="h3" sx={headingSx}>{title}</Typography>
          <Typography sx={{ ...mutedSx, maxWidth: 920 }}>{subtitle}</Typography>
        </Box>
        {action}
      </Stack>
      {children}
    </Box>
  );
}

function StatCard({ label, value, detail, icon }) {
  return (
    <Card className="admin-stat-card" sx={panelSx}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography sx={{ ...mutedSx, fontSize: "0.82rem" }}>{label}</Typography>
            <Typography variant="h4" sx={headingSx}>{value}</Typography>
            <Typography sx={{ ...mutedSx, fontSize: "0.78rem" }}>{detail}</Typography>
          </Box>
          <Box className="admin-stat-icon">{icon}</Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function StatsGrid({ items }) {
  return (
    <Box className="admin-stat-fit-grid">
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </Box>
  );
}

function DataPanel({ title, subtitle, children, action }) {
  return (
    <Paper sx={{ ...darkPanelSx, overflow: "hidden" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2} sx={{ p: 3, pb: 2 }}>
        <Box>
          <Typography variant="h5" sx={headingSx}>{title}</Typography>
          {subtitle ? <Typography sx={{ ...mutedSx, fontSize: "0.86rem" }}>{subtitle}</Typography> : null}
        </Box>
        {action}
      </Stack>
      <Divider />
      <Box sx={{ p: 3 }}>{children}</Box>
    </Paper>
  );
}


function FieldLabel({ children }) {
  return (
    <Typography sx={{ color: "#173126", fontWeight: 950, fontSize: "0.82rem", mb: 0.7 }}>
      {children}
    </Typography>
  );
}

const formControlSx = {
  width: "100%",
  minHeight: 44,
  borderRadius: 3,
  border: "1px solid rgba(23, 49, 38, 0.18)",
  background: "#fffdf5",
  color: "#173126",
  fontWeight: 800,
  padding: "11px 13px",
  outline: "none",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
};

function FormInput({ label, value, onChange, placeholder = "" }) {
  return (
    <Box sx={{ mb: 2 }}>
      <FieldLabel>{label}</FieldLabel>
      <Box
        component="input"
        value={value || ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        sx={formControlSx}
      />
    </Box>
  );
}

function FormTextArea({ label, value, onChange, placeholder = "", minRows = 4 }) {
  return (
    <Box sx={{ mb: 2 }}>
      <FieldLabel>{label}</FieldLabel>
      <Box
        component="textarea"
        value={value || ""}
        placeholder={placeholder}
        rows={minRows}
        onChange={(event) => onChange(event.target.value)}
        sx={{ ...formControlSx, resize: "vertical", lineHeight: 1.5 }}
      />
    </Box>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <Box sx={{ mb: 2 }}>
      <FieldLabel>{label}</FieldLabel>
      <Box
        component="select"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        sx={{ ...formControlSx, cursor: "pointer" }}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </Box>
    </Box>
  );
}

function RowGrid({ columns, children, selected }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: 1.5,
        alignItems: "center",
        px: 2,
        py: 1.6,
        borderRadius: 3,
        background: selected ? "#f0ffe5" : "transparent",
        border: selected ? "1px solid #a7e957" : "1px solid transparent",
        "&:not(:last-of-type)": { borderBottom: "1px solid rgba(225, 169, 69, 0.20)" },
      }}
    >
      {children}
    </Box>
  );
}

function MiniNavCard({ item }) {
  return (
    <Paper
      component={RouterLink}
      to={item.path}
      className="admin-mini-nav-card"
      sx={{
        ...panelSx,
        display: "block",
        p: 2.2,
        textDecoration: "none",
        color: "inherit",
        transition: "transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "#ff9f1c",
          background: "linear-gradient(135deg, #fff8e6 0%, #f0ffe5 100%)",
          boxShadow: "0 18px 38px rgba(255, 122, 26, 0.16)",
        },
      }}
    >
      <Box className="admin-mini-nav-icon">{item.icon}</Box>
      <Typography sx={{ color: "#173126", fontWeight: 950 }}>{item.label}</Typography>
      <Typography sx={{ ...mutedSx, fontSize: "0.82rem" }}>{item.detail}</Typography>
    </Paper>
  );
}

export function AdminPrototypeDashboard() {
  const incidentSummary = summarizeIncidents(seededIncidents);
  const fallbackMetrics = {
    trainingCourses: 3,
    activeGuides: 3,
    openIncidents: incidentSummary.new + incidentSummary.acknowledged + incidentSummary.inReview + incidentSummary.reviewed,
    pendingCourseRequests: 2,
    certificatesIssued: 1,
    certificatesPending: 2,
    systemHealth: "Demo Ready",
  };
  const [metrics, setMetrics] = useState(fallbackMetrics);
  const [dataNote, setDataNote] = useState("Demo fallback data is ready if local APIs are offline.");

  useEffect(() => {
    let ignore = false;

    const loadDashboardMetrics = async () => {
      const endpoints = await Promise.allSettled([
        requestJson(`${API_BASE_URL}/api/courses`),
        requestJson(`${API_BASE_URL}/api/enrollments/requests`),
        requestJson(`${API_BASE_URL}/api/students`),
        requestJson(`${API_BASE_URL}/api/admin/canvas-progress-summary`),
        requestJson(`${MONITORING_API_BASE_URL}/api/incidents`),
        requestJson(`${MONITORING_API_BASE_URL}/api/health`),
      ]);

      if (ignore) return;

      const [courseResult, requestResult, studentResult, progressResult, incidentResult, healthResult] = endpoints;
      const courses = courseResult.status === "fulfilled" ? courseResult.value.courses || [] : null;
      const requests = requestResult.status === "fulfilled" ? requestResult.value.requests || [] : null;
      const students = studentResult.status === "fulfilled" ? studentResult.value.students || [] : null;
      const progressGuides = progressResult.status === "fulfilled" && Array.isArray(progressResult.value.guides)
        ? progressResult.value.guides
        : null;
      const incidents = incidentResult.status === "fulfilled" ? incidentResult.value.incidents || [] : null;
      const health = healthResult.status === "fulfilled" ? healthResult.value : null;

      const issuedCertificates = progressGuides
        ? progressGuides.filter((guide) => Number(guide.completionPercent ?? guide.completion_percent ?? 0) >= 100).length
        : fallbackMetrics.certificatesIssued;
      const guideCount = students ? students.length : fallbackMetrics.activeGuides;

      setMetrics({
        trainingCourses: courses ? courses.length : fallbackMetrics.trainingCourses,
        activeGuides: students ? students.filter((student) => student.eligibility !== "Rejected").length : fallbackMetrics.activeGuides,
        openIncidents: incidents
          ? incidents.filter((incident) => !["Resolved", "False Alarm"].includes(incident.status)).length
          : fallbackMetrics.openIncidents,
        pendingCourseRequests: requests
          ? requests.filter((request) => String(request.status || "pending").toLowerCase() === "pending").length
          : fallbackMetrics.pendingCourseRequests,
        certificatesIssued: issuedCertificates,
        certificatesPending: Math.max(0, guideCount - issuedCertificates),
        systemHealth: health?.status === "ok" ? "Healthy" : fallbackMetrics.systemHealth,
      });

      const failedCount = endpoints.filter((result) => result.status === "rejected").length;
      setDataNote(
        failedCount
          ? "Demo fallback filled any metrics whose local API was unavailable."
          : "Live local APIs are connected for this dashboard."
      );
    };

    loadDashboardMetrics().catch(() => {
      if (!ignore) {
        setMetrics(fallbackMetrics);
        setDataNote("Demo fallback data is displayed because local APIs are unavailable.");
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const stats = [
    { label: "Training Courses", value: metrics.trainingCourses, detail: "Canvas-style course records", icon: <LocalLibraryOutlinedIcon /> },
    { label: "Active Park Guides", value: metrics.activeGuides, detail: "Approved guide accounts", icon: <GroupsOutlinedIcon /> },
    { label: "Open Incidents", value: metrics.openIncidents, detail: "Awaiting official Admin status", icon: <CrisisAlertOutlinedIcon /> },
    { label: "Pending Course Requests", value: metrics.pendingCourseRequests, detail: "Needs enrollment decision", icon: <PendingActionsOutlinedIcon /> },
    { label: "Certificates", value: `${metrics.certificatesIssued}/${metrics.certificatesPending}`, detail: "Issued / pending review", icon: <VerifiedOutlinedIcon /> },
    { label: "System Health", value: metrics.systemHealth, detail: "Backend, training API, and fallback state", icon: <HealthAndSafetyOutlinedIcon /> },
  ];

  return (
    <PageShell
      title="Admin Command Center"
      subtitle="Final presentation view for training operations, guide readiness, course approvals, AI/IoT incidents, Ranger recommendations, certificates, and system traceability."
      action={
        <Button
          component={RouterLink}
          to="/admin/detection"
          variant="contained"
          startIcon={<CrisisAlertOutlinedIcon />}
          className="admin-header-primary-action"
        >
          Open incident detection
        </Button>
      }
    >
      <StatsGrid items={stats} />

      <Paper sx={{ ...panelSx, p: 2.2, mb: 3, background: "#fffdf5" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5}>
          <Box>
            <Typography sx={{ color: "#173126", fontWeight: 950 }}>Local demo data status</Typography>
            <Typography sx={mutedSx}>{dataNote}</Typography>
          </Box>
          <Chip label={dataNote.includes("Live") ? "Live API" : "Demo fallback"} color={dataNote.includes("Live") ? "success" : "warning"} />
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <DataPanel title="Presentation flow" subtitle="Start here during the final demo.">
            {[
              "Show the command center metrics and local API/fallback status.",
              "Open Courses and Training Modules to show the Canvas-style structure.",
              "Review Course Requests, Guide Progress, and Certificates.",
              "Open Incident Detection and show Admin official status actions.",
              "Open Ranger Review to show recommendation-only field input.",
            ].map((item, index) => (
              <Paper key={item} sx={{ p: 2, mb: 1.4, borderRadius: 3, background: index === 0 ? "#f0ffe5" : "#fffdf5" }}>
                <Stack direction="row" gap={2} alignItems="center">
                  <Chip label={index + 1} color="warning" />
                  <Typography sx={{ color: "#173126", fontWeight: 900 }}>{item}</Typography>
                </Stack>
              </Paper>
            ))}
          </DataPanel>
        </Grid>

        <Grid item xs={12} lg={8}>
          <DataPanel title="Quick actions" subtitle="One-click Admin routes for the screenshot-ready final demo.">
            <Box className="admin-action-fit-grid">
              {navTargets.map((item) => (
                <MiniNavCard key={item.path} item={item} />
              ))}
            </Box>
          </DataPanel>
        </Grid>
      </Grid>
    </PageShell>
  );
}

export function AdminAnalyticsDashboard() {
  const locations = [
    { name: "Bako National Park", users: 2, incidents: 4, training: 0, risk: "Medium" },
    { name: "Niah National Park", users: 1, incidents: 0, training: 45, risk: "Low" },
    { name: "Semenggoh Nature Reserve", users: 1, incidents: 0, training: 68, risk: "Low" },
    { name: "Gunung Mulu National Park", users: 0, incidents: 0, training: 32, risk: "Medium" },
  ];

  return (
    <PageShell
      title="Admin Analytics Dashboard"
      subtitle="Management-level view for training progress, approval backlog, incident pressure, support load, and location readiness."
      action={<Button component={RouterLink} to="/admin/backend-map" variant="outlined">Open backend map</Button>}
    >
      <StatsGrid
        items={[
          { label: "Training Completion", value: "0%", detail: "0/6 lessons", icon: "🎓" },
          { label: "Approval Backlog", value: "3", detail: "1 account, 2 course", icon: "🧾" },
          { label: "Incident Pressure", value: "4", detail: "2 high priority", icon: "🚨" },
          { label: "Support Load", value: "4", detail: "2 tickets, 2 unread", icon: "🛟" },
        ]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <DataPanel title="Training funnel" subtitle="Shows where users may be blocked in the lifecycle.">
            {[
              ["Registered accounts", 4, 100],
              ["Approved accounts", 3, 75],
              ["Approved enrollments", 1, 25],
              ["Completed lessons", 0, 8],
              ["Certificate released", 0, 8],
            ].map(([label, value, progress]) => (
              <Box key={label} sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ color: "#173126", fontWeight: 900 }}>{label}</Typography>
                  <Typography sx={{ color: "#173126", fontWeight: 950 }}>{value}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 999, mt: 0.8 }} />
              </Box>
            ))}
          </DataPanel>
        </Grid>

        <Grid item xs={12} lg={6}>
          <DataPanel title="Operational risk snapshot" subtitle="Quick view of training, incident, and support pressure.">
            <Grid container spacing={2}>
              {[
                ["Lessons completed", 0],
                ["Evidence records", 0],
                ["Enrollment approved", 1],
                ["Enrollment pending", 2],
                ["Open incidents", 4],
                ["High priority", 2],
                ["Grouped sensor alerts", 2],
                ["Resolved incidents", 0],
              ].map(([label, value]) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Paper sx={{ p: 2, borderRadius: 3, background: "#fffdf5" }}>
                    <Typography sx={mutedSx}>{label}</Typography>
                    <Typography variant="h5" sx={headingSx}>{value}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DataPanel>
        </Grid>

        <Grid item xs={12} lg={7}>
          <DataPanel title="Location readiness">
            {locations.map((row) => (
              <RowGrid key={row.name} columns="2fr 0.7fr 0.8fr 1fr 0.9fr">
                <Typography sx={{ color: "#173126", fontWeight: 950 }}>{row.name}</Typography>
                <Typography>{row.users}</Typography>
                <Typography>{row.incidents}</Typography>
                <LinearProgress variant="determinate" value={row.training} sx={{ height: 8, borderRadius: 999 }} />
                <Chip label={row.risk} color={statusColor(row.risk)} size="small" />
              </RowGrid>
            ))}
          </DataPanel>
        </Grid>

        <Grid item xs={12} lg={5}>
          <DataPanel title="What Admin should watch">
            {["Approval bottleneck", "Incident overload", "Certificate gate", "Support load"].map((item) => (
              <Paper key={item} sx={{ p: 2, mb: 1.4, borderRadius: 3, background: "#fffdf5" }}>
                <Typography sx={{ color: "#173126", fontWeight: 950 }}>{item}</Typography>
                <Typography sx={{ ...mutedSx, fontSize: "0.82rem" }}>This keeps the dashboard useful instead of becoming decoration.</Typography>
              </Paper>
            ))}
          </DataPanel>
        </Grid>
      </Grid>
    </PageShell>
  );
}

export function UserManagementWorkflow() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [selectedId, setSelectedId] = useState("USR-1002");
  const selected = accounts.find((account) => account.id === selectedId) || accounts[0];

  const updateSelected = (patch) => {
    setAccounts((items) => items.map((item) => (item.id === selected.id ? { ...item, ...patch } : item)));
  };

  return (
    <PageShell
      title="User Management"
      subtitle="Admin reviews account registration, assigns role, selects park location, and controls whether the user can request courses."
      action={<Button component={RouterLink} to="/admin/permissions" variant="outlined">View permissions</Button>}
    >
      <StatsGrid
        items={[
          { label: "Total Users", value: accounts.length, detail: "Demo records", icon: "👥" },
          { label: "Pending Accounts", value: accounts.filter((item) => item.account === "Pending").length, detail: "Need approval", icon: "⏳" },
          { label: "Approved Accounts", value: accounts.filter((item) => item.account === "Approved").length, detail: "Can access areas", icon: "✅" },
          { label: "Document Review", value: accounts.filter((item) => item.document === "Pending").length, detail: "Identity or permit check", icon: "📄" },
        ]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <DataPanel title="Account queue">
            <RowGrid columns="1.6fr 1fr 1.2fr 0.9fr 0.9fr 0.7fr">
              {["User", "Role", "Location", "Account", "Document", "Action"].map((label) => <Typography key={label} sx={tableHeaderSx}>{label}</Typography>)}
            </RowGrid>
            {accounts.map((account) => (
              <RowGrid key={account.id} columns="1.6fr 1fr 1.2fr 0.9fr 0.9fr 0.7fr" selected={account.id === selectedId}>
                <Box>
                  <Typography sx={{ color: "#173126", fontWeight: 950 }}>{account.name}</Typography>
                  <Typography sx={{ ...mutedSx, fontSize: "0.78rem" }}>{account.email}</Typography>
                </Box>
                <Typography sx={{ fontWeight: 800 }}>{account.role}</Typography>
                <Typography>{account.location}</Typography>
                <Chip label={account.account} color={statusColor(account.account)} size="small" />
                <Chip label={account.document} color={statusColor(account.document)} size="small" />
                <Button onClick={() => setSelectedId(account.id)}>Open</Button>
              </RowGrid>
            ))}
          </DataPanel>
        </Grid>

        <Grid item xs={12} lg={5}>
          <DataPanel title="Selected profile" subtitle="This simulates the admin account approval page.">
            <Typography sx={kickerSx}>Identity</Typography>
            <Typography variant="h4" sx={headingSx}>{selected.name}</Typography>
            <Typography sx={mutedSx}>{selected.email}</Typography>

            <Grid container spacing={2} sx={{ my: 2 }}>
              <Grid item xs={6}><Paper sx={{ p: 2, borderRadius: 3 }}>Phone<br /><strong>{selected.phone}</strong></Paper></Grid>
              <Grid item xs={6}><Paper sx={{ p: 2, borderRadius: 3 }}>Emergency<br /><strong>{selected.emergency}</strong></Paper></Grid>
            </Grid>

            <FormSelect
              label="Assigned role"
              value={selected.role}
              onChange={(value) => updateSelected({ role: value })}
              options={["Applicant", "Park Guide", "Park Ranger", "Admin"]}
            />

            <FormSelect
              label="Assigned location"
              value={selected.location}
              onChange={(value) => updateSelected({ location: value })}
              options={["Bako National Park", "Niah National Park", "Gunung Mulu National Park", "Semenggoh Nature Reserve"]}
            />

            <Stack direction="row" gap={1.2} flexWrap="wrap">
              <Button variant="contained" color="success" onClick={() => updateSelected({ account: "Approved", document: "Approved" })}>Approve Account</Button>
              <Button variant="outlined" color="error" onClick={() => updateSelected({ account: "Rejected" })}>Reject</Button>
              <Button variant="outlined" color="warning" onClick={() => updateSelected({ account: "Pending", document: "Pending" })}>Request Info</Button>
            </Stack>
          </DataPanel>
        </Grid>
      </Grid>
    </PageShell>
  );
}

export function PermissionsMatrix() {
  const rows = [
    ["Course enrollment request", "Create request", "Create request", "View assigned training", "Approve or reject"],
    ["Structured module learning", "Locked until approval", "Complete lessons", "Complete required training", "Preview and manage"],
    ["Certificate", "Not available", "Download after release", "Download after release", "Review and release"],
    ["Incident status", "No access", "No access", "Recommend only", "Official status update"],
    ["Evidence records", "No access", "Own training evidence", "Incident evidence review", "Full evidence access"],
    ["Audit log", "No access", "No access", "Limited view", "Full access"],
  ];

  return (
    <PageShell
      title="Permissions Matrix"
      subtitle="A clear role-based access control model for Applicant, Park Guide, Park Ranger, and Admin."
    >
      <DataPanel title="Role access rules">
        <RowGrid columns="1.5fr 1.1fr 1.1fr 1.1fr 1.1fr">
          {["Feature", "Applicant", "Park Guide", "Park Ranger", "Admin"].map((label) => <Typography key={label} sx={tableHeaderSx}>{label}</Typography>)}
        </RowGrid>
        {rows.map((row) => (
          <RowGrid key={row[0]} columns="1.5fr 1.1fr 1.1fr 1.1fr 1.1fr">
            {row.map((cell, index) => (
              <Typography key={`${row[0]}-${cell}`} sx={{ color: index === 0 ? "#173126" : "#56685d", fontWeight: index === 0 ? 950 : 760 }}>{cell}</Typography>
            ))}
          </RowGrid>
        ))}
      </DataPanel>

      <Grid container spacing={2.5} sx={{ mt: 2 }}>
        {[
          ["Least privilege", "Each role only receives the minimum permission needed to complete their work."],
          ["Separation of duties", "Ranger can recommend incident closure, but Admin must make the official decision."],
          ["Auditability", "Sensitive actions such as approval, rejection, evidence review, and certificate release are logged."],
        ].map(([title, body]) => (
          <Grid item xs={12} md={4} key={title}>
            <Paper sx={{ ...panelSx, p: 2.5 }}>
              <Typography sx={{ color: "#173126", fontWeight: 950 }}>{title}</Typography>
              <Typography sx={mutedSx}>{body}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </PageShell>
  );
}

export function IncidentOpsWorkflow() {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [selectedId, setSelectedId] = useState(initialIncidents[0].id);
  const selected = incidents.find((incident) => incident.id === selectedId) || incidents[0];

  const updateIncident = (patch) => {
    setIncidents((items) => items.map((item) => (item.id === selected.id ? { ...item, ...patch } : item)));
  };

  const openCount = incidents.filter((item) => item.status !== "Resolved").length;
  const highCount = incidents.filter((item) => item.severity === "High" && item.status !== "Resolved").length;
  const groupedCount = incidents.filter((item) => item.source.includes("Cluster") || item.status === "Grouped" || item.status === "Clustered").length;
  const rangerInputs = incidents.filter((item) => item.rangerRecommendation && item.rangerRecommendation !== "Pending ranger review").length;

  return (
    <PageShell
      title="Incident Operations Center"
      subtitle="Admin controls final incident status. Ranger recommendations are useful, but they do not officially close incidents."
      action={<Button component={RouterLink} to="/admin/sensor-rules" variant="outlined">Open sensor rules</Button>}
    >
      <StatsGrid
        items={[
          { label: "Open Incidents", value: openCount, detail: "Not officially resolved", icon: "🚨" },
          { label: "High Priority", value: highCount, detail: "Needs attention", icon: "⚠️" },
          { label: "Grouped Alerts", value: groupedCount, detail: "Reduced sensor noise", icon: "📡" },
          { label: "Ranger Inputs", value: rangerInputs, detail: "Awaiting admin decision", icon: "🧭" },
        ]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <DataPanel title="Incident queue">
            <RowGrid columns="1fr 1.1fr 0.8fr 1fr 1fr 0.9fr">
              {["Incident", "Source", "Severity", "Zone", "Status", "Action"].map((label) => <Typography key={label} sx={tableHeaderSx}>{label}</Typography>)}
            </RowGrid>
            {incidents.map((incident) => (
              <RowGrid key={incident.id} columns="1fr 1.1fr 0.8fr 1fr 1fr 0.9fr" selected={incident.id === selectedId}>
                <Box>
                  <Typography sx={{ color: "#173126", fontWeight: 950 }}>{incident.id}</Typography>
                  <Typography sx={{ ...mutedSx, fontSize: "0.78rem" }}>{incident.title}</Typography>
                </Box>
                <Typography>{incident.source}</Typography>
                <Chip label={incident.severity} color={statusColor(incident.severity)} size="small" />
                <Typography>{incident.zone}</Typography>
                <Chip label={incident.status} color={statusColor(incident.status)} size="small" />
                <Button onClick={() => setSelectedId(incident.id)}>Review</Button>
              </RowGrid>
            ))}
          </DataPanel>
        </Grid>

        <Grid item xs={12} lg={5}>
          <DataPanel title="Selected incident" subtitle="Admin final decision panel.">
            <Typography sx={kickerSx}>{selected.source}</Typography>
            <Typography variant="h4" sx={headingSx}>{selected.title}</Typography>
            <Typography sx={mutedSx}>{selected.location} · {selected.zone}</Typography>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6}><Paper sx={{ p: 2, borderRadius: 3 }}>Evidence<br /><strong>{selected.evidence}</strong></Paper></Grid>
              <Grid item xs={6}><Paper sx={{ p: 2, borderRadius: 3 }}>Evidence hash<br /><strong>{selected.hash}</strong></Paper></Grid>
              <Grid item xs={6}><Paper sx={{ p: 2, borderRadius: 3 }}>Ranger recommendation<br /><strong>{selected.rangerRecommendation}</strong></Paper></Grid>
              <Grid item xs={6}><Paper sx={{ p: 2, borderRadius: 3 }}>Admin decision<br /><strong>{selected.adminDecision}</strong></Paper></Grid>
            </Grid>

            <FormTextArea
              label="Admin note"
              value={selected.note}
              onChange={(value) => updateIncident({ note: value })}
              minRows={3}
            />

            <Stack direction="row" gap={1.2} flexWrap="wrap">
              <Button variant="outlined" onClick={() => updateIncident({ status: "Under Review", adminDecision: "Marked under review by Admin" })}>Mark Under Review</Button>
              <Button variant="contained" color="success" onClick={() => updateIncident({ status: "Resolved", adminDecision: "Officially resolved by Admin" })}>Resolve Officially</Button>
              <Button variant="outlined" color="error" onClick={() => updateIncident({ status: "Escalated", adminDecision: "Escalated by Admin" })}>Escalate</Button>
            </Stack>
          </DataPanel>

          <Box sx={{ mt: 3 }}>
            <DataPanel title="Noise control" subtitle="Sensor grouping prevents 100 sensors from flooding the incident page.">
              {initialRules.slice(0, 3).map((rule) => (
                <Paper key={rule.id} sx={{ p: 2, mb: 1.4, borderRadius: 3, background: "#fffdf5" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography sx={{ color: "#173126", fontWeight: 950 }}>{rule.name}</Typography>
                      <Typography sx={mutedSx}>{rule.threshold} in {rule.window} → {rule.action}</Typography>
                    </Box>
                    <Chip label={rule.status} color={statusColor(rule.status)} size="small" />
                  </Stack>
                </Paper>
              ))}
            </DataPanel>
          </Box>
        </Grid>
      </Grid>
    </PageShell>
  );
}

export function RangerReviewWorkflow() {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [selectedId, setSelectedId] = useState(initialIncidents[0].id);
  const [note, setNote] = useState("");
  const selected = incidents.find((incident) => incident.id === selectedId) || incidents[0];
  const recommendationQueue = incidents.map((incident) => ({
    ...incident,
    adminDecisionNeeded: ["New", "Under Review", "Clustered", "Grouped"].includes(incident.status)
      || incident.adminDecision === "Not decided",
  }));

  const recommend = (recommendation) => {
    setIncidents((items) =>
      items.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              rangerRecommendation: recommendation,
              note: note || `${selected.assigned} recommends: ${recommendation}`,
            }
          : item
      )
    );
  };

  const setAdminDecision = (status, adminDecision) => {
    setIncidents((items) =>
      items.map((item) =>
        item.id === selected.id
          ? { ...item, status, adminDecision }
          : item
      )
    );
  };

  return (
    <PageShell
      title="Ranger Review Console"
      subtitle="Dr Lee feedback made explicit: Rangers view incidents, submit notes and recommendations, and Admin makes the final official status change."
      action={<Button component={RouterLink} to="/admin/detection" variant="outlined">Open incidents</Button>}
    >
      <StatsGrid
        items={[
          { label: "Recommendations", value: incidents.length, detail: "Ranger notes awaiting Admin review", icon: <ReviewsOutlinedIcon /> },
          { label: "High Risk", value: incidents.filter((item) => item.severity === "High").length, detail: "Review quickly", icon: <CrisisAlertOutlinedIcon /> },
          { label: "Admin Needed", value: recommendationQueue.filter((item) => item.adminDecisionNeeded).length, detail: "Official status not finalized", icon: <PendingActionsOutlinedIcon /> },
          { label: "Resolved by Ranger", value: "0", detail: "Not allowed by design", icon: <VerifiedOutlinedIcon /> },
        ]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <DataPanel title="Recommendation queue" subtitle="Ranger recommendation is advisory. It does not resolve the incident.">
            <Box className="ranger-review-card-list">
              {recommendationQueue.map((incident) => (
                <Paper
                  key={incident.id}
                  className={`ranger-review-card ${incident.id === selectedId ? "is-selected" : ""}`}
                  onClick={() => setSelectedId(incident.id)}
                >
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.4}>
                    <Box>
                      <Typography sx={tableHeaderSx}>Incident</Typography>
                      <Typography sx={{ color: "#173126", fontWeight: 950 }}>{incident.id}</Typography>
                      <Typography sx={{ ...mutedSx, fontSize: "0.82rem" }}>{incident.title}</Typography>
                    </Box>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      <Chip label={incident.status} color={statusColor(incident.status)} size="small" />
                      <Chip
                        label={incident.adminDecisionNeeded ? "Admin decision needed" : "Reviewed by Admin"}
                        color={incident.adminDecisionNeeded ? "warning" : "success"}
                        size="small"
                      />
                    </Stack>
                  </Stack>

                  <Grid container spacing={1.4} sx={{ mt: 1.2 }}>
                    <Grid item xs={12} sm={4} md={2.4}>
                      <Typography sx={tableHeaderSx}>Ranger</Typography>
                      <Typography sx={{ color: "#173126", fontWeight: 900 }}>{incident.assigned}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4} md={2.6}>
                      <Typography sx={tableHeaderSx}>Recommendation</Typography>
                      <Chip label={incident.rangerRecommendation} color={statusColor(incident.rangerRecommendation)} size="small" />
                    </Grid>
                    <Grid item xs={12} sm={4} md={2.2}>
                      <Typography sx={tableHeaderSx}>Official Status</Typography>
                      <Typography sx={{ color: "#173126", fontWeight: 900 }}>{incident.status}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4.8}>
                      <Typography sx={tableHeaderSx}>Note</Typography>
                      <Typography sx={{ color: "#56685d", fontWeight: 780 }}>{incident.note || "No field note yet."}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          </DataPanel>
        </Grid>

        <Grid item xs={12} lg={7}>
          <DataPanel title="Selected recommendation" subtitle="Ranger input stays separate from official Admin status.">
            <Paper sx={{ p: 3, borderRadius: 4, background: "linear-gradient(135deg, #0f5132, #173126)", color: "white", mb: 2 }}>
              <Typography sx={{ color: "#dffff0", fontWeight: 950, letterSpacing: "0.14em" }}>{selected.source.toUpperCase()}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 950 }}>{selected.title}</Typography>
              <Typography>{selected.evidence}</Typography>
              <Stack direction="row" gap={1} sx={{ mt: 2 }}>
                <Chip label={`${selected.location} · ${selected.zone}`} />
                <Chip label={`Official status: ${selected.status}`} />
                <Chip label={`Ranger: ${selected.assigned}`} />
              </Stack>
            </Paper>

            <FormTextArea
              label="Ranger field note"
              value={note}
              onChange={setNote}
              minRows={3}
            />

            <Stack direction="row" gap={1.2} flexWrap="wrap">
              <Button variant="contained" color="success" onClick={() => recommend("Recommend Resolved")}>Recommend Resolved</Button>
              <Button variant="outlined" color="warning" onClick={() => recommend("Recommend In Review")}>Recommend In Review</Button>
              <Button variant="outlined" color="error" onClick={() => recommend("Recommend False Alarm")}>Recommend False Alarm</Button>
            </Stack>

            <Paper sx={{ p: 2, mt: 2, borderRadius: 3, background: "#fff7e0" }}>
              <Typography sx={{ color: "#173126", fontWeight: 950 }}>Guardrail</Typography>
              <Typography sx={mutedSx}>Park Rangers can recommend outcomes. Admin remains responsible for official status updates.</Typography>
            </Paper>
          </DataPanel>
        </Grid>

        <Grid item xs={12} lg={5}>
          <DataPanel title="Admin decision panel" subtitle="This is where the advisory recommendation becomes an official Admin action.">
            <Typography sx={kickerSx}>Current recommendation</Typography>
            <Typography variant="h5" sx={headingSx}>{selected.rangerRecommendation}</Typography>
            <Typography sx={{ ...mutedSx, mb: 2 }}>{selected.note || "No ranger note recorded yet."}</Typography>
            <Stack direction="row" gap={1.2} flexWrap="wrap">
              <Button variant="outlined" onClick={() => setAdminDecision("In Review", "Admin accepted ranger review recommendation")}>Mark In Review</Button>
              <Button variant="contained" color="success" onClick={() => setAdminDecision("Resolved", "Admin officially resolved after ranger review")}>Officially Resolve</Button>
              <Button variant="outlined" color="warning" onClick={() => setAdminDecision("False Alarm", "Admin closed as false alarm after evidence review")}>False Alarm</Button>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography sx={mutedSx}>
              Admin decision: {selected.adminDecision}. Ranger recommendation: {selected.rangerRecommendation}.
            </Typography>
          </DataPanel>
        </Grid>
      </Grid>
    </PageShell>
  );
}

export function SensorRulesWorkflow() {
  const [rules, setRules] = useState(initialRules);
  const [selectedId, setSelectedId] = useState(initialRules[0].id);
  const selected = rules.find((rule) => rule.id === selectedId) || rules[0];

  const updateRule = (patch) => {
    setRules((items) => items.map((item) => (item.id === selected.id ? { ...item, ...patch } : item)));
  };

  const rawTriggers = 47;
  const groupedIncidents = 2;

  return (
    <PageShell
      title="Sensor Rules and Alert Grouping"
      subtitle="Solves the lecturer's concern: if many sensors trigger, the system groups noise into meaningful incident clusters."
      action={<Button component={RouterLink} to="/admin/detection" variant="outlined">Open incidents</Button>}
    >
      <StatsGrid
        items={[
          { label: "Active Rules", value: rules.filter((rule) => rule.status === "Active").length, detail: `${rules.length} total rules`, icon: "📡" },
          { label: "Raw Triggers", value: rawTriggers, detail: "Before grouping", icon: "📈" },
          { label: "Grouped Incidents", value: groupedIncidents, detail: "After grouping", icon: "🧺" },
          { label: "Noise Reduction", value: rawTriggers - groupedIncidents, detail: "Avoided separate rows", icon: "🧹" },
        ]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <DataPanel title="Rule list">
            <RowGrid columns="1.4fr 1fr 1.1fr 1fr 1.2fr 0.8fr">
              {["Rule", "Source", "Location", "Threshold", "Action", "Status"].map((label) => <Typography key={label} sx={tableHeaderSx}>{label}</Typography>)}
            </RowGrid>
            {rules.map((rule) => (
              <RowGrid key={rule.id} columns="1.4fr 1fr 1.1fr 1fr 1.2fr 0.8fr" selected={rule.id === selectedId}>
                <Box onClick={() => setSelectedId(rule.id)} sx={{ cursor: "pointer" }}>
                  <Typography sx={{ color: "#173126", fontWeight: 950 }}>{rule.name}</Typography>
                  <Typography sx={{ ...mutedSx, fontSize: "0.78rem" }}>{rule.id}</Typography>
                </Box>
                <Typography>{rule.source}</Typography>
                <Typography>{rule.location}</Typography>
                <Typography>{rule.threshold}</Typography>
                <Typography>{rule.action}</Typography>
                <Chip label={rule.status} color={statusColor(rule.status)} size="small" />
              </RowGrid>
            ))}
          </DataPanel>
        </Grid>

        <Grid item xs={12} lg={5}>
          <DataPanel title="Selected rule" subtitle="Prototype rule editor.">
            {["name", "threshold", "window", "cooldown"].map((field) => (
              <FormInput
                key={field}
                label={field.replace(/^\w/, (char) => char.toUpperCase())}
                value={selected[field]}
                onChange={(value) => updateRule({ [field]: value })}
              />
            ))}
            <FormSelect
              label="Action"
              value={selected.action}
              onChange={(value) => updateRule({ action: value })}
              options={["Group into one incident", "Create high priority incident", "Assign ranger review", "Suppress duplicate incidents"]}
            />
            <Stack direction="row" gap={1.2}>
              <Button variant="contained" onClick={() => updateRule({ status: "Active" })}>Set Active</Button>
              <Button variant="outlined" color="warning" onClick={() => updateRule({ status: "Draft" })}>Set Draft</Button>
            </Stack>
          </DataPanel>

          <Box sx={{ mt: 3 }}>
            <DataPanel title="Grouping example" subtitle="How 37 sensor triggers become one incident row.">
              <Paper sx={{ p: 3, borderRadius: 4, background: "#fff7e0" }}>
                <Typography sx={kickerSx}>Plant Zone A</Typography>
                <Typography variant="h3" sx={{ color: "#ff7a1a", fontWeight: 950 }}>37 → 1</Typography>
                <Typography sx={mutedSx}>Raw proximity triggers are grouped by zone and time window. The incident page stays readable and Admin can still view the evidence count.</Typography>
              </Paper>
            </DataPanel>
          </Box>
        </Grid>
      </Grid>
    </PageShell>
  );
}

export function AnnouncementsWorkflow() {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [syncMessage, setSyncMessage] = useState("");
  const [form, setForm] = useState({
    title: "Trail condition update",
    audience: "Park Guides",
    location: "All locations",
    priority: "Medium",
    message: "Please review the latest trail update before your next shift.",
  });

  useEffect(() => {
    let ignore = false;

    requestJson(`${API_BASE_URL}/api/admin/announcements`)
      .then((data) => {
        if (ignore) return;
        if (Array.isArray(data.announcements) && data.announcements.length > 0) {
          setAnnouncements(data.announcements);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setSyncMessage(`Announcement database feed unavailable. Showing demo records. ${error.message}`);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const publish = async (status) => {
    const next = {
      id: `ANN-${1000 + announcements.length + 1}`,
      ...form,
      channel: "In-app + Email",
      status,
      pinned: status === "Sent" && form.priority === "High",
    };

    setSyncMessage(status === "Sent" ? "Publishing announcement to user notifications..." : "Saving scheduled announcement...");

    try {
      const data = await requestJson(`${API_BASE_URL}/api/admin/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status }),
      });

      setAnnouncements([data.announcement || next, ...announcements]);
      setSyncMessage(data.message || "Announcement saved.");
    } catch (error) {
      setAnnouncements([next, ...announcements]);
      setSyncMessage(`Saved on this Admin screen only. User and Mobile notifications were not updated. ${error.message}`);
    }
  };

  return (
    <PageShell
      title="Notifications and Announcements"
      subtitle="Admin can publish targeted announcements by role, location, priority, and channel. Learners and rangers receive them in the inbox."
      action={<Button component={RouterLink} to="/admin/inbox" variant="outlined">Open inbox</Button>}
    >
      <StatsGrid
        items={[
          { label: "Sent", value: announcements.filter((item) => item.status === "Sent").length, detail: "Published announcements", icon: "📣" },
          { label: "Scheduled", value: announcements.filter((item) => item.status === "Scheduled").length, detail: "Waiting to send", icon: "⏰" },
          { label: "Pinned", value: announcements.filter((item) => item.pinned).length, detail: "Shown at top", icon: "📌" },
          { label: "High Priority", value: announcements.filter((item) => item.priority === "High").length, detail: "Urgent notices", icon: "🚨" },
        ]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <DataPanel title="Create announcement" subtitle="Broadcasts are read-only. Users should use Help Desk for follow-up.">
            {syncMessage ? (
              <Paper sx={{ p: 1.6, mb: 1.5, borderRadius: 3, background: "#fff7e0" }}>
                <Typography sx={{ color: "#173126", fontWeight: 850 }}>{syncMessage}</Typography>
              </Paper>
            ) : null}
            <FormInput label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
            <FormSelect label="Audience" value={form.audience} onChange={(value) => setForm({ ...form, audience: value })} options={["All Users", "Park Guides", "Park Rangers", "Admins"]} />
            <FormSelect label="Location" value={form.location} onChange={(value) => setForm({ ...form, location: value })} options={["All locations", "Bako National Park", "Niah National Park", "Semenggoh Nature Reserve"]} />
            <FormSelect label="Priority" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} options={["Low", "Medium", "High"]} />
            <FormTextArea label="Message" value={form.message} onChange={(value) => setForm({ ...form, message: value })} minRows={4} />
            <Stack direction="row" gap={1.2}>
              <Button variant="contained" color="success" onClick={() => publish("Sent")}>Publish now</Button>
              <Button variant="outlined" color="warning" onClick={() => publish("Scheduled")}>Schedule</Button>
            </Stack>
          </DataPanel>
        </Grid>

        <Grid item xs={12} lg={7}>
          <DataPanel title="Announcement feed" subtitle="Role and location targeted notices.">
            {announcements.map((item) => (
              <Paper key={item.id} sx={{ p: 2.2, mb: 1.4, borderRadius: 3, background: "#fffdf5" }}>
                <Stack direction="row" gap={1} sx={{ mb: 1 }}>
                  <Chip label={item.status} color={statusColor(item.status)} size="small" />
                  <Chip label={item.priority} color={statusColor(item.priority)} size="small" />
                  {item.pinned ? <Chip label="Pinned" color="success" size="small" /> : null}
                </Stack>
                <Typography variant="h6" sx={headingSx}>{item.title}</Typography>
                <Typography sx={mutedSx}>{item.audience} · {item.location} · {item.channel}</Typography>
                {typeof item.recipient_count === "number" ? (
                  <Typography sx={mutedSx}>{item.recipient_count} notification recipient{item.recipient_count === 1 ? "" : "s"}</Typography>
                ) : null}
                <Typography sx={{ mt: 1 }}>{item.message}</Typography>
              </Paper>
            ))}
          </DataPanel>
        </Grid>
      </Grid>
    </PageShell>
  );
}

export function InboxWorkflow() {
  const [selectedId, setSelectedId] = useState("MSG-1001");
  const [replyDraft, setReplyDraft] = useState("Thanks, I will check and follow up.");
  const [read, setRead] = useState(new Set(["MSG-1004"]));
  const messages = useMemo(() => [
    { id: "MSG-1001", title: "Trail condition update", from: "Admin", type: "Announcement", priority: "Normal", body: "Please review the latest trail update before your next shift." },
    { id: "MSG-1002", title: "Course enrollment approved", from: "Admin Siti Rahman", type: "Training", priority: "Normal", body: "Your course enrollment has been approved." },
    { id: "MSG-1003", title: "Ranger recommendation for INC-AI-2037", from: "Maya Ling", type: "Incident", priority: "High", body: "Ranger recommends escalation for review." },
    { id: "MSG-1004", title: "37 sensor triggers grouped into one incident", from: "System", type: "IoT Sensor", priority: "Medium", body: "Raw sensor events were grouped to reduce alert noise." },
  ], []);
  const selected = messages.find((item) => item.id === selectedId) || messages[0];

  return (
    <PageShell
      title="Messaging Inbox"
      subtitle="A focused inbox for admin notices, course messages, ranger recommendations, and system alerts. Broadcast announcement replies are disabled."
      action={<Button component={RouterLink} to="/admin/help-desk" variant="outlined">Create help request</Button>}
    >
      <StatsGrid
        items={[
          { label: "Inbox", value: messages.length, detail: "Total conversations", icon: "💬" },
          { label: "Unread", value: messages.filter((item) => !read.has(item.id)).length, detail: "Needs response", icon: "🔔" },
          { label: "Incident Threads", value: messages.filter((item) => item.type === "Incident").length, detail: "Ranger or system alerts", icon: "🚨" },
          { label: "Announcements", value: messages.filter((item) => item.type === "Announcement").length, detail: "Read-only notices", icon: "📣" },
        ]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <DataPanel title="Inbox list">
            {messages.map((message) => (
              <Paper
                key={message.id}
                onClick={() => setSelectedId(message.id)}
                sx={{
                  p: 2,
                  mb: 1.2,
                  borderRadius: 3,
                  cursor: "pointer",
                  background: message.id === selectedId ? "#f0ffe5" : "#fffdf5",
                  border: read.has(message.id) ? "1px solid rgba(225, 169, 69, 0.18)" : "1px solid #a7e957",
                }}
              >
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography sx={{ color: "#173126", fontWeight: 950 }}>{message.title}</Typography>
                    <Typography sx={mutedSx}>{message.from} → {message.type}</Typography>
                  </Box>
                  <Chip label={message.priority} color={statusColor(message.priority)} size="small" />
                </Stack>
              </Paper>
            ))}
          </DataPanel>
        </Grid>

        <Grid item xs={12} lg={7}>
          <DataPanel title={selected.title} subtitle={`From ${selected.from} · ${selected.type}`}>
            <Paper sx={{ p: 2, borderRadius: 3, background: "#fffdf5", mb: 2 }}>{selected.body}</Paper>
            {selected.type === "Announcement" ? (
              <Paper sx={{ p: 2, borderRadius: 3, background: "#fff7e0" }}>
                <Typography sx={{ color: "#173126", fontWeight: 950 }}>Broadcast replies disabled</Typography>
                <Typography sx={mutedSx}>To avoid a messy all-user reply thread, users should create a Help Desk ticket instead.</Typography>
              </Paper>
            ) : (
              <FormTextArea label="Reply" value={replyDraft} onChange={setReplyDraft} minRows={4} />
            )}
            <Stack direction="row" gap={1.2} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={() => setRead(new Set([...read, selected.id]))}>Mark as read</Button>
              <Button component={RouterLink} to="/admin/help-desk" variant="outlined">Open help desk</Button>
            </Stack>
          </DataPanel>
        </Grid>
      </Grid>
    </PageShell>
  );
}

export function HelpDeskWorkflow() {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedId, setSelectedId] = useState(initialTickets[0].id);
  const [form, setForm] = useState({
    subject: "Question about latest announcement",
    category: "Announcement Clarification",
    linked: "New learning resource added",
    priority: "Medium",
    details: "I need clarification before my next shift.",
  });
  const selected = tickets.find((ticket) => ticket.id === selectedId) || tickets[0];

  const createTicket = () => {
    const next = {
      id: `TIC-${1000 + tickets.length + 1}`,
      subject: form.subject,
      requester: "Current User",
      role: "Park Guide",
      location: "Bako National Park",
      category: form.category,
      priority: form.priority,
      status: "Open",
      details: form.details,
    };
    setTickets([next, ...tickets]);
    setSelectedId(next.id);
  };

  const updateTicket = (status) => {
    setTickets((items) => items.map((ticket) => (ticket.id === selected.id ? { ...ticket, status } : ticket)));
  };

  return (
    <PageShell
      title="Help Desk and Contact Admin"
      subtitle="Users should not reply to broadcast announcements. They should submit one trackable help request instead."
    >
      <StatsGrid
        items={[
          { label: "Open Tickets", value: tickets.filter((item) => item.status !== "Resolved").length, detail: "Need admin handling", icon: "🛟" },
          { label: "High Priority", value: tickets.filter((item) => item.priority === "High").length, detail: "Escalate first", icon: "⚠️" },
          { label: "Resolved", value: tickets.filter((item) => item.status === "Resolved").length, detail: "Closed support issues", icon: "✅" },
          { label: "Broadcast Replies", value: "0", detail: "Disabled by design", icon: "🔒" },
        ]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <DataPanel title="Create help request">
            <FormInput label="Subject" value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} />
            <FormSelect label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} options={["Announcement Clarification", "Course Access", "Incident Evidence", "Certificate Release"]} />
            <FormSelect label="Linked message" value={form.linked} onChange={(value) => setForm({ ...form, linked: value })} options={["New learning resource added", "Trail condition update", "Grouped sensor alert", "Certificate release policy"]} />
            <FormSelect label="Priority" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} options={["Low", "Medium", "High"]} />
            <FormTextArea label="Details" value={form.details} onChange={(value) => setForm({ ...form, details: value })} minRows={4} />
            <Button variant="contained" color="success" onClick={createTicket}>Submit help request</Button>
          </DataPanel>
        </Grid>

        <Grid item xs={12} lg={7}>
          <DataPanel title="Support queue" subtitle="Admin can triage, respond, and resolve tickets.">
            {tickets.map((ticket) => (
              <Paper key={ticket.id} onClick={() => setSelectedId(ticket.id)} sx={{ p: 2, mb: 1.2, borderRadius: 3, cursor: "pointer", background: ticket.id === selectedId ? "#f0ffe5" : "#fffdf5" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography sx={{ color: "#173126", fontWeight: 950 }}>{ticket.subject}</Typography>
                    <Typography sx={mutedSx}>{ticket.requester} · {ticket.role} · {ticket.location}</Typography>
                  </Box>
                  <Stack direction="row" gap={1}>
                    <Chip label={ticket.priority} color={statusColor(ticket.priority)} size="small" />
                    <Chip label={ticket.status} color={statusColor(ticket.status)} size="small" />
                  </Stack>
                </Stack>
              </Paper>
            ))}

            <Paper sx={{ p: 2.5, mt: 2, borderRadius: 3, background: "#fffdf5" }}>
              <Typography sx={kickerSx}>Selected ticket</Typography>
              <Typography variant="h5" sx={headingSx}>{selected.subject}</Typography>
              <Typography sx={mutedSx}>{selected.details}</Typography>
              <Stack direction="row" gap={1.2} sx={{ mt: 2 }} flexWrap="wrap">
                <Button variant="outlined" onClick={() => updateTicket("In Progress")}>Mark In Progress</Button>
                <Button variant="contained" color="success" onClick={() => updateTicket("Resolved")}>Resolve Ticket</Button>
                <Button variant="outlined" color="error" onClick={() => updateTicket("Escalated")}>Escalate</Button>
              </Stack>
            </Paper>
          </DataPanel>
        </Grid>
      </Grid>
    </PageShell>
  );
}

export function BackendMappingWorkflow() {
  const schemaGroups = [
    ["users", "Account approval, role, assigned location, document status."],
    ["courses", "Course shell, status, target role, location, dates, contact hours."],
    ["training_modules", "Module blocks inside each course."],
    ["course_module_items", "Canvas-style pages, text, files, images, videos, links, quizzes, and checklists."],
    ["course_enrollments", "Request, approve, reject, reopen, and access gate state."],
    ["canvas_item_progress", "Completion evidence per user and item."],
    ["certificate_reviews", "Generated, pending review, released, rejected."],
    ["incidents", "AI and IoT evidence records, severity, status, and admin decision."],
    ["sensor_rules", "Grouping thresholds, time windows, cooldowns, and actions."],
    ["announcements", "Role and location targeted read-only notices."],
    ["help_tickets", "Trackable Contact Admin support requests."],
    ["audit_events", "Immutable security and accountability log."],
  ];

  const apiRoutes = [
    ["GET /api/canvas/courses", "User Portal course list and selected course shell."],
    ["POST /api/demo/canvas-seed", "Insert the three demo Canvas courses into MySQL."],
    ["POST /api/enrollments/:id/approve", "Admin approval gate for learning access."],
    ["POST /api/progress/item", "Save item completion evidence."],
    ["POST /api/certificates/:id/release", "Admin releases certificate to learner."],
    ["POST /api/incidents/:id/ranger-recommendation", "Park Ranger submits notes and recommendations only."],
    ["PATCH /api/incidents/:id/status", "Admin official incident status update."],
    ["POST /api/sensor-rules/evaluate", "Group noisy IoT triggers into clusters."],
    ["POST /api/help-tickets", "Create Contact Admin ticket."],
    ["GET /api/audit-events", "Review immutable audit trail."],
  ];

  return (
    <PageShell
      title="Backend Data Model Mapping"
      subtitle="Maps the prototype into MySQL tables, API routes, and role permissions so the UI can become a real system."
    >
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <DataPanel title="Recommended MySQL schema groups">
            {schemaGroups.map(([name, detail]) => (
              <Paper key={name} sx={{ p: 2, mb: 1.2, borderRadius: 3, background: "#fffdf5" }}>
                <Typography sx={{ color: "#173126", fontWeight: 950 }}>{name}</Typography>
                <Typography sx={mutedSx}>{detail}</Typography>
              </Paper>
            ))}
          </DataPanel>
        </Grid>
        <Grid item xs={12} lg={6}>
          <DataPanel title="API route map">
            {apiRoutes.map(([route, detail]) => (
              <Paper key={route} sx={{ p: 2, mb: 1.2, borderRadius: 3, background: "#fffdf5" }}>
                <Typography sx={{ color: "#173126", fontWeight: 950 }}>{route}</Typography>
                <Typography sx={mutedSx}>{detail}</Typography>
              </Paper>
            ))}
          </DataPanel>
        </Grid>
      </Grid>
    </PageShell>
  );
}

export function AuditLogWorkflow() {
  return (
    <PageShell
      title="Audit Log"
      subtitle="Security-focused traceability for admin approvals, learning completion, certificate review, announcements, messaging, help desk tickets, and system-generated records."
    >
      <StatsGrid
        items={[
          { label: "Audit Events", value: auditEvents.length, detail: "Current demo session", icon: "🔎" },
          { label: "Admin Actions", value: auditEvents.filter((item) => item.actor === "Admin").length, detail: "Approval and release actions", icon: "🛠️" },
          { label: "System Events", value: auditEvents.filter((item) => item.actor === "System").length, detail: "Automated records", icon: "⚙️" },
          { label: "Medium Risk", value: auditEvents.filter((item) => item.risk === "Medium").length, detail: "Needs review or pending state", icon: "⚠️" },
        ]}
      />

      <DataPanel title="Recent system activity">
        <RowGrid columns="1fr 1.2fr 1.3fr 2fr 0.8fr">
          {["ID", "Actor", "Area", "Action", "Risk"].map((label) => <Typography key={label} sx={tableHeaderSx}>{label}</Typography>)}
        </RowGrid>
        {auditEvents.map((event) => (
          <RowGrid key={event.id} columns="1fr 1.2fr 1.3fr 2fr 0.8fr">
            <Typography sx={{ color: "#173126", fontWeight: 950 }}>{event.id}</Typography>
            <Typography>{event.actor}</Typography>
            <Typography>{event.area}</Typography>
            <Typography>{event.action}</Typography>
            <Chip label={event.risk} color={statusColor(event.risk)} size="small" />
          </RowGrid>
        ))}
      </DataPanel>

      <Grid container spacing={2.5} sx={{ mt: 2 }}>
        {[
          ["Immutable records", "Do not delete audit rows. Use archived or superseded status instead."],
          ["Role-based access control", "Park Ranger can recommend incident closure, but cannot change official status."],
          ["Evidence integrity", "Evidence hash and timestamp should be stored with every incident and completion record."],
        ].map(([title, body]) => (
          <Grid item xs={12} md={4} key={title}>
            <Paper sx={{ ...panelSx, p: 2.5 }}>
              <Typography sx={{ color: "#173126", fontWeight: 950 }}>{title}</Typography>
              <Typography sx={mutedSx}>{body}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </PageShell>
  );
}
