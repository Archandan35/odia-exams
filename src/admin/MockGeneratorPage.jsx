import {
useEffect,
useMemo,
useState,
} from "react";

import AdminLayout from "./AdminLayout";

import {
collection,
getDocs,
onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/config";

import {
listenSubjects,
} from "../services/subjectService";

import {
generateMocks,
} from "../services/mockGeneratorService";

export default function MockGeneratorPage(){

const [subjects,setSubjects] =
useState([]);

const [topics,setTopics] =
useState([]);

const [subTopics,setSubTopics] =
useState([]);

const [questions,setQuestions] =
useState([]);

const [mockName,setMockName] =
useState("");

const [mockType,setMockType] =
useState("sectional");

const [subjectId,setSubjectId] =
useState("");

const [topic,setTopic] =
useState("");

const [subTopic,setSubTopic] =
useState("");

const [quantity,setQuantity] =
useState(25);

const [duration,setDuration] =
useState(60);

const [
secondsPerQuestion,
setSecondsPerQuestion
] = useState(30);

const [
desiredMocks,
setDesiredMocks
] = useState(1);

const [
includeAllQuestions,
setIncludeAllQuestions
] = useState(true);

const [
distributionMode,
setDistributionMode
] = useState("balanced");

const [
manualDistribution,
setManualDistribution
] = useState("");

const [
distributionPreview,
setDistributionPreview
] = useState([]);

const [loading,setLoading] =
useState(false);

const [
generationProgress,
setGenerationProgress
] = useState(0);

const [
generatedMocks,
setGeneratedMocks
] = useState([]);

/* =========================================
SUBJECTS
========================================= */

useEffect(()=>{

const unsubscribe =
listenSubjects(setSubjects);

return ()=>unsubscribe();

},[]);

/* =========================================
TOPICS
========================================= */

useEffect(()=>{

const unsub = onSnapshot(
collection(db,"topics"),
(snapshot)=>{

const data =
snapshot.docs.map((doc)=>({

id:doc.id,
...doc.data(),

}));

setTopics(data);

}
);

return ()=>unsub();

},[]);

/* =========================================
SUBTOPICS
========================================= */

useEffect(()=>{

const unsub = onSnapshot(
collection(db,"subtopics"),
(snapshot)=>{

const data =
snapshot.docs.map((doc)=>({

id:doc.id,
...doc.data(),

}));

setSubTopics(data);

}
);

return ()=>unsub();

},[]);

/* =========================================
QUESTIONS
========================================= */

useEffect(()=>{

async function loadQuestions(){

const snapshot =
await getDocs(
collection(db,"questions")
);

const data =
snapshot.docs.map((doc)=>({

id:doc.id,
...doc.data(),

}));

console.log(
"ALL QUESTIONS:",
data
);

setQuestions(data);

}

loadQuestions();

},[]);

/* =========================================
FILTERED TOPICS
========================================= */

const filteredTopics =
topics.filter(
(item)=>
String(item.subjectId) ===
String(subjectId)
);

/* =========================================
FILTERED SUBTOPICS
========================================= */

const filteredSubTopics =
subTopics.filter(
(item)=>

String(item.subjectId) ===
String(subjectId) &&

String(item.topicId) ===
String(topic)

);

/* =========================================
FILTER QUESTIONS
========================================= */

const filteredQuestions =
useMemo(()=>{

const filtered =
questions.filter((q)=>{

const subjectMatch =
subjectId
?
String(q.subjectId) ===
String(subjectId)
:
true;

const topicMatch =
topic
?
String(q.topicId) ===
String(topic)
:
true;

const subTopicMatch =
subTopic
?
String(q.subTopicId) ===
String(subTopic)
:
true;

return (
subjectMatch &&
topicMatch &&
subTopicMatch
);

});

console.log(
"FILTERED QUESTIONS:",
filtered
);

return filtered;

},[
questions,
subjectId,
topic,
subTopic,
]);

/* =========================================
STATS
========================================= */

const totalQuestions =
filteredQuestions.length;

const totalMocks =
Math.floor(
totalQuestions / quantity
);

const remainder =
totalQuestions % quantity;

const calculatedMinutes =
Math.ceil(
(totalQuestions *
secondsPerQuestion) / 60
);

const recommendedStrategy =
remainder > 0
?
"balanced"
:
"extra";

/* =========================================
AUTO DURATION
========================================= */

useEffect(()=>{

if(
calculatedMinutes > 0
){

setDuration(
calculatedMinutes
);

}

},[
calculatedMinutes
]);

/* =========================================
DISTRIBUTION
========================================= */

useEffect(()=>{

if(!includeAllQuestions){

setDistributionPreview([]);

return;

}

if(totalQuestions <= 0){

setDistributionPreview([]);

return;

}

/* BALANCED */

if(distributionMode === "balanced"){

const totalCount =
Math.ceil(
totalQuestions / quantity
);

const base =
Math.floor(
totalQuestions / totalCount
);

const extra =
totalQuestions % totalCount;

const arr = [];

for(
let i=0;
i<totalCount;
i++
){

arr.push(
base +
(i < extra ? 1 : 0)
);

}

setDistributionPreview(arr);

}

/* EXTRA */

if(distributionMode === "extra"){

const arr = [];

const full =
Math.floor(
totalQuestions / quantity
);

for(
let i=0;
i<full;
i++
){

arr.push(quantity);

}

if(remainder > 0){

arr.push(remainder);

}

setDistributionPreview(arr);

}

/* MANUAL */

if(distributionMode === "manual"){

const arr =
manualDistribution
.split(",")

.map((n)=>
Number(n.trim())
)

.filter(Boolean);

setDistributionPreview(arr);

}

},[
includeAllQuestions,
distributionMode,
manualDistribution,
totalQuestions,
quantity,
remainder,
]);

/* =========================================
GENERATE
========================================= */

async function handleGenerate(){

console.log(
"START GENERATE CLICKED"
);

if(!mockName){

alert(
"Enter mock name"
);

return;

}

if(!subjectId){

alert(
"Select subject"
);

return;

}

if(quantity > totalQuestions){

alert(
`Only ${totalQuestions} questions available`
);

return;

}

if(
desiredMocks > totalMocks &&
!includeAllQuestions
){

alert(
`Maximum mocks possible is ${totalMocks}`
);

return;

}

try{

setLoading(true);

setGenerationProgress(0);

const generated = [];

const finalDistribution =

includeAllQuestions

?

distributionPreview

:

Array(desiredMocks)
.fill(quantity);

console.log(
"FINAL DISTRIBUTION:",
finalDistribution
);

for(
let i=0;
i<finalDistribution.length;
i++
){

const currentName =
`${mockName} ${i + 1}`;

console.log(
"FINAL DEBUG",
{

currentName,

mockType,

subject:
subjects.find(
(s)=>
s.id === subjectId
)?.name || "",

topic:
filteredTopics.find(
(item)=>
item.id === topic
)?.name || "",

subTopic:
filteredSubTopics.find(
(item)=>
item.id === subTopic
)?.name || "",

duration:
Number(duration),

distribution:[
finalDistribution[i]
],

}
);

await generateMocks({

mockName:
currentName,

mockType,

subject:
subjects.find(
(s)=>
s.id === subjectId
)?.name || "",

topic:
filteredTopics.find(
(item)=>
item.id === topic
)?.name || "",

subTopic:
filteredSubTopics.find(
(item)=>
item.id === subTopic
)?.name || "",

duration:
Number(duration),

distribution:[
finalDistribution[i]
],

});

generated.push(
currentName
);

setGenerationProgress(
i + 1
);

}

setGeneratedMocks(
generated
);

alert(
`${generated.length} mocks generated successfully`
);

}catch(error){

console.error(
"GENERATION ERROR:",
error
);

alert(
error.message ||
"Failed to generate mocks"
);

}finally{

setLoading(false);

}

}

return(

<AdminLayout>

<div className="page mock-generator-page">

<div className="page-header">

<div>

<h2>
Mock Generator
</h2>

<p>
Generate intelligent mock tests automatically
</p>

</div>

</div>

<div className="mock-top-stats">

<div className="mock-stat-card">

<div className="mock-stat-icon">
📄
</div>

<div className="mock-stat-content">

<span>
Total Questions
</span>

<h2>
{totalQuestions}
</h2>

</div>

</div>

<div className="mock-stat-card">

<div className="mock-stat-icon green">
📋
</div>

<div className="mock-stat-content">

<span>
Maximum Mocks
</span>

<h2>
{totalMocks}
</h2>

</div>

</div>

</div>

<div className="mock-section">

<div className="mock-section-title">
⚙️ Mock Configuration
</div>

<div className="mock-generator-grid">

<div className="form-group">

<label>
Mock Name
</label>

<input
type="text"
placeholder="Enter Mock Name"
value={mockName}
onChange={(e)=>
setMockName(
e.target.value
)
}
/>

</div>

<div className="form-group">

<label>
Mock Type
</label>

<select
value={mockType}
onChange={(e)=>
setMockType(
e.target.value
)
}
>

<option value="full">
Full Mock
</option>

<option value="sectional">
Sectional Mock
</option>

</select>

</div>

<div className="form-group">

<label>
Subject
</label>

<select
value={subjectId}
onChange={(e)=>{

setSubjectId(
e.target.value
);

setTopic("");
setSubTopic("");

}}
>

<option value="">
Select Subject
</option>

{subjects.map((subject)=>(

<option
key={subject.id}
value={subject.id}
>

{subject.name}

</option>

))}

</select>

</div>

</div>

<button
className="generate-btn"
onClick={handleGenerate}
disabled={loading}
>

{loading
?
`Generating ${generationProgress}...`
:
"🚀 Generate Mocks"}

</button>

</div>

</AdminLayout>

);

}
