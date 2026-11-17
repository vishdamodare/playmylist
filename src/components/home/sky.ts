/**
 * Home-page sky: a layered night ↔ dawn scene on one canvas.
 *
 * Static layers (star field, Milky Way, moon, hills, skyline, clouds) are pre-rendered to offscreen canvases
 * on resize, so a frame is mostly drawImage calls. Morning/night crossfade by `progress` (0 = night, 1 = dawn),
 * which eases toward `target.current`. Pointer position adds a little parallax per layer.
 */

import { createStreet, type Roof } from "./street";

type RGB = [number, number, number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; // ≈ N(0, .5)

function off(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return [c, c.getContext("2d")!] as const;
}

interface Win { x: number; y: number; w: number; h: number; warm: boolean; phase: number; flicker: boolean }
interface Cloud { sprite: HTMLCanvasElement; x: number; y: number; s: number; v: number; depth: number }
interface Shooting { x: number; y: number; vx: number; vy: number; life: number; born: number }
interface Twinkle { x: number; y: number; r: number; phase: number; speed: number; tint: RGB; spike: boolean }
interface Drifter { x: number; y: number; ph: number; sp: number; r: number }
interface Beacon { x: number; y: number; ph: number }

/** Soft round glow, pre-rendered once so dozens of particles cost a drawImage each. */
function glowSprite(rgb: string) {
  const [c, g] = off(64, 64);
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, `rgba(${rgb},1)`);
  rg.addColorStop(0.18, `rgba(${rgb},.55)`);
  rg.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = rg;
  g.fillRect(0, 0, 64, 64);
  return c;
}

