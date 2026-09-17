import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Layout.css";

function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDoc = await getDoc(
            doc(db, "users", currentUser.uid)
          );

          if (userDoc.exists()) {
            setProfile(userDoc.data());
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      } else {
        setProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("mindcare_user");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const displayEmail = user?.email || "Caregiver";
  const displayName = profile?.name || "Caregiver";
  const initials = displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "🏠", end: true },
    { path: "/patients", label: "Patients", icon: "👴" },
    { path: "/games", label: "Cognitive Games", icon: "🎮" },
    { path: "/progress", label: "Progress", icon: "📊" },
    { path: "/memory", label: "Memory Album", icon: "🖼️" },
    { path: "/memory-assistant", label: "Memory Assistant", icon: "🧠" },
    { path: "/alerts", label: "Alerts", icon: "🔔" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">

        <div className="sidebar-brand">
          <div className="brand-icon">🧠</div>
          <div className="brand-text">
            <strong>MindCare NER</strong>
            <span>Cognitive Care Platform</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">{initials || "C"}</div>
            <div className="user-info">
              <strong>{displayName}</strong>
              <span>Caregiver</span>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
            type="button"
          >
            <span>↪</span>
            <span>Logout</span>
          </button>
        </div>

      </aside>

      <main className="main-area">

        <header className="topbar">
          <div>
            <h2>Caregiver Dashboard</h2>
            <p>MindCare NER • Cognitive Care Platform</p>
          </div>

          <div className="topbar-user">
            <div className="topbar-avatar">{initials || "C"}</div>
            <div>
              <strong>{displayName}</strong>
              <span>{displayEmail}</span>
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>

      </main>
    </div>
  );
}

export default Layout;
