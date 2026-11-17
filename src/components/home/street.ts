/**
 * The lively bits in front of the home skyline: an elevated commuter train, people walking the street
 * (a girl, a student, a couple, a dog walker, a kid with a balloon, a cyclist), streetlamps, telephone
 * poles with birds on the wires, and a cat on a rooftop. Silhouettes by day, warm lights by night.
 * Drawn on the sky's canvas right after the city; `p` is 0 = night … 1 = morning.
 */

type Walker = { x: number; dir: 1 | -1; v: number; kind: number; s: number; ph: number; fxAt: number };
/** little floating extras: hearts from couples, notes from headphones, a dog's "woof!" */
type Fx = { x: number; y: number; born: number; life: number; kind: "heart" | "note" | "woof"; drift: number };
export type Roof = { x: number; y: number; w: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const mix = (n: [number, number, number], d: [number, number, number], p: number) =>
  `rgb(${Math.round(lerp(n[0], d[0], p))},${Math.round(lerp(n[1], d[1], p))},${Math.round(lerp(n[2], d[2], p))})`;

export function createStreet(ctx: CanvasRenderingContext2D) {
  let W = 0, H = 0, u = 1;
  let trainNight: HTMLCanvasElement, trainDay: HTMLCanvasElement, lampGlow: HTMLCanvasElement;
  let walkers: Walker[] = [];
  let trainT = 1200, trainDir: 1 | -1 = 1, nextWalker = 0;
  let cat: { x: number; y: number } | null = null;
  let fx: Fx[] = [];

  const off = (w: number, h: number) => {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return [c, c.getContext("2d")!] as const;
  };

  function buildTrain(night: boolean) {
    const cars = 5, cw = 118 * u, chh = 19 * u, gap = 4 * u, pad = 14 * u;
    const [c, g] = off(cars * cw + (cars - 1) * gap + pad * 2, chh + pad * 2);
    g.translate(pad, pad);
    for (let k = 0; k < cars; k++) {
      const x = k * (cw + gap);
      const front = k === cars - 1;
      g.fillStyle = night ? "#16132b" : "#3a1b2e";
      g.beginPath();
      if (front) g.roundRect(x, 0, cw, chh, [3 * u, 12 * u, 4 * u, 3 * u]);
      else g.roundRect(x, 0, cw, chh, 3 * u);
      g.fill();
      g.fillStyle = night ? "#26223f" : "#4f2a3d"; // roof
      g.fillRect(x + 2 * u, 0, cw - 4 * u, 2.4 * u);
      g.fillStyle = night ? "#a35a7a" : "#c96d7f"; // livery stripe
      g.fillRect(x, chh - 6 * u, cw, 1.6 * u);
      // windows
      if (night) {
        g.shadowColor = "rgba(255,200,120,.9)";
        g.shadowBlur = 8 * u;
      }
      g.fillStyle = night ? "#ffe0a3" : "rgba(255,214,176,.55)";
      for (let w = 0; w < 7; w++) {
        const wx = x + 8 * u + w * 15 * u;
        if (w === 2 || w === 5) continue; // doors
        g.fillRect(wx, 4.5 * u, 10 * u, 7 * u);
      }
      g.shadowBlur = 0;
      g.fillStyle = night ? "#0d0b1c" : "#2b1222"; // doors
      [2, 5].forEach((w) => g.fillRect(x + 8 * u + w * 15 * u, 3.5 * u, 10 * u, 12 * u));
      if (front) {
        g.fillStyle = night ? "#fff6d8" : "#ffe6c0"; // headlight
        g.beginPath();
        g.arc(x + cw - 4 * u, chh - 4 * u, 1.8 * u, 0, Math.PI * 2);
        g.fill();
      }
    }
    return c;
  }

  function build(w: number, h: number, dpr: number, roofs: Roof[], cityW: number) {
    W = w;
    H = h;
    u = dpr;
    trainNight = buildTrain(true);
    trainDay = buildTrain(false);
    const [lg, gg] = off(120 * u, 120 * u);
    const r = gg.createRadialGradient(60 * u, 60 * u, 0, 60 * u, 60 * u, 60 * u);
    r.addColorStop(0, "rgba(255,214,150,.55)");
    r.addColorStop(0.4, "rgba(255,190,120,.18)");
    r.addColorStop(1, "rgba(255,190,120,0)");
    gg.fillStyle = r;
    gg.fillRect(0, 0, 120 * u, 120 * u);
    lampGlow = lg;
    // a cat on one of the taller roofs, right of centre
    const tall = roofs.filter((rf) => rf.x > cityW * 0.55 && rf.x < cityW * 0.85 && rf.w > 40 * u).sort((a, b) => a.y - b.y)[0];
    cat = tall ? { x: tall.x + tall.w * 0.65, y: tall.y } : null;
    // a few people already out when the page opens
    walkers = [];
    for (let i = 0; i < Math.max(3, Math.round(W / u / 360)); i++) walkers.push(spawn(rand(0, W)));
    nextWalker = 0;
  }

  function spawn(x?: number): Walker {
    let kind = Math.floor(Math.random() * 6);
    if (kind === 4 && walkers.some((w) => w.kind === 4)) kind = Math.floor(Math.random() * 4); // one balloon at a time
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    return {
      x: x ?? (dir === 1 ? -60 * u : W + 60 * u),
      dir,
      v: (kind === 5 ? rand(70, 95) : rand(22, 36)) * u,
      kind,
      s: kind === 4 ? 0.72 : rand(0.9, 1.08),
      ph: Math.random() * 10,
      fxAt: 0,
    };
  }

  // ── people (drawn facing right; caller flips) ──
  function person(h: number, ph: number, o: { hair?: boolean; skirt?: boolean; pack?: boolean; armUp?: boolean; phones?: boolean }) {
    const leg = 0.42 * h, sw = Math.sin(ph) * 0.5;
    ctx.lineCap = "round";
    ctx.lineWidth = 0.1 * h;
    ctx.beginPath();
    ctx.moveTo(0, -leg);
    ctx.lineTo(Math.sin(sw) * leg, -leg + Math.cos(sw) * leg);
    ctx.moveTo(0, -leg);
    ctx.lineTo(Math.sin(-sw) * leg, -leg + Math.cos(sw) * leg);
    ctx.stroke();
    if (o.pack) {
      ctx.beginPath();
      ctx.roundRect(-0.25 * h, -0.76 * h, 0.13 * h, 0.24 * h, 0.04 * h);
      ctx.fill();
    }
    ctx.beginPath(); // torso
    ctx.roundRect(-0.12 * h, -0.8 * h, 0.24 * h, 0.4 * h, 0.09 * h);
    ctx.fill();
    if (o.skirt) {
      ctx.beginPath();
      ctx.moveTo(-0.12 * h, -0.48 * h);
      ctx.lineTo(0.12 * h, -0.48 * h);
      ctx.lineTo(0.2 * h, -0.32 * h);
      ctx.lineTo(-0.2 * h, -0.32 * h);
      ctx.fill();
    }
    ctx.lineWidth = 0.075 * h; // arms
    ctx.beginPath();
    ctx.moveTo(0, -0.74 * h);
    ctx.lineTo(Math.sin(-sw) * 0.26 * h, -0.5 * h);
    if (!o.armUp) {
      ctx.moveTo(0, -0.74 * h);
      ctx.lineTo(Math.sin(sw) * 0.26 * h, -0.5 * h);
    }
    ctx.stroke();
    if (o.hair) {
      ctx.beginPath(); // long hair falling down the back
      ctx.ellipse(-0.04 * h, -0.8 * h, 0.12 * h, 0.17 * h, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath(); // head
    ctx.arc(0.02 * h, -0.9 * h, 0.115 * h, 0, Math.PI * 2);
    ctx.fill();
    if (o.phones) {
      ctx.lineWidth = 0.035 * h; // headband + ear cup
      ctx.beginPath();
      ctx.arc(0.02 * h, -0.9 * h, 0.15 * h, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0.0 * h, -0.88 * h, 0.05 * h, 0.07 * h, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawWalker(w: Walker, y: number, col: string, n: number, now: number) {
    const h = 30 * u * w.s;
    ctx.save();
    ctx.translate(w.x, y);
    ctx.scale(w.dir, 1);
    ctx.fillStyle = ctx.strokeStyle = col;
    switch (w.kind) {
      case 0: // girl with long hair and a skirt
        person(h, w.ph, { hair: true, skirt: true });
        break;
      case 1: // student with a backpack and headphones
        person(h, w.ph, { pack: true, phones: true });
        break;
      case 2: { // a couple holding hands
        person(h, w.ph, { hair: true, skirt: true });
        ctx.save();
        ctx.translate(-0.34 * h, 0);
        person(h * 1.08, w.ph + 1.4, {});
        ctx.restore();
        ctx.lineWidth = 0.06 * h;
        ctx.beginPath();
        ctx.moveTo(-0.04 * h, -0.52 * h);
        ctx.lineTo(-0.28 * h, -0.54 * h);
        ctx.stroke();
        break;
      }
      case 3: { // dog walker and a little dog trotting ahead
        person(h, w.ph, {});
        const dx = 0.75 * h, trot = Math.sin(w.ph * 2) * 0.05 * h;
        ctx.beginPath();
        ctx.ellipse(dx, -0.16 * h + trot, 0.17 * h, 0.08 * h, 0, 0, Math.PI * 2); // body
        ctx.arc(dx + 0.18 * h, -0.24 * h + trot, 0.075 * h, 0, Math.PI * 2); // head
        ctx.fill();
        ctx.lineWidth = 0.05 * h;
        ctx.beginPath();
        ctx.moveTo(dx - 0.1 * h, -0.12 * h); ctx.lineTo(dx - 0.12 * h + Math.sin(w.ph * 2) * 0.05 * h, 0);
        ctx.moveTo(dx + 0.1 * h, -0.12 * h); ctx.lineTo(dx + 0.12 * h - Math.sin(w.ph * 2) * 0.05 * h, 0);
        ctx.moveTo(dx - 0.16 * h, -0.18 * h); ctx.lineTo(dx - 0.26 * h, -0.28 * h + Math.sin(now * 0.02) * 0.03 * h); // wagging tail
        ctx.moveTo(dx + 0.2 * h, -0.3 * h); ctx.lineTo(dx + 0.22 * h, -0.36 * h); // ear
        ctx.stroke();
        ctx.lineWidth = 0.025 * h; // leash
        ctx.beginPath();
        ctx.moveTo(0.18 * h, -0.5 * h);
        ctx.quadraticCurveTo(0.5 * h, -0.2 * h, dx + 0.14 * h, -0.26 * h + trot);
        ctx.stroke();
        break;
      }
      case 4: { // kid with a red balloon
        person(h, w.ph, { armUp: true });
        const bx = 0.1 * h + Math.sin(now * 0.0016 + w.ph) * 0.06 * h, by = -1.75 * h;
        ctx.lineWidth = 0.025 * h;
        ctx.beginPath();
        ctx.moveTo(0.1 * h, -0.62 * h);
        ctx.quadraticCurveTo(0.2 * h, -1.1 * h, bx, by + 0.24 * h);
        ctx.stroke();
        ctx.fillStyle = mix([200, 40, 70], [230, 70, 90], 1 - n * 0.3);
        ctx.beginPath();
        ctx.ellipse(bx, by, 0.2 * h, 0.25 * h, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.45)";
        ctx.beginPath();
        ctx.ellipse(bx - 0.07 * h, by - 0.08 * h, 0.05 * h, 0.08 * h, -0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      default: { // cyclist
        const r = 0.22 * h, crank = w.ph * 1.6;
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 0.03 * h;
        [[-0.75, -0.75, 0.32], [-0.85, -0.45, 0.4], [-0.72, -0.2, 0.26]].forEach(([x0, y0, len], k) => {
          const jit = Math.sin(now * 0.02 + k) * 0.06 * h;
          ctx.beginPath();
          ctx.moveTo(x0 * h + jit, y0 * h);
          ctx.lineTo((x0 - len) * h + jit, y0 * h);
          ctx.stroke();
        });
        ctx.restore();
        ctx.lineWidth = 0.05 * h;
        ctx.beginPath();
        ctx.arc(-0.34 * h, -r, r, 0, Math.PI * 2);
        ctx.moveTo(0.34 * h + r, -r);
        ctx.arc(0.34 * h, -r, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath(); // frame
        ctx.moveTo(-0.34 * h, -r); ctx.lineTo(-0.05 * h, -r); ctx.lineTo(0.22 * h, -0.62 * h); ctx.lineTo(0.34 * h, -r);
        ctx.moveTo(-0.05 * h, -r); ctx.lineTo(-0.12 * h, -0.6 * h); ctx.lineTo(0.2 * h, -0.62 * h);
        ctx.stroke();
        ctx.lineWidth = 0.09 * h; // rider: pedalling legs, leaning body, head
        ctx.beginPath();
        ctx.moveTo(-0.1 * h, -0.64 * h);
        ctx.lineTo(-0.05 * h + Math.cos(crank) * 0.1 * h, -r + Math.sin(crank) * 0.1 * h);
        ctx.moveTo(-0.1 * h, -0.64 * h);
        ctx.lineTo(-0.05 * h - Math.cos(crank) * 0.1 * h, -r - Math.sin(crank) * 0.1 * h);
        ctx.stroke();
        ctx.lineWidth = 0.13 * h;
        ctx.beginPath();
        ctx.moveTo(-0.1 * h, -0.66 * h);
        ctx.lineTo(0.08 * h, -0.98 * h);
        ctx.stroke();
        ctx.lineWidth = 0.07 * h;
        ctx.beginPath();
        ctx.moveTo(0.04 * h, -0.92 * h);
        ctx.lineTo(0.2 * h, -0.66 * h);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0.13 * h, -1.1 * h, 0.11 * h, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function draw(now: number, dt: number, p: number, par: { x: number; y: number }, city: { x: number; y: number }, moving: boolean) {
    const n = 1 - p;
    const ink = mix([9, 7, 20], [43, 20, 36], p); // structures: near-black at night, plum at dawn
    const folk = mix([54, 46, 86], [43, 20, 36], p); // people a shade lighter at night so they read against the city

    // ── cat on a rooftop ──
    if (cat) {
      const cx = city.x + cat.x, cy = city.y + cat.y, s = 9 * u;
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(cx, cy - s * 0.55, s * 0.5, s * 0.6, 0, 0, Math.PI * 2); // body
      ctx.arc(cx + s * 0.05, cy - s * 1.3, s * 0.36, 0, Math.PI * 2); // head
      ctx.fill();
      ctx.beginPath(); // ears
      ctx.moveTo(cx - s * 0.28, cy - s * 1.45); ctx.lineTo(cx - s * 0.2, cy - s * 1.85); ctx.lineTo(cx - s * 0.02, cy - s * 1.58);
      ctx.moveTo(cx + s * 0.12, cy - s * 1.58); ctx.lineTo(cx + s * 0.3, cy - s * 1.85); ctx.lineTo(cx + s * 0.38, cy - s * 1.42);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = s * 0.16;
      ctx.lineCap = "round";
      const sw = Math.sin(now * 0.0018) * 0.5;
      ctx.beginPath(); // slow tail swish over the roof edge
      ctx.moveTo(cx - s * 0.4, cy - s * 0.2);
      ctx.quadraticCurveTo(cx - s * 1.1, cy + s * 0.1, cx - s * 1.05 + Math.sin(sw) * s * 0.5, cy + s * (0.7 + sw * 0.3));
      ctx.stroke();
      if (n > 0.3) {
        ctx.fillStyle = `rgba(255,230,120,${n * 0.9})`; // eyes catch the light at night
        ctx.beginPath();
        ctx.arc(cx - s * 0.08, cy - s * 1.32, s * 0.06, 0, Math.PI * 2);
        ctx.arc(cx + s * 0.2, cy - s * 1.32, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── elevated track + train ──
    const ox = -par.x * 34 * u;
    const deckY = H * 0.885 + par.y * 5 * u;
    const trW = trainNight.width, trH = trainNight.height, pad = 14 * u;
    if (moving && now > trainT) {
      const x0 = trainDir === 1 ? -trW : W + trW;
      const x = x0 + trainDir * ((now - trainT) / 1000) * 240 * u;
      if ((trainDir === 1 && x > W + 40 * u) || (trainDir === -1 && x < -trW - 40 * u)) {
        trainDir = trainDir === 1 ? -1 : 1;
        trainT = now + rand(5000, 12000);
      } else {
        const ty = deckY - trH + pad;
        if (n > 0.02) {
          ctx.globalCompositeOperation = "lighter"; // warm light spilling onto the track
          const gl = ctx.createLinearGradient(0, deckY - 4 * u, 0, deckY + 16 * u);
          gl.addColorStop(0, `rgba(255,200,120,${0.22 * n})`);
          gl.addColorStop(1, "rgba(255,200,120,0)");
          ctx.fillStyle = gl;
          ctx.fillRect(trainDir === 1 ? x : x - trW, deckY - 4 * u, trW, 20 * u);
          ctx.globalCompositeOperation = "source-over";
        }
        ctx.save();
        ctx.translate(x, ty);
        if (trainDir === -1) ctx.scale(-1, 1);
        if (n > 0.01) { ctx.globalAlpha = n; ctx.drawImage(trainNight, 0, 0); }
        if (p > 0.01) { ctx.globalAlpha = p; ctx.drawImage(trainDay, 0, 0); }
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
    ctx.fillStyle = ink; // deck + pillars
    ctx.fillRect(0, deckY, W, 5 * u);
    for (let x = ((ox % (170 * u)) + 170 * u) % (170 * u) - 170 * u; x < W + 10; x += 170 * u) ctx.fillRect(x, deckY, 7 * u, H - deckY);
    ctx.fillRect(0, deckY - 9 * u, W, 1.2 * u); // safety rail
    for (let x = ((ox % (24 * u)) + 24 * u) % (24 * u); x < W; x += 24 * u) ctx.fillRect(x, deckY - 9 * u, 1.2 * u, 9 * u);

    // ── street: lamps, people ──
    const footY = H - 8 * u;
    ctx.fillStyle = ink;
    ctx.fillRect(0, H - 12 * u, W, 12 * u);
    const lampGap = 280 * u, lx0 = (((ox * 1.2) % lampGap) + lampGap) % lampGap;
    for (let x = lx0 - lampGap; x < W + lampGap; x += lampGap) {
      ctx.fillStyle = ink;
      ctx.fillRect(x, footY - 58 * u, 2.4 * u, 58 * u);
      ctx.beginPath();
      ctx.moveTo(x + 1.2 * u, footY - 58 * u);
      ctx.quadraticCurveTo(x + 2 * u, footY - 66 * u, x + 12 * u, footY - 64 * u);
      ctx.lineTo(x + 12 * u, footY - 61 * u);
      ctx.quadraticCurveTo(x + 4 * u, footY - 62 * u, x + 3.6 * u, footY - 58 * u);
      ctx.fill();
      ctx.fillStyle = n > 0.3 ? "#ffe8b0" : ink;
      ctx.fillRect(x + 8 * u, footY - 61 * u, 6 * u, 2.4 * u);
      if (n > 0.02) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = n;
        ctx.drawImage(lampGlow, x + 11 * u - 60 * u, footY - 60 * u - 50 * u);
        ctx.globalAlpha = n * 0.5; // pool of light on the pavement
        ctx.drawImage(lampGlow, x + 11 * u - 50 * u, footY - 22 * u, 100 * u, 30 * u);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
    }

    if (moving) {
      for (const w of walkers) {
        w.x += w.dir * w.v * (dt / 1000);
        w.ph += (w.v * (dt / 1000)) / (11 * u * w.s);
      }
      walkers = walkers.filter((w) => w.x > -120 * u && w.x < W + 120 * u);
      for (const w of walkers) {
        if (now < w.fxAt) continue;
        const h = 30 * u * w.s;
        if (w.kind === 2) { // couple: a heart rises from between them
          fx.push({ x: w.x - w.dir * 0.17 * h, y: H - 8 * u - 1.08 * h, born: now, life: 2600, kind: "heart", drift: rand(-1, 1) });
          w.fxAt = now + rand(650, 1300);
        } else if (w.kind === 1) { // headphones: music notes
          fx.push({ x: w.x + w.dir * 0.1 * h, y: H - 8 * u - 1.1 * h, born: now, life: 2200, kind: "note", drift: rand(-1, 1) });
          w.fxAt = now + rand(1100, 2000);
        } else if (w.kind === 3) { // the dog says hi
          if (w.fxAt) fx.push({ x: w.x + w.dir * 0.95 * h, y: H - 8 * u - 0.5 * h, born: now, life: 1300, kind: "woof", drift: 0 });
          w.fxAt = now + rand(3500, 7500);
        } else {
          w.fxAt = Infinity;
        }
      }
      fx = fx.filter((f) => now - f.born < f.life);
      if (now > nextWalker && walkers.length < Math.max(4, Math.round(W / u / 230))) {
        walkers.push(spawn());
        nextWalker = now + rand(2500, 6500);
      }
    }
    for (const w of walkers) drawWalker(w, footY, folk, n, now);

    for (const f of fx) {
      const a = (now - f.born) / f.life;
      const fade = a < 0.15 ? a / 0.15 : 1 - (a - 0.15) / 0.85;
      const x = f.x + Math.sin(a * 6 + f.drift * 3) * 4 * u + f.drift * a * 10 * u;
      const y = f.y - a * (f.kind === "woof" ? 10 : 34) * u;
      ctx.globalAlpha = Math.max(0, fade);
      if (f.kind === "heart") {
        const sz = (3.2 + a * 2.2) * u;
        if (n > 0.05) {
          ctx.shadowColor = "rgba(255,120,160,.9)"; // soft glow at night
          ctx.shadowBlur = 8 * u * n;
        }
        ctx.fillStyle = "#ff7a9a";
        ctx.beginPath();
        ctx.moveTo(x, y + sz * 0.9);
        ctx.bezierCurveTo(x - sz * 1.6, y - sz * 0.2, x - sz * 0.7, y - sz * 1.4, x, y - sz * 0.5);
        ctx.bezierCurveTo(x + sz * 0.7, y - sz * 1.4, x + sz * 1.6, y - sz * 0.2, x, y + sz * 0.9);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (f.kind === "note") {
        ctx.fillStyle = ctx.strokeStyle = n > 0.5 ? "#cdbfff" : "#6b3a5a";
        ctx.lineWidth = 1 * u;
        ctx.beginPath();
        ctx.ellipse(x, y, 2.4 * u, 1.8 * u, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 2.1 * u, y - 0.4 * u);
        ctx.lineTo(x + 2.1 * u, y - 8 * u);
        ctx.lineTo(x + 5 * u, y - 6.5 * u);
        ctx.stroke();
      } else {
        ctx.fillStyle = n > 0.5 ? "#f3ece4" : "#4a2238";
        ctx.font = `600 ${9 * u}px Caveat, cursive`;
        ctx.textAlign = "center";
        ctx.fillText("woof!", x, y);
      }
    }
    ctx.globalAlpha = 1;

    // ── telephone poles + sagging wires, birds on the wire ──
    const poles = [W * 0.07, W * 0.5, W * 0.93].map((x) => x - par.x * 44 * u);
    const top = H * 0.8 + par.y * 6 * u;
    ctx.fillStyle = ink;
    poles.forEach((x) => {
      ctx.fillRect(x - 2.6 * u, top - 4 * u, 5.2 * u, H - top + 4 * u);
      ctx.fillRect(x - 16 * u, top + 2 * u, 32 * u, 2.6 * u); // cross-arm
      ctx.fillRect(x - 12 * u, top + 10 * u, 24 * u, 2 * u);
    });
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1 * u;
    for (let i = 0; i < poles.length - 1; i++) {
      const a = poles[i], b = poles[i + 1];
      [[-14, 3, 24], [14, 3, 26], [-10, 11, 20], [10, 11, 22]].forEach(([dx, dy, sag]) => {
        ctx.beginPath();
        ctx.moveTo(a + dx * u, top + dy * u);
        ctx.quadraticCurveTo((a + b) / 2, top + (dy + sag * 2) * u, b + dx * u, top + dy * u);
        ctx.stroke();
      });
    }
    // three little birds on the first span, bobbing now and then
    const a = poles[0], b = poles[1];
    [0.32, 0.38, 0.62].forEach((f, i) => {
      const x = lerp(a - 14 * u, b - 14 * u, f);
      const wireY = top + 3 * u + 2 * f * (1 - f) * 48 * u; // on the sagging curve (quadratic, control 48u down)
      const bob = Math.max(0, Math.sin(now * 0.002 + i * 2.1)) ** 12 * 2.5 * u;
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(x, wireY - 4 * u - bob, 4 * u, 3.2 * u, 0, 0, Math.PI * 2);
      ctx.arc(x + (i === 1 ? -3.4 : 3.4) * u, wireY - 7.4 * u - bob, 2.3 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath(); // tail
      ctx.moveTo(x + (i === 1 ? 3 : -3) * u, wireY - 3.6 * u - bob);
      ctx.lineTo(x + (i === 1 ? 7 : -7) * u, wireY - 1.4 * u - bob);
      ctx.lineTo(x + (i === 1 ? 6 : -6) * u, wireY - 4.4 * u - bob);
      ctx.fill();
    });
  }

  return { build, draw };
}
