import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("caregiver");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      let userCredential;

      // Try normal Firebase sign-in first.
      try {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      } catch (loginError) {
        // For a project prototype, automatically create the account
        // if it does not exist yet.
        if (
          loginError.code === "auth/user-not-found" ||
          loginError.code === "auth/invalid-credential"
        ) {
          userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
        } else {
          throw loginError;
        }
      }

      const firebaseUser = userCredential.user;

      // Store the selected role in Firestore.
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          email: firebaseUser.email,
          role,
          uid: firebaseUser.uid,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Keep a local cache for the prototype/offline UI.
      const user = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role,
        loggedIn: true,
      };

      localStorage.setItem(
        "mindcare_user",
        JSON.stringify(user)
      );

      if (role === "patient") {
        navigate("/patient-app?patientId=1");
      } else {
        navigate("/");
      }
    } catch (loginError) {
      console.error("Firebase login error:", loginError);

      let message = "Unable to sign in. Please try again.";

      if (loginError.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (loginError.code === "auth/weak-password") {
        message = "Password must be at least 6 characters.";
      } else if (loginError.code === "auth/email-already-in-use") {
        message = "This email is already registered. Please check your password.";
      } else if (loginError.code === "auth/operation-not-allowed") {
        message =
          "Email/Password sign-in is not enabled in Firebase Authentication.";
      } else if (loginError.code === "auth/invalid-credential") {
        message = "Invalid email or password.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          🧠
        </div>

        <h1>MindCare NER</h1>

        <p className="login-subtitle">
          AI-Based Cognitive Gaming &
          Memory Assistance Platform
        </p>

        <div className="role-selector">

          <button
            type="button"
            className={
              role === "caregiver"
                ? "role-btn active"
                : "role-btn"
            }
            onClick={() =>
              setRole("caregiver")
            }
          >
            👨‍⚕️
            <span>Caregiver</span>
          </button>

          <button
            type="button"
            className={
              role === "patient"
                ? "role-btn active"
                : "role-btn"
            }
            onClick={() =>
              setRole("patient")
            }
          >
            👴
            <span>Patient</span>
          </button>

        </div>

        <form onSubmit={handleLogin}>

          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            minLength={6}
            required
          />

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            className="login-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In →"}
          </button>

        </form>

        <div className="demo-login">
          <strong>Prototype Demo</strong>

          <p>
            Firebase Authentication is used for
            prototype sign-in. New demo accounts
            can be created automatically.
          </p>
        </div>

        <div className="login-footer">
          MindCare NER • Cognitive Care Platform
        </div>

      </div>

    </div>
  );
}

export default Login;

