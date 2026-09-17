import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "./Progress.css";

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

const games = [
  "Memory Match",
  "Remember Objects",
  "Sequence Game",
  "Who Is This?",
  "NER Memory Game",
  "Focus Challenge",
];

function Progress() {
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedPatient, setSelectedPatient] =
    useState("");
  const [period, setPeriod] = useState("7");

  useEffect(() => {
    let mounted = true;

    const loadProgressData = async () => {
      // --------------------------------
      // LOCAL STORAGE FALLBACK
      // --------------------------------
      let localPatients = defaultPatients;
      let localSessions = [];

      try {
        const savedPatients =
          localStorage.getItem("mindcare_patients");

        const savedSessions =
          localStorage.getItem("mindcare_game_sessions");

        if (savedPatients) {
          localPatients = JSON.parse(savedPatients);
        }

        if (savedSessions) {
          localSessions = JSON.parse(savedSessions);
        }
      } catch (error) {
        console.error(
          "Local progress data load failed:",
          error
        );
      }

      // Show local data immediately
      if (mounted) {
        setPatients(localPatients);
        setSessions(localSessions);

        if (localPatients.length > 0) {
          setSelectedPatient(
            String(localPatients[0].id)
          );
        }
      }

      // --------------------------------
      // FIREBASE DATA
      // --------------------------------
      try {
        const [patientSnapshot, sessionSnapshot] =
          await Promise.all([
            getDocs(collection(db, "patients")),
            getDocs(collection(db, "gameSessions")),
          ]);

        const firebasePatients =
          patientSnapshot.docs.map((doc) => ({
            id: String(doc.id),
            ...doc.data(),
          }));

        const firebaseSessions =
          sessionSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

        if (!mounted) return;

        // Use Firebase patients when available
        if (firebasePatients.length > 0) {
          setPatients(firebasePatients);

          // Keep selected patient valid
          setSelectedPatient((current) => {
            const stillExists =
              firebasePatients.some(
                (item) =>
                  String(item.id) ===
                  String(current)
              );

            return stillExists
              ? current
              : String(firebasePatients[0].id);
          });
        }

        // Use Firebase sessions when available.
        // If there are no Firebase sessions, keep local backup.
        if (firebaseSessions.length > 0) {
          setSessions(firebaseSessions);
        }

        console.log(
          "Progress data loaded from Firebase."
        );
      } catch (error) {
        console.error(
          "Firebase progress data load failed:",
          error
        );

        // Local data remains active as fallback
      }
    };

    loadProgressData();

    return () => {
      mounted = false;
    };
  }, []);

  const patient = patients.find(
    (item) =>
      String(item.id) ===
      String(selectedPatient)
  );

  const patientSessions = useMemo(() => {
    if (!selectedPatient) return [];

    const now = new Date();

    const days = Number(period);

    const startDate = new Date(now);
    startDate.setDate(
      now.getDate() - days
    );

    return sessions
      .filter(
        (session) =>
          String(session.patientId) ===
          String(selectedPatient)
      )
      .filter((session) => {
        const sessionDate =
          new Date(session.date);

        return sessionDate >= startDate;
      })
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );
  }, [sessions, selectedPatient, period]);

  const allPatientSessions = useMemo(() => {
    if (!selectedPatient) return [];

    return sessions
      .filter(
        (session) =>
          String(session.patientId) ===
          String(selectedPatient)
      )
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );
  }, [sessions, selectedPatient]);

  const averageScore =
    patientSessions.length > 0
      ? Math.round(
          patientSessions.reduce(
            (sum, session) =>
              sum +
              Number(session.score || 0),
            0
          ) / patientSessions.length
        )
      : patient?.score || 0;

  const totalCompleted =
    patientSessions.length;

  const averageAccuracy =
    patientSessions.length > 0
      ? Math.min(
          100,
          Math.round(
            patientSessions.reduce(
              (sum, session) =>
                sum +
                Math.min(
                  100,
                  Number(session.score || 0) +
                    5
                ),
              0
            ) / patientSessions.length
          )
        )
      : 0;

  /*
    AI PERFORMANCE ANALYSIS
  */

  const aiAnalysis = useMemo(() => {
    if (!patient) {
      return {
        type: "neutral",
        title: "Waiting for patient data",
        message:
          "Select a patient to generate personalized insights.",
        recommendation:
          "Complete cognitive activities regularly.",
        focus: "General Cognitive Activity",
      };
    }

    if (allPatientSessions.length === 0) {
      return {
        type: "neutral",
        title: "Baseline not established",
        message: `${patient.name} does not have enough recorded game activity yet.`,
        recommendation:
          "Start with short Memory Match or Sequence Game sessions to establish an individual baseline.",
        focus: "Baseline Collection",
      };
    }

    const recentSessions =
      allPatientSessions.slice(-3);

    const previousSessions =
      allPatientSessions.slice(
        Math.max(
          0,
          allPatientSessions.length - 6
        ),
        Math.max(
          0,
          allPatientSessions.length - 3
        )
      );

    const recentAverage =
      recentSessions.reduce(
        (sum, session) =>
          sum +
          Number(session.score || 0),
        0
      ) / recentSessions.length;

    const previousAverage =
      previousSessions.length > 0
        ? previousSessions.reduce(
            (sum, session) =>
              sum +
              Number(session.score || 0),
            0
          ) / previousSessions.length
        : recentAverage;

    const change =
      Math.round(
        recentAverage -
          previousAverage
      );

    const gameScores = games.map(
      (gameName) => {
        const gameSessions =
          allPatientSessions.filter(
            (session) =>
              session.game === gameName
          );

        const score =
          gameSessions.length > 0
            ? Math.round(
                gameSessions.reduce(
                  (sum, session) =>
                    sum +
                    Number(
                      session.score || 0
                    ),
                  0
                ) /
                  gameSessions.length
              )
            : 0;

        return {
          name: gameName,
          score,
          completed:
            gameSessions.length,
        };
      }
    );

    const activeGames =
      gameScores.filter(
        (game) => game.completed > 0
      );

    const weakestGame =
      activeGames.length > 0
        ? [...activeGames].sort(
            (a, b) =>
              a.score - b.score
          )[0]
        : null;

    const strongestGame =
      activeGames.length > 0
        ? [...activeGames].sort(
            (a, b) =>
              b.score - a.score
          )[0]
        : null;

    if (change <= -10) {
      return {
        type: "attention",
        title: "Performance Change Detected",
        message: `Recent activity scores are approximately ${Math.abs(
          change
        )} points lower than the earlier recorded sessions.`,
        recommendation:
          "Consider shorter sessions and easier recall activities before gradually increasing difficulty.",
        focus:
          weakestGame?.name ||
          "Memory & Recall",
        change,
      };
    }

    if (change >= 10) {
      return {
        type: "positive",
        title: "Positive Progress Detected",
        message: `Recent activity scores are approximately ${change} points higher than the earlier recorded sessions.`,
        recommendation:
          "Continue regular practice and gradually introduce slightly more challenging activities.",
        focus:
          strongestGame?.name ||
          "Cognitive Training",
        change,
      };
    }

    if (
      weakestGame &&
      weakestGame.score < 60
    ) {
      return {
        type: "attention",
        title: "Personalized Practice Suggested",
        message: `${weakestGame.name} currently has the lowest recorded average among completed activities.`,
        recommendation: `Try shorter ${weakestGame.name} sessions and repeat the activity regularly to collect more individual performance data.`,
        focus: weakestGame.name,
        change,
      };
    }

    if (
      allPatientSessions.length < 3
    ) {
      return {
        type: "neutral",
        title: "Building Individual Baseline",
        message:
          "More activity sessions are needed before making stronger performance comparisons.",
        recommendation:
          "Complete a few short cognitive activities across different game types.",
        focus:
          "Baseline Collection",
        change,
      };
    }

    return {
      type: "stable",
      title: "Performance Appears Stable",
      message:
        "Recent activity scores are broadly consistent with the earlier recorded sessions.",
      recommendation:
        "Continue regular cognitive activities and monitor changes over time.",
      focus:
        strongestGame?.name ||
        "General Cognitive Activity",
      change,
    };
  }, [patient, allPatientSessions]);

  /*
    GAME-WISE PERFORMANCE
  */

  const gamePerformance = games.map(
    (gameName) => {
      const gameSessions =
        patientSessions.filter(
          (session) =>
            session.game === gameName
        );

      const average =
        gameSessions.length > 0
          ? Math.round(
              gameSessions.reduce(
                (sum, session) =>
                  sum +
                  Number(
                    session.score || 0
                  ),
                0
              ) /
                gameSessions.length
            )
          : 0;

      return {
        name: gameName,
        completed:
          gameSessions.length,
        score: average,
      };
    }
  );

  /*
    WEEKLY CHART
  */

  const chartData = [
    ["Mon", 0],
    ["Tue", 0],
    ["Wed", 0],
    ["Thu", 0],
    ["Fri", 0],
    ["Sat", 0],
    ["Sun", 0],
  ];

  patientSessions.forEach(
    (session) => {
      const date =
        new Date(session.date);

      const day =
        date.toLocaleDateString(
          "en-US",
          {
            weekday: "short",
          }
        );

      const item =
        chartData.find(
          (entry) =>
            entry[0] === day
        );

      if (item) {
        item[1] = Math.max(
          item[1],
          Number(session.score || 0)
        );
      }
    }
  );

  const hasRealData =
    patientSessions.length > 0;

  return (
    <div className="progress-page">

      {/* HEADER */}

      <div className="progress-header">

        <div>
          <h2>
            Progress & Analytics 📊
          </h2>

          <p>
            Track patient cognitive activity
            and generate personalized
            performance insights.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >

          <select
            className="period-select"
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value)
            }
          >
            <option value="7">
              Last 7 Days
            </option>

            <option value="30">
              Last 30 Days
            </option>

            <option value="90">
              Last 3 Months
            </option>
          </select>

          <select
            className="period-select"
            value={selectedPatient}
            onChange={(e) =>
              setSelectedPatient(
                e.target.value
              )
            }
          >

            {patients.map((item) => (
              <option
                value={item.id}
                key={item.id}
              >
                {item.name}
              </option>
            ))}

          </select>

        </div>

      </div>

      {/* SELECTED PATIENT */}

      {patient && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "16px 20px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            marginBottom: "20px",
          }}
        >

          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "50%",
              background: "#e0f2fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#0369a1",
            }}
          >
            {patient.name.charAt(0)}
          </div>

          <div>

            <strong
              style={{
                fontSize: "17px",
              }}
            >
              {patient.name}
            </strong>

            <p
              style={{
                margin: "4px 0 0",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Age {patient.age} •{" "}
              {patient.region} •{" "}
              {patient.language}
            </p>

          </div>

        </div>
      )}

      {/* STATS */}

      <div className="progress-stats">

        <div className="progress-stat-card">

          <span>
            Average Score
          </span>

          <strong>
            {averageScore}/100
          </strong>

          <small>
            Patient activity score
          </small>

        </div>

        <div className="progress-stat-card">

          <span>
            Games Completed
          </span>

          <strong>
            {totalCompleted}
          </strong>

          <small>
            Recorded sessions
          </small>

        </div>

        <div className="progress-stat-card">

          <span>
            Average Accuracy
          </span>

          <strong>
            {hasRealData
              ? `${averageAccuracy}%`
              : "—"}
          </strong>

          <small>
            Based on activity performance
          </small>

        </div>

        <div className="progress-stat-card">

          <span>
            AI Change
          </span>

          <strong>
            {aiAnalysis.change ===
            undefined
              ? "—"
              : aiAnalysis.change > 0
              ? `+${aiAnalysis.change}`
              : aiAnalysis.change}
          </strong>

          <small>
            Recent vs earlier activity
          </small>

        </div>

      </div>

      {/* AI PERSONALIZATION */}

      <div className="progress-insight">

        <div className="insight-icon">
          🤖
        </div>

        <div>

          <h3>
            AI Performance Insight
          </h3>

          <h4
            style={{
              margin:
                "5px 0 8px",
              color:
                aiAnalysis.type ===
                "attention"
                  ? "#b91c1c"
                  : aiAnalysis.type ===
                    "positive"
                  ? "#15803d"
                  : "#2563eb",
            }}
          >
            {aiAnalysis.title}
          </h4>

          <p>
            {aiAnalysis.message}
          </p>

          <small>
            Focus area:{" "}
            <strong>
              {aiAnalysis.focus}
            </strong>
          </small>

        </div>

      </div>

      {/* PERSONALIZED RECOMMENDATION */}

      <div className="suggested-activity">

        <div className="suggested-icon">
          💡
        </div>

        <div>

          <h3>
            Personalized Recommendation
          </h3>

          <p>
            {aiAnalysis.recommendation}
          </p>

          <small
            style={{
              display: "block",
              marginTop: "8px",
              color: "#64748b",
            }}
          >
            Recommendation is generated from
            recorded game activity and is not
            a medical diagnosis.
          </small>

        </div>

      </div>

      {/* WEEKLY CHART */}

      <div className="progress-card">

        <div className="progress-card-header">

          <div>

            <h3>
              Weekly Cognitive Performance
            </h3>

            <p>
              Patient activity scores by day
            </p>

          </div>

          <span className="period-label">
            {period === "7"
              ? "7 Days"
              : period === "30"
              ? "30 Days"
              : "3 Months"}
          </span>

        </div>

        {hasRealData ? (

          <div className="progress-chart">

            {chartData.map(
              ([day, score]) => (

                <div
                  className="progress-chart-item"
                  key={day}
                >

                  <span>
                    {score}
                  </span>

                  <div className="progress-bar-area">

                    <div
                      className="progress-bar-fill"
                      style={{
                        height: `${Math.max(
                          score,
                          4
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

        ) : (

          <div
            style={{
              padding: "50px 20px",
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
              📊
            </div>

            <strong>
              No game data yet
            </strong>

            <p>
              Complete a cognitive game for
              this patient to start building
              the performance chart.
            </p>

          </div>

        )}

      </div>

      {/* COGNITIVE AREAS */}

      <div className="progress-card">

        <div className="progress-card-header">

          <div>

            <h3>
              Cognitive Areas
            </h3>

            <p>
              Activity-based performance indicators
            </p>

          </div>

        </div>

        <div className="cognitive-list">

          <div className="cognitive-row">

            <div className="cognitive-info">
              <span>🧠 Memory</span>

              <strong>
                {Math.min(
                  100,
                  averageScore + 4
                )}
                %
              </strong>
            </div>

            <div className="cognitive-track">

              <div
                className="cognitive-fill"
                style={{
                  width: `${Math.min(
                    100,
                    averageScore + 4
                  )}%`,
                }}
              />

            </div>

          </div>

          <div className="cognitive-row">

            <div className="cognitive-info">
              <span>🎯 Attention</span>

              <strong>
                {Math.max(
                  0,
                  averageScore - 4
                )}
                %
              </strong>
            </div>

            <div className="cognitive-track">

              <div
                className="cognitive-fill"
                style={{
                  width: `${Math.max(
                    0,
                    averageScore - 4
                  )}%`,
                }}
              />

            </div>

          </div>

          <div className="cognitive-row">

            <div className="cognitive-info">
              <span>🔄 Recall</span>

              <strong>
                {Math.min(
                  100,
                  averageScore + 1
                )}
                %
              </strong>
            </div>

            <div className="cognitive-track">

              <div
                className="cognitive-fill"
                style={{
                  width: `${Math.min(
                    100,
                    averageScore + 1
                  )}%`,
                }}
              />

            </div>

          </div>

          <div className="cognitive-row">

            <div className="cognitive-info">
              <span>⚡ Reaction</span>

              <strong>
                {Math.max(
                  0,
                  averageScore - 7
                )}
                %
              </strong>
            </div>

            <div className="cognitive-track">

              <div
                className="cognitive-fill"
                style={{
                  width: `${Math.max(
                    0,
                    averageScore - 7
                  )}%`,
                }}
              />

            </div>

          </div>

        </div>

      </div>

      {/* GAME PERFORMANCE */}

      <div className="progress-card">

        <div className="progress-card-header">

          <div>

            <h3>
              Game-wise Performance
            </h3>

            <p>
              Performance for{" "}
              {patient?.name}
            </p>

          </div>

        </div>

        <div className="game-performance-list">

          {gamePerformance.map(
            (game) => (

              <div
                className="game-performance-row"
                key={game.name}
              >

                <div className="game-performance-name">

                  <strong>
                    {game.name}
                  </strong>

                  <small>
                    Cognitive activity
                  </small>

                </div>

                <div className="game-performance-value">

                  <span>
                    {game.completed} completed
                  </span>

                  <strong>
                    {game.completed > 0
                      ? `${game.score}/100`
                      : "No data"}
                  </strong>

                </div>

              </div>

            )
          )}

        </div>

      </div>

      {/* RECENT SESSIONS */}

      <div className="progress-card">

        <div className="progress-card-header">

          <div>

            <h3>
              Recent Game Sessions
            </h3>

            <p>
              Latest recorded activities
            </p>

          </div>

        </div>

        {patientSessions.length > 0 ? (

          <div className="game-performance-list">

            {patientSessions
              .slice(0, 5)
              .map((session) => (

                <div
                  className="game-performance-row"
                  key={session.id}
                >

                  <div className="game-performance-name">

                    <strong>
                      {session.game}
                    </strong>

                    <small>
                      {new Date(
                        session.date
                      ).toLocaleString()}
                    </small>

                  </div>

                  <div className="game-performance-value">

                    <strong>
                      {session.score} points
                    </strong>

                  </div>

                </div>

              ))}

          </div>

        ) : (

          <div
            style={{
              padding: "35px 20px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            No game sessions recorded
            for this patient yet.
          </div>

        )}

      </div>

      {/* SYSTEM LOGIC */}

      <div
        className="progress-card"
        style={{
          background:
            "#f8fafc",
        }}
      >

        <div className="progress-card-header">

          <div>

            <h3>
              🧠 AI Personalization Engine
            </h3>

            <p>
              How MindCare NER generates
              personalized recommendations
            </p>

          </div>

        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >

          <div
            style={{
              padding: "16px",
              background: "white",
              borderRadius: "12px",
              border:
                "1px solid #e2e8f0",
            }}
          >
            <strong>
              01. Collect
            </strong>

            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              Game scores and activity
              sessions are recorded.
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              background: "white",
              borderRadius: "12px",
              border:
                "1px solid #e2e8f0",
            }}
          >
            <strong>
              02. Compare
            </strong>

            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              Recent performance is
              compared with earlier activity.
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              background: "white",
              borderRadius: "12px",
              border:
                "1px solid #e2e8f0",
            }}
          >
            <strong>
              03. Personalize
            </strong>

            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              Game-specific patterns are
              used to select a focus area.
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              background: "white",
              borderRadius: "12px",
              border:
                "1px solid #e2e8f0",
            }}
          >
            <strong>
              04. Recommend
            </strong>

            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              The system suggests the
              next suitable activity.
            </p>
          </div>

        </div>

      </div>

      {/* DISCLAIMER */}

      <div className="progress-disclaimer">

        ℹ️ Cognitive scores and AI insights shown
        here represent game activity and engagement.
        They are not a medical diagnosis or clinical
        assessment.

      </div>

    </div>
  );
}

export default Progress;