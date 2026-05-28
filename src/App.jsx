import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";

import Register from "./pages/Register";

import StudentDashboard
from "./pages/StudentDashboard";

import ExamPage
from "./pages/ExamPage";

import ProtectedRoute
from "./routes/ProtectedRoute";

import AdminRoute
from "./routes/AdminRoute";

import AdminPage
from "./pages/AdminPage";

import Subjects
from "./admin/Subjects";

import Topics
from "./admin/Topics";

import SubTopics
from "./admin/SubTopics";

import Questions
from "./admin/Questions";

import Exams
from "./admin/Exams";

import Results
from "./admin/Results";

import BulkImport
from "./admin/BulkImport";

import MockGeneratorPage
from "./admin/MockGeneratorPage";

import Profile
from "./pages/Profile";

import ResultPage
from "./pages/ResultPage";

import Leaderboard
from "./pages/Leaderboard";

import SmartEditPage from "./admin/Smartquestionedit";

export default function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* ================================= */}
        {/* AUTH */}
        {/* ================================= */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* ================================= */}
        {/* STUDENT */}
        {/* ================================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>

              <StudentDashboard />

            </ProtectedRoute>
          }
        />

        <Route
          path="/exam/:examId"
          element={
            <ProtectedRoute>

              <ExamPage />

            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>

              <Profile />

            </ProtectedRoute>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>

              <Leaderboard />

            </ProtectedRoute>
          }
        />

        <Route
          path="/result"
          element={
            <ProtectedRoute>

              <ResultPage />

            </ProtectedRoute>
          }
        />

        {/* ================================= */}
        {/* ADMIN DASHBOARD */}
        {/* ================================= */}

        <Route
          path="/admin"
          element={
            <AdminRoute>

              <AdminPage />

            </AdminRoute>
          }
        />

        {/* ================================= */}
        {/* SUBJECTS */}
        {/* ================================= */}

        <Route
          path="/admin/subjects"
          element={
            <AdminRoute>

              <Subjects />

            </AdminRoute>
          }
        />

        {/* ================================= */}
        {/* TOPICS */}
        {/* ================================= */}

        <Route
          path="/admin/topics"
          element={
            <AdminRoute>

              <Topics />

            </AdminRoute>
          }
        />

        {/* ================================= */}
        {/* SUB TOPICS */}
        {/* ================================= */}

        <Route
          path="/admin/subtopics"
          element={
            <AdminRoute>

              <SubTopics />

            </AdminRoute>
          }
        />

        {/* ================================= */}
        {/* QUESTIONS */}
        {/* ================================= */}

        <Route
          path="/admin/questions"
          element={
            <AdminRoute>

              <Questions />

            </AdminRoute>
          }
        />

        {/* ================================= */}
        {/* BULK IMPORT */}
        {/* ================================= */}

        <Route
          path="/admin/bulk-import"
          element={
            <AdminRoute>

              <BulkImport />

            </AdminRoute>
          }
        />

        {/* ================================= */}
        {/* MOCK GENERATOR */}
        {/* ================================= */}

        <Route
          path="/admin/mock-generator"
          element={
            <AdminRoute>

              <MockGeneratorPage />

            </AdminRoute>
          }
        />

        {/* ================================= */}
        {/* EXAMS */}
        {/* ================================= */}

        <Route
          path="/admin/exams"
          element={
            <AdminRoute>

              <Exams />

            </AdminRoute>
          }
        />

        {/* ================================= */}
        {/* RESULTS */}
        {/* ================================= */}

        <Route
          path="/admin/results"
          element={
            <AdminRoute>

              <Results />

            </AdminRoute>
          }
        />

        {/* ================================= */}
        {/* Smart question edit */}
        {/* ================================= */}


      
       <Route
  path="/admin/smartquestionedit"
  element={
    <AdminRoute>
      <Smartquestionedit />
    </AdminRoute>
  }
/>

      </Routes>

    </BrowserRouter>
  );
}
