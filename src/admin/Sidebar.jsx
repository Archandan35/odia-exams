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

Odia Exam
<br />
Admin

</div>

{/* MENU */}

<div className="menu">

{/* DASHBOARD */}

<div className="sidebar-group">

<div className="sidebar-group-title">
Dashboard
</div>

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

</div>

{/* ================================= */}
{/* ACADEMIC */}
{/* ================================= */}

<div className="sidebar-group">

<div className="sidebar-group-title">
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

{/* ================================= */}
{/* MOCK GENERATOR */}
{/* ================================= */}

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

</div>

{/* ================================= */}
{/* EXAMINATIONS */}
{/* ================================= */}

<div className="sidebar-group">

<div className="sidebar-group-title">
Examinations
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
Exams
</Link>

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

</div>

{/* ================================= */}
{/* USERS */}
{/* ================================= */}

<div className="sidebar-group">

<div className="sidebar-group-title">
Users
</div>

<Link
to="/profile"
className={
isActive(
"/profile"
)
? "active-link"
: ""
}
>
Profile
</Link>

</div>

</div>

</div>

);
}
