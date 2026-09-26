"use client";

import React, { useState, useEffect } from "react";
import DragonCompanion from "@/components/DragonCompanion";
import TopicSelector from "@/components/TopicSelector";
import PersonaSelector from "@/components/PersonaSelector";
import DebateInterface from "@/components/DebateInterface";
import DebateSummary from "@/components/DebateSummary";
import DebateHistoryView from "@/components/DebateHistoryView";
import SettingsModal from "@/components/SettingsModal";
import { PERSONAS, Persona } from "@/lib/personas";
import { Language, DEFAULT_LANGUAGE, getSavedDefaultLanguage } from "@/lib/languages";
import { DebateRoundRecord, DebateVerdict, SavedDebateRecord, getSavedDebates, saveDebate } from "@/lib/history";
import { getSavedApiKey, saveApiKey } from "@/lib/sarvam";

export default function ArenaHomePage() {
  // App views: "landing" | "debating" | "summary" | "history"
  const [currentView, setCurrentView] = useState<"landing" | "debating" | "summary" | "history">("landing");

  // Configuration
  const [selectedTopic, setSelectedTopic] = useState<string>(
    "AI will do more good than harm for humanity"
  );
  const [userStance, setUserStance] = useState<"PRO" | "CON">("PRO");
  const [previewStance, setPreviewStance] = useState<"PRO" | "CON" | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS.skeptic);

  // BYOK API Key State & Settings
  const [apiKey, setApiKey] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);


  // Debate Results State
  const [debateRounds, setDebateRounds] = useState<DebateRoundRecord[]>([]);
  const [latestVerdict, setLatestVerdict] = useState<DebateVerdict | null>(null);

  // Chamber Debate History state
  const [savedDebates, setSavedDebates] = useState<SavedDebateRecord[]>([]);

  // Active theme calculation
  const activeStance = previewStance || userStance;

  // Apply data-stance attribute to <html> & <body> for global styling
  useEffect(() => {
    document.documentElement.setAttribute("data-stance", activeStance);
    document.body.setAttribute("data-stance", activeStance);
  }, [activeStance]);

  // Load API Key, Default Language, and Saved History on mount
  useEffect(() => {
    const saved = getSavedApiKey();
    if (saved) setApiKey(saved);

    const defaultLang = getSavedDefaultLanguage();
    setSelectedLanguage(defaultLang);

    setSavedDebates(getSavedDebates());
  }, []);

  const refreshDebateHistory = () => {
    setSavedDebates(getSavedDebates());
  };

  const handleStartDebate = () => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }
    setCurrentView("debating");
  };

  const handleKeySaved = (newKey: string) => {
    setApiKey(newKey);
    saveApiKey(newKey);
    if (currentView === "landing" && selectedTopic) {
      setCurrentView("debating");
    }
  };

  const handleDebateComplete = (rounds: DebateRoundRecord[], verdict: DebateVerdict) => {
    setDebateRounds(rounds);
    setLatestVerdict(verdict);

    // Save debate record to browser's localStorage
    const now = new Date();
    const dateFormatted = now.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newRecord: SavedDebateRecord = {
      id: `debate_${Date.now()}`,
      timestamp: Date.now(),
      dateStr: dateFormatted,
      topic: selectedTopic,
      userStance,
      language: selectedLanguage,
      persona: selectedPersona,
      rounds,
      verdict,
    };

    saveDebate(newRecord);
    refreshDebateHistory();
    setCurrentView("summary");
  };

  const handleRestart = () => {
    setDebateRounds([]);
    setLatestVerdict(null);
    setCurrentView("landing");
  };

  return (
    <div
      data-stance={activeStance}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        position: "relative",
        transition: "color 200ms ease",
      }}
    >
      {/* 1. Stately Floating Navigation Bar (Reachable from every screen) */}
      <header className="floating-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            onClick={() => setCurrentView("landing")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 800,
                fontFamily: "var(--font-sans)",
                boxShadow: "var(--shadow-pill)",
                transition: "background 250ms ease",
              }}
            >
              A
            </div>
            <div>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                THE ARENA
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1,
                  marginTop: 2,
                }}
              >
                Chamber for Spoken Disputation
              </span>
            </div>
          </div>
        </div>

        {/* Global Navigation Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => setCurrentView("landing")}
            className={currentView === "landing" ? "pill-badge" : "pill-btn-ghost"}
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            New Debate
          </button>

          <button
            type="button"
            onClick={() => {
              refreshDebateHistory();
              setCurrentView("history");
            }}
            className={currentView === "history" ? "pill-badge" : "pill-btn-ghost"}
            style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
          >
            <span>Archives</span>
            {savedDebates.length > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: currentView === "history" ? "#FFFFFF" : "var(--accent-tint)",
                  color: currentView === "history" ? "var(--accent-primary)" : "var(--accent-primary)",
                }}
              >
                {savedDebates.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="pill-btn-ghost"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            Settings
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="pill-badge"
            style={{ cursor: "pointer", border: "none" }}
          >
            {apiKey ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
                Sarvam &bull; Active
              </span>
            ) : (
              <span style={{ color: "#D97706", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D97706" }} />
                Set Key
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Chamber Container */}
      <main style={{ flex: 1, position: "relative" }}>
        {/* VIEW 1: ASYMMETRIC DOCKET & CHAMBER SELECTION */}
        {currentView === "landing" && (
          <div className="fade-in">
            {/* Ambient Free-Roaming & Cursor-Following Dragon Companion (Sits BEHIND interactive UI) */}
            <DragonCompanion mode="roaming" sizePx={210} />

            <div className="chamber-layout-grid">
              {/* LEFT COLUMN: Editorial Chamber Lead & Counsel Roster */}
              <div className="chamber-master-col" style={{ position: "relative" }}>
                <div style={{ position: "relative", zIndex: 10 }}>
                  <div style={{ marginBottom: 14 }}>
                    <span className="micro-label">CHAMBER PROTOCOL &bull; ORAL ADJUDICATION</span>
                  </div>

                  <h1 className="chamber-headline" style={{ marginBottom: 16 }}>
                    The Arena for{" "}
                    <span className="stance-accent-text">
                      unflinching oral dispute.
                    </span>
                  </h1>

                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.65,
                      color: "var(--text-secondary)",
                      marginBottom: 24,
                    }}
                  >
                    Select your proposition, language, and advocacy. Opposing AI counsel locks the
                    contrary doctrine and relentlessly attacks the weakest evidentiary link across five
                    spoken exchanges.
                  </p>

                  {/* Chamber Counsel Selection Roster */}
                  <div className="chamber-panel" style={{ marginBottom: 24 }}>
                    <PersonaSelector
                      selectedPersona={selectedPersona}
                      onSelectPersona={setSelectedPersona}
                    />
                  </div>

                  {/* Chamber Technical Details */}
                  <div
                    style={{
                      borderTop: "1px solid var(--border-medium)",
                      paddingTop: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div className="micro-label">CHAMBER ADJUDICATION RULES</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      &bull; Five spoken exchanges with strict turn-taking.
                      <br />
                      &bull; Verbatim transcription powered by Saaras v3 ({selectedLanguage.nativeName}).
                      <br />
                      &bull; Adversarial reasoning powered by Sarvam-105B.
                      <br />
                      &bull; Voice synthesis powered by Bulbul v3.
                      <br />
                      &bull; Impartial judicial evaluation and scoring after Round V.
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Official Docket, Multilingual Selection & Advocacy Selector */}
              <div className="chamber-docket-col" style={{ position: "relative", zIndex: 10 }}>
                <TopicSelector
                  selectedTopic={selectedTopic}
                  userStance={userStance}
                  selectedLanguage={selectedLanguage}
                  onSelectTopic={setSelectedTopic}
                  onSelectStance={setUserStance}
                  onSelectLanguage={setSelectedLanguage}
                  onPreviewStance={setPreviewStance}
                  onStartDebate={handleStartDebate}
                />
              </div>
            </div>

            {/* Bottom Marquee Strip */}
            <div className="marquee-container" style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 20 }}>
              <div className="marquee-content">
                {[
                  "Official Chamber Docket In Session",
                  "Multilingual Disputation: 11 Indian Languages + English",
                  "Five Strict Spoken Exchanges",
                  "Saaras v3 High-Accuracy Speech Transcription",
                  "Sarvam-105B Adversarial Dialectic Engine",
                  "Bulbul v3 Expressive Voice Output",
                  "Impartial Judicial Scoring & Transcript Archives",
                  "Official Chamber Docket In Session",
                  "Multilingual Disputation: 11 Indian Languages + English",
                  "Five Strict Spoken Exchanges",
                  "Saaras v3 High-Accuracy Speech Transcription",
                  "Sarvam-105B Adversarial Dialectic Engine",
                  "Bulbul v3 Expressive Voice Output",
                  "Impartial Judicial Scoring & Transcript Archives",
                ].map((item, idx) => (
                  <span key={idx} className="marquee-item">
                    <span style={{ color: "var(--accent-primary)" }}>&bull;</span> {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ACTIVE DEBATE (5-Round Voice Loop) */}
        {currentView === "debating" && (
          <DebateInterface
            topic={selectedTopic}
            userStance={userStance}
            persona={selectedPersona}
            language={selectedLanguage}
            apiKey={apiKey}
            onOpenKeyModal={() => setIsSettingsOpen(true)}
            onDebateComplete={handleDebateComplete}
            onExit={() => setCurrentView("landing")}
          />
        )}

        {/* VIEW 3: JUDICIAL VERDICT & SUMMARY (Post Round 5) */}
        {currentView === "summary" && latestVerdict && (
          <DebateSummary
            topic={selectedTopic}
            userStance={userStance}
            persona={selectedPersona}
            language={selectedLanguage}
            rounds={debateRounds}
            verdict={latestVerdict}
            onRestart={handleRestart}
            onViewHistory={() => {
              refreshDebateHistory();
              setCurrentView("history");
            }}
          />
        )}

        {/* VIEW 4: CHAMBER ARCHIVES / DEBATE HISTORY */}
        {currentView === "history" && (
          <DebateHistoryView
            debates={savedDebates}
            onStartNewDebate={handleRestart}
            onRefresh={refreshDebateHistory}
          />
        )}
      </main>

      {/* Settings & Key Modal (Reachable from everywhere) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeySaved={handleKeySaved}
        onLanguageChanged={(newLang) => setSelectedLanguage(newLang)}
      />
    </div>
  );
}
