import {
Link,
useLocation,
} from "react-router-dom";

export default function AdminSidebar(){

const location =
useLocation();

const academicMenus = [

{
title:"Subjects",
path:"/admin/subjects",
},

{
title:"Topics",
path:"/admin/topics",
},

{
title:"Sub Topics",
path:"/admin/subtopics",
},

{
title:"Questions",
path:"/admin/questions",
},

{
title:"Smart Question Edit",
path:"/admin/smartquestionedit",
},

{
title:"Bulk Import",
path:"/admin/bulk-import",
},

/* ================================= */
/* MOCK GENERATOR */
/* ================================= */

{
title:"Mock Generator",
path:"/admin/mock-generator",
},

];

const examMenus = [

{
title:"Exams",
path:"/admin/exams",
},

{
title:"Results",
path:"/admin/results",
},

];

const userMenus = [

{
title:"Profile",
path:"/profile",
},

];

function renderMenus(menus){

return menus.map((m)=>(

<Link
key={m.path}
to={m.path}
className={
location.pathname ===
m.path
?
"active-link"
:
""
}
>

{m.title}

</Link>

));

}

return(

<div className="sidebar">

{/* LOGO */}

<div className="logo">

Odia Exam
<br />
Admin

</div>

{/* ================================= */}
{/* DASHBOARD */}
{/* ================================= */}

<div className="sidebar-group">

<div className="sidebar-group-title">

Dashboard

</div>

<div className="menu">

<Link
to="/admin"
className={
location.pathname ===
"/admin"
?
"active-link"
:
""
}
>

Dashboard

</Link>

</div>

</div>

{/* ================================= */}
{/* ACADEMIC */}
{/* ================================= */}

<div className="sidebar-group">

<div className="sidebar-group-title">

Academic

</div>

<div className="menu">

{
renderMenus(
academicMenus
)
}

</div>

</div>

{/* ================================= */}
{/* EXAMINATIONS */}
{/* ================================= */}

<div className="sidebar-group">

<div className="sidebar-group-title">

Examinations

</div>

<div className="menu">

{
renderMenus(
examMenus
)
}

</div>

</div>

{/* ================================= */}
{/* USERS */}
{/* ================================= */}

<div className="sidebar-group">

<div className="sidebar-group-title">

Users

</div>

<div className="menu">

{
renderMenus(
userMenus
)
}

</div>

</div>

</div>

);

}
