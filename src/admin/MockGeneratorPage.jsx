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
totalMocks
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

for(
let i = 1;
i <= desiredMocks;
i++
){

const currentName =
`${mockName} ${i}`;

await generateMocks({

mockName:
currentName,

mockType,

subjectId,

topic,

subTopic,

quantity:
Number(quantity),

duration:
Number(duration),

desiredMocks:1,

});

generated.push(
currentName
);

setGenerationProgress(i);

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
Generate full and sectional mocks automatically
</p>

</div>

</div>

{/* =========================================
FORM GRID
========================================= */}

<div className="mock-generator-grid">

{/* MOCK NAME */}

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

{/* MOCK TYPE */}

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

{/* SUBJECT */}

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

{/* TOPIC */}

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

{/* SUBTOPIC */}

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

{/* QUESTIONS */}

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

{/* DURATION */}

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

{/* DESIRED MOCKS */}

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

{/* =========================================
STATS
========================================= */}

<div className="stats-box">

<h3>

Total Questions Available:
{" "}
{totalQuestions}

</h3>

<h3>

Maximum Mocks Possible:
{" "}
{totalMocks}

</h3>

</div>

{/* =========================================
PROGRESS
========================================= */}

{loading && (

<div className="stats-box">

<h3>

Generating:
{" "}
{generationProgress}
/
{desiredMocks}

</h3>

</div>

)}

{/* =========================================
GENERATED
========================================= */}

{generatedMocks.length > 0 && (

<div className="stats-box">

<h3>

Successfully Generated:
{" "}
{generatedMocks.length}

</h3>

<div
style={{
display:"flex",
gap:"12px",
flexWrap:"wrap",
}}
>

{generatedMocks.map((m)=>(

<div
key={m}
style={{
background:"#2563eb",
padding:"8px 14px",
borderRadius:"10px",
fontWeight:"700",
}}
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

{/* =========================================
BUTTON
========================================= */}

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
