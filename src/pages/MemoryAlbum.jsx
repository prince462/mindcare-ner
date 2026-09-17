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
import "./MemoryAlbum.css";

const initialMemories = [
  {
    id: 1,
    title: "My Family",
    person: "Family",
    type: "Family",
    icon: "👨‍👩‍👧",
    description: "Photos and memories of family members.",
  },
  {
    id: 2,
    title: "Kaziranga National Park",
    person: "Assam",
    type: "Place",
    icon: "🌿",
    description: "A familiar place from Assam.",
  },
  {
    id: 3,
    title: "Shillong",
    person: "Meghalaya",
    type: "Place",
    icon: "⛰️",
    description: "A familiar city and place in Meghalaya.",
  },
  {
    id: 4,
    title: "Traditional Food",
    person: "Food",
    type: "Food",
    icon: "🍲",
    description: "Familiar traditional food memories.",
  },
  {
    id: 5,
    title: "My Daughter",
    person: "Family",
    type: "Family",
    icon: "👩",
    description: "A special memory of my daughter.",
  },
  {
    id: 6,
    title: "My Home",
    person: "Home",
    type: "Other",
    icon: "🏠",
    description: "A familiar place and home memory.",
  },
];

function MemoryAlbum() {
  const navigate = useNavigate();

  const [memories, setMemories] = useState(() => {
    try {
      const savedMemories = localStorage.getItem(
        "mindcare_memories"
      );

      return savedMemories
        ? JSON.parse(savedMemories)
        : initialMemories;
    } catch (error) {
      console.error(
        "Local memory load failed:",
        error
      );

      return initialMemories;
    }
  });

  const [firebaseLoading, setFirebaseLoading] =
    useState(true);

  const [firebaseError, setFirebaseError] =
    useState(false);

  // Load memories from Firebase.
  // Local storage remains as an offline fallback.
  useEffect(() => {
    let mounted = true;

    const loadMemories = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "memories")
        );

        const firebaseMemories =
          snapshot.docs.map((memoryDoc) => ({
            id: String(memoryDoc.id),
            ...memoryDoc.data(),
          }));

        if (!mounted) return;

        if (firebaseMemories.length > 0) {
          setMemories(firebaseMemories);

          localStorage.setItem(
            "mindcare_memories",
            JSON.stringify(firebaseMemories)
          );
        } else {
          // If Firebase is empty, keep existing local/demo data.
          // We don't automatically upload demo data here.
          setMemories((current) => current);
        }

        setFirebaseError(false);
      } catch (error) {
        console.error(
          "Firebase memories load failed:",
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

  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedMemory, setSelectedMemory] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    person: "",
    type: "Family",
    icon: "👤",
    description: "",
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addMemory = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Please enter a memory title.");
      return;
    }

    const memoryData = {
      title: formData.title.trim(),
      person:
        formData.person.trim() ||
        "Not specified",
      type: formData.type,
      icon: formData.icon,
      description:
        formData.description.trim() ||
        "No description added.",
    };

    // Add immediately to UI/local backup.
    const localMemory = {
      id: Date.now(),
      ...memoryData,
    };

    setMemories((current) => {
      const updatedMemories = [
        localMemory,
        ...current,
      ];

      localStorage.setItem(
        "mindcare_memories",
        JSON.stringify(updatedMemories)
      );

      return updatedMemories;
    });

    // Save to Firebase.
    try {
      const docRef = await addDoc(
        collection(db, "memories"),
        memoryData
      );

      console.log(
        "Memory saved to Firebase:",
        docRef.id
      );

      setFirebaseError(false);
    } catch (error) {
      console.error(
        "Firebase memory save failed:",
        error
      );

      setFirebaseError(true);
    }

    setFormData({
      title: "",
      person: "",
      type: "Family",
      icon: "👤",
      description: "",
    });

    setShowForm(false);
  };

  const deleteMemory = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this memory?"
    );

    if (!confirmDelete) {
      return;
    }

    // Update UI/local backup first.
    setMemories((current) => {
      const updatedMemories =
        current.filter(
          (memory) =>
            String(memory.id) !== String(id)
        );

      localStorage.setItem(
        "mindcare_memories",
        JSON.stringify(updatedMemories)
      );

      return updatedMemories;
    });

    // Delete from Firebase.
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

  const clearAllMemories = async () => {
    const confirmDelete = window.confirm(
      "This will remove all saved memories. Continue?"
    );

    if (!confirmDelete) {
      return;
    }

    setMemories([]);

    localStorage.setItem(
      "mindcare_memories",
      JSON.stringify([])
    );

    try {
      const snapshot = await getDocs(
        collection(db, "memories")
      );

      await Promise.all(
        snapshot.docs.map((memoryDoc) =>
          deleteDoc(
            doc(db, "memories", memoryDoc.id)
          )
        )
      );

      setFirebaseError(false);
    } catch (error) {
      console.error(
        "Firebase clear memories failed:",
        error
      );

      setFirebaseError(true);
    }
  };

  const resetDemoMemories = async () => {
    const confirmReset = window.confirm(
      "Restore the default MindCare demo memories?"
    );

    if (!confirmReset) {
      return;
    }

    setMemories(initialMemories);

    localStorage.setItem(
      "mindcare_memories",
      JSON.stringify(initialMemories)
    );

    setSearch("");
    setFilter("All");

    try {
      // Remove existing Firebase memories.
      const snapshot = await getDocs(
        collection(db, "memories")
      );

      await Promise.all(
        snapshot.docs.map((memoryDoc) =>
          deleteDoc(
            doc(db, "memories", memoryDoc.id)
          )
        )
      );

      // Add default demo memories to Firebase.
      await Promise.all(
        initialMemories.map((memory) => {
          const { id, ...memoryData } =
            memory;

          return addDoc(
            collection(db, "memories"),
            memoryData
          );
        })
      );

      setFirebaseError(false);
    } catch (error) {
      console.error(
        "Firebase demo reset failed:",
        error
      );

      setFirebaseError(true);
    }
  };

  const filteredMemories = memories.filter((memory) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      memory.title.toLowerCase().includes(searchText) ||
      memory.person.toLowerCase().includes(searchText) ||
      memory.description.toLowerCase().includes(searchText);

    const matchesFilter =
      filter === "All" ||
      memory.type === filter;

    return matchesSearch && matchesFilter;
  });

  const familyCount = memories.filter(
    (memory) => memory.type === "Family"
  ).length;

  const placeCount = memories.filter(
    (memory) => memory.type === "Place"
  ).length;

  const recentlyAdded =
    memories.length > initialMemories.length ? 1 : 0;

  return (
    <div className="memory-page">

      {/* Header */}
      <div className="memory-header">

        <div>
          <h2>Memory Album 🖼️</h2>

          <p>
            Manage familiar people, places and memories
            for cognitive activities.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >

          {/* Memory Assistant Button */}
          <button
            className="memory-assistant-link-btn"
            onClick={() =>
              navigate("/memory-assistant")
            }
          >
            🧠 Memory Assistant
          </button>

          {/* Add Memory Button */}
          <button
            className="add-memory-btn"
            onClick={() =>
              setShowForm((current) => !current)
            }
          >
            {showForm
              ? "✕ Close"
              : "+ Add Memory"}
          </button>

        </div>

      </div>

      {/* Stats */}
      <div className="memory-stats">

        <div className="memory-stat-card">
          <span>Total Memories</span>
          <strong>{memories.length}</strong>
        </div>

        <div className="memory-stat-card">
          <span>Family Memories</span>
          <strong>{familyCount}</strong>
        </div>

        <div className="memory-stat-card">
          <span>Places</span>
          <strong>{placeCount}</strong>
        </div>

        <div className="memory-stat-card">
          <span>Recently Added</span>
          <strong>{recentlyAdded}</strong>
        </div>

      </div>

      {/* Add Memory Form */}
      {showForm && (
        <form
          className="memory-form"
          onSubmit={addMemory}
        >

          <div className="memory-form-header">

            <div>
              <h3>Add New Memory</h3>

              <p>
                Add a familiar memory for personalized
                cognitive activities.
              </p>
            </div>

          </div>

          <div className="memory-form-grid">

            <div className="form-group">

              <label>
                Memory Title
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. My Childhood Home"
              />

            </div>

            <div className="form-group">

              <label>
                Person / Place
              </label>

              <input
                type="text"
                name="person"
                value={formData.person}
                onChange={handleInputChange}
                placeholder="e.g. Assam"
              />

            </div>

            <div className="form-group">

              <label>
                Memory Type
              </label>

              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
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

            </div>

            <div className="form-group">

              <label>
                Icon
              </label>

              <select
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
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

            </div>

            <div className="form-group full-width">

              <label>
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Write a short description..."
                rows="3"
              />

            </div>

          </div>

          <div className="form-actions">

            <button
              type="button"
              className="cancel-memory-btn"
              onClick={() =>
                setShowForm(false)
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-memory-btn"
            >
              Save Memory
            </button>

          </div>

        </form>
      )}

      {/* Search + Filter */}
      <div className="memory-toolbar">

        <input
          type="text"
          className="memory-search"
          placeholder="🔍 Search memories..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          className="memory-filter"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
        >

          <option value="All">
            All Memories
          </option>

          <option value="Family">
            Family
          </option>

          <option value="Place">
            Places
          </option>

          <option value="Food">
            Food
          </option>

          <option value="Event">
            Events
          </option>

          <option value="Other">
            Other
          </option>

        </select>

      </div>

      {/* Result Information */}
      <div className="memory-results">

        Showing{" "}
        <strong>
          {filteredMemories.length}
        </strong>{" "}
        of{" "}
        <strong>
          {memories.length}
        </strong>{" "}
        memories

      </div>

      {firebaseLoading && (
        <div
          style={{
            marginBottom: "12px",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          ⏳ Syncing memories with Firebase...
        </div>
      )}

      {!firebaseLoading && firebaseError && (
        <div
          style={{
            marginBottom: "12px",
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
            marginBottom: "12px",
            color: "#15803d",
            fontSize: "13px",
          }}
        >
          ✓ Memories synced with Firebase
        </div>
      )}

      {/* Memory Cards */}
      {filteredMemories.length > 0 ? (

        <div className="memory-grid">

          {filteredMemories.map((memory) => (

            <div
              className="memory-card"
              key={memory.id}
              onClick={() => setSelectedMemory(memory)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedMemory(memory);
                }
              }}
            >

              <div className="memory-card-top">

                <div className="memory-icon">
                  {memory.icon}
                </div>

                <span className="memory-type">
                  {memory.type}
                </span>

              </div>

              <h3>
                {memory.title}
              </h3>

              <p className="memory-person">
                📍 {memory.person}
              </p>

              <p className="memory-description">
                {memory.description}
              </p>

              <button
                type="button"
                className="delete-memory-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMemory(memory.id);
                }}
              >
                🗑 Delete
              </button>

            </div>

          ))}

        </div>

      ) : (

        <div className="empty-memory">

          <div>🔎</div>

          <h3>
            No memories found
          </h3>

          <p>
            Try a different search term or
            memory category.
          </p>

          <button
            onClick={() => {
              setSearch("");
              setFilter("All");
            }}
          >
            Clear Search
          </button>

        </div>

      )}

      {/* Memory Details Modal */}
      {selectedMemory && (
        <div
          className="memory-modal-overlay"
          onClick={() => setSelectedMemory(null)}
        >
          <div
            className="memory-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              type="button"
              className="memory-modal-close"
              onClick={() => setSelectedMemory(null)}
              aria-label="Close memory details"
            >
              ✕
            </button>

            <div className="memory-modal-icon">
              {selectedMemory.icon}
            </div>

            <span className="memory-modal-type">
              {selectedMemory.type}
            </span>

            <h2>
              {selectedMemory.title}
            </h2>

            <p className="memory-modal-person">
              📍 {selectedMemory.person}
            </p>

            <div className="memory-modal-description">
              <strong>About this memory</strong>
              <p>
                {selectedMemory.description}
              </p>
            </div>

            <button
              type="button"
              className="memory-modal-delete"
              onClick={() => {
                setSelectedMemory(null);
                deleteMemory(selectedMemory.id);
              }}
            >
              🗑 Delete Memory
            </button>

          </div>
        </div>
      )}

      {/* Management Actions */}
      <div className="memory-management">

        <button
          onClick={resetDemoMemories}
        >
          ↻ Reset Demo Memories
        </button>

        <button
          className="danger-action"
          onClick={clearAllMemories}
        >
          🗑 Clear All Memories
        </button>

      </div>

      {/* Info */}
      <div className="memory-info">

        <strong>
          💡 Memory Assistant:
        </strong>

        <span>
          Familiar memories can be used in recognition
          and recall activities to create more
          personalized cognitive exercises.
        </span>

      </div>

    </div>
  );
}

export default MemoryAlbum;