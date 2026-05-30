import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Navigate } from "react-router-dom";
import { db, auth } from "../firebase/config";

/* =========================================
   AdminRoute
   Grants access to: admin, super-admin
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
        setStatus(role === "admin" || role === "super-admin" ? "allowed" : "denied");
      } else {
        // No user doc — check if this is the original admin account
        // by falling back to auth claim or denying access
        setStatus("denied");
      }
    });

    return () => unsub();
  }, []);

  if (status === "loading") return null;
  if (status === "denied")  return <Navigate to="/dashboard" replace />;
  return children;
}
