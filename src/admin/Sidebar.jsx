import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="sidebar">

      <div className="logo">
        Odia Exam Admin
      </div>

      <div className="menu">

        <Link to="/admin">
          Dashboard
        </Link>

        <div className="menu-title">
          Academic
        </div>

        <Link to="/admin/subjects">
          Subjects
        </Link>

        <Link to="/admin/topics">
          Topics
        </Link>

        <Link to="/admin/subtopics">
          Sub Topics
        </Link>

        <Link to="/admin/questions">
          Questions
        </Link>

        <div className="menu-title">
          Exams
        </div>

        <Link to="/admin/exams">
          Add Exam
        </Link>

        <div className="menu-title">
          Management
        </div>

        <Link to="/admin/results">
          Results
        </Link>

        <Link to="/admin/students">
          Students
        </Link>

        <Link to="/admin/users">
          Users
        </Link>

      </div>
    </div>
  );
}
