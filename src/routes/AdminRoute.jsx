import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase/config";
import { isAdminRole } from "../hooks/useRole";

/* =========================================
   AdminRoute
   Grants access to: admin, super-admin, superadmin
   Redirects students / unauthenticated users to /dashboard
========================================= */
export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading"); // "loading" | "allowed" | "denied"

  useEffect(() => {
    /* Wait for Firebase Auth to resolve before querying Firestore */
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setStatus("denied");
        return;
      }

      const q = query(
        collection(db, "users"),
        where("uid", "==", user.uid)
      );

      const unsubSnap = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const role = snap.docs[0].data().role || "student";
          setStatus(isAdminRole(role) ? "allowed" : "denied");
        } else {
          setStatus("denied");
        }
      });

      /* Clean up Firestore listener when auth changes */
      return () => unsubSnap();
    });

    return () => unsubAuth();
  }, []);

  if (status === "loading") return null;
  if (status === "denied")  return <Navigate to="/dashboard" replace />;
  return children;
}
