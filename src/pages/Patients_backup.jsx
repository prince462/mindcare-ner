import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Patients.css";

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

function Patients() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState(() => {
    const savedPatients = localStorage.getItem("mindcare_patients");

    return savedPatients
      ? JSON.parse(savedPatients)
      : defaultPatients;
  });

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "",
    region: "",
    language: "",
  });

  useEffect(() => {
    localStorage.setItem(
      "mindcare_patients",
      JSON.stringify(patients)
    );
  }, [patients]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const addPatient = (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.age ||
      !form.region ||
      !form.language
    ) {
      alert("Please fill all patient details.");
      return;
    }

    const newPatient = {
      id: Date.now(),
      name: form.name,
      age: Number(form.age),
      region: form.region,
      language: form.language,
      score: 0,
      status: "New",
    };

    setPatients((currentPatients) => [
      ...currentPatients,
      newPatient,
    ]);

    setForm({
      name: "",
      age: "",
      region: "",
      language: "",
    });

    setShowModal(false);
  };

  const deletePatient = (id) => {
    const patient = patients.find(
      (item) => item.id === id
    );

    const confirmDelete = window.confirm(
      `Remove ${patient?.name || "this patient"} from the patient list?`
    );

    if (!confirmDelete) return;

    setPatients((currentPatients) =>
      currentPatients.filter(
        (patient) => patient.id !== id
      )
    );
  };

  const filteredPatients = patients.filter((patient) => {
    const searchText = search.toLowerCase();

    return (
      patient.name.toLowerCase().includes(searchText) ||
      patient.region.toLowerCase().includes(searchText) ||
      patient.language.toLowerCase().includes(searchText)
    );
  });

  const totalPatients = patients.length;

  const activePatients = patients.filter(
    (patient) =>
      patient.status !== "New"
  ).length;

  const attentionPatients = patients.filter(
    (patient) =>
      patient.status === "Attention"
  ).length;

  const improvingPatients = patients.filter(
    (patient) =>
      patient.status === "Improving"
  ).length;

  return (
    <div className="patients-page">

      <div className="patients-header">

        <div>
          <h2>Patients</h2>

          <p>
            Manage and monitor cognitive health progress.
          </p>
        </div>

        <button
          className="add-patient-btn"
          onClick={() => setShowModal(true)}
        >
          + Add Patient
        </button>

      </div>

      <div className="patient-stats">

        <div className="patient-stat-card">
          <span>Total Patients</span>
          <strong>{totalPatients}</strong>
        </div>

        <div className="patient-stat-card">
          <span>Active Today</span>
          <strong>{activePatients}</strong>
        </div>

        <div className="patient-stat-card">
          <span>Need Attention</span>
          <strong>{attentionPatients}</strong>
        </div>

        <div className="patient-stat-card">
          <span>Improving</span>
          <strong>{improvingPatients}</strong>
        </div>

      </div>

      <div className="patients-card">

        <div className="patients-card-top">

          <div>
            <h3>Patient Overview</h3>

            <p>
              Recent cognitive performance
            </p>
          </div>

          <input
            type="text"
            placeholder="Search patients..."
            className="patient-search"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="table-container">

          <table>

            <thead>
              <tr>
                <th>Patient</th>
                <th>Age</th>
                <th>Region</th>
                <th>Language</th>
                <th>Cognitive Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (

                  <tr key={patient.id}>

                    <td>
                      <div className="patient-name">

                        <div className="patient-avatar">
                          {patient.name.charAt(0)}
                        </div>

                        <strong>
                          {patient.name}
                        </strong>

                      </div>
                    </td>

                    <td>
                      {patient.age}
                    </td>

                    <td>
                      {patient.region}
                    </td>

                    <td>
                      {patient.language}
                    </td>

                    <td>

                      <div className="score">

                        <strong>
                          {patient.score}
                        </strong>

                        <span>
                          /100
                        </span>

                      </div>

                    </td>

                    <td>

                      <span
                        className={`status ${patient.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {patient.status}
                      </span>

                    </td>

                    <td>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                        }}
                      >

                        <button
                          className="view-btn"
                          onClick={() =>
                            navigate(
                              `/patients/${patient.id}`
                            )
                          }
                        >
                          View
                        </button>

                        <button
                          className="view-btn"
                          onClick={() =>
                            deletePatient(patient.id)
                          }
                          style={{
                            background: "#fff1f2",
                            color: "#dc2626",
                            border:
                              "1px solid #fecdd3",
                          }}
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))
              ) : (

                <tr>

                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#64748b",
                    }}
                  >
                    No patients found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {showModal && (

        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "#ffffff",
              borderRadius: "18px",
              padding: "28px",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >

              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "22px",
                  }}
                >
                  Add New Patient
                </h3>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#64748b",
                  }}
                >
                  Enter the patient's basic information.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  borderRadius: "8px",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                ×
              </button>

            </div>

            <form onSubmit={addPatient}>

              <div
                style={{
                  marginBottom: "16px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontWeight: 600,
                  }}
                >
                  Patient Name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter patient name"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius: "9px",
                    boxSizing: "border-box",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div
                style={{
                  marginBottom: "16px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontWeight: 600,
                  }}
                >
                  Age
                </label>

                <input
                  name="age"
                  type="number"
                  min="1"
                  max="120"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Enter age"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius: "9px",
                    boxSizing: "border-box",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div
                style={{
                  marginBottom: "16px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontWeight: 600,
                  }}
                >
                  Region
                </label>

                <select
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius: "9px",
                    boxSizing: "border-box",
                    fontSize: "14px",
                    background: "white",
                  }}
                >

                  <option value="">
                    Select region
                  </option>

                  <option value="Assam">
                    Assam
                  </option>

                  <option value="Meghalaya">
                    Meghalaya
                  </option>

                  <option value="Nagaland">
                    Nagaland
                  </option>

                  <option value="Mizoram">
                    Mizoram
                  </option>

                  <option value="Manipur">
                    Manipur
                  </option>

                  <option value="Tripura">
                    Tripura
                  </option>

                  <option value="Arunachal Pradesh">
                    Arunachal Pradesh
                  </option>

                  <option value="Sikkim">
                    Sikkim
                  </option>

                </select>

              </div>

              <div
                style={{
                  marginBottom: "24px",
                }}
              >

                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontWeight: 600,
                  }}
                >
                  Preferred Language
                </label>

                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius: "9px",
                    boxSizing: "border-box",
                    fontSize: "14px",
                    background: "white",
                  }}
                >

                  <option value="">
                    Select language
                  </option>

                  <option value="Assamese">
                    Assamese
                  </option>

                  <option value="Khasi">
                    Khasi
                  </option>

                  <option value="Mizo">
                    Mizo
                  </option>

                  <option value="Bengali">
                    Bengali
                  </option>

                  <option value="Manipuri">
                    Manipuri
                  </option>

                  <option value="Hindi">
                    Hindi
                  </option>

                  <option value="English">
                    English
                  </option>

                </select>

              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  style={{
                    padding: "11px 18px",
                    border:
                      "1px solid #cbd5e1",
                    background: "white",
                    borderRadius: "9px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="add-patient-btn"
                  style={{
                    border: "none",
                  }}
                >
                  Add Patient
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Patients;