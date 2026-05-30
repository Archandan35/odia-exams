import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

/* =========================================
   ROLE HELPER
   Centralised role check used across the app.
   isAdmin = admin | super-admin | superadmin
   isStudent = student (default fallback)
========================================= */
export function isAdminRole(role) {
  if (!role) return false;
  const r = role.toLowerCase().replace(/-/g, "");
  return r === "admin" || r === "superadmin";
}

export function useRole() {
  const [role,    setRole]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId,  setUserId]  = useState(null); // Firestore doc id

  useEffect(() => {
    /* ── Track auth state ── */
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setRole(null);
        setLoading(false);
        setUserId(null);
        return;
      }

      const q = query(
        collection(db, "users"),
        where("uid", "==", user.uid)
      );

      const unsubSnap = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data();
          setRole(data.role || "student");
          setUserId(docSnap.id);

          /* ── Mark user online ── */
          updateDoc(doc(db, "users", docSnap.id), {
            isOnline:  true,
            lastLogin: Date.now(),
          }).catch(() => {});
        } else {
          setRole("student");
        }
        setLoading(false);
      });

      return () => unsubSnap();
    });

    /* ── Mark user offline on unload ── */
    const handleOffline = () => {
      if (userId) {
        updateDoc(doc(db, "users", userId), { isOnline: false }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleOffline);

    return () => {
      unsubAuth();
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, []);

  /* ── Heartbeat: keep isOnline=true while tab is active ── */
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      updateDoc(doc(db, "users", userId), { isOnline: true }).catch(() => {});
    }, 30_000); // every 30s

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        updateDoc(doc(db, "users", userId), { isOnline: false }).catch(() => {});
      } else {
        updateDoc(doc(db, "users", userId), { isOnline: true }).catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      /* Mark offline when hook unmounts (logout / route change unmount) */
      updateDoc(doc(db, "users", userId), { isOnline: false }).catch(() => {});
    };
  }, [userId]);

  return { role, loading, isAdmin: isAdminRole(role) };
}
