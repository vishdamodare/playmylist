"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Pencil, Trash2, X } from "lucide-react";
import { Story } from "@/types/mood";

/** One story as a hardcover book: closed cover → click to open → title, text pages (flowed to fit), "fin". */
interface StoryBookProps {
  story: Story;
  number: number;
  moodLabel: string;
  accent: string;
  coverColor: string;
  isUserStory: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

type Turn = { dir: "next" | "prev"; from: number; to: number };
type Phase = "closed" | "opening" | "open";

/** A text page: paragraphs [from word, to word) — mid-paragraph starts are continuations. */
type TextPageSpan = { p: number; from: number; to: number }[];

const toParas = (content: string) =>
  content.split(/\n\s*\n|\n/).map((p) => p.trim().split(/\s+/).filter(Boolean)).filter((p) => p.length);

/** Fill a text box with words [start, end) of the flattened paragraphs. */
function fillBox(box: HTMLElement, paras: string[][], flat: [number, number][], start: number, end: number) {
  box.textContent = "";
  for (const span of spanOf(paras, flat, start, end)) {
    const el = document.createElement("p");
    if (span.p === 0 && span.from === 0) el.className = "pml-dropcap";
    else if (span.from > 0) el.className = "pml-cont";
    el.textContent = paras[span.p].slice(span.from, span.to).join(" ");
    box.appendChild(el);
  }
}
function spanOf(paras: string[][], flat: [number, number][], start: number, end: number): TextPageSpan {
  const out: TextPageSpan = [];
  for (let i = start; i < end; ) {
    const [p, w] = flat[i];
    const to = Math.min(paras[p].length, w + (end - i));
    out.push({ p, from: w, to });
    i += to - w;
  }
  return out;
}

/** Greedy pagination: each page takes the most words that fit (binary search on real layout). */
function paginate(box: HTMLElement, paras: string[][]): TextPageSpan[] {
  const flat: [number, number][] = paras.flatMap((p, pi) => p.map((_, wi) => [pi, wi] as [number, number]));
  const fits = (a: number, b: number) => (fillBox(box, paras, flat, a, b), box.scrollHeight <= box.clientHeight + 1);
  const pages: TextPageSpan[] = [];
  for (let start = 0; start < flat.length && pages.length < 40; ) {
    let lo = start + 1, hi = flat.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (fits(start, mid)) lo = mid;
      else hi = mid - 1;
    }
    // Prefer ending the page at a paragraph or sentence break if one is close.
    let end = lo;
    if (end < flat.length) {
      for (let k = end; k > end - 12 && k > start + 1; k--) {
        const [p, w] = flat[k - 1];
        if (w === paras[p].length - 1 || /[.!?…"”]$/.test(paras[p][w])) { end = k; break; }
      }
    }
    pages.push(spanOf(paras, flat, start, end));
    start = end;
  }
  box.textContent = "";
  return pages;
}

const ROMAN: [number, string][] = [
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];
export function roman(n: number): string {
  let out = "";
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v; }
  return out;
}

function useMedia(query: string): boolean {
  const [match, setMatch] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

const Flourish = () => (
  <svg className="pml-page-flourish" viewBox="0 0 120 12" aria-hidden="true">
    <path d="M2 6 H48 M72 6 H118" stroke="currentColor" strokeWidth="0.8" />
    <path d="M60 1 L65 6 L60 11 L55 6 Z" fill="currentColor" />
  </svg>
);

export function StoryBook({
  story,
  number,
  moodLabel,
  accent,
  coverColor,
  isUserStory,
  onEdit,
  onDelete,
  onClose,
}: StoryBookProps) {
  const single = useMedia("(max-width: 760px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const [phase, setPhase] = useState<Phase>("closed");
  const [page, setPage] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const touchX = useRef<number | null>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [paras] = useState(() => toParas(story.content));
  const [textPages, setTextPages] = useState<TextPageSpan[]>(() => [
    paras.map((p, i) => ({ p: i, from: 0, to: p.length })),
  ]);

  // Re-flow the story whenever the page size changes (spread ↔ single, resize, web fonts arriving).
  useLayoutEffect(() => {
    const book = bookRef.current;
    const box = measureRef.current;
    if (!book || !box) return;
    let w = 0, h = 0;
    const flow = () => {
      const pages = paginate(box, paras);
      if (pages.length) setTextPages(pages);
    };
    const ro = new ResizeObserver(() => {
      if (book.clientWidth === w && book.clientHeight === h) return;
      w = book.clientWidth;
      h = book.clientHeight;
      flow();
    });
    ro.observe(book);
    document.fonts?.ready.then(flow);
    return () => ro.disconnect();
  }, [paras, single]);
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});

  const open = () => {
    if (phase !== "closed") return;
    setPhase(reduced ? "open" : "opening");
  };

  // Page list: title, text pages, fin (+ blank endpaper to complete the last spread).
  const pageCount = textPages.length + 2;
  const SPREADS = single ? pageCount : Math.ceil(pageCount / 2);
  useEffect(() => {
    if (page >= SPREADS) setPage(SPREADS - 1);
  }, [page, SPREADS]);

  const go = (dir: Turn["dir"]) => {
    if (phase === "closed") return dir === "next" ? open() : undefined;
    if (turn || phase !== "open") return;
    const to = page + (dir === "next" ? 1 : -1);
    if (to < 0 || to >= SPREADS) return;
    if (reduced) return setPage(to);
    setTurn({ dir, from: page, to });
  };

  // The reader is a modal, so arrows work wherever focus is (e.g. after clicking "Open").
  keyRef.current = (e) => {
    if (e.key === "ArrowRight") go("next");
    if (e.key === "ArrowLeft") go("prev");
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const finishTurn = (e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget || !turn) return; // ignore bubbled shade animations
    setPage(turn.to);
    setTurn(null);
  };

  const actions = isUserStory && story.id ? (
    <div className="pml-page-actions">
      <button onClick={onEdit} title="Edit this story">
        <Pencil size={12} /> Edit
      </button>
      <button onClick={onDelete} title="Delete this story">
        <Trash2 size={12} /> Delete
      </button>
    </div>
  ) : null;

  const TitlePage = (
    <div className="pml-page-inner pml-page-inner-left">
      <span className="pml-page-chapter">No. {roman(number)}</span>
      <Flourish />
      <h3 className="pml-page-title">{story.title}</h3>
      <p className="pml-page-author">{story.author}</p>
      <div className="pml-page-tags">
        {story.tags.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <span className={`pml-page-folio ${single ? "right" : "left"}`}>1</span>
    </div>
  );

  const side = (n: number) => (single || n % 2 === 1 ? "right" : "left");

  const TextPage = (t: number) => (
    <div className="pml-page-inner">
      <span className="pml-page-runhead">{t % 2 === 0 ? story.title : moodLabel}</span>
      <div className="pml-page-text">
        {textPages[t].map((s, i) => (
          <p key={i} className={s.p === 0 && s.from === 0 ? "pml-dropcap" : s.from > 0 ? "pml-cont" : undefined}>
            {paras[s.p].slice(s.from, s.to).join(" ")}
          </p>
        ))}
      </div>
      <span className={`pml-page-folio ${side(t + 1)}`}>{t + 2}</span>
    </div>
  );

  const FinPage = (
    <div className="pml-page-inner pml-page-inner-left">
      <Flourish />
      <p className="pml-page-fin">fin.</p>
      <p className="pml-page-author">{story.author}</p>
      <p className="pml-page-colophon">A story from the {moodLabel} shelf</p>
      {actions}
      <span className={`pml-page-folio ${side(pageCount - 1)}`}>{pageCount}</span>
    </div>
  );

  const Endpaper = <div className="pml-endpaper" aria-hidden="true" />;

  /** Page n of the book (0 = title). */
  const pageAt = (n: number) =>
    n === 0 ? TitlePage : n <= textPages.length ? TextPage(n - 1) : n === pageCount - 1 ? FinPage : Endpaper;
  const left = (i: number) => pageAt(2 * i);
  const right = (i: number) => pageAt(2 * i + 1);
  const full = (i: number) => pageAt(i);

  // What the static pages show underneath the turning leaf.
  const leftIdx = turn ? (turn.dir === "next" ? turn.from : turn.to) : page;
  const rightIdx = turn ? (turn.dir === "next" ? turn.to : turn.from) : page;
  const singleIdx = turn ? (turn.dir === "next" ? turn.to : turn.from) : page;

  const vars = {
    "--book-accent": accent,
    "--book-accent2": "#ecdcb4",
    "--book-cover1": coverColor,
    "--book-cover2": `color-mix(in oklab, ${coverColor} 55%, #000)`,
  } as React.CSSProperties;

  const cover = (
    <div
      className="pml-leaf pml-leaf-cover"
      onClick={open}
      onAnimationEnd={(e) => e.target === e.currentTarget && setPhase("open")}
    >
      <div className="pml-leaf-face front pml-cover">
        {["tl", "tr", "bl", "br"].map((c) => (
          <svg key={c} className={`pml-cover-corner ${c}`} viewBox="0 0 40 40" aria-hidden="true">
            <path d="M2 38 V10 Q2 2 10 2 H38" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M8 38 V16 Q8 8 16 8 H38" fill="none" stroke="currentColor" strokeWidth=".6" />
            <circle cx="13" cy="13" r="2.2" fill="currentColor" />
          </svg>
        ))}
        <span className="pml-cover-kicker">{moodLabel} · No. {roman(number)}</span>
        <Flourish />
        <h3 className="pml-cover-title">{story.title}</h3>
        <span className="pml-cover-sub">{story.author}</span>
        {phase === "closed" && <span className="pml-cover-hint">Tap the cover to open</span>}
      </div>
      {!single && <div className="pml-leaf-face back pml-page pml-page-left">{TitlePage}</div>}
    </div>
  );

  return (
    <>
      <div
        ref={bookRef}
        className={`pml-book ${single ? "is-single" : "is-spread"} is-${phase} ${turn ? "is-turning" : ""}`}
        style={vars}
        role="group"
        aria-roledescription="book"
        aria-label={`${story.title}, by ${story.author}`}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? "next" : "prev");
        }}
      >
        {/* Off-screen twin of a text page, used only to measure how many words fit. */}
        <div className={`pml-page pml-page-measure ${single ? "pml-page-single" : "pml-page-right"}`} aria-hidden="true">
          <div className="pml-page-inner">
            <span className="pml-page-runhead">{story.title}</span>
            <div className="pml-page-text" ref={measureRef} />
          </div>
        </div>
        <div className="pml-book-inner">
          <div className="pml-book-board left" />
          <div className="pml-book-board right" />

