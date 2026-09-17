import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";

import PatientApp from "./pages/PatientApp";
import Layout from "./components/Layout";
import MemoryAssistant from "./pages/MemoryAssistant";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetails from "./pages/PatientDetails";
import Games from "./pages/Games";
import MemoryMatch from "./pages/MemoryMatch";
import GamePlay from "./pages/GamePlay";
import Progress from "./pages/Progress";
import MemoryAlbum from "./pages/MemoryAlbum";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

import { auth } from "./firebase";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Wait until Firebase finishes checking the existing session.
  if (user === undefined) {
    return (
      <div className="app-loading">
        <div>
          <div style={{ fontSize: "42px", textAlign: "center" }}>🧠</div>
          <p>Loading MindCare NER...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PatientProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return (
      <div className="app-loading">
        <div>
          <div style={{ fontSize: "42px", textAlign: "center" }}>🧠</div>
          <p>Loading MindCare NER...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("mindcare_user");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!authReady) {
    return (
      <div className="app-loading">
        <div>
          <div style={{ fontSize: "42px", textAlign: "center" }}>🧠</div>
          <p>Loading MindCare NER...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* Public Login */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <Login />
          }
        />

        {/* Patient App */}
        <Route
          path="/patient-app"
          element={
            <PatientProtectedRoute>
              <PatientApp />
            </PatientProtectedRoute>
          }
        />

        {/* Caregiver Dashboard */}
        <Route
          element={
            <ProtectedRoute>
              <Layout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route
            path="/memory-assistant"
            element={<MemoryAssistant />}
          />

          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/patients"
            element={<Patients />}
          />

          <Route
            path="/patients/:id"
            element={<PatientDetails />}
          />

          <Route
            path="/games"
            element={<Games />}
          />

          <Route
            path="/games/memory-match"
            element={<MemoryMatch />}
          />

          <Route
            path="/games/remember-objects"
            element={<GamePlay />}
          />

          <Route
            path="/games/sequence"
            element={<GamePlay />}
          />

          <Route
            path="/games/who-is-this"
            element={<GamePlay />}
          />

          <Route
            path="/games/ner-memory"
            element={<GamePlay />}
          />

          <Route
            path="/games/focus-challenge"
            element={<GamePlay />}
          />

          <Route
            path="/progress"
            element={<Progress />}
          />

          <Route
            path="/memory"
            element={<MemoryAlbum />}
          />

          <Route
            path="/alerts"
            element={<Alerts />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
        </Route>

        {/* Unknown URL */}
        <Route
          path="*"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
