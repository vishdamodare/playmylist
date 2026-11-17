"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Ava's first-visit walk through a mood room. Shown once per browser (see TOUR_KEY). */
export const TOUR_KEY = "pml_toured";

export function hasToured(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === "1";
  } catch {
    return true; // storage blocked: don't nag on every visit
  }
}

interface Step {
  /** CSS selector to spotlight; none = a centred card */
  target?: string;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    title: "Hi, I'm Ava ♥",
    text: "First time in here? Let me show you around this little room. Twenty seconds, pinky promise.",
  },
  {
    target: ".pml-player",
    title: "Your soundtrack",
    text: "These songs were picked for exactly this feeling, shuffled fresh every time. Wander off and they keep playing.",
  },
  {
    target: ".pml-add-song-btn",
    title: "Bring your own song",
    text: "Got one that hurts in the right way? Paste a YouTube link and it joins the playlist.",
  },
  {
    target: ".pml-weather",
    title: "Pick the weather",
    text: "Rain, snow, a soft glow… set the sky to match your heart tonight.",
  },
  {
    target: ".pml-notecard",
    title: "Say the unsaid",
    text: "Write what you can't say out loud. Pin it to the wall, or read what other hearts left behind.",
  },
  {
    target: ".pml-recorder",
    title: "Or just say it",
    text: "Some feelings are easier spoken. Record a voice note, it's only for you.",
  },
  {
    target: ".pml-shelf-frame",
    title: "The story shelf",
    text: "Every story lives here. Tap a book to read it. I'll be sitting right on top, keeping you company.",
  },
  {
    title: "One last thing…",
    text: "What should I call you? It's how your stories get signed.",
  },
];

const PAD = 10;

/** First matching element that is actually on the page (some selectors also match hidden copies). */
function findVisible(sel: string): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>(sel)).find((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
    }) ?? null
  );
}
type Rect = { top: number; left: number; width: number; height: number };

function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(text.length);
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setN(Math.min(i, text.length));
      if (i >= text.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [text]);
  return (
    <>
      <span>{text.slice(0, n)}</span>
      <span className="pml-tour-ghost" aria-hidden="true">{text.slice(n)}</span>
    </>
  );
}

