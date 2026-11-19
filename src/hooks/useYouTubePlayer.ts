"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PlayerState, MusicProvider } from "@/types/player";
import { parsePlaylistInput, queueVideoIds } from "@/lib/playlistHelper";

let isScriptLoading = false;
let isScriptReady = false;
const readyCallbacks: Array<() => void> = [];

export function loadYouTubeIframeApi(onReady: () => void) {
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

/** Merge YouTube's current video data into state. A different video never inherits the old title/length. */
function mergeVideo(prev: PlayerState, videoData: any, duration: number, currentTime: number): PlayerState {
  const id = videoData.video_id || prev.currentVideoId;
  const same = id === prev.currentVideoId;
  return {
    ...prev,
    currentVideoId: id,
    currentVideoTitle: videoData.title || (same ? prev.currentVideoTitle : undefined),
    currentArtist: videoData.author || (same ? prev.currentArtist : undefined),
    duration: duration > 0 ? duration : same ? prev.duration : 0,
    currentTime,
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
  // The song we just asked for. Until YouTube actually switches to it, getVideoData() still describes
  // the old song — ignore those reports so the old title/time don't flash back (or stick, if it never loads).
  // Safety valves: YouTube sometimes plays a song under a different ID (re-upload / regional alternative),
  // so the wait also ends after 3s and as soon as the player reports PLAYING — otherwise every progress
  // update for that song was thrown away (stuck at 0:00 with a placeholder length).
  const expectedIdRef = useRef<string | null>(null);
  const expectedAtRef = useRef(0);
  const isStale = (videoId?: string) => {
    if (!expectedIdRef.current) return false;
    if (videoId === expectedIdRef.current || Date.now() - expectedAtRef.current > 3000) {
      expectedIdRef.current = null;
      return false;
    }
    return true;
  };
  const pendingMediaRef = useRef<{
    id: string | string[];
    type: "playlist" | "video";
    autoplay: boolean;
    index: number;
  } | null>(null);

  // YouTube answers error 2 ("invalid parameter") when a new list is loaded while the previous one is still
  // loading, or when playVideo() lands mid-load. So loads go one at a time: while one is in flight the newest
  // request waits, and runs as soon as the player settles (or after a few seconds, if it never does).
  type Load = { id: string | string[]; type: "playlist" | "video"; autoplay: boolean; index: number };
  const inFlightRef = useRef(false);
  const waitingRef = useRef<Load | null>(null);
  const lastLoadRef = useRef<Load | null>(null);
  const retriedRef = useRef(false);
  const settleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const settleRef = useRef<() => void>(() => {});

  // Our own queue: songs load one at a time with loadVideoById, which starts about twice as fast as handing
  // YouTube the whole list (and has no 200-song cap, no silently dropped IDs). null = a YouTube playlist link.
  const queueRef = useRef<string[] | null>(null);
  const posRef = useRef(0);
  const playAtRef = useRef<(i: number) => boolean>(() => false);

  const startProgressPolling = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const currentTime = playerRef.current.getCurrentTime?.() || 0;
        const duration = playerRef.current.getDuration?.() || 0;
        const videoData = playerRef.current.getVideoData?.() || {};

        if (isStale(videoData.video_id)) return;
        // Only re-render when something visible changed (the shown second, the song, its length).
        // Updating 4×/s re-rendered every page — the main source of lag.
        setPlayerState((prev) => {
          const next = mergeVideo(prev, videoData, duration, currentTime);
          const same =
            Math.floor(next.currentTime) === Math.floor(prev.currentTime) &&
            next.currentVideoId === prev.currentVideoId &&
            next.currentVideoTitle === prev.currentVideoTitle &&
            next.currentArtist === prev.currentArtist &&
            Math.round(next.duration) === Math.round(prev.duration);
          return same ? prev : next;
        });
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

      if (isStale(videoData.video_id)) return;
      setPlayerState((prev) => mergeVideo(prev, videoData, duration, currentTime));
    } catch {
      // Ignored
    }
  }, []);

  const executeLoad = useCallback(
    (
      idOrList: string | string[],
      type: "playlist" | "video" = "playlist",
      autoplay: boolean = true,
      index: number = 0
    ) => {
      const player = playerRef.current;
      if (!player) return;

      if (inFlightRef.current) {
        waitingRef.current = { id: idOrList, type, autoplay, index }; // only the newest request matters
        return;
      }
      inFlightRef.current = true;
      lastLoadRef.current = { id: idOrList, type, autoplay, index };
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(() => settleRef.current(), 4000);

      try {
        player.unMute?.();

        if (Array.isArray(idOrList)) {
          // Native YouTube playlist from an array of video IDs
          if (autoplay && player.loadPlaylist) {
            player.loadPlaylist(idOrList, index, 0);
          } else if (player.cuePlaylist) {
            player.cuePlaylist(idOrList, index, 0);
          }
        } else if (type === "video") {
          if (autoplay && player.loadVideoById) {
            player.loadVideoById({ videoId: idOrList, startSeconds: 0 });
          } else if (player.cueVideoById) {
            player.cueVideoById({ videoId: idOrList, startSeconds: 0 });
          }
        } else {
          // Single native playlist ID (PL...)
          if (autoplay && player.loadPlaylist) {
            try {
              player.loadPlaylist({ list: idOrList, listType: "playlist", index: 0, startSeconds: 0 });
            } catch {
              try {
                player.loadPlaylist(idOrList, 0, 0);
              } catch {}
            }
          } else if (player.cuePlaylist) {
            try {
              player.cuePlaylist({ list: idOrList, listType: "playlist", index: 0, startSeconds: 0 });
            } catch {
              try {
                player.cuePlaylist(idOrList, 0, 0);
              } catch {}
            }
          }
        }

        // loadPlaylist/loadVideoById already start playback. Only nudge if nothing started (some mobile
        // browsers), and never mid-load: an early playVideo() is itself an error-2 trigger.
        if (autoplay) {
          setTimeout(() => {
            try {
              const st = player.getPlayerState?.();
              if (st === -1 || st === 5) player.playVideo?.();
            } catch {}
          }, 1500);
        }
      } catch (e) {
        console.error("Error executing YouTube load:", e);
        settleRef.current();
      }
    },
    []
  );

  settleRef.current = () => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = null;
    inFlightRef.current = false;
    const next = waitingRef.current;
    waitingRef.current = null;
    if (next) executeLoad(next.id, next.type, next.autoplay, next.index);
  };

  /** Show the song we're switching to right away (title fills in from the lookup cache), before YouTube catches up. */
  const announce = useCallback((videoId: string | undefined) => {
    if (!videoId) return;
    expectedIdRef.current = videoId;
    expectedAtRef.current = Date.now();
    setPlayerState((prev) =>
      prev.currentVideoId === videoId
        ? prev
        : { ...prev, currentVideoId: videoId, currentVideoTitle: undefined, currentArtist: undefined, duration: 0, currentTime: 0, error: null, isBuffering: true }
    );
  }, []);

  /** Play song `i` of our own queue. false = there is no such song. */
  const playAt = useCallback(
    (i: number, autoplay: boolean = true) => {
      const q = queueRef.current;
      if (!q || i < 0 || i >= q.length) return false;
      posRef.current = i;
      announce(q[i]);
      if (!playerRef.current?.getPlayerState) {
        pendingMediaRef.current = { id: q[i], type: "video", autoplay, index: 0 };
        return true;
      }
      executeLoad(q[i], "video", autoplay);
      return true;
    },
    [announce, executeLoad]
  );
  playAtRef.current = playAt;

  const step = useCallback(
    (dir: 1 | -1) => {
      if (queueRef.current) {
        playAt(posRef.current + dir);
        return;
      }
      const pl = playerRef.current;
      if (!pl?.nextVideo) return;
      try {
        const list: string[] = pl.getPlaylist?.() ?? [];
        const idx: number = pl.getPlaylistIndex?.() ?? -1;
        const target = idx >= 0 ? idx + dir : -1;
        if (target >= 0 && target < list.length) announce(list[target]);
        if (dir === 1) pl.nextVideo();
        else pl.previousVideo();
      } catch (err) {
        console.error("Error changing song:", err);
      }
    },
    [announce, playAt]
  );
  const next = useCallback(() => step(1), [step]);
  const previous = useCallback(() => step(-1), [step]);

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
                const { id, type, autoplay, index } = pendingMediaRef.current;
                pendingMediaRef.current = null;
                executeLoad(id, type, autoplay, index);
              }
            },
            onStateChange: (event: any) => {
              if (isCancelled) return;
              const state = event.data;
              if (state === 1 || state === 2 || state === 5 || state === 0) settleRef.current();
              if (state === 1) retriedRef.current = false;

              // 1 = Playing, 2 = Paused, 3 = Buffering, 0 = Ended, 5 = Cued
              if (state === 1) {
                expectedIdRef.current = null; // it's playing: whatever YouTube reports now is the real song
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
                // Song ended: our queue moves on itself (a YouTube playlist link advances on its own)
                if (queueRef.current) playAtRef.current(posRef.current + 1);
                else updateTrackInfo();
              } else if (state === -1) {
                setPlayerState((prev) => ({
                  ...prev,
                  isBuffering: expectedIdRef.current ? prev.isBuffering : false, // keep the spinner while our pick loads
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
              settleRef.current();

              // Error 2 is almost always a load that raced another one: retry the same load once, quietly.
              if (code === 2 && !retriedRef.current && lastLoadRef.current) {
                retriedRef.current = true;
                const last = lastLoadRef.current;
                setTimeout(() => executeLoad(last.id, last.type, last.autoplay, last.index), 400);
                return;
              }

              const pl = playerRef.current;
              const q = queueRef.current;
              const idx = q ? posRef.current : (pl?.getPlaylistIndex?.() ?? -1);
              const len = q ? q.length : (pl?.getPlaylist?.()?.length ?? 0);
              const hasNext = idx >= 0 && idx < len - 1;
              let msg = "Couldn't play this song";
              if (code === 101 || code === 150) msg = "Can't play outside YouTube"; // uploader blocks embedding (VEVO / labels)
              else if (code === 100) msg = "This song was removed from YouTube";
              else if (code === 5) msg = "Your browser couldn't play this song";
              // One bad song shouldn't stop the music: skip ahead when there's a next one.
              const blockedId: string | undefined = (q ? q[posRef.current] : pl?.getVideoData?.()?.video_id) || undefined;
              if (hasNext) {
                msg += " — skipping";
                if (q) setTimeout(() => playAtRef.current(posRef.current + 1), 0);
                else
                  try {
                    pl.nextVideo();
                  } catch {}
              }

              setPlayerState((prev) => ({
                ...prev,
                isPlaying: false,
                isBuffering: hasNext,
                error: msg,
                blockedIds:
                  blockedId && !(prev.blockedIds ?? []).includes(blockedId)
                    ? [...(prev.blockedIds ?? []), blockedId]
                    : prev.blockedIds,
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
    (
      input: string | string[],
      defaultType: "playlist" | "video" = "playlist",
      autoplay: boolean = true,
      startIndex: number = 0
    ) => {
      if (Array.isArray(input)) {
        const videoIds = queueVideoIds(input);

        if (videoIds.length === 0) return;
        const index = Math.min(Math.max(0, startIndex), videoIds.length - 1);
        const key = videoIds.join(",");

        queueRef.current = videoIds;
        retriedRef.current = false;
        setPlayerState((prev) => (prev.playlistId === key ? prev : { ...prev, playlistId: key }));
        playAt(index, autoplay);
        return;
      }

      if (!input || input.startsWith("REPLACE_WITH_")) return;

      const parsed = parsePlaylistInput(input);
      if (parsed.provider !== "youtube" || !parsed.id) return;

      const playlistId = parsed.id;
      const type = parsed.type || defaultType;
      queueRef.current = null;

      setPlayerState((prev) => ({
        ...prev,
        playlistId,
        currentTime: 0,
        error: null,
      }));

      if (!playerRef.current || !playerRef.current.getPlayerState) {
        pendingMediaRef.current = { id: playlistId, type, autoplay, index: 0 };
        return;
      }

      executeLoad(playlistId, type, autoplay);
    },
    [executeLoad, playAt]
  );

  const play = useCallback(() => {
    if (!playerRef.current?.playVideo) {
      if (pendingMediaRef.current) {
        const { id, type, index } = pendingMediaRef.current;
        executeLoad(id, type, true, index);
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
