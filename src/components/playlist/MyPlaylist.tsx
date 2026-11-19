"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Gift, Globe, ImagePlus, Play, Trash2 } from "lucide-react";
import type { MakeMode } from "@/components/playlist/MakePlaylist";
import { PlayerState, MusicProvider } from "@/types/player";
import { Mood } from "@/types/mood";
import { MoodExperience } from "@/components/experience/MoodExperience";
import { storage } from "@/lib/storage";
import { api, MediaItem } from "@/lib/api";
import { collectSongs, describeAdd } from "@/lib/youtubePlaylist";

interface Song {
  id: string;
  title: string;
  author: string;
}

interface Saved {
  name: string;
  songs: Song[];
}

interface MyPlaylistProps {
  onBack: () => void;
  playerState: PlayerState;
  provider: MusicProvider;
  headerExtra?: React.ReactNode;
  onMake: (mode: MakeMode) => void;
}

const KEY = "my_playlist";
/** Server scope for this room: stories, voice notes and media here are private to their owner. */
const SCOPE = "my-playlist";

const BASE_MOOD: Mood = {
  slug: SCOPE,
  label: "My Playlist",
  group: "Yours",
  theme: { from: "#1b1230", via: "#2b1c45", to: "#3b2554", accent: "#b48cf0", accent2: "#e8897f", pulse: 4 },
  quote: "",
  visualLabel: "YOUR PHOTOS · YOUR VIDEOS",
  playlistName: "My Playlist",
};

export function MyPlaylist({ onBack, playerState, provider, headerExtra, onMake }: MyPlaylistProps) {
  const [name, setName] = useState("My Playlist");
  const [songs, setSongs] = useState<Song[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storage.get(KEY).then((r) => {
      try {
        if (r?.value) {
          const saved: Saved = JSON.parse(r.value);
          setName(saved.name || "My Playlist");
          setSongs(saved.songs || []);
        }
      } catch {
        // Corrupt save — start empty.
      }
      setLoaded(true);
    });
  }, []);

  // Persist only after the first load, so we never overwrite the saved list with [].
  useEffect(() => {
    if (loaded) storage.set(KEY, JSON.stringify({ name, songs } satisfies Saved));
  }, [loaded, name, songs]);
  useEffect(() => {
    if (loaded) api.syncSongs(SCOPE, songs).catch(() => {});
  }, [loaded, songs]);

  const ids = songs.map((s) => s.id);

  const addSongs = async (text: string): Promise<string> => {
    const c = await collectSongs(text, ids);
    if (c.songs.length) setSongs((prev) => [...prev, ...c.songs.filter((s) => !prev.some((p) => p.id === s.id))]);
    return describeAdd(c, "already in your playlist");
  };

  const mood = useMemo(() => ({ ...BASE_MOOD, playlistName: name }), [name]);

  const epigraph = (
    <section className="pml-epigraph pml-mine-head">
      <div className="pml-mp-cover" aria-hidden="true">
        {songs.slice(0, 4).map((s) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s.id} src={`https://i.ytimg.com/vi/${s.id}/mqdefault.jpg`} alt="" />
        ))}
      </div>
      <div className="pml-mp-heading">
        <span className="pml-mono pml-mp-kicker">PLAYLIST · MADE BY YOU</span>
        <input
          className="pml-mp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => !name.trim() && setName("My Playlist")}
          maxLength={60}
          aria-label="Playlist name"
        />
        <span className="pml-mp-count pml-mono">
          {songs.length} SONG{songs.length === 1 ? "" : "S"} · ONLY YOU CAN SEE THIS ROOM
        </span>
        <button
          className="pml-mp-playall"
          onClick={() => provider.loadPlaylist(ids, "playlist", true, 0)}
          disabled={!songs.length}
        >
          <Play size={14} fill="currentColor" /> Play all
        </button>
        <div className="pml-mp-makefor">
          <span className="pml-mono">MAKE ONE</span>
          <button onClick={() => onMake("someone")}>
            <Gift size={13} /> For someone
          </button>
          <button onClick={() => onMake("everyone")}>
            <Globe size={13} /> For everyone
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <MoodExperience
      mood={mood}
      onBack={onBack}
      playerState={playerState}
      provider={provider}
      headerExtra={headerExtra}
      visual={<MediaWall />}
      epigraph={epigraph}
      songs={{
        queue: ids.length ? ids : undefined,
        onAddSongs: addSongs,
        userSongIds: ids,
        onRemoveSong: (id) => setSongs((prev) => prev.filter((s) => s.id !== id)),
        fallbackTitle: songs.length ? name : "Add songs to start listening",
        fallbackArtist: songs.length ? `${songs.length} songs` : "Tap “Add your song” and paste a YouTube link",
        queueName: name,
      }}
    />
  );
}

