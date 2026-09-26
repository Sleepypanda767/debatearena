"use client";

import React from "react";
import { Persona } from "@/lib/personas";
import { Language } from "@/lib/languages";
import { DebateRoundRecord, DebateVerdict } from "@/lib/history";

interface DebateSummaryProps {
  topic: string;
  userStance: "PRO" | "CON";
  persona: Persona;
  language: Language;
  rounds: DebateRoundRecord[];
  verdict: DebateVerdict;
  onRestart: () => void;
  onViewHistory?: () => void;
}

const ROMAN_ROUNDS = ["I", "II", "III", "IV", "V"];

export default function DebateSummary({
  topic,
  userStance,
  persona,
  language,
  rounds,
  verdict,
  onRestart,
  onViewHistory,
}: DebateSummaryProps) {
  const isUserWinner = verdict.winner === "user";
  const isOpponentWinner = verdict.winner === "opponent";
  const isDraw = verdict.winner === "draw";

  const userRole = userStance === "PRO" ? "AFFIRMATIVE COUNSEL (YOU)" : "OPPOSITION COUNSEL (YOU)";
  const opponentRole = `${persona.name.toUpperCase()} (${userStance === "PRO" ? "CON" : "PRO"})`;

  return (
    <div
      data-stance={userStance}
      className="fade-in"
      style={{
        maxWidth: 860,
        width: "100%",
        margin: "0 auto",
        padding: "32px 20px 80px 20px",
      }}
    >
      {/* 1. Official Chamber Docket Banner */}
      <div
        className="product-card"
        style={{
          marginBottom: 28,
          background: "linear-gradient(135deg, var(--bg-surface) 0%, rgba(255, 255, 255, 0.95) 100%)",
          borderTop: "4px solid var(--accent-primary)",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <span className="pill-badge" style={{ fontWeight: 800 }}>
            OFFICIAL JUDICIAL VERDICT
          </span>
          <span className="pill-badge neutral">V EXCHANGES RECORDED</span>
          <span className="pill-badge neutral">
            {language.nativeName} ({language.name.replace(" (India)", "")})
          </span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(26px, 3.4vw, 36px)",
            fontWeight: 600,
            lineHeight: 1.25,
            marginBottom: 14,
            letterSpacing: "-0.02em",
          }}
        >
          &ldquo;{topic}&rdquo;
        </h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span className="pill-badge" style={{ fontSize: 13, fontWeight: 700 }}>
            Your Advocacy: {userStance === "PRO" ? "AFFIRMATIVE (PRO)" : "OPPOSITION (CON)"}
          </span>
          <span className="pill-badge neutral" style={{ fontSize: 13 }}>
            Opposing Counsel: {persona.name}
          </span>
        </div>
      </div>

      {/* 2. Official Verdict & Scoring Card */}
      <div
        className="chamber-panel"
        style={{
          marginBottom: 28,
          padding: "32px 28px",
          borderLeft: isUserWinner ? "5px solid #16A34A" : "5px solid var(--accent-primary)",
        }}
      >
        <div className="micro-label" style={{ marginBottom: 8 }}>
          DECISION OF THE BENCH
        </div>

        {/* Winner Callout */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(24px, 3vw, 32px)",
              fontWeight: 700,
              color: isUserWinner ? "#16A34A" : "var(--text-primary)",
            }}
          >
            {isUserWinner && "Verdict: Affirmative Counsel Prevails"}
            {isOpponentWinner && `Verdict: Opposing Counsel (${persona.name}) Prevails`}
            {isDraw && "Verdict: Disputation Concluded in a Draw"}
          </div>
        </div>

        {/* Scores Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 24,
            padding: "16px 20px",
            background: "rgba(22, 21, 26, 0.03)",
            borderRadius: 8,
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <div className="micro-label" style={{ marginBottom: 4 }}>
              {userRole}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  fontFamily: "var(--font-sans)",
                  color: isUserWinner ? "#16A34A" : "var(--accent-primary)",
                }}
              >
                {verdict.user_score}
              </span>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>/ 100</span>
            </div>
          </div>

          <div>
            <div className="micro-label" style={{ marginBottom: 4 }}>
              OPPOSING COUNSEL ({persona.name.toUpperCase()})
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  fontFamily: "var(--font-sans)",
                  color: isOpponentWinner ? "var(--accent-primary)" : "var(--text-primary)",
                }}
              >
                {verdict.opponent_score}
              </span>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>/ 100</span>
            </div>
          </div>
        </div>

        {/* Written Judicial Reasoning */}
        <div style={{ marginBottom: 24 }}>
          <div className="micro-label" style={{ marginBottom: 8, color: "var(--accent-primary)" }}>
            JUDICIAL OPINION &amp; RATIONALE
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 17,
              lineHeight: 1.75,
              color: "var(--text-primary)",
              fontStyle: "italic",
              background: "var(--bg-surface)",
              padding: "18px 20px",
              borderRadius: 8,
              border: "1px solid var(--border-subtle)",
            }}
          >
            &ldquo;{verdict.verdict_summary}&rdquo;
          </div>
        </div>

        {/* Key Strengths & Weaknesses */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {/* Strengths */}
          <div
            style={{
              padding: "16px 18px",
              background: "rgba(22, 163, 74, 0.05)",
              border: "1px solid rgba(22, 163, 74, 0.2)",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#16A34A",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 10,
                fontFamily: "var(--font-sans)",
              }}
            >
              ✓ DEMONSTRATED STRENGTHS
            </div>
            <ul style={{ paddingLeft: 18, margin: 0, color: "var(--text-primary)", fontSize: 14, lineHeight: 1.6 }}>
              {verdict.user_strengths.map((str, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {str}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div
            style={{
              padding: "16px 18px",
              background: "rgba(213, 63, 63, 0.05)",
              border: "1px solid rgba(213, 63, 63, 0.2)",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#D53F3F",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 10,
                fontFamily: "var(--font-sans)",
              }}
            >
              ✕ EXPOSED VULNERABILITIES
            </div>
            <ul style={{ paddingLeft: 18, margin: 0, color: "var(--text-primary)", fontSize: 14, lineHeight: 1.6 }}>
              {verdict.user_weaknesses.map((wk, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {wk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Full Transcript of the Five Exchanges */}
      <div style={{ marginBottom: 40 }}>
        <div className="micro-label" style={{ marginBottom: 16, textAlign: "center" }}>
          OFFICIAL RECORD OF THE FIVE SPOKEN EXCHANGES (I &ndash; V)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {rounds.map((r, idx) => {
            const roman = ROMAN_ROUNDS[idx] || String(r.round);
            return (
              <div
                key={r.round}
                className="chamber-panel"
                style={{
                  padding: "20px 24px",
                  borderLeft: "3px solid var(--accent-primary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <span className="pill-badge" style={{ fontSize: 11, fontWeight: 800 }}>
                    EXCHANGE {roman} OF V
                  </span>
                </div>

                {/* User Statement */}
                <div
                  style={{
                    marginBottom: 12,
                    paddingLeft: 12,
                    borderLeft: "2px solid rgba(22, 21, 26, 0.12)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    YOUR ARGUMENT ({userStance === "PRO" ? "AFFIRMATIVE" : "OPPOSITION"}):
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 16,
                      color: "var(--text-primary)",
                      fontStyle: "italic",
                      lineHeight: 1.55,
                    }}
                  >
                    &ldquo;{r.userArgument}&rdquo;
                  </div>
                </div>

                {/* Opponent Rebuttal */}
                <div style={{ paddingLeft: 12, borderLeft: "2px solid var(--accent-primary)" }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--accent-primary)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    OPPOSING COUNSEL ({persona.name.toUpperCase()}):
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 16,
                      color: "var(--text-primary)",
                      lineHeight: 1.6,
                    }}
                  >
                    {r.aiRebuttal}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Action Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 14,
          paddingTop: 8,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={onRestart}
          className="pill-btn-primary"
          style={{ fontSize: 16, padding: "16px 36px" }}
        >
          &larr; Convene New Disputation
        </button>

        {onViewHistory && (
          <button
            type="button"
            onClick={onViewHistory}
            className="pill-btn-secondary"
            style={{ fontSize: 15, padding: "14px 28px" }}
          >
            View Chamber Archives &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
