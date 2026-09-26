"use client";

import React, { useState, useEffect } from "react";
import { getSavedApiKey, saveApiKey, clearApiKey } from "@/lib/sarvam";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
  forceRequired?: boolean;
}

export default function ApiKeyModal({
  isOpen,
  onClose,
  onKeySaved,
  forceRequired = false,
}: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState("");
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existing = getSavedApiKey();
      setKeyInput(existing);
      setHasExistingKey(Boolean(existing));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    saveApiKey(keyInput.trim());
    setHasExistingKey(true);
    onKeySaved(keyInput.trim());
    onClose();
  };

  const handleClear = () => {
    clearApiKey();
    setKeyInput("");
    setHasExistingKey(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ marginBottom: 24 }}>
          <div className="pill-badge" style={{ marginBottom: 12 }}>
            CREDITS CONFIGURATION
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 8,
              letterSpacing: "-0.025em",
              color: "var(--text-primary)",
            }}
          >
            Sarvam API Configuration
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>
            This application runs on your personal Sarvam API credits. Your key is stored in your
            browser&apos;s <code style={{ color: "var(--accent-primary)", fontWeight: 600 }}>localStorage</code>{" "}
            only and is never logged or stored on any server.
          </p>
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)" }}>
            Need a key? Get one free at{" "}
            <a
              href="https://dashboard.sarvam.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--accent-primary)",
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              dashboard.sarvam.ai
            </a>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 28 }}>
            <label
              htmlFor="sarvam-key-input"
              className="micro-label"
              style={{ display: "block", marginBottom: 8 }}
            >
              API SUBSCRIPTION KEY
            </label>
            <input
              id="sarvam-key-input"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="e.g. 8a9b2c3d-..."
              style={{
                width: "100%",
                background: "#FAFAF8",
                border: "1px solid var(--border-medium)",
                borderRadius: 999,
                padding: "14px 22px",
                fontSize: 15,
                color: "var(--text-primary)",
                fontFamily: "inherit",
                outline: "none",
              }}
              autoFocus
              required
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 16,
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              {hasExistingKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="pill-btn-ghost"
                  style={{ color: "#E11D48", fontSize: 13, fontWeight: 600 }}
                >
                  Clear Key
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              {!forceRequired && (
                <button
                  type="button"
                  onClick={onClose}
                  className="pill-btn-secondary"
                  style={{ padding: "10px 22px", fontSize: 14 }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="pill-btn-primary"
                style={{ padding: "12px 26px", fontSize: 14 }}
              >
                Save & Continue
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
