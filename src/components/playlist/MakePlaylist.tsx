"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, Play, Plus, Trash2, Link2, Gift as GiftIcon, Globe } from "lucide-react";
import { PlayerState, MusicProvider } from "@/types/player";
import { MusicPlayer } from "@/components/player/MusicPlayer";
import { storage } from "@/lib/storage";
import { lookupSong as lookup } from "@/lib/youtubeMeta";
import { Received, giftUrl } from "@/lib/gift";
import { api } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { collectSongs, describeAdd } from "@/lib/youtubePlaylist";

interface Song {
  id: string;
  title: string;
  author: string;
}

interface Saved {
  name: string;
  songs: Song[];
  to?: string;
}

export type MakeMode = "someone" | "everyone";

interface MakePlaylistProps {
  onBack: () => void;
  playerState: PlayerState;
  provider: MusicProvider;
  headerExtra?: React.ReactNode;
  initialMode?: MakeMode;
  /** Opened from a share link or the home page's community row: read-only, never saved over your own playlists. */
  received?: Received;
}

const GIFT_KEY = "gift_playlist";
const PUBLIC_KEY = "public_playlist";

// Two separate drafts, so a gift and a public playlist never overwrite each other (or your own room).
const DRAFT: Record<MakeMode, { key: string; name: string }> = {
  someone: { key: GIFT_KEY, name: "For someone special" },
  everyone: { key: PUBLIC_KEY, name: "Songs for everyone" },
};
const ACCENT = "#9a6fd9";
const ACCENT2 = "#e8897f";

