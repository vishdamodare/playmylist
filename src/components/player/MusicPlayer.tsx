"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2, ListMusic, X, Plus, Link2 } from "lucide-react";
import { PlayerState, MusicProvider } from "@/types/player";
import { parsePlaylistInput } from "@/lib/playlistHelper";
import { lookupSong, SongMeta } from "@/lib/youtubeMeta";

export interface MusicPlayerProps {
  accent: string;
  accent2: string;
  /** Song IDs / links, or a single playlist link, this player bar plays. */
  queue: string | string[] | undefined;
  fallbackTitle: string;
  fallbackArtist?: string;
  /** heading for the "Up next" panel */
  queueName?: string;
  /** compact corner pill (home screen) instead of the full bar */
  mini?: boolean;
  /** lets listeners paste YouTube links into this queue; resolves to a status message */
  onAddSongs?: (text: string) => Promise<string>;
  /** song IDs the listener added (shown with a "yours" tag and a remove button) */
  userSongIds?: string[];
  onRemoveSong?: (id: string) => void;
  /** bump to open the song list with the add box focused */
  openAddSignal?: number;
  playerState: PlayerState;
  provider: MusicProvider;
}

/** Same key useYouTubePlayer stores in playerState.playlistId, so we can tell if this queue is loaded. */
function queueKey(queue: string | string[] | undefined): string {
  if (!queue) return "";
  if (Array.isArray(queue)) {
    return queue.map((q) => parsePlaylistInput(q).id).filter(Boolean).join(",");
  }
  return parsePlaylistInput(queue).id;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function MusicPlayer({
  accent,
  accent2,
  queue,
  fallbackTitle,
  fallbackArtist = "YouTube Music",
  queueName,
  mini = false,
  onAddSongs,
  userSongIds = [],
  onRemoveSong,
  openAddSignal = 0,
  playerState,
  provider,
}: MusicPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(playerState.volume);
  const progressTrackRef = useRef<HTMLDivElement>(null);

  // ── "Up next" queue panel ──
  const [showQueue, setShowQueue] = useState(false);
  const [addText, setAddText] = useState("");
  const [adding, setAdding] = useState(false);
  const [addNotice, setAddNotice] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!openAddSignal) return;
    setShowQueue(true);
    setTimeout(() => addInputRef.current?.focus(), 60);
  }, [openAddSignal]);

  const submitAdd = async () => {
    if (!onAddSongs || !addText.trim() || adding) return;
    setAdding(true);
    setAddNotice(await onAddSongs(addText));
    setAdding(false);
    setAddText("");
  };
  const [meta, setMeta] = useState<Record<string, SongMeta>>({});
  const queueRef = useRef<HTMLDivElement>(null);
  const queueIds = Array.isArray(queue)
    ? queue.map((q) => parsePlaylistInput(q).id).filter(Boolean)
    : [];

  // Fetch titles for the queue the first time the panel opens.
  useEffect(() => {
    if (!showQueue) return;
    let alive = true;
    queueIds
      .filter((id) => !meta[id])
      .forEach((id) =>
        lookupSong(id).then((m) => {
          if (alive) setMeta((prev) => ({ ...prev, [id]: m ?? { id, title: "Unavailable video", author: "—" } }));
        })
      );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQueue, queueIds.join(",")]);

  // Close on Esc or a click outside; bring the playing song into view on open.
  useEffect(() => {
    if (!showQueue) return;
    queueRef.current?.querySelector(".is-current")?.scrollIntoView({ block: "center" });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowQueue(false);
    const onDown = (e: PointerEvent) => {
      const root = queueRef.current?.closest(".pml-player");
      if (root && !root.contains(e.target as Node)) setShowQueue(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [showQueue]);

  const activeInput = Array.isArray(queue) ? queue[0] || "" : queue || "";
  const key = queueKey(queue);
  const isQueueLoaded =
    Boolean(queue) &&
    Boolean(playerState.playlistId) &&
    (playerState.playlistId === key || key.startsWith(`${playerState.playlistId},`));
  const parsedPlaylist = parsePlaylistInput(activeInput);
  const isSpotify = parsedPlaylist.provider === "spotify" && Boolean(parsedPlaylist.embedUrl);

  // If this queue is a Spotify playlist, show the native Spotify Player bar!
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

  // Only show the YouTube track's metadata when it belongs to this queue.
  // Title for the song now loading: YouTube's own data, else our oEmbed lookup, else the queue name.
  const [nowMeta, setNowMeta] = useState<SongMeta | null>(null);
  const nowId = isQueueLoaded ? playerState.currentVideoId : undefined;
  useEffect(() => {
    let alive = true;
    setNowMeta(null);
    if (nowId) lookupSong(nowId).then((m) => alive && setNowMeta(m));
    return () => {
      alive = false;
    };
  }, [nowId]);
  const displayTitle = (isQueueLoaded && (playerState.currentVideoTitle || nowMeta?.title)) || fallbackTitle;
  const playError = isQueueLoaded ? playerState.error : null;
  const displayArtist = playError || (isQueueLoaded && (playerState.currentArtist || nowMeta?.author)) || fallbackArtist;
  const blocked = playerState.blockedIds ?? [];
  const isPlaying = isQueueLoaded && playerState.isPlaying;

  const duration = isQueueLoaded && playerState.duration > 0 ? playerState.duration : 180;
  const currentTime = isQueueLoaded ? playerState.currentTime : 0;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isQueueLoaded || !progressTrackRef.current || duration <= 0) return;
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

  const coverId = isQueueLoaded ? playerState.currentVideoId : undefined;
  const volume = isMuted ? 0 : playerState.volume;

  return (
    <div
      className={`pml-player pml-player-v2 ${isPlaying ? "is-playing" : ""} ${mini ? "is-mini" : ""}`}
      role="region"
      aria-label="Audio player"
      style={{ "--pa": accent, "--pa2": accent2, "--prog": `${progressPercent}%` } as React.CSSProperties}
    >
      {/* vinyl record: the song's cover art is the label, and it spins while playing */}
      <div className="pml-vinyl-wrap" aria-hidden="true">
      <div className="pml-vinyl">
        <div
          className="pml-vinyl-label"
          style={
            coverId
              ? { backgroundImage: `url(https://i.ytimg.com/vi/${coverId}/mqdefault.jpg)` }
              : { background: `linear-gradient(135deg, ${accent}, ${accent2})` }
          }
        />
        <span className="pml-vinyl-hole" />
      </div>
      </div>

      <div className="pml-player-meta">
        <div className="pml-player-title" title={displayTitle}>
          {displayTitle}
        </div>
        <div className={`pml-player-artist ${playError ? "is-error" : ""}`} title={displayArtist}>
          <span className="pml-eq" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="pml-player-artist-name">{displayArtist}</span>
        </div>
      </div>

      <div className="pml-player-controls">
        <button aria-label="Previous track" onClick={provider.previous} className="pml-skip">
          <SkipBack size={16} strokeWidth={2} fill="currentColor" />
        </button>

        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          className="pml-player-play"
          onClick={() => {
            // Bug fix: this used to reload the queue on every Play, restarting at song 1 after a pause.
            if (!isQueueLoaded) {
              if (queue) provider.loadPlaylist(queue);
              return;
            }
            provider.togglePlay();
          }}
        >
          {isQueueLoaded && playerState.isBuffering ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={16} strokeWidth={2.4} fill="currentColor" />
          ) : (
            <Play size={16} strokeWidth={2.4} fill="currentColor" style={{ marginLeft: 2 }} />
          )}
        </button>

        <button aria-label="Next track" onClick={provider.next} className="pml-skip">
          <SkipForward size={16} strokeWidth={2} fill="currentColor" />
        </button>
      </div>

      <div className="pml-progress-wrap">
        <span className="pml-progress-time">{formatTime(currentTime)}</span>

        <div
          ref={progressTrackRef}
          className="pml-progress-track"
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
          <div className="pml-progress-fill" style={{ width: `${progressPercent}%` }}>
            <span className="pml-progress-knob" />
          </div>
        </div>

        <span className="pml-progress-time">{formatTime(duration)}</span>
      </div>

      {(queueIds.length > 1 || onAddSongs) && (
        <button
          className={`pml-queue-btn ${showQueue ? "active" : ""}`}
          onClick={() => setShowQueue((v) => !v)}
          aria-label="Show all songs"
          aria-expanded={showQueue}
          title="All songs"
        >
          <ListMusic size={17} />
        </button>
      )}

      {showQueue && (
        <div className="pml-queue" ref={queueRef} role="dialog" aria-label="All songs">
          <div className="pml-queue-head">
            <div>
              <span className="pml-queue-kicker">Side A · {queueIds.length} songs</span>
              <strong>{queueName || fallbackTitle}</strong>
            </div>
            <button onClick={() => setShowQueue(false)} aria-label="Close song list">
              <X size={15} />
            </button>
          </div>
          <ol className="pml-queue-list">
            {queueIds.map((id, i) => {
              const m = meta[id];
              const current = isQueueLoaded && playerState.currentVideoId === id;
              return (
                <li key={`${id}-${i}`} className={userSongIds.includes(id) ? "is-yours" : ""}>
                  <button
                    className={`pml-queue-row ${current ? "is-current" : ""}`}
                    style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                    onClick={() => {
                      provider.loadPlaylist(queueIds, "playlist", true, i);
                      setShowQueue(false);
                    }}
                    aria-current={current ? "true" : undefined}
                  >
                    <span className="pml-queue-idx">
                      {current && isPlaying ? (
                        <span className="pml-eq on" aria-hidden="true">
                          <i />
                          <i />
                          <i />
                          <i />
                        </span>
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    <span className="pml-queue-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" loading="lazy" />
                      <span className="pml-queue-play" aria-hidden="true">
                        <Play size={12} fill="currentColor" />
                      </span>
                    </span>
                    <span className="pml-queue-meta">
                      <span className={`pml-queue-title ${m ? "" : "is-loading"}`}>{m ? m.title : "Loading…"}</span>
                      <span className="pml-queue-author">{m?.author ?? " "}</span>
                    </span>
                    {current && <span className="pml-queue-now">Now playing</span>}
                    {blocked.includes(id) ? (
                      <span className="pml-queue-blocked" title="The uploader doesn't allow playback outside YouTube">
                        YouTube only
                      </span>
                    ) : (
                      !current && userSongIds.includes(id) && <span className="pml-queue-yours">yours</span>
                    )}
                  </button>
                  {onRemoveSong && userSongIds.includes(id) && (
                    <button
                      className="pml-queue-remove"
                      onClick={() => onRemoveSong(id)}
                      aria-label={`Remove ${m?.title ?? "song"}`}
                      title="Remove your song"
                    >
                      <X size={13} />
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          {onAddSongs && (
            <form
              className="pml-queue-add"
              onSubmit={(e) => {
                e.preventDefault();
                submitAdd();
              }}
            >
              <span className="pml-queue-add-label">
                <Link2 size={13} /> Add your song to {queueName || fallbackTitle}
              </span>
              <div className="pml-queue-add-row">
                <input
                  ref={addInputRef}
                  value={addText}
                  onChange={(e) => setAddText(e.target.value)}
                  placeholder="Paste YouTube links — one or many"
                  aria-label="YouTube song links"
                />
                <button type="submit" disabled={adding || !addText.trim()}>
                  <Plus size={14} /> {adding ? "Adding…" : "Add"}
                </button>
              </div>
              {addNotice && <span className="pml-queue-add-notice" aria-live="polite">{addNotice}</span>}
            </form>
          )}
        </div>
      )}

      <div className="pml-vol">
        <button onClick={handleVolumeToggle} aria-label={isMuted ? "Unmute" : "Mute"}>
          {isMuted || playerState.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => {
            const val = Number(e.target.value);
            provider.setVolume(val);
            if (val > 0 && isMuted) setIsMuted(false);
          }}
          className="pml-vol-range"
          style={{ "--vol": `${volume}%` } as React.CSSProperties}
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
