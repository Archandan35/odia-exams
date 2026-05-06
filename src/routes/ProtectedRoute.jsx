import {
  Navigate,
} from "react-router-dom";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  useEffect,
  useState,
} from "react";

import {
  auth,
} from "../firebase/config";

export default function ProtectedRoute({
  children,
}) {

  const [loading, setLoading] =
    useState(true);

  const [user, setUser] =
    useState(null);

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (u) => {

          setUser(u);

          setLoading(false);

        }
      );

    return () => unsubscribe();

  }, []);

  if (loading) {

    return (
      <div className="page">
        Loading...
      </div>
    );
  }

  if (!user) {

    return <Navigate to="/" />;

  }

  return children;
}
