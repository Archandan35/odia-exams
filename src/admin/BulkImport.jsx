import React from "react";

import AdminLayout from "./AdminLayout";

export default function BulkImport(){

return(

<AdminLayout>

<div className="bulk-page">

<div className="bulk-topbar">

<div>

<h1>
Bulk Import
</h1>

<p>
Import questions from CSV, Excel, JSON, PDF or Image
</p>

</div>

<button className="help-btn">

? Help & Format Guide

</button>

</div>

<div className="upload-grid">

<div className="upload-card">

<h3>
CSV Upload
</h3>

<p>
Upload .csv file
</p>

<small>
Hint:
question,
optionA,
optionB,
optionC,
optionD,
correctAnswer(A/B/C/D or 0/1/2/3),
difficulty,
language,
explanation
</small>

<input
type="file"
accept=".csv"
/>

</div>

<div className="upload-card">

<h3>
Excel Upload
</h3>

<p>
Upload .xlsx file
</p>

<small>
Hint:
Same format as CSV
</small>

<input
type="file"
accept=".xlsx,.xls"
/>

</div>

<div className="upload-card">

<h3>
JSON Upload
</h3>

<p>
Upload .json file
</p>

<small>
Hint:
Array of question objects
</small>

<input
type="file"
accept=".json"
/>

</div>

<div className="upload-card">

<h3>
PDF Upload (OCR)
</h3>

<p>
Extract questions from PDF
</p>

<small>
Auto detect questions & options
</small>

<input
type="file"
accept=".pdf"
/>

</div>

<div className="upload-card">

<h3>
Image Upload (OCR)
</h3>

<p>
Upload image (JPG, PNG)
</p>

<small>
Auto detect questions & options
</small>

<input
type="file"
accept="image/*"
multiple
/>

</div>

</div>

<div className="hierarchy-bar">

<select>

<option>
Select Subject
</option>

</select>

<select>

<option>
Select Topic
</option>

</select>

<select>

<option>
Select Sub Topic
</option>

</select>

<button className="red-btn">

Clear All

</button>

<button className="green-btn">

Bulk Delete Before Import

</button>

</div>

<div className="stats-grid">

<div className="stat-card">

<h2>
12
</h2>

<p>
Total Questions
</p>

</div>

<div className="stat-card">

<h2>
11
</h2>

<p>
Valid Questions
</p>

</div>

<div className="stat-card">

<h2>
1
</h2>

<p>
Duplicates Removed
</p>

</div>

<div className="stat-card">

<h2>
0
</h2>

<p>
Invalid Questions
</p>

</div>

<div className="stat-card">

<h2>
0
</h2>

<p>
Failed Imports
</p>

</div>

</div>

<div className="toolbar">

<input
placeholder="Search question..."
/>

<button className="blue-btn">

Export CSV

</button>

<button className="green-btn">

Export Excel

</button>

<button>

Clear Preview

</button>

<button className="blue-btn">

Import to Firestore

</button>

<button className="purple-btn">

Retry Failed Imports

</button>

</div>

<div className="question-table">

<div className="table-header">

<div>#</div>
<div>Question</div>
<div>Option A</div>
<div>Option B</div>
<div>Option C</div>
<div>Option D</div>
<div>Correct Answer</div>
<div>Difficulty</div>
<div>Language</div>
<div>Explanation</div>
<div>Action</div>

</div>

<div className="table-row">

<div>
1
</div>

<textarea
defaultValue="ଓଡ଼ିଶାର ରାଜଧାନୀ କଣ ?"
/>

<input defaultValue="କଟକ"/>

<input defaultValue="ଭୁବନେଶ୍ୱର"/>

<input defaultValue="ପୁରୀ"/>

<input defaultValue="ସମ୍ବଲପୁର"/>

<div className="answer-column">

<label className="radio-item">

<input
type="radio"
checked
readOnly
/>

<span>
A
</span>

</label>

<label className="radio-item">

<input
type="radio"
/>

<span>
B
</span>

</label>

<label className="radio-item">

<input
type="radio"
/>

<span>
C
</span>

</label>

<label className="radio-item">

<input
type="radio"
/>

<span>
D
</span>

</label>

</div>

<select>

<option>
Easy
</option>

</select>

<select>

<option>
Odia
</option>

</select>

<textarea
defaultValue="ଭୁବନେଶ୍ୱର ହେଉଛି ଓଡ଼ିଶାର ରାଜଧାନୀ ।"
/>

<button className="delete-btn">

🗑

</button>

</div>

</div>

</div>

</AdminLayout>

);

}
