import {
useEffect,
useState,
} from "react";

import {
useParams,
} from "react-router-dom";

import {
collection,
getDocs,
} from "firebase/firestore";

import {
db,
} from "../firebase/config";

export default function ExamPage(){

const { subject } =
useParams();

const [questions,
setQuestions] =
useState([]);

const [current,
setCurrent] =
useState(0);

const [answers,
setAnswers] =
useState({});

const [timeLeft,
setTimeLeft] =
useState(3600);

useEffect(()=>{

async function load(){

const params =
new URLSearchParams(
window.location.search
);

const topic =
params.get("topic");

const mixed =
params.get("mixed");

const count =
parseInt(
params.get("count")
|| 10
);

const snapshot =
await getDocs(
collection(db,"questions")
);

let data =
snapshot.docs.map((d)=>(
{
id:d.id,
...d.data(),
}
));

if(topic){

data = data.filter((q)=>
q.subject === subject
&&
q.topic === topic
);
}

else if(mixed){

data = data.filter((q)=>
q.subject === subject
);
}

else{

data = data.filter((q)=>
q.subject === subject
);
}

// shuffle

data = data.sort(()=>
Math.random()-0.5
);

setQuestions(
data.slice(0,count)
);

}

load();

},[subject]);

useEffect(()=>{

const interval =
setInterval(()=>{

setTimeLeft((prev)=>{

if(prev <= 0){

clearInterval(interval);
return 0;

}

return prev - 1;

});

},1000);

return()=>clearInterval(interval);

},[]);

function formatTime(seconds){

const hrs =
Math.floor(seconds/3600);

const mins =
Math.floor(
(seconds%3600)/60
);

const secs =
seconds%60;

return `
${String(hrs)
.padStart(2,"0")}h
${String(mins)
.padStart(2,"0")}m
${String(secs)
.padStart(2,"0")}s
`;

}

function selectAnswer(id,opt){

setAnswers((prev)=>(
{
...prev,
[id]:opt,
}
));

}

const q =
questions[current];

return(

<div className="exam-layout">

<div className="exam-main">

<div className="topbar">

<h2>
{subject}
</h2>

<h2>
⏳ {formatTime(timeLeft)}
</h2>

</div>

{q && (

<div className="card">

<h3>
Question {current+1}
</h3>

<h2>
{q.question}
</h2>

<div className="option-line">

{q.options?.map((o,index)=>(

<label
key={index}
className="option"
>

<input
type="radio"
checked={
answers[q.id] === o
}
onChange={()=>
selectAnswer(
q.id,
o
)
}
/>

{o}

</label>

))}

</div>

<div
style={{
display:"flex",
gap:"10px",
marginTop:"20px",
}}
>

<button
onClick={()=>
setCurrent(
Math.max(current-1,0)
)
}
>
Previous
</button>

<button
onClick={()=>
setCurrent(
Math.min(
current+1,
questions.length-1
)
)
}
>
Save & Next
</button>

</div>

</div>

)}

</div>

<div className="navigator">

<h3>
Questions
</h3>

<div className="palette-grid">

{questions.map((item,index)=>(

<button
key={item.id}
className="palette-btn"
onClick={()=>
setCurrent(index)
}
>
{index+1}
</button>

))}

</div>

</div>

</div>
);
}
