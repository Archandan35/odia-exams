export function parseMCQ(text){

const cleanText =
text
.replace(/\r/g,"\n")
.replace(/\t/g," ")
.replace(/[ ]+/g," ")
.replace(/\n+/g,"\n");

const lines =
cleanText
.split("\n")
.map((l)=>l.trim())
.filter(Boolean);

const questions = [];

let current = null;

function detectLanguage(str){

if(/[଀-୿]/.test(str))
return "odia";

if(/[ऀ-ॿ]/.test(str))
return "hindi";

return "english";

}

function pushCurrent(){

if(
current &&
current.question &&
current.options.length >= 2
){

while(
current.options.length < 4
){

current.options.push("");

}

questions.push(current);

}

}

for(let i=0;i<lines.length;i++){

const line = lines[i];

/* QUESTION DETECTION */

if(

/^\d+[\.\)]/.test(line)

||

/^[୧-୯]+[\.\)]/.test(line)

){

pushCurrent();

current = {

question:
line
.replace(
/^\d+[\.\)]/,
""
)
.replace(
/^[୧-୯]+[\.\)]/,
""
)
.trim(),

options:[],

correctAnswer:0,

difficulty:"easy",

explanation:"",

language:
detectLanguage(line),

confidence:85,

tags:[],

};

}

/* ENGLISH OPTIONS */

else if(
/^[A-D][\)\.\-:]/i.test(line)
){

if(current){

current.options.push(

line
.replace(
/^[A-D][\)\.\-:]/i,
""
)
.trim()

);

}

}

/* ODIA OPTIONS */

else if(
/^\([କଖଗଘ]\)/.test(line)
){

if(current){

current.options.push(

line
.replace(
/^\([କଖଗଘ]\)/,
""
)
.trim()

);

}

}

/* HINDI OPTIONS */

else if(
/^\([कखगघ]\)/.test(line)
){

if(current){

current.options.push(

line
.replace(
/^\([कखगघ]\)/,
""
)
.trim()

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

/* EXPLANATION */

else if(
/^Explanation[:\-]/i.test(line)
){

if(current){

current.explanation =
line
.replace(
/^Explanation[:\-]/i,
""
)
.trim();

}

}

/* MULTI LINE QUESTION */

else{

if(
current &&
current.options.length === 0
){

current.question +=
" " + line;

}

}

}

pushCurrent();

/* REMOVE DUPLICATES */

const uniqueQuestions =
questions.filter(
(q,index,self)=>

index ===
self.findIndex(
(t)=>
t.question ===
q.question
)

);

return uniqueQuestions;

}
