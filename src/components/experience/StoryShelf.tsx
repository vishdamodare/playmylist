"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Story, Theme } from "@/types/mood";
import { StoryBook } from "@/components/experience/StoryBook";
import { ShelfBuddy, BuddyMode } from "@/components/experience/ShelfBuddy";
import { layoutRows } from "@/lib/shelfLayout";

interface StoryShelfProps {
  stories: Story[];
  moodLabel: string;
  theme: Theme;
  isUserStory: (s: Story) => boolean;
  onEdit: (s: Story) => void;
  onDelete: (s: Story) => void;
  /** music playing → the companion puts on headphones and vibes */
  isPlaying: boolean;
  /** show the shelf companion (only one per page looks right) */
  companion?: boolean;
  /** page weather, so the companion can dress for it */
  weather?: string | null;
}

const BUDDY_W = 72; // must match .pml-buddy width
const SEAT = 0.06; // resting spot, fraction of the bookcase width

// Shelf row planning (px). Keep in sync with .pml-shelf-row padding and the décor sizes in CSS.
const SHELF_PAD = 28 + 44 + 8; // frame padding + row padding + safety
const LEFT_DECOR_W = 220; // book stack + mixtape
const RIGHT_DECOR_W = 150; // polaroid + candle
const NARROW = 480; // below this the left décor is hidden (see CSS)
const SPINE_ZOOM = 0.74; // matches .pml-spine { zoom } on phones
const SHELF_PAD_NARROW = 20 + 20 + 6; // tighter frame + row padding on phones
const RIGHT_DECOR_W_NARROW = 62; // only the candle shows on phones


// Classic cloth-binding colours; each gets tinted toward the mood's accent.
const BINDINGS = ["#6e2a35", "#2c3a57", "#35513f", "#8a6428", "#553461", "#c4ae86", "#8c4428", "#234049", "#3b2f2a"];
const LIGHT = new Set(["#c4ae86"]);

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Stable per-story spine: same story always gets the same colour and size. */
function spineLook(s: Story, accent: string) {
  const h = hash(s.id || s.title);
  const base = BINDINGS[h % BINDINGS.length];
  return {
    color: `color-mix(in oklab, ${base} 80%, ${accent})`,
    light: LIGHT.has(base),
    width: 46 + ((h >>> 4) % 22),
    height: 170 + ((h >>> 9) % 40),
    variant: (["ribbed", "label", "deco"] as const)[(h >>> 13) % 3],
  };
}

const Diamond = () => (
  <svg className="pml-spine-orn" viewBox="0 0 20 10" aria-hidden="true">
    <path d="M10 1 L14 5 L10 9 L6 5 Z" fill="currentColor" />
    <path d="M1 5 H5 M15 5 H19" stroke="currentColor" strokeWidth="0.8" />
  </svg>
);

const EASE = "cubic-bezier(.22,.61,.36,1)";

interface ReaderProps {
  story: Story;
  number: number;
  origin: DOMRect;
  color: string;
  moodLabel: string;
  theme: Theme;
  isUser: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDone: () => void;
}

