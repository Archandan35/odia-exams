import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import StudentDashboard
from "./pages/StudentDashboard";

import AdminDashboard
from "./pages/AdminDashboard";

import ExamPage
from "./pages/ExamPage";

import TopicDashboard
from "./pages/TopicDashboard";

import MixedExamPage
from "./pages/MixedExamPage";

import ProtectedRoute
from "./routes/ProtectedRoute";

import AdminRoute
from "./routes/AdminRoute";

export default function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Login/>}
        />

        <Route
          path="/register"
          element={<Register/>}
        />

        <Route
          path="/dashboard"
          element={

            <ProtectedRoute>

              <StudentDashboard/>

            </ProtectedRoute>

          }
        />

        <Route
          path="/admin"
          element={

            <AdminRoute>

              <AdminDashboard/>

            </AdminRoute>

          }
        />

        <Route
          path="/exam/:subject"
          element={

            <ProtectedRoute>

              <ExamPage/>

            </ProtectedRoute>

          }
        />

        <Route
          path="/topics"
          element={

            <ProtectedRoute>

              <TopicDashboard/>

            </ProtectedRoute>

          }
        />

        <Route
          path="/mixed-exam"
          element={

            <ProtectedRoute>

              <MixedExamPage/>

            </ProtectedRoute>

          }
        />

      </Routes>

    </BrowserRouter>

  );
}
