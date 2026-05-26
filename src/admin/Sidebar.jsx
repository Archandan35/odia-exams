import {
  Link,
  useLocation,
} from "react-router-dom";

export default function Sidebar() {

  const location =
    useLocation();

  function isActive(path){

    return (
      location.pathname === path
    );
  }

  return (

    <div className="sidebar">

      {/* LOGO */}

      <div className="logo">

        Odia Exam Admin

      </div>

      {/* MENU */}

      <div className="menu">

        {/* DASHBOARD */}

        <Link
          to="/admin"
          className={
            isActive("/admin")
              ? "active-link"
              : ""
          }
        >
          Dashboard
        </Link>

        {/* ================================= */}
        {/* ACADEMIC */}
        {/* ================================= */}

        <div className="menu-title">
          Academic
        </div>

        <Link
          to="/admin/subjects"
          className={
            isActive(
              "/admin/subjects"
            )
              ? "active-link"
              : ""
          }
        >
          Subjects
        </Link>

        <Link
          to="/admin/topics"
          className={
            isActive(
              "/admin/topics"
            )
              ? "active-link"
              : ""
          }
        >
          Topics
        </Link>

        <Link
          to="/admin/subtopics"
          className={
            isActive(
              "/admin/subtopics"
            )
              ? "active-link"
              : ""
          }
        >
          Sub Topics
        </Link>

        <Link
          to="/admin/questions"
          className={
            isActive(
              "/admin/questions"
            )
              ? "active-link"
              : ""
          }
        >
          Questions
        </Link>

        <Link
          to="/admin/bulk-import"
          className={
            isActive(
              "/admin/bulk-import"
            )
              ? "active-link"
              : ""
          }
        >
          Bulk Import
        </Link>

        <Link
          to="/admin/mock-generator"
          className={
            isActive(
              "/admin/mock-generator"
            )
              ? "active-link"
              : ""
          }
        >
          Mock Generator
        </Link>

        {/* ================================= */}
        {/* EXAMS */}
        {/* ================================= */}

        <div className="menu-title">
          Exams
        </div>

        <Link
          to="/admin/exams"
          className={
            isActive(
              "/admin/exams"
            )
              ? "active-link"
              : ""
          }
        >
          Manage Exams
        </Link>

        {/* ================================= */}
        {/* MANAGEMENT */}
        {/* ================================= */}

        <div className="menu-title">
          Management
        </div>

        <Link
          to="/admin/results"
          className={
            isActive(
              "/admin/results"
            )
              ? "active-link"
              : ""
          }
        >
          Results
        </Link>

        <Link
          to="/admin/students"
          className={
            isActive(
              "/admin/students"
            )
              ? "active-link"
              : ""
          }
        >
          Students
        </Link>

        <Link
          to="/admin/users"
          className={
            isActive(
              "/admin/users"
            )
              ? "active-link"
              : ""
          }
        >
          Users
        </Link>

      </div>

    </div>
  );
}
