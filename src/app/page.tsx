"use client";

import React, { useState, useCallback } from "react";
import { MOODS } from "@/data/moods";
import { moodPlaylists } from "@/data/moodPlaylists";
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
        provider.loadPlaylist(playlistConfig.playlistId);
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
