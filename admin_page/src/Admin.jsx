import React from "react";
import { Admin, Resource } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";
import "./Admin.css";
import MyLayout from "./components/MyLayout";
import CourseManagement from "./pages/course.jsx";
import TrainingModuleSetup from "./pages/training_module.jsx";
import CourseRequestsPage from "./pages/course_requests.jsx";
import StudentManagement from "./pages/student_management.jsx";
import CertificateManagement from "./pages/badge.jsx";
import AIDetection from "./pages/AIDetection.jsx";
import {
  AdminAnalyticsDashboard,
  AdminPrototypeDashboard,
  AnnouncementsWorkflow,
  AuditLogWorkflow,
  BackendMappingWorkflow,
  HelpDeskWorkflow,
  InboxWorkflow,
  PermissionsMatrix,
  RangerReviewWorkflow,
  SensorRulesWorkflow,
} from "./pages/platform_workflows.jsx";

const dataProvider = simpleRestProvider("https://jsonplaceholder.typicode.com");

function AdminPage() {
  return (
    <Admin dataProvider={dataProvider} dashboard={AdminPrototypeDashboard} layout={MyLayout}>
      <Resource name="course" list={CourseManagement} options={{ label: "Courses" }} />
      <Resource name="training" list={TrainingModuleSetup} options={{ label: "Training Modules" }} />
      <Resource name="course-requests" list={CourseRequestsPage} options={{ label: "Course Requests" }} />
      <Resource name="students" list={StudentManagement} options={{ label: "User Management" }} />
      <Resource name="certificates" list={CertificateManagement} options={{ label: "Certificates" }} />
      <Resource name="badge" list={CertificateManagement} options={{ label: "Certificates" }} />
      <Resource name="detection" list={AIDetection} options={{ label: "Incident Detection" }} />
      <Resource name="analytics" list={AdminAnalyticsDashboard} options={{ label: "Analytics" }} />
      <Resource name="users" list={StudentManagement} options={{ label: "User Management" }} />
      <Resource name="permissions" list={PermissionsMatrix} options={{ label: "Permissions" }} />
      <Resource name="ranger-review" list={RangerReviewWorkflow} options={{ label: "Ranger Review" }} />
      <Resource name="sensor-rules" list={SensorRulesWorkflow} options={{ label: "Sensor Rules" }} />
      <Resource name="announcements" list={AnnouncementsWorkflow} options={{ label: "Announcements" }} />
      <Resource name="inbox" list={InboxWorkflow} options={{ label: "Inbox" }} />
      <Resource name="help-desk" list={HelpDeskWorkflow} options={{ label: "Help Desk" }} />
      <Resource name="backend-map" list={BackendMappingWorkflow} options={{ label: "Backend Map" }} />
      <Resource name="audit-log" list={AuditLogWorkflow} options={{ label: "Audit Log" }} />
    </Admin>
  );
}

export default AdminPage;
