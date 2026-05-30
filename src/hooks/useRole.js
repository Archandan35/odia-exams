import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase/config";

/* =========================================
   ROLE HELPER
   Centralised role check used across the app.
   isAdmin = admin | super-admin | superadmin
   isStudent = student (default fallback)
========================================= */
export function isAdminRole(role) {
  if (!role) return false;
  const r = role.toLowerCase().replace("-", "");
  return r === "admin" || r === "superadmin";
}

export function useRole() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setRole(null);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users"),
      where("uid", "==", auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setRole(data.role || "student");
      } else {
        setRole("student");
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { role, loading, isAdmin: isAdminRole(role) };
}
