<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>PLAYMYLIST — What does your heart sound like tonight?</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root{
    --bg-1: #0a0710;
    --bg-2: #170d22;
    --fg: #f3ece4;
    --fg-dim: #a99cb8;
    --fg-faint: #6f6480;
    --line: rgba(243,236,228,0.12);

    --c-love: #e8897f;
    --c-heartbroken: #c97b4a;
    --c-onesided: #7b8fe0;
    --c-longdistance: #5fb0c9;
    --c-lonely: #6b6fd9;
    --c-latenight: #9a6fd9;
    --accent: var(--c-latenight);
    --accent-soft: rgba(154,111,217,0.35);
  }

  *{ box-sizing:border-box; margin:0; padding:0; }

  html,body{
    height:100%;
    background:var(--bg-1);
    color:var(--fg);
    font-family:'Inter', sans-serif;
    overflow-x:hidden;
  }

  body{
    position:relative;
    min-height:100vh;
    display:flex;
    flex-direction:column;
  }

  canvas#scene{
    position:fixed;
    inset:0;
    width:100%;
    height:100%;
    z-index:0;
    transform:translate(0,0);
  }

  canvas#wave{
    position:fixed;
    inset:0;
    width:100%;
    height:100%;
    z-index:1;
    mix-blend-mode:screen;
    transform:translate(0,0);
  }

  /* subtle jolt applied to the sky + waveform when thunder strikes */
  @keyframes thunder-shake{
    0%{ transform:translate(0,0); }
    18%{ transform:translate(-7px,4px); }
    36%{ transform:translate(6px,-5px); }
    54%{ transform:translate(-4px,3px); }
    72%{ transform:translate(3px,-2px); }
    88%{ transform:translate(-1px,1px); }
    100%{ transform:translate(0,0); }
  }
  .thunder-shake{ animation:thunder-shake 0.42s ease-out; }

  .veil{
    position:fixed;
    inset:0;
    z-index:2;
    pointer-events:none;
    background:
      radial-gradient(ellipse 65% 48% at 50% 38%, rgba(6,4,12,0.05) 0%, rgba(6,4,12,0.55) 78%),
      radial-gradient(ellipse 130% 85% at 50% 105%, rgba(6,4,12,0.7) 0%, rgba(6,4,12,0) 55%);
    transition:background 1.2s ease;
  }

  /* ambient wash: tints the whole page (chrome included) to match the sky's current mood */
  .ambient{
    position:fixed;
    inset:0;
    z-index:2;
    pointer-events:none;
    background-color:#3a2a66;
    opacity:0.3;
    mix-blend-mode:soft-light;
    transition:opacity 1.8s ease;
  }

  /* second wash: glows from below in the hovered mood's color, so the whole scene answers, not just the waveform */
  .mood-glow{
    position:fixed;
    inset:0;
    z-index:2;
    pointer-events:none;
    background:radial-gradient(ellipse 75% 60% at 50% 105%, var(--mood-color, transparent) 0%, transparent 68%);
    opacity:0;
    mix-blend-mode:screen;
    transition:opacity 1.1s ease, background-color 1.1s ease;
  }

  /* full-screen white pop used for lightning */
  .strike{
    position:fixed;
    inset:0;
    z-index:4;
    pointer-events:none;
    background:#fff;
    opacity:0;
    mix-blend-mode:screen;
  }

  /* scene name chip, quietly indicates which sky is showing */
  .scene-tag{
    position:fixed;
    top:2.4rem;
    left:50%;
    transform:translateX(-50%);
    z-index:3;
    font-family:'Space Mono', monospace;
    font-size:0.68rem;
    letter-spacing:0.3em;
    text-transform:uppercase;
    color:var(--fg-faint);
    pointer-events:none;
    opacity:0.75;
    transition:opacity 0.3s ease;
  }

  header, main, footer{ position:relative; z-index:3; }

  header{
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:2.4rem 3.2rem;
  }

  .wordmark{
    font-family:'Space Mono', monospace;
    font-size:0.92rem;
    letter-spacing:0.42em;
    color:var(--fg);
    font-weight:700;
  }

  nav{ display:flex; gap:2.6rem; }

  nav a{
    color:var(--fg-dim);
    text-decoration:none;
    font-size:0.88rem;
    font-weight:400;
    letter-spacing:0.02em;
    position:relative;
    transition:color 0.3s ease;
  }
  nav a::after{
    content:'';
    position:absolute;
    left:0; bottom:-6px;
    width:0%; height:1px;
    background:var(--accent);
    transition:width 0.35s ease, background 0.5s ease;
  }
  nav a:hover{ color:var(--fg); }
  nav a:hover::after{ width:100%; }

  main{
    flex:1;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    text-align:center;
    padding:2rem 1.5rem 4rem;
  }

  .eyebrow{
    font-family:'Space Mono', monospace;
    font-size:0.72rem;
    letter-spacing:0.32em;
    color:var(--fg-faint);
    margin-bottom:2.2rem;
    text-transform:uppercase;
  }

  h1{
    font-family:'Fraunces', serif;
    font-style:italic;
    font-weight:400;
    font-optical-sizing:auto;
    font-size:clamp(2.6rem, 7vw, 5.6rem);
    line-height:1.12;
    max-width:18ch;
    color:var(--fg);
    letter-spacing:-0.01em;
    text-shadow:0 2px 30px rgba(0,0,0,0.45);
  }

  h1 em{
    font-style:italic;
    color:var(--accent);
    transition:color 0.6s ease;
    font-weight:500;
  }

  .moods{
    display:flex;
    flex-wrap:wrap;
    justify-content:center;
    gap:0.7rem;
    margin-top:3.4rem;
    max-width:56rem;
  }

  .mood{
    font-family:'Inter', sans-serif;
    font-size:0.92rem;
    font-weight:500;
    color:var(--fg);
    background:rgba(243,236,228,0.045);
    border:1px solid var(--line);
    padding:0.72rem 1.5rem;
    border-radius:999px;
    cursor:pointer;
    backdrop-filter:blur(6px);
    transition:border-color 0.4s ease, background 0.4s ease, box-shadow 0.4s ease, transform 0.25s ease;
  }

  .mood:hover, .mood:focus-visible{
    transform:translateY(-2px);
    border-color:var(--mood-color, var(--accent));
    background:color-mix(in srgb, var(--mood-color, var(--accent)) 14%, transparent);
    box-shadow:0 0 24px -4px var(--mood-color, var(--accent));
    outline:none;
  }

  .mood.active{
    border-color:var(--mood-color, var(--accent));
    background:color-mix(in srgb, var(--mood-color, var(--accent)) 20%, transparent);
    box-shadow:0 0 30px -6px var(--mood-color, var(--accent));
  }

  .explore{
    display:inline-flex;
    align-items:center;
    gap:0.45rem;
    margin-top:2.6rem;
    font-size:0.9rem;
    font-weight:500;
    color:var(--accent);
    text-decoration:none;
    transition:gap 0.3s ease, color 0.6s ease;
  }
  .explore:hover{ gap:0.7rem; }
  .explore svg{ width:15px; height:15px; transition:transform 0.3s ease; }
  .explore:hover svg{ transform:translateX(2px); }

  footer{
    display:flex;
    justify-content:center;
    padding-bottom:2.4rem;
  }

  .chevron{
    color:var(--fg-faint);
    animation:bob 2.6s ease-in-out infinite;
  }

  @keyframes bob{
    0%,100%{ transform:translateY(0); opacity:0.55; }
    50%{ transform:translateY(7px); opacity:1; }
  }

  @media (max-width: 640px){
    header{ padding:1.6rem 1.4rem; }
    .wordmark{ font-size:0.76rem; letter-spacing:0.3em; }
    nav{ gap:1.2rem; }
    nav a{ font-size:0.78rem; }
    .moods{ gap:0.55rem; }
    .mood{ font-size:0.82rem; padding:0.6rem 1.15rem; }
    .scene-tag{ top:1.4rem; font-size:0.6rem; letter-spacing:0.22em; }
  }

  @media (prefers-reduced-motion: reduce){
    .chevron{ animation:none; }
    .thunder-shake{ animation:none; }
    *{ transition-duration:0.01ms !important; }
  }
