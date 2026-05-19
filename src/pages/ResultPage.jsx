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

const [currentQuestion,
setCurrentQuestion] =
useState(0);

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

const questions =
result.questions || [];

const current =
questions[currentQuestion];

const userAnswer =
result.answers?.[
current?.id
];

const map = {

A:0,
B:1,
C:2,
D:3,

};

let correctIndex = 0;

if(
typeof current?.correctAnswer ===
"number"
){

correctIndex =
current.correctAnswer;

}
else if(
typeof current?.correctAnswer ===
"string"
){

correctIndex =
map[
current.correctAnswer
?.trim()
?.toUpperCase()
] ?? 0;

}
else{

correctIndex =
map[
current?.answer
] || 0;

}

const isCorrect =
userAnswer ===
correctIndex;

function getQuestionStatus(q){

const answer =
result.answers?.[
q.id
];

let cIndex = 0;

if(
typeof q.correctAnswer ===
"number"
){

cIndex =
q.correctAnswer;

}
else if(
typeof q.correctAnswer ===
"string"
){

cIndex =
map[
q.correctAnswer
?.trim()
?.toUpperCase()
] ?? 0;

}

if(answer === undefined){

return "unanswered";

}

if(answer === cIndex){

return "correct";

}

return "wrong";

}

return(

<div className="page">

<TopNavbar/>

<div className="review-topbar">

<div>

<h2>
Exam Review
</h2>

<p>
Detailed Performance Analysis
</p>

</div>

<div className="review-actions">

<button
onClick={()=>
navigate("/analysis",{
state:result,
})
}
>

Analysis

</button>

<button
className="submit-btn"
onClick={()=>
navigate("/exam",{
state:{
reAttempt:true,
questions:
result.questions,
},
})
}
>

Reattempt

</button>

<button
onClick={()=>
navigate("/dashboard")
}
>

Dashboard

</button>

</div>

</div>

<div className="review-stat-grid">

<div className="review-stat-card">

<h4>
Time Taken
</h4>

<h2>

{
formatTime(
result.timeTaken
)
}

</h2>

</div>

<div className="review-stat-card">

<h4>
Correct
</h4>

<h2>
{result.correct}
</h2>

</div>

<div className="review-stat-card">

<h4>
Incorrect
</h4>

<h2>
{result.wrong}
</h2>

</div>

<div className="review-stat-card">

<h4>
Accuracy
</h4>

<h2>
{result.accuracy}%
</h2>

</div>

<div className="review-stat-card">

<h4>
Level
</h4>

<h2>

{
current?.difficulty ||
"Easy"
}

</h2>

</div>

</div>

<div className="review-layout">

<div className="review-main">

<div className="review-question-card">

<div className="review-question-header">

<div
className="
review-question-badge
"
>

Q.
{currentQuestion + 1}

</div>

<div
className="
review-question-text
"
>

{current?.question}

</div>

</div>

<div className="review-options">

{
current?.options?.map(
(op,i)=>{

const isUser =
i === userAnswer;

const isCorrectOption =
i === correctIndex;

return(

<div
key={i}
className={`

review-option-card

${
isCorrectOption
?
"review-correct"
:
""
}

${
isUser &&
!isCorrectOption
?
"review-wrong"
:
""
}

${
isUser
?
"review-selected"
:
""
}

`}
>

<div
className="
review-option-label
"
>

{
String.fromCharCode(
65 + i
)
}.

</div>

<div
className="
review-option-text
"
>

{op}

</div>

{
isUser && (

<div
className="
answer-tag
"
>

Your Answer

</div>

)
}

{
isCorrectOption && (

<div
className="
answer-tag correct-tag
"
>

Correct

</div>

)
}

</div>

);

})
}

</div>

<div className="review-answer-box">

<p>

<strong>
Correct Answer:
</strong>

{" "}

{
String.fromCharCode(
65 + correctIndex
)
}

</p>

<p>

<strong>
Your Answer:
</strong>

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

<strong>
Status:
</strong>

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

</div>

{
current?.explanation && (

<div
className="
review-explanation
"
>

<h4>
Explanation
</h4>

<p>

{
current.explanation
}

</p>

</div>

)
}

<div className="review-navigation">

<button
className="
review-nav-btn
"
disabled={
currentQuestion === 0
}
onClick={()=>
setCurrentQuestion(
prev => prev - 1
)
}
>

← Previous Question

</button>

<div
className="
review-question-count
"
>

{
currentQuestion + 1
}

/

{
questions.length
}

</div>

<button
className="
review-nav-btn
"
disabled={
currentQuestion ===
questions.length - 1
}
onClick={()=>
setCurrentQuestion(
prev => prev + 1
)
}
>

Next Question →

</button>

</div>

</div>

</div>

<div className="review-sidebar">

<h3>
Questions
</h3>

<div className="review-legend">

<div
className="
review-legend-item
"
>

<div
className="
review-dot
review-palette-correct
"
></div>

Answered

</div>

<div
className="
review-legend-item
"
>

<div
className="
review-dot
review-palette-wrong
"
></div>

Incorrect

</div>

<div
className="
review-legend-item
"
>

<div
className="
review-dot
review-palette-unanswered
"
></div>

Unanswered

</div>

</div>

<div className="review-palette">

{
questions.map(
(q,index)=>{

const status =
getQuestionStatus(q);

return(

<button
key={q.id}
onClick={()=>
setCurrentQuestion(
index
)
}
className={`

review-palette-btn

${
status ===
"correct"
?
"review-palette-correct"
:
""
}

${
status ===
"wrong"
?
"review-palette-wrong"
:
""
}

${
status ===
"unanswered"
?
"review-palette-unanswered"
:
""
}

${
currentQuestion ===
index
?
"review-current"
:
""
}

`}
>

{index + 1}

</button>

);

})
}

</div>

</div>

</div>

</div>

);

}
