"use client";

import { useEffect, useRef } from "react";

// Web-slinging layer: every tap shoots a web from the wrist (bottom corner) that splats where you hit;
// double-tap fires a 5-web barrage; now and then a spider drops in on a thread, dangles, and zips back up.
// One fixed canvas, pointer-events: none, and the rAF loop only runs while something is on screen.

type Shot = { fx: number; fy: number; x: number; y: number; t0: number; hit: boolean };
type Splat = { x: number; y: number; t0: number; r: number; spokes: number[] };
type Spider = { x: number; t0: number };

const SHOT_MS = 110, RETRACT_MS = 160, SPLAT_MS = 1600;
const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
// overshoot pop: 0 → ~1.1 → 1
const pop = (t: number) => (t >= 1 ? 1 : 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2));

export function WebSling() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let w = 0, h = 0, raf = 0;
    const shots: Shot[] = [], splats: Splat[] = [];
    let spider: Spider | null = null;

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
      const left = x < w / 2;
      shots.push({ fx: left ? -10 : w + 10, fy: h + 10, x, y, t0: performance.now() + delay, hit: false });
      kick();
    };

    const strand = (ax: number, ay: number, bx: number, by: number) => {
      // two slightly-sagging strands read as "web", not "laser"
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
      // sagging rings between spokes
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
      // impact flash ring
      if (t < 0.25) {
        ctx.globalAlpha = 1 - t / 0.25;
        ctx.beginPath();
        ctx.arc(0, 0, s.r * (0.6 + t * 4), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const drawSpider = (sp: Spider, now: number) => {
      const t = (now - sp.t0) / 1000;
      if (t > 4.7) return false;
      const rest = h * 0.32;
      const y =
        t < 1.2 ? rest * (1 - Math.exp(-5 * t) * Math.cos(9 * t)) // springy drop
        : t < 4 ? rest + Math.sin((t - 1.2) * 3) * 6 // dangle
        : rest * (1 - ease((t - 4) / 0.6)); // zip up
      const x = sp.x + Math.sin(t * 1.7) * 10;
      ctx.beginPath();
      ctx.moveTo(sp.x, 0);
      ctx.lineTo(x, y - 14);
      ctx.stroke();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 1.7) * 0.12);
      ctx.strokeStyle = ctx.fillStyle = "#1a1020";
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 4; i++) {
        for (const side of [-1, 1]) {
          const a = (-0.9 + i * 0.55 + Math.sin(t * 14 + i * 1.3) * 0.25) * side;
          const kx = side * 16, ky = -10 + i * 7;
          ctx.beginPath();
          ctx.moveTo(side * 5, -2 + i * 3);
          ctx.lineTo(kx, ky);
          ctx.lineTo(kx + side * 10 * Math.cos(a), ky + 12 + Math.abs(Math.sin(a)) * 6);
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.ellipse(0, 6, 10, 12, 0, 0, Math.PI * 2); // abdomen
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -8, 7, 6, 0, 0, Math.PI * 2); // head
      ctx.fill();
      const blink = Math.sin(t * 2.3) > 0.97 ? 0.3 : 1;
      ctx.fillStyle = ctx.shadowColor = "#ff6b8b";
      ctx.shadowBlur = 8;
      for (const ex of [-3, 3]) {
        ctx.beginPath();
        ctx.ellipse(ex, -9, 1.8, 2.2 * blink, 0, 0, Math.PI * 2);
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
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1;
      if (spider && !drawSpider(spider, now)) spider = null;

      if (shots.length || splats.length || spider) kick();
    }

    let last = 0;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const now = performance.now();
      if (now - last < 300) {
        // double-tap: web barrage fanning out around the tap
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          shoot(e.clientX + Math.cos(a) * 120, e.clientY + Math.sin(a) * 90, i * 60);
        }
      } else shoot(e.clientX, e.clientY);
      last = now;
    };

    let timer: ReturnType<typeof setTimeout>;
    const dropSpider = () => {
      if (!document.hidden && !spider) {
        spider = { x: w * (0.15 + Math.random() * 0.7), t0: performance.now() };
        kick();
      }
      timer = setTimeout(dropSpider, 30000 + Math.random() * 20000);
    };
    timer = setTimeout(dropSpider, 6000);

    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", resize);
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 9999 }}
    />
  );
}
