"use client";

import React, { useEffect, useRef } from "react";

/**
 * Soft keepsakes drifting through a mood page, one kind per mood: petals (in love), neon bokeh (the weeknd),
 * paper planes (one sided), stars + a tiny plane (long distance), dandelion seeds (lonely), fireflies (late night),
 * sparkles (my playlist). One canvas behind the content; still frame for reduced motion.
 */
type P = { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; ph: number; hue: number; heart?: boolean };

export function MoodDrift({ slug, accent }: { slug: string; accent: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    let W = 0, H = 0, u = 1, raf = 0, last = performance.now();
    let ps: P[] = [];
    let planeT = performance.now() + 4000;

    const count = () => {
      const area = (W * H) / (u * u);
      const per = { "in-love": 26000, "the-weeknd": 30000, "one-sided": 160000, "long-distance": 9000, lonely: 30000, "late-night": 24000 }[slug] ?? 30000;
      return Math.max(4, Math.min(60, Math.round(area / per)));
    };

    function spawn(anywhere: boolean): P {
      const p: P = { x: rand(0, W), y: anywhere ? rand(0, H) : 0, vx: 0, vy: 0, r: 0, rot: rand(0, 6.28), vr: rand(-0.6, 0.6), ph: rand(0, 100), hue: 0 };
      switch (slug) {
        case "in-love": // petals falling
          Object.assign(p, { y: anywhere ? p.y : -20 * u, vx: rand(-8, 12) * u, vy: rand(16, 34) * u, r: rand(4, 8) * u, heart: Math.random() < 0.12 });
          break;
        case "the-weeknd": // neon bokeh rising
          Object.assign(p, { y: anywhere ? p.y : H + 30 * u, vx: rand(-4, 4) * u, vy: -rand(6, 16) * u, r: rand(10, 30) * u, hue: Math.random() < 0.7 ? 350 : 15 });
          break;
        case "one-sided": // paper planes gliding across
          Object.assign(p, { x: anywhere ? p.x : -40 * u, y: anywhere ? p.y : rand(0.1, 0.7) * H, vx: rand(38, 60) * u, vy: rand(4, 12) * u, r: rand(9, 13) * u });
          break;
        case "long-distance": // twinkling stars (they stay put)
          Object.assign(p, { r: rand(0.6, 1.8) * u });
          break;
        case "lonely": // dandelion seeds floating up and sideways
          Object.assign(p, { y: anywhere ? p.y : H + 20 * u, vx: rand(4, 14) * u, vy: -rand(6, 14) * u, r: rand(5, 8) * u });
          break;
        case "late-night": // fireflies wandering
          Object.assign(p, { vx: rand(-10, 10) * u, vy: rand(-8, 8) * u, r: rand(1.4, 2.6) * u });
          break;
        default: // sparkles
          Object.assign(p, { vy: -rand(4, 10) * u, r: rand(1.5, 3) * u });
      }
      return p;
    }

    function resize() {
      u = Math.min(window.devicePixelRatio || 1, 1.5);
      W = canvas.width = window.innerWidth * u;
      H = canvas.height = window.innerHeight * u;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ps = Array.from({ length: count() }, () => spawn(true));
    }

    const heartPath = (x: number, y: number, s: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.9);
      ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.7, y - s * 1.4, x, y - s * 0.5);
      ctx.bezierCurveTo(x + s * 0.7, y - s * 1.4, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
    };

    function draw(p: P, t: number) {
      switch (slug) {
        case "in-love": {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = 0.55;
          if (p.heart) {
            ctx.fillStyle = "#ff8fab";
            heartPath(0, 0, p.r * 0.7);
            ctx.fill();
          } else {
            const g = ctx.createLinearGradient(-p.r, 0, p.r, 0);
            g.addColorStop(0, "#ffc2d1");
            g.addColorStop(1, "#ff8fab");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.r, p.r * 0.55 * Math.abs(Math.cos(t * 0.002 + p.ph)) + p.r * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          break;
        }
        case "the-weeknd": {
          const a = 0.1 + 0.08 * Math.sin(t * 0.001 + p.ph);
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, `hsla(${p.hue},95%,60%,${a + 0.08})`);
          g.addColorStop(0.6, `hsla(${p.hue},95%,55%,${a})`);
          g.addColorStop(1, `hsla(${p.hue},95%,50%,0)`);
          ctx.fillStyle = g;
          ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
          break;
        }
        case "one-sided": {
          ctx.save();
          ctx.fillStyle = "rgba(255,255,255,.7)"; // dotted trail
          for (let k = 1; k < 10; k++) {
            const tx = p.x - p.vx * 0.1 * k, ty = p.y - p.vy * 0.1 * k + Math.sin(t * 0.002 + p.ph - k * 0.5) * 3 * u;
            ctx.globalAlpha = 0.45 * (1 - k / 10);
            ctx.beginPath();
            ctx.arc(tx, ty, 1 * u, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.atan2(p.vy, p.vx) + Math.sin(t * 0.002 + p.ph) * 0.12);
          ctx.globalAlpha = 0.8;
          const s = p.r;
          ctx.fillStyle = "#f6f0e6";
          ctx.beginPath(); // top wing
          ctx.moveTo(s, 0); ctx.lineTo(-s, -s * 0.55); ctx.lineTo(-s * 0.55, 0); ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#d9cfc0"; // fold
          ctx.beginPath();
          ctx.moveTo(s, 0); ctx.lineTo(-s * 0.55, 0); ctx.lineTo(-s * 0.85, s * 0.35); ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }
        case "long-distance": {
          const tw = 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(t * 0.0015 + p.ph), 3);
          ctx.globalAlpha = tw * 0.8;
          ctx.fillStyle = "#fff6e6";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "lonely": {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.sin(t * 0.001 + p.ph) * 0.4);
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = "rgba(255,255,255,.75)";
          ctx.lineWidth = 0.7 * u;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, p.r * 1.3); // stem
          for (let k = 0; k < 9; k++) { // fluffy umbrella
            const a = -Math.PI / 2 + (k - 4) * 0.32;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * p.r, Math.sin(a) * p.r);
          }
          ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,.8)";
          ctx.beginPath();
          ctx.arc(0, p.r * 1.35, 0.9 * u, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }
        case "late-night": {
          const pulse = Math.pow(Math.max(0, Math.sin(t * 0.0018 + p.ph)), 2);
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
          g.addColorStop(0, `rgba(235,255,150,${0.75 * pulse + 0.05})`);
          g.addColorStop(0.25, `rgba(200,255,120,${0.25 * pulse})`);
          g.addColorStop(1, "rgba(200,255,120,0)");
          ctx.fillStyle = g;
          ctx.fillRect(p.x - p.r * 6, p.y - p.r * 6, p.r * 12, p.r * 12);
          break;
        }
        default: {
          const tw = Math.pow(Math.max(0, Math.sin(t * 0.002 + p.ph)), 4);
          ctx.globalAlpha = tw * 0.8;
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1 * u;
          const L = p.r * (1 + tw * 2);
          ctx.beginPath();
          ctx.moveTo(p.x - L, p.y); ctx.lineTo(p.x + L, p.y);
          ctx.moveTo(p.x, p.y - L); ctx.lineTo(p.x, p.y + L);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    function plane(t: number) { // long distance: a tiny plane crossing with a dashed trail
      const d = (t - planeT) / 26000;
      if (d < 0) return;
      if (d > 1) { planeT = t + rand(9000, 18000); return; }
      const x = -40 * u + d * (W + 80 * u), y = H * 0.22 + Math.sin(d * 3) * H * 0.04;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "rgba(255,240,220,.8)";
      ctx.setLineDash([6 * u, 6 * u]);
      ctx.lineWidth = 1.2 * u;
      ctx.beginPath();
      ctx.moveTo(Math.max(0, x - W * 0.35), y + H * 0.02);
      ctx.quadraticCurveTo(x - W * 0.15, y + H * 0.03, x - 10 * u, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#fff6e6";
      ctx.translate(x, y);
      ctx.beginPath(); // tiny plane silhouette
      ctx.ellipse(0, 0, 8 * u, 1.8 * u, 0, 0, Math.PI * 2);
      ctx.moveTo(1 * u, 0); ctx.lineTo(-3 * u, -6 * u); ctx.lineTo(-1 * u, 0); ctx.lineTo(-3 * u, 6 * u); ctx.closePath();
      ctx.moveTo(-6 * u, 0); ctx.lineTo(-8 * u, -3 * u); ctx.lineTo(-7 * u, 0);
      ctx.fill();
      ctx.restore();
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        if (!reduced) {
          if (slug === "late-night") { // fireflies wander on soft curves
            p.vx += Math.sin(now * 0.0007 + p.ph) * 6 * u * dt;
            p.vy += Math.cos(now * 0.0006 + p.ph * 1.3) * 6 * u * dt;
            p.vx = Math.max(-14 * u, Math.min(14 * u, p.vx));
            p.vy = Math.max(-12 * u, Math.min(12 * u, p.vy));
          }
          const sway = slug === "in-love" || slug === "lonely" ? Math.sin(now * 0.0012 + p.ph) * 14 * u : 0;
          p.x += (p.vx + sway) * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          if (p.y > H + 40 * u || p.y < -40 * u || p.x > W + 60 * u || p.x < -60 * u) {
            Object.assign(p, spawn(slug === "late-night"));
          }
        }
        draw(p, reduced ? 0 : now);
      }
      if (slug === "long-distance" && !reduced) plane(now);
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [slug, accent]);

  return <canvas ref={ref} className="pml-mood-drift" aria-hidden="true" />;
}
