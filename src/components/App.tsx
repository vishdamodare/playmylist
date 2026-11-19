"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { flushSync } from "react-dom";
import { MOODS } from "@/data/moods";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { Home } from "@/components/home/Home";
import { MoodExperience } from "@/components/experience/MoodExperience";
import { MyPlaylist } from "@/components/playlist/MyPlaylist";
import { MakePlaylist, MakeMode } from "@/components/playlist/MakePlaylist";
import { Received, decodeGift } from "@/lib/gift";
import type { CommunityPlaylist } from "@/lib/api";
import { DiscoverPage, LibraryPage, PlaylistsPage, BrowseView } from "@/components/browse/Browse";
import { YouTubePlayer } from "@/components/player/YouTubePlayer";
import { MusicPlayer } from "@/components/player/MusicPlayer";
import { MusicProvider } from "@/types/player";
import { moodQueue, shuffled, syncAllSongs } from "@/lib/moodSongs";
import { SkyToggle } from "@/components/SkyToggle";
import { NamePrompt } from "@/components/NamePrompt";
import { Feedback } from "@/components/Feedback";

/** "home", "playlist" (yours), a browse page, or a mood slug. */
type View = string;

/** What is loaded in the YouTube player, so the player bar can follow you to the home screen. */
interface NowPlaying {
  queue: string | string[];
  slug: string;
  name: string;
  accent: string;
  accent2: string;
}

function contextFor(view: View): Omit<NowPlaying, "queue"> {
  const mood = MOODS.find((m) => m.slug === view);
  if (mood) return { slug: view, name: mood.playlistName, accent: mood.theme.accent, accent2: mood.theme.accent2 };
  return { slug: view, name: "My Playlist", accent: "#9a6fd9", accent2: "#e8897f" };
}

/**
 * Cross-fade between screens with the native View Transitions API.
 * Browsers without it (or reduced-motion users) get the CSS enter animation instead.
 */
function transition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduced) return update();
  doc.startViewTransition(() => flushSync(update));
}

/** URL for a screen: moods get their own shareable, indexable address; everything else lives at "/". */
const pathFor = (v: View) => (MOODS.some((m) => m.slug === v) ? `/mood/${v}` : "/");
const viewFromPath = (path: string): View => {
  const slug = path.match(/^\/mood\/([^/]+)/)?.[1];
  return slug && MOODS.some((m) => m.slug === slug) ? slug : "home";
};

