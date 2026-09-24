import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoadingSpinner from "./components/shared/LoadingSpinner";

// Public Pages
const Landing = lazy(() => import("./pages/public/Landing"));
const Login = lazy(() => import("./pages/public/Login"));
const Register = lazy(() => import("./pages/public/Register"));

// Trainee Pages
const TraineeDashboard = lazy(() => import("./pages/trainee/TraineeDashboard"));
const PathwayFinder = lazy(() => import("./pages/trainee/PathwayFinder"));
const SkillGap = lazy(() => import("./pages/trainee/SkillGap"));
const CourseBrowser = lazy(() => import("./pages/trainee/CourseBrowser"));
const JobFinder = lazy(() => import("./pages/trainee/JobFinder"));

// Employer Pages
const EmployerDashboard = lazy(() => import("./pages/employer/EmployerDashboard"));
const ValidateCourses = lazy(() => import("./pages/employer/ValidateCourses"));
const DemandSignals = lazy(() => import("./pages/employer/DemandSignals"));
const PostJobs = lazy(() => import("./pages/employer/PostJobs"));

// Institute Pages
const InstituteDashboard = lazy(() => import("./pages/institute/InstituteDashboard"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Recommendations = lazy(() => import("./pages/admin/Recommendations"));
const JobsManager = lazy(() => import("./pages/admin/JobsManager"));

// Shared Pages
const MarketInsights = lazy(() => import("./pages/shared/MarketInsights"));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading page…" />}>
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
      <Route
        path="/trainee/pathways"
        element={
          <ProtectedRoute role="trainee">
            <PathwayFinder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainee/skill-gap"
        element={
          <ProtectedRoute role="trainee">
            <SkillGap />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainee/courses"
        element={
          <ProtectedRoute role="trainee">
            <CourseBrowser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainee/jobs"
        element={
          <ProtectedRoute role="trainee">
            <JobFinder />
          </ProtectedRoute>
        }
      />

      {/* Employer Routes */}
      <Route
        path="/employer"
        element={
          <ProtectedRoute role="employer">
            <EmployerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/validate"
        element={
          <ProtectedRoute role="employer">
            <ValidateCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/demand-signals"
        element={
          <ProtectedRoute role="employer">
            <DemandSignals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/post-jobs"
        element={
          <ProtectedRoute role="employer">
            <PostJobs />
          </ProtectedRoute>
        }
      />

      {/* Institute Routes */}
      <Route
        path="/institute"
        element={
          <ProtectedRoute role="institute">
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

      {/* Shared analyst pages */}
      <Route
        path="/insights"
        element={
          <ProtectedRoute role={["admin", "institute", "employer"]}>
            <MarketInsights />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

export default App;
