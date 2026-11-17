"use client";

import React, { useEffect, useRef } from "react";

/**
 * Snowfall on one canvas: far specks, mid flakes, near spinning six-armed crystals and a few out-of-focus
 * bokeh flakes drifting past the "lens". Gentle gusts, flutter, glints, flakes that part around the cursor,
 * and a soft drift that slowly builds along the bottom. Sprites are pre-rendered; a frame is drawImage calls.
 */
export function SnowCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    let W = 0, H = 0, DPR = 1, raf = 0, last = performance.now();
    const start = last;
    const pointer = { x: -1e4, y: -1e4 };

    const sprite = (size: number, draw: (g: CanvasRenderingContext2D, c: number) => void) => {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      draw(c.getContext("2d")!, size / 2);
      return c;
    };

    // soft round flake
    const dot = sprite(32, (g, c) => {
      const r = g.createRadialGradient(c, c, 0, c, c, c);
      r.addColorStop(0, "rgba(255,255,255,1)");
      r.addColorStop(0.35, "rgba(255,255,255,.85)");
      r.addColorStop(1, "rgba(230,240,255,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, 32, 32);
    });

    // out-of-focus flake close to the lens: a soft disc with a faint brighter rim
    const bokeh = sprite(96, (g, c) => {
      const r = g.createRadialGradient(c, c, 0, c, c, c);
      r.addColorStop(0, "rgba(235,244,255,.35)");
      r.addColorStop(0.72, "rgba(235,244,255,.28)");
      r.addColorStop(0.86, "rgba(250,252,255,.42)");
      r.addColorStop(1, "rgba(235,244,255,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, 96, 96);
    });

    // six-armed crystals, three designs
    const crystal = (variant: number) =>
      sprite(96, (g, c) => {
        g.translate(c, c);
        g.strokeStyle = "rgba(255,255,255,.95)";
        g.lineCap = "round";
        g.shadowColor = "rgba(200,225,255,.9)";
        g.shadowBlur = 6;
        const L = c * 0.78;
        for (let k = 0; k < 6; k++) {
          g.save();
          g.rotate((k * Math.PI) / 3);
          g.lineWidth = 3.2;
          g.beginPath();
          g.moveTo(0, 0);
          g.lineTo(0, -L);
          g.stroke();
          g.lineWidth = 2.2;
          const branches = variant === 0 ? [0.35, 0.6] : variant === 1 ? [0.5] : [0.28, 0.5, 0.72];
          branches.forEach((f, j) => {
            const b = L * (variant === 1 ? 0.38 : 0.26 - j * 0.04);
            g.beginPath();
            g.moveTo(0, -L * f);
            g.lineTo(-b, -L * f - b * 0.9);
            g.moveTo(0, -L * f);
            g.lineTo(b, -L * f - b * 0.9);
            g.stroke();
          });
          if (variant === 1) {
            g.beginPath(); // little diamond tip
            g.moveTo(0, -L);
            g.lineTo(-L * 0.08, -L * 0.88);
            g.lineTo(0, -L * 0.78);
            g.lineTo(L * 0.08, -L * 0.88);
            g.closePath();
            g.stroke();
          }
          g.restore();
        }
        g.fillStyle = "#fff";
        g.beginPath(); // hexagonal heart
        for (let k = 0; k < 6; k++) g.lineTo(Math.cos((k * Math.PI) / 3) * c * 0.13, Math.sin((k * Math.PI) / 3) * c * 0.13);
        g.fill();
      });
    const crystals = [crystal(0), crystal(1), crystal(2)];

    type Flake = {
      x: number; y: number; z: number; size: number; kind: 0 | 1 | 2; // dot | crystal | bokeh
      img: HTMLCanvasElement; rot: number; spin: number; phase: number; sway: number; push: number;
    };
    let flakes: Flake[] = [];

    function make(anyY: boolean): Flake {
      const z = Math.random();
      const nearCrystal = z > 0.86 && Math.random() < 0.55;
      const lens = z > 0.985; // only a few, so they read as depth, not blobs
      const kind: Flake["kind"] = lens ? 2 : nearCrystal || (z > 0.6 && Math.random() < 0.12) ? 1 : 0;
      const size = (kind === 2 ? rand(26, 46) : kind === 1 ? rand(9, 15) + z * 10 : 1.8 + z * 5) * DPR;
      return {
        x: rand(-0.1, 1.1) * W,
        y: anyY ? rand(-0.1, 1) * H : rand(-0.15, -0.02) * H,
        z, size, kind,
        img: kind === 2 ? bokeh : kind === 1 ? crystals[Math.floor(Math.random() * 3)] : dot,
        rot: Math.random() * Math.PI * 2,
        spin: rand(-0.6, 0.6),
        phase: Math.random() * 100,
        sway: rand(0.6, 1.6),
        push: 0,
      };
    }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 1.5);
      W = canvas.width = window.innerWidth * DPR;
      H = canvas.height = window.innerHeight * DPR;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const n = Math.round(Math.min(520, (window.innerWidth * window.innerHeight) / 2500));
      flakes = Array.from({ length: n }, () => make(true)).sort((a, b) => a.z - b.z); // far first
    }

    // slow gusts: mostly a soft drift to the right, sometimes a lull or a swirl back
    const wind = (s: number) => 0.35 + 0.35 * Math.sin(s * 0.21) + 0.2 * Math.sin(s * 0.53 + 1.7) + 0.12 * Math.sin(s * 1.3 + 0.4);

    function drawDrift(s: number) {
      // a soft bank of snow that builds over the first ~40s
      const grow = Math.min(1, (s + 4) / 40);
      const h = H * 0.055 * grow;
      if (h < 1) return;
      const top = H - h;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20 * DPR) {
        const y = top + Math.sin(x / (170 * DPR) + 1.3) * h * 0.28 + Math.sin(x / (63 * DPR)) * h * 0.1;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, top - h * 0.4, 0, H);
      g.addColorStop(0, "rgba(250,252,255,.92)");
      g.addColorStop(0.35, "rgba(232,240,255,.75)");
      g.addColorStop(1, "rgba(200,216,245,.55)");
      ctx.fillStyle = g;
      ctx.shadowColor = "rgba(220,235,255,.8)";
      ctx.shadowBlur = 18 * DPR;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = (now - start) / 1000;
      const gust = wind(s);
      ctx.clearRect(0, 0, W, H);

      for (const f of flakes) {
        const fall = (14 + f.z * 52) * DPR * (f.kind === 2 ? 1.3 : 1);
        const flutter = Math.sin(s * f.sway + f.phase) * (10 + f.z * 26) * DPR;
        // part around the pointer: a little sideways shove that fades out
        const dx = f.x - pointer.x, dy = f.y - pointer.y, d2 = dx * dx + dy * dy, R = 110 * DPR;
        if (d2 < R * R) f.push += (dx >= 0 ? 1 : -1) * (1 - Math.sqrt(d2) / R) * 260 * DPR * dt;
        f.push *= 0.94;
        f.x += (gust * (12 + f.z * 46) * DPR + f.push) * dt + flutter * dt;
        f.y += fall * dt;
        f.rot += f.spin * dt;
        if (f.y > H + f.size || f.x > W + 60 * DPR || f.x < -60 * DPR) Object.assign(f, make(false), { x: rand(-0.15, 1) * W });

        const glint = Math.pow(Math.max(0, Math.sin(s * 1.7 * f.sway + f.phase * 3)), 24); // brief sparkle
        const alpha = f.kind === 2 ? 0.3 : (0.5 + f.z * 0.5) * (0.9 + glint * 0.3);
        ctx.globalAlpha = Math.min(1, alpha);
        const sz = f.size * (1 + glint * 0.25);
        if (f.kind === 1) {
          ctx.setTransform(1, 0, 0, 1, f.x, f.y);
          ctx.rotate(f.rot);
          ctx.drawImage(f.img, -sz / 2, -sz / 2, sz, sz);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        } else {
          ctx.drawImage(f.img, f.x - sz / 2, f.y - sz / 2, sz, sz);
        }
        if (glint > 0.4 && f.z > 0.5) {
          // four-point twinkle
          const L = (4 + f.z * 7) * DPR * glint;
          ctx.globalAlpha = glint;
          ctx.strokeStyle = "rgba(255,255,255,.9)";
          ctx.lineWidth = 1 * DPR;
          ctx.beginPath();
          ctx.moveTo(f.x - L, f.y);
          ctx.lineTo(f.x + L, f.y);
          ctx.moveTo(f.x, f.y - L);
          ctx.lineTo(f.x, f.y + L);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      drawDrift(s);
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    const onPointer = (e: PointerEvent) => {
      pointer.x = e.clientX * DPR;
      pointer.y = e.clientY * DPR;
    };
    const onLeave = () => {
      pointer.x = pointer.y = -1e4;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer);
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="pml-wx-canvas" />;
}