          {single ? (
            <div className="pml-book-pages">
              <div className="pml-page pml-page-single">
                {full(singleIdx)}
                {phase === "open" && !turn && page < SPREADS - 1 && (
                  <button className="pml-page-corner right" onClick={() => go("next")} aria-label="Turn page" />
                )}
              </div>
              {turn && (
                <div className={`pml-leaf pml-leaf-single-${turn.dir}`} onAnimationEnd={finishTurn}>
                  <div className="pml-leaf-face pml-page pml-page-single front">
                    {full(turn.dir === "next" ? turn.from : turn.to)}
                  </div>
                </div>
              )}
              {phase !== "open" && cover}
            </div>
          ) : (
            <div className="pml-book-pages">
              <div className="pml-page pml-page-left">
                {left(leftIdx)}
                {turn?.dir === "prev" && <div className="pml-turn-cast left" />}
                {phase === "open" && !turn && page > 0 && (
                  <button className="pml-page-corner left" onClick={() => go("prev")} aria-label="Previous page" />
                )}
              </div>
              <div className="pml-page pml-page-right">
                {right(rightIdx)}
                {turn?.dir === "next" && <div className="pml-turn-cast right" />}
                {phase === "open" && !turn && page < SPREADS - 1 && (
                  <button className="pml-page-corner right" onClick={() => go("next")} aria-label="Next page" />
                )}
              </div>

              {turn && (
                <div className={`pml-leaf pml-leaf-${turn.dir}`} onAnimationEnd={finishTurn}>
                  <div
                    className={`pml-leaf-face front pml-page ${
                      turn.dir === "next" ? "pml-page-right" : "pml-page-left"
                    }`}
                  >
                    {turn.dir === "next" ? right(turn.from) : left(turn.from)}
                  </div>
                  <div
                    className={`pml-leaf-face back pml-page ${
                      turn.dir === "next" ? "pml-page-left" : "pml-page-right"
                    }`}
                  >
                    {turn.dir === "next" ? left(turn.to) : right(turn.to)}
                  </div>
                </div>
              )}

              {phase !== "open" && cover}
            </div>
          )}
        </div>
      </div>

      <div className="pml-reader-controls">
        {phase === "closed" ? (
          <button className="pml-reader-primary" onClick={open}>
            <BookOpen size={15} /> Open the book
          </button>
        ) : (
          <>
            <button className="pml-storynav-btn" onClick={() => go("prev")} disabled={page === 0 || !!turn}>
              <ArrowLeft size={13} /> <span>Previous page</span>
            </button>
            <span className="pml-storynav-count pml-mono">
              {(turn ? turn.to : page) + 1} / {SPREADS}
            </span>
            {page < SPREADS - 1 ? (
              <button className="pml-storynav-btn" onClick={() => go("next")} disabled={!!turn}>
                <span>Next page</span> <ArrowRight size={13} />
              </button>
            ) : (
              <button className="pml-storynav-btn" onClick={onClose}>
                <span>Back to the shelf</span> <X size={13} />
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