</style>
</head>
<body>

<canvas id="scene"></canvas>
<canvas id="wave"></canvas>
<div class="veil"></div>
<div class="ambient" id="ambient"></div>
<div class="mood-glow" id="moodGlow"></div>
<div class="strike" id="strike"></div>
<div class="scene-tag" id="sceneTag">Deep Space</div>

<header>
  <div class="wordmark">PLAYMYLIST</div>
  <nav>
    <a href="#">Discover</a>
    <a href="#">Stories</a>
    <a href="#">Playlists</a>
  </nav>
</header>

<main>
  <div class="eyebrow">Music · Stories · Visuals · One Feeling</div>
  <h1>What does your <em id="moodWord">heart</em> sound like tonight?</h1>

  <div class="moods" id="moods">
    <button class="mood" data-color="#e8897f" data-word="heart">I'm in Love</button>
    <button class="mood" data-color="#c97b4a" data-word="chest">Heartbroken</button>
    <button class="mood" data-color="#7b8fe0" data-word="mind">One Sided</button>
    <button class="mood" data-color="#5fb0c9" data-word="voice">Long Distance</button>
    <button class="mood" data-color="#6b6fd9" data-word="silence">Lonely</button>
    <button class="mood" data-color="#9a6fd9" data-word="thoughts">Late Night</button>
  </div>

  <a class="explore" href="#">
    Explore all moods
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
  </a>
