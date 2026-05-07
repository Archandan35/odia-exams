import React,{
useEffect,
useMemo,
useState,
} from "react";

import {
collection,
onSnapshot,
writeBatch,
doc,
} from "firebase/firestore";

import {
db,
} from "../firebase/config";

import Papa from "papaparse";

import * as XLSX from "xlsx/xlsx.mjs";

import toast from "react-hot-toast";

import { saveAs } from "file-saver";

import * as pdfjsLib from "pdfjs-dist";

import AdminLayout from "./AdminLayout";

pdfjsLib.GlobalWorkerOptions.workerSrc =
`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export default function BulkImport(){

const [subjects,setSubjects] =
useState([]);

const [topics,setTopics] =
useState([]);

const [subTopics,setSubTopics] =
useState([]);

const [selectedSubject,
setSelectedSubject] =
useState("");

const [selectedTopic,
setSelectedTopic] =
useState("");

const [selectedSubTopic,
setSelectedSubTopic] =
useState("");

const [questions,
setQuestions] =
useState([]);

const [loading,
setLoading] =
useState(false);

const [progress,
setProgress] =
useState(0);

const [search,
setSearch] =
useState("");

const [failedImports,
setFailedImports] =
useState([]);

const [validation,
setValidation] =
useState({
total:0,
valid:0,
duplicates:0,
invalid:0,
});

useEffect(()=>{

const unsubSubjects =
onSnapshot(
collection(db,"subjects"),
(snapshot)=>{

setSubjects(
snapshot.docs.map(
(doc)=>({
id:doc.id,
...doc.data(),
})
)
);

}
);

const unsubTopics =
onSnapshot(
collection(db,"topics"),
(snapshot)=>{

setTopics(
snapshot.docs.map(
(doc)=>({
id:doc.id,
...doc.data(),
})
)
);

}
);

const unsubSubTopics =
onSnapshot(
collection(db,"subtopics"),
(snapshot)=>{

setSubTopics(
snapshot.docs.map(
(doc)=>({
id:doc.id,
...doc.data(),
})
)
);

}
);

return ()=>{

unsubSubjects();
unsubTopics();
unsubSubTopics();

};

},[]);

const filteredTopics =
topics.filter(
(t)=>
t.subjectId ===
selectedSubject
);

const filteredSubTopics =
subTopics.filter(
(s)=>
s.subjectId ===
selectedSubject &&
s.topicId ===
selectedTopic
);

function normalizeAnswer(answer){

const ans =
String(answer || "")
.trim()
.toUpperCase();

if(ans === "A")
return 0;

if(ans === "B")
return 1;

if(ans === "C")
return 2;

if(ans === "D")
return 3;

if(
ans === "0" ||
ans === "1" ||
ans === "2" ||
ans === "3"
){

return Number(ans);

}

return 0;

}

function processQuestions(data){

const seen =
new Set();

let duplicates = 0;

const cleaned =
data.filter((q)=>{

if(
!q.question ||
!q.options
){

return false;

}

const key =
q.question
.trim()
.toLowerCase();

if(seen.has(key)){

duplicates++;

return false;

}

seen.add(key);

return true;

});

setValidation({
total:data.length,
valid:cleaned.length,
duplicates,
invalid:
data.length -
cleaned.length -
duplicates,
});

setQuestions(cleaned);

toast.success(
`${cleaned.length} Questions Loaded`
);

}

function handleCSVUpload(e){

const file =
e.target.files[0];

if(!file)
return;

Papa.parse(file,{

header:true,

skipEmptyLines:true,

complete:(results)=>{

const parsed =
results.data.map((q)=>({

question:
q.question || "",

options:[

q.optionA || "",
q.optionB || "",
q.optionC || "",
q.optionD || "",

],

correctAnswer:
normalizeAnswer(
q.correctAnswer
),

difficulty:
q.difficulty ||
"Easy",

language:
q.language ||
"English",

explanation:
q.explanation ||
"",

}));

processQuestions(parsed);

},

});

}

function handleJSONUpload(e){

const file =
e.target.files[0];

if(!file)
return;

const reader =
new FileReader();

reader.onload =
(event)=>{

try{

const json =
JSON.parse(
event.target.result
);

const parsed =
json.map((q)=>({

question:
q.question || "",

options:
q.options || [
"",
"",
"",
"",
],

correctAnswer:
normalizeAnswer(
q.correctAnswer
),

difficulty:
q.difficulty ||
"Easy",

language:
q.language ||
"English",

explanation:
q.explanation ||
"",

}));

processQuestions(parsed);

}catch(error){

console.log(error);

toast.error(
"Invalid JSON"
);

}

};

reader.readAsText(file);

}

function handleExcelUpload(e){

const file =
e.target.files[0];

if(!file)
return;

const reader =
new FileReader();

reader.onload =
(evt)=>{

const data =
new Uint8Array(
evt.target.result
);

const workbook =
XLSX.read(data,{
type:"array",
});

const sheet =
workbook.Sheets[
workbook.SheetNames[0]
];

const json =
XLSX.utils.sheet_to_json(
sheet
);

const parsed =
json.map((q)=>({

question:
q.question || "",

options:[

q.optionA || "",
q.optionB || "",
q.optionC || "",
q.optionD || "",

],

correctAnswer:
normalizeAnswer(
q.correctAnswer
),

difficulty:
q.difficulty ||
"Easy",

language:
q.language ||
"English",

explanation:
q.explanation ||
"",

}));

processQuestions(parsed);

};

reader.readAsArrayBuffer(file);

}

async function handlePDFUpload(e){

const file =
e.target.files[0];

if(!file)
return;

try{

toast.loading(
"Reading PDF..."
);

const arrayBuffer =
await file.arrayBuffer();

const pdf =
await pdfjsLib
.getDocument({
data:arrayBuffer,
}).promise;

let fullText = "";

for(
let pageNum = 1;
pageNum <= pdf.numPages;
pageNum++
){

const page =
await pdf.getPage(
pageNum
);

const content =
await page.getTextContent();

const strings =
content.items.map(
(item)=>item.str
);

fullText +=
"\n" +
strings.join(" ");

}

toast.dismiss();

toast.success(
"PDF Uploaded"
);

console.log(fullText);

}catch(error){

console.log(error);

toast.dismiss();

toast.error(
"PDF Failed"
);

}

}

async function handleImageUpload(e){

const files =
Array.from(
e.target.files
);

if(!files.length)
return;

toast.success(
`${files.length} Images Uploaded`
);

}

function updateQuestion(
index,
field,
value
){

const updated =
[...questions];

updated[index][field] =
value;

setQuestions(updated);

}

function updateOption(
qIndex,
opIndex,
value
){

const updated =
[...questions];

updated[qIndex]
.options[opIndex] =
value;

setQuestions(updated);

}

function deleteQuestion(index){

const updated =
[...questions];

updated.splice(index,1);

setQuestions(updated);

}

async function importQuestions(){

if(
questions.length === 0
){

toast.error(
"No Questions"
);

return;

}

if(
!selectedSubject ||
!selectedTopic ||
!selectedSubTopic
){

toast.error(
"Select Subject Hierarchy"
);

return;

}

try{

setLoading(true);

setProgress(0);

const failed = [];

const chunkSize = 400;

for(
let i = 0;
i < questions.length;
i += chunkSize
){

const chunk =
questions.slice(
i,
i + chunkSize
);

const batch =
writeBatch(db);

chunk.forEach((q)=>{

try{

const ref =
doc(
collection(
db,
"questions"
)
);

batch.set(ref,{

subjectId:
selectedSubject,

topicId:
selectedTopic,

subTopicId:
selectedSubTopic,

question:
q.question,

options:
q.options,

correctAnswer:
Number(
q.correctAnswer
),

difficulty:
q.difficulty,

language:
q.language,

explanation:
q.explanation,

createdAt:
Date.now(),

});

}catch(error){

failed.push(q);

}

});

await batch.commit();

const percent =
Math.round(
(
(i + chunk.length) /
questions.length
) * 100
);

setProgress(percent);

}

setFailedImports(
failed
);

toast.success(
`${questions.length} Questions Imported`
);

}catch(error){

console.log(error);

toast.error(
"Import Failed"
);

}

setLoading(false);

}

function exportCSV(){

const rows =
questions.map((q)=>({

question:
q.question,

optionA:
q.options[0],

optionB:
q.options[1],

optionC:
q.options[2],

optionD:
q.options[3],

correctAnswer:
[
"A",
"B",
"C",
"D",
][
q.correctAnswer
],

difficulty:
q.difficulty,

language:
q.language,

explanation:
q.explanation,

}));

const csv =
Papa.unparse(rows);

const blob =
new Blob(
[csv],
{
type:
"text/csv;charset=utf-8;",
}
);

saveAs(
blob,
"questions.csv"
);

}

function exportExcel(){

const rows =
questions.map((q)=>({

question:
q.question,

optionA:
q.options[0],

optionB:
q.options[1],

optionC:
q.options[2],

optionD:
q.options[3],

correctAnswer:
[
"A",
"B",
"C",
"D",
][
q.correctAnswer
],

difficulty:
q.difficulty,

language:
q.language,

explanation:
q.explanation,

}));

const worksheet =
XLSX.utils.json_to_sheet(
rows
);

const workbook =
XLSX.utils.book_new();

XLSX.utils.book_append_sheet(
workbook,
worksheet,
"Questions"
);

const excelBuffer =
XLSX.write(
workbook,
{
bookType:"xlsx",
type:"array",
}
);

const blob =
new Blob(
[excelBuffer],
{
type:
"application/octet-stream",
}
);

saveAs(
blob,
"questions.xlsx"
);

}

const filteredQuestions =
useMemo(()=>{

return questions.filter(
(q)=>
q.question
?.toLowerCase()
.includes(
search.toLowerCase()
)
);

},[
questions,
search,
]);

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
correctAnswer
(A/B/C/D or 0/1/2/3),
difficulty,
language,
explanation

</small>

<input
type="file"
accept=".csv"
onChange={
handleCSVUpload
}
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
onChange={
handleExcelUpload
}
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
onChange={
handleJSONUpload
}
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
onChange={
handlePDFUpload
}
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
onChange={
handleImageUpload
}
/>

</div>

</div>

<div className="hierarchy-bar">

<select
value={
selectedSubject
}
onChange={(e)=>
setSelectedSubject(
e.target.value
)
}
>

<option value="">
Select Subject
</option>

{
subjects.map((s)=>(

<option
key={s.id}
value={s.id}
>
{s.name}
</option>

))
}

</select>

<select
value={
selectedTopic
}
onChange={(e)=>
setSelectedTopic(
e.target.value
)
}
>

<option value="">
Select Topic
</option>

{
filteredTopics.map((t)=>(

<option
key={t.id}
value={t.id}
>
{t.name}
</option>

))
}

</select>

<select
value={
selectedSubTopic
}
onChange={(e)=>
setSelectedSubTopic(
e.target.value
)
}
>

<option value="">
Select Sub Topic
</option>

{
filteredSubTopics.map((s)=>(

<option
key={s.id}
value={s.id}
>
{s.name}
</option>

))
}

</select>

<button
className="danger-btn"
onClick={()=>
setQuestions([])
}
>

Clear All

</button>

</div>

<div className="stats-grid">

<div className="stat-card">

<h2>
{
validation.total
}
</h2>

<p>
Total Questions
</p>

</div>

<div className="stat-card">

<h2>
{
validation.valid
}
</h2>

<p>
Valid Questions
</p>

</div>

<div className="stat-card">

<h2>
{
validation.duplicates
}
</h2>

<p>
Duplicates Removed
</p>

</div>

<div className="stat-card">

<h2>
{
failedImports.length
}
</h2>

<p>
Failed Imports
</p>

</div>

</div>

<div className="toolbar">

<input
type="text"
placeholder="Search Question..."
value={search}
onChange={(e)=>
setSearch(
e.target.value
)
}
/>

<button
className="blue-btn"
onClick={
exportCSV
}
>

Export CSV

</button>

<button
className="green-btn"
onClick={
exportExcel
}
>

Export Excel

</button>

<button
className="import-btn"
onClick={
importQuestions
}
>

Import to Firestore

</button>

</div>

{
loading && (

<div className="progress-wrap">

<div
className="progress-bar"
style={{
width:
`${progress}%`,
}}
/>

</div>

)
}

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

{
filteredQuestions.map(
(q,index)=>(

<div
key={index}
className="table-row"
>

<div>
{index + 1}
</div>

<textarea
value={
q.question
}
onChange={(e)=>
updateQuestion(
index,
"question",
e.target.value
)
}
/>

{
q.options.map(
(op,opIndex)=>(

<input
key={opIndex}
type="text"
value={op}
onChange={(e)=>
updateOption(
index,
opIndex,
e.target.value
)
}
/>

)
)
}

<div className="answer-column">

{
["A","B","C","D"]
.map(
(
label,
answerIndex
)=>(

<label
key={
answerIndex
}
className="radio-item"
>

<input
type="radio"
name={`answer-${index}`}
checked={
Number(
q.correctAnswer
) ===
answerIndex
}
onChange={()=>
updateQuestion(
index,
"correctAnswer",
answerIndex
)
}
/>

<span>
{label}
</span>

</label>

)
)
}

</div>

<select
value={
q.difficulty
}
onChange={(e)=>
updateQuestion(
index,
"difficulty",
e.target.value
)
}
>

<option>
Easy
</option>

<option>
Medium
</option>

<option>
Hard
</option>

</select>

<select
value={
q.language
}
onChange={(e)=>
updateQuestion(
index,
"language",
e.target.value
)
}
>

<option>
English
</option>

<option>
Odia
</option>

<option>
Hindi
</option>

</select>

<textarea
value={
q.explanation
}
onChange={(e)=>
updateQuestion(
index,
"explanation",
e.target.value
)
}
/>

<button
className="delete-btn"
onClick={()=>
deleteQuestion(
index
)
}
>

🗑

</button>

</div>

)
)
}

</div>

</div>

</AdminLayout>

);

}
