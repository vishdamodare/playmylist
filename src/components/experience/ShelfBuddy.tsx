"use client";

import React, { forwardRef, useEffect, useState } from "react";

const HELLO = "Hi, I'm ";
const NAME = "Ava";
const LINE2 = "I'll keep you company while you read.";
const TOTAL = HELLO.length + NAME.length + LINE2.length;

/** Ava types her intro once each time a shelf opens, then the bubble fades (timing in .pml-ava-bubble). */
function useIntro() {
  const [n, setN] = useState(0);
  const [show, setShow] = useState(true);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = reduce ? TOTAL : 0;
    setN(i);
    let tick: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      tick = setInterval(() => {
        setN(++i);
        if (i >= TOTAL) clearInterval(tick);
      }, 42);
    }, 900);
    const end = setTimeout(() => setShow(false), 7600);
    return () => {
      clearTimeout(start);
      clearTimeout(end);
      clearInterval(tick);
    };
  }, []);
  return { n, show };
}

export type BuddyMode = "sit" | "look" | "jump";

interface ShelfBuddyProps {
  mode: BuddyMode;
  /** px from the left edge of the bookcase */
  x: number;
  facingLeft: boolean;
  walking: boolean;
  music: boolean;
  hidden: boolean;
  accent: string;
  accent2: string;
  /** current page weather: Ava dresses for it */
  weather?: string | null;
  onArrive: () => void;
}

/**
 * Original chibi bookshelf companion (inline SVG, no assets).
 * Poses are toggled with classes; all motion lives in globals.css (.pml-buddy*).
 */
