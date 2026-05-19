import {
useEffect,
useState,
} from "react";

import {
collection,
query,
where,
onSnapshot,
} from "firebase/firestore";

import {
db,
auth,
} from "../firebase/config";

import {
useNavigate,
} from "react-router-dom";

import TopNavbar
from "../components/TopNavbar";

import {
ResponsiveContainer,
LineChart,
Line,
XAxis,
YAxis,
Tooltip,
BarChart,
Bar,
PieChart,
Pie,
Cell,
} from "recharts";

export default function Profile(){

const navigate =
useNavigate();

/* =========================================
STATE
========================================= */

const [results,
setResults] =
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

/* =========================================
LOAD RESULTS
========================================= */

useEffect(()=>{

if(!auth.currentUser)
return;

const q = query(
collection(db,"results"),
where(
"userId",
"==",
auth.currentUser.uid
)
);

const unsub =
onSnapshot(q,(snapshot)=>{

const data =
snapshot.docs.map(
(doc)=>({
id:doc.id,
...doc.data(),
})
);

data.sort(
(a,b)=>
b.createdAt -
a.createdAt
);

setResults(data);

});

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
collection(db,"subtopics"),
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
HELPERS
========================================= */

function getSubjectName(subjectId){

const subject =
subjects.find(
(s)=>s.id === subjectId
);

return (
subject?.name ||
subjectId ||
"-"
);

}

function getTopicName(topicId){

const topic =
topics.find(
(t)=>t.id === topicId
);

return (
topic?.name ||
topicId ||
"-"
);

}

function getSubTopicName(subTopicId){

const subTopic =
subTopics.find(
(s)=>s.id === subTopicId
);

return (
subTopic?.name ||
subTopicId ||
"-"
);

}

function formatDate(timestamp){

if(!timestamp)
return "-";

const d =
new Date(timestamp);

return d.toLocaleDateString();

}

function formatTime(sec){

if(!sec)
return "0s";

const mins =
Math.floor(sec / 60);

const seconds =
sec % 60;

return `${mins}m ${seconds}s`;

}

/* =========================================
ANALYTICS
========================================= */

const totalAttempts =
results.length;

const avgAccuracy =
results.length > 0
?
(
results.reduce(
(a,b)=>
a +
Number(
b.accuracy
),
0
)
/
results.length
).toFixed(2)
:
0;

const totalScore =
results.reduce(
(a,b)=>
a +
Number(
b.score
),
0
);

const bestScore =
results.length > 0
?
Math.max(
...results.map(
(r)=>
Number(r.score)
)
)
:
0;

/* =========================================
TREND DATA
========================================= */

const trendData =
results
.slice()
.reverse()
.map((r,index)=>({

attempt:
index + 1,

score:
Number(r.score),

accuracy:
Number(r.accuracy),

}));

/* =========================================
SUBJECT ANALYTICS
========================================= */

const subjectAnalytics =
Object.values(

results.reduce(
(acc,r)=>{

const subjectName =
getSubjectName(
r.subject
);

if(!acc[subjectName]){

acc[subjectName]={

subject:
subjectName,

score:0,

attempts:0,

};

}

acc[subjectName]
.score +=
Number(r.score);

acc[subjectName]
.attempts++;

return acc;

},{})

).map((s)=>({

subject:s.subject,

avgScore:
(
s.score /
s.attempts
).toFixed(2),

}));

/* =========================================
SUBJECT STATS
========================================= */

const subjectStats =
Object.values(

results.reduce((acc,r)=>{

const name =
getSubjectName(
r.subject
);

if(!acc[name]){

acc[name]={

name,
score:0,
attempts:0,

};

}

acc[name].score +=
Number(r.score);

acc[name].attempts++;

return acc;

},{})

);

/* =========================================
TOPIC STATS
========================================= */

const topicStats =
Object.values(

results.reduce((acc,r)=>{

const name =
getTopicName(
r.topicId
);

if(!acc[name]){

acc[name]={

name,
score:0,
attempts:0,

};

}

acc[name].score +=
Number(r.score);

acc[name].attempts++;

return acc;

},{})

);

/* =========================================
SUBTOPIC STATS
========================================= */

const subTopicStats =
Object.values(

results.reduce((acc,r)=>{

const name =
getSubTopicName(
r.subTopicId
);

if(!acc[name]){

acc[name]={

name,
score:0,
attempts:0,

};

}

acc[name].score +=
Number(r.score);

acc[name].attempts++;

return acc;

},{})

);

/* =========================================
CALCULATE
========================================= */

function getWeakStrong(data){

if(data.length === 0){

return {

weak:"-",
strong:"-",

};

}

const sorted =
[...data].sort(
(a,b)=>
(a.score/a.attempts) -
(b.score/b.attempts)
);

return{

weak:
sorted[0]?.name || "-",

strong:
sorted[
sorted.length - 1
]?.name || "-",

};

}

const subjectResult =
getWeakStrong(
subjectStats
);

const topicResult =
getWeakStrong(
topicStats
);

const subTopicResult =
getWeakStrong(
subTopicStats
);

const weakSubject =
subjectResult.weak;

const strongSubject =
subjectResult.strong;

const weakTopic =
topicResult.weak;

const strongTopic =
topicResult.strong;

const weakSubTopic =
subTopicResult.weak;

const strongSubTopic =
subTopicResult.strong;

/* =========================================
PIE DATA
========================================= */

const accuracyData = [

{
name:"Correct",
value:
results.reduce(
(a,b)=>
a +
Number(
b.correct || 0
),
0
),
},

{
name:"Wrong",
value:
results.reduce(
(a,b)=>
a +
Number(
b.wrong || 0
),
0
),
},

];

/* =========================================
UI
========================================= */

return(

<div className="page">

<TopNavbar/>

<div className="page-header">

<div>

<h2>
Student Analytics
</h2>

<p>
Advanced Performance Dashboard
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

{/* =========================================
TOP ANALYTICS
========================================= */}

<div className="dashboard-grid">

<div className="analytics-card">

<h3>
Attempts
</h3>

<h1>
{totalAttempts}
</h1>

</div>

<div className="analytics-card">

<h3>
Accuracy
</h3>

<h1>
{avgAccuracy}%
</h1>

</div>

<div className="analytics-card">

<h3>
Total Score
</h3>

<h1>
{totalScore}
</h1>

</div>

<div className="analytics-card">

<h3>
Best Score
</h3>

<h1>
{bestScore}
</h1>

</div>

</div>

{/* =========================================
AI INSIGHTS
========================================= */}

<div className="dashboard-grid">

<div className="analytics-card">

<h3>
Weak Subject
</h3>

<h2>
{weakSubject}
</h2>

</div>

<div className="analytics-card">

<h3>
Strong Subject
</h3>

<h2>
{strongSubject}
</h2>

</div>

<div className="analytics-card">

<h3>
Weak Topic
</h3>

<h2>
{weakTopic}
</h2>

</div>

<div className="analytics-card">

<h3>
Strong Topic
</h3>

<h2>
{strongTopic}
</h2>

</div>

<div className="analytics-card">

<h3>
Weak SubTopic
</h3>

<h2>
{weakSubTopic}
</h2>

</div>

<div className="analytics-card">

<h3>
Strong SubTopic
</h3>

<h2>
{strongSubTopic}
</h2>

</div>

</div>

{/* =========================================
CHARTS
========================================= */}

<div className="charts-grid">

<div className="chart-card">

<h3>
Performance Trend
</h3>

<ResponsiveContainer
width="100%"
height={300}
>

<LineChart
data={trendData}
>

<XAxis
dataKey="attempt"
/>

<YAxis />

<Tooltip />

<Line
type="monotone"
dataKey="score"
/>

</LineChart>

</ResponsiveContainer>

</div>

<div className="chart-card">

<h3>
Subject Performance
</h3>

<ResponsiveContainer
width="100%"
height={300}
>

<BarChart
data={
subjectAnalytics
}
>

<XAxis
dataKey="subject"
/>

<YAxis />

<Tooltip />

<Bar
dataKey="avgScore"
/>

</BarChart>

</ResponsiveContainer>

</div>

</div>

{/* =========================================
PIE CHART
========================================= */}

<div className="charts-grid">

<div className="chart-card">

<h3>
Accuracy Distribution
</h3>

<ResponsiveContainer
width="100%"
height={300}
>

<PieChart>

<Pie
data={
accuracyData
}
dataKey="value"
outerRadius={100}
label
>

{
accuracyData.map(
(
entry,
index
)=>(
<Cell
key={index}
/>
))
}

</Pie>

<Tooltip />

</PieChart>

</ResponsiveContainer>

</div>

</div>

{/* =========================================
ATTEMPT HISTORY
========================================= */}

<div className="table-card">

<h3>
Advanced Attempt History
</h3>

{
results.length === 0
?
(
<p
style={{
marginTop:"15px",
color:"#94a3b8",
}}
>

No exam attempts yet.

</p>
)
:
(
<table>

<thead>

<tr>

<th>
Date
</th>

<th>
Subject
</th>

<th>
Topic
</th>

<th>
SubTopic
</th>

<th>
Correct
</th>

<th>
Wrong
</th>

<th>
Score
</th>

<th>
Accuracy
</th>

<th>
Time
</th>

<th>
Warnings
</th>

<th>
Review
</th>

</tr>

</thead>

<tbody>

{
results.map((r)=>(

<tr key={r.id}>

<td>
{
formatDate(
r.createdAt
)
}
</td>

<td>
{
getSubjectName(
r.subject
)
}
</td>

<td>
{
getTopicName(
r.topicId
)
}
</td>

<td>
{
getSubTopicName(
r.subTopicId
)
}
</td>

<td>
{r.correct}
</td>

<td>
{r.wrong}
</td>

<td>
{r.score}
</td>

<td>
{r.accuracy}%
</td>

<td>
{
formatTime(
r.timeTaken
)
}
</td>

<td>
{
r.cheatCount || 0
}
</td>

<td>

<button
onClick={()=>{

navigate(
"/result",
{
state:r,
}
);

}}
>

Review

</button>

</td>

</tr>

))
}

</tbody>

</table>
)
}

</div>

</div>

);

}
