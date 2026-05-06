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

/* PERFORMANCE MESSAGE */

function getPerformanceMessage(){

const accuracy =
Number(
result.accuracy || 0
);

if(accuracy >= 90){

return "Outstanding Performance";

}

if(accuracy >= 75){

return "Very Good Performance";

}

if(accuracy >= 60){

return "Good Attempt";

}

if(accuracy >= 40){

return "Needs Improvement";

}

return "Practice More";

}

/* TIME FORMAT */

function formatTime(sec){

if(!sec)
return "0m 0s";

const hrs =
Math.floor(sec / 3600);

const mins =
Math.floor(
(sec % 3600) / 60
);

const seconds =
sec % 60;

if(hrs > 0){

return `${hrs}h ${mins}m ${seconds}s`;

}

return `${mins}m ${seconds}s`;

}

/* AI INSIGHT */

function getInsight(){

const accuracy =
Number(
result.accuracy || 0
);

if(accuracy < 40){

return `
Focus on concept clarity and
solve easier questions first.
`;

}

if(accuracy < 70){

return `
Practice medium difficulty
questions daily for improvement.
`;

}

return `
You are performing well.
Focus on speed optimization.
`;

}

return(

<div className="page">

<TopNavbar/>

<div className="page-header">

<div>

<h2>
Advanced Result Analysis
</h2>

<p>
Detailed Exam Insights
</p>

</div>

<div
style={{
display:"flex",
gap:"12px",
flexWrap:"wrap",
}}
>

<button
onClick={()=>
navigate("/dashboard")
}
>

Dashboard

</button>

<button
onClick={()=>
navigate("/leaderboard")
}
>

Leaderboard

</button>

</div>

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
Unanswered
</h3>

<h1>
{result.unanswered}
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

</div>

<div className="dashboard-grid">

<div className="analytics-card">

<h3>
Performance Level
</h3>

<h2>
{
getPerformanceMessage()
}
</h2>

</div>

<div className="analytics-card">

<h3>
Cheat Warnings
</h3>

<h1>
{
result.cheatCount || 0
}
</h1>

</div>

<div className="analytics-card">

<h3>
AI Insight
</h3>

<p>
{
getInsight()
}
</p>

</div>

</div>

<div className="table-card">

<h3>
Result Summary
</h3>

<table>

<tbody>

<tr>
<td>Total Questions</td>
<td>
{result.totalQuestions}
</td>
</tr>

<tr>
<td>Correct</td>
<td>
{result.correct}
</td>
</tr>

<tr>
<td>Wrong</td>
<td>
{result.wrong}
</td>
</tr>

<tr>
<td>Unanswered</td>
<td>
{result.unanswered}
</td>
</tr>

<tr>
<td>Score</td>
<td>
{result.score}
</td>
</tr>

<tr>
<td>Accuracy</td>
<td>
{result.accuracy}%
</td>
</tr>

<tr>
<td>Time Taken</td>
<td>
{
formatTime(
result.timeTaken
)
}
</td>
</tr>

<tr>
<td>Warnings</td>
<td>
{
result.cheatCount || 0
}
</td>
</tr>

</tbody>

</table>

</div>

<div className="table-card">

<div
style={{
display:"flex",
justifyContent:
"space-between",
alignItems:"center",
}}
>

<h3>
Answer Review
</h3>

<button
onClick={()=>{

setShowAnswers(
!showAnswers
);

}}
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
showAnswers
?
(
result.questions?.length > 0
?
(
<div
style={{
marginTop:"20px",
display:"flex",
flexDirection:"column",
gap:"20px",
}}
>

{
result.questions.map(
(q,index)=>{

const userAnswer =
result.answers?.[
index
];

const correct =
userAnswer ===
q.correctAnswer;

return(

<div
key={index}
className="
question-review-card
"
>

<h4>

Q{index + 1}.
{" "}
{q.question}

</h4>

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
q.correctAnswer
?
"correct-option"
:
""
}

${
i ===
userAnswer &&
i !==
q.correctAnswer
?
"wrong-option"
:
""
}
`}
>

{
["A","B","C","D"][i]
}.

{" "}

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
["A","B","C","D"][
q.correctAnswer
]
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
["A","B","C","D"][
userAnswer
]
:
"Not Answered"
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
:
(
<p
style={{
marginTop:"15px",
}}
>

Detailed answer review
not available.

</p>
)
)
:
null
}

</div>

<div className="dashboard-grid">

<button
onClick={()=>
navigate("/dashboard")
}
>

Back Dashboard

</button>

<button
onClick={()=>
navigate("/leaderboard")
}
>

View Leaderboard

</button>

<button
onClick={()=>
window.print()
}
>

Print Result

</button>

</div>

</div>

);

}
