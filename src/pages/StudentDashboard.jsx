import {
useEffect,
useState,
} from "react";

import {
collection,
onSnapshot,
} from "firebase/firestore";

import {
db,
} from "../firebase/config";

import {
useNavigate,
} from "react-router-dom";

import TopNavbar from "../components/TopNavbar";

export default function StudentDashboard(){

const navigate =
useNavigate();

const [subjects,
setSubjects] =
useState([]);

useEffect(()=>{

const unsub =
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

}
);

return ()=>unsub();

},[]);

return(

<div className="page">

<TopNavbar/>

<div className="page-header">

<div>

<h2>
Student Dashboard
</h2>

<p>
Choose a subject
</p>

</div>

<button
onClick={()=>
navigate("/profile")
}
>

My Profile

</button>

</div>

<div className="subject-grid">

{
subjects.map((s)=>(

<div
key={s.id}
className="
subject-card
glass-card
"
>

<h3>
{s.name}
</h3>

<p>
Start mock tests
</p>

<button
onClick={()=>
navigate(
`/exam/${s.id}`
)
}
>

Start Test

</button>

</div>

))
}

</div>

</div>

);

}
