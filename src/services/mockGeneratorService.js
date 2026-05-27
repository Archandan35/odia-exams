import {
addDoc,
collection,
serverTimestamp,
} from "firebase/firestore";

import { db }
from "../firebase/config";

/* =========================================
SHUFFLE
========================================= */

function shuffleArray(array){

const arr = [...array];

for(
let i = arr.length - 1;
i > 0;
i--
){

const j =
Math.floor(
Math.random() * (i + 1)
);

[arr[i],arr[j]] =
[arr[j],arr[i]];

}

return arr;

}

/* =========================================
GENERATE MOCKS
========================================= */

export async function generateMocks({

mockName,
mockType,

subject,
topic,
subTopic,

duration,

distribution,

questions,

}){

try{

if(
!questions ||
questions.length === 0
){

throw new Error(
"No questions found"
);

}

const shuffledQuestions =
shuffleArray(questions);

let currentIndex = 0;

for(
let i=0;
i<distribution.length;
i++
){

const questionCount =
distribution[i];

const selectedQuestions =
shuffledQuestions.slice(

currentIndex,

currentIndex +
questionCount

);

currentIndex +=
questionCount;

await addDoc(
collection(db,"exams"),
{

name:
`${mockName} ${i + 1}`,

mockType,

subject:
subject || "",

topic:
topic || "",

subTopic:
subTopic || "",

duration,

totalQuestions:
questionCount,

questionIds:
selectedQuestions.map(
(q)=>q.id
),

questions:
selectedQuestions,

createdAt:
serverTimestamp(),

}
);

}

return {

success:true,

};

}catch(error){

console.error(
"MOCK GENERATION ERROR:",
error
);

throw error;

}

}
