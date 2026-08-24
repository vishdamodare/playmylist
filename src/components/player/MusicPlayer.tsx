"use client";

import React, { useState, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Mood } from "@/types/mood";
import { PlayerState, MusicProvider } from "@/types/player";
import { moodPlaylists } from "@/data/moodPlaylists";
import { parsePlaylistInput } from "@/lib/playlistHelper";

interface MusicPlayerProps {
  mood: Mood;
  playerState: PlayerState;
  provider: MusicProvider;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function MusicPlayer({ mood, playerState, provider }: MusicPlayerProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(playerState.volume);
  const progressTrackRef = useRef<HTMLDivElement>(null);

  const playlistConfig = moodPlaylists[mood.slug];
  const parsedPlaylist = playlistConfig ? parsePlaylistInput(playlistConfig.playlistId) : { provider: "unknown" as const, id: "" };
  const isSpotify = parsedPlaylist.provider === "spotify" && Boolean(parsedPlaylist.embedUrl);

  // If this mood is configured with a Spotify playlist, show the native Spotify Player bar!
  if (isSpotify && parsedPlaylist.embedUrl) {
    return (
      <div className="pml-player pml-player-spotify" role="region" aria-label="Spotify music player">
        <iframe
          src={parsedPlaylist.embedUrl}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="eager"
          className="w-full rounded-xl bg-transparent"
        />
      </div>
    );
  }

  const displayTitle =
    playerState.currentVideoTitle ||
    mood.tracks?.[0]?.title ||
    mood.playlistName ||
    "Select a mood";

  const displayArtist =
    playerState.currentArtist ||
    mood.tracks?.[0]?.artist ||
    "YouTube Music";

  const duration = playerState.duration > 0 ? playerState.duration : 180;
  const currentTime = playerState.currentTime;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressTrackRef.current || duration <= 0) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = ratio * duration;
    provider.seek(targetSeconds);
  };

  const handleVolumeToggle = () => {
    if (isMuted) {
      provider.setVolume(prevVolume || 80);
      setIsMuted(false);
    } else {
      setPrevVolume(playerState.volume);
      provider.setVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <div className="pml-player" role="region" aria-label="Audio player">
      <div
        className="pml-player-art relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${mood.theme.accent}, ${mood.theme.accent2})`,
        }}
      >
        {playerState.isPlaying && (
          <div className="absolute inset-0 bg-white/20 animate-ping rounded-full pointer-events-none opacity-40" />
        )}
      </div>

      <div className="pml-player-meta">
        <div className="pml-player-title" title={displayTitle}>
          {displayTitle}
        </div>
        <div className="pml-player-artist" title={displayArtist}>
          {displayArtist}
        </div>
      </div>

      <div className="pml-player-controls">
        <button
          aria-label="Previous track"
          onClick={provider.previous}
          className="hover:opacity-80 transition-opacity"
        >
          <SkipBack size={15} />
        </button>

        <button
          aria-label={playerState.isPlaying ? "Pause" : "Play"}
          className="pml-player-play hover:scale-105 transition-transform"
          onClick={() => {
            if (!playerState.isPlaying && playlistConfig?.playlistId) {
              const parsed = parsePlaylistInput(playlistConfig.playlistId);
              if (parsed.provider === "youtube" && parsed.id) {
                provider.loadPlaylist(parsed.id, parsed.type);
              }
            }
            provider.togglePlay();
          }}
        >
          {playerState.isBuffering ? (
            <Loader2 size={14} className="animate-spin text-black" />
          ) : playerState.isPlaying ? (
            <Pause size={14} />
          ) : (
            <Play size={14} style={{ marginLeft: 1 }} />
          )}
        </button>

        <button
          aria-label="Next track"
          onClick={provider.next}
          className="hover:opacity-80 transition-opacity"
        >
          <SkipForward size={15} />
        </button>
      </div>

      <div className="pml-progress-wrap">
        <span className="pml-progress-time pml-mono">
          {formatTime(currentTime)}
        </span>

        <div
          ref={progressTrackRef}
          className="pml-progress-track cursor-pointer group"
          onClick={handleSeek}
          role="slider"
          aria-label="Seek track position"
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          aria-valuenow={Math.floor(currentTime)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") provider.seek(Math.min(duration, currentTime + 5));
            if (e.key === "ArrowLeft") provider.seek(Math.max(0, currentTime - 5));
          }}
        >
          <div
            className="pml-progress-fill group-hover:brightness-125 transition-all"
            style={{
              width: `${progressPercent}%`,
              background: mood.theme.accent,
            }}
          />
        </div>

        <span className="pml-progress-time pml-mono">
          {formatTime(duration)}
        </span>
      </div>

      <div
        className="pml-vol relative flex items-center"
        onMouseEnter={() => setShowVolumeSlider(true)}
        onMouseLeave={() => setShowVolumeSlider(false)}
      >
        <button
          onClick={handleVolumeToggle}
          aria-label={isMuted ? "Unmute" : "Mute"}
          className="hover:text-white transition-colors"
        >
          {isMuted || playerState.volume === 0 ? (
            <VolumeX size={14} />
          ) : (
            <Volume2 size={14} />
          )}
        </button>

        {showVolumeSlider && (
          <div className="absolute bottom-8 right-0 bg-neutral-900/90 border border-white/10 px-3 py-2 rounded-lg shadow-xl backdrop-blur-md flex items-center z-50">
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : playerState.volume}
              onChange={(e) => {
                const val = Number(e.target.value);
                provider.setVolume(val);
                if (val > 0 && isMuted) setIsMuted(false);
              }}
              className="w-20 h-1 accent-rose-300 cursor-pointer bg-white/20 rounded"
              aria-label="Volume slider"
            />
          </div>
        )}
      </div>
    </div>
  );
}
