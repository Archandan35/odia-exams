import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    try {
      setLoading(true);
      const res = await signInWithEmailAndPassword(auth, email, password);

      const q = query(
        collection(db, "users"),
        where("uid", "==", res.user.uid)
      );
      const snapshot = await getDocs(q);
      const role = !snapshot.empty ? snapshot.docs[0].data().role : "student";

      nav(role === "admin" ? "/admin" : "/dashboard");
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Heading */}
        <div className="auth-heading">
          <div className="auth-badge">
            <span>🎓</span> Exam Portal
          </div>
          <h1>
            Welcome Back,<br />Champion! 🎉
          </h1>
          <p className="auth-tagline">Crack UGC NET – Odia with Confidence</p>
          <p className="auth-subtitle">Learn • Practice • Succeed</p>
        </div>

        {/* Email */}
        <div className="auth-field">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="auth-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Sign In Button */}
        <button
          className="auth-btn"
          onClick={login}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In →"}
        </button>

        {/* Create Account Link */}
        <div className="auth-footer">
          Don't have an account?
          <Link to="/register">Create Account</Link>
        </div>

        {/* Divider */}
        <div className="auth-divider" />

        {/* Motivational Quote */}
        <div className="auth-quote">
          <p>
            "Your future is created by what you do today, not tomorrow.
            Practice with purpose, learn from mistakes, and believe in
            your ability to succeed."
          </p>
          <strong>
            Keep going — you are capable of more than you imagine.
          </strong>
        </div>

        {/* Dedication */}
        <div className="auth-dedication">
          <p>
            Built with passion. Dedicated with endless love to my{" "}
            <span className="heart">💕</span> beloved wife, whose support
            inspires me for this milestone.
          </p>
        </div>

      </div>
    </div>
  );
}
