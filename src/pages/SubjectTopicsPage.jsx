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
useParams,
} from "react-router-dom";

export default function SubjectTopicsPage(){

const { subject } =
useParams();

const nav = useNavigate();

const [topics,
setTopics] =
useState([]);

const [questionCount,
setQuestionCount] =
useState(10);

useEffect(()=>{

const unsub = onSnapshot(
collection(db,"questions"),
(snapshot)=>{

const data =
snapshot.docs
.map((d)=>(
{
id:d.id,
...d.data(),
}
))
.filter((q)=>
q.subject === subject
);

const grouped = {};

let total = 0;

data.forEach((q)=>{

if(!grouped[q.topic]){

grouped[q.topic]=0;

}

grouped[q.topic]++;
total++;

});

const arr =
Object.entries(grouped)
.map(([topic,count])=>(
{
topic,
count,
}
));

setTopics(arr);

}
);

return ()=>unsub();

},[subject]);

function startTopicTest(topic){

nav(
`/exam/${encodeURIComponent(subject)}?topic=${encodeURIComponent(topic)}&count=${questionCount}`
);

}

function startMixedSubjectTest(){

nav(
`/exam/${encodeURIComponent(subject)}?mixed=true&count=${questionCount}`
);

}

return(

<div className="page">

<h1>
{subject}
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

<div className="card">

<h2>
Full Mixed Topic Test
</h2>

<p>
Questions will come from all topics of {subject}
</p>

<button
onClick={startMixedSubjectTest}
>
Start Mixed Test
</button>

</div>

<div className="grid">

{topics.map((t,index)=>(

<div
key={index}
className="subject-card"
>

<h2>
{t.topic}
</h2>

<p>
Questions: {t.count}
</p>

<button
onClick={()=>
startTopicTest(
t.topic
)
}
>
Start Topic Test
</button>

</div>

))}

</div>

</div>
);
}
