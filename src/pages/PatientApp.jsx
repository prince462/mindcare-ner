import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import "./PatientApp.css";

const defaultPatients = [
  {
    id: 1,
    name: "Raj Kumar",
    age: 72,
    region: "Assam",
    language: "Assamese",
  },
  {
    id: 2,
    name: "Mary Das",
    age: 69,
    region: "Meghalaya",
    language: "Khasi",
  },
  {
    id: 3,
    name: "John Singh",
    age: 75,
    region: "Nagaland",
    language: "English",
  },
  {
    id: 4,
    name: "Lalhmingi",
    age: 71,
    region: "Mizoram",
    language: "Mizo",
  },
];

const games = [
  {
    id: "memory-match",
    title: "Memory Match",
    icon: "🧩",
    description: "Match familiar cards and exercise recall.",
  },
  {
    id: "remember-objects",
    title: "Remember Objects",
    icon: "🧠",
    description: "Remember everyday objects.",
  },
  {
    id: "sequence",
    title: "Sequence Game",
    icon: "🔢",
    description: "Remember and repeat a sequence.",
  },
  {
    id: "who-is-this",
    title: "Who Is This?",
    icon: "👤",
    description: "Recognize familiar people.",
  },
  {
    id: "ner-memory",
    title: "NER Memory Game",
    icon: "🌿",
    description: "Explore familiar North Eastern memories.",
  },
  {
    id: "focus-challenge",
    title: "Focus Challenge",
    icon: "🎯",
    description: "Practice attention and focus.",
  },
];