/** Ava's head, blinking and bobbing (same look as the shelf buddy). */
function AvaFace({ happy }: { happy: boolean }) {
  return (
    <svg viewBox="18 0 84 90" className="pml-tour-ava" aria-hidden="true">
      <defs>
        <linearGradient id="tvHair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3530" />
          <stop offset="1" stopColor="#24161a" />
        </linearGradient>
        <linearGradient id="tvSkin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9da" />
          <stop offset="1" stopColor="#ffd5bf" />
        </linearGradient>
        <radialGradient id="tvIris" cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor="#8a5a3c" />
          <stop offset=".55" stopColor="#4a2a1a" />
          <stop offset="1" stopColor="#1e100a" />
        </radialGradient>
      </defs>
      <path d="M24 52 Q22 16 60 12 Q98 16 96 52 Q98 74 88 82 L32 82 Q22 74 24 52 Z" fill="url(#tvHair)" />
      <ellipse cx="60" cy="56" rx="31" ry="29" fill="url(#tvSkin)" />
      <ellipse cx="29" cy="58" rx="4.5" ry="6" fill="#ffd5bf" />
      <ellipse cx="91" cy="58" rx="4.5" ry="6" fill="#ffd5bf" />
      <path
        d="M27 50 Q28 22 60 20 Q92 22 93 50 Q86 38 80 44 Q78 32 70 40 Q66 28 58 40 Q52 30 46 42 Q40 34 36 46 Q32 40 27 50 Z"
        fill="url(#tvHair)"
      />
      <path d="M40 28 Q52 22 66 25" stroke="rgba(255,255,255,.28)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path className="pml-tour-ahoge" d="M60 20 Q56 6 66 4 Q60 10 64 18" fill="#3a2828" />
      {happy ? (
        <g stroke="#2a1810" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M40 62 Q47 54 54 62" />
          <path d="M66 62 Q73 54 80 62" />
        </g>
      ) : (
        <g className="pml-tour-eyes">
          <ellipse cx="47" cy="60" rx="7.5" ry="9.5" fill="#fff" />
          <ellipse cx="47" cy="61" rx="6.3" ry="8.3" fill="url(#tvIris)" />
          <circle cx="44.5" cy="57" r="2.6" fill="#fff" />
          <ellipse cx="73" cy="60" rx="7.5" ry="9.5" fill="#fff" />
          <ellipse cx="73" cy="61" rx="6.3" ry="8.3" fill="url(#tvIris)" />
          <circle cx="70.5" cy="57" r="2.6" fill="#fff" />
        </g>
      )}
      <ellipse cx="38" cy="70" rx="6" ry="3.2" fill="#ff8fa3" opacity=".55" />
      <ellipse cx="82" cy="70" rx="6" ry="3.2" fill="#ff8fa3" opacity=".55" />
      <path d="M55 72 Q60 77 65 72" stroke="#7a3a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

interface MoodTourProps {
  accent: string;
  /** final step: they want to give Ava their name */
  onAskName: () => void;
  onDone: () => void;
}

export function MoodTour({ accent, onAskName, onDone }: MoodTourProps) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const finish = useCallback(
    (askName: boolean) => {
      try {
        localStorage.setItem(TOUR_KEY, "1");
      } catch {}
      onDone();
      if (askName) onAskName();
    },
    [onAskName, onDone]
  );

  // Find the step's element, bring it into view, then keep the spotlight glued to it.
  useLayoutEffect(() => {
    const el = step.target ? findVisible(step.target) : null;
    const measure = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
      if (!el) return setRect(null);
      const r = el.getBoundingClientRect();
      // clamp to the screen so the glowing ring stays visible around very tall things (the shelf on phones)
      const top = Math.max(8, r.top - PAD), bottom = Math.min(window.innerHeight - 8, r.bottom + PAD);
      setRect({ top, left: r.left - PAD, width: r.width + PAD * 2, height: Math.max(0, bottom - top) });
    };
    if (el && getComputedStyle(el).position !== "fixed") {
      const r = el.getBoundingClientRect();
      if (r.top < 70 || r.bottom > window.innerHeight - 120)
        el.scrollIntoView({ block: r.height > window.innerHeight * 0.6 ? "start" : "center", behavior: "smooth" });
    }
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    const settle = setTimeout(measure, 450);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      clearTimeout(settle);
    };
  }, [step.target]);

  useEffect(() => nextRef.current?.focus({ preventScroll: true }), [i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false);
      else if (e.key === "ArrowRight" && !last) setI((n) => n + 1);
      else if (e.key === "ArrowLeft" && i > 0) setI((n) => n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, i, last]);

  // Card goes under the spotlight if there's room, otherwise above; centred when there's no target.
  const CARD_W = Math.min(340, vw - 32);
  let cardStyle: React.CSSProperties = {};
  if (rect && vw) {
    const below = vh - (rect.top + rect.height);
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - CARD_W / 2), vw - CARD_W - 16);
    const ROOM = 250; // roughly the card's height
    const right = vw - (rect.left + rect.width);
    const midTop = Math.min(Math.max(16, rect.top + rect.height / 2 - ROOM / 2), vh - ROOM - 16);
    cardStyle =
      below >= ROOM
        ? { left, top: rect.top + rect.height + 14, width: CARD_W }
        : rect.top >= ROOM
          ? { left, bottom: vh - rect.top + 14, width: CARD_W }
          : right >= CARD_W + 40 // tall target on a wide screen: sit beside it
            ? { left: rect.left + rect.width + 20, top: midTop, width: CARD_W }
            : rect.left >= CARD_W + 40
              ? { left: rect.left - CARD_W - 20, top: midTop, width: CARD_W }
              : { left, bottom: 120, width: CARD_W }; // phones: float over the target, above the player
  }

  // Portal to <body>: the mood page's entrance animation would otherwise trap these fixed layers.
  return createPortal(
    <div className="pml-tour" role="dialog" aria-modal="true" aria-labelledby="pml-tour-title" style={{ "--tour": accent } as React.CSSProperties}>
      {rect ? (
        <>
          {/* dark layer with a rounded hole cut out over the target */}
          <svg className="pml-tour-mask" aria-hidden="true">
            <defs>
              <mask id="pml-tour-hole">
                <rect width="100%" height="100%" fill="#fff" />
                <rect className="pml-tour-hole" x={rect.left} y={rect.top} width={rect.width} height={rect.height} rx="18" fill="#000" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(10,6,22,.64)" mask="url(#pml-tour-hole)" />
          </svg>
          <div className="pml-tour-spot" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />
        </>
      ) : (
        <div className="pml-tour-dim" />
      )}

      <div className={`pml-tour-card ${rect ? "" : "is-center"}`} style={cardStyle} key={i}>
        <div className="pml-tour-head">
          <AvaFace happy={i === 0 || last} />
          <div>
            <h2 id="pml-tour-title">{step.title}</h2>
            <span className="pml-tour-count">
              {i + 1} / {STEPS.length}
            </span>
          </div>
        </div>
        <p className="pml-tour-text" aria-live="polite">
          <Typed text={step.text} />
        </p>
        <div className="pml-tour-dots" aria-hidden="true">
          {STEPS.map((_, k) => (
            <i key={k} className={k === i ? "on" : k < i ? "done" : ""} />
          ))}
        </div>
        <div className="pml-tour-actions">
          {i === 0 ? (
            <>
              <button className="pml-tour-skip" onClick={() => finish(false)}>
                I&apos;ll explore alone
              </button>
              <button ref={nextRef} className="pml-tour-next" onClick={() => setI(1)}>
                Show me around ♥
              </button>
            </>
          ) : last ? (
            <>
              <button className="pml-tour-skip" onClick={() => finish(false)}>
                Maybe later
              </button>
              <button ref={nextRef} className="pml-tour-next" onClick={() => finish(true)}>
                Tell Ava my name
              </button>
            </>
          ) : (
            <>
              <button className="pml-tour-skip" onClick={() => finish(false)}>
                Skip
              </button>
              <span className="pml-tour-nav">
                <button className="pml-tour-back" onClick={() => setI((n) => n - 1)} aria-label="Back">
                  ←
                </button>
                <button ref={nextRef} className="pml-tour-next" onClick={() => setI((n) => n + 1)}>
                  Next
                </button>
              </span>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