function Reader({ story, number, origin, color, moodLabel, theme, isUser, onEdit, onDelete, onDone }: ReaderProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Transform that puts the stage exactly over the spine on the shelf, turned edge-on.
  const fromSpine = () => {
    const r = stageRef.current!.getBoundingClientRect();
    const dx = origin.left + origin.width / 2 - (r.left + r.width / 2);
    const dy = origin.top + origin.height / 2 - (r.top + r.height / 2);
    const s = Math.max(0.15, origin.height / r.height);
    return `perspective(1800px) translate(${dx}px, ${dy}px) scale(${s}) rotateY(82deg)`;
  };

  // Pop out: fly from the shelf to the centre while turning from spine to front cover.
  useLayoutEffect(() => {
    if (reduced || !stageRef.current) return;
    const start = fromSpine();
    // 1) slide up out of the row  2) arc to the centre turning to the cover  3) settle with a small overshoot
    const pulled = start.replace(/translate\(([-\d.]+)px, ([-\d.]+)px\)/, (_, x, y) => `translate(${x}px, ${Number(y) - 60}px)`);
    stageRef.current.animate(
      [
        { transform: start, opacity: 0.5, offset: 0 },
        { transform: pulled, opacity: 1, offset: 0.22, easing: "cubic-bezier(.3,0,.2,1)" },
        { transform: "perspective(1800px) translateY(-26px) rotateY(-10deg) rotateZ(-1deg) scale(1.02)", offset: 0.72 },
        { transform: "perspective(1800px) translateY(4px) rotateY(3deg)", offset: 0.88 },
        { transform: "none", offset: 1 },
      ],
      { duration: 1250, easing: EASE }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closing) return;
    setClosing(true);
    if (reduced || !stageRef.current) return onDone();
    stageRef.current
      .animate([{ transform: "none", opacity: 1 }, { transform: fromSpine(), opacity: 0 }], {
        duration: 560,
        easing: "cubic-bezier(.55,0,.75,.35)",
        fill: "forwards",
      })
      .finished.then(onDone, onDone);
  };

  // Esc to close; lock page scroll behind the overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`pml-reader ${closing ? "is-closing" : ""}`} role="dialog" aria-modal="true" aria-label={story.title}>
      <div className="pml-reader-backdrop" onClick={close} />
      <button className="pml-reader-close" onClick={close} aria-label="Put the book back">
        <X size={18} />
      </button>
      <div className="pml-reader-stage" ref={stageRef}>
        <StoryBook
          story={story}
          number={number}
          moodLabel={moodLabel}
          accent={theme.accent}
          coverColor={color}
          isUserStory={isUser}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={close}
        />
      </div>
    </div>
  );
}

