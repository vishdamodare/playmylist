"use client";

import React, { forwardRef } from "react";

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
  onArrive: () => void;
}

/**
 * Original chibi bookshelf companion (inline SVG, no assets).
 * Poses are toggled with classes; all motion lives in globals.css (.pml-buddy*).
 */
export const ShelfBuddy = forwardRef<HTMLDivElement, ShelfBuddyProps>(function ShelfBuddy(
  { mode, x, facingLeft, walking, music, hidden, accent, accent2, onArrive },
  ref
) {
  const excited = mode === "look" || mode === "jump";
  return (
    <div
      ref={ref}
      className={`pml-buddy is-${mode} ${walking ? "is-walking" : ""} ${music ? "is-music" : ""} ${
        hidden ? "is-hidden" : ""
      }`}
      style={{ translate: `${x}px 0`, "--buddy": accent, "--buddy2": accent2 } as React.CSSProperties}
      onTransitionEnd={(e) => e.propertyName === "translate" && onArrive()}
      aria-hidden="true"
    >
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
              <ellipse cx="49" cy="141" rx="7" ry="4.5" fill="#f4efe8" />
              <path d="M43 141 h12" stroke="var(--buddy)" strokeWidth="2" />
            </g>
            <g className="bd-leg r">
              <rect x="66" y="122" width="9" height="18" rx="4" fill="#2c2f45" />
              <ellipse cx="71" cy="141" rx="7" ry="4.5" fill="#f4efe8" />
              <path d="M65 141 h12" stroke="var(--buddy)" strokeWidth="2" />
            </g>
          </g>
          {/* legs: standing / running */}
          <g className="bd-legs-stand">
            <g className="bd-step l">
              <rect x="47" y="110" width="9" height="15" rx="4" fill="#2c2f45" />
              <ellipse cx="51" cy="126" rx="7.5" ry="4" fill="#f4efe8" />
            </g>
            <g className="bd-step r">
              <rect x="64" y="110" width="9" height="15" rx="4" fill="#2c2f45" />
              <ellipse cx="69" cy="126" rx="7.5" ry="4" fill="#f4efe8" />
            </g>
          </g>

          <g className="bd-upper">
            {/* hoodie */}
            <g className="bd-body">
              <path d="M38 118 Q36 92 50 86 h20 Q84 92 82 118 Q60 124 38 118 Z" fill="var(--buddy)" />
              <path d="M44 110 Q60 115 76 110" stroke="rgba(0,0,0,.18)" strokeWidth="1.5" fill="none" />
              <path d="M52 87 Q60 96 68 87" fill="rgba(0,0,0,.15)" />
              <path d="M56 92 v9 M64 92 v9" stroke="#f4efe8" strokeWidth="1.6" strokeLinecap="round" />
              {/* tiny book in the pocket */}
              <rect x="66" y="100" width="9" height="11" rx="1" fill="var(--buddy2)" stroke="rgba(0,0,0,.25)" strokeWidth=".6" />
            </g>

            {/* arms */}
            <g className="bd-arm l">
              <path d="M42 94 Q32 104 36 114" stroke="var(--buddy)" strokeWidth="8" strokeLinecap="round" fill="none" />
              <circle cx="36" cy="115" r="4.5" fill="url(#bdSkin)" />
            </g>
            <g className="bd-arm r">
              <path d="M78 94 Q88 104 84 114" stroke="var(--buddy)" strokeWidth="8" strokeLinecap="round" fill="none" />
              <circle cx="84" cy="115" r="4.5" fill="url(#bdSkin)" />
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

              {/* headphones while music plays */}
              <g className="bd-phones">
                <path d="M26 54 Q26 14 60 13 Q94 14 94 54" stroke="#2b2b36" strokeWidth="5" fill="none" strokeLinecap="round" />
                <rect x="20" y="48" width="12" height="18" rx="5" fill="var(--buddy2)" stroke="#2b2b36" strokeWidth="2" />
                <rect x="88" y="48" width="12" height="18" rx="5" fill="var(--buddy2)" stroke="#2b2b36" strokeWidth="2" />
              </g>
            </g>
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