/** The listener's photos & videos (Neon Object Storage), shown as a slideshow in the visual panel. */
function MediaWall() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [i, setI] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.media(SCOPE).then(setItems).catch(() => setStatus("Couldn't load your photos"));
  }, []);

  const cur = items[Math.min(i, items.length - 1)];

  // Photos advance on their own; videos advance when they end.
  useEffect(() => {
    if (!cur || cur.kind === "video" || items.length < 2) return;
    const t = setTimeout(() => setI((n) => (n + 1) % items.length), 6000);
    return () => clearTimeout(t);
  }, [cur, items.length]);

  const upload = async (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (!picked.length) return;
    setBusy(true);
    const added: MediaItem[] = [];
    const errors: string[] = [];
    for (const [n, f] of picked.entries()) {
      setStatus(`Uploading ${n + 1} of ${picked.length}…`);
      try {
        added.push(await api.uploadMedia(SCOPE, f));
      } catch (e) {
        errors.push(`${f.name}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
    setItems((prev) => [...added.reverse(), ...prev]);
    setI(0);
    setBusy(false);
    setStatus(errors.length ? errors.join(" · ") : added.length ? `Saved ${added.length} ✓` : "");
    if (!errors.length) setTimeout(() => setStatus(""), 2500);
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = async (item: MediaItem) => {
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setI((n) => Math.max(0, n - 1));
    await api.deleteMedia(item.id).catch(() => setStatus("Couldn't delete — try again"));
  };

  const step = (by: number) => setI((n) => (n + by + items.length) % items.length);

  return (
    <div className="pml-media">
      {cur ? (
        cur.kind === "video" ? (
          <video
            key={cur.id}
            className="pml-media-item"
            src={cur.url}
            autoPlay
            muted
            playsInline
            loop={items.length === 1}
            onEnded={() => step(1)}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={cur.id} className="pml-media-item" src={cur.url} alt="Your upload" />
        )
      ) : (
        <button className="pml-media-empty" onClick={() => fileRef.current?.click()} disabled={busy}>
          <ImagePlus size={26} />
          <b>Add your photos & videos</b>
          <span>Memories that go with these songs — saved just for you</span>
        </button>
      )}

      <div className="pml-media-bar">
        <button onClick={() => fileRef.current?.click()} disabled={busy} title="Add photos or videos">
          <ImagePlus size={13} /> {busy ? "Uploading…" : "Add"}
        </button>
        {cur && (
          <button onClick={() => remove(cur)} title="Delete this one" aria-label="Delete this photo or video">
            <Trash2 size={13} />
          </button>
        )}
        {items.length > 1 && (
          <span className="pml-mono">
            {Math.min(i, items.length - 1) + 1}/{items.length}
          </span>
        )}
      </div>
      {items.length > 1 && (
        <>
          <button className="pml-media-nav prev" onClick={() => step(-1)} aria-label="Previous">
            <ChevronLeft size={18} />
          </button>
          <button className="pml-media-nav next" onClick={() => step(1)} aria-label="Next">
            <ChevronRight size={18} />
          </button>
        </>
      )}
      {status && (
        <p className="pml-media-status" aria-live="polite">
          {status}
        </p>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        multiple
        hidden
        onChange={(e) => upload(e.target.files)}
      />
    </div>
  );
}
