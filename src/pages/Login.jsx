import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();

  /* ── Form state ── */
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password,   setPassword]   = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [loading,    setLoading]    = useState(false);

  /* ── Forgot password ── */
  const [forgotMode,     setForgotMode]     = useState(false);
  const [resetEmail,     setResetEmail]     = useState("");
  const [resetLoading,   setResetLoading]   = useState(false);
  const [resetSuccess,   setResetSuccess]   = useState(false);
  const [resetError,     setResetError]     = useState("");

  /* ── Error ── */
  const [error, setError] = useState("");

  /* ── Detect identifier type ── */
  function isPhone(val) {
    const cleaned = val.replace(/[\s\-().+]/g, "");
    return /^\d{7,15}$/.test(cleaned);
  }

  async function login() {
    setError("");
    if (!identifier.trim()) { setError("Please enter your email or phone number."); return; }
    if (!password)           { setError("Please enter your password."); return; }

    setLoading(true);
    try {
      let emailToUse = identifier.trim().toLowerCase();

      /* If phone number was entered, look up the associated email in Firestore */
      if (isPhone(identifier)) {
        const digits = identifier.replace(/\D/g, "");
        // Try matching last 10 digits with +91 prefix
        const phoneQuery = query(
          collection(db, "users"),
          where("phone", "in", [
            `+91${digits.slice(-10)}`,
            digits.slice(-10),
            `+91${digits}`,
          ])
        );
        const snap = await getDocs(phoneQuery);
        if (snap.empty) {
          setError("No account found with this phone number.");
          setLoading(false);
          return;
        }
        emailToUse = snap.docs[0].data().email;
      }

      const res = await signInWithEmailAndPassword(auth, emailToUse, password);

      const q = query(collection(db, "users"), where("uid", "==", res.user.uid));
      const snapshot = await getDocs(q);
      const role = !snapshot.empty ? snapshot.docs[0].data().role : "student";

      nav(role === "admin" || role === "super-admin" || role === "superadmin"
        ? "/admin"
        : "/dashboard");
    } catch (e) {
      const code = e.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setError("No account found with these credentials.");
      } else if (code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError(e.message || "Sign in failed. Please try again.");
      }
    }
    setLoading(false);
  }

  async function handleForgotPassword() {
    setResetError("");
    if (!resetEmail.trim()) { setResetError("Please enter your registered email address."); return; }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim().toLowerCase());
      setResetSuccess(true);
    } catch (e) {
      const code = e.code || "";
      if (code === "auth/user-not-found") {
        setResetError("No account found with this email address.");
      } else if (code === "auth/invalid-email") {
        setResetError("Please enter a valid email address.");
      } else {
        setResetError(e.message || "Failed to send reset email. Please try again.");
      }
    }
    setResetLoading(false);
  }

  /* ── Forgot password screen ── */
  if (forgotMode) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-heading">
            <div className="auth-badge">
              <span>🔑</span> Reset Password
            </div>
            <h1>Forgot Your<br />Password?</h1>
            <p className="auth-tagline">We'll send you a reset link</p>
          </div>

          {!resetSuccess ? (
            <>
              {resetError && <p className="auth-error">{resetError}</p>}
              <div className="auth-field">
                <label>Registered Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                />
              </div>
              <button
                className="auth-btn"
                onClick={handleForgotPassword}
                disabled={resetLoading}
              >
                {resetLoading ? "Sending…" : "Send Reset Link →"}
              </button>
            </>
          ) : (
            <div className="auth-success-box">
              <span className="auth-success-icon">✅</span>
              <p>Password reset email sent to <strong>{resetEmail}</strong>.</p>
              <p className="auth-success-sub">Check your inbox and follow the instructions.</p>
            </div>
          )}

          <div className="auth-footer" style={{ marginTop: "var(--sp-5)" }}>
            <button
              className="auth-back-link"
              onClick={() => { setForgotMode(false); setResetSuccess(false); setResetError(""); setResetEmail(""); }}
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main login screen ── */
  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Heading */}
        <div className="auth-heading">
          <div className="auth-badge">
            <span>🎓</span> Exam Portal
          </div>
          <h1>
            Welcome Back<br />Champion! 🎉
          </h1>
          <p className="auth-tagline">Crack UGC NET – Odia with Confidence</p>
          <p className="auth-subtitle">Learn • Practice • Succeed</p>
        </div>

        {/* Error */}
        {error && <p className="auth-error">{error}</p>}

        {/* Identifier */}
        <div className="auth-field">
          <label>Email or Phone Number</label>
          <input
            type="text"
            placeholder="you@example.com or 9876543210"
            value={identifier}
            onChange={e => { setIdentifier(e.target.value); setError(""); }}
          />
        </div>

        {/* Password */}
        <div className="auth-field">
          <label>Password</label>
          <div className="auth-pwd-field">
            <input
              type={showPwd ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
            />
            <button
              type="button"
              className="auth-pwd-toggle"
              onClick={() => setShowPwd(v => !v)}
              tabIndex={-1}
            >
              {showPwd ? "🙈" : "👁"}
            </button>
          </div>
          <div className="auth-forgot-row">
            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => setForgotMode(true)}
            >
              Forgot Password?
            </button>
          </div>
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
