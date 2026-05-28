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

        {/* Heading Block */}
        <div className="auth-heading">
          <div className="auth-badge">
            <span>🎓</span> Exam Portal
          </div>
          <h1>
            Welcome<br />
            UGC NET – ODIA<br />
            Aspirant
          </h1>
          <p className="auth-subtitle">Best of luck for your exam.</p>
        </div>

        {/* Email Field */}
        <div className="auth-field">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password Field */}
        <div className="auth-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Login Button */}
        <button
          className="auth-btn"
          onClick={login}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In →"}
        </button>

        {/* Footer */}
        <div className="auth-footer">
          Don't have an account?
          <Link to="/register">Create Account</Link>
        </div>

      </div>
    </div>
  );
}
