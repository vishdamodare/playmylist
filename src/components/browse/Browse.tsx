"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Play, Pause, Plus } from "lucide-react";
import { MOODS } from "@/data/moods";
import { Mood, Story } from "@/types/mood";
import { PlayerState } from "@/types/player";
import { storage } from "@/lib/storage";
import { api } from "@/lib/api";
import { moodQueue } from "@/lib/moodSongs";
import { StoryShelf } from "@/components/experience/StoryShelf";
import { openFeedback } from "@/components/Feedback";

export type BrowseView = "discover" | "library" | "playlists";

const songIds = (slug: string): string[] => moodQueue(slug);

/** Every mood's community stories in one request, grouped by mood (from Postgres via /api/stories). */
async function loadAllCommunity(): Promise<Record<string, Story[]>> {
  try {
    const all = await api.stories();
    return all.reduce<Record<string, Story[]>>((acc, st) => ((acc[st.mood] ||= []).push(st), acc), {});
  } catch {
    return {};
  }
}

// ── shared header ──
function BrowseHeader({
  active,
  onNavigate,
  onHome,
  headerExtra,
}: {
  active: BrowseView;
  onNavigate: (v: BrowseView) => void;
  onHome: () => void;
  headerExtra?: React.ReactNode;
}) {
  const links: [BrowseView, string][] = [
    ["discover", "Discover"],
    ["library", "Stories"],
    ["playlists", "Playlists"],
  ];
  return (
    <header className="pml-browse-head">
      <button className="pml-back" onClick={onHome}>
        <ArrowLeft size={15} /> Home
      </button>
      <button className="pml-browse-wordmark" onClick={onHome}>
        PLAYMYLIST
      </button>
      <nav>
        {headerExtra}
        {links.map(([v, label]) => (
          <button key={v} className={active === v ? "active" : ""} onClick={() => onNavigate(v)} aria-current={active === v ? "page" : undefined}>
            {label}
          </button>
        ))}
        <button onClick={openFeedback}>Feedback</button>
      </nav>
    </header>
  );
}

function Hero({ kicker, title, sub }: { kicker: string; title: React.ReactNode; sub: string }) {
  return (
    <section className="pml-browse-hero">
      <span className="pml-browse-kicker">{kicker}</span>
      <h1>{title}</h1>
      <p>{sub}</p>
    </section>
  );
}

interface ShellProps {
  active: BrowseView;
  onNavigate: (v: BrowseView) => void;
  onHome: () => void;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}
function Shell({ active, onNavigate, onHome, headerExtra, children }: ShellProps) {
  return (
    <div className={`pml-browse pml-browse-${active} pml-view-enter`}>
      <BrowseHeader active={active} onNavigate={onNavigate} onHome={onHome} headerExtra={headerExtra} />
      <main className="pml-browse-body">{children}</main>
      <div className="pml-film" aria-hidden="true" />
    </div>
  );
}

// ── Discover: every mood as a card ──
export function DiscoverPage({
  onSelectMood,
  ...nav
}: { onSelectMood: (slug: string) => void } & Omit<ShellProps, "children" | "active">) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    loadAllCommunity().then((g) => setCounts(Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.length]))));
  }, []);

  return (
    <Shell active="discover" {...nav}>
      <Hero
        kicker="Discover · six feelings"
        title={
          <>
            Which one is <em>loudest</em> tonight?
          </>
        }
        sub="Every mood is a room of its own — a soundtrack, a shelf of stories, and somewhere to write yours."
      />
      <div className="pml-discover-grid">
        {MOODS.map((m, i) => (
          <MoodCard
            key={m.slug}
            mood={m}
            index={i}
            songs={songIds(m.slug).length}
            stories={counts[m.slug] ?? 0}
            onOpen={() => onSelectMood(m.slug)}
          />
        ))}
      </div>
    </Shell>
  );
}

function MoodCard({
  mood,
  index,
  songs,
  stories,
  onOpen,
}: {
  mood: Mood;
  index: number;
  songs: number;
  stories: number;
  onOpen: () => void;
}) {
  const t = mood.theme;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  return (
    <button
      className="pml-mood-card"
      style={
        {
          "--a": t.accent,
          "--a2": t.accent2,
          "--from": t.from,
          "--via": t.via,
          "--to": t.to,
          animationDelay: `${index * 70}ms`,
        } as React.CSSProperties
      }
      onClick={onOpen}
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => videoRef.current?.pause()}
      aria-label={`Enter ${mood.label}`}
    >
      <span className="pml-mood-card-art" aria-hidden="true">
        {mood.videoSrc && <video ref={videoRef} src={mood.videoSrc} muted loop playsInline preload="metadata" />}
      </span>
      <span className="pml-mood-card-shade" aria-hidden="true" />
      <span className="pml-mood-card-top">
        <span className="pml-mood-card-no">No. {String(index + 1).padStart(2, "0")}</span>
        <span className="pml-mood-card-scene">{mood.visualLabel}</span>
      </span>
      <span className="pml-mood-card-body">
        <span className="pml-mood-card-label">{mood.label}</span>
        <span className="pml-mood-card-quote">&ldquo;{mood.quote}&rdquo;</span>
        <span className="pml-mood-card-meta">
          <span>{songs} songs</span>
          <i />
          <span>{stories} stories</span>
          <span className="pml-mood-card-go">
            Enter <ArrowRight size={14} />
          </span>
        </span>
      </span>
    </button>
  );
}

