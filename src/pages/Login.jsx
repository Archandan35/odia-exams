import {
useState,
} from "react";

import {
signInWithEmailAndPassword,
} from "firebase/auth";

import {
collection,
query,
where,
getDocs,
} from "firebase/firestore";

import {
auth,
db,
} from "../firebase/config";

import {
useNavigate,
Link,
} from "react-router-dom";

export default function Login(){

const nav =
useNavigate();

const [email,setEmail] =
useState("");

const [password,
setPassword] =
useState("");

const [loading,
setLoading] =
useState(false);

async function login(){

try{

setLoading(true);

const res =
await signInWithEmailAndPassword(
auth,
email,
password
);

const q = query(
collection(db,"users"),
where(
"uid",
"==",
res.user.uid
)
);

const snapshot =
await getDocs(q);

let role =
"student";

if(!snapshot.empty){

role =
snapshot.docs[0]
.data().role;

}

if(role === "admin"){

nav("/admin");

}else{

nav("/dashboard");

}

}catch(e){

alert(e.message);

}

setLoading(false);

}

return(

<div className="auth-container">

<div className="auth-card">

<h1>
Odia Exam Portal
</h1>

<input
placeholder="Email"
value={email}
onChange={(e)=>
setEmail(
e.target.value
)
}
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>
setPassword(
e.target.value
)
}
/>

<button
onClick={login}
disabled={loading}
>

{
loading
?
"Logging in..."
:
"Login"
}

</button>

<Link to="/register">

Create Account

</Link>

</div>

</div>

);

}
