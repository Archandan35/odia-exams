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

export default function StudentDashboard(){

const nav = useNavigate();

const [questions,
setQuestions] =
useState([]);

const [subjects,
setSubjects] =
useState([]);

const [questionCount,
setQuestionCount] =
useState(10);

useEffect(()=>{

const unsub = onSnapshot(
collection(db,"questions"),
(snapshot)=>{

const data =
snapshot.docs.map((d)=>(
{
id:d.id,
...d.data(),
}
));

setQuestions(data);

const grouped = {};

data.forEach((q)=>{

if(!grouped[q.subject]){

grouped[q.subject]={
questions:0,
topics:new Set(),
};

}

grouped[q.subject]
.questions++;

grouped[q.subject]
.topics.add(q.topic);

});

const arr =
Object.entries(grouped)
.map(([subject,val])=>(
{
subject,
questions:val.questions,
topics:val.topics.size,
}
));

setSubjects(arr);

}
);

return ()=>unsub();

},[]);

function openSubject(subject){

nav(
`/subject/${encodeURIComponent(subject)}`
);

}

return(

<div className="subject-card glass-card">

<h1>
Mock Test Dashboard
</h1>

<div className="card">

<h3>
Choose Question Count
</h3>

<input
value={questionCount}
type="number"
onChange={(e)=>
setQuestionCount(
e.target.value
)
}
/>

</div>

<div className="grid">

{subjects.map((s,index)=>(

<div
key={index}
className="subject-card"
>

<h2>
{s.subject}
</h2>

<p>
Topics: {s.topics}
</p>

<p>
Questions: {s.questions}
</p>

<button
onClick={()=>
openSubject(
s.subject
)
}
>
Open Subject
</button>

</div>

))}

</div>

</div>
);
}
