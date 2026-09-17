import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import "./MemoryMatch.css";

const cards = ["🍎", "🌸", "🏠", "🐘"];

function createCards() {
  return [...cards, ...cards]
    .sort(() => Math.random() - 0.5)
    .map((value, index) => ({
      id: index,
      value,
      matched: false,
    }));
}

// Save game session to Local Storage + Firebase
async function saveGameSession(score, moves, patientId) {
  const newSession = {
    game: "Memory Match",
    category: "Memory",
    score: Number(score),
    moves: Number(moves),
    patientId: patientId ? String(patientId) : null,
    date: new Date().toISOString(),
  };

  // --------------------------------
  // 1. LOCAL STORAGE BACKUP
  // --------------------------------
  try {
    const oldSessions = JSON.parse(
      localStorage.getItem("mindcare_game_sessions") || "[]"
    );

    const localSession = {
      id: Date.now(),
      ...newSession,
    };

    localStorage.setItem(
      "mindcare_game_sessions",
      JSON.stringify([localSession, ...oldSessions])
    );
  } catch (error) {
    console.error("Local storage save failed:", error);
  }

  // --------------------------------
  // 2. FIREBASE FIRESTORE
  // --------------------------------
  try {
    await addDoc(
      collection(db, "gameSessions"),
      newSession
    );

    console.log("Game session saved to Firebase.");

    return true;
  } catch (error) {
    console.error(
      "Firebase game session save failed:",
      error
    );

    // Local storage already has the backup
    return false;
  }
}