// ── Stories: a library of shelves, one per mood ──
export function LibraryPage({
  onSelectMood,
  isPlaying,
  ...nav
}: { onSelectMood: (slug: string) => void; isPlaying: boolean } & Omit<ShellProps, "children" | "active">) {
  const [community, setCommunity] = useState<Record<string, Story[]>>({});
  useEffect(() => {
    loadAllCommunity().then(setCommunity);
  }, []);

  const total = MOODS.reduce((n, m) => n + (community[m.slug]?.length ?? 0), 0);
  const isUserStory = (s: Story) => Boolean(s.mine);

  const remove = (slug: string, s: Story) => {
    const next = (community[slug] ?? []).filter((x) => x.id !== s.id);
    setCommunity((p) => ({ ...p, [slug]: next }));
    if (s.id) api.deleteStory(s.id).catch(() => loadAllCommunity().then(setCommunity)); // resync if refused
  };

  return (
    <Shell active="library" {...nav}>
      <Hero
        kicker={`The library · ${total} stories`}
        title={
          <>
            Every feeling, <em>shelved</em>.
          </>
        }
        sub="Strangers wrote these at 2AM, on bus rides, after the call ended. Pull one off the shelf."
      />
      {MOODS.map((m, i) => {
        const stories = community[m.slug] ?? [];
        return (
          <section key={m.slug} className="pml-library-section" style={{ "--a": m.theme.accent } as React.CSSProperties}>
            <div className="pml-library-head">
              <div>
                <span className="pml-library-no">Shelf {String(i + 1).padStart(2, "0")}</span>
                <h2>{m.label}</h2>
              </div>
              <button className="pml-library-visit" onClick={() => onSelectMood(m.slug)}>
                Visit the room <ArrowRight size={14} />
              </button>
            </div>
            <StoryShelf
              stories={stories}
              moodLabel={m.label}
              theme={m.theme}
              isUserStory={isUserStory}
              onEdit={() => onSelectMood(m.slug)}
              onDelete={(s) => remove(m.slug, s)}
              isPlaying={isPlaying}
              companion={i === 0}
            />
          </section>
        );
      })}
    </Shell>
  );
}

// ── Playlists: mixtapes ──
export function PlaylistsPage({
  onPlayMood,
  onSelectMood,
  onOpenMine,
  playerState,
  onTogglePlay,
  ...nav
}: {
  onPlayMood: (slug: string) => void;
  onSelectMood: (slug: string) => void;
  onOpenMine: () => void;
  playerState: PlayerState;
  onTogglePlay: () => void;
} & Omit<ShellProps, "children" | "active">) {
  const [mine, setMine] = useState<{ name: string; ids: string[] }>({ name: "My Playlist", ids: [] });
  useEffect(() => {
    storage.get("my_playlist").then((r) => {
      try {
        if (r?.value) {
          const saved = JSON.parse(r.value);
          setMine({ name: saved.name || "My Playlist", ids: (saved.songs || []).map((s: { id: string }) => s.id) });
        }
      } catch {
        // ignore a corrupt save
      }
    });
  }, []);

  return (
    <Shell active="playlists" {...nav}>
      <Hero
        kicker="Playlists · mixtapes"
        title={
          <>
            A tape for every <em>mood</em>.
          </>
        }
        sub="Press play and keep browsing — the music follows you around the site."
      />
      <div className="pml-tapes">
        <button className="pml-tape pml-tape-mine" onClick={onOpenMine}>
          <Collage ids={mine.ids} accent="#9a6fd9" accent2="#e8897f" empty={<Plus size={28} />} />
          <span className="pml-tape-info">
            <span className="pml-tape-kicker">Made by you</span>
            <span className="pml-tape-title">{mine.name}</span>
            <span className="pml-tape-count">
              {mine.ids.length ? `${mine.ids.length} songs` : "Paste YouTube links to start"}
            </span>
          </span>
          <span className="pml-tape-open">
            Open <ArrowRight size={14} />
          </span>
        </button>

        {MOODS.map((m) => {
          const ids = songIds(m.slug);
          const current = playerState.playlistId === ids.join(",");
          const playing = current && playerState.isPlaying;
          return (
            <div
              key={m.slug}
              className={`pml-tape ${current ? "is-current" : ""}`}
              style={{ "--a": m.theme.accent, "--a2": m.theme.accent2 } as React.CSSProperties}
            >
              <Collage ids={ids} accent={m.theme.accent} accent2={m.theme.accent2} />
              <span className="pml-tape-info">
                <span className="pml-tape-kicker">{m.label}</span>
                <span className="pml-tape-title">{m.playlistName}</span>
                <span className="pml-tape-count">
                  {current && (
                    <span className={`pml-eq ${playing ? "on" : ""}`} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                  {ids.length} songs
                </span>
              </span>
              <span className="pml-tape-actions">
                <button
                  className="pml-tape-play"
                  onClick={() => (current ? onTogglePlay() : onPlayMood(m.slug))}
                  aria-label={playing ? `Pause ${m.playlistName}` : `Play ${m.playlistName}`}
                >
                  {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />}
                </button>
                <button className="pml-tape-room" onClick={() => onSelectMood(m.slug)}>
                  Visit room
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

function Collage({ ids, accent, accent2, empty }: { ids: string[]; accent: string; accent2: string; empty?: React.ReactNode }) {
  const four = ids.slice(0, 4);
  return (
    <span className="pml-collage" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }} aria-hidden="true">
      {four.length >= 4
        ? four.map((id) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={id} src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" loading="lazy" />
          ))
        : four[0]
        ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="solo" src={`https://i.ytimg.com/vi/${four[0]}/mqdefault.jpg`} alt="" loading="lazy" />
          )
        : <span className="pml-collage-empty">{empty}</span>}
    </span>
  );
}
