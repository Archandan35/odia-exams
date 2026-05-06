import {
  useState,
} from "react";

import {
  createUserWithEmailAndPassword,
} from "firebase/auth";

import {
  collection,
  addDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/config";

import {
  useNavigate,
  Link,
} from "react-router-dom";

export default function Register() {

  const nav = useNavigate();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password,
    setPassword] =
    useState("");

  const [role, setRole] =
    useState("student");

  async function register() {

    try {

      const res =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      await addDoc(
        collection(db, "users"),
        {
          uid: res.user.uid,
          name,
          email,
          role,
        }
      );

      alert(
        "Registration Successful"
      );

      nav("/");

    } catch (e) {

      alert(e.message);

    }
  }

  return (

    <div className="center">

      <div className="card auth">

        <h1>Register</h1>

        <input
          placeholder="Full Name"
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
        />

        <input
          placeholder="Email"
          onChange={(e) =>
            setEmail(
              e.target.value
            )
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

        <select
          value={role}
          onChange={(e) =>
            setRole(
              e.target.value
            )
          }
        >

          <option value="student">
            Student
          </option>

          <option value="admin">
            Admin
          </option>

        </select>

        <button
          onClick={register}
        >
          Register
        </button>

        <Link to="/">
          Back to Login
        </Link>

      </div>

    </div>
  );
}
