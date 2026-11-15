import { moodPlaylists } from "@/data/moodPlaylists";
import { parsePlaylistInput } from "@/lib/playlistHelper";
import type { SongMeta } from "@/lib/youtubeMeta";

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
}

/** The mood's built-in song IDs followed by the listener's own additions. */
export function moodQueue(slug: string): string[] {
  const base = moodPlaylists[slug]?.playlistId;
  const ids = (Array.isArray(base) ? base : base ? [base] : []).map((x) => parsePlaylistInput(x).id).filter(Boolean);
  return [...ids, ...getExtraSongs(slug).map((s) => s.id)];
}
