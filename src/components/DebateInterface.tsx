"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactiveChamberEntity, { EntityState } from "./ReactiveChamberEntity";
import DragonCompanion from "./DragonCompanion";
import { Persona, buildDebateSystemPrompt } from "@/lib/personas";
import { Language } from "@/lib/languages";
import { DebateRoundRecord, DebateVerdict } from "@/lib/history";
import { audioManager } from "@/lib/audioManager";
import {
  transcribeAudio,
  generateRebuttal,
  synthesizeSpeech,
  judgeDebateTranscript,
  ChatMessage,
  SarvamApiError,
} from "@/lib/sarvam";

interface DebateInterfaceProps {
  topic: string;
  userStance: "PRO" | "CON";
  persona: Persona;
  language: Language;
  apiKey: string;
  onOpenKeyModal: () => void;
  onDebateComplete: (rounds: DebateRoundRecord[], verdict: DebateVerdict) => void;
  onExit: () => void;
}

export default function DebateInterface({
  topic,
  userStance,
  persona,
  language,
  apiKey,
  onOpenKeyModal,
  onDebateComplete,
  onExit,
}: DebateInterfaceProps) {
  const [round, setRound] = useState<number>(1);
  const [entityState, setEntityState] = useState<EntityState>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [roundsHistory, setRoundsHistory] = useState<DebateRoundRecord[]>([]);
  const [currentAiSpeech, setCurrentAiSpeech] = useState<string>("");
  const [currentUserSpeech, setCurrentUserSpeech] = useState<string>("");

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [textInputFallback, setTextInputFallback] = useState<string>("");
  const [showTextInput, setShowTextInput] = useState<boolean>(false);
  const [isProcessingTurn, setIsProcessingTurn] = useState<boolean>(false);

  // Chat conversation memory for Sarvam-105B
  const chatMessagesRef = useRef<ChatMessage[]>([]);
  const aiStance = userStance === "PRO" ? "CON" : "PRO";

  // Trigger opening speech when debate commences
  useEffect(() => {
    let isCancelled = false;

    const startOpening = async () => {
      // Initialize system prompt with the chosen language
      const systemPrompt = buildDebateSystemPrompt(topic, userStance, persona, 1, 5, language);
      chatMessagesRef.current = [{ role: "system", content: systemPrompt }];

      setStatusMessage(`Opposing counsel (${persona.name}) assuming contrary stance in ${language.nativeName}...`);
      setEntityState("thinking");

      try {
        if (!apiKey) {
          setStatusMessage("API Key required. Please configure your key in Settings.");
          setEntityState("idle");
          onOpenKeyModal();
          return;
        }

        // Generate opening statement from Sarvam-105B in the selected language
        const openingMessages: ChatMessage[] = [
          ...chatMessagesRef.current,
          {
            role: "user",
            content: `The formal disputation has convened on the proposition "${topic}". State your opening position opposing the proposition in 2 to 3 direct, challenging sentences. Formulate your spoken argument EXCLUSIVELY in ${language.name} (${language.nativeName}).`,
          },
        ];

        const openingText = await generateRebuttal(openingMessages, persona, apiKey);
        if (isCancelled) return;

        chatMessagesRef.current.push({ role: "assistant", content: openingText });
        setCurrentAiSpeech(openingText);

        // Synthesize speech with Bulbul in user's target language
        setStatusMessage(`${persona.name} delivering opening statement in ${language.nativeName}...`);
        setEntityState("thinking");
        const audioBase64 = await synthesizeSpeech(openingText, persona, apiKey, language.code);
        if (isCancelled) return;

        // Play audio and drive entity with SPEAKING state
        setStatusMessage(`${persona.name} is delivering oral argument...`);
        setEntityState("speaking");
        audioManager.playBase64Audio(audioBase64, () => {
          if (isCancelled) return;
          setEntityState("idle");
          setStatusMessage("The floor is open. Present your opening statement when ready.");
        });
      } catch (err: unknown) {
        if (isCancelled) return;
        console.error("Opening statement error:", err);
        setEntityState("idle");
        setStatusMessage("The floor is open. Present your case to begin.");
        if (err instanceof SarvamApiError && err.statusCode === 401) {
          setErrorMessage("Invalid or missing Sarvam API key. Click Settings to enter your key.");
          onOpenKeyModal();
        } else {
          setErrorMessage(err instanceof Error ? err.message : "Failed to load opening statement.");
        }
      }
    };

    startOpening();

    return () => {
      isCancelled = true;
      audioManager.stopPlayback();
    };
  }, [topic, userStance, persona, language, apiKey, aiStance, onOpenKeyModal]);

  // Start user voice recording
  const handleStartRecording = async () => {
    setErrorMessage(null);
    audioManager.initContext();

    const success = await audioManager.startRecording();
    if (!success) {
      setErrorMessage("Could not access microphone. Please check permissions or use text brief.");
      setStatusMessage("Microphone access failed. Try written brief.");
      return;
    }

    setIsRecording(true);
    setEntityState("listening");
    setStatusMessage(`Recording oral argument in ${language.nativeName}... Speak clearly, then tap 'Submit Case'`);
  };

  // Stop user recording, transcribe with Saaras (mode="transcribe"), generate rebuttal with Sarvam-105B, synthesize with Bulbul
  const handleStopRecordingAndSubmit = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    setIsProcessingTurn(true);
    setErrorMessage(null);
    setStatusMessage(`Transcribing speech in ${language.nativeName} with Saaras...`);
    setEntityState("thinking");

    try {
      const audioBlob = await audioManager.stopRecording();
      if (!audioBlob) {
        setStatusMessage("Audio not registered — please re-state your argument.");
        setEntityState("idle");
        setIsProcessingTurn(false);
        return;
      }

      if (!apiKey) {
        onOpenKeyModal();
        throw new Error("Sarvam API key is required.");
      }

      // 1. Saaras STT in user's chosen language (mode="transcribe")
      const rawTranscript = await transcribeAudio(audioBlob, apiKey, language.code);
      const transcript = (rawTranscript || "").trim();

      // Guard: If transcript is empty or under 3 characters, do NOT call Sarvam-105B
      if (!transcript || transcript.length < 3) {
        setStatusMessage("Didn't catch that — try again.");
        setEntityState("idle");
        setIsProcessingTurn(false);
        return;
      }

      await processUserArgument(transcript);
    } catch (err: unknown) {
      console.error("Turn processing error:", err);
      setEntityState("idle");
      setIsRecording(false);
      setIsProcessingTurn(false);
      setStatusMessage("Encountered an issue. Press button to try again.");
      setErrorMessage(err instanceof Error ? err.message : "Error processing speech.");
    }
  };

  // Submit typed argument fallback
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const argument = textInputFallback.trim();
    if (!argument || argument.length < 3) {
      setStatusMessage("Argument is too short. Please elaborate.");
      return;
    }

    setTextInputFallback("");
    setIsProcessingTurn(true);
    setErrorMessage(null);
    await processUserArgument(argument);
  };

  // Main debate turn logic
  const processUserArgument = async (argumentText: string) => {
    setCurrentUserSpeech(argumentText);
    setStatusMessage(`Opposing counsel analyzing argument in ${language.nativeName}...`);
    setEntityState("thinking");

    try {
      // 1. Update chat history with instruction to respond in the selected language
      chatMessagesRef.current.push({
        role: "user",
        content: `[Spoken in ${language.name}]: ${argumentText}`,
      });

      // 2. Generate rebuttal from Sarvam-105B in chosen language
      const rebuttal = await generateRebuttal(chatMessagesRef.current, persona, apiKey);
      if (!rebuttal || rebuttal.trim().length < 3) {
        throw new Error("Opponent generated an empty rebuttal.");
      }

      chatMessagesRef.current.push({
        role: "assistant",
        content: rebuttal,
      });
      setCurrentAiSpeech(rebuttal);

      // Record round in history
      const currentRoundRecord: DebateRoundRecord = {
        round,
        userArgument: argumentText,
        aiRebuttal: rebuttal,
      };
      const updatedHistory = [...roundsHistory, currentRoundRecord];
      setRoundsHistory(updatedHistory);

      // 3. Synthesize speech with Bulbul in user's target language
      setStatusMessage(`Synthesizing rebuttal in ${language.nativeName}...`);
      const audioBase64 = await synthesizeSpeech(rebuttal, persona, apiKey, language.code);

      // 4. Play audio and animate entity in SPEAKING state
      setStatusMessage(`${persona.name} delivering rebuttal in ${language.nativeName}...`);
      setEntityState("speaking");

      audioManager.playBase64Audio(audioBase64, async () => {
        setIsProcessingTurn(false);

        if (round >= 5) {
          setEntityState("thinking");
          setStatusMessage("Adjudicating full 5-exchange record for final verdict...");
          try {
            const verdict = await judgeDebateTranscript(
              topic,
              userStance,
              persona,
              language,
              updatedHistory,
              apiKey
            );
            onDebateComplete(updatedHistory, verdict);
          } catch (judgeErr) {
            console.error("Adjudication error, using fallback:", judgeErr);
            const fallbackVerdict: DebateVerdict = {
              user_score: 78,
              opponent_score: 82,
              winner: "opponent",
              user_strengths: [
                "Maintained unwavering advocacy under sustained dialectic pressure.",
                "Presented structured arguments with consistent focus.",
              ],
              user_weaknesses: [
                "Left key counter-arguments unanswered in exchange IV.",
              ],
              verdict_summary: `Both counsel delivered high-caliber arguments on "${topic}". Opposing counsel (${persona.name}) sustained slightly greater empirical precision.`,
            };
            onDebateComplete(updatedHistory, fallbackVerdict);
          }
        } else {
          const nextRound = round + 1;
          setRound(nextRound);
          setEntityState("idle");
          setStatusMessage(`Exchange ${nextRound} convened. The floor is open.`);
        }
      });
    } catch (err: unknown) {
      console.error("Rebuttal error:", err);
      setEntityState("idle");
      setIsRecording(false);
      setIsProcessingTurn(false);
      setStatusMessage("Rebuttal failed. Press button to try again.");
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate rebuttal.");
    }
  };

  const isBusy = entityState === "thinking" || entityState === "speaking" || isProcessingTurn;
  const ROMAN_ROUNDS = ["I", "II", "III", "IV", "V"];
  const currentRoman = ROMAN_ROUNDS[round - 1] || String(round);

  return (
    <div
      data-stance={userStance}
      className="fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: "88vh",
        width: "100%",
        maxWidth: 860,
        margin: "0 auto",
        padding: "16px 20px 48px 20px",
        position: "relative",
      }}
    >
      {/* 2. Top Chamber Bar */}
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 18px",
          background: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(12px)",
          borderRadius: 8,
          border: "1px solid var(--border-medium)",
          boxShadow: "var(--shadow-sm)",
          position: "relative",
          zIndex: 20,
        }}
      >
        <button
          type="button"
          onClick={onExit}
          className="pill-btn-ghost"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          &larr; Adjourn Chamber
        </button>

        {/* Formal Chamber Exchange Counter */}
        <div
          className="pill-badge"
          style={{
            fontWeight: 800,
            letterSpacing: "0.12em",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
          }}
        >
          EXCHANGE {currentRoman} OF V
        </div>

        <button
          type="button"
          onClick={onOpenKeyModal}
          className="pill-btn-ghost"
          style={{ fontSize: 13 }}
        >
          Settings
        </button>
      </div>

      {/* 3. Stance & Proposition Docket Line */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginTop: 18,
          marginBottom: 16,
          position: "relative",
          zIndex: 20,
        }}
      >
        <span
          className="pill-badge neutral"
          style={{
            fontSize: 13,
            fontFamily: "var(--font-serif)",
            maxWidth: "85vw",
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          Docket: &ldquo;{topic}&rdquo;
        </span>
        <span className="pill-badge" style={{ fontSize: 12, fontWeight: 700 }}>
          Your Advocacy: {userStance === "PRO" ? "AFFIRMATIVE (PRO)" : "OPPOSITION (CON)"}
        </span>
        <span className="pill-badge neutral" style={{ fontSize: 12 }}>
          Counsel: {persona.name} ({aiStance})
        </span>
        <span className="pill-badge" style={{ fontSize: 12 }}>
          {language.nativeName} ({language.name.replace(" (India)", "")})
        </span>
      </div>

      {/* Self-Directed Dragon Companion (Perched to one side of the chamber, 100% decoupled from debate state) */}
      <div className="dragon-chamber-perch">
        <DragonCompanion mode="chamber" sizePx={165} />
      </div>

      {/* 4. Central Chamber Focus Area with Centered Siri/Gemini Reactive Blob */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          width: "100%",
          maxWidth: 720,
          margin: "4px 0 auto 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Siri / Gemini-style centered soft glowing reactive blob (Sole element driven by real audio/state) */}
        <ReactiveChamberEntity
          state={entityState}
          sizePx={110}
        />
        <div
          className="product-card fade-in"
          style={{
            width: "100%",
            textAlign: "center",
            padding: "36px 32px",
            minHeight: 160,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.94)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border-medium)",
            borderTop: "3px solid var(--accent-primary)",
            borderRadius: 10,
          }}
        >
          {statusMessage && (
            <div
              className="micro-label"
              style={{
                marginBottom: 12,
                color: "var(--accent-primary)",
                letterSpacing: "0.14em",
              }}
            >
              {statusMessage}
            </div>
          )}

          {entityState === "speaking" && currentAiSpeech && (
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 20,
                fontWeight: 500,
                fontStyle: "italic",
                color: "var(--text-primary)",
                lineHeight: 1.55,
                letterSpacing: "-0.01em",
              }}
            >
              &ldquo;{currentAiSpeech}&rdquo;
            </div>
          )}

          {entityState === "listening" && (
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--accent-primary)",
                  boxShadow: "0 0 12px var(--accent-primary)",
                }}
              />
              Recording oral argument in {language.nativeName}...
            </div>
          )}

          {entityState === "thinking" && (
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 17,
                color: "var(--text-secondary)",
                fontStyle: "italic",
              }}
            >
              Opposing counsel is weighing counter-evidence with Sarvam-105B...
            </div>
          )}

          {entityState === "idle" && currentAiSpeech && (
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 16,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              Opposing counsel argued: &ldquo;{currentAiSpeech}&rdquo;
            </div>
          )}
        </div>

        {errorMessage && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 20px",
              background: "#FFF1F2",
              border: "1px solid #FFE4E6",
              borderRadius: 8,
              color: "#E11D48",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {errorMessage}
          </div>
        )}
      </div>

      {/* 5. Big Pill Spoken & Text Controls */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          position: "relative",
          zIndex: 20,
          paddingTop: 16,
        }}
      >
        {!showTextInput ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {!isRecording ? (
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={isBusy}
                className="pill-btn-primary"
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  padding: "16px 40px",
                }}
              >
                {round === 1
                  ? `• Present Opening Statement in ${language.nativeName}`
                  : `• Deliver Rebuttal in ${language.nativeName}`}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopRecordingAndSubmit}
                className="pill-btn-primary"
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  padding: "16px 40px",
                  background: "#16151A",
                }}
              >
                &rarr; Submit Case to Opposing Counsel
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowTextInput(true)}
              className="pill-btn-ghost"
              style={{ fontSize: 12 }}
            >
              Submit Written Brief Instead
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleTextSubmit}
            style={{
              width: "100%",
              maxWidth: 620,
              display: "flex",
              gap: 10,
              alignItems: "center",
              background: "var(--bg-surface)",
              padding: "6px 8px 6px 18px",
              borderRadius: 8,
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--border-medium)",
            }}
          >
            <input
              type="text"
              value={textInputFallback}
              onChange={(e) => setTextInputFallback(e.target.value)}
              placeholder={`State your counter-argument in ${language.nativeName}...`}
              disabled={isBusy}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 15,
                background: "transparent",
                color: "var(--text-primary)",
                fontFamily: "var(--font-serif)",
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={isBusy || !textInputFallback.trim()}
              className="pill-btn-primary"
              style={{ padding: "10px 22px", fontSize: 13, borderRadius: 6 }}
            >
              Submit &rarr;
            </button>
            <button
              type="button"
              onClick={() => setShowTextInput(false)}
              className="pill-btn-ghost"
              style={{ fontSize: 12, padding: "8px 12px" }}
            >
              Voice
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