export function startSky(canvas: HTMLCanvasElement, ambient: HTMLElement, target: { current: number }): () => void {
  const ctx = canvas.getContext("2d")!;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, DPR = 1, horizon = 0;
  let progress = target.current;
  let pointer = { x: 0, y: 0 };
  const par = { x: 0, y: 0 };
  let raf = 0, last = performance.now();

  let starField: HTMLCanvasElement, milky: HTMLCanvasElement, moon: HTMLCanvasElement;
  let litNight: HTMLCanvasElement, litDay: HTMLCanvasElement, flickers: Win[] = [];
  let dawnBg: HTMLCanvasElement, raysSprite: HTMLCanvasElement, sunSprite: HTMLCanvasElement;
  let sunR = 0;
  let nightBg: HTMLCanvasElement;
  const RAY_R = 15; // ray sprite radius, in sun radii
  const SUN_R = 9; // glow sprite radius, in sun radii
  let cityNight: HTMLCanvasElement, cityDay: HTMLCanvasElement, hillsNight: HTMLCanvasElement, hillsDay: HTMLCanvasElement;
  let windows: Win[] = [];
  let twinkles: Twinkle[] = [];
  let nightClouds: Cloud[] = [], dayClouds: Cloud[] = [];
  const shooting: Shooting[] = [];
  let nextShot = 2500;
  let birdsT = -60000;
  let aurora: HTMLCanvasElement;
  let fireflies: Drifter[] = [], motes: Drifter[] = [], beacons: Beacon[] = [];
  const fireGlow = glowSprite("230,255,150"), moteGlow = glowSprite("255,220,150"), redGlow = glowSprite("255,70,60");
  let planeT = 4000; // first plane a few seconds in
  const street = createStreet(ctx); // train, people, lamps, wires, rooftop cat
  let roofs: Roof[] = [];
  let farNight: HTMLCanvasElement, farDay: HTMLCanvasElement, fogNight: HTMLCanvasElement, fogDay: HTMLCanvasElement;

  // ── builders (run on resize) ──────────────────────────────
  function buildStars() {
    const [c, g] = off(W * 1.1, H);
    const n = Math.floor((W * H) / (3800 * DPR * DPR));
    for (let i = 0; i < n; i++) {
      const r = Math.random() < 0.92 ? rand(0.25, 0.7) : rand(0.7, 1.2);
      g.fillStyle = `rgba(${Math.random() < 0.2 ? "200,215,255" : "245,238,230"},${rand(0.15, 0.6)})`;
      g.beginPath();
      g.arc(Math.random() * c.width, Math.random() * H * 0.86, r * DPR, 0, Math.PI * 2);
      g.fill();
    }
    starField = c;
    twinkles = Array.from({ length: 130 }, (_, i) => ({
      x: Math.random() * W,
      y: Math.pow(Math.random(), 1.3) * H * 0.78,
      r: rand(0.8, 1.7) * DPR,
      phase: Math.random() * Math.PI * 2,
      speed: rand(0.6, 2.2),
      tint: (Math.random() < 0.25 ? [190, 210, 255] : Math.random() < 0.15 ? [255, 214, 170] : [250, 244, 236]) as RGB,
      spike: i < 9,
    }));
  }

  function buildMilkyWay() {
    const [c, g] = off(W, H);
    const x0 = -W * 0.1, y0 = H * 0.08, x1 = W * 1.1, y1 = H * 0.52;
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len;
    const width = Math.min(W, H) * 0.16;
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      const cx = x0 + dx * t + nx * gauss() * width * 0.3, cy = y0 + dy * t + ny * gauss() * width * 0.3;
      const rr = width * rand(0.7, 1.4);
      const hue = ["150,120,230", "120,150,240", "230,150,200"][i % 3];
      const rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
      rg.addColorStop(0, `rgba(${hue},${rand(0.07, 0.13)})`);
      rg.addColorStop(1, `rgba(${hue},0)`);
      g.fillStyle = rg;
      g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
    }
    const dust = Math.floor((W * H) / (900 * DPR * DPR));
    for (let i = 0; i < dust; i++) {
      const t = Math.random(), o = gauss() * width * 0.9;
      g.fillStyle = `rgba(240,235,255,${Math.max(0, rand(0.08, 0.5) * (1 - Math.abs(o) / (width * 1.4)))})`;
      g.fillRect(x0 + dx * t + nx * o, y0 + dy * t + ny * o, rand(0.4, 1.1) * DPR, rand(0.4, 1.1) * DPR);
    }
    g.globalCompositeOperation = "destination-out"; // dark dust lanes
    for (let i = 0; i < 14; i++) {
      const t = rand(0.05, 0.95);
      const cx = x0 + dx * t + nx * gauss() * width * 0.15, cy = y0 + dy * t + ny * gauss() * width * 0.15;
      const rr = width * rand(0.15, 0.35);
      const rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
      rg.addColorStop(0, "rgba(0,0,0,.45)");
      rg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = rg;
      g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
    }
    milky = c;
  }

  function buildAurora() {
    // Vertical light curtains along a wavy line, blurred into soft ribbons; strongest left of the moon.
    const aw = W * 1.4, ah = H * 0.55;
    const [raw, g] = off(aw, ah);
    const step = 2 * DPR;
    for (let x = 0; x < aw; x += step) {
      const base = ah * 0.62 + Math.sin(x * 0.0035 / DPR) * ah * 0.12 + Math.sin(x * 0.011 / DPR) * ah * 0.04;
      const tall = ah * (0.22 + 0.3 * Math.abs(Math.sin(x * 0.0052 / DPR + 1.3)));
      const k = Math.pow(Math.sin(Math.PI * Math.min(1, x / (aw * 0.75))), 1.5) * (0.6 + 0.4 * Math.random());
      const violet = 0.5 + 0.5 * Math.sin(x * 0.0021 / DPR);
      const gr = g.createLinearGradient(0, base - tall, 0, base + ah * 0.04);
      gr.addColorStop(0, `rgba(${Math.round(lerp(90, 170, violet))},${Math.round(lerp(255, 120, violet))},${Math.round(lerp(200, 255, violet))},0)`);
      gr.addColorStop(0.75, `rgba(${Math.round(lerp(110, 190, violet))},${Math.round(lerp(255, 150, violet))},${Math.round(lerp(190, 255, violet))},${0.34 * k})`);
      gr.addColorStop(0.92, `rgba(150,255,210,${0.6 * k})`);
      gr.addColorStop(1, "rgba(140,255,200,0)");
      g.fillStyle = gr;
      g.fillRect(x, base - tall, step + 1, tall + ah * 0.04);
    }
    const [c, gc] = off(aw, ah);
    gc.filter = `blur(${7 * DPR}px)`;
    gc.drawImage(raw, 0, 0);
    aurora = c;
  }

  function buildParticles() {
    fireflies = Array.from({ length: Math.round(18 + W / DPR / 60) }, () => ({
      x: Math.random() * W, y: rand(0.74, 0.97) * H, ph: Math.random() * 100, sp: rand(0.6, 1.4), r: rand(9, 15) * DPR,
    }));
    motes = Array.from({ length: Math.round(26 + W / DPR / 45) }, () => ({
      x: Math.random() * W, y: Math.random() * H, ph: Math.random() * 100, sp: rand(0.5, 1.5), r: rand(3, 7) * DPR,
    }));
  }

  function buildMoon() {
    const R = Math.min(W, H) * 0.062, size = R * 2.4;
    const [c, g] = off(size, size);
    const cx = size / 2, cy = size / 2;
    const disk = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
    disk.addColorStop(0, "#fffdf4");
    disk.addColorStop(0.6, "#ebe5d2");
    disk.addColorStop(1, "#c8c0a8");
    g.fillStyle = disk;
    g.beginPath();
    g.arc(cx, cy, R, 0, Math.PI * 2);
    g.fill();
    g.save();
    g.clip();
    ([[-0.25, -0.15, 0.42], [0.2, 0.25, 0.3], [-0.05, 0.38, 0.22]] as const).forEach(([ox, oy, rr]) => {
      const rg = g.createRadialGradient(cx + ox * R, cy + oy * R, 0, cx + ox * R, cy + oy * R, rr * R);
      rg.addColorStop(0, "rgba(120,110,95,.28)");
      rg.addColorStop(1, "rgba(120,110,95,0)");
      g.fillStyle = rg;
      g.fillRect(0, 0, size, size);
    });
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * R * 0.9;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, rr = rand(0.03, 0.11) * R;
      g.fillStyle = "rgba(90,80,70,.16)";
      g.beginPath();
      g.arc(x, y, rr, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,255,250,.18)";
      g.beginPath();
      g.arc(x - rr * 0.25, y - rr * 0.25, rr * 0.7, 0, Math.PI * 2);
      g.fill();
    }
    // crescent with a soft terminator; the dark side keeps a faint earthshine
    g.globalCompositeOperation = "source-atop";
    g.filter = `blur(${R * 0.07}px)`;
    g.fillStyle = "rgba(10,12,32,.9)";
    g.beginPath();
    g.arc(cx + R * 0.5, cy - R * 0.18, R * 0.98, 0, Math.PI * 2);
    g.fill();
    g.restore();
    moon = c;
  }

  function cloudSprite(day: boolean) {
    // One merged cloud mass (solid circles → slight blur), then shaded top-to-bottom like real cumulus.
    // Padding keeps the soft edge inside the canvas so it never gets clipped into a hard line.
    const w = rand(280, 480) * DPR, h = w * rand(0.32, 0.42), pad = h * 0.35;
    const [c, g] = off(w + pad * 2, h + pad * 2);
    g.translate(pad, pad);
    g.filter = `blur(${h * 0.035}px)`;
    g.fillStyle = "#fff";
    const base = h * 0.78;
    g.beginPath();
    g.ellipse(w / 2, base - h * 0.08, w * 0.44, h * 0.14, 0, 0, Math.PI * 2); // flat base
    g.fill();
    const lumps = 9 + Math.floor(Math.random() * 5);
    for (let i = 0; i < lumps; i++) {
      const x = w * (0.12 + (0.76 * i) / (lumps - 1)) + rand(-0.03, 0.03) * w;
      const dome = Math.sin(((x / w - 0.08) / 0.84) * Math.PI);
      const r = h * (0.14 + 0.24 * dome) * rand(0.8, 1.1);
      g.beginPath();
      g.arc(x, base - r * 0.75 - dome * h * 0.08, r, 0, Math.PI * 2);
      g.fill();
    }
    g.filter = "none";
    // shade: lit tops, coloured undersides
    g.globalCompositeOperation = "source-atop";
    const shade = g.createLinearGradient(0, base - h * 0.75, 0, base);
    if (day) {
      shade.addColorStop(0, "#fff7ee");
      shade.addColorStop(0.45, "#ffd9c8");
      shade.addColorStop(0.8, "#f0a0a0");
      shade.addColorStop(1, "#d07a8e");
    } else {
      shade.addColorStop(0, "#9aa2d6");
      shade.addColorStop(0.5, "#4c5292");
      shade.addColorStop(1, "#262a5c");
    }
    g.fillStyle = shade;
    g.fillRect(-pad, -pad, w + pad * 2, h + pad * 2);
    // rim light on the side facing the sun / moon (both sit to the right)
    const rim = g.createLinearGradient(w + pad, -pad, w * 0.35, h * 0.6);
    rim.addColorStop(0, day ? "rgba(255,226,160,.85)" : "rgba(225,230,255,.7)");
    rim.addColorStop(0.45, day ? "rgba(255,210,140,.25)" : "rgba(200,210,255,.18)");
    rim.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = rim;
    g.fillRect(-pad, -pad, w + pad * 2, h + pad * 2);
    return c;
  }

  function buildClouds() {
    const make = (day: boolean, n: number): Cloud[] =>
      Array.from({ length: n }, () => {
        const depth = Math.random();
        return {
          sprite: cloudSprite(day),
          x: Math.random() * W,
          y: (day ? rand(0.02, 0.26) : rand(0.04, 0.3)) * H,
          s: 0.6 + depth * 0.7,
          v: (6 + depth * 14) * DPR,
          depth,
        };
      });
    nightClouds = make(false, 5);
    dayClouds = make(true, 7);
  }

  function buildGround() {
    horizon = H * 0.8;
    // far hills, one tint per mode
    // two rolling ridges, smoothed with curves; the far one paler (atmospheric haze)
    const ridge = (w: number, h: number, top: number, amp: number, seed: number) => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 40; i++) {
        const u = ((i / 40) * w) / DPR / 140 + seed; // by real width, so phones get the same gentle slopes
        const n = 0.5 * Math.sin(u * 0.9) + 0.3 * Math.sin(u * 2.3 + 1.7) + 0.2 * Math.sin(u * 5.1 + 0.4);
        pts.push([(i / 40) * w, h * (top + amp * n)]);
      }
      const p = new Path2D();
      p.moveTo(0, h);
      p.lineTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++)
        p.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
      p.lineTo(w, pts[pts.length - 1][1]);
      p.lineTo(w, h);
      p.closePath();
      return p;
    };
    const hw = W * 1.06, hh = H * 0.36;
    const far = ridge(hw, hh, 0.3, 0.22, 2.1), near = ridge(hw, hh, 0.55, 0.16, 7.4);
    const paint = (g: CanvasRenderingContext2D, stops: [string, string, string, string]) => {
      const a = g.createLinearGradient(0, hh * 0.1, 0, hh);
      a.addColorStop(0, stops[0]);
      a.addColorStop(1, stops[1]);
      g.fillStyle = a;
      g.fill(far);
      const b = g.createLinearGradient(0, hh * 0.35, 0, hh);
      b.addColorStop(0, stops[2]);
      b.addColorStop(1, stops[3]);
      g.fillStyle = b;
      g.fill(near);
    };
    const [hn, gn] = off(hw, hh);
    paint(gn, ["#3b3172", "#261f50", "#211a46", "#151030"]);
    const [hd, gd] = off(hw, hh);
    paint(gd, ["#d68a8e", "#b0607a", "#9a5068", "#4a2236"]);
    hillsNight = hn;
    hillsDay = hd;

    // city skyline
    const cw = W * 1.08, ch = H * 0.32;
    const path = new Path2D();
    windows = [];
    beacons = [];
    roofs = [];
    let x = 0;
    while (x < cw) {
      const bw = rand(34, 96) * DPR;
      const bh = (Math.random() < 0.18 ? rand(0.17, 0.26) : rand(0.06, 0.15)) * H;
      const y = ch - bh;
      path.rect(x, y, bw, bh + 2);
      roofs.push({ x, y, w: bw });
      if (bh > H * 0.15 && Math.random() < 0.6) {
        path.rect(x + bw * 0.45, y - H * 0.03, 2 * DPR, H * 0.03);
        beacons.push({ x: x + bw * 0.45 + DPR, y: y - H * 0.03, ph: Math.random() * 2 });
      }
      if (Math.random() < 0.3) path.rect(x + bw * 0.15, y - 8 * DPR, bw * 0.7, 8 * DPR);
      const cols = Math.max(2, Math.floor(bw / (11 * DPR))), rows = Math.floor(bh / (14 * DPR));
      for (let r = 1; r < rows; r++)
        for (let k = 0; k < cols; k++)
          if (Math.random() < 0.34)
            windows.push({
              x: x + (k + 0.3) * (bw / cols),
              y: y + r * 14 * DPR,
              w: 4 * DPR,
              h: 6 * DPR,
              warm: Math.random() < 0.78,
              phase: Math.random() * 10,
              flicker: Math.random() < 0.06,
            });
      x += bw; // buildings touch: gaps let the bright mist leak through as slits
    }
    path.rect(0, ch - H * 0.035, cw, H * 0.035 + 2);
    const [cn, gcn] = off(cw, ch);
    const ng = gcn.createLinearGradient(0, 0, 0, ch);
    ng.addColorStop(0, "#272152");
    ng.addColorStop(1, "#141030");
    gcn.fillStyle = ng;
    gcn.fill(path);
    gcn.save();
    gcn.clip(path);
    const moonRim = gcn.createLinearGradient(cw, 0, cw * 0.3, 0); // moonlight from the right
    moonRim.addColorStop(0, "rgba(170,180,255,.22)");
    moonRim.addColorStop(1, "rgba(170,180,255,0)");
    gcn.fillStyle = moonRim;
    gcn.fillRect(0, 0, cw, ch * 0.5);
    gcn.restore();
    const [cd, gcd] = off(cw, ch);
    const dg = gcd.createLinearGradient(0, 0, 0, ch);
    dg.addColorStop(0, "#3a1b2e");
    dg.addColorStop(1, "#160a14");
    gcd.fillStyle = dg;
    gcd.fill(path);
    gcd.save();
    gcd.clip(path);
    const rim = gcd.createLinearGradient(cw, 0, 0, 0); // warm rim light from the sun side
    rim.addColorStop(0, "rgba(255,170,100,.4)");
    rim.addColorStop(1, "rgba(255,170,100,0)");
    gcd.fillStyle = rim;
    gcd.fillRect(0, 0, cw, ch * 0.5);
    gcd.restore();
    cityNight = cn;
    cityDay = cd;

    // Lit windows pre-rendered once (drawing ~1500 rects per frame was the sky's biggest cost).
    const [ln, gln] = off(cw, ch);
    const [ld, gld] = off(cw, ch);
    flickers = [];
    windows.forEach((w, i) => {
      if (w.flicker) return flickers.push(w);
      gln.fillStyle = w.warm ? "rgba(255,210,130,.85)" : "rgba(180,215,255,.75)";
      gln.fillRect(w.x, w.y, w.w, w.h);
      if (i % 7 === 0) {
        gld.fillStyle = "rgba(255,200,130,.55)";
        gld.fillRect(w.x, w.y, w.w, w.h);
      }
    });
    litNight = ln;
    litDay = ld;

    // a lower, hazier skyline further away: depth without detail
    const farPath = new Path2D();
    const farLights: [number, number][] = [];
    for (let fx = 0; fx < cw; ) {
      const bw = rand(18, 52) * DPR, bh = (Math.random() < 0.12 ? rand(0.12, 0.17) : rand(0.04, 0.11)) * H;
      farPath.rect(fx, ch - bh, bw, bh + 2);
      if (Math.random() < 0.25) farPath.rect(fx + bw * 0.5, ch - bh - H * 0.018, 1.5 * DPR, H * 0.018);
      for (let k = 0; k < bh / (9 * DPR); k++) if (Math.random() < 0.18) farLights.push([fx + rand(0.15, 0.85) * bw, ch - bh + k * 9 * DPR + 4 * DPR]);
      fx += bw + (Math.random() < 0.3 ? rand(4, 20) * DPR : 0);
    }
    const [fn, gfn] = off(cw, ch);
    gfn.fillStyle = "#332c62";
    gfn.fill(farPath);
    gfn.fillStyle = "rgba(255,200,140,.5)";
    farLights.forEach(([lx, ly]) => gfn.fillRect(lx, ly, 2 * DPR, 2.5 * DPR));
    const [fd, gfd] = off(cw, ch);
    const fg = gfd.createLinearGradient(0, ch * 0.4, 0, ch);
    fg.addColorStop(0, "#b8667a");
    fg.addColorStop(1, "#8a4660");
    gfd.fillStyle = fg;
    gfd.fill(farPath);
    farNight = fn;
    farDay = fd;

    // drifting fog bank: soft blobs that wrap at the edges so the strip tiles seamlessly
    const fogBank = (rgb: string) => {
      const fw = Math.ceil(W * 1.2), fh = Math.ceil(H * 0.2);
      const [c, g] = off(fw, fh);
      g.filter = `blur(${fh * 0.12}px)`;
      for (let i = 0; i < 26; i++) {
        const bx = Math.random() * fw, by = fh * rand(0.45, 0.7), rx = rand(0.08, 0.2) * fw, ry = fh * rand(0.12, 0.25);
        g.fillStyle = `rgba(${rgb},${rand(0.25, 0.5)})`;
        for (const dx of [-fw, 0, fw]) {
          g.beginPath();
          g.ellipse(bx + dx, by, rx, ry, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
      return c;
    };
    fogNight = fogBank("150,150,215");
    fogDay = fogBank("255,205,185");
  }

  function buildSun() {
    sunR = Math.min(W, H) * 0.058;
    const r = sunR;

    // dawn sky + haze where the risen sun sits
    const [bg, gb] = off(W, H);
    const sky = gb.createLinearGradient(0, 0, 0, H);
    ([[0, "#1d2a5e"], [0.32, "#5b3f86"], [0.55, "#c0607e"], [0.72, "#f08a5e"], [0.86, "#ffc078"], [1, "#ffe0a8"]] as const).forEach(
      ([o, c]) => sky.addColorStop(o, c)
    );
    gb.fillStyle = sky;
    gb.fillRect(0, 0, W, H);
    const hx = W * 0.87;
    const haze = gb.createRadialGradient(hx, H * 0.8, 0, hx, H * 0.8, Math.max(W, H) * 0.7);
    haze.addColorStop(0, "rgba(255,200,130,.45)");
    haze.addColorStop(0.5, "rgba(255,150,100,.14)");
    haze.addColorStop(1, "rgba(255,150,100,0)");
    gb.fillStyle = haze;
    gb.fillRect(0, 0, W, H);
    dawnBg = bg;

    const [nb, gn] = off(W, H);
    const ns = gn.createLinearGradient(0, 0, 0, H);
    ([[0, "#03020a"], [0.55, "#0a0618"], [0.82, "#171030"], [1, "#2a1530"]] as const).forEach(([o, c]) => ns.addColorStop(o, c));
    gn.fillStyle = ns;
    gn.fillRect(0, 0, W, H);
    const lp = gn.createRadialGradient(W * 0.5, H, 0, W * 0.5, H, H * 0.6); // city glow
    lp.addColorStop(0, "rgba(255,140,90,.16)");
    lp.addColorStop(1, "rgba(255,140,90,0)");
    gn.fillStyle = lp;
    gn.fillRect(0, 0, W, H);
    const hz = gn.createRadialGradient(W * 0.5, H * 0.86, 0, W * 0.5, H * 0.86, Math.max(W, H) * 0.75); // anime-style horizon glow
    hz.addColorStop(0, "rgba(120,100,210,.34)");
    hz.addColorStop(0.45, "rgba(90,70,170,.14)");
    hz.addColorStop(1, "rgba(90,70,170,0)");
    gn.fillStyle = hz;
    gn.fillRect(0, 0, W, H);
    nightBg = nb;

    // rays, half resolution (they're soft anyway)
    const q = 0.5, R = RAY_R * r * q;
    const [rc, gr] = off(R * 2, R * 2);
    gr.translate(R, R);
    gr.globalCompositeOperation = "lighter";
    for (let i = 0; i < 22; i++) {
      const ang = (Math.PI * 2 * i) / 22 + Math.sin(i * 7.3) * 0.08;
      const len = r * q * (9 + 6 * Math.abs(Math.sin(i * 3.1)));
      const half = 0.012 + 0.018 * Math.abs(Math.sin(i * 5.7));
      const rg = gr.createRadialGradient(0, 0, r * q * 0.9, 0, 0, len);
      const k = 0.55 + 0.45 * Math.abs(Math.sin(i * 2.3));
      rg.addColorStop(0, `rgba(255,236,200,${0.16 * k})`);
      rg.addColorStop(0.5, `rgba(255,214,170,${0.05 * k})`);
      rg.addColorStop(1, "rgba(255,214,170,0)");
      gr.fillStyle = rg;
      gr.beginPath();
      gr.moveTo(Math.cos(ang - half * 3) * r * q * 0.9, Math.sin(ang - half * 3) * r * q * 0.9);
      gr.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
      gr.lineTo(Math.cos(ang + half * 3) * r * q * 0.9, Math.sin(ang + half * 3) * r * q * 0.9);
      gr.closePath();
      gr.fill();
    }
    raysSprite = rc;

    // glow + bloom + disc + white-hot centre
    const S = SUN_R * r;
    const [sc, gs] = off(S * 2, S * 2);
    const c = S;
    const glow = gs.createRadialGradient(c, c, 0, c, c, r * 4.4);
    glow.addColorStop(0, "rgba(255,250,230,.95)");
    glow.addColorStop(0.3, "rgba(255,210,150,.34)");
    glow.addColorStop(1, "rgba(255,160,90,0)");
    gs.fillStyle = glow;
    gs.fillRect(0, 0, S * 2, S * 2);
    gs.globalCompositeOperation = "lighter";
    const bloom = gs.createRadialGradient(c, c, r * 0.8, c, c, S);
    bloom.addColorStop(0, "rgba(255,214,150,.22)");
    bloom.addColorStop(1, "rgba(255,180,110,0)");
    gs.fillStyle = bloom;
    gs.fillRect(0, 0, S * 2, S * 2);
    gs.globalCompositeOperation = "source-over";
    const core = gs.createRadialGradient(c, c, 0, c, c, r * 1.15);
    core.addColorStop(0, "rgba(255,255,255,1)");
    core.addColorStop(0.62, "rgba(255,250,232,1)");
    core.addColorStop(0.86, "rgba(255,226,170,.85)");
    core.addColorStop(1, "rgba(255,200,130,0)");
    gs.fillStyle = core;
    gs.beginPath();
    gs.arc(c, c, r * 1.15, 0, Math.PI * 2);
    gs.fill();
    gs.globalCompositeOperation = "lighter";
    const hot = gs.createRadialGradient(c, c, 0, c, c, r * 0.8);
    hot.addColorStop(0, "rgba(255,255,250,.9)");
    hot.addColorStop(1, "rgba(255,240,210,0)");
    gs.fillStyle = hot;
    gs.beginPath();
    gs.arc(c, c, r * 0.8, 0, Math.PI * 2);
    gs.fill();
    sunSprite = sc;
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5); // soft scene: 1.5× is visually identical, ~44% fewer pixels
    W = canvas.width = window.innerWidth * DPR;
    H = canvas.height = window.innerHeight * DPR;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    buildStars();
    buildMilkyWay();
    buildMoon();
    buildAurora();
    buildParticles();
    buildClouds();
    buildGround();
    buildSun();
    street.build(W, H, DPR, roofs, W * 1.08);
  }

  // ── per-frame drawing ─────────────────────────────────────
  function drawNight(t: number, a: number) {
    ctx.globalAlpha = a;
    ctx.drawImage(nightBg, 0, 0); // sky gradient + city glow, baked

    ctx.drawImage(milky, -par.x * 6 * DPR, -par.y * 4 * DPR);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = a * 0.6;
    ctx.drawImage(milky, -par.x * 6 * DPR, -par.y * 4 * DPR);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = a;

    // aurora: two copies drifting against each other so the curtains seem to ripple
    ctx.globalCompositeOperation = "lighter";
    const ax = -W * 0.2 - par.x * 8 * DPR, ay = -par.y * 5 * DPR;
    ctx.globalAlpha = a * (0.8 + 0.2 * Math.sin(t * 0.00035));
    ctx.drawImage(aurora, ax + Math.sin(t * 0.00009) * W * 0.05, ay);
    ctx.globalAlpha = a * (0.45 + 0.25 * Math.sin(t * 0.0005 + 2));
    ctx.drawImage(aurora, ax - Math.sin(t * 0.00012) * W * 0.06, ay + H * 0.015, aurora.width, aurora.height * (0.92 + 0.06 * Math.sin(t * 0.0003)));
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = a;
    ctx.drawImage(starField, -W * 0.05 - par.x * 10 * DPR, -par.y * 6 * DPR);

    twinkles.forEach((s) => {
      const tw = 0.5 + 0.5 * Math.sin(t * 0.001 * s.speed + s.phase);
      const x = s.x - par.x * 12 * DPR, y = s.y - par.y * 7 * DPR;
      ctx.fillStyle = `rgba(${s.tint[0]},${s.tint[1]},${s.tint[2]},${(0.3 + tw * 0.7) * a})`;
      ctx.beginPath();
      ctx.arc(x, y, s.r * (0.7 + tw * 0.5), 0, Math.PI * 2);
      ctx.fill();
      if (s.spike) {
        const L = s.r * (5 + tw * 7);
        ctx.strokeStyle = `rgba(${s.tint[0]},${s.tint[1]},${s.tint[2]},${0.35 * tw * a})`;
        ctx.lineWidth = 0.6 * DPR;
        ctx.beginPath();
        ctx.moveTo(x - L, y);
        ctx.lineTo(x + L, y);
        ctx.moveTo(x, y - L);
        ctx.lineTo(x, y + L);
        ctx.stroke();
      }
    });

    const R = Math.min(W, H) * 0.062;
    const rise = a * a * (3 - 2 * a); // the moon climbs as night falls, sets as dawn comes
    const mx = lerp(W * 0.86, W * 0.76, rise) - par.x * 16 * DPR, my = lerp(H * 0.95, H * 0.2, rise) - par.y * 9 * DPR;
    const halo = ctx.createRadialGradient(mx, my, R * 0.8, mx, my, R * 5.5);
    halo.addColorStop(0, "rgba(215,220,255,.30)");
    halo.addColorStop(0.35, "rgba(170,180,255,.08)");
    halo.addColorStop(1, "rgba(170,180,255,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(mx - R * 6, my - R * 6, R * 12, R * 12);
    ctx.drawImage(moon, mx - moon.width / 2, my - moon.height / 2);

    shooting.forEach((s) => {
      const age = (t - s.born) / s.life;
      if (age < 0 || age > 1) return;
      const x = s.x + s.vx * age, y = s.y + s.vy * age;
      const tail = ctx.createLinearGradient(x, y, x - s.vx * 0.25, y - s.vy * 0.25);
      tail.addColorStop(0, `rgba(255,255,255,${Math.sin(age * Math.PI) * a})`);
      tail.addColorStop(1, "rgba(200,210,255,0)");
      ctx.strokeStyle = tail;
      ctx.lineWidth = 1.6 * DPR;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - s.vx * 0.25, y - s.vy * 0.25);
      ctx.stroke();
    });

    ctx.globalAlpha = a * 0.32;
    nightClouds.forEach((c) =>
      ctx.drawImage(c.sprite, c.x - par.x * (14 + c.depth * 18) * DPR, c.y, c.sprite.width * c.s, c.sprite.height * c.s)
    );
    ctx.globalAlpha = 1;
  }

  function drawDawn(t: number, a: number) {
    // sky + horizon haze are baked into one image; the sun and its rays are pre-rendered sprites
    ctx.globalAlpha = a;
    ctx.drawImage(dawnBg, 0, 0);

    const e = a * a * (3 - 2 * a);
    const sx = lerp(W * 0.7, W * 0.87, e) - par.x * 10 * DPR;
    const sy = lerp(H * 0.92, H * 0.21, e) + Math.sin(t * 0.0006) * H * 0.006 - par.y * 6 * DPR;
    const r = sunR;
    const shimmer = 0.96 + 0.04 * Math.sin(t * 0.002);

    ctx.save(); // god rays: one rotating sprite instead of 22 gradient fills per frame
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = a * (0.85 + 0.15 * Math.sin(t * 0.0007));
    ctx.translate(sx, sy);
    ctx.rotate(t * 0.00004);
    ctx.drawImage(raysSprite, -RAY_R * r, -RAY_R * r, RAY_R * 2 * r, RAY_R * 2 * r);
    ctx.restore();

    ctx.globalAlpha = a;
    const sz = SUN_R * 2 * r * shimmer;
    ctx.drawImage(sunSprite, sx - sz / 2, sy - sz / 2, sz, sz);

    const vx = sx - W / 2, vy = sy - H / 2; // lens flare
    [0.4, 0.75, 1.1, 1.5].forEach((f, i) => {
      const fx = sx - vx * f, fy = sy - vy * f, fr = r * [0.35, 0.18, 0.5, 0.12][i];
      const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
      fg.addColorStop(0, `rgba(255,${210 - i * 20},${170 + i * 20},.16)`);
      fg.addColorStop(1, "rgba(255,220,190,0)");
      ctx.fillStyle = fg;
      ctx.fillRect(fx - fr, fy - fr, fr * 2, fr * 2);
    });

    ctx.globalAlpha = a * 0.62;
    dayClouds.forEach((c) =>
      ctx.drawImage(c.sprite, c.x - par.x * (14 + c.depth * 18) * DPR, c.y, c.sprite.width * c.s, c.sprite.height * c.s)
    );

    // golden dust drifting up through the light
    ctx.globalCompositeOperation = "lighter";
    motes.forEach((m) => {
      const y = (((m.y - t * 0.011 * m.sp * DPR) % H) + H) % H;
      const x = m.x + Math.sin(t * 0.0004 * m.sp + m.ph) * 30 * DPR + par.x * 20 * DPR;
      const tw = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * 0.0021 * m.sp + m.ph), 3);
      const near = 1 - Math.min(1, Math.hypot(x - sx, y - sy) / (W * 0.6)); // brighter in the sunbeam
      ctx.globalAlpha = a * tw * (0.25 + 0.55 * near) * Math.min(1, y / (H * 0.15));
      ctx.drawImage(moteGlow, x - m.r, y - m.r, m.r * 2, m.r * 2);
    });
    ctx.globalCompositeOperation = "source-over";

    ctx.globalAlpha = a;
    const bt = (t - birdsT) / 22000; // a flock crossing
    if (bt >= 0 && bt <= 1) {
      const bx = lerp(-W * 0.1, W * 1.1, bt), by = H * 0.34 + Math.sin(bt * 6) * H * 0.02;
      ctx.strokeStyle = `rgba(40,16,30,${0.7 * a})`;
      ctx.lineWidth = 1.4 * DPR;
      ctx.lineCap = "round";
      for (let i = 0; i < 9; i++) {
        const side = i % 2 ? 1 : -1, row = Math.ceil(i / 2);
        const x = bx - row * 22 * DPR, y = by + side * row * 12 * DPR + Math.sin(t * 0.002 + i) * 3 * DPR;
        const flap = Math.sin(t * 0.012 + i * 0.9) * 4 * DPR, s = (7 - row * 0.5) * DPR;
        ctx.beginPath();
        ctx.moveTo(x - s, y - flap);
        ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.2, x, y);
        ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.2, x + s, y - flap);
        ctx.stroke();
      }
    }
    const bt2 = (t - birdsT - 9000) / 30000; // a few far birds going the other way
    if (bt2 >= 0 && bt2 <= 1) {
      const bx = lerp(W * 1.05, -W * 0.05, bt2), by = H * 0.18 + Math.sin(bt2 * 4) * H * 0.015;
      ctx.strokeStyle = `rgba(60,24,40,${0.5 * a})`;
      ctx.lineWidth = 1 * DPR;
      for (let i = 0; i < 4; i++) {
        const x = bx + i * 16 * DPR, y = by + (i % 2) * 7 * DPR + Math.sin(t * 0.0015 + i * 2) * 2 * DPR;
        const flap = Math.sin(t * 0.014 + i * 1.3) * 2.6 * DPR, s = 4 * DPR;
        ctx.beginPath();
        ctx.moveTo(x - s, y - flap);
        ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.2, x, y);
        ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.2, x + s, y - flap);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  /** A plane crossing high up: blinking lights at night, a glowing contrail at dawn. */
  function drawPlane(t: number, p: number) {
    const u = (t - planeT) / 42000;
    if (u < 0 || u > 1) return;
    const x = lerp(W * 1.05, -W * 0.05, u) - par.x * 8 * DPR, y = lerp(H * 0.2, H * 0.15, u) - par.y * 5 * DPR;
    if (p > 0.01) {
      const L = W * 0.3, tail = ctx.createLinearGradient(x, y, x + L, y + H * 0.04);
      tail.addColorStop(0, `rgba(255,248,240,${0.55 * p})`);
      tail.addColorStop(1, "rgba(255,230,220,0)");
      ctx.strokeStyle = tail;
      ctx.lineCap = "round";
      ctx.lineWidth = 2.2 * DPR;
      ctx.beginPath();
      ctx.moveTo(x + 4 * DPR, y);
      ctx.lineTo(x + L, y + H * 0.04);
      ctx.stroke();
      ctx.globalAlpha = p;
      ctx.fillStyle = "rgba(255,250,245,.95)";
      ctx.fillRect(x - 3 * DPR, y - 0.8 * DPR, 7 * DPR, 1.6 * DPR);
    }
    const n = 1 - p;
    if (n > 0.01) {
      ctx.globalAlpha = n;
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.beginPath();
      ctx.arc(x, y, 1.1 * DPR, 0, Math.PI * 2);
      ctx.fill();
      if ((t % 1300) < 130) ctx.drawImage(redGlow, x + 3 * DPR - 7 * DPR, y - 7 * DPR, 14 * DPR, 14 * DPR);
      if (((t + 650) % 1300) < 90) ctx.drawImage(fireGlow, x - 4 * DPR - 6 * DPR, y - 6 * DPR, 12 * DPR, 12 * DPR);
    }
    ctx.globalAlpha = 1;
  }

  function drawGround(t: number, p: number) {
    const n = 1 - p;
    const hx = -W * 0.03 - par.x * 18 * DPR, hy = H - hillsNight.height - H * 0.06;
    if (n > 0.01) { ctx.globalAlpha = n; ctx.drawImage(hillsNight, hx, hy); }
    if (p > 0.01) { ctx.globalAlpha = p; ctx.drawImage(hillsDay, hx, hy); }
    ctx.globalAlpha = 1;

    const mist = ctx.createLinearGradient(0, H * 0.7, 0, H);
    mist.addColorStop(0, "rgba(255,255,255,0)");
    mist.addColorStop(1, `rgba(${Math.round(lerp(90, 255, p))},${Math.round(lerp(80, 190, p))},${Math.round(lerp(140, 150, p))},${lerp(0.14, 0.26, p)})`);
    ctx.fillStyle = mist;
    ctx.fillRect(0, H * 0.7, W, H * 0.3);

    const fx = -W * 0.04 - par.x * 21 * DPR, fy = H - farNight.height - H * 0.05 + par.y * 3 * DPR;
    if (n > 0.01) { ctx.globalAlpha = n * 0.95; ctx.drawImage(farNight, fx, fy); }
    if (p > 0.01) { ctx.globalAlpha = p * 0.9; ctx.drawImage(farDay, fx, fy); }

    // fog rolls slowly between the far and near city
    const fogY = H * 0.78 - par.y * 3 * DPR;
    const drawFog = (img: HTMLCanvasElement, speed: number, alpha: number, dy: number) => {
      const ox = ((t * speed * DPR) % img.width) - par.x * 24 * DPR;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, ox - img.width, fogY + dy);
      ctx.drawImage(img, ox, fogY + dy);
      ctx.drawImage(img, ox + img.width, fogY + dy);
    };
    if (n > 0.01) drawFog(fogNight, 0.012, n * 0.38, 0);
    if (p > 0.01) drawFog(fogDay, 0.012, p * 0.5, 0);

    const sx = -W * 0.04 - par.x * 26 * DPR, sy = H - cityNight.height + par.y * 4 * DPR;
    if (n > 0.01) {
      ctx.globalAlpha = n;
      ctx.drawImage(cityNight, sx, sy);
      ctx.globalAlpha = n * (0.82 + 0.18 * Math.sin(t * 0.0006)); // the city "breathes"
      ctx.drawImage(litNight, sx, sy);
      ctx.globalAlpha = n;
      flickers.forEach((w) => {
        const on = Math.sin(t * 0.004 + w.phase) > 0.2 ? 1 : 0.15;
        ctx.fillStyle = w.warm ? `rgba(255,210,130,${0.85 * on})` : `rgba(180,215,255,${0.75 * on})`;
        ctx.fillRect(sx + w.x, sy + w.y, w.w, w.h);
      });
    }
    if (p > 0.01) {
      ctx.globalAlpha = p;
      ctx.drawImage(cityDay, sx, sy);
      ctx.globalAlpha = p * (0.55 + 0.45 * Math.sin(t * 0.0012)); // a few windows catch the sunrise
      ctx.drawImage(litDay, sx, sy);
    }

    ctx.globalAlpha = 1;
    if (n > 0.01) drawFog(fogNight, -0.007, n * 0.22, H * 0.09);
    if (p > 0.01) drawFog(fogDay, -0.007, p * 0.28, H * 0.09);

    // red aircraft-warning lights on the antennas, slow blink
    ctx.globalCompositeOperation = "lighter";
    beacons.forEach((b) => {
      const on = Math.pow(Math.max(0, Math.sin(t * 0.0021 + b.ph * Math.PI)), 6);
      ctx.globalAlpha = (0.15 + 0.85 * on) * lerp(1, 0.35, p);
      const r = 9 * DPR;
      ctx.drawImage(redGlow, sx + b.x - r, sy + b.y - r, r * 2, r * 2);
    });

    // fireflies drifting over the rooftops at night
    if (n > 0.01) {
      fireflies.forEach((f) => {
        const x = (((f.x + t * 0.006 * f.sp * DPR + Math.sin(t * 0.00035 * f.sp + f.ph) * 50 * DPR) % W) + W) % W;
        const y = f.y + Math.sin(t * 0.0005 * f.sp + f.ph * 2) * 28 * DPR - par.y * 10 * DPR;
        const pulse = Math.pow(Math.max(0, Math.sin(t * 0.0016 * f.sp + f.ph)), 2);
        ctx.globalAlpha = n * (0.08 + 0.92 * pulse);
        const r = f.r * (0.7 + 0.6 * pulse);
        ctx.drawImage(fireGlow, x - r, y - r, r * 2, r * 2);
      });
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  function frame(now: number) {
    const dt = Math.min(64, now - last);
    last = now;
    const t = reduced ? 0 : now;
    progress = lerp(progress, target.current, reduced ? 1 : 0.022); // slow enough to watch the sun rise
    par.x = lerp(par.x, pointer.x, 0.05);
    par.y = lerp(par.y, pointer.y, 0.05);
    const p = progress, n = 1 - p;

    if (!reduced) {
      for (const c of [...nightClouds, ...dayClouds]) {
        c.x += (c.v * dt) / 1000;
        if (c.x > W + 40) c.x = -c.sprite.width * c.s - rand(0, W * 0.3);
      }
      if (n > 0.5 && now > nextShot) {
        shooting.push({ x: rand(W * 0.2, W), y: rand(0, H * 0.35), vx: -rand(0.35, 0.6) * W, vy: rand(0.12, 0.25) * H, life: rand(700, 1100), born: now });
        nextShot = now + rand(3500, 9000);
      }
      while (shooting.length && now - shooting[0].born > shooting[0].life) shooting.shift();
      if (p > 0.5 && now - birdsT > 26000) birdsT = now;
      if (now - planeT > 42000 + 30000) planeT = now + rand(0, 20000);
    }

    ctx.clearRect(0, 0, W, H);
    if (n > 0.01) drawNight(t, n);
    if (p > 0.01) drawDawn(t, p);
    drawPlane(t, p);
    drawGround(t, p);
    street.draw(t, reduced ? 0 : dt, p, par, { x: -W * 0.04 - par.x * 26 * DPR, y: H - cityNight.height + par.y * 4 * DPR }, !reduced);
    ambient.style.backgroundColor = `rgb(${Math.round(lerp(34, 110, p))},${Math.round(lerp(28, 58, p))},${Math.round(lerp(66, 30, p))})`;
    raf = requestAnimationFrame(frame);
  }

  const onPointer = (e: PointerEvent) => {
    pointer = { x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 };
  };
  let resizeTimer: ReturnType<typeof setTimeout>;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  };

  resize();
  window.addEventListener("resize", onResize);
  if (!reduced) window.addEventListener("pointermove", onPointer);
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(resizeTimer);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointer);
  };
}
