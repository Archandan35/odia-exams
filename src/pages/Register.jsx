import {
useState,
} from "react";

import {
createUserWithEmailAndPassword,
} from "firebase/auth";

import {
collection,
addDoc,
} from "firebase/firestore";

import {
auth,
db,
} from "../firebase/config";

import {
useNavigate,
Link,
} from "react-router-dom";

export default function Register(){

const nav =
useNavigate();

const [name,setName] =
useState("");

const [email,setEmail] =
useState("");

const [password,
setPassword] =
useState("");

const [role,setRole] =
useState("student");

const [loading,
setLoading] =
useState(false);

async function register(){

try{

setLoading(true);

const res =
await createUserWithEmailAndPassword(
auth,
email,
password
);

await addDoc(
collection(db,"users"),
{
uid:res.user.uid,
name,
email,
role,
createdAt:
Date.now(),
}
);

alert(
"Registration Successful"
);

nav("/");

}catch(e){

alert(e.message);

}

setLoading(false);

}

return(

<div className="auth-container">

<div className="auth-card">

<h1>
Create Account
</h1>

<input
placeholder="Full Name"
value={name}
onChange={(e)=>
setName(
e.target.value
)
}
/>

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

<select
value={role}
onChange={(e)=>
setRole(
e.target.value
)
}
>

<option value="student">
Student
</option>

<option value="admin">
Admin
</option>

</select>

<button
onClick={register}
disabled={loading}
>

{
loading
?
"Creating..."
:
"Register"
}

</button>

<Link to="/">

Already have account?

</Link>

</div>

</div>

);

}
