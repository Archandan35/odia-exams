import {
useEffect,
useState,
} from "react";

import {
collection,
onSnapshot,
} from "firebase/firestore";

import {
db,
} from "../firebase/config";

import {
useNavigate,
} from "react-router-dom";

import TopNavbar
from "../components/TopNavbar";

export default function StudentDashboard(){

const navigate =
useNavigate();

const [exams,
setExams] =
useState([]);

useEffect(()=>{

const unsub =
onSnapshot(
collection(db,"exams"),
(snapshot)=>{

const data =
snapshot.docs.map(
(doc)=>({
id:doc.id,
...doc.data(),
})
);

setExams(data);

}
);

return ()=>unsub();

},[]);

function getExamTitle(exam){

if(exam.examType === "mixed")
return "Mixed Exam";

if(exam.examType === "topic")
return "Topic Exam";

if(exam.examType === "subtopic")
return "SubTopic Exam";

return "Subject Exam";

}

return(

<div className="page">

<TopNavbar/>

<div className="page-header">

<div>

<h2>
Student Dashboard
</h2>

<p>
Available Exams
</p>

</div>

<div
style={{
display:"flex",
gap:"10px",
}}
>

<button
onClick={()=>
navigate("/leaderboard")
}
>
Leaderboard
</button>

<button
onClick={()=>
navigate("/profile")
}
>
My Profile
</button>

</div>

</div>

<div className="subject-grid">

{
exams.map((e)=>(

<div
key={e.id}
className="
subject-card
glass-card
"
>

<h3>
{e.name}
</h3>

<p>
{getExamTitle(e)}
</p>

<p>
Questions:
{" "}
{e.questionCount}
</p>

<p>
Duration:
{" "}
{e.duration} mins
</p>

<button
onClick={()=>
navigate(
`/exam/${e.id}`
)
}
>

Start Exam

</button>

</div>

))
}

</div>

</div>

);

}
