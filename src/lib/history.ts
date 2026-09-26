import { Persona } from "./personas";
import { Language } from "./languages";

export interface DebateRoundRecord {
  round: number;
  userArgument: string;
  aiRebuttal: string;
}

export interface DebateVerdict {
  user_score: number;
  opponent_score: number;
  winner: "user" | "opponent" | "draw";
  user_strengths: string[];
  user_weaknesses: string[];
  verdict_summary: string;
}

export interface SavedDebateRecord {
  id: string;
  timestamp: number;
  dateStr: string;
  topic: string;
  userStance: "PRO" | "CON";
  language: Language;
  persona: Persona;
  rounds: DebateRoundRecord[];
  verdict: DebateVerdict;
}

const HISTORY_STORAGE_KEY = "the_arena_debate_history";

export function getSavedDebates(): SavedDebateRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load debate history:", err);
    return [];
  }
}

export function saveDebate(record: SavedDebateRecord): void {
  if (typeof window === "undefined") return;
  try {
    const current = getSavedDebates();
    // Prepend so newest is first
    const updated = [record, ...current.filter((d) => d.id !== record.id)];
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save debate record:", err);
  }
}

export function deleteDebate(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getSavedDebates();
    const updated = current.filter((d) => d.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to delete debate record:", err);
  }
}

export function clearAllDebates(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear debate history:", err);
  }
}
