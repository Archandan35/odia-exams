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

const [ocrLanguage,
setOcrLanguage] =
useState("eng");

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

/* IMAGE OCR */

async function handleImageOCR(e){

const file =
e.target.files[0];

if(!file) return;

try{

setLoading(true);

toast.loading(
"Running OCR..."
);

const result =
await Tesseract.recognize(
file,
ocrLanguage,
{
logger:m=>console.log(m),
}
);

const text =
result.data.text;

console.log(text);

const parsed =
parseMCQ(text);

setPreviewQuestions(parsed);

toast.dismiss();

if(parsed.length === 0){

toast.error(
"No MCQ Detected"
);

}else{

toast.success(
`${parsed.length}
Questions Parsed`
);

}

}catch(error){

console.log(error);

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
"\n" +
strings.join(" ");

}

console.log(fullText);

const parsed =
parseMCQ(fullText);

setPreviewQuestions(parsed);

toast.dismiss();

if(parsed.length === 0){

toast.error(
"No Questions Parsed"
);

}else{

toast.success(
`${parsed.length}
Questions Parsed`
);

}

}catch(error){

console.log(error);

toast.dismiss();

toast.error(
"PDF Import Failed"
);

}

setLoading(false);

}

return(

<AdminLayout>

<div className="page">

<div className="page-header">

<div>

<h2>
Advanced OCR Import
</h2>

<p>
Odia / Hindi / English
MCQ OCR System
</p>

</div>

</div>

<div className="glass-card">

<h3>
OCR Language
</h3>

<select
value={ocrLanguage}
onChange={(e)=>
setOcrLanguage(
e.target.value
)
}
>

<option value="eng">
English
</option>

<option value="hin">
Hindi
</option>

<option value="eng+hin">
English + Hindi
</option>

</select>

</div>

<div className="import-grid">

<div className="import-card">

<h3>
Image OCR
</h3>

<input
type="file"
accept="image/*"
onChange={
handleImageOCR
}
/>

</div>

<div className="import-card">

<h3>
PDF OCR
</h3>

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

<div
className="table-card"
style={{
marginTop:"25px",
}}
>

<h2>
Parsed Questions
</h2>

<div
style={{
display:"flex",
flexDirection:"column",
gap:"20px",
marginTop:"20px",
}}
>

{
previewQuestions.map(
(q,index)=>(

<div
key={index}
className="
question-review-card
"
>

<h3>

Q{index + 1}.

{" "}

{q.question}

</h3>

<div
className="
review-options
"
>

{
q.options?.map(
(op,i)=>(

<div
key={i}
className="
review-option
"
>

<b>

{
String.fromCharCode(
65 + i
)
}) 

</b>

{op}

</div>

))
}

</div>

<p>

<b>
Language:
</b>

{" "}

{q.language}

</p>

</div>

))
}

</div>

</div>

)
}

</div>

</AdminLayout>

);

}
