import {
useEffect,
useMemo,
useState,
} from "react";

import AdminLayout
from "./AdminLayout";

import {
collection,
getDocs,
onSnapshot,
} from "firebase/firestore";

import {
db,
} from "../firebase/config";

import {
listenSubjects,
} from "../services/subjectService";

import {
generateMocks,
} from "../services/mockGeneratorService";

export default function MockGeneratorPage(){

/* =========================================
STATES
========================================= */

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
desiredMocks,
setDesiredMocks
] = useState(1);

const [
totalQuestions,
setTotalQuestions
] = useState(0);

const [
totalMocks,
setTotalMocks
] = useState(0);

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
ADVANCED DISTRIBUTION
========================================= */

const [
includeAllQuestions,
setIncludeAllQuestions
] = useState(false);

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

const remainder =
totalQuestions % quantity;

const remainderPercentage =
(remainder / quantity) * 100;

/* =========================================
LOAD SUBJECTS
========================================= */

useEffect(()=>{

const unsubscribe =
listenSubjects(setSubjects);

return ()=>unsubscribe();

},[]);

/* =========================================
LOAD TOPICS
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
LOAD SUBTOPICS
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
LOAD QUESTIONS
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

setQuestions(data);

}

loadQuestions();

},[]);

/* =========================================
FILTERED TOPICS
========================================= */

const filteredTopics =
topics.filter(
(t)=>
t.subjectId ===
subjectId
);

/* =========================================
FILTERED SUBTOPICS
========================================= */

const filteredSubTopics =
subTopics.filter(
(st)=>

st.subjectId ===
subjectId &&

st.topicId ===
topic

);

/* =========================================
FILTER QUESTIONS
========================================= */

const filteredQuestions =
useMemo(()=>{

return questions.filter((q)=>{

const subjectMatch =
subjectId
?
q.subjectId ===
subjectId
:
true;

const topicMatch =
topic
?
q.topicId ===
topic
:
true;

const subTopicMatch =
subTopic
?
q.subTopicId ===
subTopic
:
true;

return (
subjectMatch &&
topicMatch &&
subTopicMatch
);

});

},[
questions,
subjectId,
topic,
subTopic,
]);

/* =========================================
QUESTION STATS
========================================= */

useEffect(()=>{

setTotalQuestions(
filteredQuestions.length
);

setTotalMocks(

Math.floor(
filteredQuestions.length /
quantity
)

);

},[
filteredQuestions,
quantity,
]);

/* =========================================
DISTRIBUTION ENGINE
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

if(
distributionMode ===
"balanced"
){

const totalMockCount =
Math.floor(
totalQuestions /
quantity
);

const base =
Math.floor(
totalQuestions /
totalMockCount
);

const extra =
totalQuestions %
totalMockCount;

const arr = [];

for(
let i = 0;
i < totalMockCount;
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

if(
distributionMode ===
"extra"
){

const arr = [];

const fullMocks =
Math.floor(
totalQuestions /
quantity
);

for(
let i = 0;
i < fullMocks;
i++
){

arr.push(quantity);

}

const rem =
totalQuestions %
quantity;

if(rem > 0){

arr.push(rem);

}

setDistributionPreview(arr);

}

/* MANUAL */

if(
distributionMode ===
"manual"
){

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
]);

/* =========================================
SUGGESTION ENGINE
========================================= */

const recommendedStrategy =

remainderPercentage >= 15

?

"balanced"

:

"extra";

/* =========================================
GENERATE
========================================= */

