"use client";

import React, { useState, useEffect } from "react";
import { getSavedApiKey, saveApiKey, clearApiKey } from "@/lib/sarvam";
import { Language, SUPPORTED_LANGUAGES, getSavedDefaultLanguage, saveDefaultLanguage } from "@/lib/languages";
import { clearAllDebates } from "@/lib/history";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
  onLanguageChanged?: (lang: Language) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onKeySaved,
  onLanguageChanged,
}: SettingsModalProps) {
  const [keyInput, setKeyInput] = useState("");
  const [selectedLang, setSelectedLang] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      const existing = getSavedApiKey();
      setKeyInput(existing);
      setHasExistingKey(Boolean(existing));
      setSelectedLang(getSavedDefaultLanguage());
      setSaveSuccessMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    saveApiKey(keyInput.trim());
    saveDefaultLanguage(selectedLang.code);
    setHasExistingKey(true);
    onKeySaved(keyInput.trim());
    if (onLanguageChanged) onLanguageChanged(selectedLang);
    setSaveSuccessMsg("Preferences saved successfully.");
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleClear = () => {
    clearApiKey();
    setKeyInput("");
    setHasExistingKey(false);
  };

  const handleClearHistory = () => {
    if (confirm("Clear all recorded debate history from this browser?")) {
      clearAllDebates();
      setSaveSuccessMsg("Chamber history cleared.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div className="pill-badge" style={{ marginBottom: 10 }}>
            CHAMBER PREFERENCES &bull; SETTINGS
          </div>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 24,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Chamber Configuration
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Configure your personal Sarvam AI API credentials and default debate language. All settings are stored strictly in your browser&apos;s <code style={{ color: "var(--accent-primary)", fontWeight: 600 }}>localStorage</code>.
          </p>
        </div>

        <form onSubmit={handleSave}>
          {/* Section 1: Sarvam API Key */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <label htmlFor="settings-key-input" className="micro-label">
                SARVAM API SUBSCRIPTION KEY
              </label>
              <a
                href="https://dashboard.sarvam.ai"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: "var(--accent-primary)",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Get Free Key &rarr;
              </a>
            </div>

            <input
              id="settings-key-input"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="e.g. 8a9b2c3d-..."
              style={{
                width: "100%",
                background: "#FAFAF8",
                border: "1px solid var(--border-medium)",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 14,
                color: "var(--text-primary)",
                fontFamily: "inherit",
                outline: "none",
              }}
              required
            />
          </div>

          {/* Section 2: Default Debate Language */}
          <div style={{ marginBottom: 22 }}>
            <label className="micro-label" style={{ display: "block", marginBottom: 8 }}>
              DEFAULT DEBATE LANGUAGE
            </label>

            <select
              value={selectedLang.code}
              onChange={(e) => {
                const found = SUPPORTED_LANGUAGES.find((l) => l.code === e.target.value);
                if (found) setSelectedLang(found);
              }}
              style={{
                width: "100%",
                background: "#FAFAF8",
                border: "1px solid var(--border-medium)",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 14,
                color: "var(--text-primary)",
                fontFamily: "inherit",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          {/* Section 3: Data Management */}
          <div
            style={{
              padding: "12px 14px",
              background: "rgba(22, 21, 26, 0.03)",
              borderRadius: 8,
              border: "1px solid var(--border-subtle)",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                Local Debate Archives
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Clear cached transcripts and verdicts
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearHistory}
              className="pill-btn-ghost"
              style={{ fontSize: 12, color: "#E11D48", padding: "4px 10px" }}
            >
              Clear Archives
            </button>
          </div>

          {saveSuccessMsg && (
            <div
              style={{
                marginBottom: 16,
                padding: "8px 14px",
                background: "rgba(22, 163, 74, 0.1)",
                color: "#16A34A",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {saveSuccessMsg}
            </div>
          )}

          {/* Action Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 14,
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              {hasExistingKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="pill-btn-ghost"
                  style={{ color: "#E11D48", fontSize: 12, fontWeight: 600 }}
                >
                  Clear Key
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                className="pill-btn-secondary"
                style={{ padding: "10px 20px", fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="pill-btn-primary"
                style={{ padding: "10px 24px", fontSize: 13 }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
