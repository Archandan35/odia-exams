import {
useState,
useEffect,
} from "react";

import {
collection,
onSnapshot,
addDoc,
} from "firebase/firestore";

import Papa from "papaparse";

import toast from "react-hot-toast";

import {
db,
} from "../firebase/config";

import Tesseract
from "tesseract.js";

import * as pdfjsLib
from "pdfjs-dist";

import {
saveAs,
} from "file-saver";

import {
parseMCQ,
} from "../utils/ocrParser";

import AdminLayout
from "./AdminLayout";

export default function BulkImport(){

const [subjects,
setSubjects] =
useState([]);

const [topics,
setTopics] =
useState([]);

const [subTopics,
setSubTopics] =
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

const [previewQuestions,
setPreviewQuestions] =
useState([]);

const [loading,
setLoading] =
useState(false);

useEffect(()=>{

const unsubSubjects =
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

if(
data.length > 0 &&
!selectedSubject
){

setSelectedSubject(
data[0].id
);

}

}
);

const unsubTopics =
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

const unsubSubTopics =
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

/* CSV IMPORT */

function handleCSVUpload(e){

const file =
e.target.files[0];

if(!file) return;

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
Number(
q.correctAnswer || 0
),

difficulty:
q.difficulty ||
"easy",

explanation:
q.explanation ||
"",

}));

setPreviewQuestions(parsed);

toast.success(
"CSV Parsed Successfully"
);

},

});

}

/* JSON IMPORT */

function handleJSONUpload(e){

const file =
e.target.files[0];

if(!file) return;

const reader =
new FileReader();

reader.onload =
(event)=>{

try{

const json =
JSON.parse(
event.target.result
);

setPreviewQuestions(json);

toast.success(
"JSON Loaded"
);

}catch{

toast.error(
"Invalid JSON"
);

}

};

reader.readAsText(file);

}

/* SAVE QUESTIONS */

async function handleSaveQuestions(){

if(
previewQuestions.length === 0
){

toast.error(
"No questions to save"
);

return;

}

if(
!selectedSubject ||
!selectedTopic ||
!selectedSubTopic
){

toast.error(
"Select hierarchy"
);

return;

}

try{

setLoading(true);

for(const q of previewQuestions){

await addDoc(
collection(db,"questions"),
{

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
q.correctAnswer || 0
),

difficulty:
q.difficulty ||
"easy",

explanation:
q.explanation ||
"",

createdAt:
Date.now(),

}
);

}

toast.success(
`${previewQuestions.length}
Questions Imported`
);

setPreviewQuestions([]);

}catch{

toast.error(
"Import failed"
);

}

setLoading(false);

}
/* IMAGE OCR */

async function handleImageOCR(e){

const file =
e.target.files[0];

if(!file) return;

try{

setLoading(true);

toast.loading(
"Processing OCR..."
);

const result =
await Tesseract.recognize(
file,
"eng"
);

const text =
result.data.text;

const parsed =
parseMCQ(text);

setPreviewQuestions(parsed);

toast.dismiss();

toast.success(
`${parsed.length}
Questions Detected`
);

}catch{

toast.dismiss();

toast.error(
"OCR Failed"
);

}

setLoading(false);

}

/* PDF OCR */

async function handlePDFOCR(e){

const file =
e.target.files[0];

if(!file) return;

try{

setLoading(true);

toast.loading(
"Reading PDF..."
);

const arrayBuffer =
await file.arrayBuffer();

const pdf =
await pdfjsLib.getDocument({
data:arrayBuffer,
}).promise;

let fullText = "";

for(
let pageNum = 1;
pageNum <= pdf.numPages;
pageNum++
){

const page =
await pdf.getPage(pageNum);

const content =
await page.getTextContent();

const strings =
content.items.map(
(item)=>item.str
);

fullText +=
strings.join(" ");

}

const parsed =
parseMCQ(fullText);

setPreviewQuestions(parsed);

toast.dismiss();

toast.success(
`${parsed.length}
Questions Parsed`
);

}catch{

toast.dismiss();

toast.error(
"PDF OCR Failed"
);

}

setLoading(false);

}

/* EXPORT JSON */

function exportJSON(){

const blob =
new Blob(

[
JSON.stringify(
previewQuestions,
null,
2
)
],

{
type:
"application/json",
}

);

saveAs(
blob,
"questions.json"
);

}

/* EXPORT CSV */

function exportCSV(){

const rows = [

[
"question",
"optionA",
"optionB",
"optionC",
"optionD",
"correctAnswer",
],

];

previewQuestions.forEach((q)=>{

rows.push([

q.question,

q.options?.[0] || "",

q.options?.[1] || "",

q.options?.[2] || "",

q.options?.[3] || "",

q.correctAnswer,

]);

});

const csv =
rows.map(
(r)=>r.join(",")
).join("\n");

const blob =
new Blob(
[csv],
{
type:"text/csv",
}
);

saveAs(
blob,
"questions.csv"
);

}
  
return(

<AdminLayout>

<div className="page-header">

<div>

<h2>
Bulk Import System
</h2>

<p>
CSV / JSON / OCR Import
</p>

</div>

</div>

<div className="glass-card">

<h3>
Select Hierarchy
</h3>

<div className="filter-bar">

<select
value={selectedSubject}
onChange={(e)=>
setSelectedSubject(
e.target.value
)
}
>

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
value={selectedTopic}
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
value={selectedSubTopic}
onChange={(e)=>
setSelectedSubTopic(
e.target.value
)
}
>

<option value="">
Select SubTopic
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

</div>

</div>

<div className="dashboard-grid">

<div className="analytics-card">

<h3>
Upload CSV
</h3>

<input
type="file"
accept=".csv"
onChange={
handleCSVUpload
}
/>

</div>

<div className="analytics-card">

<h3>
Upload JSON
</h3>

<input
type="file"
accept=".json"
onChange={
handleJSONUpload
}
/>

</div>

<div className="analytics-card">

<h3>
OCR Import
</h3>

<input
type="file"
accept="image/*"
onChange={
handleImageOCR
}
/>

<input
type="file"
accept=".pdf"
onChange={
handlePDFOCR
}
/>

</div>

</div>

{
previewQuestions.length > 0 && (

<div className="table-card">

<div className="page-header">

<div
style={{
display:"flex",
justifyContent:
"space-between",
alignItems:"center",
}}
>

<h3>
Preview Questions
</h3>

<div
style={{
display:"flex",
gap:"10px",
}}
>

<button
onClick={
exportJSON
}
>
Export JSON
</button>

<button
onClick={
exportCSV
}
>
Export CSV
</button>

</div>

</div>

<button
onClick={
handleSaveQuestions
}
disabled={loading}
>

{
loading
?
"Importing..."
:
"Confirm Import"
}

</button>

</div>

<table>

<thead>

<tr>

<th>
Question
</th>

<th>
Options
</th>

<th>
Answer
</th>

</tr>

</thead>

<tbody>

{
previewQuestions.map(
(q,index)=>(

<tr key={index}>

<td>
{q.question}
</td>

<td>

{
q.options?.map(
(op,i)=>(
<div key={i}>
{op}
</div>
))
}

</td>

<td>

{
["A","B","C","D"][
q.correctAnswer || 0
]
}

</td>

</tr>

))
}

</tbody>

</table>

</div>

)
}

</AdminLayout>

);

}
