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
} from "firebase/firestore";

import {
db,
} from "../firebase/config";

import {
listenSubjects,
} from "../services/subjectService";

import {
generateMocks,
getFilteredQuestions,
} from "../services/mockGeneratorService";

export default function MockGeneratorPage(){

// =========================================
// STATES
// =========================================

const [subjects,
setSubjects] =
useState([]);

const [questions,
setQuestions] =
useState([]);

const [mockName,
setMockName] =
useState("");

const [mockType,
setMockType] =
useState("full");

const [subjectId,
setSubjectId] =
useState("");

const [topic,
setTopic] =
useState("");

const [subTopic,
setSubTopic] =
useState("");

const [quantity,
setQuantity] =
useState(100);

const [duration,
setDuration] =
useState(60);

const [desiredMocks,
setDesiredMocks] =
useState(1);

const [totalQuestions,
setTotalQuestions] =
useState(0);

const [totalMocks,
setTotalMocks] =
useState(0);

const [loading,
setLoading] =
useState(false);

// =========================================
// LOAD SUBJECTS
// =========================================

useEffect(()=>{

const unsubscribe =
listenSubjects(setSubjects);

return ()=>unsubscribe();

},[]);

// =========================================
// LOAD QUESTIONS
// =========================================

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

// =========================================
// FILTER QUESTIONS
// =========================================

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
q.topic === topic
:
true;

const subTopicMatch =
subTopic
?
q.subTopic ===
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

// =========================================
// QUESTION STATS
// =========================================

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

// =========================================
// TOPICS
// =========================================

const topics =
useMemo(()=>{

return [

...new Set(

questions
.filter(
(q)=>
!subjectId ||
q.subjectId ===
subjectId
)
.map((q)=>q.topic)
.filter(Boolean)

),

];

},[
questions,
subjectId,
]);

// =========================================
// SUBTOPICS
// =========================================

const subTopics =
useMemo(()=>{

return [

...new Set(

questions
.filter((q)=>{

const subjectMatch =
!subjectId ||
q.subjectId ===
subjectId;

const topicMatch =
!topic ||
q.topic === topic;

return (
subjectMatch &&
topicMatch
);

})
.map((q)=>q.subTopic)
.filter(Boolean)

),

];

},[
questions,
subjectId,
topic,
]);

// =========================================
// GENERATE
// =========================================

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
`Maximum ${totalMocks} mocks can be generated`
);

return;
}

try{

setLoading(true);

await generateMocks({

mockName,

mockType,

subjectId,

topic,

subTopic,

quantity:
Number(quantity),

duration:
Number(duration),

desiredMocks:
Number(desiredMocks),

});

alert(
"Mocks Generated Successfully"
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

// =========================================
// UI
// =========================================

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
onChange={(e)=>
setSubjectId(
e.target.value
)
}
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
onChange={(e)=>
setTopic(
e.target.value
)
}
>

<option value="">
All Topics
</option>

{topics.map((t)=>(

<option
key={t}
value={t}
>

{t}

</option>

))}

</select>

</div>

{/* SUB TOPIC */}

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

{subTopics.map((st)=>(

<option
key={st}
value={st}
>

{st}

</option>

))}

</select>

</div>

{/* QUANTITY */}

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
onChange={(e)=>
setDesiredMocks(
Number(
e.target.value
)
)
}
/>

</div>

</div>

{/* STATS */}

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

{/* BUTTON */}

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