function PatientApp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const patientId =
    searchParams.get("patientId") || "1";

  const [patients, setPatients] =
    useState(defaultPatients);

  const [sessions, setSessions] =
    useState([]);

  const [memories, setMemories] =
    useState([]);

  const [showMemories, setShowMemories] =
    useState(false);

  const [speaking, setSpeaking] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPatientAppData = async () => {
      // Local data is loaded first so the patient app remains
      // usable even if Firebase is temporarily unavailable.
      try {
        const savedPatients =
          localStorage.getItem(
            "mindcare_patients"
          );

        const savedSessions =
          localStorage.getItem(
            "mindcare_game_sessions"
          );

        const savedMemories =
          localStorage.getItem(
            "mindcare_memories"
          );

        if (savedPatients) {
          setPatients(
            JSON.parse(savedPatients)
          );
        }

        if (savedSessions) {
          setSessions(
            JSON.parse(savedSessions)
          );
        }

        if (savedMemories) {
          setMemories(
            JSON.parse(savedMemories)
          );
        }
      } catch (error) {
        console.error(
          "Local Patient App data load failed:",
          error
        );
      }

      // Firebase shared data.
      try {
        const [
          patientsSnapshot,
          sessionsSnapshot,
          memoriesSnapshot,
        ] = await Promise.all([
          getDocs(collection(db, "patients")),
          getDocs(collection(db, "gameSessions")),
          getDocs(collection(db, "memories")),
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

        if (memoriesSnapshot.docs.length > 0) {
          const firebaseMemories =
            memoriesSnapshot.docs.map(
              (memoryDoc) => {
                const data =
                  memoryDoc.data();

                return {
                  id: String(memoryDoc.id),
                  title:
                    data.title ||
                    "Untitled Memory",
                  person:
                    data.person ||
                    data.detail ||
                    "Not specified",
                  type:
                    data.type ||
                    "Other",
                  icon:
                    data.icon ||
                    "👤",
                  description:
                    data.description ||
                    data.note ||
                    "No additional information added.",
                };
              }
            );

          setMemories(firebaseMemories);

          localStorage.setItem(
            "mindcare_memories",
            JSON.stringify(firebaseMemories)
          );
        }
      } catch (error) {
        console.error(
          "Firebase Patient App data load failed:",
          error
        );
      }
    };

    loadPatientAppData();

    return () => {
      mounted = false;
    };
  }, []);

  const patient =
    patients.find(
      (item) =>
        String(item.id) ===
        String(patientId)
    ) || defaultPatients[0];

  const patientSessions =
    sessions.filter(
      (session) =>
        String(session.patientId) ===
        String(patient.id)
    );

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const todaySessions =
    patientSessions.filter(
      (session) =>
        session.date?.startsWith(today)
    );

  const todayScore =
    todaySessions.length > 0
      ? Math.round(
          todaySessions.reduce(
            (sum, session) =>
              sum +
              Number(session.score || 0),
            0
          ) / todaySessions.length
        )
      : 0;

  const speak = (text) => {
    if (
      !("speechSynthesis" in window)
    ) {
      alert(text);
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(text);

    speech.rate = 0.8;
    speech.pitch = 1;

    speech.onstart = () =>
      setSpeaking(true);

    speech.onend = () =>
      setSpeaking(false);

    window.speechSynthesis.speak(
      speech
    );
  };

  const welcomeMessage = `Hello ${patient.name}. Welcome to MindCare NER. You have ${todaySessions.length} cognitive activities completed today.`;

  return (
    <div className="patient-app-page">

      {/* TOP BAR */}

      <div className="patient-app-topbar">

        <div className="patient-brand">

          <div className="patient-brand-icon">
            🧠
          </div>

          <div>
            <strong>
              MindCare NER
            </strong>

            <span>
              Cognitive Care
            </span>
          </div>

        </div>

        <button
          className="caregiver-mode-btn"
          onClick={() =>
            navigate("/")
          }
        >
          Caregiver Dashboard →
        </button>

      </div>

      {/* PATIENT PROFILE */}

      <div className="patient-welcome">

        <div className="patient-avatar">
          {patient.name.charAt(0)}
        </div>

        <div>

          <span>
            Welcome back
          </span>

          <h1>
            {patient.name} 👋
          </h1>

          <p>
            Let's spend a few minutes
            exercising your memory today.
          </p>

        </div>

        <button
          className="voice-welcome-btn"
          onClick={() =>
            speak(welcomeMessage)
          }
        >
          {speaking
            ? "🔊 Speaking..."
            : "🔊 Hear Welcome"}
        </button>

      </div>

      {/* TODAY SUMMARY */}

      <div className="patient-summary">

        <div className="patient-summary-card">

          <span>
            Today's Activities
          </span>

          <strong>
            {todaySessions.length}
          </strong>

          <small>
            completed
          </small>

        </div>

        <div className="patient-summary-card">

          <span>
            Today's Score
          </span>

          <strong>
            {todayScore || "—"}
          </strong>

          <small>
            activity score
          </small>

        </div>

        <div className="patient-summary-card">

          <span>
            Memories
          </span>

          <strong>
            {memories.length}
          </strong>

          <small>
            saved memories
          </small>

        </div>

        <div className="patient-summary-card">

          <span>
            Region
          </span>

          <strong>
            {patient.region}
          </strong>

          <small>
            {patient.language}
          </small>

        </div>

      </div>

      {/* DAILY REMINDER */}

      <div className="patient-reminder">

        <div className="reminder-icon">
          ☀️
        </div>

        <div>

          <span>
            TODAY'S REMINDER
          </span>

          <h3>
            Take a few minutes for
            memory practice
          </h3>

          <p>
            Short and regular activities
            can help maintain engagement.
          </p>

        </div>

        <button
          onClick={() =>
            speak(
              "Take a few minutes for memory practice. You can start with a simple activity."
            )
          }
        >
          🔊 Listen
        </button>

      </div>

      {/* GAMES */}

      <div className="patient-section-header">

        <div>
          <h2>
            Today's Cognitive Activities 🎮
          </h2>

          <p>
            Choose an activity to begin.
          </p>
        </div>

      </div>

      <div className="patient-games-grid">

        {games.map((game) => (

          <div
            className="patient-game-card"
            key={game.id}
          >

            <div className="patient-game-icon">
              {game.icon}
            </div>

            <h3>
              {game.title}
            </h3>

            <p>
              {game.description}
            </p>

            <button
              onClick={() =>
                navigate(
                  `/games/${game.id}?patientId=${patient.id}`
                )
              }
            >
              Start Activity →
            </button>

          </div>

        ))}

      </div>

      {/* MEMORY ASSISTANT */}

      <div className="patient-memory-section">

        <div className="patient-section-header">

          <div>

            <h2>
              My Memories 🖼️
            </h2>

            <p>
              Familiar people, places and
              things from your Memory Album.
            </p>

          </div>

          <button
            className="show-memory-btn"
            onClick={() =>
              setShowMemories(
                !showMemories
              )
            }
          >
            {showMemories
              ? "Hide Memories"
              : "View Memories"}
          </button>

        </div>

        {showMemories && (

          <div className="patient-memory-grid">

            {memories.length > 0 ? (

              memories
                .slice(0, 6)
                .map((memory) => (

                  <div
                    className="patient-memory-card"
                    key={memory.id}
                  >

                    <div>
                      {memory.icon}
                    </div>

                    <h3>
                      {memory.title}
                    </h3>

                    <p>
                      {memory.description}
                    </p>

                    <button
                      onClick={() =>
                        speak(
                          `${memory.title}. ${memory.description}`
                        )
                      }
                    >
                      🔊 Read
                    </button>

                  </div>

                ))

            ) : (

              <div className="patient-no-memory">
                No memories have been added yet.
              </div>

            )}

          </div>

        )}

      </div>

      {/* VOICE ASSISTANT */}

      <div className="patient-voice-card">

        <div className="patient-voice-icon">
          🔊
        </div>

        <div>

          <h3>
            Voice Memory Support
          </h3>

          <p>
            Listen to familiar information
            using voice assistance.
          </p>

        </div>

        <button
          onClick={() =>
            speak(
              `Hello ${patient.name}. Your home region is ${patient.region}. Your preferred language is ${patient.language}. You have ${memories.length} familiar memories saved in your profile.`
            )
          }
        >
          {speaking
            ? "Speaking..."
            : "Start Voice Support"}
        </button>

      </div>

      {/* PRIVACY / SAFETY */}

      <div className="patient-app-info">

        <span>
          ℹ️
        </span>

        <p>
          MindCare NER provides cognitive
          activities, reminders and personalized
          memory support. Activity scores are
          not a medical diagnosis.
        </p>

      </div>

    </div>
  );
}

export default PatientApp;