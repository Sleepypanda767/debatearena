"use client";

import React, { useState } from "react";
import { SavedDebateRecord, deleteDebate, clearAllDebates } from "@/lib/history";
import DebateSummary from "./DebateSummary";

interface DebateHistoryViewProps {
  debates: SavedDebateRecord[];
  onStartNewDebate: () => void;
  onRefresh: () => void;
}

export default function DebateHistoryView({
  debates,
  onStartNewDebate,
  onRefresh,
}: DebateHistoryViewProps) {
  const [selectedDebate, setSelectedDebate] = useState<SavedDebateRecord | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDebate(id);
    onRefresh();
    if (selectedDebate?.id === id) {
      setSelectedDebate(null);
    }
  };

  const handleClearAll = () => {
    if (confirm("Clear all recorded chamber disputations from local history?")) {
      clearAllDebates();
      onRefresh();
      setSelectedDebate(null);
    }
  };

  // If viewing a single debate's full transcript & verdict
  if (selectedDebate) {
    return (
      <div className="fade-in">
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "16px 20px 0 20px" }}>
          <button
            type="button"
            onClick={() => setSelectedDebate(null)}
            className="pill-btn-ghost"
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            &larr; Back to Chamber Archives
          </button>
        </div>
        <DebateSummary
          topic={selectedDebate.topic}
          userStance={selectedDebate.userStance}
          persona={selectedDebate.persona}
          language={selectedDebate.language}
          rounds={selectedDebate.rounds}
          verdict={selectedDebate.verdict}
          onRestart={onStartNewDebate}
          onViewHistory={() => setSelectedDebate(null)}
        />
      </div>
    );
  }

  return (
    <div
      className="fade-in"
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "32px 20px 80px 20px",
      }}
    >
      {/* Chamber Archives Header */}
      <div
        className="product-card"
        style={{
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div className="micro-label" style={{ marginBottom: 6 }}>
            CHAMBER ARCHIVES &bull; LOCAL RECORD
          </div>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 28,
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            Recorded Disputations
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
            Historical record of your completed 5-exchange debates and verdicts stored in this browser.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={onStartNewDebate}
            className="pill-btn-primary"
            style={{ fontSize: 14, padding: "12px 24px" }}
          >
            + New Debate
          </button>
          {debates.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="pill-btn-ghost"
              style={{ fontSize: 13, color: "#E11D48" }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {debates.length === 0 ? (
        <div
          className="chamber-panel"
          style={{
            textAlign: "center",
            padding: "60px 24px",
            background: "rgba(255, 255, 255, 0.6)",
          }}
        >
          <div className="micro-label" style={{ marginBottom: 10 }}>
            CHAMBER ARCHIVES EMPTY
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 20,
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            No formal debates recorded yet.
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 440, margin: "0 auto 24px auto" }}>
            Complete a 5-exchange disputation in any of Sarvam&apos;s supported languages to receive an impartial judicial verdict and archive your transcript.
          </p>
          <button
            type="button"
            onClick={onStartNewDebate}
            className="pill-btn-primary"
            style={{ padding: "14px 32px" }}
          >
            Open Floor for First Debate &rarr;
          </button>
        </div>
      ) : (
        /* Debates List */
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {debates.map((d) => {
            const isUserWinner = d.verdict.winner === "user";
            const isOpponentWinner = d.verdict.winner === "opponent";

            return (
              <div
                key={d.id}
                onClick={() => setSelectedDebate(d)}
                className="chamber-panel"
                style={{
                  cursor: "pointer",
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                  borderLeft: isUserWinner
                    ? "4px solid #16A34A"
                    : "4px solid var(--accent-primary)",
                  transition: "transform 150ms ease, box-shadow 150ms ease",
                }}
              >
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span className="pill-badge neutral" style={{ fontSize: 11, padding: "2px 8px" }}>
                      {d.dateStr}
                    </span>
                    <span className="pill-badge neutral" style={{ fontSize: 11, padding: "2px 8px" }}>
                      {d.language.nativeName} ({d.language.name.replace(" (India)", "")})
                    </span>
                    <span
                      className="pill-badge"
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        backgroundColor: isUserWinner ? "rgba(22, 163, 74, 0.1)" : "var(--accent-tint)",
                        color: isUserWinner ? "#16A34A" : "var(--accent-primary)",
                      }}
                    >
                      {isUserWinner && "WINNER: YOU"}
                      {isOpponentWinner && `WINNER: ${d.persona.name.toUpperCase()}`}
                      {d.verdict.winner === "draw" && "DRAW"}
                    </span>
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 4,
                    }}
                  >
                    &ldquo;{d.topic}&rdquo;
                  </div>

                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Advocacy: <strong>{d.userStance}</strong> &bull; Opponent:{" "}
                    <strong>{d.persona.name}</strong> &bull; Score:{" "}
                    <strong>
                      {d.verdict.user_score} - {d.verdict.opponent_score}
                    </strong>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    className="pill-btn-secondary"
                    style={{ fontSize: 12, padding: "8px 16px" }}
                  >
                    Inspect Verdict &rarr;
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(d.id, e)}
                    className="pill-btn-ghost"
                    style={{ fontSize: 12, color: "#E11D48", padding: "8px" }}
                    title="Delete record"
                  >
                    &times;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
