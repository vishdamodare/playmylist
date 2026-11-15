"use client";

import React, { useEffect, useRef } from "react";

/**
 * Canvas weather for the effects CSS particles can't sell: a thunderstorm (layered slanted rain, splashes,
 * branching lightning, thunder shake) and a gusty wind (streaks + tumbling leaves, petals and dust).
 * One rAF loop; DPR capped at 1.5 to keep full-screen redraws cheap.
 */
export function WeatherCanvas({ kind }: { kind: "storm" | "wind" }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, DPR = 1, raf = 0, last = performance.now();
    let gSmooth = 0.6; // eased gust strength
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    // gusts: layered sines → smooth 0.25..1.3 with occasional spikes
    const gust = (t: number) => {
      const s = t / 1000;
      const base = 0.55 + 0.25 * Math.sin(s * 0.7) + 0.15 * Math.sin(s * 1.9 + 1.3) + 0.1 * Math.sin(s * 4.1 + 0.4);
      const spike = Math.max(0, Math.sin(s * 0.33 + 2)) ** 8 * 0.6;
      return Math.max(0.25, base + spike);
    };

    // ── storm state ──
    type Drop = { x: number; y: number; z: number; len: number; v: number };
    type Splash = { x: number; y: number; vx: number; vy: number; life: number };
    type Bolt = { segs: [number, number, number, number, number][]; born: number; strobes: number[]; img: HTMLCanvasElement };
    let drops: Drop[] = [];
    const splashes: Splash[] = [];
    let bolt: Bolt | null = null;
    let nextBolt = performance.now() + 1500;
    let flash = 0;

    // ── wind state ──
    type Streak = { x: number; y: number; len: number; v: number; phase: number; a: number };
    type Debris = { x: number; y: number; z: number; kind: 0 | 1 | 2; rot: number; spin: number; flip: number; phase: number; color: string; size: number };
    let streaks: Streak[] = [];
    let streakSprites: HTMLCanvasElement[] = [];
    let debris: Debris[] = [];
    const LEAF = ["#c8693a", "#e0a040", "#a8452c", "#8f9a3c", "#d98b3a"];
    const PETAL = ["#f6b8c8", "#ffd2dc", "#f29cb4"];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 1.5);
      W = canvas.width = window.innerWidth * DPR;
      H = canvas.height = window.innerHeight * DPR;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const area = (W * H) / (DPR * DPR);
      if (kind === "storm") {
        drops = Array.from({ length: Math.round(area / 2600) }, () => {
          const z = Math.random();
          return { x: rand(-W * 0.3, W), y: rand(-H, H), z, len: (14 + z * 26) * DPR, v: (900 + z * 900) * DPR };
        });
      } else {
        // three pre-drawn curved streaks; per frame we only stretch and place them
        streakSprites = [0, 1, 2].map((v) => {
          const c = document.createElement("canvas");
          c.width = Math.ceil(340 * DPR);
          c.height = Math.ceil(60 * DPR);
          const g2 = c.getContext("2d")!;
          const gr = g2.createLinearGradient(0, 0, c.width, 0);
          gr.addColorStop(0, "rgba(255,255,255,0)");
          gr.addColorStop(1, "rgba(240,245,255,1)");
          g2.strokeStyle = gr;
          g2.lineWidth = 1.3 * DPR;
          g2.lineCap = "round";
          const m = c.height / 2, w = c.width, a = (10 + v * 6) * DPR;
          g2.beginPath();
          g2.moveTo(0, m + a);
          g2.bezierCurveTo(w * 0.4, m - a, w * 0.7, m + a * 0.6, w - 2, m);
          g2.stroke();
          return c;
        });
        streaks = Array.from({ length: 34 }, () => ({
          x: rand(-W, W),
          y: rand(0, H),
          len: rand(120, 340) * DPR,
          v: rand(900, 1700) * DPR,
          phase: rand(0, 6.28),
          a: rand(0.05, 0.16),
        }));
        debris = Array.from({ length: Math.round(area / 22000) + 26 }, () => {
          const r = Math.random();
          const k = (r < 0.55 ? 0 : r < 0.8 ? 1 : 2) as 0 | 1 | 2; // leaf / petal / dust
          return {
            x: rand(-W * 0.2, W),
            y: rand(0, H),
            z: Math.random(),
            kind: k,
            rot: rand(0, 6.28),
            spin: rand(-4, 4),
            flip: rand(0, 6.28),
            phase: rand(0, 6.28),
            color: k === 0 ? LEAF[Math.floor(Math.random() * LEAF.length)] : PETAL[Math.floor(Math.random() * PETAL.length)],
            size: (k === 0 ? rand(9, 17) : k === 1 ? rand(5, 9) : rand(1.2, 2.6)) * DPR,
          };
        });
      }
    }

    // jagged bolt with forks, from the top down to ~60–90% of the height
    function makeBolt(now: number): Bolt {
      const segs: Bolt["segs"] = [];
      const grow = (x: number, y: number, ang: number, width: number, depth: number) => {
        const endY = H * rand(0.62, 0.92) * (depth ? 0.75 : 1);
        while (y < endY && segs.length < 260) {
          const step = rand(10, 26) * DPR;
          const nx = x + Math.sin(ang) * step + rand(-12, 12) * DPR;
          const ny = y + Math.cos(ang) * step;
          segs.push([x, y, nx, ny, width]);
          if (depth < 2 && Math.random() < 0.07) grow(nx, ny, ang + rand(-0.9, 0.9), width * 0.55, depth + 1);
          x = nx;
          y = ny;
          ang = Math.max(-0.7, Math.min(0.7, ang + rand(-0.25, 0.25)));
          if (depth && Math.random() < 0.06) break;
        }
      };
      grow(rand(W * 0.15, W * 0.85), -10, rand(-0.2, 0.2), 3.2 * DPR, 0);
      // draw it once (the glow blur on hundreds of segments was too heavy to repeat every strobe frame)
      const img = document.createElement("canvas");
      img.width = W;
      img.height = H;
      const b = img.getContext("2d")!;
      b.lineCap = "round";
      b.shadowColor = "rgba(160,180,255,.95)";
      b.shadowBlur = 26 * DPR;
      b.strokeStyle = "rgba(235,240,255,.95)";
      for (const [x1, y1, x2, y2, w] of segs) {
        b.lineWidth = w;
        b.beginPath();
        b.moveTo(x1, y1);
        b.lineTo(x2, y2);
        b.stroke();
      }
      return { segs, born: now, strobes: [0, rand(90, 140), rand(220, 320)], img };
    }

    function thunder() {
      // the page shudders a moment after the flash (transform only on <main>, never the fixed layers)
      const main = document.querySelector<HTMLElement>(".pml-mood-body");
      setTimeout(
        () =>
          main?.animate(
            [
              { transform: "translate(0,0)" },
              { transform: "translate(-5px,3px)" },
              { transform: "translate(4px,-3px)" },
              { transform: "translate(-3px,2px)" },
              { transform: "translate(2px,-1px)" },
              { transform: "translate(0,0)" },
            ],
            { duration: 520, easing: "ease-out" }
          ),
        rand(250, 700)
      );
    }

    function drawStorm(now: number, dt: number) {
      const g = gust(now);
      const slant = 0.18 + g * 0.22; // horizontal drift per unit fall
      ctx.clearRect(0, 0, W, H);

      // rain in three depth buckets (one stroke per bucket keeps it fast)
      for (let b = 0; b < 3; b++) {
        ctx.beginPath();
        for (const d of drops) {
          if (Math.min(2, Math.floor(d.z * 3)) !== b) continue;
          d.y += d.v * dt;
          d.x += d.v * slant * dt;
          if (d.y > H) {
            if (d.z > 0.55 && Math.random() < 0.35 && splashes.length < 160)
              for (let k = 0; k < 2; k++)
                splashes.push({ x: d.x, y: H - rand(0, H * 0.06), vx: rand(-1, 1) * 90 * DPR, vy: -rand(80, 200) * DPR, life: 1 });
            d.y = rand(-H * 0.3, -d.len);
            d.x = rand(-W * 0.35, W);
          }
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.len * slant, d.y - d.len);
        }
        ctx.strokeStyle = `rgba(200,215,240,${[0.18, 0.3, 0.5][b]})`;
        ctx.lineWidth = [0.8, 1.1, 1.6][b] * DPR;
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(210,225,245,.55)";
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.life -= dt * 2.6;
        s.vy += 600 * DPR * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.life <= 0) splashes.splice(i, 1);
        else ctx.fillRect(s.x, s.y, 1.6 * DPR, 1.6 * DPR);
      }

      if (!bolt && now > nextBolt) {
        bolt = makeBolt(now);
        thunder();
        nextBolt = now + rand(2800, 7500);
      }
      if (bolt) {
        const age = now - bolt.born;
        if (bolt.strobes.some((s) => age >= s && age < s + 70)) {
          flash = 1;
          ctx.drawImage(bolt.img, 0, 0);
        }
        if (age > 420) bolt = null;
      }
      if (flash > 0.01) {
        const fx = bolt?.segs[0]?.[0] ?? W / 2;
        const fg = ctx.createRadialGradient(fx, 0, 0, fx, 0, Math.max(W, H) * 0.9);
        fg.addColorStop(0, `rgba(215,225,255,${0.55 * flash})`);
        fg.addColorStop(1, `rgba(170,190,255,${0.12 * flash})`);
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, W, H);
        flash *= Math.pow(0.02, dt);
      }
    }

    function drawWind(now: number, dt: number) {
      gSmooth += (gust(now) - gSmooth) * Math.min(1, dt * 1.6);
      const g = gSmooth;
      const t = now / 1000;
      ctx.clearRect(0, 0, W, H);

      for (const s of streaks) {
        s.x += s.v * g * dt;
        if (s.x - s.len > W) {
          s.x = rand(-W * 0.6, -s.len);
          s.y = rand(0, H);
        }
        const sp = streakSprites[Math.floor(s.phase) % 3];
        const k = 0.55 + 0.45 * Math.sin(t * 2 + s.phase); // the streak breathes up and down
        ctx.globalAlpha = Math.min(1, s.a * Math.min(1.4, g) * 1.4);
        ctx.drawImage(sp, s.x - s.len, s.y - (sp.height * k) / 2, s.len, sp.height * k);
      }

      ctx.globalAlpha = 1;
      for (const d of debris) {
        d.x += (260 + d.z * 520) * DPR * g * dt;
        d.y += (Math.sin(t * 1.7 + d.phase) * 60 + 25 - g * 35) * DPR * dt;
        d.rot += d.spin * g * dt;
        d.flip += (2 + d.z * 3) * g * dt;
        if (d.x > W + 40 || d.y > H + 40 || d.y < -60) {
          d.x = rand(-W * 0.4, -20);
          d.y = rand(-H * 0.1, H * 0.95);
        }
        const cr = Math.cos(d.rot), sr = Math.sin(d.rot), f = Math.cos(d.flip); // rotate, then squash = 3D tumble
        ctx.setTransform(cr, sr, -sr * f, cr * f, d.x, d.y);
        ctx.globalAlpha = 0.45 + d.z * 0.55;
        const s = d.size * (0.6 + d.z * 0.7);
        if (d.kind === 0) {
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.moveTo(-s, 0);
          ctx.quadraticCurveTo(0, -s * 0.75, s, 0);
          ctx.quadraticCurveTo(0, s * 0.75, -s, 0);
          ctx.fill();
          ctx.strokeStyle = "rgba(60,30,10,.45)";
          ctx.lineWidth = 0.8 * DPR;
          ctx.beginPath();
          ctx.moveTo(-s * 1.25, 0);
          ctx.lineTo(s * 0.8, 0);
          ctx.stroke();
        } else if (d.kind === 1) {
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "rgba(230,215,190,.8)";
          ctx.fillRect(-s / 2, -s / 2, s, s);
        }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (kind === "storm") drawStorm(now, dt);
      else drawWind(now, dt);
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [kind]);

  return (
    <div className={`pml-page-weather pml-wx pml-wx-${kind}`} aria-hidden="true">
      {kind === "storm" && (
        <>
          <div className="pml-storm-sky" />
          <div className="pml-storm-clouds" />
        </>
      )}
      <canvas ref={ref} className="pml-wx-canvas" />
      {kind === "storm" && <div className="pml-storm-mist" />}
    </div>
  );
}
