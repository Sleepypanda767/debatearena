"use client";

import React from "react";
import { Language, SUPPORTED_LANGUAGES } from "@/lib/languages";

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  disabled?: boolean;
}

export default function LanguageSelector({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div className="micro-label">DEBATE LANGUAGE • SARVAM MULTILINGUAL ENGINE</div>
        <span
          className="pill-badge"
          style={{ fontSize: 11, padding: "2px 10px", fontWeight: 700 }}
        >
          {selectedLanguage.nativeName} ({selectedLanguage.name})
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 8,
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage.code === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              disabled={disabled}
              onClick={() => onSelectLanguage(lang)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "8px 12px",
                borderRadius: 8,
                background: isSelected ? "var(--bg-surface)" : "rgba(255, 255, 255, 0.7)",
                border: isSelected
                  ? "2px solid var(--accent-primary)"
                  : "1px solid var(--border-medium)",
                cursor: disabled ? "not-allowed" : "pointer",
                boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                transition: "all 150ms ease",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: isSelected ? "var(--accent-primary)" : "var(--text-primary)",
                  }}
                >
                  {lang.nativeName}
                </span>
                {isSelected && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "var(--accent-primary)",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginTop: 2,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {lang.name.replace(" (India)", "")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
