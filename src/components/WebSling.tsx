"use client";

import { useEffect, useRef, useState } from "react";

// "Web mode" — off until you tap the 🕸️ button. Turning it on sends our own masked slinger (an original
// PlayMyList hero: violet suit, glowing visor, trailing scarf) swinging across the screen on two webs with a
// mid-air flip; while on, every tap shoots a web that splats, double-tap fires a barrage, and a spider
// sometimes drops in. One fixed canvas, pointer-events: none; the rAF loop only runs while something moves.

type Shot = { fx: number; fy: number; x: number; y: number; t0: number; hit: boolean };
type Splat = { x: number; y: number; t0: number; r: number; spokes: number[] };

const SHOT_MS = 110, RETRACT_MS = 160, SPLAT_MS = 1600;
const SWING = 0.95, FLIGHT = 0.4; // seconds per swing / per mid-air flip
const SWING_A = 1.15; // swing arc: ±66°
const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const inOut = (t: number) => 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, t))) / 2;
const pop = (t: number) => (t >= 1 ? 1 : 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2));

export function WebSling() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(false);
  const [reduced, setReduced] = useState(true);

  useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  useEffect(() => {
    if (!on) return;
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let w = 0, h = 0, raf = 0;
    const shots: Shot[] = [], splats: Splat[] = [];
    let spider: number | null = null, spiderX = 0;
    let hero: number | null = performance.now(); // entrance swing starts right away

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const shoot = (x: number, y: number, delay = 0) => {
      shots.push({ fx: x < w / 2 ? -10 : w + 10, fy: h + 10, x, y, t0: performance.now() + delay, hit: false });
      kick();
    };

    const strand = (ax: number, ay: number, bx: number, by: number) => {
      const mx = (ax + bx) / 2, my = (ay + by) / 2 + Math.hypot(bx - ax, by - ay) * 0.04;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(mx, my, bx, by);
      ctx.moveTo(ax + 2, ay);
      ctx.quadraticCurveTo(mx + 2, my + 3, bx, by);
      ctx.stroke();
    };

    const drawSplat = (s: Splat, now: number) => {
      const t = (now - s.t0) / SPLAT_MS;
      const r = s.r * pop(Math.min(1, t * 4));
      ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.beginPath();
      for (const a of s.spokes) {
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.stroke();
      for (let k = 1; k <= 4; k++) {
        const rr = (r * k) / 4.4;
        ctx.beginPath();
        s.spokes.forEach((a, i) => {
          const b = s.spokes[(i + 1) % s.spokes.length];
          const mid = (a + (b < a ? b + Math.PI * 2 : b)) / 2;
          if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          ctx.quadraticCurveTo(Math.cos(mid) * rr * 0.8, Math.sin(mid) * rr * 0.8, Math.cos(b) * rr, Math.sin(b) * rr);
        });
        ctx.stroke();
      }
      if (t < 0.25) {
        ctx.globalAlpha = 1 - t / 0.25;
        ctx.beginPath();
        ctx.arc(0, 0, s.r * (0.6 + t * 4), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    // The slinger, drawn in rope space: hand at (0,0), body hanging along +y. `tuck` 0..1 pulls the knees in.
    const drawHero = (t: number, tuck: number) => {
      const suit = "#3b2a63", trim = "#b48cf0", glow = "#ff6b8b";
      ctx.save();
      ctx.lineCap = ctx.lineJoin = "round";
      ctx.shadowColor = trim;
      ctx.shadowBlur = 10;
      // scarf streaming behind, flapping
      ctx.strokeStyle = "#e8897f";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-2, 24);
      for (let i = 1; i <= 6; i++) ctx.lineTo(-i * 7, 22 + Math.sin(t * 22 - i) * 4 + i * 1.5);
      ctx.stroke();
      ctx.strokeStyle = suit;
      // web arm (straight up to the hand) and the free arm reaching forward
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(2, 20);
      ctx.moveTo(4, 22);
      ctx.lineTo(16, 30 - tuck * 4);
      ctx.lineTo(24, 26 - tuck * 8);
      ctx.stroke();
      // legs
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(5, 48);
      ctx.lineTo(10 + tuck * 10, 62 - tuck * 6);
      ctx.lineTo(6 + tuck * 2, 76 - tuck * 6);
      ctx.moveTo(5, 48);
      ctx.lineTo(2 - tuck * 2, 64 - tuck * 2);
      ctx.lineTo(-6 + tuck * 12, 78 - tuck * 12);
      ctx.stroke();
      // torso
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(3, 24);
      ctx.lineTo(5, 46);
      ctx.stroke();
      ctx.strokeStyle = trim; // chest stripe
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(-2, 30);
      ctx.lineTo(10, 36);
      ctx.stroke();
      // hooded head + glowing visor
      ctx.fillStyle = suit;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(-4, 14, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ctx.shadowColor = glow;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(-7, 11, 12, 4, 2);
      ctx.fill();
      ctx.restore();
    };

    // Two pendulum swings joined by a somersault; returns false once the slinger has left the screen.
    const heroFrame = (now: number) => {
      const t = (now - hero!) / 1000;
      const L = Math.min(h * 0.5, w * 0.32);
      const ax = [w * 0.28, w * 0.72], ay = -L * 0.15;
      const at = (i: number, th: number) => [ax[i] + L * Math.sin(th), ay + L * Math.cos(th)];
      const total = SWING * 2 + FLIGHT;
      if (t > total + 0.3) return false;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 1.6;
      let x: number, y: number, rot: number, tuck: number;
      if (t < SWING || t > SWING + FLIGHT) {
        const i = t < SWING ? 0 : 1;
        const k = i ? (t - SWING - FLIGHT) / SWING : t / SWING;
        const th = -SWING_A + 2 * SWING_A * inOut(k); // left → right
        [x, y] = at(i, th);
        const zip = Math.min(1, k * 8); // web shoots up to the anchor at the start of each swing
        strand(x, y, x + (ax[i] - x) * zip, y + (Math.max(0, ay) - y) * zip);
        rot = -th;
        tuck = Math.abs(th) / SWING_A;
      } else {
        const k = (t - SWING) / FLIGHT;
        const [x0, y0] = at(0, SWING_A), [x1, y1] = at(1, -SWING_A);
        x = x0 + (x1 - x0) * k;
        y = y0 + (y1 - y0) * k - Math.sin(Math.PI * k) * L * 0.35;
        rot = -SWING_A + (SWING_A * 2 - Math.PI * 2) * inOut(k); // full flip
        tuck = 1;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      drawHero(t, tuck);
      ctx.restore();
      return true;
    };

    const drawSpider = (now: number) => {
      const t = (now - spider!) / 1000;
      if (t > 4.7) return false;
      const rest = h * 0.32;
      const y =
        t < 1.2 ? rest * (1 - Math.exp(-5 * t) * Math.cos(9 * t)) : t < 4 ? rest + Math.sin((t - 1.2) * 3) * 6 : rest * (1 - ease((t - 4) / 0.6));
      const x = spiderX + Math.sin(t * 1.7) * 10;
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(spiderX, 0);
      ctx.lineTo(x, y - 14);
      ctx.stroke();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 1.7) * 0.12);
      ctx.strokeStyle = ctx.fillStyle = "#1a1020";
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 4; i++)
        for (const side of [-1, 1]) {
          const a = (-0.9 + i * 0.55 + Math.sin(t * 14 + i * 1.3) * 0.25) * side;
          const kx = side * 16, ky = -10 + i * 7;
          ctx.beginPath();
          ctx.moveTo(side * 5, -2 + i * 3);
          ctx.lineTo(kx, ky);
          ctx.lineTo(kx + side * 10 * Math.cos(a), ky + 12 + Math.abs(Math.sin(a)) * 6);
          ctx.stroke();
        }
      ctx.beginPath();
      ctx.ellipse(0, 6, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -8, 7, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ctx.shadowColor = "#ff6b8b";
      ctx.shadowBlur = 8;
      for (const ex of [-3, 3]) {
        ctx.beginPath();
        ctx.ellipse(ex, -9, 1.8, Math.sin(t * 2.3) > 0.97 ? 0.6 : 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return true;
    };

    function frame(now: number) {
      raf = 0;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.lineWidth = 1.4;
      ctx.shadowColor = "rgba(0,0,0,0.45)"; // keeps white web visible on the light morning sky too
      ctx.shadowBlur = 3;

      for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i], e = now - s.t0;
        if (e < 0) continue;
        if (e < SHOT_MS) {
          const k = ease(e / SHOT_MS);
          strand(s.fx, s.fy, s.fx + (s.x - s.fx) * k, s.fy + (s.y - s.fy) * k);
        } else if (e < SHOT_MS + RETRACT_MS) {
          if (!s.hit) {
            s.hit = true;
            const n = 9 + Math.floor(Math.random() * 4), base = Math.random() * Math.PI;
            splats.push({
              x: s.x, y: s.y, t0: now, r: 34 + Math.random() * 26,
              spokes: Array.from({ length: n }, (_, j) => base + (j / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.3),
            });
          }
          const k = ease((e - SHOT_MS) / RETRACT_MS);
          strand(s.fx + (s.x - s.fx) * k, s.fy + (s.y - s.fy) * k, s.x, s.y);
        } else shots.splice(i, 1);
      }
      for (let i = splats.length - 1; i >= 0; i--) {
        if (now - splats[i].t0 > SPLAT_MS) splats.splice(i, 1);
        else drawSplat(splats[i], now);
      }
      ctx.shadowBlur = 0;
      if (hero !== null && !heroFrame(now)) hero = null;
      if (spider !== null && !drawSpider(now)) spider = null;
      if (shots.length || splats.length || hero !== null || spider !== null) kick();
    }
    kick();

    let last = 0;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest?.(".pml-websling")) return;
      const now = performance.now();
      if (now - last < 300) {
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          shoot(e.clientX + Math.cos(a) * 120, e.clientY + Math.sin(a) * 90, i * 60);
        }
      } else shoot(e.clientX, e.clientY);
      last = now;
    };

    let timer: ReturnType<typeof setTimeout>;
    const dropSpider = () => {
      if (!document.hidden && spider === null) {
        spiderX = w * (0.15 + Math.random() * 0.7);
        spider = performance.now();
        kick();
      }
      timer = setTimeout(dropSpider, 25000 + Math.random() * 20000);
    };
    timer = setTimeout(dropSpider, 8000);

    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", resize);
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
    };
  }, [on]);

  if (reduced) return null;
  return (
    <>
      <canvas
        ref={ref}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 9999 }}
      />
      <button
        className="pml-websling"
        aria-pressed={on}
        title={on ? "Web mode on — tap anywhere to shoot webs, double-tap for a barrage" : "Web mode"}
        onClick={() => setOn((v) => !v)}
      >
        <span aria-hidden="true">🕸️</span>
        <span className="pml-websling-label">{on ? "Web mode on" : "Web mode"}</span>
      </button>
    </>
  );
}
