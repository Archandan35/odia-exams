import AdminSidebar from "../components/AdminSidebar";

import TopNavbar from "../components/TopNavbar";

export default function AdminLayout({
children,
}) {

return(

<div className="admin-layout">

<AdminSidebar/>

<div className="admin-content">

<TopNavbar/>

{children}

</div>

</div>

);

}
