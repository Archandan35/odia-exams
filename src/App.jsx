import {
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";

import Register from "./pages/Register";

import Dashboard from "./pages/StudentDashboard";

import AdminDashboard from "./pages/AdminDashboard";

import ExamPage from "./pages/ExamPage";

import AnalyticsPage from "./pages/AnalyticsPage";

import LeaderboardPage from "./pages/LeaderboardPage";

import ProtectedRoute from "./routes/ProtectedRoute";

import AdminRoute from "./routes/AdminRoute";

export default function App() {

  return (

    <Routes>

      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>

            <Dashboard />

          </ProtectedRoute>
        }
      />

      <Route
        path="/exam/:subject""
        element={
          <ProtectedRoute>

            <ExamPage />

          </ProtectedRoute>
        }
      />

      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>

            <LeaderboardPage />

          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <AdminRoute>

            <AnalyticsPage />

          </AdminRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>

            <AdminDashboard />

          </AdminRoute>
        }
      />

    </Routes>
  );
}
