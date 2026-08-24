import { useState, useEffect } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, ArrowLeft,
  ArrowRight, ChevronDown, Pencil, MessageSquare, Lock, Send, Mic, CloudRain,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   DATA
   ──────────────────────────────────────────────────────────── */

const MOODS = [
  {
    slug: "in-love",
    label: "I'm in Love",
    group: "Love",
    theme: { from: "#2B0F14", via: "#4A1B22", to: "#5C2430", accent: "#E8A9AE", accent2: "#F0CBA0", pulse: 4.2 },
    quote: "Some feelings don't need a reason. They just need a song.",
    visualLabel: "GOLDEN HOUR · CITY WALK · 6:48 PM",
    stories: [
      {
        title: "The Walk Home",
        author: "Anonymous, 24",
        tags: ["new love", "butterflies"],
        content:
          "We took the long way home again. Neither of us said why. The streetlights were doing that thing where they flicker on one at a time, and I remember thinking — I want to remember this exact version of tired.",
      },
      {
        title: "Golden Hour",
        author: "Anonymous",
        tags: ["warm", "hopeful"],
        content:
          "Everything looks different now. The streets I walked a thousand times suddenly look like film stills. I catch myself smiling at nothing — at the way light moves through trees, at songs I've heard a hundred times that suddenly make sense.",
      },
      {
        title: "The List",
        author: "Anonymous, 19",
        tags: ["new love", "nervous"],
        content:
          "I made a list once of everything I wanted in someone. You don't match half of it. You match all of the things I didn't know to ask for.",
      },
    ],
    playlistName: "Falling in Love Slowly",
    tracks: [
      { title: "Slow Bloom", artist: "Wren & Sable", duration: "3:12" },
      { title: "First of Many", artist: "Coral Season", duration: "2:58" },
      { title: "Golden Hour Again", artist: "Marlowe", duration: "3:41" },
    ],
    wall: [
      { text: "Told my roommate about you tonight and I couldn't stop smiling. She said she's never seen me like this.", author: "Anonymous, 22" },
      { text: "I keep finding excuses to walk past the coffee shop where we met. Worth it every time.", author: "Anonymous" },
    ],
  },
  {
    slug: "heartbroken",
    label: "Heartbroken",
    group: "Heartbreak",
    theme: { from: "#0E0508", via: "#2B0A12", to: "#3B0F17", accent: "#8C2733", accent2: "#C9A9A9", pulse: 6.5 },
    quote: "Some songs don't heal you. They just understand you.",
    visualLabel: "RAIN · WINDOW · 11:42 PM",
    stories: [
      {
        title: "Still Checking",
        author: "Anonymous",
        tags: ["heartbreak", "missing them"],
        content:
          "I still check their profile sometimes. Not because I want them back. I just want to know if they remember me the way I remember them — or if I've already become a Tuesday to them.",
      },
      {
        title: "Muscle Memory",
        author: "Anonymous, 26",
        tags: ["heartbreak", "habit"],
        content:
          "My phone still opens to your chat sometimes, like my thumb hasn't caught up with the rest of me. It's been four months. Some mornings that feels like nothing. Some mornings it feels like yesterday.",
      },
      {
        title: "The Last Text",
        author: "Anonymous",
        tags: ["heartbreak", "closure"],
        content:
          "You said 'take care of yourself' like it was a period at the end of a sentence. I've read it forty times looking for a comma.",
      },
    ],
    playlistName: "Songs I Wish I Could Send Them",
    tracks: [
      { title: "Unsent", artist: "Low Tide Choir", duration: "4:02" },
      { title: "Empty Side of the Bed", artist: "Nadia Voss", duration: "3:24" },
      { title: "Ghost Light", artist: "Marlowe", duration: "3:57" },
    ],
    wall: [
      { text: "Deleted the photos. Kept the playlist. Some things you're just not ready to let go of yet.", author: "Anonymous, 29" },
      { text: "It's been a year. I still set the table for two on accident sometimes.", author: "Anonymous" },
    ],
  },
  {
    slug: "one-sided",
    label: "One Sided",
    group: "Relationships",
    theme: { from: "#120E17", via: "#241A2E", to: "#2F2038", accent: "#9B7FB8", accent2: "#C7B8D6", pulse: 5.4 },
    quote: "I loved loud enough for two people. Only one of us noticed.",
    visualLabel: "EMPTY CHAIR · CAFÉ WINDOW · 4:10 PM",
    stories: [
      {
        title: "The Reply I Practiced",
        author: "Anonymous, 21",
        tags: ["one sided", "unspoken"],
        content:
          "I had a whole reply ready if you ever asked how I felt. Three years of editing it down. You never asked. I think some of us just get really good at loving quietly and calling it patience.",
      },
      {
        title: "Front Row",
        author: "Anonymous",
        tags: ["one sided", "friendship"],
        content:
          "I know your coffee order, your Sunday routine, the name of your childhood dog. You know I exist. That's the whole trade, and somehow I keep making it.",
      },
      {
        title: "Almost Said It",
        author: "Anonymous, 23",
        tags: ["one sided", "almost"],
        content:
          "I got as far as 'I need to tell you something' four separate times. Each time I finished the sentence with 'never mind.' I think I like the almost more than I'd like the answer.",
      },
    ],
    playlistName: "3AM Thoughts",
    tracks: [
      { title: "You Never Asked", artist: "Coral Season", duration: "3:33" },
      { title: "Practiced Reply", artist: "Nadia Voss", duration: "2:49" },
      { title: "Quiet Kind of Loud", artist: "Wren & Sable", duration: "3:15" },
    ],
    wall: [
      { text: "I'm good at being someone's favorite secret. I'd like to just be someone's favorite, once.", author: "Anonymous, 24" },
      { text: "Loving someone quietly is still loving them. I just wish it felt like enough.", author: "Anonymous" },
    ],
  },
  {
    slug: "long-distance",
    label: "Long Distance",
    group: "Relationships",
    theme: { from: "#050810", via: "#101A30", to: "#182644", accent: "#7C8FE0", accent2: "#C6CEEC", pulse: 5.0 },
    quote: "Two time zones, one heartbeat, running slightly out of sync.",
    visualLabel: "NIGHT TRAIN · CITY LIGHTS · 1:15 AM",
    stories: [
      {
        title: "Seven Hours Ahead",
        author: "Anonymous",
        tags: ["long distance", "waiting"],
        content:
          "You're having breakfast while I'm falling asleep. I've learned to love someone in fragments — a good-morning that arrives at midnight, a goodnight that greets my alarm. Distance made me fluent in a language only we speak.",
      },
      {
        title: "Departures Board",
        author: "Anonymous, 25",
        tags: ["long distance", "airports"],
        content:
          "I've started to like airports. They're the only place that feels honest about how this works — a countdown, a gate number, the exact minute we stop being in the same room.",
      },
      {
        title: "Same Moon",
        author: "Anonymous",
        tags: ["long distance", "small comforts"],
        content:
          "Someone told me we're looking at the same moon, just at different times, and I've never let go of that. It's not much. It's ours.",
      },
    ],
    playlistName: "Long Distance Nights",
    tracks: [
      { title: "Seven Hours Ahead", artist: "Marlowe", duration: "3:48" },
      { title: "Time Zones", artist: "Low Tide Choir", duration: "4:11" },
      { title: "Landing Soon", artist: "Wren & Sable", duration: "3:02" },
    ],
    wall: [
      { text: "Booked the ticket. 14 days until I get to hug you for real instead of through a screen.", author: "Anonymous, 26" },
      { text: "We do a video call dinner every Friday. It's not the same table, but it's still ours.", author: "Anonymous" },
    ],
  },
  {
    slug: "lonely",
    label: "Lonely",
    group: "Life",
    theme: { from: "#0A0C0F", via: "#1A1D22", to: "#22262C", accent: "#6E7681", accent2: "#9AA3AD", pulse: 7.2 },
    quote: "A full room can still feel like an empty one.",
    visualLabel: "EMPTY ROOM · STREETLIGHT · 10:03 PM",
    stories: [
      {
        title: "The Sound of the Fridge",
        author: "Anonymous, 27",
        tags: ["lonely", "quiet"],
        content:
          "It's not the big moments that get me. It's the small ones — cooking for one, hearing the fridge hum louder than usual. I've started leaving the radio on, just so the apartment sounds a little more like it's mine and a little less like it's just me.",
      },
      {
        title: "Group Chat",
        author: "Anonymous",
        tags: ["lonely", "crowded"],
        content:
          "I'm in six group chats and I still typed 'anyone up?' into a search bar before remembering there was no one to send it to.",
      },
      {
        title: "Two Cups",
        author: "Anonymous, 30",
        tags: ["lonely", "habit"],
        content:
          "I still buy the two-person size of everything. I tell myself it's just cheaper per unit. I don't examine that sentence too closely.",
      },
    ],
    playlistName: "Songs for the Quiet Hours",
    tracks: [
      { title: "Radio On", artist: "Nadia Voss", duration: "3:29" },
      { title: "Room for One", artist: "Low Tide Choir", duration: "3:56" },
      { title: "Streetlight Hum", artist: "Coral Season", duration: "2:41" },
    ],
    wall: [
      { text: "I called my mom just to hear a voice that wasn't the TV. Didn't even have anything to say.", author: "Anonymous, 31" },
      { text: "Started talking to my plants. They're better listeners than half my group chat.", author: "Anonymous" },
    ],
  },
  {
    slug: "late-night",
    label: "Late Night",
    group: "Life",
    theme: { from: "#07070C", via: "#15111F", to: "#1F1830", accent: "#7A6FBE", accent2: "#B7A8E8", pulse: 4.6 },
    quote: "Every thought sounds louder after midnight.",
    visualLabel: "CEILING FAN · PHONE GLOW · 2:37 AM",
    stories: [
      {
        title: "The Thoughts That Wait",
        author: "Anonymous",
        tags: ["late night", "overthinking"],
        content:
          "My thoughts are polite during the day. They wait their turn. But at 2AM they all show up at once, uninvited, rearranging the furniture in my head until I give up on sleeping and just sit with them for a while.",
      },
      {
        title: "The Replay",
        author: "Anonymous, 22",
        tags: ["late night", "regret"],
        content:
          "I replayed a conversation from 2019 tonight and lost an argument I never actually had. My brain keeps the receipts for things nobody's asking about.",
      },
      {
        title: "Ceiling Stare",
        author: "Anonymous",
        tags: ["late night", "insomnia"],
        content:
          "There's a crack in my ceiling shaped like a river. I've mapped its whole coastline by now. Some nights that's the only progress I make.",
      },
    ],
    playlistName: "2AM Thoughts",
    tracks: [
      { title: "Ceiling Fan", artist: "Marlowe", duration: "3:20" },
      { title: "Uninvited", artist: "Nadia Voss", duration: "3:44" },
      { title: "Sit With It", artist: "Wren & Sable", duration: "4:05" },
    ],
    wall: [
      { text: "3AM me makes plans that 9AM me has to deal with. We do not communicate well.", author: "Anonymous, 20" },
      { text: "The quiet used to scare me. Now it's the only time my brain slows down enough to hear itself.", author: "Anonymous" },
    ],
  },
];

