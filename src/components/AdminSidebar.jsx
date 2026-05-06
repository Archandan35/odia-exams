import {
Link,
useLocation,
} from "react-router-dom";

export default function AdminSidebar(){

const location =
useLocation();

const menus = [

{
title:"Dashboard",
path:"/admin",
},

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
title:"Add Exam",
path:"/admin/exams",
},

{
title:"Results",
path:"/admin/results",
},

{
title:"Students",
path:"/admin/students",
},

];

return(

<div className="sidebar">

<div className="logo">

Odia Exam Admin

</div>

<div className="menu-title">
MAIN
</div>

<div className="menu">

{
menus.map((m)=>(

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

))
}

</div>

</div>

);

}
