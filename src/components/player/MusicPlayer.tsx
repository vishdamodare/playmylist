"use client";

import React, { useState, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2, Disc3, X } from "lucide-react";
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
  const [showSpotifyEmbed, setShowSpotifyEmbed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(playerState.volume);
  const progressTrackRef = useRef<HTMLDivElement>(null);

  const playlistConfig = moodPlaylists[mood.slug];
  const parsedPlaylist = playlistConfig ? parsePlaylistInput(playlistConfig.playlistId) : { provider: "unknown" as const, id: "" };
  const isSpotify = parsedPlaylist.provider === "spotify";

  const displayTitle =
    isSpotify
      ? `${mood.label} Playlist`
      : playerState.currentVideoTitle ||
        mood.tracks?.[0]?.title ||
        mood.playlistName ||
        "Select a mood";

  const displayArtist =
    isSpotify
      ? "Spotify Music"
      : playerState.currentArtist ||
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
    <>
      {/* Spotify Embed Modal / Drawer if enabled */}
      {isSpotify && showSpotifyEmbed && parsedPlaylist.embedUrl && (
        <div className="fixed bottom-20 right-6 z-50 w-80 md:w-96 rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black/90 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between px-3 py-2 bg-neutral-900/80 border-b border-white/10">
            <span className="text-xs font-mono tracking-wider text-emerald-400 font-medium">SPOTIFY PLAYER</span>
            <button
              onClick={() => setShowSpotifyEmbed(false)}
              className="text-neutral-400 hover:text-white transition-colors p-1"
            >
              <X size={14} />
            </button>
          </div>
          <iframe
            src={parsedPlaylist.embedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-b-xl"
          />
        </div>
      )}

      <div className="pml-player" role="region" aria-label="Audio player">
        <div
          className="pml-player-art relative overflow-hidden"
          style={{
            background: isSpotify ? "#1DB954" : `linear-gradient(135deg, ${mood.theme.accent}, ${mood.theme.accent2})`,
          }}
        >
          {playerState.isPlaying && !isSpotify && (
            <div className="absolute inset-0 bg-white/20 animate-ping rounded-full pointer-events-none opacity-40" />
          )}
          {isSpotify && (
            <div className="flex items-center justify-center h-full text-black">
              <Disc3 size={15} className="animate-spin" style={{ animationDuration: "4s" }} />
            </div>
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

        {isSpotify ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSpotifyEmbed((prev) => !prev)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50 transition-all flex items-center gap-1.5"
            >
              <Disc3 size={13} />
              <span>{showSpotifyEmbed ? "Hide Spotify" : "Open Spotify Player"}</span>
            </button>
          </div>
        ) : (
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
              onClick={provider.togglePlay}
              disabled={!playerState.isReady && !playerState.error}
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
        )}

        {!isSpotify && (
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
        )}

        {!isSpotify && (
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
        )}
      </div>
    </>
  );
}
