import { useState } from "react";
import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "../firebase/config";

import {
  useNavigate,
  Link,
} from "react-router-dom";

export default function Login() {

  const nav = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  async function login() {

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      nav("/dashboard");

    } catch (e) {

      alert(e.message);

    }
  }

  return (

    <div className="center">

      <div className="card auth">

        <h1>Odia Exam Portal</h1>

        <input
          placeholder="Email"
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        <button onClick={login}>
          Login
        </button>

        <Link to="/register">
          Register
        </Link>

      </div>

    </div>
  );
}
