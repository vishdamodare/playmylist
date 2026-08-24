"use client";

import React, { useEffect, useRef } from "react";

interface HomeProps {
  onSelectMood: (slug: string) => void;
}

const MOODS_CONFIG = [
  { slug: "in-love", label: "I'm in Love", color: "#e8897f", word: "heart" },
  { slug: "heartbroken", label: "Heartbroken", color: "#c97b4a", word: "chest" },
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

export function Home({ onSelectMood }: HomeProps) {
  const sceneCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tagRef = useRef<HTMLDivElement | null>(null);
  const ambientRef = useRef<HTMLDivElement | null>(null);
  const moodGlowRef = useRef<HTMLDivElement | null>(null);
  const strikeRef = useRef<HTMLDivElement | null>(null);
  const moodWordRef = useRef<HTMLElement | null>(null);

  // Background scene cycler: Space -> Sun -> Rain -> Night -> repeat
  useEffect(() => {
    const canvas = sceneCanvasRef.current;
    const waveCanvas = waveCanvasRef.current;
    const tagEl = tagRef.current;
    const ambientEl = ambientRef.current;
    const strikeEl = strikeRef.current;
    if (!canvas || !waveCanvas || !tagEl || !ambientEl || !strikeEl) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animId: number;
    let W = 0;
    let H = 0;
    let DPR = 1;

    let stars: Array<{ x: number; y: number; r: number; phase: number; speed: number }> = [];
    let drops: Array<{ x: number; y: number; len: number; speed: number; alpha: number; gust: number }> = [];
    let fogBands: Array<{ y: number; x: number; w: number; h: number; speed: number; alpha: number }> = [];
    let sunSparks: Array<{ ang: number; dist: number; r: number; phase: number; speed: number }> = [];

    const buildStars = () => {
      stars = [];
      const count = Math.floor((W * H) / (9000 * DPR * DPR));
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H * 0.85,
          r: (Math.random() * 1.4 + 0.3) * DPR,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0006 + Math.random() * 0.0012,
        });
      }
    };

    const buildRain = () => {
      drops = [];
      const count = Math.floor((W * H) / (5000 * DPR * DPR));
      for (let i = 0; i < count; i++) {
        drops.push({
          x: Math.random() * W,
          y: Math.random() * H,
          len: (10 + Math.random() * 18) * DPR,
          speed: (7 + Math.random() * 9) * DPR,
          alpha: 0.18 + Math.random() * 0.3,
          gust: 0.6 + Math.random() * 0.8,
        });
      }
    };

    const buildFog = () => {
      fogBands = [];
      const count = 5;
      for (let i = 0; i < count; i++) {
        fogBands.push({
          y: H * (0.1 + i * 0.16) + Math.random() * H * 0.05,
          x: Math.random() * W,
          w: W * (0.55 + Math.random() * 0.5),
          h: H * (0.08 + Math.random() * 0.06),
          speed: (18 + Math.random() * 24) * DPR,
          alpha: 0.03 + Math.random() * 0.035,
        });
      }
    };

    const buildSparks = () => {
      sunSparks = [];
      const count = 26;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 0.9 + Math.random() * 2.6;
        sunSparks.push({
          ang,
          dist,
          r: (0.7 + Math.random() * 1.6) * DPR,
          phase: Math.random() * Math.PI * 2,
          speed: 0.001 + Math.random() * 0.003,
        });
      }
    };

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = window.innerWidth * DPR;
      H = canvas.height = window.innerHeight * DPR;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      buildStars();
      buildRain();
      buildFog();
      buildSparks();
    };

    resize();
    window.addEventListener("resize", resize);

    const grad = (y0: number, y1: number, stops: [number, string][]) => {
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      stops.forEach((s) => g.addColorStop(s[0], s[1]));
      return g;
    };

    const drawSpace = (time: number) => {
      ctx.fillStyle = grad(0, H, [
        [0, "#05030c"],
        [0.6, "#0b0616"],
        [1, "#140b21"],
      ]);
      ctx.fillRect(0, 0, W, H);

      const blobs = [
        { x: W * 0.22, y: H * 0.28, r: Math.max(W, H) * 0.28, c: "rgba(123,143,224,0.10)" },
        { x: W * 0.78, y: H * 0.18, r: Math.max(W, H) * 0.22, c: "rgba(154,111,217,0.10)" },
        { x: W * 0.55, y: H * 0.55, r: Math.max(W, H) * 0.2, c: "rgba(95,176,201,0.06)" },
      ];
      blobs.forEach((b) => {
        const rg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        rg.addColorStop(0, b.c);
        rg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, W, H);
      });

      stars.forEach((s) => {
        const tw = 0.5 + 0.5 * Math.sin(time * s.speed + s.phase);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(243,236,228,${0.25 + tw * 0.65})`;
        ctx.fill();
      });
    };

    const drawSun = (time: number) => {
      ctx.fillStyle = grad(0, H, [
        [0, "#1c0f26"],
        [0.4, "#3a1a2c"],
        [0.66, "#8a3f2c"],
        [0.86, "#e08a3e"],
        [1, "#f4b667"],
      ]);
      ctx.fillRect(0, 0, W, H);

      const cx = W * 0.5;
      const horizonY = H * 0.74;
      const bob = Math.sin(time * 0.0006) * H * 0.008;
      const cy = horizonY - H * 0.08 + bob;
      const r = Math.min(W, H) * 0.145;
      const shimmer = 0.92 + 0.08 * Math.sin(time * 0.0021);

      const haze = ctx.createRadialGradient(cx, horizonY, 0, cx, horizonY, Math.max(W, H) * 0.62);
      haze.addColorStop(0, "rgba(255,196,120,0.35)");
      haze.addColorStop(0.5, "rgba(232,137,79,0.14)");
      haze.addColorStop(1, "rgba(232,137,79,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.00007);
      ctx.globalCompositeOperation = "lighter";
      const rayCount = 18;
      for (let i = 0; i < rayCount; i++) {
        const ang = ((Math.PI * 2) / rayCount) * i;
        const flicker = 0.6 + 0.4 * Math.sin(time * 0.0009 + i * 1.7);
        const len = r * (6.4 + 1.3 * flicker);
        const rg = ctx.createLinearGradient(0, 0, Math.cos(ang) * len, Math.sin(ang) * len);
        rg.addColorStop(0, `rgba(255,232,190,${0.16 * shimmer * flicker})`);
        rg.addColorStop(0.4, `rgba(255,214,160,${0.07 * shimmer})`);
        rg.addColorStop(1, "rgba(255,214,160,0)");
        ctx.strokeStyle = rg;
        ctx.lineWidth = r * 0.15;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
        ctx.stroke();
      }
      ctx.restore();

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 4.2 * shimmer);
      glow.addColorStop(0, `rgba(255,236,196,${0.7 * shimmer})`);
      glow.addColorStop(0.32, "rgba(255,210,150,0.34)");
      glow.addColorStop(0.65, "rgba(232,137,79,0.16)");
      glow.addColorStop(1, "rgba(232,137,79,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * shimmer);
      core.addColorStop(0, "#fffdf6");
      core.addColorStop(0.45, "#ffe8b8");
      core.addColorStop(0.8, "#f7b869");
      core.addColorStop(1, "#e88a4a");
      ctx.beginPath();
      ctx.arc(cx, cy, r * shimmer, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.34, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fill();

      sunSparks.forEach((sp) => {
        const tw = 0.4 + 0.6 * Math.max(0, Math.sin(time * sp.speed + sp.phase));
        const sx = cx + Math.cos(sp.ang) * r * sp.dist;
        const sy = cy + Math.sin(sp.ang) * r * sp.dist * 0.7;
        ctx.beginPath();
        ctx.arc(sx, sy, sp.r * (0.6 + tw), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,238,205,${tw * 0.55})`;
        ctx.fill();
      });

      const vx = cx - W * 0.5;
      const vy = cy - H * 0.5;
      [0.35, 0.6, 0.9, 1.25].forEach((fp, i) => {
        const fx = cx - vx * fp * 0.55;
        const fy = cy - vy * fp * 0.55;
        const fr = r * (0.14 / (i + 1));
        const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
        fg.addColorStop(0, "rgba(255,232,195,0.22)");
        fg.addColorStop(1, "rgba(255,232,195,0)");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.beginPath();
      ctx.moveTo(0, horizonY + H * 0.02);
      const peaks = [0.05, 0.16, 0.24, 0.34, 0.44, 0.5, 0.58, 0.68, 0.78, 0.88, 0.97];
      peaks.forEach((p) => {
        const wob = Math.sin(p * 14 + 2) * H * 0.012;
        ctx.lineTo(W * p, horizonY - H * 0.02 - Math.abs(Math.sin(p * 7)) * H * 0.05 + wob);
      });
      ctx.lineTo(W, horizonY + H * 0.02);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      const hillGrad = grad(horizonY - H * 0.07, H, [
        [0, "#20101c"],
        [1, "#0d0712"],
      ]);
      ctx.fillStyle = hillGrad;
      ctx.fill();

      ctx.fillStyle = `rgba(255,214,150,${0.08 * shimmer})`;
      ctx.fillRect(0, horizonY - H * 0.01, W, H * 0.03);
    };

    let windPhase = 0;
    const drawRain = (time: number, rainWeight: number) => {
      ctx.fillStyle = grad(0, H, [
        [0, "#0c0f16"],
        [0.55, "#141a24"],
        [1, "#1c2430"],
      ]);
      ctx.fillRect(0, 0, W, H);

      const flashGlow = flashAlpha * 0.5;
      const mist = ctx.createRadialGradient(W * 0.5, H * 0.05, 0, W * 0.5, H * 0.05, Math.max(W, H) * 0.7);
      mist.addColorStop(0, `rgba(150,168,196,${0.1 + flashGlow})`);
      mist.addColorStop(1, "rgba(140,160,190,0)");
      ctx.fillStyle = mist;
      ctx.fillRect(0, 0, W, H);

      windPhase += 0.006;
      const gust = 0.5 + 0.5 * Math.sin(windPhase) + 0.25 * Math.sin(windPhase * 2.7 + 1.4);
      const windStrength = Math.max(0, Math.min(1.3, gust));

      fogBands.forEach((f) => {
        f.x += f.speed * (0.4 + windStrength) * 0.016;
        if (f.x - f.w > W) f.x = -f.w;
        const fg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.w * 0.5);
        fg.addColorStop(0, `rgba(200,212,228,${f.alpha})`);
        fg.addColorStop(1, "rgba(200,212,228,0)");
        ctx.save();
        ctx.scale(1, f.h / f.w);
        ctx.translate(0, f.y * (1 - f.w / f.h));
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, W, H * (f.w / f.h));
        ctx.restore();
      });

      ctx.lineCap = "round";
      const slant = (2 + windStrength * 9) * DPR;
      drops.forEach((d) => {
        const localWind = slant * d.gust;
        d.y += d.speed * (0.7 + windStrength * 0.6);
        d.x -= localWind * 0.12;
        if (d.y - d.len > H) {
          d.y = -d.len;
          d.x = Math.random() * W;
        }
        if (d.x < -20 * DPR) {
          d.x = W + 20 * DPR;
        }
        ctx.strokeStyle = `rgba(190,210,230,${d.alpha + flashGlow * 0.4})`;
        ctx.lineWidth = 1 * DPR;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - localWind, d.y + d.len);
        ctx.stroke();
      });
    };

    const drawNight = (time: number) => {
      ctx.fillStyle = grad(0, H, [
        [0, "#050611"],
        [0.6, "#0b0e22"],
        [1, "#141230"],
      ]);
      ctx.fillRect(0, 0, W, H);

      const mx = W * 0.74;
      const my = H * 0.22;
      const mr = Math.min(W, H) * 0.075;
      const glow = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 3.4);
      glow.addColorStop(0, "rgba(210,215,255,0.28)");
      glow.addColorStop(1, "rgba(210,215,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fillStyle = "#eceaf5";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(mx + mr * 0.42, my - mr * 0.12, mr * 0.92, 0, Math.PI * 2);
      ctx.fillStyle = "#0b0e22";
      ctx.fill();

      stars.forEach((s, i) => {
        if (i % 2 === 0) return;
        const tw = 0.5 + 0.5 * Math.sin(time * s.speed * 0.7 + s.phase);
        ctx.beginPath();
        ctx.arc(s.x, s.y * 0.9, s.r * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,228,245,${0.18 + tw * 0.5})`;
        ctx.fill();
      });
    };

    const scenes = [
      { name: "Deep Space", draw: (t: number) => drawSpace(t), ambient: [42, 31, 102] },
      { name: "Golden Hour", draw: (t: number) => drawSun(t), ambient: [110, 58, 30] },
      { name: "Raining", draw: (t: number, rw: number) => drawRain(t, rw), ambient: [28, 38, 54] },
      { name: "Night", draw: (t: number) => drawNight(t), ambient: [24, 26, 66] },
    ];

    const HOLD = 5200;
    const TRANSITION = 2200;
    const SEGMENT = HOLD + TRANSITION;

    let lastTagIndex = -1;
    let flashAlpha = 0;
    let nextFlashTime = 3200 + Math.random() * 2500;

    const triggerFlash = (intensity: number) => {
      const peak = (0.75 + Math.random() * 0.25) * intensity;
      strikeEl.style.transition = "none";
      strikeEl.style.opacity = String(peak);
      flashAlpha = peak;
      requestAnimationFrame(() => {
        strikeEl.style.transition = "opacity 0.6s ease-out";
        strikeEl.style.opacity = "0";
      });
      setTimeout(() => {
        flashAlpha = 0;
      }, 550);

      canvas.classList.remove("thunder-shake");
      waveCanvas.classList.remove("thunder-shake");
      void canvas.offsetWidth;
      canvas.classList.add("thunder-shake");
      waveCanvas.classList.add("thunder-shake");

      if (Math.random() < 0.45) {
        setTimeout(() => triggerFlash(intensity * 0.6), 90 + Math.random() * 140);
      }
    };

    const frame = (time: number) => {
      const total = SEGMENT * scenes.length;
      const t = time % total;
      const idx = Math.floor(t / SEGMENT);
      const into = t - idx * SEGMENT;
      const nextIdx = (idx + 1) % scenes.length;
      const eased =
        into > HOLD
          ? (() => {
              const b = Math.min(1, (into - HOLD) / TRANSITION);
              return b * b * (3 - 2 * b);
            })()
          : 0;

      const RAIN_IDX = 2;
      let rainWeight = 0;
      if (idx === RAIN_IDX) rainWeight = into > HOLD ? 1 - eased : 1;
      else if (nextIdx === RAIN_IDX && into > HOLD) rainWeight = eased;

      scenes[idx].draw(time, rainWeight);

      if (into > HOLD) {
        ctx.save();
        ctx.globalAlpha = eased;
        scenes[nextIdx].draw(time, rainWeight);
        ctx.restore();
        if (eased > 0.5 && lastTagIndex !== nextIdx) {
          lastTagIndex = nextIdx;
          tagEl.style.opacity = "0";
          setTimeout(() => {
            tagEl.textContent = scenes[nextIdx].name;
            tagEl.style.opacity = "0.75";
          }, 180);
        }
      } else if (lastTagIndex !== idx && into < 60) {
        lastTagIndex = idx;
        tagEl.textContent = scenes[idx].name;
      }

      const a = scenes[idx].ambient;
      const b = scenes[nextIdx].ambient;
      const mix = into > HOLD ? eased : 0;
      const rC = Math.round(a[0] + (b[0] - a[0]) * mix);
      const gC = Math.round(a[1] + (b[1] - a[1]) * mix);
      const bC = Math.round(a[2] + (b[2] - a[2]) * mix);
      ambientEl.style.backgroundColor = `rgb(${rC},${gC},${bC})`;

      if (rainWeight > 0.35) {
        if (time > nextFlashTime) {
          triggerFlash(0.6 + rainWeight * 0.4);
          nextFlashTime = time + 2600 + Math.random() * 5200;
        }
      } else if (time > nextFlashTime - 1500) {
        nextFlashTime = time + 2600 + Math.random() * 4000;
      }

      if (!reduced) animId = requestAnimationFrame(frame);
    };

    if (reduced) {
      drawSpace(0);
      tagEl.textContent = "Deep Space";
      ambientEl.style.backgroundColor = "rgb(42,31,102)";
    } else {
      animId = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
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
      DPR = Math.min(window.devicePixelRatio || 1, 2);
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
    };
  }, []);

  return (
    <div className="pml-newhome">
      <canvas id="scene" ref={sceneCanvasRef} />
      <canvas id="wave" ref={waveCanvasRef} />
      <div className="veil" />
      <div className="ambient" id="ambient" ref={ambientRef} />
      <div className="mood-glow" id="moodGlow" ref={moodGlowRef} />
      <div className="strike" id="strike" ref={strikeRef} />
      <div className="scene-tag" id="sceneTag" ref={tagRef}>
        Deep Space
      </div>

      <header>
        <div className="wordmark">PLAYMYLIST</div>
        <nav>
          <a href="#">Discover</a>
          <a href="#">Stories</a>
          <a href="#">Playlists</a>
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
      </main>

      <footer>
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
      </footer>
    </div>
  );
}
