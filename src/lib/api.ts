import type { Story } from "@/types/mood";

/** Anonymous id for this browser: lets you edit/delete your own stories and keeps voice notes private. */
export function ownerId(): string {
  const KEY = "pml_owner_id";
  let id: string | null = null;
  try {
    id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
  } catch {
    id = id ?? crypto.randomUUID();
  }
  return id;
}

const headers = (json = true): HeadersInit => ({
  "x-pml-owner": ownerId(),
  ...(json ? { "content-type": "application/json" } : {}),
});

async function ok<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
  return res.status === 204 ? (undefined as T) : res.json();
}

interface StoryRow {
  id: string;
  mood: string;
  title: string;
  content: string;
  tags: string[];
  mine: boolean;
  author: string | null;
}
const toStory = (r: StoryRow): Story & { mood: string } => ({
  id: r.id,
  mood: r.mood,
  title: r.title,
  content: r.content,
  tags: r.tags.length ? r.tags : ["reflection"],
  author: r.author || (r.mine ? "You" : "Anonymous"),
  mine: r.mine,
});

export const api = {
  async stories(mood?: string) {
    const q = mood ? `?mood=${encodeURIComponent(mood)}` : "";
    const { stories } = await ok<{ stories: StoryRow[] }>(await fetch(`/api/stories${q}`, { headers: headers(false) }));
    return stories.map(toStory);
  },
  async createStory(mood: string, title: string, content: string, tags: string[] = []) {
    const { story } = await ok<{ story: StoryRow }>(
      await fetch("/api/stories", { method: "POST", headers: headers(), body: JSON.stringify({ mood, title, content, tags }) })
    );
    return toStory(story);
  },
  async updateStory(id: string, title: string, content: string) {
    const { story } = await ok<{ story: StoryRow }>(
      await fetch(`/api/stories/${id}`, { method: "PATCH", headers: headers(), body: JSON.stringify({ title, content }) })
    );
    return toStory(story);
  },
  async deleteStory(id: string) {
    await ok<void>(await fetch(`/api/stories/${id}`, { method: "DELETE", headers: headers(false) }));
  },

  async voiceNotes(mood: string) {
    const { notes } = await ok<{ notes: VoiceNote[] }>(
      await fetch(`/api/voice?mood=${encodeURIComponent(mood)}`, { headers: headers(false) })
    );
    return notes;
  },
  async uploadVoice(mood: string, audio: Blob, duration: number) {
    const form = new FormData();
    form.set("audio", audio);
    form.set("mood", mood);
    form.set("duration", String(duration));
    const { note } = await ok<{ note: VoiceNote }>(
      await fetch("/api/voice", { method: "POST", headers: headers(false), body: form })
    );
    return note;
  },
  async deleteVoice(id: string) {
    await ok<void>(await fetch(`/api/voice/${id}`, { method: "DELETE", headers: headers(false) }));
  },

  async media(scope: string) {
    const { media } = await ok<{ media: MediaItem[] }>(
      await fetch(`/api/media?scope=${encodeURIComponent(scope)}`, { headers: headers(false) })
    );
    return media;
  },
  async uploadMedia(scope: string, file: File) {
    const form = new FormData();
    form.set("file", file);
    form.set("scope", scope);
    const { item } = await ok<{ item: MediaItem }>(
      await fetch("/api/media", { method: "POST", headers: headers(false), body: form })
    );
    return item;
  },
  async profile() {
    const { name } = await ok<{ name: string | null }>(await fetch("/api/profile", { headers: headers(false) }));
    return name;
  },
  async setName(name: string) {
    const r = await ok<{ name: string }>(
      await fetch("/api/profile", { method: "PUT", headers: headers(), body: JSON.stringify({ name }) })
    );
    return r.name;
  },
  /** Mirror this browser's song list to the server; returns ids an admin removed so the caller drops them too. */
  async syncSongs(scope: string, songs: { id: string; title: string; author: string }[]) {
    const r = await ok<{ removed?: string[] } | undefined>(
      await fetch("/api/songs", { method: "PUT", headers: headers(), body: JSON.stringify({ scope, songs }) })
    );
    return r?.removed ?? [];
  },
  async sendFeedback(f: { message: string; rating?: number | null; contact?: string; page?: string }) {
    await ok<void>(await fetch("/api/feedback", { method: "POST", headers: headers(), body: JSON.stringify(f) }));
  },
  async deleteMedia(id: string) {
    await ok<void>(await fetch(`/api/media/${id}`, { method: "DELETE", headers: headers(false) }));
  },

  async communityPlaylists() {
    const { playlists } = await ok<{ playlists: PlaylistRow[] }>(await fetch("/api/playlists", { headers: headers(false) }));
    return playlists.map(toCommunity);
  },
  async publishPlaylist(name: string, creator: string, ids: string[]) {
    const { playlist } = await ok<{ playlist: PlaylistRow }>(
      await fetch("/api/playlists", { method: "POST", headers: headers(), body: JSON.stringify({ name, creator, ids }) })
    );
    return toCommunity(playlist);
  },
  /** Owner removes one song from their published playlist; returns the remaining ids ([] = playlist removed). */
  async removeFromPlaylist(id: string, videoId: string) {
    const { ids } = await ok<{ ids: string[] }>(
      await fetch(`/api/playlists/${id}`, { method: "PATCH", headers: headers(), body: JSON.stringify({ remove: videoId }) })
    );
    return ids;
  },
  async deletePlaylist(id: string) {
    await ok<void>(await fetch(`/api/playlists/${id}`, { method: "DELETE", headers: headers(false) }));
  },
};

export interface MediaItem {
  id: string;
  kind: "image" | "video";
  createdAt: string;
  url: string;
}

export interface VoiceNote {
  id: string;
  duration: number;
  createdAt: string;
  url: string;
}

interface PlaylistRow {
  id: string;
  name: string;
  creator: string;
  song_ids: string[];
  mine: boolean;
}
export interface CommunityPlaylist {
  id: string;
  name: string;
  creator: string;
  ids: string[];
  mine: boolean;
}
const toCommunity = (r: PlaylistRow): CommunityPlaylist => ({ id: r.id, name: r.name, creator: r.creator, ids: r.song_ids, mine: r.mine });
