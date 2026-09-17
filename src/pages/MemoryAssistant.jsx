import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import "./MemoryAssistant.css";

const initialMemories = [
  {
    id: 1,
    type: "Family",
    icon: "👨‍👩‍👧",
    title: "My Family",
    detail: "Family",
    note: "Photos and memories of family members.",
  },
  {
    id: 2,
    type: "Place",
    icon: "🌿",
    title: "Kaziranga National Park",
    detail: "Assam",
    note: "A familiar place from Assam.",
  },
  {
    id: 3,
    type: "Place",
    icon: "⛰️",
    title: "Shillong",
    detail: "Meghalaya",
    note: "A familiar city and place in Meghalaya.",
  },
  {
    id: 4,
    type: "Food",
    icon: "🍲",
    title: "Traditional Food",
    detail: "Food",
    note: "Familiar traditional food memories.",
  },
  {
    id: 5,
    type: "Family",
    icon: "👩",
    title: "My Daughter",
    detail: "Family",
    note: "A special memory of my daughter.",
  },
  {
    id: 6,
    type: "Other",
    icon: "🏠",
    title: "My Home",
    detail: "Home",
    note: "A familiar place and home memory.",
  },
];

function MemoryAssistant() {
  const navigate = useNavigate();

  const [memories, setMemories] = useState(() => {
    try {
      const saved = localStorage.getItem("mindcare_memories");

      if (saved) {
        const albumMemories = JSON.parse(saved);

        return albumMemories.map((memory) => ({
          id: memory.id,
          type: memory.type,
          icon: memory.icon,
          title: memory.title,
          detail:
            memory.person || "Not specified",
          note:
            memory.description ||
            "No additional information added.",
        }));
      }
    } catch (error) {
      console.error(
        "Local memory load failed:",
        error
      );
    }

    return initialMemories;
  });

  const [firebaseLoading, setFirebaseLoading] =
    useState(true);

  const [firebaseError, setFirebaseError] =
    useState(false);

  // Firebase is the shared source of memory information.
  // localStorage remains available as an offline fallback.
  useEffect(() => {
    let mounted = true;

    const loadMemories = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "memories")
        );

        const firebaseMemories =
          snapshot.docs.map((memoryDoc) => {
            const data = memoryDoc.data();

            return {
              id: String(memoryDoc.id),
              type: data.type || "Other",
              icon: data.icon || "👤",
              title: data.title || "Untitled Memory",
              detail:
                data.person ||
                data.detail ||
                "Not specified",
              note:
                data.description ||
                data.note ||
                "No additional information added.",
            };
          });

        if (!mounted) return;

        if (firebaseMemories.length > 0) {
          setMemories(firebaseMemories);

          // Keep Album/Assistant local backup in sync.
          const albumMemories =
            firebaseMemories.map((memory) => ({
              id: memory.id,
              title: memory.title,
              person: memory.detail,
              type: memory.type,
              icon: memory.icon,
              description: memory.note,
            }));

          localStorage.setItem(
            "mindcare_memories",
            JSON.stringify(albumMemories)
          );

          localStorage.setItem(
            "mindcare_memory_assistant",
            JSON.stringify(firebaseMemories)
          );
        }
      } catch (error) {
        console.error(
          "Firebase memory load failed:",
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

    loadMemories();

    return () => {
      mounted = false;
    };
  }, []);

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    type: "Family",
    title: "",
    detail: "",
    note: "",
    icon: "👤",
  });

  const saveMemory = async (newMemory) => {
    const currentAlbum = JSON.parse(
      localStorage.getItem(
        "mindcare_memories"
      ) || "[]"
    );

    const albumMemory = {
      id: newMemory.id,
      title: newMemory.title,
      person: newMemory.detail,
      type: newMemory.type,
      icon: newMemory.icon,
      description: newMemory.note,
    };

    const updatedAlbum = [
      albumMemory,
      ...currentAlbum,
    ];

    localStorage.setItem(
      "mindcare_memories",
      JSON.stringify(updatedAlbum)
    );

    const assistantMemories =
      updatedAlbum.map((memory) => ({
        id: memory.id,
        type: memory.type,
        icon: memory.icon,
        title: memory.title,
        detail:
          memory.person || "Not specified",
        note:
          memory.description ||
          "No additional information added.",
      }));

    localStorage.setItem(
      "mindcare_memory_assistant",
      JSON.stringify(assistantMemories)
    );

    setMemories(assistantMemories);

    // Save the same memory to the shared Firebase collection.
    try {
      await addDoc(collection(db, "memories"), {
        title: albumMemory.title,
        person: albumMemory.person,
        type: albumMemory.type,
        icon: albumMemory.icon,
        description: albumMemory.description,
      });

      setFirebaseError(false);
    } catch (error) {
      console.error(
        "Firebase memory save failed:",
        error
      );

      setFirebaseError(true);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const addMemory = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter a memory title.");
      return;
    }

    if (!form.detail.trim()) {
      alert("Please enter details.");
      return;
    }

    const newMemory = {
      id: Date.now(),
      type: form.type,
      icon: form.icon,
      title: form.title.trim(),
      detail: form.detail.trim(),
      note:
        form.note.trim() ||
        "No additional information added.",
    };

    await saveMemory(newMemory);

    setForm({
      type: "Family",
      title: "",
      detail: "",
      note: "",
      icon: "👤",
    });

    setShowForm(false);
  };

  const deleteMemory = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this memory from the Memory Album?"
    );

    if (!confirmDelete) {
      return;
    }

    const savedAlbum = JSON.parse(
      localStorage.getItem(
        "mindcare_memories"
      ) || "[]"
    );

    const updatedAlbum = savedAlbum.filter(
      (memory) =>
        String(memory.id) !== String(id)
    );

    localStorage.setItem(
      "mindcare_memories",
      JSON.stringify(updatedAlbum)
    );

    const updatedAssistant =
      updatedAlbum.map((memory) => ({
        id: memory.id,
        type: memory.type,
        icon: memory.icon,
        title: memory.title,
        detail:
          memory.person || "Not specified",
        note:
          memory.description ||
          "No additional information added.",
      }));

    localStorage.setItem(
      "mindcare_memory_assistant",
      JSON.stringify(updatedAssistant)
    );

    setMemories(updatedAssistant);

    // Firebase documents created by the Album use their
    // Firestore id. Delete it when this Assistant item has
    // a matching id.
    try {
      await deleteDoc(
        doc(db, "memories", String(id))
      );

      setFirebaseError(false);
    } catch (error) {
      console.error(
        "Firebase memory delete failed:",
        error
      );

      setFirebaseError(true);
    }
  };

  const readMemory = (memory) => {
    const text = `${memory.title}. ${memory.detail}. ${memory.note}`;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const speech =
        new SpeechSynthesisUtterance(text);

      speech.rate = 0.85;
      speech.pitch = 1;

      window.speechSynthesis.speak(speech);
    } else {
      alert(text);
    }
  };

  const filteredMemories = memories.filter(
    (memory) => {
      const text =
        `${memory.title} ${memory.detail} ${memory.note}`.toLowerCase();

      const matchesSearch =
        text.includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        memory.type === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    }
  );

  return (
    <div className="memory-assistant-page">

      {/* Header */}
      <div className="memory-assistant-header">

        <div>

          <button
            className="back-memory-btn"
            onClick={() =>
              navigate("/memory")
            }
          >
            ← Memory Album
          </button>

          <h2>
            Memory Assistant 🧠
          </h2>

          <p>
            Personalized memory support using
            familiar people, places and routines.
          </p>

        </div>

        <button
          className="add-memory-assistant-btn"
          onClick={() =>
            setShowForm(true)
          }
        >
          + Add Information
        </button>

      </div>

      {/* AI Banner */}
      <div className="memory-assistant-banner">

        <div className="assistant-banner-icon">
          🤖
        </div>

        <div>

          <span>
            PERSONALIZED MEMORY SUPPORT
          </span>

          <h3>
            Familiar information for cognitive
            activities
          </h3>

          <p>
            The information saved here can be
            used by the patient-facing app for
            recall activities and voice reminders.
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
          ⚠️ Firebase sync unavailable. Local backup is being used.
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
          ✓ Memory information synced with Firebase
        </div>
      )}

      {/* Search */}
      <div className="assistant-search-box">

        <input
          type="text"
          placeholder="🔍 Search memory information..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      {/* Filters */}
      <div className="memory-assistant-filters">

        {[
          "All",
          "Family",
          "Place",
          "Food",
          "Event",
          "Other",
        ].map((item) => (

          <button
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

      {/* Cards */}
      <div className="memory-assistant-grid">

        {filteredMemories.length > 0 ? (

          filteredMemories.map(
            (memory) => (

              <div
                className="memory-assistant-card"
                key={memory.id}
              >

                <div className="assistant-card-top">

                  <div className="assistant-card-icon">
                    {memory.icon}
                  </div>

                  <span>
                    {memory.type}
                  </span>

                </div>

                <h3>
                  {memory.title}
                </h3>

                <strong>
                  {memory.detail}
                </strong>

                <p>
                  {memory.note}
                </p>

                <div className="assistant-card-actions">

                  <button
                    onClick={() =>
                      readMemory(memory)
                    }
                  >
                    🔊 Read Aloud
                  </button>

                  <button
                    className="delete-assistant-btn"
                    onClick={() =>
                      deleteMemory(memory.id)
                    }
                  >
                    🗑 Delete
                  </button>

                </div>

              </div>

            )
          )

        ) : (

          <div className="memory-assistant-empty">

            <div>
              🧠
            </div>

            <h3>
              No memory information found
            </h3>

            <p>
              Add familiar information to
              build the patient's memory profile.
            </p>

          </div>

        )}

      </div>

      {/* Add Form */}
      {showForm && (

        <div className="assistant-modal-overlay">

          <div className="assistant-modal">

            <div className="assistant-modal-header">

              <div>
                <h3>
                  Add Memory Information
                </h3>

                <p>
                  This information will also
                  appear in Memory Album.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowForm(false)
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={addMemory}>

              <label>
                Type
              </label>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
              >

                <option value="Family">
                  Family
                </option>

                <option value="Place">
                  Place
                </option>

                <option value="Food">
                  Food
                </option>

                <option value="Event">
                  Event
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

              <label>
                Title
              </label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. My Son"
              />

              <label>
                Person / Place
              </label>

              <input
                name="detail"
                value={form.detail}
                onChange={handleChange}
                placeholder="e.g. Rahul / Assam"
              />

              <label>
                Icon
              </label>

              <select
                name="icon"
                value={form.icon}
                onChange={handleChange}
              >

                <option value="👤">
                  👤 Person
                </option>

                <option value="👨‍👩‍👧">
                  👨‍👩‍👧 Family
                </option>

                <option value="🏠">
                  🏠 Home
                </option>

                <option value="🌿">
                  🌿 Nature
                </option>

                <option value="⛰️">
                  ⛰️ Place
                </option>

                <option value="🍲">
                  🍲 Food
                </option>

                <option value="🎉">
                  🎉 Event
                </option>

                <option value="❤️">
                  ❤️ Special
                </option>

              </select>

              <label>
                Additional Information
              </label>

              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="e.g. Visits every Sunday..."
              />

              <div className="assistant-form-actions">

                <button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Cancel
                </button>

                <button type="submit">
                  Save Information
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* Disclaimer */}
      <div className="memory-assistant-disclaimer">

        ℹ️ Memory Assistant is designed for
        personalized support, recall activities
        and reminders. It is not a diagnostic
        or clinical tool.

      </div>

    </div>
  );
}

export default MemoryAssistant;