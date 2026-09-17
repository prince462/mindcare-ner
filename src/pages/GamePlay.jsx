import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import "./GamePlay.css";

const gameData = {
  "remember-objects": {
    title: "Remember Objects",
    icon: "🧠",
    instruction:
      "Look at the objects carefully and remember them.",
    objects: [
      "🍎 Apple",
      "🔑 Key",
      "📱 Phone",
      "☕ Cup",
      "📕 Book",
    ],
  },

  sequence: {
    title: "Sequence Game",
    icon: "🔢",
    instruction:
      "Remember the sequence and select the numbers in the correct order.",
    sequence: [3, 7, 2, 9],
  },

  "who-is-this": {
    title: "Who Is This?",
    icon: "👤",
    instruction:
      "Look at the familiar person and choose the correct relationship.",
    questions: [
      {
        emoji: "👨",
        question: "This person is shown as:",
        options: ["Family Member", "Doctor", "Teacher"],
        answer: "Family Member",
      },
      {
        emoji: "👩",
        question: "This person is shown as:",
        options: ["Daughter", "Doctor", "Neighbour"],
        answer: "Daughter",
      },
      {
        emoji: "👴",
        question: "This person is shown as:",
        options: ["Friend", "Family Member", "Teacher"],
        answer: "Family Member",
      },
    ],
  },

  "ner-memory": {
    title: "NER Memory Game",
    icon: "🌿",
    instruction:
      "Select the places, foods and cultural memories associated with North Eastern India.",
    questions: [
      {
        question: "Which place is in Assam?",
        options: [
          "Kaziranga",
          "Gateway of India",
          "India Gate",
        ],
        answer: "Kaziranga",
      },
      {
        question: "Which place is associated with Meghalaya?",
        options: [
          "Shillong",
          "Jaipur",
          "Mumbai",
        ],
        answer: "Shillong",
      },
      {
        question: "Which food is commonly associated with Assam?",
        options: [
          "Pitha",
          "Dhokla",
          "Idli",
        ],
        answer: "Pitha",
      },
      {
        question: "Tawang is located in which state?",
        options: [
          "Arunachal Pradesh",
          "Kerala",
          "Punjab",
        ],
        answer: "Arunachal Pradesh",
      },
    ],
  },

  "focus-challenge": {
    title: "Focus Challenge",
    icon: "🎯",
    instruction:
      "Choose the target numbers. Stay focused and respond carefully.",
  },
};

async function saveGameSession(
  finalScore,
  game,
  patientId
) {
  const newSession = {
    game: game.title,
    category: game.title,
    score: Number(finalScore),
    patientId: patientId
      ? String(patientId)
      : null,
    date: new Date().toISOString(),
  };

  // --------------------------------
  // 1. LOCAL STORAGE BACKUP
  // --------------------------------

  try {
    const oldSessions = JSON.parse(
      localStorage.getItem(
        "mindcare_game_sessions"
      ) || "[]"
    );

    const localSession = {
      id: Date.now(),
      ...newSession,
    };

    localStorage.setItem(
      "mindcare_game_sessions",
      JSON.stringify([
        localSession,
        ...oldSessions,
      ])
    );
  } catch (error) {
    console.error(
      "Local storage save failed:",
      error
    );
  }

  // --------------------------------
  // 2. FIREBASE FIRESTORE
  // --------------------------------

  try {
    await addDoc(
      collection(db, "gameSessions"),
      newSession
    );

    console.log(
      `${game.title} session saved to Firebase.`
    );

    return true;
  } catch (error) {
    console.error(
      "Firebase game session save failed:",
      error
    );

    // Local storage backup already exists
    return false;
  }
}