/** Make a playlist for someone (share link) or for everyone (published to the home page); also the read-only view of either. */
export function MakePlaylist({ onBack, playerState, provider, headerExtra, initialMode = "someone", received }: MakePlaylistProps) {
  const [mode, setMode] = useState<MakeMode>(initialMode);
  const profileName = useProfile().name;
  const forOther = mode === "someone";
  const forAll = mode === "everyone";
  const defaultName = DRAFT[mode].name;
  const [name, setName] = useState("My Playlist");
  const [to, setTo] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  // "For me" and "For someone" are two separate saved drafts.
  const key = received ? "received" : DRAFT[mode].key;
  const loaded = loadedKey === key;

  useEffect(() => {
    let live = true;
    if (received) {
      setName(received.name);
      setTo(received.to);
      Promise.all(received.ids.map(lookup)).then((r) => {
        if (!live) return;
        setSongs(r.filter((s): s is Song => s !== null));
        setLoadedKey(key);
      });
    } else {
      storage.get(key).then((r) => {
        if (!live) return;
        let saved: Partial<Saved> = {};
        try {
          if (r?.value) saved = JSON.parse(r.value);
        } catch {
          // Corrupt save — start empty.
        }
        setName(saved.name || Object.values(DRAFT).find((d) => d.key === key)!.name);
        setSongs(saved.songs || []);
        setTo(saved.to || (key === PUBLIC_KEY ? profileName ?? "" : ""));
        setLoadedKey(key);
      });
    }
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- profile name only pre-fills a fresh draft
  }, [key, received]);

  // Persist only once this draft has loaded, so switching drafts never writes one over the other.
  useEffect(() => {
    if (loaded && !received) storage.set(key, JSON.stringify({ name, songs, to } satisfies Saved));
  }, [loaded, received, key, name, songs, to]);

  const switchTo = (m: MakeMode) => {
    setMode(m);
    setNotice("");
    setInput("");
  };

  const publish = async () => {
    if (!to.trim()) return setNotice("Add your name so everyone knows who made it");
    setBusy(true);
    try {
      await api.publishPlaylist(name.trim() || defaultName, to.trim(), ids);
      setNotice("Published! It's on the home page for everyone now ✨");
    } catch (e) {
      setNotice(`Couldn't publish — ${(e as Error).message}`);
    }
    setBusy(false);
  };

  const unpublish = async () => {
    if (!received?.id || !confirm("Remove this playlist from the home page?")) return;
    try {
      await api.deletePlaylist(received.id);
      onBack();
    } catch (e) {
      setNotice(`Couldn't remove — ${(e as Error).message}`);
    }
  };

  const share = async () => {
    const url = giftUrl({ name, to, ids });
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: to ? `I made a playlist for you, ${to} 💜` : name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setNotice("Link copied — send it to them 💌");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setNotice(`Couldn't copy — share this link: ${url}`);
    }
  };

  const ids = songs.map((s) => s.id);
  const isThisQueue = playerState.playlistId === ids.join(",");

  const addLinks = async () => {
    if (!input.trim() || busy) return;
    setBusy(true);
    setNotice("Adding… (a whole playlist takes a few seconds)");
    const c = await collectSongs(input, ids);
    setSongs((prev) => [...prev, ...c.songs.filter((s) => !prev.some((p) => p.id === s.id))].slice(0, 200));
    setBusy(false);
    setInput("");
    setNotice(describeAdd(c, "already in this playlist"));
  };

  const move = (i: number, by: -1 | 1) =>
    setSongs((prev) => {
      const j = i + by;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const remove = async (id: string) => {
    if (!received?.mine || !received.id) return setSongs((prev) => prev.filter((s) => s.id !== id));
    // your published playlist: remove it on the server too (the last song takes the playlist with it)
    if (songs.length === 1 && !confirm("This is the last song — removing it takes the playlist off the home page. Continue?")) return;
    try {
      const left = await api.removeFromPlaylist(received.id, id);
      if (!left.length) return onBack();
      setSongs((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setNotice(`Couldn't remove — ${(e as Error).message}`);
    }
  };

  const playFrom = (i: number) => provider.loadPlaylist(ids, "playlist", true, i);

  return (
    <div className="pml-mood pml-myplaylist pml-view-enter">
      <header>
        <nav className="pml-mood-nav" aria-label="Playlist navigation">
          <button className="pml-back" onClick={onBack}>
            <ArrowLeft size={15} /> Back
          </button>
          <div className="pml-mood-nav-right">
            {headerExtra}
            <div className="pml-moodlabel-pill pml-mono" style={{ fontSize: 11 }}>
              {received?.by ? "COMMUNITY" : received ? "A GIFT" : forAll ? "FOR EVERYONE" : "FOR SOMEONE"}
            </div>
          </div>
        </nav>
      </header>

      <main className="pml-mp-body">
        {!received && (
          <div className="pml-mp-for" role="tablist" aria-label="Who is this playlist for">
            <button role="tab" aria-selected={forOther} onClick={() => switchTo("someone")}>
              <GiftIcon size={13} /> For someone
            </button>
            <button role="tab" aria-selected={forAll} onClick={() => switchTo("everyone")}>
              <Globe size={13} /> For everyone
            </button>
          </div>
        )}
        <section className="pml-mp-hero">
          <div className="pml-mp-cover" aria-hidden="true">
            {songs.slice(0, 4).map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s.id} src={`https://i.ytimg.com/vi/${s.id}/mqdefault.jpg`} alt="" />
            ))}
          </div>
          <div className="pml-mp-heading">
            <span className="pml-mono pml-mp-kicker">
              {received?.by
                ? `A PLAYLIST BY ${received.by.toUpperCase()}`
                : received
                ? `A GIFT · MADE FOR ${(to || "you").toUpperCase()}`
                : forAll
                  ? `PLAYLIST · BY ${(to || "you").toUpperCase()} · FOR EVERYONE`
                  : `PLAYLIST · FOR ${(to || "someone").toUpperCase()}`}
            </span>
            <input
              className="pml-mp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => !name.trim() && setName(defaultName)}
              maxLength={60}
              readOnly={!!received}
              aria-label="Playlist name"
            />
            {!received && (
              <label className="pml-mp-to">
                <span className="pml-mono">{forAll ? "BY" : "TO"}</span>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  maxLength={40}
                  placeholder={forAll ? "your name" : "their name"}
                />
              </label>
            )}
            <span className="pml-mp-count pml-mono">
              {songs.length} SONG{songs.length === 1 ? "" : "S"}
            </span>
            <button className="pml-mp-playall" onClick={() => playFrom(0)} disabled={!songs.length}>
              <Play size={14} fill="currentColor" /> Play all
            </button>
            {forOther && !received && (
              <button className="pml-mp-playall pml-mp-share" onClick={share} disabled={!songs.length}>
                <GiftIcon size={14} /> Share with {to.trim() || "them"}
              </button>
            )}
            {forAll && !received && (
              <button className="pml-mp-playall pml-mp-share" onClick={publish} disabled={!songs.length || busy}>
                <Globe size={14} /> {busy ? "Publishing…" : "Publish to home page"}
              </button>
            )}
            {received?.mine && (
              <button className="pml-mp-unpublish pml-mono" onClick={unpublish}>
                <Trash2 size={12} /> Remove from home page
              </button>
            )}
          </div>
        </section>

        {!received && (
        <form
          className="pml-mp-add"
          onSubmit={(e) => {
            e.preventDefault();
            addLinks();
          }}
        >
          <Link2 size={16} className="pml-mp-add-icon" />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                addLinks();
              }
            }}
            placeholder="Paste YouTube song links, or one playlist link to add the whole playlist"
            rows={2}
            aria-label="YouTube song links"
          />
          <button type="submit" disabled={busy || !input.trim()}>
            <Plus size={14} /> {busy ? "Adding…" : "Add"}
          </button>
        </form>
        )}
        <p className="pml-mp-notice pml-mono" aria-live="polite">
          {notice}
        </p>

        {!loaded && received ? (
          <p className="pml-mp-notice pml-mono">Unwrapping…</p>
        ) : loaded && songs.length === 0 ? (
          <div className="pml-mp-empty">
            <p className="pml-mp-empty-title">An empty record, waiting.</p>
            <p>Copy a song&apos;s link from YouTube or YouTube Music and paste it above.</p>
          </div>
        ) : (
          <ol className="pml-mp-list">
            {songs.map((s, i) => {
              const current = isThisQueue && playerState.currentVideoId === s.id;
              return (
                <li key={s.id} className={`pml-mp-row ${current ? "is-current" : ""}`}>
                  <button className="pml-mp-rowplay" onClick={() => playFrom(i)} aria-label={`Play ${s.title}`}>
                    <span className="pml-mp-idx pml-mono">
                      {current && playerState.isPlaying ? (
                        <span className="pml-mp-eq" aria-hidden="true">
                          <i />
                          <i />
                          <i />
                        </span>
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://i.ytimg.com/vi/${s.id}/mqdefault.jpg`} alt="" loading="lazy" />
                    <span className="pml-mp-meta">
                      <span className="pml-mp-title">{s.title}</span>
                      <span className="pml-mp-author">{s.author}</span>
                    </span>
                  </button>
                  {received?.mine ? (
                  <div className="pml-mp-actions">
                    <button className="danger" onClick={() => remove(s.id)} aria-label={`Remove ${s.title}`}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  ) : !received && (
                  <div className="pml-mp-actions">
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                      <ArrowUp size={13} />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === songs.length - 1} aria-label="Move down">
                      <ArrowDown size={13} />
                    </button>
                    <button className="danger" onClick={() => remove(s.id)} aria-label={`Remove ${s.title}`}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </main>

      <MusicPlayer
        accent={ACCENT}
        accent2={ACCENT2}
        queue={ids.length ? ids : undefined}
        fallbackTitle={songs.length ? name : "Add songs to start listening"}
        fallbackArtist={songs.length ? `${songs.length} songs` : "Your playlist"}
        queueName={name}
        playerState={playerState}
        provider={provider}
      />
    </div>
  );
}
