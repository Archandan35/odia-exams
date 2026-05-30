// src/hooks/useRole.js
import { useEffect, useState, useRef } from "react";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, getDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

/* =========================================
   ROLE HELPER
   Accepts: admin | super-admin | superadmin | Super Admin
========================================= */
export function isAdminRole(role) {
  if (!role) return false;
  const r = String(role).toLowerCase().replace(/[\s_-]/g, "");
  return r === "admin" || r === "superadmin";
}

export function isSuperAdminRole(role) {
  if (!role) return false;
  const r = String(role).toLowerCase().replace(/[\s_-]/g, "");
  return r === "superadmin";
}

export function useRole() {
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId]   = useState(null);
  const [permissions, setPermissions] = useState([]);
  const userIdRef = useRef(null);

  useEffect(() => {
    let unsubSnap = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubSnap) { unsubSnap(); unsubSnap = null; }

      if (!user) {
        setRole(null);
        setUserId(null);
        userIdRef.current = null;
        setPermissions([]);
        setLoading(false);
        return;
      }

      /* Try to find an existing Firestore user doc by uid */
      const q = query(collection(db, "users"), where("uid", "==", user.uid));

      unsubSnap = onSnapshot(q, async (snap) => {
        if (!snap.empty) {
          const d    = snap.docs[0];
          const data = d.data();
          setRole(data.role || "student");
          setUserId(d.id);
          userIdRef.current = d.id;
          setPermissions(data.permissions || []);

          updateDoc(doc(db, "users", d.id), {
            isOnline:  true,
            lastLogin: Date.now(),
            lastSeen:  Date.now(),
          }).catch(() => {});
        } else {
          /* Auto-create a Firestore profile for Auth-only users
             (covers users created directly in Firebase Authentication) */
          try {
            const newRef = doc(collection(db, "users"));
            await setDoc(newRef, {
              uid:       user.uid,
              email:     user.email || "",
              firstName: user.displayName?.split(" ")[0] || "",
              lastName:  user.displayName?.split(" ").slice(1).join(" ") || "",
              name:      user.displayName || user.email || "",
              username:  "",
              role:      "student",
              status:    "active",
              isOnline:  true,
              createdAt: Date.now(),
              lastLogin: Date.now(),
              lastSeen:  Date.now(),
              permissions: [],
            });
            setRole("student");
            setUserId(newRef.id);
            userIdRef.current = newRef.id;
            setPermissions([]);
          } catch {
            setRole("student");
          }
        }
        setLoading(false);
      });
    });

    /* Offline on unload */
    const markOffline = () => {
      const id = userIdRef.current;
      if (id) {
        updateDoc(doc(db, "users", id), {
          isOnline: false,
          lastSeen: Date.now(),
        }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", markOffline);
    window.addEventListener("pagehide",     markOffline);

    return () => {
      unsubAuth();
      if (unsubSnap) unsubSnap();
      window.removeEventListener("beforeunload", markOffline);
      window.removeEventListener("pagehide",     markOffline);
    };
  }, []);

  /* Heartbeat — keeps isOnline=true while tab is open */
  useEffect(() => {
    if (!userId) return;

    const ping = () => {
      updateDoc(doc(db, "users", userId), {
        isOnline: true,
        lastSeen: Date.now(),
      }).catch(() => {});
    };

    ping();
    const interval = setInterval(ping, 25_000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") ping();
      else {
        updateDoc(doc(db, "users", userId), {
          isOnline: false,
          lastSeen: Date.now(),
        }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      updateDoc(doc(db, "users", userId), {
        isOnline: false,
        lastSeen: Date.now(),
      }).catch(() => {});
    };
  }, [userId]);

  return {
    role,
    loading,
    userId,
    permissions,
    isAdmin:      isAdminRole(role),
    isSuperAdmin: isSuperAdminRole(role),
  };
}
