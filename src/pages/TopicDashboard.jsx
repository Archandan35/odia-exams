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

export default function TopicDashboard(){

const nav = useNavigate();

const [questions,
setQuestions] =
useState([]);

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
snapshot.docs.map((d)=>(
{
id:d.id,
...d.data(),
}
));

setQuestions(data);

const grouped = {};

data.forEach((q)=>{

if(!grouped[q.topic]){

grouped[q.topic] = 0;

}

grouped[q.topic]++;

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

},[]);

function startTopicTest(topic){

nav(
`/exam/${encodeURIComponent(topic)}?count=${questionCount}`
);

}

function startMixedTest(){

nav(
`/mixed-exam?count=${questionCount}`
);

}

return(

<div className="page">

<h1>
Topic Wise Mock Tests
</h1>

<div className="card">

<h3>
Choose Number of Questions
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

<h2>
Topics
</h2>

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
Questions:
{t.count}
</p>

<button
onClick={()=>
startTopicTest(
t.topic
)
}
>
Start Test
</button>

</div>

))}

</div>

<div className="card">

<h2>
Mixed Mock Test
</h2>

<p>
Questions from all topics randomly.
</p>

<button
onClick={startMixedTest}
>
Start Mixed Test
</button>

</div>

</div>
);
}
