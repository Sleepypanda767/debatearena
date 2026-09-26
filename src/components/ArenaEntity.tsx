"use client";

import React, { useEffect, useRef, useState } from "react";
import { audioManager, AudioAnalysis } from "@/lib/audioManager";

export type EntityState = "idle" | "listening" | "thinking" | "speaking";
export type MascotGesture = "idle" | "speaking-neutral" | "point" | "explain" | "weigh" | "shrug" | "emphatic";

interface ArenaEntityProps {
  mode?: "roaming" | "fixed";
  state?: EntityState;
  onStateChange?: (newState: EntityState) => void;
  sizePx?: number;
  showTestControls?: boolean;
}

export default function ArenaEntity({
  mode = "fixed",
  state = "idle",
  sizePx = 170,
  showTestControls = false,
}: ArenaEntityProps) {
  // SVG element references for direct 60fps transform manipulation
  const headRef = useRef<SVGGElement | null>(null);
  const leftArmRef = useRef<SVGGElement | null>(null);
  const rightArmRef = useRef<SVGGElement | null>(null);
  const mouthRef = useRef<SVGPathElement | null>(null);
  const closedEyesRef = useRef<SVGGElement | null>(null);
  const openEyesRef = useRef<SVGGElement | null>(null);
  const openPupilsRef = useRef<SVGGElement | null>(null);
  const sproutStemRef = useRef<SVGPathElement | null>(null);
  const sproutBudRef = useRef<SVGGElement | null>(null);
  const shadowRef = useRef<SVGEllipseElement | null>(null);
  const bodyRef = useRef<SVGGElement | null>(null);

  // Roaming wrapper element reference
  const roamingContainerRef = useRef<HTMLDivElement | null>(null);

  const animFrameRef = useRef<number | null>(null);

  // Gesture timing & peak detection for Speaking state
  const gestureStateRef = useRef<{
    currentGesture: MascotGesture;
    lastGestureTime: number;
    lastGestureIdx: number;
    cooldownMs: number;
  }>({
    currentGesture: "idle",
    lastGestureTime: 0,
    lastGestureIdx: 0,
    cooldownMs: 700,
  });

  // Blink timing
  const blinkStateRef = useRef<{
    nextBlinkTime: number;
    isBlinking: boolean;
    blinkStartTime: number;
    blinkDuration: number;
  }>({
    nextBlinkTime: 2500,
    isBlinking: false,
    blinkStartTime: 0,
    blinkDuration: 130,
  });

  // Mouse & organic wandering tracking for Roaming mode
  const mouseRef = useRef<{
    x: number;
    y: number;
    lastMoveTime: number;
  }>({
    x: 300,
    y: 350,
    lastMoveTime: Date.now(),
  });

  const roamingPosRef = useRef<{
    x: number;
    y: number;
    facing: number;
    tilt: number;
  }>({
    x: 240,
    y: 280,
    facing: 1,
    tilt: 0,
  });

  // Smooth lerp coordinates for creature rigging
  const currentTransformsRef = useRef({
    headAngle: 0,
    headY: 0,
    leftArmAngle: 8,
    leftArmX: 0,
    leftArmY: 0,
    rightArmAngle: -8,
    rightArmX: 0,
    rightArmY: 0,
    bodyScaleY: 1.0,
    bodyScaleX: 1.0,
    shadowRx: 36,
    sproutAngle: 0,
    blinkScaleY: 1.0,
    mouthAmp: 0,
    smoothedAmp: 0,
  });

  // Mousemove listener for roaming mode
  useEffect(() => {
    if (mode !== "roaming") return;

    // Initial center seed
    if (typeof window !== "undefined") {
      mouseRef.current.x = window.innerWidth * 0.38;
      mouseRef.current.y = window.innerHeight * 0.45;
      roamingPosRef.current.x = window.innerWidth * 0.35;
      roamingPosRef.current.y = window.innerHeight * 0.42;
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.lastMoveTime = Date.now();
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [mode]);

  // Main 60fps animation & physics loop
  useEffect(() => {
    let lastTime = performance.now();
    let elapsed = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt;

      const ct = currentTransformsRef.current;
      const gs = gestureStateRef.current;
      const bs = blinkStateRef.current;

      // ==========================================
      // 1. ROAMING MODE (Setup / Landing screen)
      // ==========================================
      if (mode === "roaming") {
        const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
        const winH = typeof window !== "undefined" ? window.innerHeight : 900;
        const nowMs = Date.now();
        const timeSinceMouse = nowMs - mouseRef.current.lastMoveTime;

        let targetX = mouseRef.current.x;
        let targetY = mouseRef.current.y;

        // If mouse is idle for > 1.8s: engage in gentle organic wandering
        if (timeSinceMouse > 1800) {
          const wanderTime = elapsed * 0.4;
          const centerX = winW * 0.42;
          const centerY = winH * 0.45;
          targetX = centerX + Math.sin(wanderTime * 0.8) * (winW * 0.28) + Math.cos(wanderTime * 1.5) * 80;
          targetY = centerY + Math.cos(wanderTime * 0.6) * (winH * 0.22) + Math.sin(wanderTime * 1.2) * 50;
        }

        // Clamp target within comfortable screen margins so it never goes off-screen
        targetX = Math.max(60, Math.min(winW - 180, targetX));
        targetY = Math.max(60, Math.min(winH - 180, targetY));

        // Smooth spring/lerp position follow toward cursor/wander target
        const rPos = roamingPosRef.current;
        const dx = targetX - (rPos.x + 80);
        const dy = targetY - (rPos.y + 80);

        rPos.x += dx * 0.055;
        rPos.y += dy * 0.055;

        // Turn facing direction smoothly toward direction of movement
        if (dx > 4) rPos.facing = 1;
        else if (dx < -4) rPos.facing = -1;

        // Slight banking tilt in movement direction
        const targetTilt = Math.max(-10, Math.min(10, dx * 0.07));
        rPos.tilt += (targetTilt - rPos.tilt) * Math.min(8 * dt, 1.0);

        // Gentle ambient hover-bob
        const hoverBob = Math.sin(elapsed * 2.8) * 7.5;

        // Apply roaming transform to outer container
        if (roamingContainerRef.current) {
          roamingContainerRef.current.style.transform = `translate3d(${rPos.x.toFixed(1)}px, ${(rPos.y + hoverBob).toFixed(1)}px, 0) rotate(${rPos.tilt.toFixed(1)}deg) scaleX(${rPos.facing})`;
        }

        // Roaming creature pose: gentle happy idle animation
        const breath = Math.sin(elapsed * 2.4);
        ct.bodyScaleY = 1.0 + breath * 0.03;
        ct.bodyScaleX = 1.0 - breath * 0.02;
        ct.shadowRx = 36 + breath * 2.5;

        ct.headAngle = Math.sin(elapsed * 1.6) * 2.5;
        ct.headY = Math.sin(elapsed * 2.4) * 1.8;

        ct.leftArmAngle = 10 + Math.sin(elapsed * 1.8) * 4;
        ct.rightArmAngle = -10 - Math.sin(elapsed * 1.8) * 4;

        ct.sproutAngle = Math.sin(elapsed * 3.2) * 5 + rPos.tilt * -0.5;

        // Closed happy eyes in roaming mode
        if (closedEyesRef.current) closedEyesRef.current.style.opacity = "1";
        if (openEyesRef.current) openEyesRef.current.style.opacity = "0";
      }

      // ==========================================
      // 2. FIXED / REACTIVE MODE (Active debate)
      // ==========================================
      else {
        // Read real Web Audio API amplitude
        let liveAmp = 0;
        try {
          const analysis: AudioAnalysis = audioManager.getLiveStateAnalysis(state);
          liveAmp = analysis.amplitude;
        } catch {
          liveAmp = 0;
        }

        ct.smoothedAmp += (liveAmp - ct.smoothedAmp) * Math.min(22 * dt, 1.0);

        let targetHeadAngle = 0;
        let targetHeadY = 0;
        let targetLeftArmAngle = 8;
        let targetLeftArmX = 0;
        let targetLeftArmY = 0;
        let targetRightArmAngle = -8;
        let targetRightArmX = 0;
        let targetRightArmY = 0;
        let targetBodyScaleY = 1.0;
        let targetBodyScaleX = 1.0;
        let targetShadowRx = 36;
        let targetSproutAngle = 0;
        let targetMouthAmp = 0;

        if (state === "idle") {
          // Fixed Idle: Gentle breathing, calm ambient loop
          const breath = Math.sin(elapsed * 2.2);
          targetBodyScaleY = 1.0 + breath * 0.025;
          targetBodyScaleX = 1.0 - breath * 0.015;
          targetShadowRx = 36 + breath * 2.0;

          targetHeadAngle = Math.sin(elapsed * 1.4) * 2.0;
          targetHeadY = Math.sin(elapsed * 2.2) * 1.4;

          targetLeftArmAngle = 8 + Math.sin(elapsed * 1.4) * 3;
          targetRightArmAngle = -8 - Math.sin(elapsed * 1.4) * 3;
          targetSproutAngle = Math.sin(elapsed * 2.8) * 3;

          // Happy closed eyes
          if (closedEyesRef.current) closedEyesRef.current.style.opacity = "1";
          if (openEyesRef.current) openEyesRef.current.style.opacity = "0";
        } else if (state === "listening") {
          // Fixed Listening: Eyes open curious, head tilts forward, body & sprout bounce with live mic volume
          const micAmp = ct.smoothedAmp;

          targetHeadAngle = 3.2;
          targetHeadY = -2 - micAmp * 14;

          targetBodyScaleY = 1.02 + micAmp * 0.12;
          targetBodyScaleX = 0.99 - micAmp * 0.06;
          targetShadowRx = 34 - micAmp * 6;

          targetLeftArmAngle = 18 + micAmp * 10;
          targetRightArmAngle = -18 - micAmp * 10;
          targetSproutAngle = -6 + micAmp * 18;

          // Open alert eyes
          if (closedEyesRef.current) closedEyesRef.current.style.opacity = "0";
          if (openEyesRef.current) openEyesRef.current.style.opacity = "1";
        } else if (state === "thinking") {
          // Fixed Thinking: Eyes look up-right, right paw raises to chubby cheek in thought, faster subtle fidget
          const fidget = Math.sin(elapsed * 5.2) * 1.6;

          targetHeadAngle = -6.5 + fidget;
          targetHeadY = -2.5 + Math.cos(elapsed * 4.0) * 1.0;

          targetBodyScaleY = 0.98 + Math.sin(elapsed * 4.0) * 0.015;
          targetBodyScaleX = 1.01;

          // Left arm rests on tummy
          targetLeftArmAngle = 24;

          // Right arm folds up to cheek in pensive pose
          targetRightArmAngle = -108;
          targetRightArmX = -2;
          targetRightArmY = -5;

          targetSproutAngle = 12 + Math.sin(elapsed * 6.0) * 6;

          // Open eyes looking up and to the right
          if (closedEyesRef.current) closedEyesRef.current.style.opacity = "0";
          if (openEyesRef.current) openEyesRef.current.style.opacity = "1";
          if (openPupilsRef.current) {
            openPupilsRef.current.setAttribute("transform", "translate(2.8, -3.2)");
          }
        } else if (state === "speaking") {
          // Fixed Speaking: Peak-triggered rhetorical arm gestures timed to Bulbul speech audio
          const speechAmp = ct.smoothedAmp;
          targetMouthAmp = speechAmp;

          targetHeadY = Math.sin(elapsed * 8.0) * 1.8 - speechAmp * 2.5;
          targetHeadAngle = Math.sin(elapsed * 4.5) * 2.2;
          targetSproutAngle = Math.sin(elapsed * 7.0) * 8;

          // Peak Detection for Rhetorical Debate Gestures
          const GESTURES: MascotGesture[] = ["point", "explain", "weigh", "shrug", "emphatic"];
          if (liveAmp > 0.14 && now - gs.lastGestureTime > gs.cooldownMs) {
            gs.lastGestureTime = now;
            const nextIdx = (gs.lastGestureIdx + 1 + Math.floor(Math.random() * (GESTURES.length - 1))) % GESTURES.length;
            gs.lastGestureIdx = nextIdx;
            gs.currentGesture = GESTURES[nextIdx];
            gs.cooldownMs = 680 + Math.random() * 200;
          } else if (now - gs.lastGestureTime > 620 && gs.currentGesture !== "speaking-neutral") {
            gs.currentGesture = "speaking-neutral";
          }

          // Apply arm poses per active gesture
          switch (gs.currentGesture) {
            case "point":
              // Small emphatic point forward
              targetRightArmAngle = -65;
              targetRightArmX = 2;
              targetRightArmY = -2;
              targetLeftArmAngle = 12;
              targetHeadAngle = 3.5;
              break;

            case "explain":
              // Open-arm reasoned exposition
              targetLeftArmAngle = 38;
              targetRightArmAngle = -38;
              targetHeadY = 2;
              break;

            case "weigh":
              // Weighing arguments like scales
              const weighPhase = Math.sin(elapsed * 6.5);
              targetLeftArmAngle = -18 + weighPhase * 14;
              targetRightArmAngle = 20 - weighPhase * 14;
              targetHeadAngle = -3.0;
              break;

            case "shrug":
              // Cute rhetorical shrug
              targetLeftArmAngle = 46;
              targetLeftArmY = -3;
              targetRightArmAngle = -46;
              targetRightArmY = -3;
              targetHeadY = -3;
              break;

            case "emphatic":
              // Double paw downward thesis assertion
              targetLeftArmAngle = -15;
              targetLeftArmY = 3;
              targetRightArmAngle = 15;
              targetRightArmY = 3;
              targetHeadY = 3;
              break;

            case "speaking-neutral":
            default:
              targetLeftArmAngle = 8 + Math.sin(elapsed * 6.0) * 8;
              targetRightArmAngle = -8 - Math.cos(elapsed * 6.0) * 8;
              break;
          }

          if (closedEyesRef.current) closedEyesRef.current.style.opacity = "1";
          if (openEyesRef.current) openEyesRef.current.style.opacity = "0";
        }

        // Smooth Lerp
        const lerpSpeed = state === "speaking" || state === "listening" ? 16 * dt : 7 * dt;
        ct.headAngle += (targetHeadAngle - ct.headAngle) * Math.min(lerpSpeed, 1.0);
        ct.headY += (targetHeadY - ct.headY) * Math.min(lerpSpeed, 1.0);
        ct.leftArmAngle += (targetLeftArmAngle - ct.leftArmAngle) * Math.min(lerpSpeed, 1.0);
        ct.leftArmX += (targetLeftArmX - ct.leftArmX) * Math.min(lerpSpeed, 1.0);
        ct.leftArmY += (targetLeftArmY - ct.leftArmY) * Math.min(lerpSpeed, 1.0);
        ct.rightArmAngle += (targetRightArmAngle - ct.rightArmAngle) * Math.min(lerpSpeed, 1.0);
        ct.rightArmX += (targetRightArmX - ct.rightArmX) * Math.min(lerpSpeed, 1.0);
        ct.rightArmY += (targetRightArmY - ct.rightArmY) * Math.min(lerpSpeed, 1.0);
        ct.bodyScaleY += (targetBodyScaleY - ct.bodyScaleY) * Math.min(lerpSpeed, 1.0);
        ct.bodyScaleX += (targetBodyScaleX - ct.bodyScaleX) * Math.min(lerpSpeed, 1.0);
        ct.shadowRx += (targetShadowRx - ct.shadowRx) * Math.min(lerpSpeed, 1.0);
        ct.sproutAngle += (targetSproutAngle - ct.sproutAngle) * Math.min(18 * dt, 1.0);
        ct.mouthAmp += (targetMouthAmp - ct.mouthAmp) * Math.min(22 * dt, 1.0);
      }

      // --- BLINK LOGIC ---
      if (!bs.isBlinking && now > bs.nextBlinkTime) {
        bs.isBlinking = true;
        bs.blinkStartTime = now;
        bs.blinkDuration = 120 + Math.random() * 40;
      }

      if (bs.isBlinking) {
        const blinkProgress = (now - bs.blinkStartTime) / bs.blinkDuration;
        if (blinkProgress >= 1.0) {
          bs.isBlinking = false;
          ct.blinkScaleY = 1.0;
          bs.nextBlinkTime = now + 3200 + Math.random() * 3200;
        } else {
          ct.blinkScaleY = Math.max(0.1, Math.sin(blinkProgress * Math.PI * 2 + Math.PI / 2) * 0.5 + 0.5);
        }
      } else {
        ct.blinkScaleY = 1.0;
      }

      // --- APPLY DIRECT DOM TRANSFORMS ---
      if (headRef.current) {
        headRef.current.setAttribute(
          "transform",
          `translate(0, ${ct.headY.toFixed(2)}) rotate(${ct.headAngle.toFixed(2)})`
        );
      }

      if (leftArmRef.current) {
        leftArmRef.current.setAttribute(
          "transform",
          `translate(${ct.leftArmX.toFixed(2)}, ${ct.leftArmY.toFixed(2)}) rotate(${ct.leftArmAngle.toFixed(2)})`
        );
      }

      if (rightArmRef.current) {
        rightArmRef.current.setAttribute(
          "transform",
          `translate(${ct.rightArmX.toFixed(2)}, ${ct.rightArmY.toFixed(2)}) rotate(${ct.rightArmAngle.toFixed(2)})`
        );
      }

      if (bodyRef.current) {
        bodyRef.current.setAttribute(
          "transform",
          `scale(${ct.bodyScaleX.toFixed(3)}, ${ct.bodyScaleY.toFixed(3)})`
        );
      }

      if (shadowRef.current) {
        shadowRef.current.setAttribute("rx", ct.shadowRx.toFixed(1));
      }

      if (sproutBudRef.current) {
        sproutBudRef.current.setAttribute(
          "transform",
          `translate(6, -65) rotate(${ct.sproutAngle.toFixed(2)})`
        );
      }

      if (closedEyesRef.current) {
        closedEyesRef.current.setAttribute(
          "transform",
          `scale(1, ${ct.blinkScaleY.toFixed(3)})`
        );
      }

      // Dynamic mouth shape
      if (mouthRef.current) {
        if (mode === "fixed" && state === "speaking") {
          const openH = 2.5 + ct.mouthAmp * 11;
          const openW = 4.5 + ct.mouthAmp * 2.0;
          mouthRef.current.setAttribute(
            "d",
            `M ${(-openW).toFixed(1)},-12 Q 0,${(-12 + openH).toFixed(1)} ${openW.toFixed(1)},-12 Q 0,-13 ${(-openW).toFixed(1)},-12 Z`
          );
          mouthRef.current.setAttribute("fill", "#2B2738");
          mouthRef.current.setAttribute("stroke", "none");
        } else if (mode === "fixed" && state === "listening") {
          mouthRef.current.setAttribute(
            "d",
            "M -2.5,-10 C -2.5,-8 2.5,-8 2.5,-10 C 2.5,-12 -2.5,-12 -2.5,-10 Z"
          );
          mouthRef.current.setAttribute("fill", "#2B2738");
          mouthRef.current.setAttribute("stroke", "none");
        } else if (mode === "fixed" && state === "thinking") {
          mouthRef.current.setAttribute("d", "M -3.5,-9 Q 0,-11 3.5,-10");
          mouthRef.current.setAttribute("fill", "none");
          mouthRef.current.setAttribute("stroke", "#2B2738");
          mouthRef.current.setAttribute("stroke-width", "2");
        } else {
          // Sweet gentle smile
          mouthRef.current.setAttribute("d", "M -4.5,-11 Q 0,-8 4.5,-11");
          mouthRef.current.setAttribute("fill", "none");
          mouthRef.current.setAttribute("stroke", "#2B2738");
          mouthRef.current.setAttribute("stroke-width", "2");
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mode, state]);

  // Scaled dimensions
  const mascotWidth = mode === "roaming" ? 145 : Math.min(Math.max(sizePx, 150), 220);
  const mascotHeight = Math.round(mascotWidth * 1.06);

  // SVG Artwork of the Chibi Creature
  const creatureSvg = (
    <svg
      viewBox="-80 -95 160 170"
      width={mascotWidth}
      height={mascotHeight}
      style={{
        overflow: "visible",
        filter: "drop-shadow(0 8px 18px rgba(22, 21, 26, 0.07))",
      }}
      aria-label="The Arena Chibi Companion Mascot"
    >
      <defs>
        {/* Soft porcelain cream vinyl body gradient */}
        <radialGradient id="chibiBodyGrad" cx="38%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#FAF8F2" />
          <stop offset="100%" stopColor="#EDE7D9" />
        </radialGradient>

        {/* Limb shading */}
        <linearGradient id="chibiLimbGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FAF8F2" />
          <stop offset="100%" stopColor="#DFD8C8" />
        </linearGradient>
      </defs>

      {/* FLOOR CONTACT SHADOW */}
      <ellipse
        ref={shadowRef}
        cx="0"
        cy="60"
        rx="36"
        ry="6.5"
        fill="rgba(22, 21, 26, 0.08)"
      />

      {/* ROOT CREATURE */}
      <g id="chibi-root">
        {/* STUBBY FEET */}
        <ellipse cx="-13" cy="50" rx="7.5" ry="4.5" fill="#E4DDCF" />
        <ellipse cx="13" cy="50" rx="7.5" ry="4.5" fill="#E4DDCF" />

        {/* CHUBBY SOFT BODY (Round, seamless seal/bear cub chibi shape) */}
        <g ref={bodyRef} id="chibi-body">
          <path
            d="M -34,-12 C -42,-40 -32,-65 0,-65 C 32,-65 42,-40 34,-12 C 40,16 32,52 0,52 C -32,52 -40,16 -34,-12 Z"
            fill="url(#chibiBodyGrad)"
            stroke="rgba(22, 21, 26, 0.05)"
            strokeWidth="1"
          />

          {/* Chubby tummy patch */}
          <ellipse cx="0" cy="18" rx="20" ry="22" fill="#FFFFFF" opacity="0.65" />

          {/* Stance-Themed Bandana / Collar Ribbon (Recolors with PRO/CON) */}
          <path
            d="M -15,1 C -7,7 7,7 15,1 C 8,6 -8,6 -15,1 Z"
            fill="var(--accent-primary)"
            style={{ transition: "fill 300ms ease" }}
          />
          <circle cx="0" cy="4" r="2.4" fill="#FBBF24" />
        </g>

        {/* LEFT STUBBY ARM (Shoulder at -22, 4) */}
        <g transform="translate(-22, 4)">
          <g ref={leftArmRef} id="chibi-arm-left">
            <path
              d="M 0,0 C -6,4 -10,12 -8,18 C -6,22 0,20 3,15 C 5,10 4,4 0,0 Z"
              fill="url(#chibiLimbGrad)"
              stroke="rgba(22, 21, 26, 0.05)"
              strokeWidth="0.8"
            />
          </g>
        </g>

        {/* RIGHT STUBBY ARM (Shoulder at 22, 4) */}
        <g transform="translate(22, 4)">
          <g ref={rightArmRef} id="chibi-arm-right">
            <path
              d="M 0,0 C 6,4 10,12 8,18 C 6,22 0,20 -3,15 C -5,10 -4,4 0,0 Z"
              fill="url(#chibiLimbGrad)"
              stroke="rgba(22, 21, 26, 0.05)"
              strokeWidth="0.8"
            />
          </g>
        </g>

        {/* HEAD & EXPRESSIVE FACE */}
        <g ref={headRef} id="chibi-head">
          {/* STUBBY SOFT EARS */}
          <g id="chibi-ears">
            <ellipse cx="-26" cy="-52" rx="8" ry="7" fill="#F0ECE1" />
            <ellipse cx="-26" cy="-52" rx="4.5" ry="3.5" fill="#FFC8D6" opacity="0.65" />
            <ellipse cx="26" cy="-52" rx="8" ry="7" fill="#F0ECE1" />
            <ellipse cx="26" cy="-52" rx="4.5" ry="3.5" fill="#FFC8D6" opacity="0.65" />
          </g>

          {/* THE ACCENT FEATURE: STANCE-THEMED HEAD SPROUT (Recolors Blue for PRO, Red for CON) */}
          <g ref={sproutBudRef} id="chibi-accent-sprout">
            {/* Sprout stem */}
            <path
              ref={sproutStemRef}
              d="M 0,0 C 1,-7 4,-12 8,-15"
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth="2.2"
              strokeLinecap="round"
              style={{ transition: "stroke 300ms ease" }}
            />
            {/* Primary leaf bud */}
            <path
              d="M 8,-15 C 14,-18 18,-14 15,-8 C 12,-7 8,-11 8,-15 Z"
              fill="var(--accent-primary)"
              style={{ transition: "fill 300ms ease" }}
            />
            {/* Secondary tiny petal */}
            <path
              d="M 6,-12 C 2,-17 3,-21 7,-20 C 8,-16 6,-13 6,-12 Z"
              fill="var(--accent-primary)"
              opacity="0.8"
              style={{ transition: "fill 300ms ease" }}
            />
          </g>

          {/* SOFT ROSY BLUSH PADS */}
          <ellipse cx="-22" cy="-14" rx="5.5" ry="3.2" fill="#FF9EAA" opacity="0.45" />
          <ellipse cx="22" cy="-14" rx="5.5" ry="3.2" fill="#FF9EAA" opacity="0.45" />

          {/* DEFAULT CLOSED HAPPY EYES (^ _ ^) */}
          <g ref={closedEyesRef} id="chibi-closed-eyes">
            <path
              d="M -18,-20 Q -12,-26 -6,-20"
              fill="none"
              stroke="#2B2738"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M 6,-20 Q 12,-26 18,-20"
              fill="none"
              stroke="#2B2738"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>

          {/* OPEN CURIOUS BEAD EYES (Used during Listening / Thinking) */}
          <g ref={openEyesRef} id="chibi-open-eyes" style={{ opacity: 0 }}>
            <g ref={openPupilsRef}>
              <ellipse cx="-12" cy="-21" rx="4.8" ry="6.2" fill="#2B2738" />
              <circle cx="-13.5" cy="-23" r="1.6" fill="#FFFFFF" />
              <circle cx="-10.5" cy="-19.5" r="0.8" fill="#FFFFFF" />

              <ellipse cx="12" cy="-21" rx="4.8" ry="6.2" fill="#2B2738" />
              <circle cx="10.5" cy="-23" r="1.6" fill="#FFFFFF" />
              <circle cx="13.5" cy="-19.5" r="0.8" fill="#FFFFFF" />
            </g>
          </g>

          {/* SMALL SWEET MOUTH */}
          <path
            ref={mouthRef}
            d="M -4.5,-11 Q 0,-8 4.5,-11"
            fill="none"
            stroke="#2B2738"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );

  // =========================================================================
  // RENDER: ROAMING MODE (Background layer on setup/landing screen)
  // =========================================================================
  if (mode === "roaming") {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 1, // Sits safely BEHIND all interactive panels
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        <div
          ref={roamingContainerRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: mascotWidth,
            height: mascotHeight,
            pointerEvents: "none",
            willChange: "transform",
          }}
        >
          {creatureSvg}
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: FIXED MODE (Active Debate Chamber screen — no text labels/buttons)
  // =========================================================================
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: "6px 0 10px 0",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: mascotWidth,
          height: mascotHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {creatureSvg}
      </div>
    </div>
  );
}
