import Sidebar from "./Sidebar";

export default function AdminLayout({ children }) {

  return (

    <div className="admin-layout">

      <Sidebar />

      <div className="admin-content">

        <div className="topbar">

          <h2>
            Admin Panel
          </h2>

        </div>

        {children}

      </div>

    </div>
  );
}
