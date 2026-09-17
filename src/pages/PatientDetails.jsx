import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import "./PatientDetails.css";

const defaultPatients = [
  {
    id: "1",
    name: "Raj Kumar",
    age: 72,
    region: "Assam",
    language: "Assamese",
    score: 78,
    status: "Stable",
  },
  {
    id: "2",
    name: "Mary Das",
    age: 69,
    region: "Meghalaya",
    language: "Khasi",
    score: 64,
    status: "Monitor",
  },
  {
    id: "3",
    name: "John Singh",
    age: 75,
    region: "Nagaland",
    language: "English",
    score: 86,
    status: "Improving",
  },
  {
    id: "4",
    name: "Lalhmingi",
    age: 71,
    region: "Mizoram",
    language: "Mizo",
    score: 59,
    status: "Attention",
  },
];

function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [gameSessions, setGameSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatient = async () => {
      setLoading(true);

      try {
        // First try Firebase
        const patientRef = doc(
          db,
          "patients",
          String(id)
        );

        const patientSnapshot =
          await getDoc(patientRef);

        if (patientSnapshot.exists()) {
          const firebasePatient = {
            ...patientSnapshot.data(),
            id: String(patientSnapshot.id),
          };

          setPatient(firebasePatient);

          // Update local cache too
          const savedPatients =
            localStorage.getItem(
              "mindcare_patients"
            );

          if (savedPatients) {
            try {
              const patients =
                JSON.parse(savedPatients);

              const updatedPatients =
                patients.map((item) =>
                  String(item.id) === String(id)
                    ? firebasePatient
                    : item
                );

              localStorage.setItem(
                "mindcare_patients",
                JSON.stringify(updatedPatients)
              );
            } catch (error) {
              console.error(
                "Local cache update error:",
                error
              );
            }
          }
        } else {
          // Firebase patient not found,
          // use localStorage fallback
          const savedPatients =
            localStorage.getItem(
              "mindcare_patients"
            );

          const patients = savedPatients
            ? JSON.parse(savedPatients)
            : defaultPatients;

          const foundPatient =
            patients.find(
              (item) =>
                String(item.id) === String(id)
            );

          setPatient(foundPatient || null);
        }
      } catch (error) {
        console.error(
          "Firebase patient details error:",
          error
        );

        // Firebase failed → localStorage fallback
        try {
          const savedPatients =
            localStorage.getItem(
              "mindcare_patients"
            );

          const patients = savedPatients
            ? JSON.parse(savedPatients)
            : defaultPatients;

          const foundPatient =
            patients.find(
              (item) =>
                String(item.id) === String(id)
            );

          setPatient(foundPatient || null);
        } catch (localError) {
          console.error(
            "Fallback error:",
            localError
          );

          setPatient(null);
        }
      }

      // Game sessions are still local for now
      try {
        const savedSessions =
          JSON.parse(
            localStorage.getItem(
              "mindcare_game_sessions"
            ) || "[]"
          );

        setGameSessions(savedSessions);
      } catch (error) {
        console.error(
          "Game sessions error:",
          error
        );

        setGameSessions([]);
      }

      setLoading(false);
    };

    loadPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="patient-details-page">
        <button
          className="back-patients-btn"
          onClick={() => navigate("/patients")}
        >
          ← Back to Patients
        </button>

        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "50px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <div
            style={{
              fontSize: "36px",
              marginBottom: "10px",
            }}
          >
            🔄
          </div>

          <strong>
            Loading patient details...
          </strong>

          <p>
            Fetching patient information from
            Firebase.
          </p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="patient-details-page">
        <button
          className="back-patients-btn"
          onClick={() => navigate("/patients")}
        >
          ← Back to Patients
        </button>

        <div className="patient-not-found">
          <div className="not-found-icon">
            👤
          </div>

          <h2>Patient Not Found</h2>

          <p>
            This patient does not exist in the
            current patient list.
          </p>

          <button
            className="back-patients-btn"
            onClick={() => navigate("/patients")}
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  const patientSessions =
    gameSessions.filter(
      (session) =>
        session.patientId &&
        String(session.patientId) ===
          String(patient.id)
    );

  const totalGames =
    patientSessions.length;

  const sessionAverage =
    totalGames > 0
      ? Math.round(
          patientSessions.reduce(
            (sum, session) =>
              sum + Number(session.score || 0),
            0
          ) / totalGames
        )
      : Number(patient.score || 0);

  const displayScore =
    totalGames > 0
      ? sessionAverage
      : Number(patient.score || 0);

  const getStatusClass = (status) =>
    String(status || "New")
      .toLowerCase()
      .replace(" ", "-");

  return (
    <div className="patient-details-page">
      <button
        className="back-patients-btn"
        onClick={() => navigate("/patients")}
      >
        ← Back to Patients
      </button>

      <div className="patient-profile-header">
        <div className="patient-profile-left">
          <div className="large-patient-avatar">
            {patient.name?.charAt(0)}
          </div>

          <div>
            <h2>{patient.name}</h2>

            <p>
              Age {patient.age} •{" "}
              {patient.region} •{" "}
              {patient.language}
            </p>

            <span
              className={`patient-detail-status ${getStatusClass(
                patient.status
              )}`}
            >
              {patient.status}
            </span>
          </div>
        </div>

        <button
          className="games-patient-btn"
          onClick={() =>
            navigate(
              `/games?patientId=${patient.id}`
            )
          }
        >
          🎮 Cognitive Games
        </button>
      </div>

      <div className="patient-detail-stats">
        <div className="detail-stat-card">
          <span>Cognitive Score</span>

          <strong>
            {displayScore}
            <small>/100</small>
          </strong>
        </div>

        <div className="detail-stat-card">
          <span>Games Played</span>

          <strong>{totalGames}</strong>
        </div>

        <div className="detail-stat-card">
          <span>Accuracy</span>

          <strong>
            {totalGames > 0 ? "80%" : "—"}
          </strong>
        </div>

        <div className="detail-stat-card">
          <span>Last Active</span>

          <strong>
            {totalGames > 0
              ? "Today"
              : "Not yet"}
          </strong>
        </div>
      </div>

      <div className="patient-detail-grid">
        <div className="patient-detail-card">
          <div className="detail-card-heading">
            <div>
              <h3>Cognitive Performance</h3>

              <p>
                Current activity-based
                performance
              </p>
            </div>
          </div>

          <div className="performance-list">
            <div className="performance-row">
              <div className="performance-label">
                <span>🧠 Memory</span>

                <strong>
                  {Math.min(
                    100,
                    displayScore + 4
                  )}
                  %
                </strong>
              </div>

              <div className="performance-track">
                <div
                  className="performance-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      displayScore + 4
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="performance-row">
              <div className="performance-label">
                <span>🎯 Attention</span>

                <strong>
                  {Math.max(
                    0,
                    displayScore - 4
                  )}
                  %
                </strong>
              </div>

              <div className="performance-track">
                <div
                  className="performance-fill"
                  style={{
                    width: `${Math.max(
                      0,
                      displayScore - 4
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="performance-row">
              <div className="performance-label">
                <span>⚡ Reaction</span>

                <strong>
                  {Math.min(
                    100,
                    displayScore + 1
                  )}
                  %
                </strong>
              </div>

              <div className="performance-track">
                <div
                  className="performance-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      displayScore + 1
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="patient-detail-card">
          <div className="detail-card-heading">
            <div>
              <h3>Patient Information</h3>

              <p>
                Basic profile details
              </p>
            </div>
          </div>

          <div className="patient-info-list">
            <div>
              <span>Patient Name</span>
              <strong>{patient.name}</strong>
            </div>

            <div>
              <span>Age</span>
              <strong>
                {patient.age} years
              </strong>
            </div>

            <div>
              <span>Region</span>
              <strong>{patient.region}</strong>
            </div>

            <div>
              <span>Preferred Language</span>
              <strong>
                {patient.language}
              </strong>
            </div>

            <div>
              <span>Current Status</span>
              <strong>
                {patient.status}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="patient-detail-card ai-insight-card">
        <div className="ai-insight-icon">
          🤖
        </div>

        <div>
          <h3>AI Cognitive Insight</h3>

          <p>
            {totalGames > 0
              ? `The patient has completed ${totalGames} recorded cognitive game session${
                  totalGames > 1
                    ? "s"
                    : ""
                }. Current activity data shows an average game score of ${sessionAverage}/100.`
              : "No game sessions have been recorded for this patient yet. Regular cognitive activities can help build an activity baseline."}
          </p>

          <small>
            AI insight is based on game activity
            and engagement data. It is not a
            medical diagnosis.
          </small>
        </div>
      </div>

      <div className="patient-detail-card">
        <div className="detail-card-heading">
          <div>
            <h3>Recent Game Sessions</h3>

            <p>
              Recorded cognitive activities
            </p>
          </div>
        </div>

        {patientSessions.length > 0 ? (
          <div className="recent-sessions">
            {patientSessions
              .slice(0, 5)
              .map((session) => (
                <div
                  className="session-row"
                  key={session.id}
                >
                  <div>
                    <strong>
                      {session.game}
                    </strong>

                    <small>
                      {new Date(
                        session.date
                      ).toLocaleDateString()}
                    </small>
                  </div>

                  <strong>
                    {session.score} pts
                  </strong>
                </div>
              ))}
          </div>
        ) : (
          <div className="no-sessions">
            🎮 No game sessions recorded yet.
          </div>
        )}
      </div>

      <div className="patient-detail-disclaimer">
        ℹ️ Performance information represents
        cognitive-game activity and engagement
        only. It should not be interpreted as a
        clinical diagnosis.
      </div>
    </div>
  );
}

export default PatientDetails;