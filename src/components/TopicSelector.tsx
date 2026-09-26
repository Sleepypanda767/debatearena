"use client";

import React, { useState } from "react";
import { CURATED_TOPICS } from "@/lib/topics";
import { Language } from "@/lib/languages";
import LanguageSelector from "./LanguageSelector";

interface TopicSelectorProps {
  selectedTopic: string;
  userStance: "PRO" | "CON";
  selectedLanguage: Language;
  onSelectTopic: (topic: string) => void;
  onSelectStance: (stance: "PRO" | "CON") => void;
  onSelectLanguage: (lang: Language) => void;
  onPreviewStance?: (stance: "PRO" | "CON" | null) => void;
  onStartDebate: () => void;
  disabled?: boolean;
}

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export default function TopicSelector({
  selectedTopic,
  userStance,
  selectedLanguage,
  onSelectTopic,
  onSelectStance,
  onSelectLanguage,
  onPreviewStance,
  onStartDebate,
  disabled = false,
}: TopicSelectorProps) {
  const [customTopic, setCustomTopic] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) return;
    onSelectTopic(customTopic.trim());
  };

  const handleTopicClick = (title: string) => {
    onSelectTopic(title);
    setCustomTopic("");
  };

  return (
    <div style={{ width: "100%" }}>
      {/* 1. Multilingual Debate Selector (Sarvam Core Differentiator) */}
      <div className="chamber-panel" style={{ marginBottom: 24, padding: "20px 22px" }}>
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onSelectLanguage={onSelectLanguage}
          disabled={disabled}
        />
      </div>

      {/* 2. Stance Selection: Advocacy Role with Live Hover/Click Theme Preview */}
      <div style={{ marginBottom: 28 }}>
        <div className="micro-label" style={{ marginBottom: 10 }}>
          ADVOCACY ROLE &bull; COUNSEL ASSUMES CONTRARY POSITION
        </div>

        <div className="stance-toggle-container">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onSelectStance("PRO");
              if (onPreviewStance) onPreviewStance(null);
            }}
            onMouseEnter={() => {
              if (onPreviewStance) onPreviewStance("PRO");
            }}
            onMouseLeave={() => {
              if (onPreviewStance) onPreviewStance(null);
            }}
            className={`stance-toggle-btn ${userStance === "PRO" ? "active" : ""}`}
            style={{
              background: userStance === "PRO" ? "var(--accent-primary)" : "transparent",
              color: userStance === "PRO" ? "#FFFFFF" : "var(--text-secondary)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: userStance === "PRO" ? "#FFFFFF" : "#5B3DF5",
              }}
            />
            PRO — AFFIRMATIVE
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onSelectStance("CON");
              if (onPreviewStance) onPreviewStance(null);
            }}
            onMouseEnter={() => {
              if (onPreviewStance) onPreviewStance("CON");
            }}
            onMouseLeave={() => {
              if (onPreviewStance) onPreviewStance(null);
            }}
            className={`stance-toggle-btn ${userStance === "CON" ? "active" : ""}`}
            style={{
              background: userStance === "CON" ? "var(--accent-primary)" : "transparent",
              color: userStance === "CON" ? "#FFFFFF" : "var(--text-secondary)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: userStance === "CON" ? "#FFFFFF" : "#D53F3F",
              }}
            />
            CON — OPPOSITION
          </button>
        </div>
      </div>

      {/* 3. Custom Proposition Submission (Chamber Panel with Minimal Corners) */}
      <div className="chamber-panel" style={{ marginBottom: 28 }}>
        <form onSubmit={handleCustomSubmit}>
          <div className="micro-label" style={{ marginBottom: 8 }}>
            SUBMIT ORIGINAL PROPOSITION FOR DISPUTATION
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => {
                setCustomTopic(e.target.value);
                if (e.target.value) onSelectTopic(e.target.value);
              }}
              placeholder={`e.g. Artificial general intelligence should be developed under open public scrutiny...`}
              style={{
                flex: 1,
                border: "1px solid var(--border-medium)",
                borderRadius: 8,
                padding: "12px 18px",
                fontSize: 15,
                background: "#FAFAF8",
                color: "var(--text-primary)",
                fontFamily: "var(--font-serif)",
                outline: "none",
                transition: "border-color 150ms ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent-primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-medium)")}
              disabled={disabled}
            />
            {customTopic.trim() && (
              <button
                type="button"
                onClick={onStartDebate}
                className="pill-btn-primary"
                style={{ padding: "12px 24px", whiteSpace: "nowrap" }}
              >
                Enter Chamber &rarr;
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 4. The Official Case Index / Docket (Roman Numerals & Crisp Horizontal Rules) */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div className="micro-label">OFFICIAL DOCKET &bull; TEN SELECTED MATTERS</div>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
            Select matter to dispute
          </span>
        </div>

        {/* Structured Docket Table */}
        <div className="docket-table">
          {CURATED_TOPICS.map((topic, index) => {
            const isSelected = selectedTopic === topic.title;
            const roman = ROMAN_NUMERALS[index] || String(index + 1);

            return (
              <div
                key={topic.id}
                onClick={() => handleTopicClick(topic.title)}
                className={`docket-entry ${isSelected ? "active" : ""}`}
              >
                <div className="docket-roman">{roman}.</div>

                <div className="docket-title">&ldquo;{topic.title}&rdquo;</div>

                {isSelected ? (
                  <span
                    className="pill-badge"
                    style={{
                      fontSize: 11,
                      padding: "3px 10px",
                      whiteSpace: "nowrap",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                    }}
                  >
                    ON DOCKET
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                    }}
                  >
                    SELECT
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Chamber Adjudication Action Bar */}
      {selectedTopic && (
        <div
          className="chamber-panel"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: "linear-gradient(135deg, var(--bg-surface) 0%, rgba(255, 255, 255, 0.9) 100%)",
            borderLeft: "4px solid var(--accent-primary)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="micro-label">SELECTED PROPOSITION ON DOCKET</span>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1.4,
              }}
            >
              &ldquo;{selectedTopic}&rdquo;
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              Advocacy:{" "}
              <strong style={{ color: "var(--accent-primary)" }}>
                {userStance === "PRO" ? "AFFIRMATIVE (PRO)" : "OPPOSITION (CON)"}
              </strong>{" "}
              &bull; Language:{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {selectedLanguage.nativeName} ({selectedLanguage.name})
              </strong>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
            <button
              type="button"
              onClick={onStartDebate}
              disabled={disabled}
              className="pill-btn-primary"
              style={{
                fontSize: 16,
                fontWeight: 700,
                padding: "16px 40px",
              }}
            >
              Enter Chamber &amp; Present Case &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
