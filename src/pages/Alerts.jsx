import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import "./Alerts.css";

const defaultAlerts = [
  {
    id: 1,
    patientId: 4,
    patient: "Lalhmingi",
    type: "Attention",
    title: "Performance Change",
    message:
      "Recent activity shows a change in cognitive-game performance.",
    time: "Today",
    status: "New",
  },
  {
    id: 2,
    patientId: 2,
    patient: "Mary Das",
    type: "Activity",
    title: "Missed Activity",
    message:
      "No cognitive activity has been recorded recently.",
    time: "Yesterday",
    status: "New",
  },
  {
    id: 3,
    patientId: 3,
    patient: "John Singh",
    type: "Progress",
    title: "Positive Progress",
    message:
      "Recent game activity shows improved performance.",
    time: "2 days ago",
    status: "Reviewed",
  },
  {
    id: 4,
    patientId: 1,
    patient: "Raj Kumar",
    type: "Activity",
    title: "Activity Completed",
    message:
      "Patient completed a cognitive exercise.",
    time: "2 days ago",
    status: "Reviewed",
  },
];

function generateAIAlerts(
  patients,
  sessions,
  existingAlerts
) {
  const generatedAlerts = [];

  patients.forEach((patient) => {
    const patientSessions = sessions
      .filter(
        (session) =>
          String(session.patientId) ===
          String(patient.id)
      )
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );

    if (patientSessions.length < 3) return;

    const recent = patientSessions.slice(0, 3);
    const previous = patientSessions.slice(3, 6);

    const recentAverage =
      recent.reduce(
        (sum, session) =>
          sum + Number(session.score || 0),
        0
      ) / recent.length;

    if (previous.length === 0) return;

    const previousAverage =
      previous.reduce(
        (sum, session) =>
          sum + Number(session.score || 0),
        0
      ) / previous.length;

    const change = Math.round(
      recentAverage - previousAverage
    );

    if (change <= -10) {
      const alertKey = `drop-${patient.id}`;

      const alreadyExists =
        existingAlerts.some(
          (alert) =>
            String(alert.patientId) ===
              String(patient.id) &&
            alert.aiGenerated === true &&
            alert.alertKey === alertKey
        );

      if (!alreadyExists) {
        generatedAlerts.push({
          id: `ai-drop-${patient.id}`,
          patientId: patient.id,
          patient: patient.name,
          type: "Attention",
          title: "AI Performance Change",
          message:
            `Recent activity score is approximately ${Math.abs(
              change
            )} points lower than earlier recorded sessions. Consider shorter cognitive activities and monitor future performance.`,
          time: "Just now",
          status: "New",
          aiGenerated: true,
          alertKey,
        });
      }
    }

    if (change >= 10) {
      const alertKey = `improve-${patient.id}`;

      const alreadyExists =
        existingAlerts.some(
          (alert) =>
            String(alert.patientId) ===
              String(patient.id) &&
            alert.aiGenerated === true &&
            alert.alertKey === alertKey
        );

      if (!alreadyExists) {
        generatedAlerts.push({
          id: `ai-improve-${patient.id}`,
          patientId: patient.id,
          patient: patient.name,
          type: "Progress",
          title: "AI Positive Progress",
          message:
            `Recent activity score is approximately ${change} points higher than earlier recorded sessions.`,
          time: "Just now",
          status: "New",
          aiGenerated: true,
          alertKey,
        });
      }
    }
  });

  return generatedAlerts;
}
function Alerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState(() => {
    try {
      const savedAlerts =
        localStorage.getItem("mindcare_alerts");

      return savedAlerts
        ? JSON.parse(savedAlerts)
        : defaultAlerts;
    } catch (error) {
      console.error("Local alerts load failed:", error);
      return defaultAlerts;
    }
  });

  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("All");
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAlertData = async () => {
      try {
        const savedPatients =
          localStorage.getItem("mindcare_patients");
        const savedSessions =
          localStorage.getItem("mindcare_game_sessions");

        if (savedPatients) {
          setPatients(JSON.parse(savedPatients));
        }

        if (savedSessions) {
          setSessions(JSON.parse(savedSessions));
        }
      } catch (error) {
        console.error("Local alert data load failed:", error);
      }

      try {
        const [
          patientsSnapshot,
          sessionsSnapshot,
          alertsSnapshot,
        ] = await Promise.all([
          getDocs(collection(db, "patients")),
          getDocs(collection(db, "gameSessions")),
          getDocs(collection(db, "alerts")),
        ]);

        if (!mounted) return;

        let loadedPatients = [];
        let loadedSessions = [];

        if (patientsSnapshot.docs.length > 0) {
          loadedPatients =
            patientsSnapshot.docs.map((patientDoc) => ({
              id: String(patientDoc.id),
              ...patientDoc.data(),
            }));

          setPatients(loadedPatients);
          localStorage.setItem(
            "mindcare_patients",
            JSON.stringify(loadedPatients)
          );
        } else {
          loadedPatients = JSON.parse(
            localStorage.getItem("mindcare_patients") || "[]"
          );
        }

        if (sessionsSnapshot.docs.length > 0) {
          loadedSessions =
            sessionsSnapshot.docs.map((sessionDoc) => ({
              id: String(sessionDoc.id),
              ...sessionDoc.data(),
            }));

          setSessions(loadedSessions);
          localStorage.setItem(
            "mindcare_game_sessions",
            JSON.stringify(loadedSessions)
          );
        } else {
          loadedSessions = JSON.parse(
            localStorage.getItem("mindcare_game_sessions") || "[]"
          );
        }

        if (alertsSnapshot.docs.length > 0) {
          const firebaseAlerts =
            alertsSnapshot.docs.map((alertDoc) => ({
              id: String(alertDoc.id),
              ...alertDoc.data(),
              firestoreId: String(alertDoc.id),
            }));

          setAlerts(firebaseAlerts);
          localStorage.setItem(
            "mindcare_alerts",
            JSON.stringify(firebaseAlerts)
          );
        } else {
          const saved =
            localStorage.getItem("mindcare_alerts");

          const localAlerts = saved
            ? JSON.parse(saved)
            : defaultAlerts;

          const migratedAlerts =
            localAlerts.map((alert) => ({
              ...alert,
              firestoreId: String(alert.id),
            }));

          await Promise.all(
            migratedAlerts.map((alert) =>
              setDoc(
                doc(db, "alerts", String(alert.id)),
                alert
              )
            )
          );

          if (mounted) {
            setAlerts(migratedAlerts);
          }
        }

        setFirebaseError(false);
      } catch (error) {
        console.error("Firebase alerts load failed:", error);

        if (mounted) {
          setFirebaseError(true);
        }
      } finally {
        if (mounted) {
          setFirebaseLoading(false);
        }
      }
    };

    loadAlertData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (firebaseLoading || patients.length === 0) return;

    const createAIAlerts = async () => {
      const aiAlerts = generateAIAlerts(
        patients,
        sessions,
        alerts
      );

      if (aiAlerts.length === 0) return;

      try {
        const firebaseAlerts = aiAlerts.map((alert) => ({
          ...alert,
          firestoreId: String(alert.id),
        }));

        await Promise.all(
          firebaseAlerts.map((alert) =>
            setDoc(
              doc(db, "alerts", String(alert.id)),
              alert
            )
          )
        );

        setAlerts((currentAlerts) => [
          ...firebaseAlerts,
          ...currentAlerts,
        ]);

        setFirebaseError(false);
      } catch (error) {
        console.error(
          "Firebase AI alert save failed:",
          error
        );

        setFirebaseError(true);

        setAlerts((currentAlerts) => [
          ...aiAlerts,
          ...currentAlerts,
        ]);
      }
    };

    createAIAlerts();
  }, [
    firebaseLoading,
    patients,
    sessions,
    alerts.length,
  ]);

  useEffect(() => {
    localStorage.setItem(
      "mindcare_alerts",
      JSON.stringify(alerts)
    );
  }, [alerts]);

  const markReviewed = async (id) => {
    const alertToUpdate = alerts.find(
      (alert) =>
        String(alert.id) === String(id)
    );

    setAlerts((currentAlerts) =>
      currentAlerts.map((alert) =>
        String(alert.id) === String(id)
          ? {
              ...alert,
              status: "Reviewed",
            }
          : alert
      )
    );

    try {
      const firestoreId =
        alertToUpdate?.firestoreId ||
        String(id);

      await updateDoc(
        doc(
          db,
          "alerts",
          String(firestoreId)
        ),
        {
          status: "Reviewed",
        }
      );

      setFirebaseError(false);
    } catch (error) {
      console.error(
        "Firebase alert review update failed:",
        error
      );
      setFirebaseError(true);
    }
  };

  const deleteAlert = async (id) => {
    const alertToDelete = alerts.find(
      (alert) =>
        String(alert.id) === String(id)
    );

    setAlerts((currentAlerts) =>
      currentAlerts.filter(
        (alert) =>
          String(alert.id) !== String(id)
      )
    );

    try {
      const firestoreId =
        alertToDelete?.firestoreId ||
        String(id);

      await deleteDoc(
        doc(
          db,
          "alerts",
          String(firestoreId)
        )
      );

      setFirebaseError(false);
    } catch (error) {
      console.error(
        "Firebase alert delete failed:",
        error
      );
      setFirebaseError(true);
    }
  };

  const filteredAlerts =
    filter === "All"
      ? alerts
      : alerts.filter(
          (alert) =>
            alert.type === filter
        );

  const newAlerts = alerts.filter(
    (alert) =>
      alert.status === "New"
  ).length;

  const attentionAlerts =
    alerts.filter(
      (alert) =>
        alert.type === "Attention" &&
        alert.status === "New"
    ).length;

  const aiAlertCount =
    alerts.filter(
      (alert) =>
        alert.aiGenerated === true &&
        alert.status === "New"
    ).length;

  return (
    <div className="alerts-page">

      {/* Header */}

      <div className="alerts-header">

        <div>

          <h2>
            Alerts & Notifications 🔔
          </h2>

          <p>
            Review important patient activity
            and AI-generated performance
            notifications.
          </p>

        </div>

        <div className="alerts-summary">

          <div>
            <span>
              Total Alerts
            </span>

            <strong>
              {alerts.length}
            </strong>
          </div>

          <div>
            <span>
              New Alerts
            </span>

            <strong>
              {newAlerts}
            </strong>
          </div>

        </div>

      </div>

      {/* AI Banner */}

      <div className="alerts-ai-banner">

        <div className="alerts-ai-icon">
          🤖
        </div>

        <div>

          <span>
            AI ACTIVITY MONITORING
          </span>

          <h3>
            {attentionAlerts > 0
              ? `${attentionAlerts} attention alert${
                  attentionAlerts > 1
                    ? "s"
                    : ""
                } require review.`
              : "No new attention alerts."}
          </h3>

          <p>
            {aiAlertCount > 0
              ? `${aiAlertCount} new alert${
                  aiAlertCount > 1
                    ? "s"
                    : ""
                } generated from patient performance data.`
              : "The system analyzes recorded cognitive-game activity for meaningful performance changes."}
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
          ⚠️ Firebase sync unavailable. Local alert data is being used.
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
          ✓ Alerts synced with Firebase
        </div>
      )}

      {/* Filters */}

      <div className="alerts-filters">

        {[
          "All",
          "Attention",
          "Activity",
          "Progress",
        ].map((item) => (

          <button
            type="button"
            key={item}
            className={
              filter === item
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter(item)
            }
          >
            {item}
          </button>

        ))}

      </div>

      {/* Alert List */}

      <div className="alerts-list">

        {filteredAlerts.length > 0 ? (

          filteredAlerts.map(
            (alert) => (

              <div
                className={`alert-card ${
                  alert.status === "New"
                    ? "alert-new"
                    : ""
                }`}
                key={alert.id}
              >

                <div
                  className={`alert-icon ${alert.type.toLowerCase()}`}
                >
                  {alert.type ===
                  "Attention"
                    ? "⚠️"
                    : alert.type ===
                      "Activity"
                    ? "🎮"
                    : "📈"}
                </div>

                <div className="alert-content">

                  <div className="alert-top">

                    <div>

                      <span className="alert-patient">
                        {alert.patient}
                      </span>

                      <h3>
                        {alert.title}
                      </h3>

                    </div>

                    <span
                      className={`alert-status ${
                        alert.status.toLowerCase()
                      }`}
                    >
                      {alert.status}
                    </span>

                  </div>

                  <p>
                    {alert.message}
                  </p>

                  <small>
                    {alert.time}
                  </small>

                  {alert.aiGenerated && (
                    <div
                      style={{
                        marginTop:
                          "8px",
                        display:
                          "inline-block",
                        fontSize:
                          "11px",
                        fontWeight: 700,
                        color:
                          "#2563eb",
                        background:
                          "#eff6ff",
                        padding:
                          "5px 9px",
                        borderRadius:
                          "12px",
                      }}
                    >
                      🤖 AI Generated
                    </div>
                  )}

                  <div className="alert-actions">

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/patients/${alert.patientId}`
                        )
                      }
                    >
                      View Patient
                    </button>

                    {alert.status ===
                      "New" && (
                      <button
                        type="button"
                        onClick={() =>
                          markReviewed(
                            alert.id
                          )
                        }
                      >
                        ✓ Mark Reviewed
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        deleteAlert(
                          alert.id
                        )
                      }
                      style={{
                        color:
                          "#dc2626",
                      }}
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            )
          )

        ) : (

          <div className="alerts-empty">

            <div>
              🎉
            </div>

            <h3>
              No alerts found
            </h3>

            <p>
              There are no alerts in
              this category.
            </p>

          </div>

        )}

      </div>

      {/* AI Explanation */}

      <div className="alerts-info">

        <div className="alerts-info-icon">
          🧠
        </div>

        <div>

          <h3>
            How AI Alerts Work
          </h3>

          <p>
            MindCare NER compares recent
            cognitive-game scores with
            earlier recorded activity.
            Significant changes can create
            an attention or positive-progress
            notification for the caregiver.
          </p>

          <p
            style={{
              marginBottom: 0,
            }}
          >
            These alerts describe activity
            patterns only and should not be
            interpreted as a medical diagnosis.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Alerts;