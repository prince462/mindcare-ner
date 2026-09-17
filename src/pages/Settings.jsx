import { useEffect, useState } from "react";
import "./Settings.css";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase";

const DEFAULT_SETTINGS = {
  language: "English",
  notifications: true,
  voiceSupport: true,
  largeText: false,
  highContrast: false,
  aiPersonalization: true,
};

function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [syncStatus, setSyncStatus] = useState("Loading settings...");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Keep localStorage as an offline/cache fallback.
    let localSettings = DEFAULT_SETTINGS;

    try {
      const saved = localStorage.getItem("mindcare_settings");

      if (saved) {
        localSettings = {
          ...DEFAULT_SETTINGS,
          ...JSON.parse(saved),
        };

        setSettings(localSettings);
      }
    } catch (error) {
      console.error("Error reading local settings:", error);
    }

    // Load the shared prototype settings document from Firestore.
    try {
      const settingsRef = doc(db, "settings", "app");
      const snapshot = await getDoc(settingsRef);

      if (snapshot.exists()) {
        const firebaseSettings = {
          ...DEFAULT_SETTINGS,
          ...snapshot.data(),
        };

        setSettings(firebaseSettings);
        localStorage.setItem(
          "mindcare_settings",
          JSON.stringify(firebaseSettings)
        );

        setSyncStatus("✓ Synced with Firebase");
      } else {
        // First run: migrate existing local settings/defaults to Firebase.
        await setDoc(settingsRef, localSettings);

        setSettings(localSettings);
        localStorage.setItem(
          "mindcare_settings",
          JSON.stringify(localSettings)
        );

        setSyncStatus("✓ Settings saved to Firebase");
      }
    } catch (error) {
      console.error("Error loading settings from Firebase:", error);
      setSyncStatus("⚠ Offline mode — using browser data");
    }
  };

  const updateSetting = async (key, value) => {
    const updated = {
      ...settings,
      [key]: value,
    };

    // Update UI and local cache immediately.
    setSettings(updated);
    localStorage.setItem(
      "mindcare_settings",
      JSON.stringify(updated)
    );

    // Persist the complete settings object in Firestore.
    try {
      await setDoc(doc(db, "settings", "app"), updated, {
        merge: true,
      });

      setSyncStatus("✓ Saved to Firebase");
    } catch (error) {
      console.error("Error saving setting to Firebase:", error);
      setSyncStatus("⚠ Saved locally — Firebase sync failed");
    }
  };

  const resetSettings = async () => {
    const confirmed = window.confirm(
      "Reset MindCare NER settings?"
    );

    if (!confirmed) return;

    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(
      "mindcare_settings",
      JSON.stringify(DEFAULT_SETTINGS)
    );

    try {
      await setDoc(
        doc(db, "settings", "app"),
        DEFAULT_SETTINGS
      );

      setSyncStatus("✓ Settings reset in Firebase");
    } catch (error) {
      console.error("Error resetting settings in Firebase:", error);
      setSyncStatus("⚠ Reset locally — Firebase sync failed");
    }
  };

  return (
    <div className="settings-page">

      <div className="page-header">
        <div>
          <h2>Settings ⚙️</h2>
          <p>
            Configure MindCare NER according to
            caregiver and patient needs.
          </p>
        </div>

        <div className="sync-status">
          {syncStatus}
        </div>
      </div>

      {/* GENERAL */}

      <section className="settings-section">

        <div className="settings-section-title">
          <span>🌐</span>
          <div>
            <h3>General Settings</h3>
            <p>Basic platform preferences</p>
          </div>
        </div>

        <div className="setting-row">

          <div>
            <strong>Preferred Language</strong>
            <p>
              Language used for the patient
              experience.
            </p>
          </div>

          <select
            value={settings.language}
            onChange={(e) =>
              updateSetting(
                "language",
                e.target.value
              )
            }
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Assamese</option>
            <option>Khasi</option>
            <option>Bengali</option>
            <option>Mizo</option>
          </select>

        </div>

      </section>

      {/* NOTIFICATIONS */}

      <section className="settings-section">

        <div className="settings-section-title">
          <span>🔔</span>
          <div>
            <h3>Notifications</h3>
            <p>Manage caregiver notifications</p>
          </div>
        </div>

        <SettingToggle
          title="Activity Notifications"
          description="Receive notifications when important activity changes are detected."
          enabled={settings.notifications}
          onChange={(value) =>
            updateSetting(
              "notifications",
              value
            )
          }
        />

      </section>

      {/* ACCESSIBILITY */}

      <section className="settings-section">

        <div className="settings-section-title">
          <span>♿</span>
          <div>
            <h3>Accessibility</h3>
            <p>Make the experience easier to use</p>
          </div>
        </div>

        <SettingToggle
          title="Voice Support"
          description="Enable text-to-speech assistance in the patient interface."
          enabled={settings.voiceSupport}
          onChange={(value) =>
            updateSetting(
              "voiceSupport",
              value
            )
          }
        />

        <SettingToggle
          title="Large Text"
          description="Use larger text across patient-facing interfaces."
          enabled={settings.largeText}
          onChange={(value) =>
            updateSetting(
              "largeText",
              value
            )
          }
        />

        <SettingToggle
          title="High Contrast"
          description="Increase visual contrast for better readability."
          enabled={settings.highContrast}
          onChange={(value) =>
            updateSetting(
              "highContrast",
              value
            )
          }
        />

      </section>

      {/* AI */}

      <section className="settings-section">

        <div className="settings-section-title">
          <span>🤖</span>
          <div>
            <h3>AI Personalization</h3>
            <p>
              Configure performance-based
              personalization.
            </p>
          </div>
        </div>

        <SettingToggle
          title="AI Personalization Engine"
          description="Use activity performance patterns to suggest suitable cognitive activities."
          enabled={settings.aiPersonalization}
          onChange={(value) =>
            updateSetting(
              "aiPersonalization",
              value
            )
          }
        />

        <div className="ai-info-box">

          <strong>
            How personalization works
          </strong>

          <p>
            MindCare NER analyzes activity
            performance and recent patterns to
            provide personalized suggestions.
            It does not diagnose dementia or
            replace professional medical advice.
          </p>

        </div>

      </section>

      {/* DATA */}

      <section className="settings-section">

        <div className="settings-section-title">
          <span>💾</span>
          <div>
            <h3>Local Data</h3>
            <p>
              Settings are synced with Firebase
              and cached in this browser.
            </p>
          </div>
        </div>

        <div className="data-actions">

          <button
            className="secondary-btn"
            onClick={() =>
              window.location.reload()
            }
          >
            ↻ Refresh Data
          </button>

          <button
            className="danger-btn"
            onClick={resetSettings}
          >
            Reset Settings
          </button>

        </div>

      </section>

      <div className="settings-disclaimer">
        <span>ℹ️</span>
        <p>
          This is a project prototype. Settings
          are stored in Firebase and cached locally
          for offline fallback.
        </p>
      </div>

    </div>
  );
}

function SettingToggle({
  title,
  description,
  enabled,
  onChange,
}) {
  return (
    <div className="setting-row">

      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <button
        className={`toggle ${
          enabled ? "active" : ""
        }`}
        onClick={() =>
          onChange(!enabled)
        }
        aria-label={title}
      >
        <span />
      </button>

    </div>
  );
}

export default Settings;
