import {
useEffect,
useState,
} from "react";

import {
Navigate,
} from "react-router-dom";

import {
auth,
db,
} from "../firebase/config";

import {
collection,
query,
where,
getDocs,
} from "firebase/firestore";

export default function AdminRoute({
children,
}) {

const [loading,setLoading] =
useState(true);

const [isAdmin,setIsAdmin] =
useState(false);

useEffect(()=>{

async function checkAdmin(){

if(!auth.currentUser){

setLoading(false);

return;

}

const q = query(
collection(db,"users"),
where(
"uid",
"==",
auth.currentUser.uid
)
);

const snapshot =
await getDocs(q);

if(!snapshot.empty){

const user =
snapshot.docs[0].data();

if(
user.role ===
"admin"
){

setIsAdmin(true);

}

}

setLoading(false);

}

checkAdmin();

},[]);

if(loading){

return(

<div className="page">

<h2>
Checking Admin...
</h2>

</div>

);

}

return isAdmin
?
children
:
<Navigate to="/" />;

}
