import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import StudentDashboard from "./pages/StudentDashboard";

import ExamPage from "./pages/ExamPage";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

import AdminPage from "./pages/AdminPage";

import Subjects from "./admin/Subjects";

import Topics from "./admin/Topics";

export default function App() {

  return (

    <BrowserRouter>

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
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exam/:subject"
          element={
            <ProtectedRoute>
              <ExamPage />
            </ProtectedRoute>
          }
        />

        <Route
  path="/admin/topics"
  element={
    <AdminRoute>
      <Topics />
    </AdminRoute>
  }
/>
        
<Route
  path="/admin/subjects"
  element={
    <AdminRoute>
      <Subjects />
    </AdminRoute>
  }
/>
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}
