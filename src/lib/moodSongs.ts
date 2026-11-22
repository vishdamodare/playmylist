import { moodPlaylists } from "@/data/moodPlaylists";
import { queueVideoIds } from "@/lib/playlistHelper";
import type { SongMeta } from "@/lib/youtubeMeta";
import { api } from "@/lib/api";

// Songs a listener added to a mood. Same key prefix as lib/storage's private keys.
const key = (slug: string) => `pml_private:mood_songs:${slug}`;

export function getExtraSongs(slug: string): SongMeta[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(key(slug)) || "[]");
  } catch {
    return [];
  }
}

export function setExtraSongs(slug: string, songs: SongMeta[]): void {
  try {
    window.localStorage.setItem(key(slug), JSON.stringify(songs));
  } catch {
    // storage full / blocked: the songs still play this session
  }
  sync(slug, songs);
}

/** Push a mood's list; drop any song an admin removed from this browser's copy too. */
function sync(slug: string, songs: SongMeta[]): void {
  api
    .syncSongs(slug, songs)
    .then((removed) => {
      if (!removed.length) return;
      const keep = getExtraSongs(slug).filter((s) => !removed.includes(s.id));
      window.localStorage.setItem(key(slug), JSON.stringify(keep));
    })
    .catch(() => {}); // best effort; offline keeps the browser copy
}

/** Once per visit: push every saved list, so songs added before the server kept them show up too. */
export function syncAllSongs(): void {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? "";
      if (k.startsWith("pml_private:mood_songs:")) {
        const songs = JSON.parse(localStorage.getItem(k) || "[]");
        if (songs.length) sync(k.slice("pml_private:mood_songs:".length), songs);
      }
    }
    const mine = JSON.parse(localStorage.getItem("pml_private:my_playlist") || "null");
    if (mine?.songs?.length)
      api
        .syncSongs("my-playlist", mine.songs)
        .then((removed) => {
          if (!removed.length) return;
          const cur = JSON.parse(localStorage.getItem("pml_private:my_playlist") || "null");
          if (cur?.songs) localStorage.setItem("pml_private:my_playlist", JSON.stringify({ ...cur, songs: cur.songs.filter((s: SongMeta) => !removed.includes(s.id)) }));
        })
        .catch(() => {});
  } catch {
    // storage blocked or corrupt: nothing to sync
  }
}

/** The mood's built-in song IDs followed by the listener's own additions. */
export function moodQueue(slug: string): string[] {
  const base = moodPlaylists[slug]?.playlistId;
  // validated + de-duplicated: an old or hand-edited saved song can't break the whole queue
  return queueVideoIds([...(Array.isArray(base) ? base : base ? [base] : []), ...getExtraSongs(slug).map((s) => s.id)]);
}

/** Fisher–Yates copy, so every mood visit starts in a fresh random order. */
export function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
