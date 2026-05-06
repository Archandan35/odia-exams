export function parseMCQ(text){

const lines =
text
.split("\n")
.map((l)=>l.trim())
.filter(Boolean);

const questions = [];

let current = null;

for(let i=0;i<lines.length;i++){

const line = lines[i];

/* QUESTION */

if(
/^\d+[\.\)]/.test(line)
){

if(current){

questions.push(current);

}

current = {

question:
line.replace(
/^\d+[\.\)]/,
""
).trim(),

options:[],

correctAnswer:0,

difficulty:"easy",

explanation:"",

};

}

/* OPTIONS */

else if(
/^[A-D][\)\.\-]/i.test(line)
){

if(current){

current.options.push(

line.replace(
/^[A-D][\)\.\-]/i,
""
).trim()

);

}

}

/* ANSWER */

else if(
/^Answer[:\-]/i.test(line)
){

if(current){

const ans =
line
.split(":")[1]
?.trim()
?.toUpperCase();

const map = {

A:0,
B:1,
C:2,
D:3,

};

current.correctAnswer =
map[ans] || 0;

}

}

}

if(current){

questions.push(current);

}

return questions.filter(
(q)=>
q.question &&
q.options.length >= 2
);

}