/* ────────────────────────────────────────────────────────────
   DETERMINISTIC PARTICLE HELPERS
   (no Math.random so the scene doesn't reshuffle on re-render)
   ──────────────────────────────────────────────────────────── */

function seeded(i, salt = 1) {
  const x = Math.sin(i * 12.9898 * salt + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function particles(count, salt) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    r1: seeded(i, salt),
    r2: seeded(i + 100, salt),
    r3: seeded(i + 200, salt),
    r4: seeded(i + 300, salt),
  }));
}

function hexToRgbTriplet(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function hexToRgba(hex, alpha) {
  return `rgba(${hexToRgbTriplet(hex)}, ${alpha})`;
}

/* ────────────────────────────────────────────────────────────
   STYLES
   ──────────────────────────────────────────────────────────── */

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

    .pml { position: relative; width: 100%; min-height: 100vh; background: #0D0B10; color: #F3EEE6;
      font-family: 'Inter', sans-serif; overflow-x: hidden; }
    .pml * { box-sizing: border-box; }
    .pml-serif { font-family: 'Cormorant Garamond', serif; }
    .pml-mono { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.12em; }

    .pml button { font-family: inherit; cursor: pointer; }
    .pml button:focus-visible, .pml a:focus-visible, .pml [tabindex]:focus-visible {
      outline: 2px solid #E8A9AE; outline-offset: 3px; border-radius: 4px;
    }

    /* ── HOME ── */
    .pml-home { position: relative; min-height: 100vh; display: flex; flex-direction: column; }
    .pml-home-bg {
      position: absolute; inset: 0; z-index: 0;
      background:
        radial-gradient(ellipse 60% 45% at 50% 38%, rgba(139,127,209,0.22), transparent 70%),
        linear-gradient(180deg, #0D0B10 0%, #120E18 55%, #0A0810 100%);
      overflow: hidden;
    }
    .pml-grain { position: absolute; inset: -20%; opacity: 0.05; mix-blend-mode: overlay; pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }
    .pml-orb { position: absolute; top: 30%; left: 50%; width: 620px; height: 620px; margin-left: -310px;
      border-radius: 50%; background: radial-gradient(circle, rgba(201,162,75,0.16), transparent 65%);
      filter: blur(40px); animation: pmlbreathe 7s ease-in-out infinite; }
    @keyframes pmlbreathe { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.08); opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .pml-orb { animation: none; } }

    .pml-nav { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between;
      padding: 28px 5vw; }
    .pml-wordmark { font-family: 'Cormorant Garamond', serif; font-size: clamp(16px, 3vw, 20px); letter-spacing: 0.22em; }
    .pml-navlinks { display: flex; gap: 36px; font-size: 14px; color: #B7AFC2; }
    .pml-navlinks span { cursor: default; }
    @media (max-width: 560px) { .pml-navlinks { display: none; } }

    .pml-hero { position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; text-align: center; padding: 40px 6vw 60px; }
    .pml-hero h1 { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-style: italic;
      font-size: clamp(2.4rem, 6.4vw, 5rem); line-height: 1.08; max-width: 16ch; margin: 0 0 22px; }
    .pml-hero p { color: #B7AFC2; font-size: 15px; letter-spacing: 0.04em; margin: 0 0 56px; }

    .pml-moodgrid { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; max-width: 780px; }
    .pml-moodchip { position: relative; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12);
      color: #F3EEE6; padding: 11px 22px; border-radius: 999px; font-size: 14px;
      transition: border-color .25s ease, background .25s ease, transform .25s ease; }
    .pml-moodchip:hover { border-color: rgba(232,169,174,0.6); background: rgba(232,169,174,0.08); transform: translateY(-1px); }
    .pml-moodchip:active { transform: translateY(0) scale(0.96); }

    .pml-explore { margin-top: 44px; font-size: 13px; color: #8B7FD1; display: inline-flex; align-items: center; gap: 6px;
      background: none; border: none; }
    .pml-explore:hover { color: #B7A8E8; }

    .pml-scrolldown { position: relative; z-index: 2; display: flex; justify-content: center; padding-bottom: 30px; color: #55506A; }
    @media (prefers-reduced-motion: no-preference) { .pml-scrolldown svg { animation: pmlbob 2s ease-in-out infinite; } }
    @keyframes pmlbob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }

    .pml-mood-enter { animation: pmlMoodEnter 520ms cubic-bezier(.22,.61,.36,1) both; }
    @keyframes pmlMoodEnter {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) { .pml-mood-enter { animation: none; } }

    /* ── MOOD EXPERIENCE ── */
    .pml-mood { position: relative; min-height: 100vh; display: flex; flex-direction: column; }
    .pml-mood-nav { position: relative; z-index: 7; display: flex; align-items: center; justify-content: space-between;
      padding: 24px 5vw 0; }
    .pml-back { display: flex; align-items: center; gap: 8px; background: none; border: none; color: #D8D2E4;
      font-size: 13px; padding: 8px 4px; opacity: 0.85; transition: opacity .2s ease; }
    .pml-back:hover { opacity: 1; }
    .pml-moodlabel-pill { font-size: 12px; padding: 7px 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.16); }

    .pml-mood-body { position: relative; flex: 1; display: grid; grid-template-columns: 0.78fr 1.4fr;
      gap: 28px; padding: 30px 5vw 130px; align-items: stretch; max-width: 1560px; margin: 0 auto; width: 100%; }
    @media (max-width: 1180px) { .pml-mood-body { grid-template-columns: 0.95fr 1.2fr; gap: 22px; } }
    @media (max-width: 880px) {
      .pml-mood-body { grid-template-columns: 1fr; padding: 20px 6vw 150px; gap: 30px; }
      .pml-story-col { order: 1; }
      .pml-left-col { order: 2; }
    }
    @media (max-width: 480px) { .pml-mood-body { padding: 18px 5vw 160px; gap: 24px; } }
    .pml-left-col { order: 1; display: flex; flex-direction: column; gap: 14px; min-height: 360px; min-width: 0; }
    .pml-story-col { order: 2; min-width: 0; }

    .pml-pulse { position: absolute; left: 26px; top: 100px; bottom: 130px; width: 1px;
      background: linear-gradient(180deg, transparent, rgba(255,255,255,0.25), transparent); z-index: 2; }
    @media (max-width: 880px) { .pml-pulse { display: none; } }
    .pml-pulse-dot { position: absolute; left: -3px; width: 7px; height: 7px; border-radius: 50%; }
    @media (prefers-reduced-motion: no-preference) { .pml-pulse-dot { animation: pmlpulse linear infinite; } }
    @keyframes pmlpulse { 0% { top: 0%; opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } 100% { top: 100%; opacity: 0; } }

    .pml-story-col { display: flex; flex-direction: column; justify-content: center; width: 100%; min-width: 0; }
    .pml-quote { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 400;
      font-size: clamp(1.55rem, 3.4vw, 2.7rem); line-height: 1.28; margin: 0 0 44px; }

    /* story column sits above the page-wide rain layer (higher z-index
       than the rain, now that pml-mood-body no longer traps it in its
       own stacking context), so rain never visually crosses it. Padding
       is constant whether raining or not — only background/blur toggle —
       so nothing shifts or bleeds sideways into the notecard column. */
    .pml-story-shield { position: relative; z-index: 8; width: 100%; border-radius: 22px; padding: 20px 56px;
      transition: background 0.5s ease, backdrop-filter 0.5s ease, box-shadow 0.5s ease; }
    .pml-story-shield.is-raining { background: linear-gradient(165deg, rgba(10,8,14,0.5), rgba(10,8,14,0.74));
      backdrop-filter: blur(4px) saturate(1.05); -webkit-backdrop-filter: blur(4px) saturate(1.05);
      box-shadow: 0 40px 90px rgba(0,0,0,0.4); }
    @media (max-width: 880px) { .pml-story-shield { padding: 14px 20px; } }
    .pml-story-shield .pml-quote, .pml-story-shield .pml-story-content { max-width: 760px; }

    .pml-story-block { animation: pmlStoryIn 480ms cubic-bezier(.22,.61,.36,1) both; }
    @keyframes pmlStoryIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) { .pml-story-block { animation: none; } }

    .pml-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
    .pml-tag { font-size: 10.5px; letter-spacing: 0.12em; padding: 5px 11px; border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.18); color: #D8D2E4; text-transform: uppercase; }
    .pml-story-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.5rem, 5vw, 2.6rem); margin: 0 0 18px; }
    .pml-story-content { font-size: clamp(14.5px, 1.7vw, 17.5px); line-height: 1.8; color: #DDD7E6; margin: 0 0 22px; }
    .pml-story-author { font-size: 12px; color: #8f88a3; letter-spacing: 0.04em; }

    .pml-storynav { display: flex; align-items: center; justify-content: space-between;
      margin-top: 34px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.1); }
    .pml-storynav-btn { display: flex; align-items: center; gap: 6px; background: none; border: none;
      color: #B7AFC2; font-size: 12.5px; padding: 4px 2px; transition: color 0.2s ease, opacity 0.2s ease; }
    .pml-storynav-btn:hover { color: #F3EEE6; }
    .pml-storynav-btn:active { transform: scale(0.97); }
    .pml-storynav-count { font-size: 10.5px; color: #6f6a80; }
    @media (max-width: 400px) { .pml-storynav-btn span { display: none; } }

    /* ── VISUAL PANEL (ambient mood scenes) ── */
    .pml-visual-col { position: relative; border-radius: 14px; overflow: hidden; flex: 0 0 200px;
      background: linear-gradient(160deg, var(--vfrom), var(--vvia) 55%, var(--vto) 100%); }
    @media (max-width: 880px) { .pml-visual-col { flex-basis: 240px; } }
    @media (max-width: 420px) { .pml-visual-col { flex-basis: 190px; } }

    /* ── WRITE / STORY WALL CARD ── */
    .pml-notecard { position: relative; flex: 1; display: flex; flex-direction: column; min-height: 320px;
      border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden;
      background: linear-gradient(165deg, var(--nvia) 0%, var(--nfrom) 100%); padding: 18px 20px 16px; }
    @media (max-width: 480px) { .pml-notecard { min-height: 260px; padding: 16px 16px 14px; } }

    .pml-notecard-tabs { display: inline-flex; align-self: flex-start; gap: 4px; padding: 3px;
      background: rgba(0,0,0,0.28); border-radius: 999px; margin-bottom: 16px; }
    .pml-notecard-tab { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px;
      background: none; border: none; color: #B7AFC2; font-size: 12px; transition: background .2s ease, color .2s ease; }
    .pml-notecard-tab.active { background: rgba(255,255,255,0.14); color: #F3EEE6; }

    .pml-notecard-textarea { flex: 1; width: 100%; min-height: 90px; resize: none; background: transparent;
      border: none; outline: none; color: #F3EEE6; font-family: 'Cormorant Garamond', serif; font-style: italic;
      font-size: clamp(1.02rem, 1.6vw, 1.3rem); line-height: 1.4; }
    .pml-notecard-textarea::placeholder { color: rgba(243,238,230,0.42); }

    .pml-notecard-footer { border-top: 1px solid rgba(255,255,255,0.1); margin-top: 14px; padding-top: 16px; }
    .pml-notecard-status { font-size: 10px; color: rgba(255,255,255,0.45); display: block; margin-bottom: 14px; }
    .pml-notecard-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .pml-notecard-btn { display: flex; align-items: center; justify-content: center; gap: 7px; flex: 1;
      padding: 12px 18px; border-radius: 999px; font-size: 13.5px; font-weight: 500; border: 1px solid transparent;
      white-space: nowrap; transition: opacity .2s ease, transform .2s ease; }
    .pml-notecard-btn:active { transform: scale(0.98); }
    .pml-notecard-btn.ghost { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.18); color: #F3EEE6; }
    .pml-notecard-btn.ghost:hover { background: rgba(255,255,255,0.09); }
    .pml-notecard-btn.solid { color: #17101A; }
    .pml-notecard-btn.solid:disabled { opacity: 0.4; cursor: not-allowed; }
    .pml-notecard-hint { font-size: 11px; color: rgba(255,255,255,0.4); text-align: center; margin: 12px 0 0; }

    .pml-notecard-voice { display: flex; align-items: center; justify-content: space-between;
      border-top: 1px solid rgba(255,255,255,0.1); margin-top: 16px; padding-top: 14px; font-size: 10.5px;
      color: rgba(255,255,255,0.5); }
    .pml-notecard-record { display: flex; align-items: center; gap: 7px; padding: 8px 15px; border-radius: 999px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.16); color: #F3EEE6; font-size: 12.5px;
      transition: background .2s ease, border-color .2s ease; }
    .pml-notecard-record.is-recording { border-color: var(--rec-color, #E8A9AE); color: var(--rec-color, #E8A9AE); }
    @media (prefers-reduced-motion: no-preference) {
      .pml-notecard-record.is-recording { animation: pmlRecPulse 1.1s ease-in-out infinite; }
    }
    @keyframes pmlRecPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(var(--rec-rgb, 232,169,174), 0.35); }
      50% { box-shadow: 0 0 0 6px rgba(var(--rec-rgb, 232,169,174), 0); }
    }

    .pml-wall-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 2px; }
    .pml-wall-empty { text-align: center; color: rgba(255,255,255,0.4); margin: auto; font-size: 11px; }
    .pml-wall-item { background: rgba(255,255,255,0.045); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; padding: 14px 16px; }
    .pml-wall-text { font-size: 13.5px; line-height: 1.6; color: #E7E2ED; margin: 0 0 8px; }
    .pml-wall-meta { font-size: 9.5px; color: rgba(255,255,255,0.4); }
    .pml-visual-art { position: absolute; inset: 0; }
    .pml-visual-blur1 { position: absolute; width: 60%; height: 60%; border-radius: 50%; filter: blur(70px); opacity: 0.5; }
    @media (prefers-reduced-motion: no-preference) { .pml-visual-blur1 { animation: pmldrift1 var(--pulse, 6s) ease-in-out infinite; } }
    .pml-visual-blur2 { position: absolute; width: 45%; height: 45%; border-radius: 50%; filter: blur(60px); opacity: 0.35; }
    @media (prefers-reduced-motion: no-preference) { .pml-visual-blur2 { animation: pmldrift2 calc(var(--pulse, 6s) * 1.4) ease-in-out infinite; } }
    @keyframes pmldrift1 { 0%,100% { transform: translate(-10%,-10%); } 50% { transform: translate(8%,6%); } }
    @keyframes pmldrift2 { 0%,100% { transform: translate(20%,20%); } 50% { transform: translate(4%,10%); } }
    .pml-visual-caption { position: absolute; left: 24px; bottom: 24px; font-size: 11px; color: rgba(255,255,255,0.6); z-index: 3; }
    .pml-visual-lines { position: absolute; inset: 0; opacity: 0.07;
      background-image: repeating-linear-gradient(180deg, transparent 0 38px, rgba(255,255,255,0.6) 38px 39px); }

    .pml-visual-scene { position: absolute; inset: 0; transform-origin: center; transition: filter 0.9s ease; }
    @media (prefers-reduced-motion: no-preference) {
      .pml-visual-scene { animation: pmlSceneBreathe 20s ease-in-out infinite; animation-play-state: var(--aps, running); }
    }
    @keyframes pmlSceneBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.045); } }

    .pml-visual-vignette { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
    .pml-visual-grain { position: absolute; inset: -20%; z-index: 3; opacity: 0.05; mix-blend-mode: overlay; pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

    .pml-visual-heartbeat { position: absolute; inset: 0; z-index: 3; pointer-events: none; border-radius: 2px; }
    @media (prefers-reduced-motion: no-preference) {
      .pml-visual-heartbeat { animation: pmlHeartbeat var(--pulse, 5s) ease-in-out infinite; animation-play-state: var(--aps, running); }
    }
    @keyframes pmlHeartbeat {
      0%, 100% { box-shadow: inset 0 0 50px 0 rgba(var(--hbrgb), 0.16); }
      50% { box-shadow: inset 0 0 90px 12px rgba(var(--hbrgb), 0.36); }
    }

    .pml-visual-fx { position: absolute; inset: 0; overflow: hidden; z-index: 2; }

    /* rain-mode toggle */
    .pml-rainmode-btn { position: absolute; top: 12px; right: 12px; z-index: 6; display: flex; align-items: center;
      gap: 6px; padding: 7px 13px; border-radius: 999px; background: rgba(0,0,0,0.38);
      border: 1px solid rgba(255,255,255,0.18); color: #F3EEE6; font-size: 11.5px; backdrop-filter: blur(6px);
      transition: background .25s ease, border-color .25s ease; }
    .pml-rainmode-btn:hover { background: rgba(0,0,0,0.52); }
    .pml-rainmode-btn.active { border-color: rgba(180,205,255,0.55); background: rgba(120,150,200,0.28); }

    /* ── PAGE-WIDE WEATHER (rain + thunder over the whole mood screen) ──
       Sits above pml-mood-body's own z-index (2) and the player-less
       chrome, but below the story shield (8) and the player (10), so
       everything gets rained on except the reading column and the dock. */
    .pml-page-weather { position: fixed; inset: 0; z-index: 4; overflow: hidden; pointer-events: none; }
    .pml-page-rain-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
      opacity: 0.6; mix-blend-mode: screen; }
    /* If/when you drop in a real rain-overlay clip (dark bg, white streaks,
       e.g. a free "rain overlay screen blend" stock clip), point the
       <video> src at it — mix-blend-mode: screen makes the black parts
       disappear and only the bright rain streaks composite over the page.
       The CSS raindrops below stay as an automatic fallback if the video
       is missing/slow to load, so it never looks broken. */
    .pml-page-rain-fallback { position: absolute; inset: 0; }
    .pml-page-rain-drop { position: absolute; top: -15%; width: 1.5px; border-radius: 2px;
      background: linear-gradient(180deg, transparent, rgba(255,255,255,0.7), rgba(255,255,255,0.15)); }
    @media (prefers-reduced-motion: no-preference) { .pml-page-rain-drop { animation: pmlPageRainFall linear infinite; } }
    @keyframes pmlPageRainFall {
      0% { transform: translateY(-10%) translateX(0); opacity: 0; }
      10% { opacity: 0.9; }
      90% { opacity: 0.35; }
      100% { transform: translateY(1150%) translateX(-2vw); opacity: 0; }
    }
    .pml-page-mist { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 60%, rgba(6,8,14,0.35) 100%); }

    .pml-page-thunder-flash { position: fixed; inset: 0; z-index: 5; pointer-events: none;
      background: radial-gradient(circle at 50% 8%, rgba(255,255,255,0.95), rgba(210,225,255,0.4) 40%, transparent 78%); }
    @media (prefers-reduced-motion: no-preference) { .pml-page-thunder-flash { animation: pmlThunderFlash 750ms ease-out forwards; } }
    @media (prefers-reduced-motion: reduce) { .pml-page-thunder-flash { display: none; } }
    @keyframes pmlThunderFlash {
      0% { opacity: 0; }
      6% { opacity: 0.75; }
      14% { opacity: 0.15; }
      22% { opacity: 0.5; }
      30% { opacity: 0.05; }
      100% { opacity: 0; }
    }

    /* small local rain still used inside the heartbroken mood's own
       ambient scene (unrelated to the page-wide rain-mode toggle) */
    .pml-rain { position: absolute; top: -15%; width: 1.5px; height: 70px; border-radius: 2px;
      background: linear-gradient(180deg, transparent, rgba(255,255,255,0.55), rgba(255,255,255,0.1)); }
    @media (prefers-reduced-motion: no-preference) { .pml-rain { animation: pmlRainFall linear infinite; } }
    @keyframes pmlRainFall {
      0% { transform: translateY(-20%); opacity: 0; }
      12% { opacity: 0.85; }
      88% { opacity: 0.4; }
      100% { transform: translateY(900%); opacity: 0; }
    }

    /* bokeh light (in love) */
    .pml-bokeh { position: absolute; border-radius: 50%; filter: blur(1.5px); }
    @media (prefers-reduced-motion: no-preference) { .pml-bokeh { animation: pmlFloatUp ease-in-out infinite; } }
    @keyframes pmlFloatUp {
      0% { transform: translate(0, 25%); opacity: 0; }
      18% { opacity: 0.85; }
      82% { opacity: 0.85; }
      100% { transform: translate(6%, -150%); opacity: 0; }
    }
    .pml-raylayer { position: absolute; inset: -30%; mix-blend-mode: screen; opacity: 0.5;
      background: conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.08) 10deg, transparent 24deg,
        transparent 160deg, rgba(255,255,255,0.06) 176deg, transparent 195deg,
        transparent 330deg, rgba(255,255,255,0.06) 345deg, transparent 360deg); }
    @media (prefers-reduced-motion: no-preference) { .pml-raylayer { animation: pmlRotateSlow 46s linear infinite; } }
    @keyframes pmlRotateSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* dust motes + light beam (one sided / lonely) */
    .pml-lightbeam { position: absolute; width: 150%; height: 15%; left: -25%; top: 6%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent);
      transform: rotate(20deg); filter: blur(10px); }
    .pml-dust { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.55); }
    @media (prefers-reduced-motion: no-preference) { .pml-dust { animation: pmlDustDrift ease-in-out infinite; } }
    @keyframes pmlDustDrift {
      0%, 100% { transform: translate(0,0); opacity: 0.15; }
      50% { transform: translate(14px,-22px); opacity: 0.55; }
    }

    /* streetlight cone (lonely) */
    .pml-streetcone { position: absolute; top: -10%; left: 8%; width: 34%; height: 70%;
      background: linear-gradient(200deg, rgba(255,255,255,0.10), transparent 70%);
      clip-path: polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%); filter: blur(6px); opacity: 0.8; }

    /* light streaks + stars (long distance) */
    .pml-streak { position: absolute; height: 2px; border-radius: 2px; filter: blur(1px); }
    @media (prefers-reduced-motion: no-preference) { .pml-streak { animation: pmlStreak linear infinite; } }
    @keyframes pmlStreak {
      0% { transform: translateX(-25%); opacity: 0; }
      15% { opacity: 0.8; }
      85% { opacity: 0.8; }
      100% { transform: translateX(760%); opacity: 0; }
    }
    .pml-star { position: absolute; border-radius: 50%; background: #fff; }
    @media (prefers-reduced-motion: no-preference) { .pml-star { animation: pmlTwinkle ease-in-out infinite; } }
    @keyframes pmlTwinkle {
      0%, 100% { opacity: 0.15; transform: scale(0.7); }
      50% { opacity: 0.9; transform: scale(1.2); }
    }

    /* fan blade shadow + phone glow (late night) */
    .pml-fanwrap { position: absolute; left: 50%; top: 30%; width: 160px; height: 160px; margin: -80px 0 0 -80px; }
    @media (prefers-reduced-motion: no-preference) { .pml-fanwrap { animation: pmlRotateSlow 5s linear infinite; } }
    .pml-fanblade { position: absolute; left: 50%; top: 50%; width: 2px; height: 78px;
      background: linear-gradient(180deg, rgba(255,255,255,0.16), transparent); filter: blur(2.5px);
      transform-origin: top center; }
    .pml-glowpulse { position: absolute; border-radius: 50%; filter: blur(34px); }
    @media (prefers-reduced-motion: no-preference) { .pml-glowpulse { animation: pmlGlowPulse ease-in-out infinite; } }
    @keyframes pmlGlowPulse {
      0%, 100% { transform: scale(1); opacity: 0.45; }
      50% { transform: scale(1.15); opacity: 0.8; }
    }

    /* ── PLAYER ── */
    .pml-player { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%); z-index: 10;
      width: min(560px, 90vw); background: rgba(15,13,20,0.72); backdrop-filter: blur(18px);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 999px; padding: 10px 20px 10px 10px;
      display: flex; align-items: center; gap: 14px; }
    .pml-player-art { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
    .pml-player-meta { min-width: 0; flex-shrink: 0; width: 118px; }
    .pml-player-title { font-size: 12.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pml-player-artist { font-size: 11px; color: #9b93ad; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pml-player-controls { display: flex; align-items: center; gap: 10px; color: #EDE8F2; flex-shrink: 0; }
    .pml-player-controls button { background: none; border: none; color: inherit; display: flex; }
    .pml-player-play { width: 30px; height: 30px; border-radius: 50%; background: #F3EEE6; color: #0D0B10;
      display: flex; align-items: center; justify-content: center; }
    .pml-progress-wrap { flex: 1; display: flex; align-items: center; gap: 8px; min-width: 60px; }
    .pml-progress-time { font-size: 10px; color: #8f88a3; width: 30px; text-align: center; flex-shrink: 0; }
    .pml-progress-track { position: relative; flex: 1; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.14); overflow: hidden; }
    .pml-progress-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; transition: width 0.2s linear; }
    .pml-vol { display: flex; align-items: center; color: #9b93ad; flex-shrink: 0; }
    @media (max-width: 640px) { .pml-player-meta, .pml-vol, .pml-progress-time { display: none; } .pml-player { padding: 8px 14px; gap: 10px; } }
  `}</style>
);

/* ────────────────────────────────────────────────────────────
   PAGE-WIDE RAIN (the "Rain" button toggle)
   Drop a real rain-overlay video (screen-blended, dark background
   with bright streaks) into pml-page-rain-video's src to replace
   the CSS fallback drops below with real footage. Both can run
   at once harmlessly; once the video is in, you can delete the
   fallback drops if you want the leaner DOM.
   ──────────────────────────────────────────────────────────── */

function PageRain({ videoSrc }) {
  const drops = particles(70, 21);
  return (
    <div className="pml-page-weather">
      {videoSrc && (
        <video
          className="pml-page-rain-video"
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
        />
      )}
      <div className="pml-page-rain-fallback">
        {drops.map((d) => (
          <div
            key={d.id}
            className="pml-page-rain-drop"
            style={{
              left: `${d.r1 * 100}%`,
              height: `${50 + d.r2 * 60}px`,
              animationDuration: `${0.55 + d.r3 * 0.6}s`,
              animationDelay: `${-d.r4 * 2.4}s`,
              opacity: 0.3 + d.r2 * 0.5,
            }}
          />
        ))}
      </div>
      <div className="pml-page-mist" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MOOD VISUAL SCENES
   Each mood gets its own small ambient animation layered over
   the shared color wash, tuned to the caption's setting.
   ──────────────────────────────────────────────────────────── */

function MoodFx({ mood }) {
  const t = mood.theme;

  if (mood.slug === "heartbroken") {
    const drops = particles(26, 1);
    return (
      <div className="pml-visual-fx">
        {drops.map((d) => (
          <div
            key={d.id}
            className="pml-rain"
            style={{
              left: `${d.r1 * 100}%`,
              animationDuration: `${0.7 + d.r2 * 0.8}s`,
              animationDelay: `${-d.r3 * 2}s`,
              opacity: 0.3 + d.r4 * 0.4,
            }}
          />
        ))}
      </div>
    );
  }

  if (mood.slug === "in-love") {
    const glows = particles(14, 2);
    return (
      <div className="pml-visual-fx">
        <div className="pml-raylayer" />
        {glows.map((g) => (
          <div
            key={g.id}
            className="pml-bokeh"
            style={{
              left: `${g.r1 * 100}%`,
              bottom: `${-10 + g.r2 * 20}%`,
              width: `${6 + g.r3 * 16}px`,
              height: `${6 + g.r3 * 16}px`,
              background: g.r4 > 0.5 ? t.accent : t.accent2,
              animationDuration: `${6 + g.r4 * 6}s`,
              animationDelay: `${-g.r2 * 8}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (mood.slug === "one-sided") {
    const motes = particles(12, 3);
    return (
      <div className="pml-visual-fx">
        <div className="pml-lightbeam" />
        {motes.map((m) => (
          <div
            key={m.id}
            className="pml-dust"
            style={{
              left: `${10 + m.r1 * 80}%`,
              top: `${10 + m.r2 * 70}%`,
              width: `${1.5 + m.r3 * 2}px`,
              height: `${1.5 + m.r3 * 2}px`,
              animationDuration: `${7 + m.r4 * 6}s`,
              animationDelay: `${-m.r1 * 10}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (mood.slug === "long-distance") {
    const streaks = particles(6, 4);
    const stars = particles(22, 5);
    return (
      <div className="pml-visual-fx">
        {stars.map((s) => (
          <div
            key={`s${s.id}`}
            className="pml-star"
            style={{
              left: `${s.r1 * 100}%`,
              top: `${s.r2 * 55}%`,
              width: `${1 + s.r3 * 1.5}px`,
              height: `${1 + s.r3 * 1.5}px`,
              animationDuration: `${2 + s.r4 * 3}s`,
              animationDelay: `${-s.r1 * 4}s`,
            }}
          />
        ))}
        {streaks.map((s) => (
          <div
            key={`k${s.id}`}
            className="pml-streak"
            style={{
              top: `${20 + s.r1 * 55}%`,
              width: `${60 + s.r2 * 70}px`,
              background: `linear-gradient(90deg, transparent, ${t.accent2})`,
              animationDuration: `${3 + s.r3 * 3}s`,
              animationDelay: `${-s.r4 * 6}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (mood.slug === "lonely") {
    const motes = particles(9, 6);
    return (
      <div className="pml-visual-fx">
        <div className="pml-streetcone" />
        {motes.map((m) => (
          <div
            key={m.id}
            className="pml-dust"
            style={{
              left: `${5 + m.r1 * 40}%`,
              top: `${8 + m.r2 * 60}%`,
              width: `${1.5 + m.r3 * 1.5}px`,
              height: `${1.5 + m.r3 * 1.5}px`,
              animationDuration: `${8 + m.r4 * 6}s`,
              animationDelay: `${-m.r1 * 10}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (mood.slug === "late-night") {
    return (
      <div className="pml-visual-fx">
        <div className="pml-glowpulse" style={{ left: "58%", top: "62%", width: 140, height: 140, background: t.accent2 }} />
        <div className="pml-fanwrap">
          <div className="pml-fanblade" style={{ transform: "rotate(0deg)" }} />
          <div className="pml-fanblade" style={{ transform: "rotate(120deg)" }} />
          <div className="pml-fanblade" style={{ transform: "rotate(240deg)" }} />
        </div>
      </div>
    );
  }

  return null;
}

/* ────────────────────────────────────────────────────────────
   PLAYER
   ──────────────────────────────────────────────────────────── */

function MusicPlayer({ mood }) {
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(18);
  const track = mood.tracks[trackIdx];

  useEffect(() => {
    setTrackIdx(0);
    setProgress(12);
  }, [mood.slug]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 0.6));
    }, 250);
    return () => clearInterval(id);
  }, [playing, trackIdx]);

  const next = () => setTrackIdx((i) => (i + 1) % mood.tracks.length);
  const prev = () => setTrackIdx((i) => (i - 1 + mood.tracks.length) % mood.tracks.length);

  return (
    <div className="pml-player">
      <div
        className="pml-player-art"
        style={{ background: `linear-gradient(135deg, ${mood.theme.accent}, ${mood.theme.accent2})` }}
      />
      <div className="pml-player-meta">
        <div className="pml-player-title">{track.title}</div>
        <div className="pml-player-artist">{track.artist}</div>
      </div>
      <div className="pml-player-controls">
        <button aria-label="Previous track" onClick={prev}><SkipBack size={15} /></button>
        <button
          aria-label={playing ? "Pause" : "Play"}
          className="pml-player-play"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 1 }} />}
        </button>
        <button aria-label="Next track" onClick={next}><SkipForward size={15} /></button>
      </div>
      <div className="pml-progress-wrap">
        <div className="pml-progress-track">
          <div
            className="pml-progress-fill"
            style={{ width: `${progress}%`, background: mood.theme.accent }}
          />
        </div>
      </div>
      <div className="pml-vol"><Volume2 size={14} /></div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   HOME
   ──────────────────────────────────────────────────────────── */

function Home({ onSelectMood }) {
  return (
    <div className="pml-home">
      <div className="pml-home-bg">
        <div className="pml-orb" />
        <div className="pml-grain" />
      </div>

      <nav className="pml-nav">
        <div className="pml-wordmark">PLAYMYLIST</div>
        <div className="pml-navlinks">
          <span>Discover</span>
          <span>Stories</span>
          <span>Playlists</span>
        </div>
      </nav>

      <div className="pml-hero">
        <h1>What does your heart sound like tonight?</h1>
        <p className="pml-mono" style={{ fontSize: 11 }}>MUSIC · STORIES · VISUALS · ONE FEELING</p>

        <div className="pml-moodgrid" role="list">
          {MOODS.map((m) => (
            <button
              key={m.slug}
              className="pml-moodchip"
              role="listitem"
              onClick={() => onSelectMood(m.slug)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button className="pml-explore">
          Explore all moods <ArrowRight size={13} />
        </button>
      </div>

      <div className="pml-scrolldown">
        <ChevronDown size={18} />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MOOD EXPERIENCE
   ──────────────────────────────────────────────────────────── */

function MoodExperience({ mood, onBack }) {
  const t = mood.theme;
  const bg = `linear-gradient(160deg, ${t.from} 0%, ${t.via} 55%, ${t.to} 100%)`;

  const [storyIdx, setStoryIdx] = useState(0);
  useEffect(() => { setStoryIdx(0); }, [mood.slug]);

  const [rainMode, setRainMode] = useState(false);
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    if (!rainMode) return undefined;
    let id;
    const scheduleNext = () => {
      const delay = 5000 + Math.random() * 7000;
      id = setTimeout(() => {
        setFlashKey((k) => k + 1);
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(id);
  }, [rainMode]);

  const [tab, setTab] = useState("write");
  const [draft, setDraft] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [recording, setRecording] = useState(false);
  const [wallPosts, setWallPosts] = useState(mood.wall || []);

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  const handleSave = () => {
    if (!draft.trim()) return;
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };
  const handlePost = () => {
    if (!draft.trim()) return;
    setWallPosts((posts) => [{ text: draft.trim(), author: "You" }, ...posts]);
    setDraft("");
    setTab("wall");
  };
  const toggleRecord = () => {
    if (recording) return;
    setRecording(true);
    setTimeout(() => setRecording(false), 2400);
  };

  const stories = mood.stories;
  const story = stories[storyIdx];
  const prevStory = () => setStoryIdx((i) => (i - 1 + stories.length) % stories.length);
  const nextStory = () => setStoryIdx((i) => (i + 1) % stories.length);

  return (
    <div className="pml-mood pml-mood-enter" style={{ background: bg }}>
      <nav className="pml-mood-nav">
        <button className="pml-back" onClick={onBack}>
          <ArrowLeft size={15} /> Moods
        </button>
        <div className="pml-moodlabel-pill pml-mono" style={{ fontSize: 11 }}>
          {mood.label.toUpperCase()}
        </div>
      </nav>

      <div className="pml-pulse">
        <div
          className="pml-pulse-dot"
          style={{ background: t.accent, animationDuration: `${t.pulse}s` }}
        />
      </div>

      {/* Page-wide rain + thunder — covers the whole screen, sits below
          the story shield and player so those two stay dry/legible. */}
      {rainMode && <PageRain videoSrc={mood.rainVideoSrc} />}
      {rainMode && <div key={flashKey} className="pml-page-thunder-flash" />}

      <div className="pml-mood-body">
        <div className="pml-left-col">
          <div
            className="pml-visual-col"
            style={{ "--vfrom": t.from, "--vvia": t.via, "--vto": t.to }}
          >
            <div className="pml-visual-art">
              <div className="pml-visual-blur1" style={{ background: t.accent, "--pulse": `${t.pulse}s` }} />
              <div className="pml-visual-blur2" style={{ background: t.accent2, "--pulse": `${t.pulse}s` }} />
              <div className="pml-visual-lines" />
            </div>
            <MoodFx mood={mood} />

            <button
              className={`pml-rainmode-btn ${rainMode ? "active" : ""}`}
              onClick={() => setRainMode((r) => !r)}
              aria-pressed={rainMode}
              aria-label="Toggle rain mode"
            >
              <CloudRain size={13} /> {rainMode ? "Rain on" : "Rain"}
            </button>

            <div className="pml-visual-caption pml-mono">{mood.visualLabel}</div>
          </div>

          <div
            className="pml-notecard"
            style={{ "--nvia": t.via, "--nfrom": t.from }}
          >
            <div className="pml-notecard-tabs">
              <button
                className={`pml-notecard-tab ${tab === "write" ? "active" : ""}`}
                onClick={() => setTab("write")}
              >
                <Pencil size={13} /> Write
              </button>
              <button
                className={`pml-notecard-tab ${tab === "wall" ? "active" : ""}`}
                onClick={() => setTab("wall")}
              >
                <MessageSquare size={13} /> Story Wall ({wallPosts.length})
              </button>
            </div>

            {tab === "write" ? (
              <>
                <textarea
                  className="pml-notecard-textarea"
                  placeholder="What does this feeling remind you of?"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <div className="pml-notecard-footer">
                  <span className="pml-notecard-status pml-mono">
                    {savedFlash ? "SAVED ✓" : wordCount ? `${wordCount} WORD${wordCount === 1 ? "" : "S"}` : "NOTHING WRITTEN YET"}
                  </span>
                  <div className="pml-notecard-actions">
                    <button className="pml-notecard-btn ghost" onClick={handleSave}>
                      <Lock size={13} /> Save for myself
                    </button>
                    <button
                      className="pml-notecard-btn solid"
                      style={{ background: t.accent }}
                      onClick={handlePost}
                      disabled={!draft.trim()}
                    >
                      Post it <Send size={13} />
                    </button>
                  </div>
                  <p className="pml-notecard-hint">Publishing places your reflection on the Story Wall.</p>
                </div>
                <div className="pml-notecard-voice">
                  <span className="pml-mono">VOICE NOTES</span>
                  <button
                    className={`pml-notecard-record ${recording ? "is-recording" : ""}`}
                    onClick={toggleRecord}
                    style={{ "--rec-color": t.accent, "--rec-rgb": hexToRgbTriplet(t.accent) }}
                  >
                    <Mic size={13} /> {recording ? "Recording…" : "Record"}
                  </button>
                </div>
              </>
            ) : (
              <div className="pml-wall-list">
                {wallPosts.length === 0 ? (
                  <p className="pml-wall-empty pml-mono">NO REFLECTIONS YET — BE THE FIRST</p>
                ) : (
                  wallPosts.map((post, i) => (
                    <div className="pml-wall-item" key={i}>
                      <p className="pml-wall-text">{post.text}</p>
                      <span className="pml-wall-meta pml-mono">{post.author}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="pml-story-col">
          <div className={`pml-story-shield ${rainMode ? "is-raining" : ""}`}>
            <p className="pml-quote">&ldquo;{mood.quote}&rdquo;</p>

            <div key={storyIdx} className="pml-story-block">
              <div className="pml-tags">
                {story.tags.map((tag) => (
                  <span className="pml-tag" key={tag}>{tag}</span>
                ))}
              </div>
              <h2 className="pml-story-title">{story.title}</h2>
              <p className="pml-story-content">{story.content}</p>
              <p className="pml-story-author">{story.author}</p>
            </div>

            <div className="pml-storynav">
              <button className="pml-storynav-btn" onClick={prevStory} aria-label="Previous story">
                <ArrowLeft size={13} /> Previous story
              </button>
              <span className="pml-storynav-count pml-mono">{storyIdx + 1} / {stories.length}</span>
              <button className="pml-storynav-btn" onClick={nextStory} aria-label="Next story">
                Next story <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <MusicPlayer mood={mood} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   APP
   ──────────────────────────────────────────────────────────── */

export default function PlayMyList() {
  const [activeSlug, setActiveSlug] = useState(null);
  const activeMood = MOODS.find((m) => m.slug === activeSlug);

  return (
    <div className="pml">
      <GlobalStyles />
      {activeMood ? (
        <MoodExperience key={activeMood.slug} mood={activeMood} onBack={() => setActiveSlug(null)} />
      ) : (
        <Home onSelectMood={setActiveSlug} />
      )}
    </div>
  );
}