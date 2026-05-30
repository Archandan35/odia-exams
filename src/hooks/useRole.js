// src/hooks/useRole.js
import { useEffect, useState, useRef } from "react";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, setDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

/* =========================================
   ROLE HELPERS
   Accepts any casing/separator variant:
   admin | super-admin | superadmin | Super Admin
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

/* =========================================
   PRESENCE CONSTANTS
   HEARTBEAT_MS  — how often we write isOnline=true
   OFFLINE_DELAY — how long after visibility-hidden
                   before we mark offline (debounce
                   for short tab-switches)
========================================= */
const HEARTBEAT_MS  = 20_000;  // 20 s — write isOnline=true
const OFFLINE_DELAY = 10_000;  // 10 s — mark offline after hidden

export function useRole() {
  const [role,        setRole]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [userId,      setUserId]      = useState(null);
  const [permissions, setPermissions] = useState([]);

  /* Refs so event listeners always see the latest values */
  const userIdRef    = useRef(null);
  const offlineTimer = useRef(null);

  /* ── Shared helpers ── */
  const markOnline = (id) => {
    if (!id) return;
    updateDoc(doc(db, "users", id), {
      isOnline: true,
      lastSeen: Date.now(),
    }).catch(() => {});
  };

  const markOffline = (id) => {
    if (!id) return;
    updateDoc(doc(db, "users", id), {
      isOnline: false,
      lastSeen: Date.now(),
    }).catch(() => {});
  };

  /* ── Auth → Firestore presence bootstrap ── */
  useEffect(() => {
    let unsubSnap = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      /* Clean up previous listener when auth changes */
      if (unsubSnap) { unsubSnap(); unsubSnap = null; }

      if (!user) {
        /* Mark the previous user offline before clearing state */
        if (userIdRef.current) markOffline(userIdRef.current);
        setRole(null);
        setUserId(null);
        userIdRef.current = null;
        setPermissions([]);
        setLoading(false);
        return;
      }

      const q = query(collection(db, "users"), where("uid", "==", user.uid));

      unsubSnap = onSnapshot(q, async (snap) => {
        if (!snap.empty) {
          const d    = snap.docs[0];
          const data = d.data();

          setRole(data.role || "student");
          setUserId(d.id);
          userIdRef.current = d.id;
          setPermissions(data.permissions || []);

          /* FIX #5 — set isOnline=true and record lastLogin + lastSeen */
          updateDoc(doc(db, "users", d.id), {
            isOnline:  true,
            lastLogin: Date.now(),
            lastSeen:  Date.now(),
          }).catch(() => {});

        } else {
          /* Auto-create Firestore profile for Auth-only accounts */
          try {
            const newRef = doc(collection(db, "users"));
            await setDoc(newRef, {
              uid:         user.uid,
              email:       user.email || "",
              firstName:   user.displayName?.split(" ")[0] || "",
              lastName:    user.displayName?.split(" ").slice(1).join(" ") || "",
              name:        user.displayName || user.email || "",
              username:    "",
              role:        "student",
              status:      "active",
              isOnline:    true,
              createdAt:   Date.now(),
              lastLogin:   Date.now(),
              lastSeen:    Date.now(),
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

    /* ── FIX #5 — Mark offline on tab close / navigation away ── */
    const handleUnload = () => {
      const id = userIdRef.current;
      if (id) markOffline(id);
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide",     handleUnload);

    return () => {
      unsubAuth();
      if (unsubSnap) unsubSnap();
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide",     handleUnload);
    };
  }, []);

  /* ── Heartbeat + visibility-based offline ── */
  useEffect(() => {
    if (!userId) return;

    /* Immediate ping on mount / userId change */
    markOnline(userId);

    /* Regular heartbeat — keeps isOnline=true while tab is active */
    const interval = setInterval(() => {
      /* Only ping if tab is visible */
      if (document.visibilityState === "visible") {
        markOnline(userId);
      }
    }, HEARTBEAT_MS);

    /* ── FIX #5 — Tab visibility change ── */
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        /* Tab came back — cancel any pending offline timer, go online */
        if (offlineTimer.current) {
          clearTimeout(offlineTimer.current);
          offlineTimer.current = null;
        }
        markOnline(userId);
      } else {
        /* Tab hidden — start a short delay before marking offline.
           This avoids false-offline flashes during quick tab switches. */
        offlineTimer.current = setTimeout(() => {
          markOffline(userId);
          offlineTimer.current = null;
        }, OFFLINE_DELAY);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      if (offlineTimer.current) {
        clearTimeout(offlineTimer.current);
        offlineTimer.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibility);

      /* Mark offline when this hook unmounts (component tree unmounts = logout) */
      markOffline(userId);
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
