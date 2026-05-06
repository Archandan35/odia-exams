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

import SubTopics from "./admin/SubTopics";

import Questions from "./admin/Questions";

import Exams from "./admin/Exams";

import Profile from "./pages/Profile";

import Results from "./admin/Results";

import ResultPage from "./pages/ResultPage";
import Leaderboard from "./pages/Leaderboard";

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
          path="/exam/:examId"
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
  path="/admin/subtopics"
  element={
    <AdminRoute>
      <SubTopics />
    </AdminRoute>
  }
/>

        <Route
  path="/admin/questions"
  element={
    <AdminRoute>
      <Questions />
    </AdminRoute>
  }
/>

<Route
  path="/admin/exams"
  element={
    <AdminRoute>
      <Exams />
    </AdminRoute>
  }
/>
        <Route
  path="/admin/results"
  element={
    <AdminRoute>
      <Results />
    </AdminRoute>
  }
/>

        <Route
path="/profile"
element={
<ProtectedRoute>
<Profile/>
</ProtectedRoute>
}
/>
        <Route
path="/leaderboard"
element={
<ProtectedRoute>
<Leaderboard/>
</ProtectedRoute>
}
/>
        
        <Route
path="/result"
element={
<ProtectedRoute>
<ResultPage/>
</ProtectedRoute>
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
