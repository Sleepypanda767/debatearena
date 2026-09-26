"use client";

import React, { useEffect, useRef } from "react";
import { audioManager, AudioAnalysis } from "@/lib/audioManager";

export type EntityState = "idle" | "listening" | "thinking" | "speaking";

interface ReactiveChamberEntityProps {
  state: EntityState;
  sizePx?: number;
}

export default function ReactiveChamberEntity({
  state = "idle",
  sizePx = 130,
}: ReactiveChamberEntityProps) {
  const coreRef = useRef<HTMLDivElement | null>(null);
  const auraRef = useRef<HTMLDivElement | null>(null);
  const ring1Ref = useRef<HTMLDivElement | null>(null);
  const ring2Ref = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Smooth lerped animation parameters
  const visualRef = useRef({
    scale: 1.0,
    targetScale: 1.0,
    rotation: 0,
    rotSpeed: 12,
    auraScale: 1.0,
    auraOpacity: 0.35,
    pulseTime: 0,
    smoothedAmp: 0,
  });

  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // 1. Query REAL audio data from existing audioManager pipeline
      let liveAmp = 0;
      try {
        const analysis: AudioAnalysis = audioManager.getLiveStateAnalysis(state);
        liveAmp = analysis.amplitude;
      } catch {
        liveAmp = 0;
      }

      const vs = visualRef.current;
      vs.pulseTime += dt;
      vs.smoothedAmp += (liveAmp - vs.smoothedAmp) * Math.min(22 * dt, 1.0);

      // 2. Map real state signals to Siri/Gemini fluid morph & glow
      if (state === "idle") {
        // Calm ambient breathing orb
        const breath = Math.sin(vs.pulseTime * 2.2);
        vs.targetScale = 1.0 + breath * 0.04;
        vs.auraScale = 1.05 + breath * 0.05;
        vs.auraOpacity = 0.32 + breath * 0.06;
        vs.rotSpeed = 14;
      } else if (state === "listening") {
        // Swells and radiates in real time to microphone amplitude
        const amp = vs.smoothedAmp;
        vs.targetScale = 1.02 + amp * 0.45;
        vs.auraScale = 1.1 + amp * 0.75;
        vs.auraOpacity = Math.min(0.4 + amp * 0.9, 0.85);
        vs.rotSpeed = 22 + amp * 40;
      } else if (state === "thinking") {
        // Contained, tighter core with rapid shimmering rotational morph
        const irregular = Math.sin(vs.pulseTime * 7.5) * 0.04 + Math.cos(vs.pulseTime * 12.0) * 0.02;
        vs.targetScale = 0.86 + irregular;
        vs.auraScale = 0.92 + irregular * 0.5;
        vs.auraOpacity = 0.65;
        vs.rotSpeed = 75; // Fast processing rotation
      } else if (state === "speaking") {
        // Modulated dynamically by Bulbul AI speech playback amplitude
        const amp = vs.smoothedAmp;
        vs.targetScale = 1.0 + amp * 0.42;
        vs.auraScale = 1.12 + amp * 0.65;
        vs.auraOpacity = Math.min(0.42 + amp * 0.75, 0.82);
        vs.rotSpeed = 26 + amp * 32;
      }

      // Smooth interpolation
      const lerpSpeed = state === "listening" || state === "speaking" ? 18 * dt : 6 * dt;
      vs.scale += (vs.targetScale - vs.scale) * Math.min(lerpSpeed, 1.0);
      vs.auraScale += (vs.auraScale - vs.auraScale) * Math.min(lerpSpeed, 1.0);
      vs.rotation += vs.rotSpeed * dt;

      // Apply transforms
      if (coreRef.current) {
        coreRef.current.style.transform = `scale(${vs.scale.toFixed(3)}) rotate(${vs.rotation.toFixed(1)}deg)`;
      }

      if (auraRef.current) {
        auraRef.current.style.transform = `scale(${vs.auraScale.toFixed(3)}) rotate(${(-vs.rotation * 0.6).toFixed(1)}deg)`;
        auraRef.current.style.opacity = vs.auraOpacity.toFixed(3);
      }

      if (ring1Ref.current) {
        const ringScale = vs.scale * (1.18 + (state === "listening" ? vs.smoothedAmp * 0.5 : 0));
        ring1Ref.current.style.transform = `scale(${ringScale.toFixed(3)}) rotate(${(vs.rotation * 0.5).toFixed(1)}deg)`;
        ring1Ref.current.style.opacity = (state === "listening" || state === "speaking" ? (0.3 + vs.smoothedAmp * 0.5).toFixed(2) : "0.15");
      }

      if (ring2Ref.current) {
        const ring2Scale = vs.scale * (1.38 + (state === "listening" ? vs.smoothedAmp * 0.8 : 0));
        ring2Ref.current.style.transform = `scale(${ring2Scale.toFixed(3)}) rotate(${(-vs.rotation * 0.4).toFixed(1)}deg)`;
        ring2Ref.current.style.opacity = (state === "listening" || state === "speaking" ? (0.2 + vs.smoothedAmp * 0.4).toFixed(2) : "0.08");
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state]);

  const coreSize = sizePx;

  return (
    <div
      style={{
        position: "relative",
        width: coreSize * 1.6,
        height: coreSize * 1.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        pointerEvents: "none",
        margin: "0 auto",
      }}
      aria-label="Reactive Chamber Voice Indicator"
    >
      {/* Outer Soundwave / Resonance Rings (radiate on speech/mic) */}
      <div
        ref={ring2Ref}
        style={{
          position: "absolute",
          width: coreSize * 1.45,
          height: coreSize * 1.45,
          borderRadius: "50%",
          border: "1.5px dashed var(--accent-primary)",
          opacity: 0.08,
          willChange: "transform, opacity",
          transition: "border-color 300ms ease",
        }}
      />
      <div
        ref={ring1Ref}
        style={{
          position: "absolute",
          width: coreSize * 1.25,
          height: coreSize * 1.25,
          borderRadius: "45% 55% 50% 50% / 55% 45% 55% 45%",
          border: "1.5px solid var(--accent-primary)",
          opacity: 0.15,
          willChange: "transform, opacity",
          transition: "border-color 300ms ease",
        }}
      />

      {/* Radiant Soft Glow Aura */}
      <div
        ref={auraRef}
        style={{
          position: "absolute",
          width: coreSize * 1.15,
          height: coreSize * 1.15,
          borderRadius: "50% 50% 45% 55% / 45% 55% 50% 50%",
          background: "var(--blob-gradient)",
          filter: "blur(28px)",
          opacity: 0.35,
          willChange: "transform, opacity",
          transition: "background 350ms ease",
        }}
      />

      {/* Central Fluid Siri/Gemini Morphing Core */}
      <div
        ref={coreRef}
        style={{
          position: "relative",
          width: coreSize,
          height: coreSize,
          borderRadius: "55% 45% 40% 60% / 60% 40% 60% 40%",
          background: "var(--blob-gradient)",
          boxShadow: "0 8px 32px -4px var(--accent-glow), inset 0 2px 8px rgba(255, 255, 255, 0.4)",
          willChange: "transform, border-radius",
          animation: "morphBlob 10s ease-in-out infinite alternate",
          transition: "background 350ms ease, box-shadow 350ms ease",
        }}
      />
    </div>
  );
}
