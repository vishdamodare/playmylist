"use client";

import React, { useState, useCallback } from "react";
import { MOODS } from "@/data/moods";
import { moodPlaylists } from "@/data/moodPlaylists";
import { parsePlaylistInput } from "@/lib/playlistHelper";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { Home } from "@/components/home/Home";
import { MoodExperience } from "@/components/experience/MoodExperience";
import { YouTubePlayer } from "@/components/player/YouTubePlayer";

export default function PlayMyList() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const { playerState, provider } = useYouTubePlayer("youtube-player-element");

  const handleSelectMood = useCallback(
    (slug: string) => {
      setActiveSlug(slug);

      const playlistConfig = moodPlaylists[slug];
      if (playlistConfig && playlistConfig.playlistId) {
        const parsed = parsePlaylistInput(playlistConfig.playlistId);
        if (parsed.provider === "youtube" && parsed.id) {
          provider.loadPlaylist(parsed.id);
        }
      }
    },
    [provider]
  );

  const handleBack = useCallback(() => {
    setActiveSlug(null);
  }, []);

  const activeMood = MOODS.find((m) => m.slug === activeSlug);

  return (
    <div className="pml">
      {activeMood ? (
        <MoodExperience
          key={activeMood.slug}
          mood={activeMood}
          onBack={handleBack}
          playerState={playerState}
          provider={provider}
        />
      ) : (
        <Home onSelectMood={handleSelectMood} />
      )}
      <YouTubePlayer />
    </div>
  );
}
