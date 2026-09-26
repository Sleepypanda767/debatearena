export interface Language {
  code: string;
  name: string;
  nativeName: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en-IN", name: "English (India)", nativeName: "English", region: "All India" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", region: "North/Central India" },
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা", region: "West Bengal & Tripura" },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்", region: "Tamil Nadu" },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు", region: "Andhra & Telangana" },
  { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", region: "Karnataka" },
  { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", region: "Kerala" },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी", region: "Maharashtra" },
  { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", region: "Gujarat" },
  { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", region: "Punjab" },
  { code: "od-IN", name: "Odia", nativeName: "ଓଡ଼ିଆ", region: "Odisha" },
];

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0]; // English (India)

const DEFAULT_LANG_STORAGE_KEY = "the_arena_default_language";

export function getSavedDefaultLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const savedCode = localStorage.getItem(DEFAULT_LANG_STORAGE_KEY);
    if (!savedCode) return DEFAULT_LANGUAGE;
    const match = SUPPORTED_LANGUAGES.find((l) => l.code === savedCode);
    return match || DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function saveDefaultLanguage(code: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEFAULT_LANG_STORAGE_KEY, code);
  } catch (e) {
    console.error("Failed to save default language:", e);
  }
}