</main>

<footer>
  <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
</footer>

<script>
/* ---------- Background scene cycler: Space -> Sun -> Rain -> Night -> repeat ---------- */
(function(){
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');
  const tagEl = document.getElementById('sceneTag');
  const ambientEl = document.getElementById('ambient');
  const strikeEl = document.getElementById('strike');
  const waveCanvas = document.getElementById('wave');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W, H, DPR;
  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = window.innerWidth * DPR;
    H = canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    buildStars();
    buildRain();
    buildFog();
    buildSparks();
  }

  /* ---- persistent particle fields ---- */
  let stars = [];
  function buildStars(){
    stars = [];
    const count = Math.floor((W*H) / (9000*DPR*DPR));
    for(let i=0;i<count;i++){
      stars.push({
        x: Math.random()*W,
        y: Math.random()*H*0.85,
        r: (Math.random()*1.4 + 0.3) * DPR,
        phase: Math.random()*Math.PI*2,
        speed: 0.0006 + Math.random()*0.0012
      });
    }
  }

  let drops = [];
  function buildRain(){
    drops = [];
    const count = Math.floor((W*H) / (5000*DPR*DPR));
    for(let i=0;i<count;i++){
      drops.push({
        x: Math.random()*W,
        y: Math.random()*H,
        len: (10 + Math.random()*18) * DPR,
        speed: (7 + Math.random()*9) * DPR,
        alpha: 0.18 + Math.random()*0.3,
        gust: 0.6 + Math.random()*0.8
      });
    }
  }

  // drifting mist bands that visualise wind during the rain scene
  let fogBands = [];
  function buildFog(){
    fogBands = [];
    const count = 5;
    for(let i=0;i<count;i++){
      fogBands.push({
        y: H * (0.1 + i*0.16) + Math.random()*H*0.05,
        x: Math.random()*W,
        w: W * (0.55 + Math.random()*0.5),
        h: H * (0.08 + Math.random()*0.06),
        speed: (18 + Math.random()*24) * DPR,
        alpha: 0.03 + Math.random()*0.035
      });
    }
  }

  // small warm sparkle points scattered near the sun for a genuine "shine"
  let sunSparks = [];
  function buildSparks(){
    sunSparks = [];
    const count = 26;
    for(let i=0;i<count;i++){
      const ang = Math.random()*Math.PI*2;
      const dist = 0.9 + Math.random()*2.6;
      sunSparks.push({
        ang: ang,
        dist: dist,
        r: (0.7 + Math.random()*1.6) * DPR,
        phase: Math.random()*Math.PI*2,
        speed: 0.001 + Math.random()*0.003
      });
    }
  }

  resize();
  window.addEventListener('resize', resize);

  function grad(y0,y1,stops){
    const g = ctx.createLinearGradient(0,y0,0,y1);
    stops.forEach(function(s){ g.addColorStop(s[0], s[1]); });
    return g;
  }

  /* ---- individual sky renderers ---- */
  function drawSpace(time){
    ctx.fillStyle = grad(0,H,[[0,'#05030c'],[0.6,'#0b0616'],[1,'#140b21']]);
    ctx.fillRect(0,0,W,H);

    // faint drifting nebula blobs
    const blobs = [
      { x:W*0.22, y:H*0.28, r:Math.max(W,H)*0.28, c:'rgba(123,143,224,0.10)' },
      { x:W*0.78, y:H*0.18, r:Math.max(W,H)*0.22, c:'rgba(154,111,217,0.10)' },
      { x:W*0.55, y:H*0.55, r:Math.max(W,H)*0.20, c:'rgba(95,176,201,0.06)' }
    ];
    blobs.forEach(function(b){
      const rg = ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
      rg.addColorStop(0,b.c);
      rg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0,0,W,H);
    });

    stars.forEach(function(s){
      const tw = 0.5 + 0.5*Math.sin(time*s.speed + s.phase);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(243,236,228,' + (0.25 + tw*0.65) + ')';
      ctx.fill();
    });
  }

  function drawSun(time){
    ctx.fillStyle = grad(0,H,[[0,'#1c0f26'],[0.4,'#3a1a2c'],[0.66,'#8a3f2c'],[0.86,'#e08a3e'],[1,'#f4b667']]);
    ctx.fillRect(0,0,W,H);

    const cx = W*0.5;
    const horizonY = H*0.74;
    const bob = Math.sin(time*0.0006)*H*0.008;
    const cy = horizonY - H*0.08 + bob;
    const r = Math.min(W,H)*0.145;
    const shimmer = 0.92 + 0.08*Math.sin(time*0.0021);

    // wide atmospheric haze low in the sky, warms everything near the horizon
    const haze = ctx.createRadialGradient(cx, horizonY, 0, cx, horizonY, Math.max(W,H)*0.62);
    haze.addColorStop(0, 'rgba(255,196,120,0.35)');
    haze.addColorStop(0.5, 'rgba(232,137,79,0.14)');
    haze.addColorStop(1, 'rgba(232,137,79,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0,0,W,H);

    // rotating god-rays, drawn additively so they actually look like light
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(time*0.00007);
    ctx.globalCompositeOperation = 'lighter';
    const rayCount = 18;
    for(let i=0;i<rayCount;i++){
      const ang = (Math.PI*2/rayCount)*i;
      const flicker = 0.6 + 0.4*Math.sin(time*0.0009 + i*1.7);
      const len = r * (6.4 + 1.3*flicker);
      const rg = ctx.createLinearGradient(0,0, Math.cos(ang)*len, Math.sin(ang)*len);
      rg.addColorStop(0, 'rgba(255,232,190,' + (0.16*shimmer*flicker) + ')');
      rg.addColorStop(0.4, 'rgba(255,214,160,' + (0.07*shimmer) + ')');
      rg.addColorStop(1, 'rgba(255,214,160,0)');
      ctx.strokeStyle = rg;
      ctx.lineWidth = r*0.15;
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(Math.cos(ang)*len, Math.sin(ang)*len);
      ctx.stroke();
    }
    ctx.restore();

    // broad pulsing glow, sitting under the core
    const glow = ctx.createRadialGradient(cx,cy,0,cx,cy,r*4.2*shimmer);
    glow.addColorStop(0,'rgba(255,236,196,' + (0.7*shimmer) + ')');
    glow.addColorStop(0.32,'rgba(255,210,150,0.34)');
    glow.addColorStop(0.65,'rgba(232,137,79,0.16)');
    glow.addColorStop(1,'rgba(232,137,79,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,W,H);

    // bright core
    const core = ctx.createRadialGradient(cx,cy,0,cx,cy,r*shimmer);
    core.addColorStop(0,'#fffdf6');
    core.addColorStop(0.45,'#ffe8b8');
    core.addColorStop(0.8,'#f7b869');
    core.addColorStop(1,'#e88a4a');
    ctx.beginPath();
    ctx.arc(cx,cy,r*shimmer,0,Math.PI*2);
    ctx.fillStyle = core;
    ctx.fill();
    // hot white center for a genuine "shining" hotspot
    ctx.beginPath();
    ctx.arc(cx,cy,r*0.34,0,Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();

    // scattered warm sparkle points around the corona, twinkling like heat shimmer
    sunSparks.forEach(function(sp){
      const tw = 0.4 + 0.6*Math.max(0, Math.sin(time*sp.speed + sp.phase));
      const sx = cx + Math.cos(sp.ang)*r*sp.dist;
      const sy = cy + Math.sin(sp.ang)*r*sp.dist*0.7;
      ctx.beginPath();
      ctx.arc(sx, sy, sp.r*(0.6+tw), 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,238,205,' + (tw*0.55) + ')';
      ctx.fill();
    });

    // lens-flare dots trailing away from the sun, opposite the frame center
    const vx = cx - W*0.5, vy = cy - H*0.5;
    [0.35,0.6,0.9,1.25].forEach(function(fp,i){
      const fx = cx - vx*fp*0.55;
      const fy = cy - vy*fp*0.55;
      const fr = r*(0.14/(i+1));
      const fg = ctx.createRadialGradient(fx,fy,0,fx,fy,fr);
      fg.addColorStop(0,'rgba(255,232,195,0.22)');
      fg.addColorStop(1,'rgba(255,232,195,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(fx,fy,fr,0,Math.PI*2);
      ctx.fill();
    });

    // distant hill silhouette so the sun reads as setting into a real horizon
    ctx.beginPath();
    ctx.moveTo(0, horizonY + H*0.02);
    const peaks = [0.05,0.16,0.24,0.34,0.44,0.5,0.58,0.68,0.78,0.88,0.97];
    peaks.forEach(function(p, i){
      const wob = Math.sin(p*14 + 2)*H*0.012;
      ctx.lineTo(W*p, horizonY - H*0.02 - Math.abs(Math.sin(p*7))*H*0.05 + wob);
    });
    ctx.lineTo(W, horizonY + H*0.02);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    const hillGrad = grad(horizonY-H*0.07, H, [[0,'#20101c'],[1,'#0d0712']]);
    ctx.fillStyle = hillGrad;
    ctx.fill();

    // warm light spilling along the horizon line, in front of the hills
    ctx.fillStyle = 'rgba(255,214,150,' + (0.08*shimmer) + ')';
    ctx.fillRect(0, horizonY - H*0.01, W, H*0.03);
  }

  // wind state shared by the rain scene
  let windPhase = 0;
  function drawRain(time, rainWeight){
    ctx.fillStyle = grad(0,H,[[0,'#0c0f16'],[0.55,'#141a24'],[1,'#1c2430']]);
    ctx.fillRect(0,0,W,H);

    // soft distant cloud mass, brightened briefly right after a strike
    const flashGlow = flashAlpha * 0.5;
    const mist = ctx.createRadialGradient(W*0.5,H*0.05,0,W*0.5,H*0.05,Math.max(W,H)*0.7);
    mist.addColorStop(0,'rgba(150,168,196,' + (0.10 + flashGlow) + ')');
    mist.addColorStop(1,'rgba(140,160,190,0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0,0,W,H);

    // wind: a slowly oscillating gust strength drives both the fog drift and the rain's slant
    windPhase += 0.006;
    const gust = 0.5 + 0.5*Math.sin(windPhase) + 0.25*Math.sin(windPhase*2.7 + 1.4);
    const windStrength = Math.max(0, Math.min(1.3, gust));

    // horizontal mist bands drifting sideways, the clearest visual read of wind
    fogBands.forEach(function(f){
      f.x += f.speed * (0.4 + windStrength) * 0.016;
      if(f.x - f.w > W) f.x = -f.w;
      const fg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.w*0.5);
      fg.addColorStop(0, 'rgba(200,212,228,' + f.alpha + ')');
      fg.addColorStop(1, 'rgba(200,212,228,0)');
      ctx.save();
      ctx.scale(1, f.h/f.w);
      ctx.translate(0, f.y*(1 - f.w/f.h));
      ctx.fillStyle = fg;
      ctx.fillRect(0,0,W,H*(f.w/f.h));
      ctx.restore();
    });

    ctx.lineCap = 'round';
    const slant = (2 + windStrength*9) * DPR;
    drops.forEach(function(d){
      const localWind = slant * d.gust;
      d.y += d.speed * (0.7 + windStrength*0.6);
      d.x -= localWind * 0.12;
      if(d.y - d.len > H){ d.y = -d.len; d.x = Math.random()*W; }
      if(d.x < -20*DPR){ d.x = W + 20*DPR; }
      ctx.strokeStyle = 'rgba(190,210,230,' + (d.alpha + flashGlow*0.4) + ')';
      ctx.lineWidth = 1 * DPR;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - localWind, d.y + d.len);
      ctx.stroke();
    });
  }

  function drawNight(time){
    ctx.fillStyle = grad(0,H,[[0,'#050611'],[0.6,'#0b0e22'],[1,'#141230']]);
    ctx.fillRect(0,0,W,H);

    const mx = W*0.74, my = H*0.22, mr = Math.min(W,H)*0.075;
    const glow = ctx.createRadialGradient(mx,my,0,mx,my,mr*3.4);
    glow.addColorStop(0,'rgba(210,215,255,0.28)');
    glow.addColorStop(1,'rgba(210,215,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,W,H);

    ctx.beginPath();
    ctx.arc(mx,my,mr,0,Math.PI*2);
    ctx.fillStyle = '#eceaf5';
    ctx.fill();
    // crescent shadow
    ctx.beginPath();
    ctx.arc(mx + mr*0.42, my - mr*0.12, mr*0.92, 0, Math.PI*2);
    ctx.fillStyle = '#0b0e22';
    ctx.fill();

    stars.forEach(function(s, i){
      if(i % 2 === 0) return; // sparser field at night
      const tw = 0.5 + 0.5*Math.sin(time*s.speed*0.7 + s.phase);
      ctx.beginPath();
      ctx.arc(s.x, s.y*0.9, s.r*0.9, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(230,228,245,' + (0.18 + tw*0.5) + ')';
      ctx.fill();
    });
  }

  const scenes = [
    { name:'Deep Space',   draw:function(t){ drawSpace(t); },              ambient:[42,31,102]  },
    { name:'Golden Hour',  draw:function(t){ drawSun(t); },                ambient:[110,58,30]  },
    { name:'Raining',      draw:function(t,rw){ drawRain(t, rw); },        ambient:[28,38,54]   },
    { name:'Night',        draw:function(t){ drawNight(t); },              ambient:[24,26,66]   }
  ];

  const HOLD = 5200;        // ms fully showing a scene
  const TRANSITION = 2200;  // ms crossfading into the next
  const SEGMENT = HOLD + TRANSITION;

  let lastTagIndex = -1;

  /* ---- thunder: flashes + shake, only scheduled while the rain scene is (partly) visible ---- */
  let flashAlpha = 0;
  let nextFlashTime = 3200 + Math.random()*2500;

  function triggerFlash(intensity){
    const peak = (0.75 + Math.random()*0.25) * intensity;
    strikeEl.style.transition = 'none';
    strikeEl.style.opacity = String(peak);
    flashAlpha = peak;
    requestAnimationFrame(function(){
      strikeEl.style.transition = 'opacity 0.6s ease-out';
      strikeEl.style.opacity = '0';
    });
    setTimeout(function(){ flashAlpha = 0; }, 550);

    canvas.classList.remove('thunder-shake');
    waveCanvas.classList.remove('thunder-shake');
    void canvas.offsetWidth;
    canvas.classList.add('thunder-shake');
    waveCanvas.classList.add('thunder-shake');

    // real storms flicker twice sometimes before the boom fades
    if(Math.random() < 0.45){
      setTimeout(function(){ triggerFlash(intensity*0.6); }, 90 + Math.random()*140);
    }
  }

  function frame(time){
    const total = SEGMENT * scenes.length;
    const t = time % total;
    const idx = Math.floor(t / SEGMENT);
    const into = t - idx * SEGMENT;
    const nextIdx = (idx + 1) % scenes.length;
    const eased = into > HOLD ? (function(){ const b = Math.min(1,(into-HOLD)/TRANSITION); return b*b*(3-2*b); })() : 0;

    // how much of the Raining scene is currently on screen (0..1), used for thunder + ambient
    const RAIN_IDX = 2;
    let rainWeight = 0;
    if(idx === RAIN_IDX) rainWeight = into > HOLD ? (1-eased) : 1;
    else if(nextIdx === RAIN_IDX && into > HOLD) rainWeight = eased;

    scenes[idx].draw(time, rainWeight);

    if(into > HOLD){
      ctx.save();
      ctx.globalAlpha = eased;
      scenes[nextIdx].draw(time, rainWeight);
      ctx.restore();
      if(eased > 0.5 && lastTagIndex !== nextIdx){
        lastTagIndex = nextIdx;
        tagEl.style.opacity = 0;
        setTimeout(function(){
          tagEl.textContent = scenes[nextIdx].name;
          tagEl.style.opacity = 0.75;
        }, 180);
      }
    } else if(lastTagIndex !== idx && into < 60){
      lastTagIndex = idx;
      tagEl.textContent = scenes[idx].name;
    }

    // tint the whole page to match the current sky, blending across transitions
    const a = scenes[idx].ambient, b = scenes[nextIdx].ambient;
    const mix = into > HOLD ? eased : 0;
    const rC = Math.round(a[0] + (b[0]-a[0])*mix);
    const gC = Math.round(a[1] + (b[1]-a[1])*mix);
    const bC = Math.round(a[2] + (b[2]-a[2])*mix);
    ambientEl.style.backgroundColor = 'rgb(' + rC + ',' + gC + ',' + bC + ')';

    // schedule thunder only while rain is meaningfully visible
    if(rainWeight > 0.35){
      if(time > nextFlashTime){
        triggerFlash(0.6 + rainWeight*0.4);
        nextFlashTime = time + 2600 + Math.random()*5200;
      }
    } else if(time > nextFlashTime - 1500){
      // keep pushing the schedule forward while we're not in the rain scene
      nextFlashTime = time + 2600 + Math.random()*4000;
    }

    if(!reduced) requestAnimationFrame(frame);
  }

  if(reduced){
    drawSpace(0);
    tagEl.textContent = 'Deep Space';
    ambientEl.style.backgroundColor = 'rgb(42,31,102)';
  } else {
    requestAnimationFrame(frame);
  }
})();
</script>

<script>
/* ---------- Foreground waveform (reacts to mood hover/select) ---------- */
(function(){
  const canvas = document.getElementById('wave');
  const ctx = canvas.getContext('2d');
  const root = document.documentElement;
  const moodGlow = document.getElementById('moodGlow');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W, H, DPR;
  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = window.innerWidth * DPR;
    H = canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  function hexToRgb(hex){
    const v = parseInt(hex.slice(1), 16);
    return [(v>>16)&255, (v>>8)&255, v&255];
  }
  function lerp(a,b,t){ return a + (b-a)*t; }
  function lerpColor(c1, c2, t){
    return [ lerp(c1[0],c2[0],t), lerp(c1[1],c2[1],t), lerp(c1[2],c2[2],t) ];
  }

  const DEFAULT_COLOR = hexToRgb('#9a6fd9');
  let currentColor = DEFAULT_COLOR.slice();
  let targetColor = DEFAULT_COLOR.slice();
  let amp = 1;
  let targetAmp = 1;

  let t = 0;
  function draw(){
    ctx.clearRect(0,0,W,H);
    currentColor = lerpColor(currentColor, targetColor, 0.045);
    amp = lerp(amp, targetAmp, 0.06);

    const midY = H * 0.46;
    const lines = [
      { freq: 0.0016, phase: 0,    baseAmp: H*0.055, speed: 0.006, alpha: 0.16, width: 1.4 },
      { freq: 0.0022, phase: 1.8,  baseAmp: H*0.032, speed: 0.009, alpha: 0.22, width: 1.1 },
      { freq: 0.0011, phase: 3.4,  baseAmp: H*0.075, speed: 0.004, alpha: 0.10, width: 1.8 },
    ];

    lines.forEach(function(ln){
      ctx.beginPath();
      const [r,g,b] = currentColor;
      ctx.strokeStyle = 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + ln.alpha + ')';
      ctx.lineWidth = ln.width * DPR;
      for(let x=0; x<=W; x+=4*DPR){
        const y = midY + Math.sin(x*ln.freq + t*ln.speed + ln.phase) * ln.baseAmp * amp
                        + Math.sin(x*ln.freq*0.5 + t*ln.speed*0.6) * ln.baseAmp * 0.3 * amp;
        if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    });

    t += 1;
    if(!reduced) requestAnimationFrame(draw);
  }
  draw();
  if(reduced){
    let frames = 0;
    const iv = setInterval(function(){ draw(); frames++; if(frames>40) clearInterval(iv); }, 30);
  }

  const moodWord = document.getElementById('moodWord');
  const buttons = document.querySelectorAll('.mood');
  let activeBtn = null;

  buttons.forEach(function(btn){
    const color = btn.getAttribute('data-color');
    btn.style.setProperty('--mood-color', color);

    function activate(){
      targetColor = hexToRgb(color);
      targetAmp = 1.9;
      root.style.setProperty('--accent', color);
      moodWord.style.color = color;
      moodWord.textContent = btn.getAttribute('data-word');
      moodGlow.style.setProperty('--mood-color', color);
      moodGlow.style.opacity = '0.5';
    }
    function release(){
      if(activeBtn === btn) return;
      targetColor = DEFAULT_COLOR.slice();
      targetAmp = 1;
      root.style.setProperty('--accent', '#9a6fd9');
      moodWord.style.color = '';
      moodWord.textContent = 'heart';
      moodGlow.style.opacity = '0';
    }

    btn.addEventListener('mouseenter', activate);
    btn.addEventListener('mouseleave', release);
    btn.addEventListener('focus', activate);
    btn.addEventListener('blur', release);
    btn.addEventListener('click', function(){
      buttons.forEach(function(b){ b.classList.remove('active'); });
      if(activeBtn === btn){
        activeBtn = null;
        release();
      } else {
        btn.classList.add('active');
        activeBtn = btn;
        activate();
      }
    });
  });
})();
</script>

</body>
</html>