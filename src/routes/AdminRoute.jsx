import {
  Navigate,
} from "react-router-dom";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import {
  useEffect,
  useState,
} from "react";

import {
  auth,
  db,
} from "../firebase/config";

export default function AdminRoute({
  children,
}) {

  const [loading, setLoading] =
    useState(true);

  const [allowed, setAllowed] =
    useState(false);

  useEffect(() => {

    async function checkAdmin() {

      const unsubscribe =
        onAuthStateChanged(
          auth,
          async (u) => {

            if (!u) {

              setAllowed(false);

              setLoading(false);

              return;

            }

            const snapshot =
              await getDocs(
                collection(
                  db,
                  "users"
                )
              );

            let found = false;

            snapshot.forEach((d) => {

              const data = d.data();

              if (
                data.email ===
                  u.email &&
                data.role ===
                  "admin"
              ) {

                found = true;

              }
            });

            setAllowed(found);

            setLoading(false);

          }
        );

      return () => unsubscribe();

    }

    checkAdmin();

  }, []);

  if (loading) {

    return (
      <div className="page">
        Checking Admin...
      </div>
    );
  }

  if (!allowed) {

    return (
      <Navigate to="/" />
    );
  }

  return children;
}