function GamePlay() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const patientId =
    searchParams.get("patientId");

  const gameId =
    window.location.pathname.split("/").pop();

  const game =
    gameData[gameId] ||
    gameData["sequence"];

  const [started, setStarted] =
    useState(false);

  const [finished, setFinished] =
    useState(false);

  const [score, setScore] =
    useState(0);

  const [saved, setSaved] =
    useState(false);

  const [objectSelected, setObjectSelected] =
    useState([]);

  const [sequenceRound, setSequenceRound] =
    useState(0);

  const [sequenceSelected, setSequenceSelected] =
    useState([]);

  const [questionIndex, setQuestionIndex] =
    useState(0);

  const [correctAnswers, setCorrectAnswers] =
    useState(0);

  const [focusScore, setFocusScore] =
    useState(0);

  // Prevent duplicate saves
  const saveStartedRef = useRef(false);

  // --------------------------------
  // FINISH GAME
  // --------------------------------

  const finishGame = (finalScore) => {
    const safeScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(finalScore)
      )
    );

    setScore(safeScore);
    setFinished(true);

    if (saveStartedRef.current) {
      return;
    }

    saveStartedRef.current = true;
    setSaved(true);

    saveGameSession(
      safeScore,
      game,
      patientId
    ).then((firebaseSaved) => {
      if (firebaseSaved) {
        console.log(
          "Game session saved successfully."
        );
      } else {
        console.log(
          "Game saved locally. Firebase save failed."
        );
      }
    });
  };

  // --------------------------------
  // START GAME
  // --------------------------------

  const startGame = () => {
    setStarted(true);
  };

  // --------------------------------
  // REMEMBER OBJECTS
  // --------------------------------

  const handleObjectClick = (object) => {
    if (
      objectSelected.includes(object)
    ) {
      return;
    }

    const updated = [
      ...objectSelected,
      object,
    ];

    setObjectSelected(updated);

    if (
      updated.length ===
      game.objects.length
    ) {
      const finalScore =
        updated.length === 5
          ? 100
          : 80;

      setTimeout(() => {
        finishGame(finalScore);
      }, 400);
    }
  };

  // --------------------------------
  // SEQUENCE
  // --------------------------------

  const handleSequenceClick = (number) => {
    if (
      sequenceSelected.includes(number)
    ) {
      return;
    }

    const expected =
      game.sequence[
        sequenceSelected.length
      ];

    if (number === expected) {
      const updated = [
        ...sequenceSelected,
        number,
      ];

      setSequenceSelected(updated);

      if (
        updated.length ===
        game.sequence.length
      ) {
        const nextRound =
          sequenceRound + 1;

        if (nextRound >= 3) {
          finishGame(100);
        } else {
          setSequenceRound(
            nextRound
          );

          setSequenceSelected([]);
        }
      }
    } else {
      const currentScore =
        Math.max(
          40,
          80 -
            sequenceRound * 10
        );

      finishGame(currentScore);
    }
  };

  // --------------------------------
  // WHO IS THIS
  // --------------------------------

  const handleWhoAnswer = (answer) => {
    const current =
      game.questions[
        questionIndex
      ];

    const isCorrect =
      answer === current.answer;

    const newCorrect =
      correctAnswers +
      (isCorrect ? 1 : 0);

    setCorrectAnswers(
      newCorrect
    );

    if (
      questionIndex ===
      game.questions.length - 1
    ) {
      const finalScore =
        Math.round(
          (newCorrect /
            game.questions.length) *
            100
        );

      finishGame(finalScore);
    } else {
      setQuestionIndex(
        questionIndex + 1
      );
    }
  };

  // --------------------------------
  // NER MEMORY
  // --------------------------------

  const handleNERAnswer = (answer) => {
    const current =
      game.questions[
        questionIndex
      ];

    const isCorrect =
      answer === current.answer;

    const newCorrect =
      correctAnswers +
      (isCorrect ? 1 : 0);

    setCorrectAnswers(
      newCorrect
    );

    if (
      questionIndex ===
      game.questions.length - 1
    ) {
      const finalScore =
        Math.round(
          (newCorrect /
            game.questions.length) *
            100
        );

      finishGame(finalScore);
    } else {
      setQuestionIndex(
        questionIndex + 1
      );
    }
  };

  // --------------------------------
  // FOCUS
  // --------------------------------

  const handleFocusClick = (value) => {
    const newScore =
      focusScore + value;

    setFocusScore(newScore);

    if (newScore >= 100) {
      finishGame(100);
    }
  };

  // --------------------------------
  // BACK TO GAMES
  // --------------------------------

  const backToGames = () => {
    if (patientId) {
      navigate(
        `/games?patientId=${patientId}`
      );
    } else {
      navigate("/games");
    }
  };

  // --------------------------------
  // RESET GAME
  // --------------------------------

  const resetGame = () => {
    setStarted(false);
    setFinished(false);
    setSaved(false);
    setScore(0);

    setObjectSelected([]);
    setSequenceSelected([]);
    setSequenceRound(0);

    setQuestionIndex(0);
    setCorrectAnswers(0);
    setFocusScore(0);

    // Allow saving the new game
    saveStartedRef.current = false;
  };

  // --------------------------------
  // RESULT SCREEN
  // --------------------------------

  if (finished) {
    return (
      <div className="gameplay-page">

        <div className="game-result-card">

          <div className="result-icon">
            🎉
          </div>

          <h1>
            Activity Completed!
          </h1>

          <p>
            {game.title} has been completed.
          </p>

          <div className="final-score">

            <span>
              Your Score
            </span>

            <strong>
              {score}
            </strong>

            <small>
              / 100
            </small>

          </div>

          <div className="result-message">

            {score >= 80
              ? "Great work! Keep practicing regularly."
              : score >= 60
              ? "Good effort! Regular practice can help build familiarity."
              : "Nice try! You can practice this activity again."}

          </div>

          {saved && (
            <p
              style={{
                color: "#2e7d32",
                fontWeight: "600",
                marginTop: "12px",
              }}
            >
              ✓ Game session saved
            </p>
          )}

          <div className="result-actions">

            <button
              className="primary-btn"
              onClick={resetGame}
            >
              Play Again
            </button>

            <button
              className="secondary-btn"
              onClick={backToGames}
            >
              ← Back to Games
            </button>

          </div>

          <p className="result-note">
            This score represents activity
            performance and is not a medical
            diagnosis.
          </p>

        </div>

      </div>
    );
  }

  // --------------------------------
  // START SCREEN
  // --------------------------------

  if (!started) {
    return (
      <div className="gameplay-page">

        <div className="game-intro-card">

          <div className="game-big-icon">
            {game.icon}
          </div>

          <h1>
            {game.title}
          </h1>

          <p>
            {game.instruction}
          </p>

          {patientId && (
            <div className="patient-game-badge">
              👤 Patient-specific activity
            </div>
          )}

          <button
            className="primary-btn start-btn"
            onClick={startGame}
          >
            Start Activity →
          </button>

          <button
            className="text-btn"
            onClick={backToGames}
          >
            ← Back to Games
          </button>

        </div>

      </div>
    );
  }

  // --------------------------------
  // GAME SCREEN
  // --------------------------------

  return (
    <div className="gameplay-page">

      <div className="game-header">

        <button
          className="back-game-btn"
          onClick={backToGames}
        >
          ← Games
        </button>

        <div>
          <span>
            {game.icon}
          </span>{" "}
          <strong>
            {game.title}
          </strong>
        </div>

        <div className="live-score">
          Score: {score}
        </div>

      </div>

      {/* -------------------------------- */}
      {/* REMEMBER OBJECTS */}
      {/* -------------------------------- */}

      {gameId ===
        "remember-objects" && (
        <div className="game-board">

          <h2>
            Select each object you remember
          </h2>

          <p>
            Take your time and identify the
            objects shown below.
          </p>

          <div className="objects-grid">

            {game.objects.map(
              (object) => {

                const selected =
                  objectSelected.includes(
                    object
                  );

                return (
                  <button
                    key={object}
                    className={`object-card ${
                      selected
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleObjectClick(
                        object
                      )
                    }
                  >
                    {object}
                  </button>
                );
              }
            )}

          </div>

          <div className="progress-text">

            {objectSelected.length} /{" "}
            {game.objects.length} objects
            remembered

          </div>

        </div>
      )}

      {/* -------------------------------- */}
      {/* SEQUENCE */}
      {/* -------------------------------- */}

      {gameId === "sequence" && (
        <div className="game-board">

          <div className="round-label">
            Round{" "}
            {sequenceRound + 1} / 3
          </div>

          <h2>
            Select the sequence
          </h2>

          <p>
            Start with the first number and
            follow the correct order.
          </p>

          <div className="number-grid">

            {game.sequence.map(
              (number) => (

                <button
                  key={number}
                  className={
                    sequenceSelected.includes(
                      number
                    )
                      ? "number-btn selected"
                      : "number-btn"
                  }
                  onClick={() =>
                    handleSequenceClick(
                      number
                    )
                  }
                >
                  {number}
                </button>

              )
            )}

          </div>

          <div className="progress-text">

            Correct:{" "}
            {sequenceSelected.length} /{" "}
            {game.sequence.length}

          </div>

        </div>
      )}

      {/* -------------------------------- */}
      {/* WHO IS THIS */}
      {/* -------------------------------- */}

      {gameId ===
        "who-is-this" && (
        <div className="game-board">

          <div className="question-visual">

            {
              game.questions[
                questionIndex
              ].emoji
            }

          </div>

          <div className="round-label">

            Question{" "}
            {questionIndex + 1} /{" "}
            {game.questions.length}

          </div>

          <h2>

            {
              game.questions[
                questionIndex
              ].question
            }

          </h2>

          <div className="answer-grid">

            {game.questions[
              questionIndex
            ].options.map(
              (option) => (

                <button
                  key={option}
                  className="answer-btn"
                  onClick={() =>
                    handleWhoAnswer(
                      option
                    )
                  }
                >
                  {option}
                </button>

              )
            )}

          </div>

        </div>
      )}

      {/* -------------------------------- */}
      {/* NER MEMORY */}
      {/* -------------------------------- */}

      {gameId ===
        "ner-memory" && (
        <div className="game-board">

          <div className="ner-game-icon">
            🌿
          </div>

          <div className="round-label">

            Question{" "}
            {questionIndex + 1} /{" "}
            {game.questions.length}

          </div>

          <h2>

            {
              game.questions[
                questionIndex
              ].question
            }

          </h2>

          <div className="answer-grid">

            {game.questions[
              questionIndex
            ].options.map(
              (option) => (

                <button
                  key={option}
                  className="answer-btn"
                  onClick={() =>
                    handleNERAnswer(
                      option
                    )
                  }
                >
                  {option}
                </button>

              )
            )}

          </div>

        </div>
      )}

      {/* -------------------------------- */}
      {/* FOCUS CHALLENGE */}
      {/* -------------------------------- */}

      {gameId ===
        "focus-challenge" && (
        <div className="game-board">

          <div className="focus-target">
            🎯
          </div>

          <h2>
            Focus Challenge
          </h2>

          <p>
            Choose the numbers carefully.
          </p>

          <div className="focus-grid">

            {[10, 20, 15, 25, 30].map(
              (value) => (

                <button
                  key={value}
                  className="focus-btn"
                  onClick={() =>
                    handleFocusClick(
                      value
                    )
                  }
                >
                  +{value}
                </button>

              )
            )}

          </div>

          <div className="focus-progress">

            Focus progress:{" "}
            {Math.min(
              focusScore,
              100
            )}
            %

          </div>

        </div>
      )}

    </div>
  );
}

export default GamePlay;