import { useState, useEffect, useRef } from "react";

import {
collection,
onSnapshot,
addDoc,
} from "firebase/firestore";

import Papa from "papaparse";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";

import * as XLSX from "xlsx";

import { db } from "../firebase/config";

import AdminLayout from "./AdminLayout";

export default function BulkImport(){

const [subjects,setSubjects]=useState([]);
const [topics,setTopics]=useState([]);
const [subTopics,setSubTopics]=useState([]);

const [selectedSubject,setSelectedSubject]=useState("");
const [selectedTopic,setSelectedTopic]=useState("");
const [selectedSubTopic,setSelectedSubTopic]=useState("");

const [previewQuestions,setPreviewQuestions]=useState([]);

const [showHelp,setShowHelp]=useState(false);

const [showManualOCR,
setShowManualOCR]=useState(false);

const [manualJSON,
setManualJSON]=useState("");
const [showImportModal,setShowImportModal]=useState(false);

const [importProgress,setImportProgress]=useState(0);

const [totalImport,setTotalImport]=useState(0);

const tableRef = useRef();
const topScrollRef = useRef();

useEffect(()=>{

const unsubSubjects = onSnapshot(
collection(db,"subjects"),
(snapshot)=>{
setSubjects(
snapshot.docs.map(doc=>(
{
id:doc.id,
...doc.data(),
}
))
)
}
)

const unsubTopics = onSnapshot(
collection(db,"topics"),
(snapshot)=>{
setTopics(
snapshot.docs.map(doc=>(
{
id:doc.id,
...doc.data(),
}
))
)
}
)

const unsubSubTopics = onSnapshot(
collection(db,"subtopics"),
(snapshot)=>{
setSubTopics(
snapshot.docs.map(doc=>(
{
id:doc.id,
...doc.data(),
}
))
)
}
)

return()=>{
unsubSubjects();
unsubTopics();
unsubSubTopics();
}

},[])

const filteredTopics = topics.filter(
t=>t.subjectId===selectedSubject
)

const filteredSubTopics = subTopics.filter(
s=>
s.subjectId===selectedSubject &&
s.topicId===selectedTopic
)

function handleJSONUpload(e){

const file = e.target.files[0]
if(!file) return;

const reader = new FileReader()

reader.onload=(event)=>{

try{

const json = JSON.parse(event.target.result)

const formatted = json.map(q=>(
{
question:q.question || "",
options:q.options || ["","","",""],

correctAnswer:
typeof q.correctAnswer === "string"
? q.correctAnswer.trim().toUpperCase()
: q.correctAnswer,

difficulty:q.difficulty || "Easy",
language:q.language || "English",
explanation:q.explanation || "",
}
))

setPreviewQuestions(formatted)

toast.success(`${formatted.length} Questions Loaded`)

}catch(error){
console.log(error)
toast.error("Invalid JSON File")
}

}

reader.readAsText(file)
}

function handleCSVUpload(e){

const file = e.target.files[0]
if(!file) return;

Papa.parse(file,{
header:true,
skipEmptyLines:true,
complete:(results)=>{

const parsed = results.data.map(q=>(
{
question:q.question || "",
options:[
q.optionA || "",
q.optionB || "",
q.optionC || "",
q.optionD || "",
],
correctAnswer:
String(q.correctAnswer)
.trim()
.toUpperCase(),
difficulty:q.difficulty || "Easy",
language:q.language || "English",
explanation:q.explanation || "",
}
))

setPreviewQuestions(parsed)

toast.success(`${parsed.length} Questions Loaded`)

}
})
}

  function handleManualJSONSubmit(){

if(!manualJSON.trim()){

toast.error(
"No JSON Data"
)

return;

}

try{

const parsed =
JSON.parse(manualJSON)

const formatted =
parsed.map(q=>({

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
typeof q.correctAnswer === "string"
? q.correctAnswer
.trim()
.toUpperCase()
: q.correctAnswer,

difficulty:
q.difficulty || "Easy",

language:
q.language || "English",

explanation:
q.explanation || "",

}))

setPreviewQuestions(formatted)

toast.success(
`${formatted.length} Questions Loaded`
)

setShowManualOCR(false)

setManualJSON("")

}catch(error){

console.log(error)

toast.error(
"Invalid JSON"
)

}

}

function exportCSV(){

const rows = previewQuestions.map(q=>(
{
question:q.question,
optionA:q.options[0],
optionB:q.options[1],
optionC:q.options[2],
optionD:q.options[3],
correctAnswer:q.correctAnswer,
difficulty:q.difficulty,
language:q.language,
explanation:q.explanation,
}
))

const csv = Papa.unparse(rows)

const blob = new Blob([csv],{
type:"text/csv;charset=utf-8;"
})

saveAs(blob,"questions.csv")
}

function exportExcel(){

const rows = previewQuestions.map(q=>(
{
question:q.question,
optionA:q.options[0],
optionB:q.options[1],
optionC:q.options[2],
optionD:q.options[3],
correctAnswer:q.correctAnswer,
difficulty:q.difficulty,
language:q.language,
explanation:q.explanation,
}
))

const worksheet = XLSX.utils.json_to_sheet(rows)
const workbook = XLSX.utils.book_new()

XLSX.utils.book_append_sheet(
workbook,
worksheet,
"Questions"
)

XLSX.writeFile(workbook,"questions.xlsx")
}

async function handleImport(){

if(previewQuestions.length===0){
toast.error("No Questions")
return;
}

if(
!selectedSubject ||
!selectedTopic ||
!selectedSubTopic
){
toast.error("Select Subject, Topic & SubTopic")
return;
}

try{

/* START IMPORT MODAL */

setShowImportModal(true)

setImportProgress(0)

setTotalImport(previewQuestions.length)

/* LIVE IMPORT */

for(let i=0;i<previewQuestions.length;i++){

const q = previewQuestions[i]

await addDoc(
collection(db,"questions"),
{
subjectId:selectedSubject,
topicId:selectedTopic,
subTopicId:selectedSubTopic,

question:q.question,

options:q.options,

correctAnswer:
typeof q.correctAnswer === "number"
? ["A","B","C","D"][q.correctAnswer]
: q.correctAnswer,

difficulty:q.difficulty,

language:q.language,

explanation:q.explanation,

createdAt:Date.now(),
}
)

/* LIVE COUNTER */

setImportProgress(i + 1)

}

/* SUCCESS */

toast.success(
`${previewQuestions.length} Questions Imported`
)

/* CLEAR PREVIEW */

setPreviewQuestions([])

/* RESET FILE INPUTS */

document
.querySelectorAll('input[type="file"]')
.forEach(input=>{
input.value=""
})

/* CLOSE MODAL */

setTimeout(()=>{

setShowImportModal(false)

},1000)

}catch(error){

console.log(error)

toast.error("Import Failed")

setShowImportModal(false)

}

}



useEffect(()=>{

if(topScrollRef.current && tableRef.current){

const top = topScrollRef.current
const table = tableRef.current

const syncTop=()=>{
table.scrollLeft = top.scrollLeft
}

const syncTable=()=>{
top.scrollLeft = table.scrollLeft
}

top.addEventListener("scroll",syncTop)
table.addEventListener("scroll",syncTable)

return()=>{
top.removeEventListener("scroll",syncTop)
table.removeEventListener("scroll",syncTable)
}

}

},[previewQuestions])

return(

<AdminLayout>
  {
showImportModal && (

<div className="import-modal-overlay">

<div className="import-modal-card">

<h2>
Importing Questions
</h2>

<p>
Please wait while storing questions...
</p>

<div className="import-progress-circle">

{importProgress}/{totalImport}

</div>

<div className="import-progress-bar">

<div
className="import-progress-fill"
style={{
width:
`${(
importProgress /
totalImport
) * 100}%`
}}
/>
  
</div>

<p className="import-progress-text">

{
Math.floor(
(
importProgress /
totalImport
) * 100
)
}
% Completed

</p>

</div>

</div>

)
}

<div className="bulk-import-page">

<div className="bulk-import-header">

<div>
<h2>Bulk Import</h2>
<p>
Import questions from CSV, Excel, JSON, PDF or Image
</p>
</div>

<button
className="bulk-help-btn"
onClick={()=>setShowHelp(true)}
>
Help & Format Guide
</button>

</div>

<div className="bulk-import-grid">

<div className="bulk-card">
<div>
<h3>CSV Upload</h3>
<p>
Upload .csv file
</p>
</div>
<input
type="file"
accept=".csv"
onChange={handleCSVUpload}
/>
</div>

<div className="bulk-card">
<div>
<h3>Excel Upload</h3>
<p>
Upload .xlsx or .xls file
</p>
</div>
<input type="file" />
</div>

<div className="bulk-card">
<div>
<h3>JSON Upload</h3>
<p>
Upload .json file
</p>
</div>
<input
type="file"
accept=".json"
onChange={handleJSONUpload}
/>
</div>

<div className="bulk-card">
<div>
<h3>PDF Upload (OCR)</h3>
<p>
Extract questions from PDF
</p>
</div>
<input type="file" />
</div>

<div className="bulk-card">
<div>
<h3>Image Upload (OCR)</h3>
<p>
Extract questions from Image
</p>
</div>
<input type="file" />
</div>

  {/* MANUAL OCR */}
<div className="bulk-card">

<div>

<h3>
Manual OCR
</h3>

<p>
Paste OCR JSON Data
</p>

</div>

<button
className="bulk-action-btn bulk-success"
onClick={()=>
setShowManualOCR(true)
}
>

Paste Data

</button>

</div>
</div>

<div className="bulk-filter-card">

<div className="bulk-filter-grid">

<select
value={selectedSubject}
onChange={(e)=>setSelectedSubject(e.target.value)}
>
<option value="">Select Subject</option>
{
subjects.map(s=>(
<option key={s.id} value={s.id}>
{s.name}
</option>
))
}
</select>

<select
value={selectedTopic}
onChange={(e)=>setSelectedTopic(e.target.value)}
>
<option value="">Select Topic</option>
{
filteredTopics.map(t=>(
<option key={t.id} value={t.id}>
{t.name}
</option>
))
}
</select>

<select
value={selectedSubTopic}
onChange={(e)=>setSelectedSubTopic(e.target.value)}
>
<option value="">Select Sub Topic</option>
{
filteredSubTopics.map(s=>(
<option key={s.id} value={s.id}>
{s.name}
</option>
))
}
</select>

<button
className="bulk-action-btn bulk-danger"
onClick={()=>setPreviewQuestions([])}
>
Clear All
</button>

<button
className="bulk-action-btn bulk-success"
onClick={handleImport}
>
Import Questions
</button>

</div>

</div>

<div className="bulk-stats">

<div className="bulk-stat-box">
<h4>Total Questions</h4>
<h2>{previewQuestions.length}</h2>
</div>

<div className="bulk-stat-box">
<h4>Valid Questions</h4>
<h2>{previewQuestions.length}</h2>
</div>

<div className="bulk-stat-box">
<h4>Duplicates Removed</h4>
<h2>0</h2>
</div>

<div className="bulk-stat-box">
<h4>Invalid Questions</h4>
<h2>0</h2>
</div>

<div className="bulk-stat-box">
<h4>Failed Imports</h4>
<h2>0</h2>
</div>

</div>

<div className="bulk-preview-card">

<div
className="bulk-top-scroll"
ref={topScrollRef}
>
<div style={{width:"1700px"}}></div>
</div>

<div className="bulk-preview-header">

<h2>Parsed Questions</h2>

<div style={{display:"flex",gap:"12px",flexWrap:"wrap"}}>

<button onClick={exportCSV}>
Export CSV
</button>

<button onClick={exportExcel}>
Export Excel
</button>

</div>

</div>

<div
className="bulk-table-wrapper"
ref={tableRef}
>

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

{
previewQuestions.map((q,index)=>(
<tr key={index}>

<td>{index+1}</td>

<td>{q.question}</td>
<td>{q.options[0]}</td>
<td>{q.options[1]}</td>
<td>{q.options[2]}</td>
<td>{q.options[3]}</td>
<td>{q.correctAnswer}</td>
<td>{q.difficulty}</td>
<td>{q.language}</td>
<td>{q.explanation}</td>

</tr>
))
}

</tbody>

</table>

</div>

</div>

{
showManualOCR && (

<div className="bulk-popup-overlay">

<div className="manual-ocr-popup">

<h2>
Manual OCR JSON Import
</h2>

<p className="manual-ocr-subtitle">

Paste OCR JSON Data Below

</p>

<textarea
value={manualJSON}
onChange={(e)=>
setManualJSON(
e.target.value
)
}
placeholder='[
{
"question":"What is 2+2?",
"options":["2","3","4","5"],
"correctAnswer":"C"
}
]'
className="manual-ocr-textarea"
/>

<div className="manual-ocr-actions">

<button
onClick={()=>
setShowManualOCR(false)
}
className="bulk-action-btn bulk-danger"
>

Cancel

</button>

<button
onClick={
handleManualJSONSubmit
}
className="bulk-action-btn bulk-success"
>

Submit JSON

</button>

</div>

</div>

</div>

)
}
  
{
showHelp && (
<div className="bulk-popup-overlay">

<div className="bulk-popup">

<h2>CSV Format</h2>

<pre>
{`question,optionA,optionB,optionC,optionD,correctAnswer,difficulty,language,explanation
What is 2+2?,2,3,4,5,3,Easy,English,2+2 = 4`}
</pre>

<h2>JSON Format</h2>

<pre>
{`[
  {
    "question":"What is 2+2?",
    "options":["2","3","4","5"],
    "correctAnswer":3,
    "difficulty":"Easy",
    "language":"English",
    "explanation":"2+2 = 4"
  }
]`}
</pre>

<button onClick={()=>setShowHelp(false)}>
Close
</button>

</div>

</div>
)
}

</div>

</AdminLayout>

)

}
