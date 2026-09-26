"use client";

import React from "react";
import { PERSONAS, Persona } from "@/lib/personas";

interface PersonaSelectorProps {
  selectedPersona: Persona;
  onSelectPersona: (persona: Persona) => void;
  disabled?: boolean;
}

export default function PersonaSelector({
  selectedPersona,
  onSelectPersona,
  disabled = false,
}: PersonaSelectorProps) {
  const personaList = Object.values(PERSONAS);

  return (
    <div style={{ marginTop: 24 }}>
      <div className="micro-label" style={{ marginBottom: 12 }}>
        OPPOSING COUNSEL • SELECT ADVOCATE
      </div>

      {/* Architectural Counsel Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
        }}
      >
        {personaList.map((p) => {
          const isSelected = selectedPersona.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPersona(p)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "12px 14px",
                borderRadius: 8,
                background: isSelected ? "var(--bg-surface)" : "rgba(255, 255, 255, 0.75)",
                color: "var(--text-primary)",
                border: isSelected
                  ? "2px solid var(--accent-primary)"
                  : "1px solid var(--border-medium)",
                cursor: disabled ? "not-allowed" : "pointer",
                boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                transition: "all 180ms cubic-bezier(0.16, 1, 0.3, 1)",
                opacity: disabled ? 0.45 : 1,
                textAlign: "left",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    color: isSelected ? "var(--accent-primary)" : "var(--text-primary)",
                  }}
                >
                  {p.name}
                </span>
                {isSelected && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: "var(--accent-primary)",
                      boxShadow: "0 0 8px var(--accent-primary)",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  lineHeight: 1.35,
                }}
              >
                {p.tagline}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
