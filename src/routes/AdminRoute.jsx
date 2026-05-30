import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Navigate } from "react-router-dom";
import { db, auth } from "../firebase/config";
import { isAdminRole } from "../hooks/useRole";

/* =========================================
   AdminRoute
   Grants access to: admin, super-admin, superadmin
   Redirects students/others to /dashboard
========================================= */
export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading"); // "loading" | "allowed" | "denied"

  useEffect(() => {
    if (!auth.currentUser) {
      setStatus("denied");
      return;
    }

    const q = query(
      collection(db, "users"),
      where("uid", "==", auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const role = snap.docs[0].data().role || "student";
        setStatus(isAdminRole(role) ? "allowed" : "denied");
      } else {
        setStatus("denied");
      }
    });

    return () => unsub();
  }, []);

  if (status === "loading") return null;
  if (status === "denied")  return <Navigate to="/dashboard" replace />;
  return children;
}