function MemoryMatch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Patient ID from URL
  const patientId = searchParams.get("patientId");

  const [gameCards, setGameCards] = useState(createCards);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);

  // Prevent duplicate Firebase/local saves
  const saveStartedRef = useRef(false);

  // --------------------------------
  // CHECK TWO FLIPPED CARDS
  // --------------------------------
  useEffect(() => {
    if (flipped.length !== 2) return;

    const first = gameCards[flipped[0]];
    const second = gameCards[flipped[1]];

    if (!first || !second) return;

    // Matching cards
    if (first.value === second.value) {
      setMatched((current) => [
        ...current,
        first.id,
        second.id,
      ]);

      setFlipped([]);

      return;
    }

    // Non-matching cards
    const timer = setTimeout(() => {
      setFlipped([]);
    }, 800);

    return () => clearTimeout(timer);
  }, [flipped, gameCards]);

  // --------------------------------
  // GAME COMPLETION
  // --------------------------------
  useEffect(() => {
    if (
      matched.length === gameCards.length &&
      gameCards.length > 0
    ) {
      const finalScore = Math.max(
        100 - (moves - 4) * 5,
        40
      );

      setFinished(true);

      // Prevent duplicate saving
      if (saveStartedRef.current) return;

      saveStartedRef.current = true;
      setSaved(true);

      saveGameSession(
        finalScore,
        moves,
        patientId
      ).then((firebaseSaved) => {
        if (firebaseSaved) {
          console.log(
            "Memory Match session saved successfully."
          );
        } else {
          console.log(
            "Memory Match saved locally. Firebase save failed."
          );
        }
      });
    }
  }, [
    matched,
    gameCards.length,
    moves,
    patientId,
  ]);

  // --------------------------------
  // CARD CLICK
  // --------------------------------
  const handleCardClick = (index) => {
    // Don't allow more than two cards
    if (flipped.length === 2) return;

    // Don't click same card twice
    if (flipped.includes(index)) return;

    // Don't click already matched card
    if (matched.includes(gameCards[index].id)) return;

    const newFlipped = [
      ...flipped,
      index,
    ];

    setFlipped(newFlipped);

    // One move = two cards opened
    if (newFlipped.length === 2) {
      setMoves((current) => current + 1);
    }
  };

  // --------------------------------
  // RESTART GAME
  // --------------------------------
  const restartGame = () => {
    setGameCards(createCards());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setFinished(false);
    setSaved(false);

    // Allow saving the new game
    saveStartedRef.current = false;
  };

  // --------------------------------
  // BACK TO GAMES
  // --------------------------------
  const backToGames = () => {
    if (patientId) {
      navigate(`/games?patientId=${patientId}`);
    } else {
      navigate("/games");
    }
  };

  // --------------------------------
  // CALCULATE CURRENT SCORE
  // --------------------------------
  const currentScore = Math.max(
    100 - (moves - 4) * 5,
    40
  );

  return (
    <div className="memory-match-page">

      {/* -------------------------------- */}
      {/* TOP HEADER */}
      {/* -------------------------------- */}

      <div className="memory-match-top">

        <button
          className="memory-back-btn"
          onClick={backToGames}
        >
          ← Back to Games
        </button>

        <div className="memory-match-title">
          <h1>Memory Match 🧩</h1>

          <p>
            Match the identical cards and test memory skills.
          </p>

          {patientId && (
            <span className="patient-session-badge">
              👤 Patient-specific session
            </span>
          )}
        </div>

      </div>

      {/* -------------------------------- */}
      {/* GAME STATS */}
      {/* -------------------------------- */}

      <div className="memory-stats">

        <div className="memory-stat-card">
          <span className="memory-stat-label">
            Moves
          </span>

          <strong>
            {moves}
          </strong>
        </div>

        <div className="memory-stat-card">
          <span className="memory-stat-label">
            Pairs
          </span>

          <strong>
            {matched.length / 2}
            /{cards.length}
          </strong>
        </div>

        <div className="memory-stat-card">
          <span className="memory-stat-label">
            Score
          </span>

          <strong>
            {currentScore}
          </strong>
        </div>

      </div>

      {/* -------------------------------- */}
      {/* GAME BOARD */}
      {/* -------------------------------- */}

      {!finished && (
        <div className="memory-game-card">

          <div className="memory-board">

            {gameCards.map((card, index) => {

              const isFlipped =
                flipped.includes(index) ||
                matched.includes(card.id);

              const isMatched =
                matched.includes(card.id);

              return (
                <button
                  key={card.id}
                  className={`memory-card ${
                    isFlipped
                      ? "flipped"
                      : ""
                  } ${
                    isMatched
                      ? "matched"
                      : ""
                  }`}
                  onClick={() =>
                    handleCardClick(index)
                  }
                >

                  <div className="memory-card-inner">

                    {/* Card Back */}
                    <div className="memory-card-front">
                      ?
                    </div>

                    {/* Card Face */}
                    <div className="memory-card-back">
                      {card.value}
                    </div>

                  </div>

                </button>
              );
            })}

          </div>

          <p className="memory-game-instruction">
            Find all matching pairs with as few moves as possible.
          </p>

        </div>
      )}

      {/* -------------------------------- */}
      {/* GAME COMPLETED */}
      {/* -------------------------------- */}

      {finished && (
  <div className="memory-complete-card">
    
    <div className="complete-icon">
      🎉
    </div>

    <h2>Great Job!</h2>

    <p className="complete-message">
      You completed the Memory Match game.
    </p>

    {/* Final Score */}
    <div className="final-score-box">
      <span>Final Score</span>
      <strong>{currentScore}</strong>
    </div>

    {/* Final Stats */}
    <div className="final-game-stats">
      <div className="final-stat">
        <span>Moves</span>
        <strong>{moves}</strong>
      </div>

      <div className="final-stat">
        <span>Pairs</span>
        <strong>{cards.length}</strong>
      </div>
    </div>

    {/* Save Status */}
    {saved && (
      <p className="game-save-status">
        ✓ Game session saved
      </p>
    )}

    {/* Buttons */}
    <div className="complete-actions">
      <button
        className="play-again-btn"
        onClick={restartGame}
      >
        🔄 Play Again
      </button>

      <button
        className="back-games-btn"
        onClick={backToGames}
      >
        ← Back to Games
      </button>
    </div>

  </div>
)}

      {/* -------------------------------- */}
      {/* DISCLAIMER */}
      {/* -------------------------------- */}

      <div className="memory-disclaimer">

        <strong>
          Note:
        </strong>{" "}

        This game is designed for cognitive engagement
        and progress tracking. Scores indicate activity
        performance and are not a medical diagnosis.

      </div>

    </div>
  );
}

export default MemoryMatch;