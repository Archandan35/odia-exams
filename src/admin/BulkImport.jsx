import { useState } from "react";

import AdminLayout from "./AdminLayout";

export default function BulkImport(){

const [loading] = useState(false);

return(

<AdminLayout>

<div className="page">

<div className="page-header">

<div>

<h2>Bulk Import</h2>

<p>
Import questions from CSV, Excel,
JSON, PDF or Image
</p>

</div>

<button>
Help & Format Guide
</button>

</div>

<div className="import-grid">

<div className="import-card">

<div>

<h3>CSV Upload</h3>

<p>
Upload .csv file
<br />
Hint: question, optionA, optionB...
</p>

</div>

<input
type="file"
accept=".csv"
/>

</div>

<div className="import-card">

<div>

<h3>Excel Upload</h3>

<p>
Upload .xlsx or .xls file
<br />
Same format as CSV
</p>

</div>

<input
type="file"
accept=".xlsx,.xls"
/>

</div>

<div className="import-card">

<div>

<h3>JSON Upload</h3>

<p>
Upload .json file
<br />
Array of questions format
</p>

</div>

<input
type="file"
accept=".json"
/>

</div>

<div className="import-card">

<div>

<h3>PDF Upload (OCR)</h3>

<p>
Extract questions from PDF
<br />
Auto detect questions
</p>

</div>

<input
type="file"
accept=".pdf"
/>

</div>

<div className="import-card">

<div>

<h3>Image Upload (OCR)</h3>

<p>
Upload JPG or PNG image
<br />
Auto detect questions
</p>

</div>

<input
type="file"
accept="image/*"
/>

</div>

</div>

<div className="glass-card">

<div className="filter-bar">

<select>
<option>Select Subject</option>
</select>

<select>
<option>Select Topic</option>
</select>

<select>
<option>Select Sub Topic</option>
</select>

</div>

</div>

<div
className="table-card"
style={{marginTop:"18px"}}
>

<div className="page-header">

<h2>Parsed Questions</h2>

<button
className="submit-btn"
disabled={loading}
>

Import to Firestore

</button>

</div>

<table>

<thead>

<tr>

<th>#</th>
<th>Question</th>
<th>Option A</th>
<th>Option B</th>
<th>Option C</th>
<th>Option D</th>
<th>Correct</th>
<th>Difficulty</th>
<th>Language</th>
<th>Explanation</th>

</tr>

</thead>

<tbody>

<tr>

<td>1</td>

<td>
What is 5 + 7 ?
</td>

<td>10</td>
<td>11</td>
<td>12</td>
<td>13</td>

<td>C</td>

<td>Easy</td>

<td>English</td>

<td>
5 + 7 = 12
</td>

</tr>

</tbody>

</table>

</div>

</div>

</AdminLayout>

);

}
