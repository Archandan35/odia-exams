import {
signOut,
} from "firebase/auth";

import {
auth,
} from "../firebase/config";

import {
useNavigate,
} from "react-router-dom";

export default function TopNavbar(){

const navigate =
useNavigate();

const logout = async()=>{

await signOut(auth);

navigate("/");

};

return(

<div className="top-navbar">

<div className="nav-left">

<h2>
Odia Exam Portal
</h2>

</div>

<div className="nav-right">

<div className="avatar">

{
auth.currentUser?.email
?.charAt(0)
?.toUpperCase()
}

</div>

<button
className="delete-btn"
onClick={logout}
>

Logout

</button>

</div>

</div>

);

}
