# The Arena ⚡

An adversarial, real-time multilingual voice debate platform powered by Sarvam AI.

🌐 **Live Application**: [https://debatearena-dusky.vercel.app/](https://debatearena-dusky.vercel.app/)

Engage in rapid-fire dialectical debate across 11 Indian languages against specialized AI personas, featuring voice-to-voice interaction, real-time speech analytics, and judicial verdict adjudication.

---

## 🌟 Key Features

- **Adversarial Personas**:
  - **The Diplomat**: Measured, deceptively polite, surgical dismantling of core premises. (Voice: *Aditya*)
  - **The Skeptic**: Relentlessly empirical, attacks unproven assumptions and fallacies. (Voice: *Shubh*)
  - **The Rhetorician**: Eloquent, persuasive, masters analogies and reframing. (Voice: *Kabir*)
  - **The Provocateur**: Direct, high-tempo, exposes uncomfortable contradictions. (Voice: *Mohit*)

- **Multilingual Spoken Debates**:
  - Full native pipeline in **English (India), Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, and Odia**.
  - Natural speech synthesis powered by `bulbul:v3` with verified voice personas.

- **Audio Pipeline**:
  - Speech-to-Text via Saaras STT (`saaras:v2`).
  - Reasoning & Rebuttals via Sarvam-105B (`sarvam-105b`).
  - Text-to-Speech via Bulbul TTS (`bulbul:v3`).
  - Real-time audio waveform visualizer and reactive debate companion.

- **Judicial Scoring & Verdict**:
  - Authoritative 5-round disputation structure.
  - Impartial verdict breakdown with analytical rubrics (logical consistency, evidence, responsiveness, composure).

- **Bring Your Own Key (BYOK)**:
  - Zero server-side API key retention.
  - API keys are securely stored in the user's browser `localStorage` and sent directly via secure proxy headers.

---

## 🚀 Live Demo & Local Setup

### 🌐 Live Deployment
Experience The Arena live on Vercel:
👉 **[https://debatearena-dusky.vercel.app/](https://debatearena-dusky.vercel.app/)**

### 💻 Local Development

#### Prerequisites
- Node.js 18+ or 20+
- A Sarvam AI API Key (available from [Sarvam AI Dashboard](https://dashboard.sarvam.ai/))

#### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Sleepypanda767/debatearena.git
   cd debatearena
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [https://debatearena-dusky.vercel.app/](https://debatearena-dusky.vercel.app/) (or local dev at `http://localhost:3000`).
5. Click **API Key** in the top navigation bar to configure your personal Sarvam API key.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS with stance-reactive dynamic design system
- **AI Models**: Sarvam AI (Saaras STT, Sarvam-105B, Bulbul:v3 TTS)

---

## 📄 License

MIT
