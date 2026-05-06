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

export default function Profile() {

const [results,setResults] =
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

setResults(data);

});

return ()=>unsub();

},[]);

const totalAttempts =
results.length;

const averageAccuracy =
results.length > 0
? (
results.reduce(
(sum,r)=>
sum +
Number(r.accuracy),
0
)
/
results.length
).toFixed(2)
: 0;

const totalScore =
results.reduce(
(sum,r)=>
sum +
Number(r.score),
0
);

return(

<div className="page">

<div className="page-header">

<div>

<h2>
Student Profile
</h2>

<p>
Welcome back
</p>

</div>

</div>

<div className="dashboard-grid">

<div className="analytics-card">

<h3>
Total Attempts
</h3>

<h1>
{totalAttempts}
</h1>

</div>

<div className="analytics-card">

<h3>
Average Accuracy
</h3>

<h1>
{averageAccuracy}%
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

</div>

<div className="table-card">

<h3>
Attempt History
</h3>

<table>

<thead>

<tr>

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

</tr>

</thead>

<tbody>

{
results.map((r)=>(

<tr key={r.id}>

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

</tr>

))
}

</tbody>

</table>

</div>

</div>

);

}
