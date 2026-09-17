import { useNavigate, useSearchParams } from "react-router-dom";
import "./Games.css";

const games = [
  {
    id: "memory-match",
    title: "Memory Match",
    icon: "🧩",
    description:
      "Match identical cards and exercise visual memory.",
    difficulty: "Easy",
    duration: "5 min",
    category: "Memory",
  },
  {
    id: "remember-objects",
    title: "Remember Objects",
    icon: "👀",
    description:
      "Observe objects carefully and recall what you saw.",
    difficulty: "Easy",
    duration: "5 min",
    category: "Recall",
  },
  {
    id: "sequence",
    title: "Sequence Game",
    icon: "🔢",
    description:
      "Remember and reproduce sequences in the correct order.",
    difficulty: "Medium",
    duration: "5 min",
    category: "Attention",
  },
  {
    id: "who-is-this",
    title: "Who Is This?",
    icon: "👤",
    description:
      "Identify familiar people and practice recognition.",
    difficulty: "Easy",
    duration: "3 min",
    category: "Recognition",
  },
  {
    id: "ner-memory",
    title: "NER Memory Game",
    icon: "🌿",
    description:
      "Recall familiar places, food and cultural elements from North Eastern India.",
    difficulty: "Easy",
    duration: "5 min",
    category: "Cultural Memory",
  },
  {
    id: "focus-challenge",
    title: "Focus Challenge",
    icon: "🎯",
    description:
      "Find the target object and practice focused attention.",
    difficulty: "Medium",
    duration: "5 min",
    category: "Attention",
  },
];

function Games() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const patientId = searchParams.get("patientId");

  const startGame = (gameId) => {
    if (patientId) {
      navigate(`/games/${gameId}?patientId=${patientId}`);
    } else {
      navigate(`/games/${gameId}`);
    }
  };

  return (
    <div className="games-page">

      {/* Header */}
      <div className="games-header">

        <div>
          <h2>Cognitive Games 🎮</h2>

          <p>
            Interactive activities designed for memory,
            attention and cognitive engagement.
          </p>

          {patientId && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                marginTop: "10px",
                padding: "7px 12px",
                borderRadius: "20px",
                background: "#ecfdf5",
                color: "#047857",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              👤 Patient-specific session
            </div>
          )}
        </div>

        <div className="games-today">

          <span>Today's Games</span>

          <strong>3 / 5</strong>

        </div>

      </div>

      {/* AI Recommendation */}
      <div className="ai-game-recommendation">

        <div className="ai-game-icon">
          🤖
        </div>

        <div className="ai-game-content">

          <span className="recommendation-label">
            AI Recommended Exercise
          </span>

          <h3>
            Try a short Sequence Game session
          </h3>

          <p>
            This activity can provide additional
            sequential-memory and attention data.
          </p>

        </div>

        <button
          className="recommendation-btn"
          onClick={() =>
            startGame("sequence")
          }
        >
          Start →
        </button>

      </div>

      {/* Game Grid */}
      <div className="games-section">

        <div className="games-section-header">

          <div>
            <h3>All Cognitive Activities</h3>

            <p>
              Choose an activity to begin
            </p>
          </div>

          <span>
            {games.length} Activities
          </span>

        </div>

        <div className="games-grid">

          {games.map((game) => (

            <div
              className="game-card"
              key={game.id}
            >

              <div className="game-card-top">

                <div className="game-icon">
                  {game.icon}
                </div>

                <span
                  className={`game-difficulty ${game.difficulty
                    .toLowerCase()}`}
                >
                  {game.difficulty}
                </span>

              </div>

              <h3>
                {game.title}
              </h3>

              <p>
                {game.description}
              </p>

              <div className="game-card-info">

                <span>
                  🧠 {game.category}
                </span>

                <span>
                  ⏱ {game.duration}
                </span>

              </div>

              <button
                className="start-game-btn"
                onClick={() =>
                  startGame(game.id)
                }
              >
                Start Game →
              </button>

            </div>

          ))}

        </div>

      </div>

      {/* How it works */}
      <div className="game-info-card">

        <div className="game-info-icon">
          💡
        </div>

        <div>

          <h3>
            How Cognitive Games Help
          </h3>

          <p>
            Game activities generate performance data
            such as accuracy, score and completion.
            This information can be used to personalize
            future activities and track changes over time.
          </p>

        </div>

      </div>

      {/* Disclaimer */}
      <div className="games-disclaimer">

        ℹ️ These activities are designed for cognitive
        engagement and progress tracking. They are not
        intended to diagnose, treat or replace professional
        medical assessment.

      </div>

    </div>
  );
}

export default Games;