export const ShelfBuddy = forwardRef<HTMLDivElement, ShelfBuddyProps>(function ShelfBuddy(
  { mode, x, facingLeft, walking, music, hidden, accent, accent2, weather, onArrive },
  ref
) {
  const excited = mode === "look" || mode === "jump";
  const intro = useIntro();
  const a = Math.min(intro.n, HELLO.length);
  const b = Math.min(Math.max(intro.n - HELLO.length, 0), NAME.length);
  const c = Math.max(intro.n - HELLO.length - NAME.length, 0);
  return (
    <div
      ref={ref}
      className={`pml-buddy is-${mode} ${walking ? "is-walking" : ""} ${music ? "is-music" : ""} ${
        hidden ? "is-hidden" : ""
      } ${weather ? `wx-${weather}` : ""}`}
      style={{ translate: `${x}px 0`, "--buddy": accent, "--buddy2": accent2 } as React.CSSProperties}
      onTransitionEnd={(e) => e.propertyName === "translate" && onArrive()}
      aria-hidden="true"
    >
      {intro.show && !hidden && (
        <div className="pml-ava-bubble">
          <span className="pml-ava-l1">
            {HELLO.slice(0, a)}
            <b>{NAME.slice(0, b)}</b>
            {b === NAME.length && <i className="pml-ava-heart">♥</i>}
          </span>
          <span className="pml-ava-l2">
            {LINE2.slice(0, c)}
            {intro.n < TOTAL && <span className="pml-ava-caret" />}
          </span>
        </div>
      )}
      <div className="pml-buddy-flip" style={{ transform: facingLeft ? "scaleX(-1)" : undefined }}>
        <svg viewBox="0 0 120 150" className="pml-buddy-svg">
          <defs>
            <radialGradient id="bdIris" cx="50%" cy="35%" r="70%">
              <stop offset="0" stopColor="#8a5a3c" />
              <stop offset=".55" stopColor="#4a2a1a" />
              <stop offset="1" stopColor="#1e100a" />
            </radialGradient>
            <linearGradient id="bdHair" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4a3530" />
              <stop offset="1" stopColor="#24161a" />
            </linearGradient>
            <linearGradient id="bdSkin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe9da" />
              <stop offset="1" stopColor="#ffd5bf" />
            </linearGradient>
          </defs>

          {/* contact shadow on the bookcase top */}
          <ellipse className="bd-shadow" cx="60" cy="129" rx="26" ry="3.5" fill="rgba(0,0,0,.35)" />

          {/* legs: dangling (sit) */}
          <g className="bd-legs-sit">
            <g className="bd-leg l">
              <rect x="45" y="122" width="9" height="18" rx="4" fill="#2c2f45" />
              <ellipse className="bd-shoe" cx="49" cy="141" rx="7" ry="4.5" fill="#f4efe8" />
              <path d="M43 141 h12" stroke="var(--buddy)" strokeWidth="2" />
            </g>
            <g className="bd-leg r">
              <rect x="66" y="122" width="9" height="18" rx="4" fill="#2c2f45" />
              <ellipse className="bd-shoe" cx="71" cy="141" rx="7" ry="4.5" fill="#f4efe8" />
              <path d="M65 141 h12" stroke="var(--buddy)" strokeWidth="2" />
            </g>
          </g>
          {/* legs: standing / running */}
          <g className="bd-legs-stand">
            <g className="bd-step l">
              <rect x="47" y="110" width="9" height="15" rx="4" fill="#2c2f45" />
              <ellipse className="bd-shoe" cx="51" cy="126" rx="7.5" ry="4" fill="#f4efe8" />
            </g>
            <g className="bd-step r">
              <rect x="64" y="110" width="9" height="15" rx="4" fill="#2c2f45" />
              <ellipse className="bd-shoe" cx="69" cy="126" rx="7.5" ry="4" fill="#f4efe8" />
            </g>
          </g>

          <g className="bd-upper">
            {/* hoodie */}
            <g className="bd-body">
              <path className="bd-coat" d="M38 118 Q36 92 50 86 h20 Q84 92 82 118 Q60 124 38 118 Z" fill="var(--buddy)" />
              <path d="M44 110 Q60 115 76 110" stroke="rgba(0,0,0,.18)" strokeWidth="1.5" fill="none" />
              <path d="M52 87 Q60 96 68 87" fill="rgba(0,0,0,.15)" />
              <path d="M56 92 v9 M64 92 v9" stroke="#f4efe8" strokeWidth="1.6" strokeLinecap="round" />
              {/* tiny book in the pocket */}
              <rect x="66" y="100" width="9" height="11" rx="1" fill="var(--buddy2)" stroke="rgba(0,0,0,.25)" strokeWidth=".6" />
            </g>

            {/* earbud wires (behind the arms) */}
            <g className="bd-phone-wire" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity=".92">
              <path d="M29 69 Q34 86 58 93" />
              <path d="M91 69 Q86 84 62 93" />
              <path d="M58 93 Q60 95 62 93 M60 94 Q72 101 82 104" />
            </g>

            {/* arms */}
            <g className="bd-arm l">
              <path className="bd-sleeve" d="M42 94 Q32 104 36 114" stroke="var(--buddy)" strokeWidth="8" strokeLinecap="round" fill="none" />
              <circle cx="36" cy="115" r="4.5" fill="url(#bdSkin)" />
            </g>
            <g className="bd-arm r">
              <path className="bd-sleeve" d="M78 94 Q88 104 84 114" stroke="var(--buddy)" strokeWidth="8" strokeLinecap="round" fill="none" />
              <circle cx="84" cy="115" r="4.5" fill="url(#bdSkin)" />
            </g>

            {/* rain / storm: raincoat toggles */}
            <g className="bd-wx bd-raincoat">
              <path d="M50 86 Q60 92 70 86 L72 90 Q60 97 48 90 Z" fill="#f5c400" />
              <rect x="57.6" y="99" width="4.8" height="2.2" rx="1.1" fill="#b98a00" />
              <rect x="57.6" y="106" width="4.8" height="2.2" rx="1.1" fill="#b98a00" />
              <rect x="57.6" y="113" width="4.8" height="2.2" rx="1.1" fill="#b98a00" />
            </g>

            {/* rain / storm: a big round umbrella over her head (pole runs behind her head) */}
            <g className="bd-wx bd-umbrella">
              <defs>
                <linearGradient id="bdUmb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffa8c2" />
                  <stop offset="1" stopColor="#ff7aa2" />
                </linearGradient>
              </defs>
              <g className="bd-umbrella-sway">
                <line x1="37" y1="113" x2="60" y2="-6" stroke="#7a5442" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M37 113 Q35 122 40.5 122.6 Q44.4 122.6 44 118.6" stroke="#7a5442" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                <g className="bd-canopy">
                  <path
                    d="M12 -6 C14 -36 40 -46 60 -46 C80 -46 106 -36 108 -6 Q100 -11 92 -6 Q84 -11 76 -6 Q68 -11 60 -6 Q52 -11 44 -6 Q36 -11 28 -6 Q20 -11 12 -6 Z"
                    fill="url(#bdUmb)"
                    stroke="#e0628a"
                    strokeWidth=".9"
                  />
                  <path d="M60 -46 Q40 -30 28 -6 M60 -46 Q52 -26 44 -6 M60 -46 V-6 M60 -46 Q68 -26 76 -6 M60 -46 Q80 -30 92 -6" stroke="#e0628a" strokeWidth=".9" fill="none" opacity=".7" />
                  <path d="M22 -16 Q30 -34 50 -41" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".55" />
                  <g fill="#fff" opacity=".9">
                    <circle cx="36" cy="-24" r="2.4" /><circle cx="60" cy="-32" r="2.4" /><circle cx="84" cy="-24" r="2.4" />
                    <circle cx="24" cy="-11" r="1.8" /><circle cx="48" cy="-15" r="1.8" /><circle cx="72" cy="-15" r="1.8" /><circle cx="96" cy="-11" r="1.8" />
                  </g>
                  <line x1="60" y1="-46" x2="60" y2="-52" stroke="#7a5442" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="60" cy="-52.6" r="1.8" fill="#7a5442" />
                </g>
              </g>
              <g className="bd-drops" fill="#a9c8ff">
                <path className="bd-drop d1" d="M30 -84 q-2.2 4.4 0 5.4 q2.2 -1 0 -5.4 Z" />
                <path className="bd-drop d2" d="M62 -92 q-2.2 4.4 0 5.4 q2.2 -1 0 -5.4 Z" />
                <path className="bd-drop d3" d="M90 -84 q-2.2 4.4 0 5.4 q2.2 -1 0 -5.4 Z" />
              </g>
            </g>

            {/* sun: a little strawberry ice cream in her left hand */}
            <g className="bd-wx bd-icecream">
              <path d="M30.6 109 L41.4 109 L36 123 Z" fill="#e8b46a" stroke="#c98f45" strokeWidth=".7" />
              <path d="M32.4 112 L39.8 112 M33.6 115.4 L38.6 115.4 M34.6 118.6 L37.4 118.6" stroke="#c98f45" strokeWidth=".7" />
              <circle cx="36" cy="105.6" r="6.2" fill="#ffb3c7" />
              <path d="M30 106.5 Q31 110 33 108.6 Q34 111.6 36 109.2 Q38 111.6 39.4 108.6 Q41.4 110 42 106.5" fill="#ffb3c7" />
              <circle cx="34" cy="103.4" r="1.6" fill="#fff" opacity=".8" />
              <path d="M37.6 102.6 l1.4 .6 M33.8 107 l.6 1.2 M39 106.4 l1.2 -.4" stroke="#7a5ad8" strokeWidth=".9" strokeLinecap="round" />
              <circle cx="36" cy="99.2" r="1.6" fill="#e2304a" />
            </g>
            {/* head */}
            <g className="bd-head">
              {/* back hair */}
              <path d="M24 52 Q22 16 60 12 Q98 16 96 52 Q98 74 88 82 L32 82 Q22 74 24 52 Z" fill="url(#bdHair)" />
              {/* face */}
              <ellipse cx="60" cy="56" rx="31" ry="29" fill="url(#bdSkin)" />
              {/* ears */}
              <ellipse cx="29" cy="58" rx="4.5" ry="6" fill="#ffd5bf" />
              <ellipse cx="91" cy="58" rx="4.5" ry="6" fill="#ffd5bf" />
              {/* bangs */}
              <path
                d="M27 50 Q28 22 60 20 Q92 22 93 50 Q86 38 80 44 Q78 32 70 40 Q66 28 58 40 Q52 30 46 42 Q40 34 36 46 Q32 40 27 50 Z"
                fill="url(#bdHair)"
              />
              {/* hair shine */}
              <path d="M40 28 Q52 22 66 25" stroke="rgba(255,255,255,.28)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* ahoge */}
              <path className="bd-ahoge" d="M60 20 Q56 6 66 4 Q60 10 64 18" fill="#3a2828" />

              {/* eyes (open) */}
              <g className="bd-eyes-open">
                <g className="bd-eye">
                  <ellipse cx="47" cy="60" rx="7.5" ry="9.5" fill="#fff" />
                  <ellipse cx="47" cy="61" rx="6.3" ry="8.3" fill="url(#bdIris)" />
                  <circle cx="44.5" cy="57" r="2.6" fill="#fff" />
                  <circle cx="49.5" cy="64.5" r="1.2" fill="#fff" opacity=".9" />
                  <path d="M38.5 53 Q47 47.5 55.5 53" stroke="#2a1810" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                </g>
                <g className="bd-eye">
                  <ellipse cx="73" cy="60" rx="7.5" ry="9.5" fill="#fff" />
                  <ellipse cx="73" cy="61" rx="6.3" ry="8.3" fill="url(#bdIris)" />
                  <circle cx="70.5" cy="57" r="2.6" fill="#fff" />
                  <circle cx="75.5" cy="64.5" r="1.2" fill="#fff" opacity=".9" />
                  <path d="M64.5 53 Q73 47.5 81.5 53" stroke="#2a1810" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                </g>
                {/* sparkle stars when excited */}
                {excited && (
                  <g className="bd-sparkle" fill="#fff">
                    <path d="M44 58 l1 -3 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 Z" />
                    <path d="M70 58 l1 -3 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 Z" />
                  </g>
                )}
              </g>
              {/* eyes (happy ^ ^) */}
              <g className="bd-eyes-happy" stroke="#2a1810" strokeWidth="2.6" strokeLinecap="round" fill="none">
                <path d="M40 62 Q47 54 54 62" />
                <path d="M66 62 Q73 54 80 62" />
              </g>

              {/* blush */}
              <ellipse cx="39" cy="70" rx="5.5" ry="3" fill="#ff9aa8" opacity=".55" />
              <ellipse cx="81" cy="70" rx="5.5" ry="3" fill="#ff9aa8" opacity=".55" />

              {/* mouths */}
              <path className="bd-mouth-smile" d="M55 72 Q60 77 65 72" stroke="#7a3a2e" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path className="bd-mouth-open" d="M54 71 Q60 70 66 71 Q65 80 60 80 Q55 80 54 71 Z" fill="#7a3a2e" />
              <path className="bd-mouth-open" d="M56.5 76.5 Q60 74.5 63.5 76.5 Q60 79.5 56.5 76.5 Z" fill="#ff8f9c" />

              {/* white earbuds while music plays */}
              <g className="bd-phones">
                {[29, 91].map((x) => (
                  <g key={x}>
                    <rect x={x - 1.3} y="61" width="2.6" height="8" rx="1.3" fill="#f4f6fa" stroke="#c9cfdb" strokeWidth=".6" />
                    <ellipse cx={x} cy="59" rx="3.8" ry="4.4" fill="#fff" stroke="#c9cfdb" strokeWidth=".7" />
                    <circle cx={x - 1.1} cy="57.6" r="1.1" fill="#fff" opacity=".95" />
                    <circle cx={x + 0.6} cy="59.6" r=".9" fill="#d8dde8" />
                  </g>
                ))}
              </g>

              {/* ── weather outfits (head) ── */}
              {/* storm: little yellow rain hat */}
              <g className="bd-wx bd-rainhat">
                <path d="M38 29 Q40 8 60 8 Q80 8 82 29 Z" fill="#ffd23f" stroke="#e0ae1a" strokeWidth=".9" />
                <path d="M45 12 Q60 9 75 12" stroke="#e0ae1a" strokeWidth=".9" fill="none" />
                <path d="M18 33 Q60 20 102 33 Q106 39 97 42 Q60 31 23 42 Q14 39 18 33 Z" fill="#ffd23f" stroke="#e0ae1a" strokeWidth=".9" />
                <path d="M26 35 Q60 26 94 35" stroke="#fff" strokeWidth="1.2" fill="none" opacity=".45" />
              </g>
              {/* snow: knit beanie with a pom-pom */}
              <g className="bd-wx bd-beanie">
                <path d="M26 44 Q24 6 60 5 Q96 6 94 44 Z" fill="#e2516e" />
                <path d="M31 27 Q60 15 89 27" stroke="#fff" strokeWidth="2.4" fill="none" opacity=".85" />
                <path d="M28 35 Q60 24 92 35" stroke="#fff" strokeWidth="2.4" fill="none" opacity=".85" />
                <path d="M24 40 Q60 30 96 40 L96 48 Q60 38 24 48 Z" fill="#fff4e8" />
                <path d="M34 39 v6 M42 37 v6 M50 36 v6 M58 35.5 v6 M66 35.5 v6 M74 36 v6 M82 37 v6 M90 39 v6" stroke="#e8d9c8" strokeWidth="1.4" />
                <circle cx="60" cy="4" r="7" fill="#fff" />
                <circle cx="57.5" cy="2" r="2.4" fill="#fff" opacity=".9" />
                <circle cx="62" cy="6" r="3.6" fill="#ece6f0" opacity=".6" />
              </g>
              {/* sun: straw hat + heart sunglasses */}
              {/* sun: snug bucket hat with sunglasses pushed up on it */}
              <g className="bd-wx bd-sunhat">
                <path d="M28 41 Q27 7 60 6 Q93 7 92 41 Z" fill="#ffe28a" />
                <path d="M34 15 Q60 6 86 15" stroke="#fff" strokeWidth="2" fill="none" opacity=".5" />
                <path d="M29 33 Q60 25 91 33 L91 39 Q60 31 29 39 Z" fill="#ff8fab" />
                <path d="M21 40 Q60 30 99 40 L105 50 Q60 39 15 50 Z" fill="#ffd76a" stroke="#e8b84a" strokeWidth=".9" strokeLinejoin="round" />
                <path d="M21 44.5 Q60 35 99 44.5" stroke="#e8b84a" strokeWidth=".9" strokeDasharray="2 1.8" fill="none" />
                {/* daisy */}
                <g transform="translate(36 31)">
                  {[0, 60, 120, 180, 240, 300].map((a) => (
                    <ellipse key={a} cx="0" cy="-3.2" rx="1.8" ry="3" fill="#fff" transform={`rotate(${a})`} />
                  ))}
                  <circle r="2" fill="#ffb627" />
                </g>
              </g>
              <g className="bd-wx bd-shades">
                <circle cx="51" cy="21" r="6.6" fill="#3a2550" stroke="#ff6f96" strokeWidth="2" />
                <circle cx="71" cy="21" r="6.6" fill="#3a2550" stroke="#ff6f96" strokeWidth="2" />
                <path d="M57.4 20 Q61 17.6 64.6 20" stroke="#ff6f96" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M47.6 18 l2.6 -2.4 M67.6 18 l2.6 -2.4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".85" />
              </g>
              {/* night: sleepy nightcap with a star */}
              <g className="bd-wx bd-nightcap">
                <path d="M26 42 Q30 6 64 6 Q90 8 104 44 Q92 34 86 30 Q92 38 94 42 Z" fill="#6c63c7" />
                <path d="M40 20 l1 2 2 .3 -1.5 1.4 .4 2 -1.9 -1 -1.9 1 .4 -2 -1.5 -1.4 2 -.3 Z M70 14 l.8 1.6 1.7 .2 -1.2 1.1 .3 1.7 -1.6 -.8 -1.6 .8 .3 -1.7 -1.2 -1.1 1.7 -.2 Z" fill="#ffe08a" />
                <path d="M24 40 Q60 30 96 40 L96 47 Q60 37 24 47 Z" fill="#fff" />
                <path d="M104 39 l2 4 4.4 .6 -3.2 3 .8 4.4 -4 -2.1 -4 2.1 .8 -4.4 -3.2 -3 4.4 -.6 Z" fill="#ffd23f" stroke="#e0ae1a" strokeWidth=".6" />
              </g>
            </g>

            {/* ── weather outfits (body) ── */}
            {/* snow + wind: scarf */}
            <g className="bd-wx bd-scarf">
              <path d="M45 84 Q60 92 75 84 Q79 88 77 93 Q60 101 43 93 Q41 88 45 84 Z" fill="#e2516e" />
              <path d="M47 88.5 Q60 95.5 73 88.5" stroke="#fff" strokeWidth="1.6" fill="none" opacity=".8" />
              <g className="bd-scarf-hang">
                <path d="M63 93 L71 92 L73 111 L64 112 Z" fill="#e2516e" />
                <path d="M63.8 101 L72 100" stroke="#fff" strokeWidth="1.6" opacity=".8" />
                <path d="M65 112 v3 M67.5 112 v3 M70 111.6 v3 M72.4 111.3 v3" stroke="#e2516e" strokeWidth="1.2" />
              </g>
              <g className="bd-scarf-fly">
                <path d="M46 90 Q30 84 12 87 L10 96 Q30 95 48 96 Z" fill="#e2516e" />
                <path d="M44 92.6 Q28 89 11 91.5" stroke="#fff" strokeWidth="1.6" fill="none" opacity=".8" />
              </g>
            </g>
            {/* snow: mittens */}
            <g className="bd-wx bd-mittens">
              {[36, 84].map((x) => (
                <g key={x}>
                  <ellipse cx={x} cy="116" rx="5.6" ry="6.2" fill="#e2516e" />
                  <ellipse cx={x + (x < 60 ? 4 : -4)} cy="114" rx="2.2" ry="3" fill="#e2516e" />
                  <rect x={x - 5.2} y="108" width="10.4" height="3.4" rx="1.6" fill="#fff4e8" />
                </g>
              ))}
            </g>
          </g>

          {/* night (no music): sleepy z's */}
          <g className="bd-wx bd-zz" fill="#cfc8ff" fontFamily="Caveat, cursive" fontWeight="600">
            <text className="bd-z z1" x="96" y="20" fontSize="10">z</text>
            <text className="bd-z z2" x="104" y="10" fontSize="13">z</text>
          </g>

          {/* tiny phone in her hand while music plays */}
          <g className="bd-phone">
            <g transform="rotate(-12 85 111)">
              <rect x="77" y="99" width="15" height="24" rx="3.6" fill="#ffb3c7" stroke="#e98aa6" strokeWidth=".8" />
              <rect x="78.8" y="101.6" width="11.4" height="17.6" rx="2" fill="#2b2350" />
              <rect className="bd-phone-glow" x="78.8" y="101.6" width="11.4" height="17.6" rx="2" fill="var(--buddy2)" opacity=".35" />
              <path d="M84.5 107.6 c-1.1 -1.6 -3.3 -.5 -2.4 1.2 l2.4 2.2 2.4 -2.2 c.9 -1.7 -1.3 -2.8 -2.4 -1.2 z" fill="#ff8fa3" />
              <g fill="#fff">
                <rect className="bd-eq b1" x="80.6" y="113" width="1.6" height="4" rx=".6" />
                <rect className="bd-eq b2" x="83.7" y="113" width="1.6" height="4" rx=".6" />
                <rect className="bd-eq b3" x="86.8" y="113" width="1.6" height="4" rx=".6" />
              </g>
              <rect x="83" y="120.4" width="3.4" height=".9" rx=".45" fill="#fff" opacity=".7" />
            </g>
            {/* thumb over the edge so she's holding it */}
            <circle className="bd-thumb" cx="83" cy="114.5" r="3.4" fill="url(#bdSkin)" />
          </g>

          {/* floating music notes */}
          <g className="bd-notes" fill="var(--buddy2)">
            <g className="bd-note n1"><circle cx="100" cy="40" r="3.4" /><path d="M103 40 V26 l6 2" stroke="var(--buddy2)" strokeWidth="1.8" fill="none" /></g>
            <g className="bd-note n2"><circle cx="14" cy="34" r="3" /><path d="M17 34 V22" stroke="var(--buddy2)" strokeWidth="1.8" /></g>
            <g className="bd-note n3"><circle cx="104" cy="70" r="2.6" /><path d="M106.6 70 V60" stroke="var(--buddy2)" strokeWidth="1.6" /></g>
          </g>
        </svg>
      </div>
    </div>
  );
});