export function PlayMyList({ initialView = "home" }: { initialView?: View }) {
  const [view, setView] = useState<View>(initialView);
  const [makeMode, setMakeMode] = useState<MakeMode>("someone");
  const [received, setReceived] = useState<Received | null>(null);

  // Someone sent you a playlist (?gift=…): open it straight away.
  useEffect(() => {
    const raw = new URLSearchParams(location.search).get("gift");
    const g = raw && decodeGift(raw);
    if (g) {
      setReceived(g);
      setView("received");
    }
  }, []);

  // Keep the tab title in step with the screen (matches each page's server-rendered <title>).
  useEffect(() => {
    const m = MOODS.find((x) => x.slug === view);
    document.title = m
      ? `${m.label} Songs & Stories: ${m.playlistName} | PlayMyList`
      : "PlayMyList: Mood Playlists & Stories for Every Feeling";
  }, [view]);

  // Back / forward buttons move between moods and home.
  useEffect(() => {
    const onPop = () => setView(viewFromPath(location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Morning / Night lives here (not in Home) so it survives leaving and coming back, and a reload.
  const [skyMode, setSkyModeState] = useState<"morning" | "night">("night");
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("pml_sky");
    } catch {}
    const hour = new Date().getHours();
    setSkyModeState(saved === "morning" || saved === "night" ? saved : hour >= 6 && hour < 18 ? "morning" : "night");
  }, []);
  const setSkyMode = useCallback((m: "morning" | "night") => {
    setSkyModeState(m);
    try {
      localStorage.setItem("pml_sky", m);
    } catch {}
  }, []);
  useEffect(syncAllSongs, []);
  const { playerState, provider: rawProvider } = useYouTubePlayer("youtube-player-element");
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);

  // Same provider, but every load also records what (and from where) is playing.
  const provider: MusicProvider = useMemo(
    () => ({
      ...rawProvider,
      loadPlaylist: (queue, type, autoplay, startIndex) => {
        if (view !== "home" && view !== "discover" && view !== "library" && view !== "playlists") setNowPlaying({ queue, ...contextFor(view) });
        rawProvider.loadPlaylist(queue, type, autoplay, startIndex);
      },
    }),
    [rawProvider, view]
  );

  const go = useCallback((next: View) => {
    transition(() => {
      setView(next);
      const path = pathFor(next);
      if (location.pathname !== path) history.pushState(null, "", path);
      window.scrollTo(0, 0);
    });
  }, []);

  // Already playing this mood? Keep the current song. Otherwise start the mood shuffled.
  // Runs inside the click (user gesture) so browsers allow autoplay.
  const playMood = useCallback(
    (slug: string) => {
      if (nowPlaying?.slug === slug) return;
      const q = shuffled(moodQueue(slug));
      if (!q.length) return;
      setNowPlaying({ queue: q, ...contextFor(slug) });
      rawProvider.loadPlaylist(q);
    },
    [rawProvider, nowPlaying?.slug]
  );

  const handleSelectMood = useCallback(
    (slug: string) => {
      playMood(slug);
      go(slug);
    },
    [playMood, go]
  );

  const goHome = useCallback(() => {
    if (location.search) history.replaceState(null, "", "/");
    go("home");
  }, [go]);

  const make = useCallback(
    (mode: MakeMode) => {
      setMakeMode(mode);
      go("make");
    },
    [go]
  );

  const openCommunity = useCallback(
    (p: CommunityPlaylist) => {
      setReceived({ name: p.name, to: "", ids: p.ids, by: p.creator, id: p.id, mine: p.mine });
      go("received");
    },
    [go]
  );

  const isBrowse = view === "discover" || view === "library" || view === "playlists";
  const skyToggle = <SkyToggle mode={skyMode} onChange={setSkyMode} />;
  const nav = { onNavigate: (v: BrowseView) => go(v), onHome: goHome, headerExtra: skyToggle };

  const activeMood = MOODS.find((m) => m.slug === view);

  return (
    <div className="pml" data-sky={skyMode}>
      {/* morning sunlight over every inner page (home draws its own sky) */}
      {skyMode === "morning" && view !== "home" && <div className="pml-sunlight" aria-hidden="true" />}
      {activeMood ? (
        <MoodExperience
          key={activeMood.slug}
          mood={activeMood}
          playingQueue={nowPlaying?.slug === activeMood.slug && Array.isArray(nowPlaying.queue) ? nowPlaying.queue : undefined}
          onBack={goHome}
          playerState={playerState}
          provider={provider}
          headerExtra={skyToggle}
        />
      ) : view === "playlist" ? (
        <MyPlaylist onBack={goHome} onMake={make} playerState={playerState} provider={provider} headerExtra={skyToggle} />
      ) : view === "make" ? (
        <MakePlaylist key={makeMode} initialMode={makeMode} onBack={goHome} playerState={playerState} provider={provider} headerExtra={skyToggle} />
      ) : view === "received" && received ? (
        <MakePlaylist key={received.id ?? "gift"} received={received} onBack={goHome} playerState={playerState} provider={provider} headerExtra={skyToggle} />
      ) : view === "discover" ? (
        <DiscoverPage onSelectMood={handleSelectMood} {...nav} />
      ) : view === "library" ? (
        <LibraryPage onSelectMood={handleSelectMood} isPlaying={playerState.isPlaying} {...nav} />
      ) : view === "playlists" ? (
        <PlaylistsPage
          onPlayMood={playMood}
          onSelectMood={handleSelectMood}
          onOpenMine={() => go("playlist")}
          playerState={playerState}
          onTogglePlay={rawProvider.togglePlay}
          {...nav}
        />
      ) : (
        <Home
          onSelectMood={handleSelectMood}
          onOpenPlaylist={() => go("playlist")}
          onOpenCommunity={openCommunity}
          onMakeForEveryone={() => make("everyone")}
          onNavigate={(v) => go(v)}
          skyMode={skyMode}
          onSkyMode={setSkyMode}
        />
      )}
      {/* outside a mood the player shrinks to a corner pill (with its song list) */}
      {(view === "home" || isBrowse) && nowPlaying && (
        <MusicPlayer
          accent={nowPlaying.accent}
          accent2={nowPlaying.accent2}
          queue={nowPlaying.queue}
          fallbackTitle={nowPlaying.name}
          queueName={nowPlaying.name}
          from={{
            label: MOODS.find((m) => m.slug === nowPlaying.slug)?.label ?? "My Playlist",
            onClick: () => go(nowPlaying.slug),
          }}
          playerState={playerState}
          provider={provider}
          mini
        />
      )}
      <YouTubePlayer />
      <NamePrompt />
      <Feedback page={view} />
    </div>
  );
}
