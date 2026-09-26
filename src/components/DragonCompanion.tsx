"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { DRAGON_ASSET } from "@/lib/dragonConfig";

export type DragonBehavior = "idle" | "napping" | "chasing" | "stretching" | "watching";

interface DragonCompanionProps {
  mode: "roaming" | "chamber";
  sizePx?: number;
}

export default function DragonCompanion({
  mode = "chamber",
  sizePx = 180,
}: DragonCompanionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Active behavior state for chamber mode (completely self-directed)
  const [currentBehavior, setCurrentBehavior] = useState<DragonBehavior>("idle");
  const [fireflyActive, setFireflyActive] = useState<boolean>(false);

  // Mouse & organic wander state for Roaming mode
  const mouseRef = useRef<{ x: number; y: number; lastMoveTime: number }>({
    x: 400,
    y: 350,
    lastMoveTime: Date.now(),
  });

  const roamingPosRef = useRef<{ x: number; y: number; facing: number; tilt: number }>({
    x: 240,
    y: 260,
    facing: 1,
    tilt: 0,
  });

  // Chamber behavior timers & animation state
  const chamberBehaviorRef = useRef<{
    active: DragonBehavior;
    behaviorStartTime: number;
    behaviorDuration: number;
    nextSwitchTime: number;
    flyX: number;
    flyY: number;
    flyVisible: boolean;
  }>({
    active: "idle",
    behaviorStartTime: Date.now(),
    behaviorDuration: 0,
    nextSwitchTime: Date.now() + 10000 + Math.random() * 8000,
    flyX: 0,
    flyY: 0,
    flyVisible: false,
  });

  // Mousemove listener for roaming mode
  useEffect(() => {
    if (mode !== "roaming") return;

    if (typeof window !== "undefined") {
      mouseRef.current.x = window.innerWidth * 0.45;
      mouseRef.current.y = window.innerHeight * 0.42;
      roamingPosRef.current.x = window.innerWidth * 0.4;
      roamingPosRef.current.y = window.innerHeight * 0.38;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.lastMoveTime = Date.now();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mode]);

  // Main 60fps animation loop
  useEffect(() => {
    let lastTime = performance.now();
    let elapsed = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt;

      // =====================================================================
      // 1. ROAMING MODE (Setup / Landing Screen)
      // =====================================================================
      if (mode === "roaming") {
        const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
        const winH = typeof window !== "undefined" ? window.innerHeight : 900;
        const nowMs = Date.now();
        const timeSinceMouse = nowMs - mouseRef.current.lastMoveTime;

        let targetX = mouseRef.current.x;
        let targetY = mouseRef.current.y;

        // If mouse has not moved for > 1.8s, engage in organic drifting
        if (timeSinceMouse > 1800) {
          const wanderTime = elapsed * 0.38;
          const centerX = winW * 0.46;
          const centerY = winH * 0.45;
          targetX = centerX + Math.sin(wanderTime * 0.75) * (winW * 0.28) + Math.cos(wanderTime * 1.4) * 70;
          targetY = centerY + Math.cos(wanderTime * 0.55) * (winH * 0.22) + Math.sin(wanderTime * 1.1) * 45;
        }

        // Clamp inside visible window boundaries
        targetX = Math.max(50, Math.min(winW - sizePx - 50, targetX));
        targetY = Math.max(50, Math.min(winH - sizePx - 50, targetY));

        const rPos = roamingPosRef.current;
        const dx = targetX - (rPos.x + sizePx / 2);
        const dy = targetY - (rPos.y + sizePx / 2);

        // Spring / Lerp position follow
        rPos.x += dx * 0.055;
        rPos.y += dy * 0.055;

        // Directional flip towards travel direction
        if (dx > 4) rPos.facing = 1;
        else if (dx < -4) rPos.facing = -1;

        // Banking tilt in travel direction
        const targetTilt = Math.max(-12, Math.min(12, dx * 0.08));
        rPos.tilt += (targetTilt - rPos.tilt) * Math.min(8 * dt, 1.0);

        // Subtle scale-pulse for wing-beat suggestion
        const wingBeat = 1.0 + Math.sin(elapsed * 7.0) * 0.032;
        const hoverBob = Math.sin(elapsed * 2.8) * 8.0;

        if (containerRef.current) {
          containerRef.current.style.transform = `translate3d(${rPos.x.toFixed(1)}px, ${(rPos.y + hoverBob).toFixed(1)}px, 0) rotate(${rPos.tilt.toFixed(1)}deg) scaleX(${rPos.facing}) scale(${wingBeat.toFixed(3)})`;
        }
      }

      // =====================================================================
      // 2. CHAMBER MODE (Fully self-directed randomized behavior pool)
      // =====================================================================
      else {
        const cb = chamberBehaviorRef.current;
        const nowMs = Date.now();

        // Check if current behavior finished its duration
        if (cb.active !== "idle" && nowMs - cb.behaviorStartTime > cb.behaviorDuration) {
          cb.active = "idle";
          cb.flyVisible = false;
          setCurrentBehavior("idle");
          setFireflyActive(false);
          // Set next random switch interval: 14 to 28 seconds
          cb.nextSwitchTime = nowMs + 14000 + Math.random() * 14000;
        }

        // Check if it's time to trigger a new random behavior from the pool
        if (cb.active === "idle" && nowMs > cb.nextSwitchTime) {
          const POOL: DragonBehavior[] = ["napping", "chasing", "stretching", "watching"];
          const chosen = POOL[Math.floor(Math.random() * POOL.length)];
          cb.active = chosen;
          cb.behaviorStartTime = nowMs;

          // Randomized duration per behavior
          if (chosen === "napping") {
            cb.behaviorDuration = 8000 + Math.random() * 4000; // ~8-12s
          } else if (chosen === "chasing") {
            cb.behaviorDuration = 6000 + Math.random() * 2000; // ~6-8s
            cb.flyVisible = true;
            setFireflyActive(true);
          } else if (chosen === "stretching") {
            cb.behaviorDuration = 3800; // ~3.8s
          } else if (chosen === "watching") {
            cb.behaviorDuration = 5500 + Math.random() * 2500; // ~5.5-8s
          }

          setCurrentBehavior(chosen);
        }

        // Compute animation transforms for active behavior
        let transformStr = "";

        if (cb.active === "napping") {
          // Settles down into curled resting pose with slow deep breathing
          const napBreath = Math.sin(elapsed * 1.6) * 0.03;
          transformStr = `translateY(10px) scale(${0.96 + napBreath}, ${0.92 - napBreath}) rotate(-3deg)`;
        } else if (cb.active === "chasing") {
          // Firefly moves in figure-8 loopy path
          const flyPhase = (nowMs - cb.behaviorStartTime) / 1000;
          cb.flyX = Math.sin(flyPhase * 3.2) * 55 + Math.cos(flyPhase * 1.6) * 20;
          cb.flyY = Math.cos(flyPhase * 2.8) * 35 - 35;

          // Dragon playfully follows and hops toward the firefly
          const hop = Math.abs(Math.sin(flyPhase * 5.0)) * 9;
          const tilt = Math.sin(flyPhase * 3.2) * 8;
          const facing = cb.flyX > 0 ? 1 : -1;
          transformStr = `translate(${cb.flyX * 0.3}px, ${(cb.flyY * 0.25 - hop).toFixed(1)}px) rotate(${tilt.toFixed(1)}deg) scaleX(${facing})`;
        } else if (cb.active === "stretching") {
          // Flourish: wing stretch -> little hop -> settle
          const progress = (nowMs - cb.behaviorStartTime) / cb.behaviorDuration;
          if (progress < 0.35) {
            // Stretch up
            const ease = progress / 0.35;
            transformStr = `translateY(${-12 * ease}px) scale(${1.0 + 0.08 * ease}, ${1.0 + 0.12 * ease}) rotate(${5 * ease}deg)`;
          } else if (progress < 0.7) {
            // Little hop
            const hopEase = (progress - 0.35) / 0.35;
            const hopY = Math.sin(hopEase * Math.PI) * 16;
            transformStr = `translateY(${-12 - hopY}px) scale(1.06, 1.08) rotate(${-3}deg)`;
          } else {
            // Settle back to ground with soft squash
            const settleEase = (progress - 0.7) / 0.3;
            transformStr = `translateY(${Math.sin(settleEase * Math.PI) * 4}px) scale(${1.0 + (1 - settleEase) * 0.04}, 1.0)`;
          }
        } else if (cb.active === "watching") {
          // Calm observing state with slow head-tilt side to side
          const watchTilt = Math.sin(elapsed * 1.4) * 6.5;
          const watchBob = Math.sin(elapsed * 2.2) * 3;
          transformStr = `translateY(${watchBob.toFixed(1)}px) rotate(${watchTilt.toFixed(1)}deg)`;
        } else {
          // Neutral Idle: gentle breathing & subtle floating bob
          const idleBreath = Math.sin(elapsed * 2.2) * 0.02;
          const idleBob = Math.sin(elapsed * 1.8) * 4.0;
          transformStr = `translateY(${idleBob.toFixed(1)}px) scale(${1.0 + idleBreath})`;
        }

        if (containerRef.current) {
          containerRef.current.style.transform = transformStr;
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mode, sizePx]);

  // Scaled height
  const width = sizePx;
  const height = Math.round(sizePx / DRAGON_ASSET.aspectRatio);

  // =========================================================================
  // RENDER: ROAMING MODE (Full-screen background overlay on Setup screen)
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
          zIndex: 1, // Sits safely BEHIND interactive UI panels (which have z-index: 10+)
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        <div
          ref={containerRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            willChange: "transform",
            filter: "drop-shadow(0 12px 28px rgba(91, 61, 245, 0.18))",
          }}
        >
          <Image
            src={DRAGON_ASSET.src}
            alt={DRAGON_ASSET.alt}
            width={width}
            height={height}
            priority
            unoptimized
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: CHAMBER MODE (Self-directed companion sitting to side of chamber)
  // =========================================================================
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {/* Floating Firefly / Butterfly for the 'chasing' behavior */}
      {fireflyActive && (
        <div
          style={{
            position: "absolute",
            top: -24,
            left: "50%",
            transform: `translate(${chamberBehaviorRef.current.flyX}px, ${chamberBehaviorRef.current.flyY}px)`,
            zIndex: 15,
            transition: "opacity 300ms ease",
            pointerEvents: "none",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <defs>
              <radialGradient id="fireflyGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="12" cy="12" r="9" fill="url(#fireflyGlow)" opacity="0.6" />
            <circle cx="12" cy="12" r="3.5" fill="#FEF08A" />
            {/* Tiny fluttering wings */}
            <ellipse cx="9" cy="8" rx="4" ry="2" fill="#FFFFFF" opacity="0.8" />
            <ellipse cx="15" cy="8" rx="4" ry="2" fill="#FFFFFF" opacity="0.8" />
          </svg>
        </div>
      )}

      {/* Sleeping 'z Z z' particle overlay for 'napping' behavior */}
      {currentBehavior === "napping" && (
        <div
          style={{
            position: "absolute",
            top: -22,
            right: 18,
            zIndex: 15,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none",
            animation: "zDrift 3s ease-in-out infinite",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--accent-primary)",
              opacity: 0.85,
            }}
          >
            z
          </span>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 800,
              fontSize: 13,
              color: "var(--accent-primary)",
              opacity: 0.65,
              marginLeft: 8,
              marginTop: -6,
            }}
          >
            Z
          </span>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 800,
              fontSize: 10,
              color: "var(--accent-primary)",
              opacity: 0.45,
              marginLeft: 14,
              marginTop: -4,
            }}
          >
            z
          </span>
        </div>
      )}

      {/* Main Dragon Mascot Element */}
      <div
        ref={containerRef}
        style={{
          width,
          height,
          position: "relative",
          willChange: "transform",
          filter: "drop-shadow(0 10px 24px rgba(22, 21, 26, 0.10))",
        }}
      >
        <Image
          src={DRAGON_ASSET.src}
          alt={DRAGON_ASSET.alt}
          width={width}
          height={height}
          priority
          unoptimized
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
}
