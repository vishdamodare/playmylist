"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { flushSync } from "react-dom";
import { MOODS } from "@/data/moods";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { Home } from "@/components/home/Home";
import { MoodExperience } from "@/components/experience/MoodExperience";
import { MyPlaylist } from "@/components/playlist/MyPlaylist";
import { DiscoverPage, LibraryPage, PlaylistsPage, BrowseView } from "@/components/browse/Browse";
import { YouTubePlayer } from "@/components/player/YouTubePlayer";
import { MusicPlayer } from "@/components/player/MusicPlayer";
import { MusicProvider } from "@/types/player";
import { moodQueue } from "@/lib/moodSongs";
import { SkyToggle } from "@/components/SkyToggle";
import { NamePrompt } from "@/components/NamePrompt";

/** "home", "playlist" (yours), a browse page, or a mood slug. */
type View = string;

/** What is loaded in the YouTube player, so the player bar can follow you to the home screen. */
interface NowPlaying {
  queue: string | string[];
  name: string;
  accent: string;
  accent2: string;
}

function contextFor(view: View): Omit<NowPlaying, "queue"> {
  const mood = MOODS.find((m) => m.slug === view);
  if (mood) return { name: mood.playlistName, accent: mood.theme.accent, accent2: mood.theme.accent2 };
  return { name: "My Playlist", accent: "#9a6fd9", accent2: "#e8897f" };
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

export default function PlayMyList() {
  const [view, setView] = useState<View>("home");

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
      window.scrollTo(0, 0);
    });
  }, []);

  const handleSelectMood = useCallback(
    (slug: string) => {
      // Start music inside the click (user gesture) so browsers allow autoplay.
      const q = moodQueue(slug);
      if (q.length) {
        setNowPlaying({ queue: q, ...contextFor(slug) });
        rawProvider.loadPlaylist(q);
      }
      go(slug);
    },
    [rawProvider, go]
  );

  const goHome = useCallback(() => go("home"), [go]);

  const playMood = useCallback(
    (slug: string) => {
      const q = moodQueue(slug);
      if (!q.length) return;
      setNowPlaying({ queue: q, ...contextFor(slug) });
      rawProvider.loadPlaylist(q);
    },
    [rawProvider]
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
          onBack={goHome}
          playerState={playerState}
          provider={provider}
          headerExtra={skyToggle}
        />
      ) : view === "playlist" ? (
        <MyPlaylist onBack={goHome} playerState={playerState} provider={provider} headerExtra={skyToggle} />
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
          playerState={playerState}
          provider={provider}
          mini
        />
      )}
      <YouTubePlayer />
      <NamePrompt />
    </div>
  );
}
