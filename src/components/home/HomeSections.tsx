"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { ArrowRight, Heart, Disc3, BookOpen } from "lucide-react";
import { MOODS } from "@/data/moods";
import { moodPlaylists } from "@/data/moodPlaylists";

interface HomeSectionsProps {
  onSelectMood: (slug: string) => void;
  onNavigate: (view: "discover" | "library" | "playlists") => void;
  onOpenPlaylist: () => void;
}

const MANIFESTO =
  "PlayMyList is for the songs you play on repeat when you can't say it out loud. Pick a feeling, press play, and read what strangers wrote at 2AM — then leave a story of your own.";

const STATIONS = MOODS.map((mood, i) => ({ mood, freq: (88.1 + i * 3.6).toFixed(1) }));

const totalSongs = Object.values(moodPlaylists).reduce(
  (n, c) => n + (Array.isArray(c.playlistId) ? c.playlistId.length : 1),
  0
);

/**
 * Scroll-driven home sections. One rAF-throttled scroll loop writes CSS variables:
 *  --sy on the home root (px scrolled) and --p on every [data-scroll] element (0 → 1 as it crosses the
 *  viewport). Everything visual is CSS reading those vars. [data-reveal] elements fade in once.
 */
export function HomeSections({ onSelectMood, onNavigate, onOpenPlaylist }: HomeSectionsProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const home = root?.closest<HTMLElement>(".pml-newhome");
    if (!root || !home) return;

    const reveals = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      reveals.forEach((el) => el.classList.add("is-in"));
      // no scroll tuning: park the radio on the first station
      root.querySelectorAll(".pml-station, .pml-radio-quote").forEach((n, k) => n.classList.toggle("on", k % STATIONS.length === 0));
      return;
    }

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));

    const tracked = root.querySelectorAll<HTMLElement>("[data-scroll]");
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      home.style.setProperty("--sy", String(window.scrollY));
      tracked.forEach((el) => {
        const r = el.getBoundingClientRect();
        // sticky sections measure progress through their pinned length; others through the viewport
        const p = el.dataset.scroll === "pin" ? -r.top / Math.max(1, r.height - vh) : (vh - r.top) / (vh + r.height);
        const cp = Math.min(1, Math.max(0, p));
        el.style.setProperty("--p", cp.toFixed(4));
        if (el.dataset.radio !== undefined) {
          // sweep the needle across the middle 80% of the pin, then hold on the last station
          const np = Math.min(1, Math.max(0, (cp - 0.08) / 0.8));
          el.style.setProperty("--np", np.toFixed(4));
          const on = Math.round(np * (STATIONS.length - 1));
          if (el.dataset.on !== String(on)) {
            el.dataset.on = String(on);
            el.querySelectorAll(".pml-station, .pml-radio-quote").forEach((n, k) =>
              n.classList.toggle("on", k % STATIONS.length === on)
            );
            el.classList.remove("is-static");
            void el.offsetWidth; // restart the static flicker
            el.classList.add("is-static");
          }
        }
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const words = MANIFESTO.split(" ");
  // Newest story per mood, from the database.
  const [excerpts, setExcerpts] = useState<{ mood: (typeof MOODS)[number]; title: string; line: string }[]>([]);
  useEffect(() => {
    api.stories().then((all) =>
      setExcerpts(
        MOODS.flatMap((m) => {
          const s = all.find((x) => x.mood === m.slug);
          return s ? [{ mood: m, title: s.title, line: s.content.split(/(?<=[.!?])\s/)[0] }] : [];
        })
      )
    ).catch(() => {});
  }, []);

  return (
    <div className="pml-hs" ref={rootRef}>
      {/* 1 · PlayMyList FM: scroll tunes the dial across the moods */}
      <section className="pml-hs-radio" data-scroll="pin" data-radio>
        <div className="pml-hs-radio-pin">
          <span className="pml-hs-kicker">Now tuning · PlayMyList FM</span>
          <div className="pml-radio">
            <div className="pml-radio-top">
              <span className="pml-radio-brand">PLAYMYLIST <em>FM</em></span>
              <span className="pml-radio-lamp">
                <i /> Tuned
              </span>
              <span className="pml-radio-band">Stereo · 88 – 108 MHz</span>
            </div>
            <div className="pml-radio-face">
              <span className="pml-radio-knob" aria-hidden="true" />
              <div className="pml-radio-dial">
                <div className="pml-radio-scale" aria-hidden="true">
                  {[88, 92, 96, 100, 104, 108].map((f, i) => (
                    <span key={f} style={{ left: `${6 + i * 17.6}%` }}>
                      {f}
                    </span>
                  ))}
                </div>
                <div className="pml-radio-ticks" aria-hidden="true" />
                <div className="pml-radio-stations">
                  {STATIONS.map((st, i) => (
                    <button
                      key={st.mood.slug}
                      className="pml-station"
                      style={{ left: `${6 + i * 17.6}%`, "--a": st.mood.theme.accent } as React.CSSProperties}
                      onClick={() => onSelectMood(st.mood.slug)}
                    >
                      <b>{st.freq}</b>
                      <span>{st.mood.label}</span>
                    </button>
                  ))}
                </div>
                <span className="pml-radio-needle" aria-hidden="true" />
              </div>
              <span className="pml-radio-knob r" aria-hidden="true" />
            </div>
          </div>
          <div className="pml-radio-now" aria-live="polite">
            {STATIONS.map((st) => (
              <div key={st.mood.slug} className="pml-radio-quote" style={{ "--a": st.mood.theme.accent } as React.CSSProperties}>
                <span className="pml-radio-quote-label">
                  {st.freq} FM · {st.mood.label}
                </span>
                <p>&ldquo;{st.mood.quote}&rdquo;</p>
                <button className="pml-hs-cta" onClick={() => onSelectMood(st.mood.slug)}>
                  Tune in <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2 · manifesto: words light up as you scroll */}
      <section className="pml-hs-manifesto" data-scroll="pin">
        <div className="pml-hs-sticky">
          <span className="pml-hs-kicker">Side A · the idea</span>
          <p style={{ "--n": words.length } as React.CSSProperties}>
            {words.map((w, i) => (
              <span key={i} style={{ "--i": i } as React.CSSProperties}>
                {w}{" "}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* 3 · how it works */}
      <section className="pml-hs-steps">
        <header data-reveal>
          <span className="pml-hs-kicker">How it works</span>
          <h2>
            Three steps to <em>feeling</em> it.
          </h2>
        </header>
        <div className="pml-hs-step-grid">
          {[
            { n: "01", Icon: Heart, t: "Pick a feeling", d: "Six rooms — from first love to 3AM thoughts. Choose the one your heart is loudest in.", go: () => onNavigate("discover"), cta: "Discover moods" },
            { n: "02", Icon: Disc3, t: "Press play", d: `${totalSongs} hand-picked songs, a vinyl that spins with you, and a queue you can tap through.`, go: () => onNavigate("playlists"), cta: "See the tapes" },
            { n: "03", Icon: BookOpen, t: "Pull a story", d: "Books on a candle-lit shelf, written by strangers. Read one — then write yours.", go: () => onNavigate("library"), cta: "Open the library" },
          ].map(({ n, Icon, t, d, go, cta }, i) => (
            <button key={n} className="pml-hs-step" data-reveal style={{ "--d": `${i * 120}ms` } as React.CSSProperties} onClick={go}>
              <span className="pml-hs-step-n">{n}</span>
              <span className="pml-hs-step-icon">
                <Icon size={22} />
              </span>
              <span className="pml-hs-step-t">{t}</span>
              <span className="pml-hs-step-d">{d}</span>
              <span className="pml-hs-step-cta">
                {cta} <ArrowRight size={14} />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 4 · stories drifting at different speeds */}
      <section className="pml-hs-stories" data-scroll>
        <div className="pml-hs-stories-copy" data-reveal>
          <span className="pml-hs-kicker">The library</span>
          <h2>
            Strangers wrote these <em>at 2AM</em>.
          </h2>
          <p>Every mood has a shelf. Every book is somebody&apos;s night.</p>
          <button className="pml-hs-cta" onClick={() => onNavigate("library")}>
            Visit the library <ArrowRight size={15} />
          </button>
        </div>
        <div className="pml-hs-cards" aria-hidden="true">
          {excerpts.map((e, i) => (
            <button
              key={e.title}
              tabIndex={-1}
              className="pml-hs-card"
              style={{ "--k": [-1.1, 0.7, -0.4, 1.2, -0.8, 0.5][i % 6], "--r": `${[-4, 3, -2, 5, -3, 2][i % 6]}deg`, "--a": e.mood.theme.accent } as React.CSSProperties}
              onClick={() => onSelectMood(e.mood.slug)}
            >
              <span className="pml-hs-card-mood">{e.mood.label}</span>
              <span className="pml-hs-card-title">{e.title}</span>
              <span className="pml-hs-card-line">&ldquo;{e.line}&rdquo;</span>
            </button>
          ))}
        </div>
      </section>

      {/* 5 · a vinyl that spins with the scroll */}
      <section className="pml-hs-tape" data-scroll>
        <div className="pml-hs-vinyl" aria-hidden="true">
          <span className="pml-hs-vinyl-label">
            <b>PLAYMYLIST</b>
            <small>side A · 33⅓</small>
          </span>
        </div>
        <div className="pml-hs-tape-copy" data-reveal>
          <span className="pml-hs-kicker">Mixtapes</span>
          <h2>
            A tape for every <em>mood</em>.
          </h2>
          <p>Press play on any mood and keep wandering — the music follows you, tucked in the corner.</p>
          <div className="pml-hs-chips">
            {MOODS.map((m) => (
              <button key={m.slug} onClick={() => onSelectMood(m.slug)} style={{ "--a": m.theme.accent } as React.CSSProperties}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="pml-hs-cta-row">
            <button className="pml-hs-cta" onClick={() => onNavigate("playlists")}>
              Browse playlists <ArrowRight size={15} />
            </button>
            <button className="pml-hs-cta ghost" onClick={onOpenPlaylist}>
              Make your own
            </button>
          </div>
        </div>
      </section>

      {/* 6 · footer */}
      <footer className="pml-hs-footer" data-scroll>
        <div className="pml-hs-giant" aria-hidden="true">
          PLAYMYLIST
        </div>
        <div className="pml-hs-foot-row">
          <span>Music · Stories · Visuals · One feeling</span>
          <nav>
            <button onClick={() => onNavigate("discover")}>Discover</button>
            <button onClick={() => onNavigate("library")}>Stories</button>
            <button onClick={() => onNavigate("playlists")}>Playlists</button>
          </nav>
          <span>made for late nights · &apos;96</span>
        </div>
      </footer>
    </div>
  );
}
