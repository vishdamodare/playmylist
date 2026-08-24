"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PlayerState, MusicProvider } from "@/types/player";

let isScriptLoading = false;
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

  const playerRef = useRef<YT.Player | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPlaylistRef = useRef<{ id: string; type?: "playlist" | "video"; autoplay: boolean } | null>(null);

  const startProgressPolling = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const currentTime = playerRef.current.getCurrentTime() || 0;
        const duration = playerRef.current.getDuration() || 0;
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
        // Player might be re-initializing or destroyed
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
      const duration = playerRef.current.getDuration() || 0;
      const currentTime = playerRef.current.getCurrentTime() || 0;

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

  // Initialize YT Player
  useEffect(() => {
    let isCancelled = false;

    loadYouTubeIframeApi(() => {
      if (isCancelled) return;
      if (!window.YT || !window.YT.Player) return;

      const container = document.getElementById(containerId);
      if (!container) return;

      try {
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }

        playerRef.current = new window.YT.Player(containerId, {
          height: "100%",
          width: "100%",
          playerVars: {
            autoplay: 0,
            controls: 1,
            enablejsapi: 1,
            origin: typeof window !== "undefined" ? window.location.origin : undefined,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: (event: YT.PlayerEvent) => {
              if (isCancelled) return;
              try {
                event.target.setVolume(80);
              } catch {
                // Ignore
              }

              setPlayerState((prev) => ({
                ...prev,
                isReady: true,
                error: null,
              }));

              // Process pending playlist if any
              if (pendingPlaylistRef.current) {
                const { id, type, autoplay } = pendingPlaylistRef.current;
                pendingPlaylistRef.current = null;
                handleLoadPlaylist(id, type, autoplay);
              }
            },
            onStateChange: (event: YT.OnStateChangeEvent) => {
              if (isCancelled) return;
              const state = event.data;

              if (state === window.YT?.PlayerState.PLAYING) {
                setPlayerState((prev) => ({
                  ...prev,
                  isPlaying: true,
                  isBuffering: false,
                  error: null,
                }));
                updateTrackInfo();
                startProgressPolling();
              } else if (state === window.YT?.PlayerState.PAUSED) {
                setPlayerState((prev) => ({
                  ...prev,
                  isPlaying: false,
                  isBuffering: false,
                }));
                stopProgressPolling();
                updateTrackInfo();
              } else if (state === window.YT?.PlayerState.BUFFERING) {
                setPlayerState((prev) => ({
                  ...prev,
                  isBuffering: true,
                }));
              } else if (
                state === window.YT?.PlayerState.ENDED ||
                state === window.YT?.PlayerState.UNSTARTED
              ) {
                setPlayerState((prev) => ({
                  ...prev,
                  isPlaying: false,
                  isBuffering: false,
                }));
                stopProgressPolling();
                updateTrackInfo();
              } else if (state === window.YT?.PlayerState.CUED) {
                setPlayerState((prev) => ({
                  ...prev,
                  isBuffering: false,
                }));
                updateTrackInfo();
              }
            },
            onError: (event: YT.OnErrorEvent) => {
              if (isCancelled) return;
              const code = event.data;
              let msg = "Playback encountered an issue.";
              if (code === 2) msg = "Invalid playlist parameter.";
              else if (code === 5) msg = "HTML5 player error.";
              else if (code === 100) msg = "Playlist or video not found.";
              else if (code === 101 || code === 150)
                msg = "Embedded playback restricted for this video.";

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
    });

    return () => {
      isCancelled = true;
      stopProgressPolling();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore
        }
        playerRef.current = null;
      }
    };
  }, [containerId, startProgressPolling, stopProgressPolling, updateTrackInfo]);

  const handleLoadPlaylist = useCallback(
    (id: string, type: "playlist" | "video" = "playlist", autoplay: boolean = true) => {
      setPlayerState((prev) => ({
        ...prev,
        playlistId: id,
        currentTime: 0,
        error: null,
      }));

      // Check if this is a placeholder ID
      if (id.startsWith("REPLACE_WITH_")) {
        setPlayerState((prev) => ({
          ...prev,
          isPlaying: false,
          isBuffering: false,
          error: "Placeholder playlist ID configured. Add your YouTube playlist ID in moodPlaylists.ts to stream.",
        }));
        return;
      }

      const player = playerRef.current as any;
      if (!player || (!player.loadPlaylist && !player.loadVideoById)) {
        pendingPlaylistRef.current = { id, type, autoplay };
        return;
      }

      try {
        if (type === "video") {
          if (autoplay && player.loadVideoById) {
            player.loadVideoById({
              videoId: id,
              startSeconds: 0,
            });
          } else if (player.cueVideoById) {
            player.cueVideoById({
              videoId: id,
              startSeconds: 0,
            });
          }
        } else {
          if (autoplay && player.loadPlaylist) {
            player.loadPlaylist({
              list: id,
              listType: "playlist",
              index: 0,
              startSeconds: 0,
            });
          } else if (player.cuePlaylist) {
            player.cuePlaylist({
              list: id,
              listType: "playlist",
              index: 0,
              startSeconds: 0,
            });
          }
        }
      } catch (err) {
        console.error("Error loading media:", err);
        setPlayerState((prev) => ({
          ...prev,
          error: "Unable to load YouTube audio.",
        }));
      }
    },
    []
  );

  const play = useCallback(() => {
    if (!playerRef.current?.playVideo) return;
    try {
      playerRef.current.playVideo();
    } catch {
      // Ignore
    }
  }, []);

  const pause = useCallback(() => {
    if (!playerRef.current?.pauseVideo) return;
    try {
      playerRef.current.pauseVideo();
    } catch {
      // Ignore
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (playerState.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [playerState.isPlaying, pause, play]);

  const next = useCallback(() => {
    if (!playerRef.current?.nextVideo) return;
    try {
      playerRef.current.nextVideo();
    } catch {
      // Ignore
    }
  }, []);

  const previous = useCallback(() => {
    if (!playerRef.current?.previousVideo) return;
    try {
      playerRef.current.previousVideo();
    } catch {
      // Ignore
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    if (!playerRef.current?.seekTo) return;
    try {
      playerRef.current.seekTo(seconds, true);
      setPlayerState((prev) => ({ ...prev, currentTime: seconds }));
    } catch {
      // Ignore
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(100, vol));
    if (playerRef.current?.setVolume) {
      try {
        playerRef.current.setVolume(clamped);
      } catch {
        // Ignore
      }
    }
    setPlayerState((prev) => ({ ...prev, volume: clamped }));
  }, []);

  const provider: MusicProvider = {
    play,
    pause,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    loadPlaylist: handleLoadPlaylist,
  };

  return {
    playerState,
    provider,
  };
}