export function StoryShelf({ stories, moodLabel, theme, isUserStory, onEdit, onDelete, isPlaying, companion = true, weather }: StoryShelfProps) {
  const [open, setOpen] = useState<{ id: string; origin: DOMRect } | null>(null);
  const [hover, setHover] = useState<Story | null>(null);

  // ── companion ──
  const frameRef = useRef<HTMLDivElement>(null);
  const buddyRef = useRef<HTMLDivElement>(null);
  const homeTimer = useRef<ReturnType<typeof setTimeout>>();
  const [buddy, setBuddy] = useState({
    x: 0,
    mode: "sit" as BuddyMode,
    facingLeft: false,
    walking: false,
    hidden: false,
  });
  const buddyX = useRef(0);
  const [frameW, setFrameW] = useState(0);

  const seatX = () => (frameRef.current?.clientWidth ?? 0) * SEAT;

  const walkTo = (x: number, mode: BuddyMode) => {
    const w = frameRef.current?.clientWidth ?? 0;
    const tx = Math.max(0, Math.min(w - BUDDY_W, x));
    const dx = tx - buddyX.current;
    buddyX.current = tx;
    setBuddy((b) => ({
      ...b,
      x: tx,
      mode,
      walking: Math.abs(dx) > 2,
      facingLeft: Math.abs(dx) > 2 ? dx < 0 : b.facingLeft,
    }));
  };

  // Sit down on first layout and whenever the bookcase resizes.
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const sit = () => {
      setFrameW(el.clientWidth);
      buddyX.current = seatX();
      setBuddy((b) => ({ ...b, x: buddyX.current, mode: "sit", walking: false }));
    };
    sit();
    const ro = new ResizeObserver(sit);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimeout(homeTimer.current), []);

  const spineX = (el: HTMLElement) => {
    const f = frameRef.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return r.left + r.width / 2 - f.left - BUDDY_W / 2;
  };

  const onSpineEnter = (s: Story, el: HTMLElement) => {
    setHover(s);
    if (open || buddy.mode === "jump") return;
    clearTimeout(homeTimer.current);
    walkTo(spineX(el), "look");
  };

  const onSpineLeave = () => {
    setHover(null);
    // Wait a beat so gliding between books doesn't send the companion home each time.
    clearTimeout(homeTimer.current);
    homeTimer.current = setTimeout(() => {
      if (!open) walkTo(seatX(), "sit");
    }, 700);
  };

  const onSpineClick = (key: string, el: HTMLElement) => {
    const origin = el.getBoundingClientRect();
    clearTimeout(homeTimer.current);
    const node = buddyRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!node || reduced) {
      setBuddy((b) => ({ ...b, hidden: true }));
      return setOpen({ id: key, origin });
    }
    // Leap from the bookcase top down onto the book, then the book pops out.
    const f = frameRef.current!.getBoundingClientRect();
    const tx = Math.max(0, spineX(el));
    const ty = origin.top - f.top + 8; // feet sit 8px above the frame top (on the crown)
    const from = buddyX.current;
    setBuddy((b) => ({ ...b, mode: "jump", walking: false, facingLeft: tx < from ? true : tx > from ? false : b.facingLeft }));
    node
      .animate(
        [
          { translate: `${from}px 0` },
          { translate: `${(from + tx) / 2}px -46px`, offset: 0.45 },
          { translate: `${tx}px ${ty}px` },
        ],
        { duration: 520, easing: "cubic-bezier(.3,.1,.4,1)", fill: "forwards" }
      )
      .finished.then((a) => {
        buddyX.current = tx;
        setBuddy((b) => ({ ...b, x: tx, hidden: true }));
        a.cancel();
        setOpen({ id: key, origin: el.getBoundingClientRect() });
      })
      .catch(() => setOpen({ id: key, origin }));
  };

  const closeReader = () => {
    setOpen(null);
    // Pop back onto the seat (moves while hidden, then reappears).
    buddyX.current = seatX();
    setBuddy((b) => ({ ...b, x: buddyX.current, mode: "sit", walking: false, facingLeft: false }));
    setTimeout(() => setBuddy((b) => ({ ...b, hidden: false })), 60);
  };
  const keyOf = (s: Story, i: number) => s.id || `${s.title}-${i}`;

  const openIdx = open ? stories.findIndex((s, i) => keyOf(s, i) === open.id) : -1;
  const openStory = openIdx >= 0 ? stories[openIdx] : null;

  // ── shelf contents ──
  const leftDecor = (
        <div className="pml-shelf-slot pml-shelf-decor" aria-hidden="true">
          <div className="pml-decor-stack">
            <i style={{ background: `color-mix(in oklab, #2c3a57 80%, ${theme.accent})` }} />
            <i style={{ background: `color-mix(in oklab, #8a6428 80%, ${theme.accent})` }} />
            <i style={{ background: `color-mix(in oklab, #6e2a35 80%, ${theme.accent})` }} />
          </div>
          {/* mixtape leaning on the stack — reels turn while music plays */}
          <div className="pml-cassette">
            <span className="pml-cas-label">
              <em>mixtape ♡</em>
            </span>
            <span className="pml-cas-window">
              <i className="pml-cas-reel" />
              <i className="pml-cas-reel" />
            </span>
          </div>
        </div>
  );

  const rightDecor = (
        <div className="pml-shelf-slot pml-shelf-decor pml-decor-end" aria-hidden="true">
          <div className="pml-polaroid">
            <span
              className="pml-polaroid-photo"
              style={{ background: `linear-gradient(170deg, ${theme.accent2}, ${theme.accent} 55%, ${theme.via})` }}
            >
              <i />
            </span>
            <em>summer &apos;96</em>
          </div>
          <div className="pml-decor-candle">
            <span className="glow">
              {[0, 1, 2, 3, 4, 5].map((d) => (
                <i key={d} />
              ))}
            </span>
            <span className="flame" />
            <span className="wax" />
            <span className="dish" />
          </div>
        </div>
  );

  const renderBook = (i: number) => {
    const s = stories[i];
    const look = spineLook(s, theme.accent);
    const key = keyOf(s, i);
    return (
            <div className="pml-shelf-slot" role="listitem" key={key}>
              <button
                className={`pml-spine v-${look.variant} ${look.light ? "is-light" : ""} ${
                  open?.id === key ? "is-out" : ""
                }`}
                style={
                  {
                    width: look.width,
                    height: look.height,
                    "--spine": look.color,
                    "--ribbon": theme.accent,
                    animationDelay: `${i * 70}ms`,
                  } as React.CSSProperties
                }
                onClick={(e) => onSpineClick(key, e.currentTarget)}
                onMouseEnter={(e) => onSpineEnter(s, e.currentTarget)}
                onMouseLeave={onSpineLeave}
                onFocus={(e) => onSpineEnter(s, e.currentTarget)}
                onBlur={onSpineLeave}
                aria-label={`Read “${s.title}” by ${s.author}`}
              >
                <span className="pml-spine-rib" />
                <Diamond />
                <span className="pml-spine-label">
                  <span className="pml-spine-title">{s.title}</span>
                </span>
                <Diamond />
                <span className="pml-spine-rib" />
                {isUserStory(s) && <span className="pml-spine-ribbon" aria-hidden="true" />}
              </button>
            </div>
    );
  };

  // Phones: books are drawn at SPINE_ZOOM (see CSS) and only the candle sits on the right,
  // so reserve its real width; otherwise each shelf ends up holding a single book.
  const narrow = frameW > 0 && frameW <= NARROW;
  const k = narrow ? SPINE_ZOOM : 1;
  const rows = layoutRows(
    stories.map((s) => (spineLook(s, theme.accent).width + 2) * k),
    Math.max(0, frameW - (narrow ? SHELF_PAD_NARROW : SHELF_PAD)),
    narrow ? 0 : LEFT_DECOR_W,
    narrow ? RIGHT_DECOR_W_NARROW : RIGHT_DECOR_W
  );

  return (
    <div className={`pml-shelf-wrap ${isPlaying ? "is-playing" : ""}`}>
      <div className="pml-shelf-frame" ref={frameRef}>
      <div className="pml-shelf-plaque is-mounted" aria-live="polite">
        <span key={hover ? keyOf(hover, 0) : "idle"}>
          {hover ? (
            <>
              <em>{hover.title}</em> <span className="pml-plaque-by">— {hover.author}</span>
            </>
          ) : (
            `${stories.length} ${stories.length === 1 ? "story" : "stories"} on the shelf · pick one to read`
          )}
        </span>
      </div>
      {/* record player on top of the case — spins with the music */}
      <div className="pml-turntable" aria-hidden="true">
        <div className="pml-tt-sleeve" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}>
          <span>MIX &apos;96</span>
        </div>
        <div className="pml-tt-base">
          <div className="pml-tt-platter">
            <div className="pml-tt-vinyl">
              <span className="pml-tt-label" style={{ background: theme.accent }} />
            </div>
          </div>
          <span className="pml-tt-arm" />
          <span className="pml-tt-knob" />
        </div>
      </div>
      {/* fairy lights draped along the top */}
      <div className="pml-fairy" aria-hidden="true">
        <svg viewBox="0 0 1000 40" preserveAspectRatio="none">
          <path
            d={`M0 4 ${Array.from({ length: 10 }, (_, i) => `Q${i * 100 + 50} 36 ${(i + 1) * 100} 4`).join(" ")}`}
            fill="none"
            stroke="#2a1a10"
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {Array.from({ length: 20 }, (_, i) => {
          // bulbs sit on the sagging wire: two per scallop
          const t = i % 2 === 0 ? 0.3 : 0.7;
          const seg = Math.floor(i / 2);
          const y = 4 + 2 * (1 - t) * t * 32; // quadratic sag
          return (
            <span
              key={i}
              className={`pml-bulb c${i % 5}`}
              style={{ left: `${(seg + t) * 10}%`, top: `${y}px`, animationDelay: `${-((i * 7) % 11) * 0.37}s` }}
            />
          );
        })}
      </div>
      {companion && (
      <ShelfBuddy
          ref={buddyRef}
          mode={buddy.mode}
          x={buddy.x}
          facingLeft={buddy.facingLeft}
          walking={buddy.walking}
          music={isPlaying}
          hidden={buddy.hidden}
          accent={theme.accent}
          accent2={theme.accent2}
          weather={weather}
          onArrive={() => setBuddy((b) => ({ ...b, walking: false }))}
        />
      )}
      <div className="pml-shelf" role="list" aria-label={`${moodLabel} bookshelf`}>
        {rows.map((row, r) => (
          <div className="pml-shelf-row" key={r}>
            {r === 0 && leftDecor}
            {row.map((i) => renderBook(i))}
            {r === rows.length - 1 && rightDecor}
          </div>
        ))}
      </div>
      </div>


      {open &&
        openStory &&
        createPortal(
          <Reader
            key={open.id}
            story={openStory}
            number={openIdx + 1}
            origin={open.origin}
            color={spineLook(openStory, theme.accent).color}
            moodLabel={moodLabel}
            theme={theme}
            isUser={isUserStory(openStory)}
            onEdit={() => {
              closeReader();
              onEdit(openStory);
            }}
            onDelete={() => {
              closeReader();
              onDelete(openStory);
            }}
            onDone={closeReader}
          />,
          document.body
        )}
    </div>
  );
}