async function handleGenerate(){

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

if(
desiredMocks >
totalMocks &&
!includeAllQuestions
){

alert(
`Maximum ${totalMocks} mocks possible`
);

return;

}

try{

setLoading(true);

setGenerationProgress(0);

const generated = [];

const finalDistribution =

includeAllQuestions &&
distributionPreview.length > 0

?

distributionPreview

:

Array(desiredMocks)
.fill(quantity);

for(
let i = 0;
i < finalDistribution.length;
i++
){

const currentName =
`${mockName} ${i + 1}`;

await generateMocks({

mockName:
currentName,

mockType,

subjectId,

topic,

subTopic,

quantity:
finalDistribution[i],

duration:
Number(duration),

desiredMocks:1,

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

console.error(error);

alert(
"Failed to generate mocks"
);

}finally{

setLoading(false);

}

}

/* =========================================
UI
========================================= */

return(

<AdminLayout>

<div className="page">

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

{/* FORM */}

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

<div className="form-group">

<label>
Topic
</label>

<select
value={topic}
onChange={(e)=>{

setTopic(
e.target.value
);

setSubTopic("");

}}
>

<option value="">
All Topics
</option>

{filteredTopics.map((t)=>(

<option
key={t.id}
value={t.id}
>

{t.name}

</option>

))}

</select>

</div>

<div className="form-group">

<label>
Sub Topic
</label>

<select
value={subTopic}
onChange={(e)=>
setSubTopic(
e.target.value
)
}
>

<option value="">
All Sub Topics
</option>

{filteredSubTopics.map((st)=>(

<option
key={st.id}
value={st.id}
>

{st.name}

</option>

))}

</select>

</div>

<div className="form-group">

<label>
Questions Per Mock
</label>

<div className="custom-input-group">

<select
value={quantity}
onChange={(e)=>
setQuantity(
Number(
e.target.value
)
)
}
>

<option value={100}>
100 Questions
</option>

<option value={50}>
50 Questions
</option>

<option value={25}>
25 Questions
</option>

{
![100,50,25]
.includes(quantity) && (

<option value={quantity}>

{quantity} Questions

</option>

)
}

</select>

<input
type="number"
placeholder="Custom Questions"
value={quantity}
onChange={(e)=>
setQuantity(
Number(
e.target.value
)
)
}
/>

</div>

</div>

<div className="form-group">

<label>
Duration
</label>

<div className="custom-input-group">

<select
value={duration}
onChange={(e)=>
setDuration(
Number(
e.target.value
)
)
}
>

<option value={60}>
60 mins
</option>

<option value={45}>
45 mins
</option>

<option value={30}>
30 mins
</option>

<option value={15}>
15 mins
</option>

<option value={10}>
10 mins
</option>

{
![60,45,30,15,10]
.includes(duration) && (

<option value={duration}>

{duration} mins

</option>

)
}

</select>

<input
type="number"
placeholder="Custom Duration"
value={duration}
onChange={(e)=>
setDuration(
Number(
e.target.value
)
)
}
/>

</div>

</div>

<div className="form-group">

<label>
Desired Mock Quantity
</label>

<input
type="number"
placeholder="Enter mock quantity"
value={desiredMocks}
max={totalMocks}
onChange={(e)=>{

const value =
Number(
e.target.value
);

if(
value > totalMocks
){

alert(
`Maximum allowed mocks is ${totalMocks}`
);

return;

}

setDesiredMocks(value);

}}
/>

</div>

</div>

{/* STATS */}

<div className="stats-box">

<h3>
Total Questions:
{" "}
{totalQuestions}
</h3>

<h3>
Maximum Mocks:
{" "}
{totalMocks}
</h3>

</div>

{/* ADVANCED DISTRIBUTION */}

<div className="stats-box">

<label className="checkbox-row">

<input
type="checkbox"
checked={
includeAllQuestions
}
onChange={(e)=>
setIncludeAllQuestions(
e.target.checked
)
}
/>

Include All Available Questions

</label>

{includeAllQuestions && (

<>

<div className="recommend-box">

Recommended:
{" "}

<strong>

{
recommendedStrategy ===
"balanced"

?

"Balanced Distribution"

:

"Extra Mock Distribution"
}

</strong>

</div>

<div className="distribution-options">

<label>

<input
type="radio"
name="distribution"
checked={
distributionMode ===
"balanced"
}
onChange={()=>
setDistributionMode(
"balanced"
)
}
/>

Balanced Distribution

</label>

<label>

<input
type="radio"
name="distribution"
checked={
distributionMode ===
"extra"
}
onChange={()=>
setDistributionMode(
"extra"
)
}
/>

Create Extra Mock

</label>

<label>

<input
type="radio"
name="distribution"
checked={
distributionMode ===
"manual"
}
onChange={()=>
setDistributionMode(
"manual"
)
}
/>

Manual Distribution

</label>

</div>

{distributionMode ===
"manual" && (

<input
type="text"
placeholder="Example: 100,100,19"
value={
manualDistribution
}
onChange={(e)=>
setManualDistribution(
e.target.value
)
}
/>

)}

{distributionPreview
.length > 0 && (

<div className="distribution-preview">

{distributionPreview.map(
(q,index)=>(

<div
key={index}
className="distribution-card"
>

Mock {index + 1}
<br />
{q} Questions

</div>

)
)}

</div>

)}

</>

)}

</div>

{/* PROGRESS */}

{loading && (

<div className="stats-box">

<h3>

Generating:
{" "}
{generationProgress}
/
{
includeAllQuestions

?

distributionPreview.length

:

desiredMocks
}

</h3>

</div>

)}

{/* GENERATED */}

{generatedMocks.length > 0 && (

<div className="stats-box">

<h3>

Generated:
{" "}
{generatedMocks.length}

</h3>

<div className="distribution-preview">

{generatedMocks.map((m)=>(

<div
key={m}
className="distribution-card"
>

{m}

</div>

))}

</div>

<button
className="submit-btn"
onClick={()=>
window.location.href =
"/admin/exams"
}
>

View Mock Tests

</button>

</div>

)}

<button
className="submit-btn"
onClick={handleGenerate}
disabled={loading}
>

{loading
?
"Generating..."
:
"Generate Mocks"}

</button>

</div>

</AdminLayout>

);

}
