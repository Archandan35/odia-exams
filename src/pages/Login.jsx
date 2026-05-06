import {
  useState,
} from "react";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/config";

import {
  useNavigate,
  Link,
} from "react-router-dom";

export default function Login() {

  const nav = useNavigate();

  const [email,
    setEmail] =
    useState("");

  const [password,
    setPassword] =
    useState("");

  async function login() {

    try {

      const res =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const snapshot =
        await getDocs(
          collection(
            db,
            "users"
          )
        );

      let role =
        "student";

      snapshot.forEach((d) => {

        const data =
          d.data();

        if (
          data.email ===
          res.user.email
        ) {

          role =
            data.role;

        }
      });

      if (
        role === "admin"
      ) {

        nav("/admin");

      } else {

        nav("/dashboard");

      }

    } catch (e) {

      alert(e.message);

    }
  }

  return (

    <div className="center">

      <div className="card auth">

        <h1>
          Odia Exam Portal
        </h1>

        <input
          placeholder="Email"
          onChange={(e)=>
            setEmail(
              e.target.value
            )
          }
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e)=>
            setPassword(
              e.target.value
            )
          }
        />

        <button
          onClick={login}
        >
          Login
        </button>

        <Link to="/register">
          Create Account
        </Link>

      </div>

    </div>
  );
}
