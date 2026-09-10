import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Public Pages
import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";

// Trainee Pages
import TraineeDashboard from "./pages/trainee/TraineeDashboard";
import PathwayFinder from "./pages/trainee/PathwayFinder";
import SkillGap from "./pages/trainee/SkillGap";
import CourseBrowser from "./pages/trainee/CourseBrowser";

// Employer Pages
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import ValidateCourses from "./pages/employer/ValidateCourses";
import DemandSignals from "./pages/employer/DemandSignals";

// Institute Pages
import InstituteDashboard from "./pages/institute/InstituteDashboard";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import Recommendations from "./pages/admin/Recommendations";
import JobsManager from "./pages/admin/JobsManager";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Trainee Routes */}
      <Route
        path="/trainee"
        element={
          <ProtectedRoute role="trainee">
            <TraineeDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/trainee/pathways" element={<PathwayFinder />} />
      <Route
        path="/trainee/skill-gap"
        element={
          <ProtectedRoute role="trainee">
            <SkillGap />
          </ProtectedRoute>
        }
      />
      <Route path="/trainee/courses" element={<CourseBrowser />} />

      {/* Employer Routes */}
      <Route
        path="/employer"
        element={
          <ProtectedRoute role={["employer", "admin"]}>
            <EmployerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/validate"
        element={
          <ProtectedRoute role={["employer", "admin"]}>
            <ValidateCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/demand-signals"
        element={
          <ProtectedRoute role={["employer", "admin"]}>
            <DemandSignals />
          </ProtectedRoute>
        }
      />

      {/* Institute Routes */}
      <Route
        path="/institute"
        element={
          <ProtectedRoute role={["institute", "admin"]}>
            <InstituteDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/recommendations"
        element={
          <ProtectedRoute role="admin">
            <Recommendations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/jobs"
        element={
          <ProtectedRoute role="admin">
            <JobsManager />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
