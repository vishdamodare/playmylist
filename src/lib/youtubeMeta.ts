export interface SongMeta {
  id: string;
  title: string;
  author: string;
}

// One request per video per page load, shared by My Playlist and the player's queue.
const cache = new Map<string, Promise<SongMeta | null>>();

/** null = YouTube says the video doesn't exist / is private. Network failures resolve to a placeholder. */
export function lookupSong(id: string): Promise<SongMeta | null> {
  let hit = cache.get(id);
  if (!hit) {
    hit = (async () => {
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`
        );
        if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) return null;
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        return { id, title: data.title || "Untitled", author: data.author_name || "YouTube" };
      } catch {
        cache.delete(id); // let a later open retry
        return { id, title: "YouTube song", author: "Unavailable offline" };
      }
    })();
    cache.set(id, hit);
  }
  return hit;
}
