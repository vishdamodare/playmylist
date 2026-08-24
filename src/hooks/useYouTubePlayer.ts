"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PlayerState, MusicProvider } from "@/types/player";
import { parsePlaylistInput } from "@/lib/playlistHelper";

let isScriptLoading = false;
let isScriptReady = false;
const readyCallbacks: Array<() => void> = [];

function loadYouTubeIframeApi(onReady: () => void) {
  if (typeof window === "undefined") return;

  if (window.YT && window.YT.Player) {
    onReady();
    return;
  }

  readyCallbacks.push(onReady);

  if (isScriptLoading) return;
  isScriptLoading = true;

  const existingTag = document.querySelector('script[src*="youtube.com/iframe_api"]');
  if (!existingTag) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
  }

  const prevHandler = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    isScriptReady = true;
    if (typeof prevHandler === "function") prevHandler();
    while (readyCallbacks.length > 0) {
      const cb = readyCallbacks.shift();
      cb?.();
    }
  };
}

export function useYouTubePlayer(containerId: string = "youtube-player-element") {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isReady: false,
    isPlaying: false,
    isBuffering: false,
    currentTime: 0,
    duration: 0,
    currentVideoId: undefined,
    currentVideoTitle: undefined,
    currentArtist: undefined,
    playlistId: undefined,
    volume: 80,
    error: null,
  });

  const playerRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMediaRef = useRef<{ id: string; type: "playlist" | "video"; autoplay: boolean } | null>(null);

  const startProgressPolling = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const currentTime = playerRef.current.getCurrentTime?.() || 0;
        const duration = playerRef.current.getDuration?.() || 0;
        const videoData = playerRef.current.getVideoData?.() || {};

        setPlayerState((prev) => ({
          ...prev,
          currentTime,
          duration: duration > 0 ? duration : prev.duration,
          currentVideoId: videoData.video_id || prev.currentVideoId,
          currentVideoTitle: videoData.title || prev.currentVideoTitle,
          currentArtist: videoData.author || prev.currentArtist,
        }));
      } catch {
        // Player might be updating
      }
    }, 250);
  }, []);

  const stopProgressPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updateTrackInfo = useCallback(() => {
    if (!playerRef.current) return;
    try {
      const videoData = playerRef.current.getVideoData?.() || {};
      const duration = playerRef.current.getDuration?.() || 0;
      const currentTime = playerRef.current.getCurrentTime?.() || 0;

      setPlayerState((prev) => ({
        ...prev,
        currentVideoId: videoData.video_id || prev.currentVideoId,
        currentVideoTitle: videoData.title || prev.currentVideoTitle,
        currentArtist: videoData.author || prev.currentArtist,
        duration: duration > 0 ? duration : prev.duration,
        currentTime,
      }));
    } catch {
      // Ignored
    }
  }, []);

  const executeLoad = useCallback((id: string, type: "playlist" | "video" = "playlist", autoplay: boolean = true) => {
    const player = playerRef.current;
    if (!player) return;

    try {
      player.unMute?.();
      player.setVolume?.(80);

      if (type === "video") {
        if (autoplay && player.loadVideoById) {
          player.loadVideoById({ videoId: id, startSeconds: 0 });
        } else if (player.cueVideoById) {
          player.cueVideoById({ videoId: id, startSeconds: 0 });
        }
      } else {
        // Load native YouTube playlist in full without limitations
        if (autoplay && player.loadPlaylist) {
          player.loadPlaylist({ list: id, listType: "playlist", index: 0, startSeconds: 0 });
        } else if (player.cuePlaylist) {
          player.cuePlaylist({ list: id, listType: "playlist", index: 0, startSeconds: 0 });
        }
      }

      if (autoplay) {
        setTimeout(() => {
          try {
            player.playVideo?.();
          } catch {}
        }, 100);
      }
    } catch (e) {
      console.error("Error executing YouTube load:", e);
    }
  }, []);

  const next = useCallback(() => {
    if (!playerRef.current?.nextVideo) return;
    try {
      playerRef.current.nextVideo();
    } catch (err) {
      console.error("Error moving to next video:", err);
    }
  }, []);

  const previous = useCallback(() => {
    if (!playerRef.current?.previousVideo) return;
    try {
      playerRef.current.previousVideo();
    } catch (err) {
      console.error("Error moving to previous video:", err);
    }
  }, []);

  // Initialize YT Player
  useEffect(() => {
    let isCancelled = false;

    const initPlayer = () => {
      if (isCancelled) return;
      if (!window.YT || !window.YT.Player) return;

      const container = document.getElementById(containerId);
      if (!container) return;

      if (playerRef.current && playerRef.current.getPlayerState) {
        setPlayerState((prev) => ({ ...prev, isReady: true }));
        return;
      }

      try {
        playerRef.current = new window.YT.Player(containerId, {
          height: "100%",
          width: "100%",
          playerVars: {
            autoplay: 1,
            controls: 0,
            enablejsapi: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: (event: any) => {
              if (isCancelled) return;
              try {
                event.target.unMute();
                event.target.setVolume(80);
              } catch {}

              setPlayerState((prev) => ({
                ...prev,
                isReady: true,
                error: null,
              }));

              if (pendingMediaRef.current) {
                const { id, type, autoplay } = pendingMediaRef.current;
                pendingMediaRef.current = null;
                executeLoad(id, type, autoplay);
              }
            },
            onStateChange: (event: any) => {
              if (isCancelled) return;
              const state = event.data;

              // 1 = Playing, 2 = Paused, 3 = Buffering, 0 = Ended, 5 = Cued
              if (state === 1) {
                setPlayerState((prev) => ({
                  ...prev,
                  isPlaying: true,
                  isBuffering: false,
                  error: null,
                }));
                updateTrackInfo();
                startProgressPolling();
              } else if (state === 2) {
                setPlayerState((prev) => ({
                  ...prev,
                  isPlaying: false,
                  isBuffering: false,
                }));
                stopProgressPolling();
                updateTrackInfo();
              } else if (state === 3) {
                setPlayerState((prev) => ({
                  ...prev,
                  isBuffering: true,
                }));
              } else if (state === 0) {
                // When a song in a YouTube playlist ends, YouTube automatically loads and plays the next song
                updateTrackInfo();
              } else if (state === -1) {
                setPlayerState((prev) => ({
                  ...prev,
                  isBuffering: false,
                }));
              } else if (state === 5) {
                setPlayerState((prev) => ({
                  ...prev,
                  isBuffering: false,
                }));
                updateTrackInfo();
              }
            },
            onError: (event: any) => {
              if (isCancelled) return;
              const code = event.data;
              let msg = "Playback encountered an issue.";
              if (code === 2) msg = "Invalid playlist parameter.";
              else if (code === 5) msg = "HTML5 player error.";
              else if (code === 100) msg = "Playlist not found.";
              else if (code === 101 || code === 150)
                msg = "Playback restricted on this track. Skipping...";

              // Auto skip restricted track in playlist
              if (code === 101 || code === 150) {
                try {
                  playerRef.current?.nextVideo?.();
                } catch {}
              }

              setPlayerState((prev) => ({
                ...prev,
                isPlaying: false,
                isBuffering: false,
                error: msg,
              }));
              stopProgressPolling();
            },
          },
        });
      } catch (err) {
        console.error("Failed to initialize YouTube player:", err);
      }
    };

    loadYouTubeIframeApi(initPlayer);

    return () => {
      isCancelled = true;
      stopProgressPolling();
    };
  }, [containerId, executeLoad, startProgressPolling, stopProgressPolling, updateTrackInfo]);

  const loadPlaylist = useCallback(
    (input: string | string[], defaultType: "playlist" | "video" = "playlist", autoplay: boolean = true) => {
      const rawId = Array.isArray(input) ? input[0] : input;
      if (!rawId || rawId.startsWith("REPLACE_WITH_")) return;

      const parsed = parsePlaylistInput(rawId);
      if (parsed.provider !== "youtube" || !parsed.id) return;

      const playlistId = parsed.id;
      const type = parsed.type || defaultType;

      setPlayerState((prev) => ({
        ...prev,
        playlistId,
        currentTime: 0,
        error: null,
      }));

      if (!playerRef.current || !playerRef.current.getPlayerState) {
        pendingMediaRef.current = { id: playlistId, type, autoplay };
        return;
      }

      executeLoad(playlistId, type, autoplay);
    },
    [executeLoad]
  );

  const play = useCallback(() => {
    if (!playerRef.current?.playVideo) {
      if (pendingMediaRef.current) {
        const { id, type } = pendingMediaRef.current;
        executeLoad(id, type, true);
      }
      return;
    }
    try {
      playerRef.current.unMute?.();
      playerRef.current.playVideo();
    } catch {}
  }, [executeLoad]);

  const pause = useCallback(() => {
    if (!playerRef.current?.pauseVideo) return;
    try {
      playerRef.current.pauseVideo();
    } catch {}
  }, []);

  const togglePlay = useCallback(() => {
    if (playerState.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [playerState.isPlaying, pause, play]);

  const seek = useCallback((seconds: number) => {
    if (!playerRef.current?.seekTo) return;
    try {
      playerRef.current.seekTo(seconds, true);
      setPlayerState((prev) => ({ ...prev, currentTime: seconds }));
    } catch {}
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!playerRef.current?.setVolume) return;
    try {
      playerRef.current.setVolume(volume);
      if (volume > 0) playerRef.current.unMute?.();
      setPlayerState((prev) => ({ ...prev, volume }));
    } catch {}
  }, []);

  return {
    playerState,
    provider: {
      play,
      pause,
      togglePlay,
      next,
      previous,
      seek,
      setVolume,
      loadPlaylist,
    },
  };
}
