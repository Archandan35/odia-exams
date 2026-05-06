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

const [results,
setResults] =
useState([]);

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

/* PERFORMANCE TREND */

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

/* SUBJECT ANALYTICS */

const subjectAnalytics =
Object.values(

results.reduce(
(acc,r)=>{

if(!acc[r.subject]){

acc[r.subject]={

subject:r.subject,

score:0,

attempts:0,

};

}

acc[r.subject]
.score +=
Number(r.score);

acc[r.subject]
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

/* AI INSIGHTS */

let weakSubject =
"-";

let strongSubject =
"-";

if(subjectAnalytics.length > 0){

const sorted =
[...subjectAnalytics]
.sort(
(a,b)=>
a.avgScore -
b.avgScore
);

weakSubject =
sorted[0]?.subject;

strongSubject =
sorted[
sorted.length - 1
]?.subject;

}

/* PIE */

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
Study Insight
</h3>

<p>

Focus more on
{" "}
<b>
{weakSubject}
</b>

{" "}
for better overall ranking.

</p>

</div>

</div>

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
{r.subject}
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
