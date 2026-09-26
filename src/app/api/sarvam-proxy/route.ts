import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Strict Bring-Your-Own-Key enforcement (ZERO fallback to server env)
    const apiKey =
      req.headers.get("x-sarvam-key") || req.headers.get("api-subscription-key");

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        {
          error:
            "No Sarvam API key provided. Please configure your personal Sarvam key in Settings (free at dashboard.sarvam.ai).",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing required 'endpoint' parameter." },
        { status: 400 }
      );
    }

    // 2. Route to appropriate Sarvam API
    if (endpoint === "speech-to-text") {
      // Saaras STT handles multipart/form-data
      const formData = await req.formData();

      const sarvamResponse = await fetch("https://api.sarvam.ai/speech-to-text", {
        method: "POST",
        headers: {
          "api-subscription-key": apiKey.trim(),
        },
        body: formData,
      });

      const data = await sarvamResponse.json();
      return NextResponse.json(data, { status: sarvamResponse.status });
    }

    if (endpoint === "chat/completions") {
      // Sarvam-105B Chat Completions
      const body = await req.json();

      const sarvamResponse = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": apiKey.trim(),
        },
        body: JSON.stringify(body),
      });

      const data = await sarvamResponse.json();
      return NextResponse.json(data, { status: sarvamResponse.status });
    }

    if (endpoint === "text-to-speech") {
      // Bulbul TTS
      const body = await req.json();

      const sarvamResponse = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": apiKey.trim(),
        },
        body: JSON.stringify(body),
      });

      const data = await sarvamResponse.json();
      return NextResponse.json(data, { status: sarvamResponse.status });
    }

    return NextResponse.json(
      { error: `Unknown endpoint '${endpoint}'. Supported: speech-to-text, chat/completions, text-to-speech.` },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Sarvam proxy error:", error);
    const message = error instanceof Error ? error.message : "Proxy request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
