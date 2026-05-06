import {
useLocation,
useNavigate,
} from "react-router-dom";

import TopNavbar
from "../components/TopNavbar";

export default function ResultPage(){

const navigate =
useNavigate();

const location =
useLocation();

const result =
location.state;

if(!result){

return(

<div className="page">

<h2>
No Result Found
</h2>

</div>

);

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
Performance Summary
</p>

</div>

<button
onClick={()=>
navigate("/dashboard")
}
>

Back Dashboard

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
{result.timeTaken}s
</h1>

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

</tbody>

</table>

</div>

</div>

);

}
