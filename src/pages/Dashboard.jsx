import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import "./Dashboard.css";

const defaultPatients = [
  {
    id: 1,
    name: "Raj Kumar",
    age: 72,
    region: "Assam",
    language: "Assamese",
    score: 78,
    status: "Stable",
  },
  {
    id: 2,
    name: "Mary Das",
    age: 69,
    region: "Meghalaya",
    language: "Khasi",
    score: 64,
    status: "Monitor",
  },
  {
    id: 3,
    name: "John Singh",
    age: 75,
    region: "Nagaland",
    language: "English",
    score: 86,
    status: "Improving",
  },
  {
    id: 4,
    name: "Lalhmingi",
    age: 71,
    region: "Mizoram",
    language: "Mizo",
    score: 59,
    status: "Attention",
  },
];

function Dashboard() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [firebaseLoading, setFirebaseLoading] =
    useState(true);

  const [firebaseError, setFirebaseError] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      try {
        const savedPatients =
          localStorage.getItem(
            "mindcare_patients"
          );

        const savedSessions =
          localStorage.getItem(
            "mindcare_game_sessions"
          );

        const savedAlerts =
          localStorage.getItem(
            "mindcare_alerts"
          );

        setPatients(
          savedPatients
            ? JSON.parse(savedPatients)
            : defaultPatients
        );

        setSessions(
          savedSessions
            ? JSON.parse(savedSessions)
            : []
        );

        setAlerts(
          savedAlerts
            ? JSON.parse(savedAlerts)
            : []
        );
      } catch (error) {
        console.error(
          "Local dashboard data load failed:",
          error
        );

        setPatients(defaultPatients);
        setSessions([]);
        setAlerts([]);
      }

      try {
        const [
          patientsSnapshot,
          sessionsSnapshot,
          alertsSnapshot,
        ] = await Promise.all([
          getDocs(collection(db, "patients")),
          getDocs(
            collection(db, "gameSessions")
          ),
          getDocs(
            collection(db, "alerts")
          ),
        ]);

        if (!mounted) return;

        if (patientsSnapshot.docs.length > 0) {
          const firebasePatients =
            patientsSnapshot.docs.map(
              (patientDoc) => ({
                id: String(patientDoc.id),
                ...patientDoc.data(),
              })
            );

          setPatients(firebasePatients);

          localStorage.setItem(
            "mindcare_patients",
            JSON.stringify(firebasePatients)
          );
        }

        if (sessionsSnapshot.docs.length > 0) {
          const firebaseSessions =
            sessionsSnapshot.docs.map(
              (sessionDoc) => ({
                id: String(sessionDoc.id),
                ...sessionDoc.data(),
              })
            );

          setSessions(firebaseSessions);

          localStorage.setItem(
            "mindcare_game_sessions",
            JSON.stringify(firebaseSessions)
          );
        }

        if (alertsSnapshot.docs.length > 0) {
          const firebaseAlerts =
            alertsSnapshot.docs.map(
              (alertDoc) => ({
                id: String(alertDoc.id),
                ...alertDoc.data(),
              })
            );

          setAlerts(firebaseAlerts);

          localStorage.setItem(
            "mindcare_alerts",
            JSON.stringify(firebaseAlerts)
          );
        }

        setFirebaseError(false);
      } catch (error) {
        console.error(
          "Firebase dashboard data load failed:",
          error
        );

        if (mounted) {
          setFirebaseError(true);
        }
      } finally {
        if (mounted) {
          setFirebaseLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const totalPatients = patients.length;

  const today = new Date().toDateString();

  const todaySessions = sessions.filter(
    (session) =>
      new Date(session.date).toDateString() === today
  );

  const activePatientIds = [
    ...new Set(
      todaySessions
        .filter((session) => session.patientId)
        .map((session) => String(session.patientId))
    ),
  ];

  const activeToday =
    activePatientIds.length;

  const averageScore =
    sessions.length > 0
      ? Math.round(
          sessions.reduce(
            (sum, session) =>
              sum + Number(session.score || 0),
            0
          ) / sessions.length
        )
      : 0;

  const attentionAlerts = alerts.filter(
    (alert) =>
      alert.type === "Attention" &&
      alert.status === "New"
  ).length;

  const displayAttentionAlerts =
    attentionAlerts;

  const weeklyData = [
    ["Mon", 0],
    ["Tue", 0],
    ["Wed", 0],
    ["Thu", 0],
    ["Fri", 0],
    ["Sat", 0],
    ["Sun", 0],
  ];

  sessions.forEach((session) => {
    const date = new Date(session.date);

    const day = date.toLocaleDateString(
      "en-US",
      {
        weekday: "short",
      }
    );

    const item = weeklyData.find(
      (entry) => entry[0] === day
    );

    if (item) {
      item[1] = Math.max(
        item[1],
        Number(session.score || 0)
      );
    }
  });

  return (
    <div className="dashboard-page">

      {/* Welcome */}

      <div className="dashboard-welcome">

        <div>

          <h2>
            Good Evening, Dr. Ananya 👋
          </h2>

          <p>
            Here's today's cognitive care overview.
          </p>

        </div>

      </div>

      {!firebaseLoading && firebaseError && (
        <div
          style={{
            marginBottom: "14px",
            color: "#b45309",
            fontSize: "13px",
          }}
        >
          ⚠️ Firebase sync unavailable. Showing local dashboard data.
        </div>
      )}

      {!firebaseLoading && !firebaseError && (
        <div
          style={{
            marginBottom: "14px",
            color: "#15803d",
            fontSize: "13px",
          }}
        >
          ✓ Dashboard data synced with Firebase
        </div>
      )}

      {/* AI Insight */}

      <div className="ai-insight-banner">

        <div className="ai-insight-banner-icon">
          🤖
        </div>

        <div className="ai-insight-banner-content">

          <span>
            AI Cognitive Insight
          </span>

          <h3>
            {sessions.length > 0
              ? "Patient activity data is being collected."
              : "Start cognitive activities to build patient baselines."}
          </h3>

          <p>
            {sessions.length > 0
              ? `${sessions.length} cognitive game session${
                  sessions.length > 1
                    ? "s have"
                    : " has"
                } been recorded so far.`
              : "Game performance can be used to personalize future exercises."}
          </p>

        </div>

        <button
          onClick={() => navigate("/alerts")}
        >
          View Alerts →
        </button>

      </div>

      {/* Stats */}

      <div className="dashboard-stats">

        <div className="dashboard-stat-card">

          <div className="stat-icon">
            👴
          </div>

          <div>
            <span>Total Patients</span>
            <strong>{totalPatients}</strong>
            <small>Registered patients</small>
          </div>

        </div>

        <div className="dashboard-stat-card">

          <div className="stat-icon">
            🟢
          </div>

          <div>
            <span>Active Today</span>
            <strong>{activeToday}</strong>
            <small>Patients with activity</small>
          </div>

        </div>

        <div className="dashboard-stat-card">

          <div className="stat-icon">
            🎮
          </div>

          <div>
            <span>Average Score</span>
            <strong>
              {averageScore}/100
            </strong>
            <small>Recorded game sessions</small>
          </div>

        </div>

        <div className="dashboard-stat-card">

          <div className="stat-icon">
            🔔
          </div>

          <div>
            <span>Attention Alerts</span>
            <strong>
              {displayAttentionAlerts}
            </strong>
            <small>New alerts</small>
          </div>

        </div>

      </div>

      {/* Main Grid */}

      <div className="dashboard-main-grid">

        {/* Weekly Chart */}

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div>

              <h3>
                Weekly Cognitive Performance
              </h3>

              <p>
                Activity score by day
              </p>

            </div>

            <button
              onClick={() =>
                navigate("/progress")
              }
            >
              View Progress →
            </button>

          </div>

          <div className="weekly-chart">

            {weeklyData.map(
              ([day, score]) => (

                <div
                  className="weekly-chart-item"
                  key={day}
                >

                  <span>
                    {score}
                  </span>

                  <div className="weekly-bar-area">

                    <div
                      className="weekly-bar"
                      style={{
                        height: `${Math.max(
                          score,
                          5
                        )}%`,
                      }}
                    />

                  </div>

                  <small>
                    {day}
                  </small>

                </div>

              )
            )}

          </div>

          {sessions.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#64748b",
                marginTop: "10px",
              }}
            >
              Complete cognitive games to populate
              this chart.
            </p>
          )}

        </div>

        {/* Quick Actions */}

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div>

              <h3>
                Quick Actions
              </h3>

              <p>
                Common caregiver tasks
              </p>

            </div>

          </div>

          <div className="quick-actions">

            <button
              onClick={() =>
                navigate("/patients")
              }
            >
              <span>👴</span>
              <div>
                <strong>Patients</strong>
                <small>
                  Manage patient profiles
                </small>
              </div>
              <b>→</b>
            </button>

            <button
              onClick={() =>
                navigate("/games")
              }
            >
              <span>🎮</span>
              <div>
                <strong>Cognitive Games</strong>
                <small>
                  Start an activity
                </small>
              </div>
              <b>→</b>
            </button>

            <button
              onClick={() =>
                navigate("/memory")
              }
            >
              <span>🖼️</span>
              <div>
                <strong>Memory Album</strong>
                <small>
                  Manage memories
                </small>
              </div>
              <b>→</b>
            </button>

            <button
              onClick={() =>
                navigate("/alerts")
              }
            >
              <span>🔔</span>
              <div>
                <strong>Alerts</strong>
                <small>
                  Review patient alerts
                </small>
              </div>
              <b>→</b>
            </button>

          </div>

        </div>

      </div>

      {/* Patient Overview */}

      <div className="dashboard-card">

        <div className="dashboard-card-header">

          <div>

            <h3>
              Patient Overview
            </h3>

            <p>
              Recent patient activity
            </p>

          </div>

          <button
            onClick={() =>
              navigate("/patients")
            }
          >
            View All →
          </button>

        </div>

        <div className="dashboard-patient-list">

          {patients.length > 0 ? (

            patients
              .slice(0, 5)
              .map((patient) => (

                <div
                  className="dashboard-patient-row"
                  key={patient.id}
                >

                  <div className="dashboard-patient-info">

                    <div className="dashboard-patient-avatar">
                      {patient.name.charAt(0)}
                    </div>

                    <div>

                      <strong>
                        {patient.name}
                      </strong>

                      <small>
                        Age {patient.age} •{" "}
                        {patient.region}
                      </small>

                    </div>

                  </div>

                  <div className="dashboard-patient-score">

                    <strong>
                      {patient.score}
                    </strong>

                    <span>
                      /100
                    </span>

                  </div>

                  <span
                    className={`dashboard-status ${patient.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {patient.status}
                  </span>

                  <button
                    onClick={() =>
                      navigate(
                        `/patients/${patient.id}`
                      )
                    }
                  >
                    View →
                  </button>

                </div>

              ))

          ) : (

            <div
              style={{
                padding: "30px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              No patients registered yet.
            </div>

          )}

        </div>

      </div>

      {/* NER Banner */}

      <div className="ner-banner">

        <div className="ner-banner-icon">
          🌿
        </div>

        <div>

          <h3>
            Personalized for North Eastern India
          </h3>

          <p>
            MindCare NER can incorporate familiar
            regional places, food, festivals, cultural
            references and preferred languages into
            cognitive activities.
          </p>

        </div>

      </div>

      {/* Disclaimer */}

      <div
        style={{
          marginTop: "18px",
          padding: "14px 18px",
          borderRadius: "12px",
          background: "#f8fafc",
          color: "#64748b",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        ℹ️ Dashboard insights are based on recorded
        cognitive-game activity. They are intended for
        engagement and progress tracking and are not a
        medical diagnosis.
      </div>

    </div>
  );
}

export default Dashboard;