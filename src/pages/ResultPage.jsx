import {
useLocation,
useNavigate,
} from "react-router-dom";

import {
useState,
} from "react";

import TopNavbar
from "../components/TopNavbar";

export default function ResultPage(){

const navigate =
useNavigate();

const location =
useLocation();

const result =
location.state;

const [showAnswers,
setShowAnswers] =
useState(false);

if(!result){

return(

<div className="page">

<h2>
No Result Found
</h2>

</div>

);

}

function formatTime(sec){

if(!sec)
return "00h 00m 00s";

const hrs =
Math.floor(sec / 3600);

const mins =
Math.floor(
(sec % 3600) / 60
);

const seconds =
sec % 60;

return `
${String(hrs).padStart(2,"0")}h
${String(mins).padStart(2,"0")}m
${String(seconds).padStart(2,"0")}s
`;

}

return(

<div className="page">

<TopNavbar/>

<div className="page-header">

<div>

<h2>
Exam Result
</h2>

<p>
Detailed Performance Analysis
</p>

</div>

<button
onClick={()=>
navigate("/dashboard")
}
>

Dashboard

</button>

</div>

<div className="dashboard-grid">

<div className="analytics-card">

<h3>
Score
</h3>

<h1>
{result.score}
</h1>

</div>

<div className="analytics-card">

<h3>
Correct
</h3>

<h1>
{result.correct}
</h1>

</div>

<div className="analytics-card">

<h3>
Wrong
</h3>

<h1>
{result.wrong}
</h1>

</div>

<div className="analytics-card">

<h3>
Accuracy
</h3>

<h1>
{result.accuracy}%
</h1>

</div>

<div className="analytics-card">

<h3>
Time Taken
</h3>

<h1>
{
formatTime(
result.timeTaken
)
}
</h1>

</div>

<div className="analytics-card">

<h3>
Unanswered
</h3>

<h1>
{result.unanswered}
</h1>

</div>

</div>

<div className="table-card">

<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"20px",
}}
>

<h3>
Question Review
</h3>

<button
onClick={()=>
setShowAnswers(
!showAnswers
)
}
>

{
showAnswers
?
"Hide Answers"
:
"Show Answers"
}

</button>

</div>

{
showAnswers && (

<div
style={{
display:"flex",
flexDirection:"column",
gap:"22px",
}}
>

{
result.questions?.map(
(q,index)=>{

const userAnswer =
result.answers?.[
q.id
];

let correctIndex = 0;

if(
q.correctAnswer !==
undefined
){

correctIndex =
Number(
q.correctAnswer
);

}else{

const map = {

A:0,
B:1,
C:2,
D:3,

};

correctIndex =
map[q.answer] || 0;

}

const isCorrect =
userAnswer ===
correctIndex;

return(

<div
key={q.id}
className="
question-review-card
"
>

<h3>

Q{index + 1}.

{" "}

{q.question}

</h3>

<div
className="
review-options
"
>

{
q.options?.map(
(op,i)=>(

<div
key={i}
className={`

review-option

${
i ===
correctIndex
?
"correct-option"
:
""
}

${
i ===
userAnswer &&
i !==
correctIndex
?
"wrong-option"
:
""
}

`}
>

<b>

{
String.fromCharCode(
65 + i
)
}) 

</b>

{op}

</div>

))
}

</div>

<p>

<b>
Correct Answer:
</b>

{" "}

{
String.fromCharCode(
65 + correctIndex
)
}

</p>

<p>

<b>
Your Answer:
</b>

{" "}

{
userAnswer !==
undefined
?
String.fromCharCode(
65 + userAnswer
)
:
"Not Answered"
}

</p>

<p>

<b>
Status:
</b>

{" "}

{
userAnswer ===
undefined
?
"Unanswered"
:
isCorrect
?
"Correct"
:
"Wrong"
}

</p>

{
q.explanation && (

<div
className="
explanation-box
"
>

<b>
Explanation:
</b>

{" "}

{q.explanation}

</div>

)
}

</div>

);

})
}

</div>

)
}

</div>

</div>

);

}
