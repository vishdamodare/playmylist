"use client";

import { loadYouTubeIframeApi } from "@/hooks/useYouTubePlayer";
import { extractListId, extractVideoId } from "@/lib/playlistHelper";
import { lookupSong, SongMeta } from "@/lib/youtubeMeta";

const cache = new Map<string, Promise<string[]>>();

/**
 * A YouTube playlist / album / mix → its video IDs (YouTube caps this at 200; mixes give ~50).
 * Uses a hidden, muted player of its own, so whatever is playing keeps playing. No API key needed.
 * Resolves [] when the list is private, deleted or doesn't load in time.
 */
export function playlistVideoIds(listId: string): Promise<string[]> {
  let hit = cache.get(listId);
  if (!hit) {
    hit = new Promise<string[]>((resolve) => {
      loadYouTubeIframeApi(() => {
        const host = document.createElement("div");
        host.id = `pml-list-${Math.random().toString(36).slice(2)}`;
        host.style.cssText = "position:fixed;width:1px;height:1px;left:-9999px;top:0;opacity:0;pointer-events:none";
        document.body.appendChild(host);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let player: any = null;
        let done = false;
        const read = (): string[] => {
          try {
            return player?.getPlaylist?.() ?? [];
          } catch {
            return [];
          }
        };
        const finish = (ids: string[]) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          try {
            player?.destroy();
          } catch {}
          host.remove();
          resolve(ids);
        };
        // ponytail: private/unknown lists fire no event at all, so a timeout is the only "not found" signal
        const timer = setTimeout(() => finish(read()), 12000);
        player = new window.YT.Player(host.id, {
          height: "1",
          width: "1",
          playerVars: { autoplay: 0, controls: 0, playsinline: 1 },
          events: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onReady: (e: any) => {
              e.target.mute?.();
              e.target.cuePlaylist({ list: listId, listType: "playlist", index: 0 });
            },
            onStateChange: () => {
              const ids = read();
              if (ids.length) finish(ids);
            },
            onError: () => finish(read()),
          },
        });
      });
    }).then((ids) => {
      if (!ids.length) cache.delete(listId); // let a later try succeed (e.g. after it's made public)
      return ids;
    });
    cache.set(listId, hit);
  }
  return hit;
}

export interface CollectedSongs {
  /** new songs with titles, in the order pasted */
  songs: SongMeta[];
  /** already in the caller's list (or pasted twice) */
  dupes: number;
  /** YouTube says these don't exist / are private */
  missing: number;
  /** tokens that weren't a YouTube song or playlist link */
  bad: number;
  /** playlist links that were read */
  lists: number;
  /** playlist links that couldn't be opened (private / deleted) */
  failedLists: number;
}

/**
 * Whatever a listener pasted → new songs with titles. Accepts song links, bare IDs and whole
 * playlist / album / mix links (each expanded to its songs). `existing` ids are skipped before any lookup.
 */
export async function collectSongs(text: string, existing: Iterable<string> = []): Promise<CollectedSongs> {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  let bad = 0;
  let lists = 0;
  let failedLists = 0;
  const ids: string[] = [];
  for (const tok of tokens) {
    const list = extractListId(tok);
    if (list) {
      const got = await playlistVideoIds(list);
      if (got.length) lists++;
      else failedLists++;
      ids.push(...got);
      continue;
    }
    const id = extractVideoId(tok);
    if (id) ids.push(id);
    else bad++;
  }
  const have = new Set(existing);
  const fresh = Array.from(new Set(ids)).filter((id) => !have.has(id));
  const looked = await Promise.all(fresh.map(lookupSong));
  const songs = looked.filter((s): s is SongMeta => s !== null);
  return { songs, dupes: ids.length - fresh.length, missing: looked.length - songs.length, bad, lists, failedLists };
}

/** "Added 12 songs from a playlist ✓ · 2 already here · …" */
export function describeAdd(c: CollectedSongs, here = "already here"): string {
  const n = c.songs.length;
  const parts: string[] = [];
  const from = c.lists ? ` from ${c.lists === 1 ? "the playlist" : `${c.lists} playlists`}` : "";
  if (n) parts.push(`Added ${n} song${n === 1 ? "" : "s"}${from} ✓`);
  if (c.dupes) parts.push(`${c.dupes} ${here}`);
  if (c.missing) parts.push(`${c.missing} unavailable on YouTube`);
  if (c.failedLists) parts.push(`${c.failedLists === 1 ? "That playlist" : `${c.failedLists} playlists`} couldn't be opened — is it public?`);
  if (c.bad) parts.push(`${c.bad} not a YouTube link`);
  return parts.join(" · ") || "Nothing to add";
}
