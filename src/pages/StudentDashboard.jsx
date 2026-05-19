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

/* =========================================
STATE
========================================= */

const [exams,
setExams] =
useState([]);

const [subjects,
setSubjects] =
useState([]);

const [topics,
setTopics] =
useState([]);

const [subTopics,
setSubTopics] =
useState([]);

const [selectedSubject,
setSelectedSubject] =
useState("");

const [selectedTopic,
setSelectedTopic] =
useState("");

const [selectedSubTopic,
setSelectedSubTopic] =
useState("");

/* =========================================
LOAD EXAMS
========================================= */

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

/* =========================================
LOAD SUBJECTS
========================================= */

useEffect(()=>{

const unsub =
onSnapshot(
collection(db,"subjects"),
(snapshot)=>{

const data =
snapshot.docs.map(
(doc)=>({
id:doc.id,
...doc.data(),
})
);

setSubjects(data);

}
);

return ()=>unsub();

},[]);

/* =========================================
LOAD TOPICS
========================================= */

useEffect(()=>{

const unsub =
onSnapshot(
collection(db,"topics"),
(snapshot)=>{

const data =
snapshot.docs.map(
(doc)=>({
id:doc.id,
...doc.data(),
})
);

setTopics(data);

}
);

return ()=>unsub();

},[]);

/* =========================================
LOAD SUBTOPICS
========================================= */

useEffect(()=>{

const unsub =
onSnapshot(
collection(db,"subTopics"),
(snapshot)=>{

const data =
snapshot.docs.map(
(doc)=>({
id:doc.id,
...doc.data(),
})
);

setSubTopics(data);

}
);

return ()=>unsub();

},[]);

/* =========================================
EXAM TITLE
========================================= */

function getExamTitle(exam){

if(exam.examType === "mixed")
return "Mixed Exam";

if(exam.examType === "topic")
return "Topic Exam";

if(exam.examType === "subtopic")
return "SubTopic Exam";

return "Subject Exam";

}

/* =========================================
FILTER EXAMS
========================================= */

const filteredExams =
exams.filter((exam)=>{

const subjectMatch =

!selectedSubject ||

exam.subjectId ===
selectedSubject;

const topicMatch =

!selectedTopic ||

exam.topicId ===
selectedTopic;

const subTopicMatch =

!selectedSubTopic ||

exam.subTopicId ===
selectedSubTopic;

return (
subjectMatch &&
topicMatch &&
subTopicMatch
);

});

/* =========================================
UI
========================================= */

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

{/* =========================================
FILTER SECTION
========================================= */}

<div className="filter-grid">

<select
value={selectedSubject}
onChange={(e)=>{

setSelectedSubject(
e.target.value
);

setSelectedTopic("");
setSelectedSubTopic("");

}}
className="filter-select"
>

<option value="">
All Subject
</option>

{
subjects.map((subject)=>(

<option
key={subject.id}
value={subject.id}
>

{subject.name}

</option>

))
}

</select>

<select
value={selectedTopic}
onChange={(e)=>{

setSelectedTopic(
e.target.value
);

setSelectedSubTopic("");

}}
className="filter-select"
>

<option value="">
All Topic
</option>

{
topics
.filter((topic)=>
!selectedSubject ||
topic.subjectId ===
selectedSubject
)
.map((topic)=>(

<option
key={topic.id}
value={topic.id}
>

{topic.name}

</option>

))
}

</select>

<select
value={selectedSubTopic}
onChange={(e)=>
setSelectedSubTopic(
e.target.value
)
}
className="filter-select"
>

<option value="">
All SubTopic
</option>

{
subTopics
.filter((sub)=>
(
!selectedTopic ||
sub.topicId ===
selectedTopic
)
)
.map((sub)=>(

<option
key={sub.id}
value={sub.id}
>

{sub.name}

</option>

))
}

</select>

</div>

{/* =========================================
EXAM GRID
========================================= */}

<div className="subject-grid">

{
filteredExams.length > 0
?
(
filteredExams.map((e)=>(

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
)
:
(
<div
style={{
padding:"40px",
fontSize:"20px",
fontWeight:"600",
}}
>

No Exams Found

</div>
)
}

</div>

</div>

);

}
