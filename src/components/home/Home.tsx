"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sun, Moon } from "lucide-react";
import { HomeSections } from "@/components/home/HomeSections";
import { startSky } from "@/components/home/sky";

interface HomeProps {
  onSelectMood: (slug: string) => void;
  onOpenPlaylist: () => void;
  onNavigate: (view: "discover" | "library" | "playlists") => void;
  skyMode: "morning" | "night";
  onSkyMode: (mode: "morning" | "night") => void;
}

const MOODS_CONFIG = [
  { slug: "in-love", label: "I'm in Love", color: "#e8897f", word: "heart" },
  { slug: "the-weeknd", label: "The Weeknd", color: "#c97b4a", word: "night" },
  { slug: "one-sided", label: "One Sided", color: "#7b8fe0", word: "mind" },
  { slug: "long-distance", label: "Long Distance", color: "#5fb0c9", word: "voice" },
  { slug: "lonely", label: "Lonely", color: "#6b6fd9", word: "silence" },
  { slug: "late-night", label: "Late Night", color: "#9a6fd9", word: "thoughts" },
];

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  return [
    lerp(c1[0], c2[0], t),
    lerp(c1[1], c2[1], t),
    lerp(c1[2], c2[2], t),
  ];
}

export function Home({ onSelectMood, onOpenPlaylist, onNavigate, skyMode, onSkyMode: setSkyMode }: HomeProps) {

  const sceneCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tagRef = useRef<HTMLDivElement | null>(null);
  const ambientRef = useRef<HTMLDivElement | null>(null);
  const moodGlowRef = useRef<HTMLDivElement | null>(null);
  const moodWordRef = useRef<HTMLElement | null>(null);

  const targetSkyProgressRef = useRef(skyMode === "morning" ? 1 : 0);

  useEffect(() => {
    targetSkyProgressRef.current = skyMode === "morning" ? 1 : 0;
    if (tagRef.current) {
      tagRef.current.textContent = skyMode === "morning" ? "Golden Hour" : "Deep Space";
    }
  }, [skyMode]);

  // Background sky: layered night ↔ dawn scene (see ./sky.ts)
  useEffect(() => {
    const canvas = sceneCanvasRef.current;
    const ambientEl = ambientRef.current;
    if (!canvas || !ambientEl) return;
    return startSky(canvas, ambientEl, targetSkyProgressRef);
  }, []);

  // Foreground waveform engine & reactive mood hover
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    const moodGlow = moodGlowRef.current;
    const moodWord = moodWordRef.current;
    if (!canvas || !moodGlow || !moodWord) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animId: number;
    let W = 0;
    let H = 0;
    let DPR = 1;

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 1.5);
      W = canvas.width = window.innerWidth * DPR;
      H = canvas.height = window.innerHeight * DPR;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const DEFAULT_COLOR = hexToRgb("#9a6fd9");
    let currentColor: [number, number, number] = [...DEFAULT_COLOR];
    let targetColor: [number, number, number] = [...DEFAULT_COLOR];
    let amp = 1;
    let targetAmp = 1;

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      currentColor = lerpColor(currentColor, targetColor, 0.045);
      amp = lerp(amp, targetAmp, 0.06);

      const midY = H * 0.46;
      const lines = [
        { freq: 0.0016, phase: 0, baseAmp: H * 0.055, speed: 0.006, alpha: 0.16, width: 1.4 },
        { freq: 0.0022, phase: 1.8, baseAmp: H * 0.032, speed: 0.009, alpha: 0.22, width: 1.1 },
        { freq: 0.0011, phase: 3.4, baseAmp: H * 0.075, speed: 0.004, alpha: 0.1, width: 1.8 },
      ];

      lines.forEach((ln) => {
        ctx.beginPath();
        const [r, g, b] = currentColor;
        ctx.strokeStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${ln.alpha})`;
        ctx.lineWidth = ln.width * DPR;
        for (let x = 0; x <= W; x += 4 * DPR) {
          const y =
            midY +
            Math.sin(x * ln.freq + t * ln.speed + ln.phase) * ln.baseAmp * amp +
            Math.sin(x * ln.freq * 0.5 + t * ln.speed * 0.6) * ln.baseAmp * 0.3 * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      t += 1;
      if (!reduced) animId = requestAnimationFrame(draw);
    };

    draw();

    // Attach listeners to mood buttons
    const buttons = document.querySelectorAll<HTMLButtonElement>(".pml-newhome-mood");
    let activeBtn: HTMLButtonElement | null = null;
    const cleanupFns: Array<() => void> = [];

    buttons.forEach((btn) => {
      const color = btn.getAttribute("data-color") || "#9a6fd9";
      btn.style.setProperty("--mood-color", color);

      const activate = () => {
        targetColor = hexToRgb(color);
        targetAmp = 1.9;
        document.documentElement.style.setProperty("--accent", color);
        moodWord.style.color = color;
        moodWord.textContent = btn.getAttribute("data-word") || "heart";
        moodGlow.style.setProperty("--mood-color", color);
        moodGlow.style.opacity = "0.5";
      };

      const release = () => {
        if (activeBtn === btn) return;
        targetColor = [...DEFAULT_COLOR];
        targetAmp = 1;
        document.documentElement.style.setProperty("--accent", "#9a6fd9");
        moodWord.style.color = "";
        moodWord.textContent = "heart";
        moodGlow.style.opacity = "0";
      };

      btn.addEventListener("mouseenter", activate);
      btn.addEventListener("mouseleave", release);
      btn.addEventListener("focus", activate);
      btn.addEventListener("blur", release);

      cleanupFns.push(() => {
        btn.removeEventListener("mouseenter", activate);
        btn.removeEventListener("mouseleave", release);
        btn.removeEventListener("focus", activate);
        btn.removeEventListener("blur", release);
      });
    });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      cleanupFns.forEach((fn) => fn());
      // Clicking a mood unmounts Home before mouseleave fires, which left the hover accent stuck.
      document.documentElement.style.setProperty("--accent", "#9a6fd9");
    };
  }, []);

  return (
    <div className={`pml-newhome ${skyMode === "morning" ? "is-morning" : ""}`}>
      <canvas id="scene" ref={sceneCanvasRef} />
      <canvas id="wave" ref={waveCanvasRef} />
      <div className="veil" />
      <div className="ambient" id="ambient" ref={ambientRef} />
      <div className="mood-glow" id="moodGlow" ref={moodGlowRef} />
      <div className="scene-tag" id="sceneTag" ref={tagRef}>
        Deep Space
      </div>

      <header>
        <div className="wordmark">PLAYMYLIST</div>

        {/* Morning / Night Mode Pill Switcher */}
        <div className="pml-sky-switcher" role="group" aria-label="Sky mode switcher">
          <button
            className={`pml-sky-btn ${skyMode === "morning" ? "active" : ""}`}
            onClick={() => setSkyMode("morning")}
            aria-pressed={skyMode === "morning"}
          >
            <Sun size={12} className="text-amber-300" />
            <span>Morning</span>
          </button>
          <button
            className={`pml-sky-btn ${skyMode === "night" ? "active" : ""}`}
            onClick={() => setSkyMode("night")}
            aria-pressed={skyMode === "night"}
          >
            <Moon size={12} className="text-indigo-300" />
            <span>Night</span>
          </button>
        </div>

        <nav>
          {([
            ["discover", "Discover"],
            ["library", "Stories"],
            ["playlists", "Playlists"],
          ] as const).map(([v, label]) => (
            <a
              key={v}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(v);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main>
        <div className="eyebrow">Music · Stories · Visuals · One Feeling</div>
        <h1>
          What does your <em id="moodWord" ref={moodWordRef}>heart</em> sound like tonight?
        </h1>

        <div className="moods" id="moods">
          {MOODS_CONFIG.map((m) => (
            <button
              key={m.slug}
              className="mood pml-newhome-mood"
              data-color={m.color}
              data-word={m.word}
              onClick={() => onSelectMood(m.slug)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <a
          className="explore"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectMood("in-love");
          }}
        >
          Explore all moods
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>

        <button className="pml-make-playlist" onClick={onOpenPlaylist}>
          <span className="pml-make-playlist-plus" aria-hidden="true">+</span>
          Make your own playlist
        </button>
      </main>

      <footer className="pml-hero-foot">
        <button
          className="pml-scroll-cue"
          onClick={() => window.scrollTo({ top: window.innerHeight * 0.92, behavior: "smooth" })}
          aria-label="Scroll down"
        >
          <span>Scroll</span>
        <svg
          className="chevron"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        </button>
      </footer>

      <HomeSections onSelectMood={onSelectMood} onNavigate={onNavigate} onOpenPlaylist={onOpenPlaylist} />
    </div>
  );
}
