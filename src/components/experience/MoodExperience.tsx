"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  MessageSquare,
  Lock,
  Send,
  Mic,
  CloudRain,
  Snowflake,
  Sun,
  Moon,
  Plus,
  CloudLightning,
  Wind,
} from "lucide-react";
import { Mood, WallItem, Story } from "@/types/mood";
import { PlayerState, MusicProvider } from "@/types/player";
import { MusicPlayer, MusicPlayerProps } from "@/components/player/MusicPlayer";
import { StoryShelf } from "@/components/experience/StoryShelf";
import { getExtraSongs, setExtraSongs, moodQueue } from "@/lib/moodSongs";
import { extractVideoId } from "@/lib/playlistHelper";
import { lookupSong, SongMeta } from "@/lib/youtubeMeta";
import { MoodFx } from "@/components/experience/MoodFx";
import { PageWeather, Weather } from "@/components/experience/PageWeather";

const WEATHERS: { kind: Weather; label: string; Icon: typeof Sun }[] = [
  { kind: "rain", label: "Rain", Icon: CloudRain },
  { kind: "storm", label: "Storm", Icon: CloudLightning },
  { kind: "wind", label: "Wind", Icon: Wind },
  { kind: "snow", label: "Snow", Icon: Snowflake },
  { kind: "sun", label: "Sunshine", Icon: Sun },
  { kind: "night", label: "Night", Icon: Moon },
];

/** Camcorder-style date stamp: today, filmed in '96. */
function vhsStamp(): string {
  const d = new Date();
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${mon}. ${String(d.getDate()).padStart(2, "0")} '96`;
}
import { storage } from "@/lib/storage";
import { api, VoiceNote } from "@/lib/api";
import { askName, useProfile } from "@/lib/profile";

/** What each room says after your name. */
const HELLO: Record<string, string> = {
  "in-love": "this one's for the butterflies.",
  "the-weeknd": "the night is yours. turn it up.",
  "one-sided": "you deserve to be loved back.",
  "long-distance": "it's only miles. they're still yours.",
  lonely: "you're less alone than it feels.",
  "late-night": "can't sleep either? stay a while.",
  "my-playlist": "welcome to your own room.",
};
let askedThisVisit = false;

function hexToRgbTriplet(hex: string): string {
  const h = hex.replace("#", "");
  const v = parseInt(h, 16);
  return `${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}`;
}

interface MoodExperienceProps {
  mood: Mood;
  onBack: () => void;
  playerState: PlayerState;
  provider: MusicProvider;
  /** e.g. the site-wide Morning/Night switch */
  headerExtra?: React.ReactNode;
  /** Replaces the mood video panel (e.g. the listener's own photos/videos). */
  visual?: React.ReactNode;
  /** Replaces the quote above the shelf. */
  epigraph?: React.ReactNode;
  /** Song source override (e.g. "My Playlist" instead of the mood's built-in queue). */
  songs?: Pick<MusicPlayerProps, "queue" | "onAddSongs" | "userSongIds" | "onRemoveSong" | "fallbackTitle" | "fallbackArtist" | "queueName">;
}

export function MoodExperience({
  mood,
  onBack,
  playerState,
  provider,
  headerExtra,
  visual,
  epigraph,
  songs,
}: MoodExperienceProps) {
  const t = mood.theme;
  const profile = useProfile();

  // First mood of the visit: ask what to call them (after the page transition settles).
  useEffect(() => {
    if (askedThisVisit || profile.name || profile.skipped) return;
    const id = setTimeout(() => {
      if (askedThisVisit) return;
      askedThisVisit = true;
      askName();
    }, 1400);
    return () => clearTimeout(id);
  }, [profile.name, profile.skipped]);

  const [weather, setWeather] = useState<Weather | null>(null);

  // ── listener's own songs for this mood ──
  const [extraSongs, setExtra] = useState<SongMeta[]>([]);
  const [addSignal, setAddSignal] = useState(0);
  useEffect(() => setExtra(getExtraSongs(mood.slug)), [mood.slug]);
  const queue = moodQueue(mood.slug); // built-ins + saved extras (re-read each render, cheap)

  const addSongs = async (text: string): Promise<string> => {
    const tokens = text.split(/[\s,]+/).filter(Boolean);
    const found = tokens.map(extractVideoId).filter((x): x is string => Boolean(x));
    const bad = tokens.length - found.length;
    const fresh = Array.from(new Set(found)).filter((id) => !queue.includes(id));
    const dupes = found.length - fresh.length;
    const looked = await Promise.all(fresh.map(lookupSong));
    const added = looked.filter((x): x is SongMeta => x !== null);
    const missing = looked.length - added.length;
    if (added.length) {
      const next = [...getExtraSongs(mood.slug), ...added];
      setExtraSongs(mood.slug, next);
      setExtra(next);
    }
    const parts: string[] = [];
    if (added.length) parts.push(`Added ${added.length} song${added.length === 1 ? "" : "s"} ✓`);
    if (dupes) parts.push(`${dupes} already here`);
    if (missing) parts.push(`${missing} unavailable on YouTube`);
    if (bad) parts.push(`${bad} not a YouTube song link`);
    return parts.join(" · ") || "Nothing to add";
  };

  const removeSong = (id: string) => {
    const next = getExtraSongs(mood.slug).filter((x) => x.id !== id);
    setExtraSongs(mood.slug, next);
    setExtra(next);
  };
  const rainMode = weather === "rain";
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    if (!rainMode) return undefined;
    let id: NodeJS.Timeout;
    const scheduleNext = () => {
      const delay = 5000 + Math.random() * 7000;
      id = setTimeout(() => {
        setFlashKey((k) => k + 1);
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(id);
  }, [rainMode]);

  const [tab, setTab] = useState<"write" | "wall">("write");
  const [draftTitle, setDraftTitle] = useState("");
  const [draft, setDraft] = useState("");
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [recording, setRecording] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [wallPosts, setWallPosts] = useState<WallItem[]>(mood.wall || []);
  const [communityStories, setCommunityStories] = useState<Story[]>([]);
  const [videoError, setVideoError] = useState(false);

  // Load persistent community stories when mood changes
  useEffect(() => {
    let cancelled = false;
    setWallPosts(mood.wall || []);
    setDraftTitle("");
    setDraft("");
    setEditingStoryId(null);
    setTab("write");
    setVideoError(false);

    (async () => {
      // Restore a privately saved draft ("Save for myself").
      try {
        const saved = await storage.get(`draft:${mood.slug}`);
        if (!cancelled && saved?.value) {
          const { title, draft: body } = JSON.parse(saved.value);
          setDraftTitle(title || "");
          setDraft(body || "");
        }
      } catch {
        // Corrupt draft — start fresh.
      }

      try {
        // One-time move of stories posted before the database existed (they lived in localStorage).
        const legacy = await storage.get(`community_stories:${mood.slug}`, true);
        const old: Story[] = legacy?.value ? JSON.parse(legacy.value) : [];
        if (old.length) {
          for (const st of old.reverse()) await api.createStory(mood.slug, st.title, st.content, st.tags).catch(() => {});
          await storage.set(`community_stories:${mood.slug}`, "[]", true);
        }
        const fromDb = await api.stories(mood.slug);
        if (!cancelled) setCommunityStories(fromDb);
      } catch {
        if (!cancelled) setCommunityStories([]);
      }
      try {
        const notes = await api.voiceNotes(mood.slug);
        if (!cancelled) setVoiceNotes(notes);
      } catch {
        if (!cancelled) setVoiceNotes([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mood.slug, mood.wall]);

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  // Bug fix: this only flashed "SAVED" before — nothing was stored.
  const handleSave = () => {
    if (!draft.trim()) return;
    storage.set(`draft:${mood.slug}`, JSON.stringify({ title: draftTitle, draft }));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const clearSavedDraft = () => storage.set(`draft:${mood.slug}`, "");

  const handlePost = async () => {
    if (!draft.trim() || posting) return;
    // Sign it: ask once for a name before the first post (they can still stay anonymous).
    if (!profile.name && !profile.skipped && !editingStoryId) await askName();
    const content = draft.trim();
    const title = draftTitle.trim() || "Community Reflection";
    setPosting(true);
    setPostError("");
    try {
      if (editingStoryId) {
        const updated = await api.updateStory(editingStoryId, title, content);
        setCommunityStories((list) => list.map((st) => (st.id === updated.id ? updated : st)));
        setEditingStoryId(null);
      } else {
        const created = await api.createStory(mood.slug, title, content, ["reflection", mood.label.toLowerCase()]);
        setCommunityStories((list) => [created, ...list]);
      }
      setDraftTitle("");
      setDraft("");
      clearSavedDraft();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2200);
      setTab("wall");
    } catch (e) {
      setPostError(e instanceof Error ? e.message : "Couldn't post — try again");
    } finally {
      setPosting(false);
    }
  };

  const handleStartEdit = (targetStory: Story) => {
    setDraftTitle(targetStory.title || "");
    setDraft(targetStory.content);
    setEditingStoryId(targetStory.id || null);
    setTab("write");
  };

  const handleCancelEdit = () => {
    setEditingStoryId(null);
    setDraftTitle("");
    setDraft("");
  };

  const handleDeleteStory = async (storyId: string) => {
    const before = communityStories;
    setCommunityStories((list) => list.filter((st) => st.id !== storyId)); // optimistic
    if (editingStoryId === storyId) handleCancelEdit();
    try {
      await api.deleteStory(storyId);
    } catch {
      setCommunityStories(before); // put it back if the server refused
    }
  };

  // ── Voice notes: real recording → Neon Object Storage (row in Postgres points at the object) ──
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [recError, setRecError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recStartRef = useRef(0);

  // Live dictation: what you say is typed into the journal while the voice note records (Web Speech API).
  const speechRef = useRef<{ stop: () => void } | null>(null);
  const [listening, setListening] = useState(false);

  const startDictation = () => {
    type Rec = {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: (e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void;
      onend: () => void;
      onerror: (e: { error: string }) => void;
      start: () => void;
      stop: () => void;
    };
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setRecError("Live typing isn't supported in this browser (try Chrome, Edge or Safari) — your voice note still saves.");
      return;
    }
    setTab("write");
    let active = true;
    let base = "";
    let finals = "";
    setDraft((d) => (base = d.trim() ? d.replace(/\s*$/, "") + (/[.!?]$/.test(d.trim()) ? " " : "\n\n") : ""));
    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript;
        if (r.isFinal) finals += (finals && !finals.endsWith(" ") ? " " : "") + text.trim();
        else interim += text;
      }
      const spoken = (finals + (interim ? (finals ? " " : "") + interim.trim() : "")).replace(/^\w/, (c) => c.toUpperCase());
      setDraft(base + spoken);
    };
    // Browsers end recognition after a pause; keep listening until Stop.
    rec.onend = () => (active ? rec.start() : setListening(false));
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        active = false;
        setRecError("Live typing was blocked — allow microphone/speech access to type as you talk.");
      }
    };
    rec.start();
    setListening(true);
    speechRef.current = {
      stop: () => {
        active = false;
        rec.stop();
      },
    };
  };

  const toggleRecord = async () => {
    if (recording) {
      speechRef.current?.stop();
      speechRef.current = null;
      recorderRef.current?.stop();
      return;
    }
    setRecError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = async () => {
        speechRef.current?.stop(); // also when the 5-minute cap ends the recording
        speechRef.current = null;
        stream.getTracks().forEach((tr) => tr.stop());
        setRecording(false);
        const blob = new Blob(chunks, { type: (mr.mimeType || "audio/webm").split(";")[0] });
        const duration = Math.round((Date.now() - recStartRef.current) / 1000);
        try {
          const note = await api.uploadVoice(mood.slug, blob, duration);
          setVoiceNotes((n) => [note, ...n]);
        } catch (e) {
          setRecError(e instanceof Error ? e.message : "Upload failed");
        }
      };
      recorderRef.current = mr;
      recStartRef.current = Date.now();
      mr.start();
      setRecording(true);
      startDictation();
      setTimeout(() => mr.state === "recording" && mr.stop(), 5 * 60 * 1000); // cap at 5 min
    } catch {
      setRecError("Microphone unavailable — check permissions");
    }
  };

  useEffect(() => () => speechRef.current?.stop(), []);

  const deleteVoice = async (id: string) => {
    setVoiceNotes((n) => n.filter((x) => x.id !== id));
    await api.deleteVoice(id).catch(() => {});
  };

  const allStories = communityStories;
  const isUserStory = (s: Story) => Boolean(s.mine);

  return (
    <div
      className="pml-mood pml-view-enter"
      data-weather={weather ?? undefined}
      style={{ "--m-from": t.from, "--m-via": t.via, "--m-to": t.to } as React.CSSProperties}
    >
      <header>
        <nav className="pml-mood-nav" aria-label="Mood navigation">
          <button className="pml-back" onClick={onBack}>
            <ArrowLeft size={15} /> Moods
          </button>
          <div className="pml-mood-nav-right">
            {headerExtra}
            <button className="pml-add-song-btn" onClick={() => setAddSignal((n) => n + 1)}>
              <Plus size={14} /> Add your song
              {(songs?.userSongIds ?? extraSongs).length > 0 && <span>{(songs?.userSongIds ?? extraSongs).length}</span>}
            </button>
            <div className="pml-moodlabel-pill pml-mono" style={{ fontSize: 11 }}>
              {mood.label.toUpperCase()}
            </div>
          </div>
        </nav>
      </header>

      <div className="pml-pulse" aria-hidden="true">
        <div
          className="pml-pulse-dot"
          style={{ background: t.accent, animationDuration: `${t.pulse}s` }}
        />
      </div>

      {/* Page-wide weather (+ thunder in the rain) and the 90s film grain */}
      {weather && <PageWeather key={weather} kind={weather} rainVideoSrc={mood.rainVideoSrc} />}
      {rainMode && <div key={flashKey} className="pml-page-thunder-flash" aria-hidden="true" />}
      <div className="pml-film" aria-hidden="true" />

      <main className="pml-mood-body">
        <div className="pml-left-col">
          <div
            className="pml-visual-col"
            style={
              {
                "--vfrom": t.from,
                "--vvia": t.via,
                "--vto": t.to,
              } as React.CSSProperties
            }
          >
            {visual ? (
              visual
            ) : mood.videoSrc && !videoError ? (
              <video
                key={mood.videoSrc}
                className="pml-visual-video"
                src={mood.videoSrc}
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
              />
            ) : (
              <div className="pml-visual-art">
                <div
                  className="pml-visual-blur1"
                  style={
                    {
                      background: t.accent,
                      "--pulse": `${t.pulse}s`,
                    } as React.CSSProperties
                  }
                />
                <div
                  className="pml-visual-blur2"
                  style={
                    {
                      background: t.accent2,
                      "--pulse": `${t.pulse}s`,
                    } as React.CSSProperties
                  }
                />
                <div className="pml-visual-lines" />
              </div>
            )}
            <MoodFx mood={mood} />

            <div className="pml-weather" role="group" aria-label="Weather">
              {WEATHERS.map(({ kind, label, Icon }) => (
                <button
                  key={kind}
                  className={`pml-weather-btn ${weather === kind ? "active" : ""}`}
                  data-kind={kind}
                  onClick={() => setWeather((w) => (w === kind ? null : kind))}
                  aria-pressed={weather === kind}
                  aria-label={label}
                  title={label}
                >
                  <Icon size={13} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="pml-vhs pml-mono" aria-hidden="true">
              <span className="pml-vhs-play">▶ PLAY</span>
              <span>{vhsStamp()}</span>
            </div>

            <div className="pml-visual-caption pml-mono">{mood.visualLabel}</div>
          </div>

          <div
            className="pml-notecard pml-desk"
            style={
              {
                "--nvia": t.via,
                "--nfrom": t.from,
                "--ink-accent": t.accent,
              } as React.CSSProperties
            }
          >
            {/* folder index tabs */}
            <div className="pml-notecard-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={tab === "write"}
                className={`pml-notecard-tab ${tab === "write" ? "active" : ""}`}
                onClick={() => setTab("write")}
              >
                <Pencil size={13} /> Write
              </button>
              <button
                role="tab"
                aria-selected={tab === "wall"}
                className={`pml-notecard-tab ${tab === "wall" ? "active" : ""}`}
                onClick={() => setTab("wall")}
              >
                <MessageSquare size={13} /> Story Wall
                <span className="pml-tab-count">{wallPosts.length + communityStories.length}</span>
              </button>
            </div>

            {tab === "write" ? (
              <div className="pml-paper" key="write">
                {/* paper clip + washi tape + punch holes */}
                <svg className="pml-paper-clip" viewBox="0 0 24 64" aria-hidden="true">
                  <path
                    d="M8 52 V12 a6 6 0 0 1 12 0 V50 a9 9 0 0 1 -18 0 V18"
                    fill="none"
                    stroke="url(#clipMetal)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="clipMetal" x1="0" x2="1">
                      <stop offset="0" stopColor="#8d8f99" />
                      <stop offset=".5" stopColor="#f2f3f7" />
                      <stop offset="1" stopColor="#7d7f88" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="pml-paper-tape" aria-hidden="true" />
                <span className="pml-paper-holes" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>

                {editingStoryId && (
                  <div className="pml-notecard-edit-banner">
                    <span>✎ Editing your story</span>
                    <button className="pml-notecard-edit-cancel" onClick={handleCancelEdit} title="Cancel Edit">
                      <X size={12} /> Cancel
                    </button>
                  </div>
                )}

                <span className="pml-paper-date">{mood.label} · {vhsStamp()}</span>
                <input
                  type="text"
                  className="pml-notecard-title-input"
                  placeholder="Untitled story…"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  maxLength={60}
                  aria-label="Story Title"
                />
                <textarea
                  className="pml-notecard-textarea"
                  placeholder="What does this feeling remind you of? Write it down…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  aria-label={`Reflection for ${mood.label}`}
                />

                <div className="pml-notecard-footer">
                  <span className="pml-notecard-status">
                    {listening ? "● listening — talk and it writes" : wordCount ? `${wordCount} word${wordCount === 1 ? "" : "s"}` : "a blank page"}
                  </span>
                  {savedFlash && (
                    <span className="pml-ink-stamp" aria-live="polite">
                      Saved
                    </span>
                  )}
                  {postError && <p className="pml-post-error" role="alert">{postError}</p>}
                  <div className="pml-notecard-actions">
                    <button className="pml-notecard-btn ghost" onClick={handleSave} disabled={!draft.trim()}>
                      <Lock size={13} /> Keep it private
                    </button>
                    <button
                      className="pml-notecard-btn solid pml-stamp-btn"
                      style={{ "--stamp": t.accent } as React.CSSProperties}
                      onClick={handlePost}
                      disabled={!draft.trim() || posting}
                    >
                      <span className="pml-stamp-face">
                        <Send size={14} />
                        <b>{posting ? "Posting…" : editingStoryId ? "Update" : "Post it"}</b>
                        <small>to the shelf</small>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pml-cork" key="wall">
                <div className="pml-wall-list">
                  {communityStories.map((st, i) => (
                    <div className="pml-wall-item pml-wall-item-user" key={st.id} style={{ "--tilt": `${(i % 3) - 1}deg` } as React.CSSProperties}>
                      <span className="pml-pin" aria-hidden="true" />
                      <div className="pml-wall-header">
                        <strong className="pml-wall-title">{st.title}</strong>
                        {isUserStory(st) && (
                          <div className="pml-wall-actions">
                            <button className="pml-action-btn edit" onClick={() => handleStartEdit(st)} title="Edit story">
                              <Pencil size={12} />
                            </button>
                            <button
                              className="pml-action-btn delete"
                              onClick={() => handleDeleteStory(st.id || "")}
                              title="Delete story"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="pml-wall-text">{st.content}</p>
                      <span className="pml-wall-meta">— {isUserStory(st) ? "you" : st.author}</span>
                    </div>
                  ))}

                  {wallPosts.map((post, i) => (
                    <div
                      className="pml-wall-item"
                      key={`wall-${i}`}
                      style={{ "--tilt": `${((i + communityStories.length) % 3) - 1}deg` } as React.CSSProperties}
                    >
                      <span className="pml-pin" aria-hidden="true" />
                      <p className="pml-wall-text">{post.text}</p>
                      <span className="pml-wall-meta">— {post.author}</span>
                    </div>
                  ))}

                  {communityStories.length === 0 && wallPosts.length === 0 && (
                    <p className="pml-wall-empty">Nothing pinned yet — be the first.</p>
                  )}
                </div>
              </div>
            )}

            {/* 90s pocket tape recorder */}
            <div className={`pml-recorder ${recording ? "is-recording" : ""}`}>
              <span className="pml-rec-grille" aria-hidden="true" />
              <span className="pml-rec-window" aria-hidden="true">
                <i className="pml-cas-reel" />
                <i className="pml-cas-reel" />
              </span>
              <span className="pml-rec-label">Voice notes</span>
              <button
                className={`pml-notecard-record ${recording ? "is-recording" : ""}`}
                onClick={toggleRecord}
                style={
                  {
                    "--rec-color": t.accent,
                    "--rec-rgb": hexToRgbTriplet(t.accent),
                  } as React.CSSProperties
                }
              >
                <span className="pml-rec-led" aria-hidden="true" />
                <Mic size={13} /> {recording ? "Stop" : "Rec"}
              </button>
            </div>
            {(voiceNotes.length > 0 || recError) && (
              <div className="pml-voice-notes">
                {recError && <p className="pml-voice-error">{recError}</p>}
                {voiceNotes.map((n) => (
                  <div className="pml-voice-note" key={n.id}>
                    <span className="pml-voice-meta">
                      {Math.floor(n.duration / 60)}:{String(n.duration % 60).padStart(2, "0")} ·{" "}
                      {new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                    <audio src={n.url} controls preload="none" />
                    <button onClick={() => deleteVoice(n.id)} aria-label="Delete voice note" title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pml-story-col">
          <div className={`pml-story-shield ${weather ? "has-weather" : ""}`}>
            <p className="pml-hello" key={`${mood.slug}:${profile.name ?? ""}`} style={{ "--a": t.accent, "--a2": t.accent2 } as React.CSSProperties}>
              <span className="pml-hello-hey">Hey</span>{" "}
              <button className="pml-hello-name" onClick={() => askName()} title="Change what we call you">
                {(profile.name ?? "you").split("").map((ch, i) => (
                  <span key={i} style={{ animationDelay: `${260 + i * 55}ms` }}>
                    {ch === " " ? "\u00a0" : ch}
                  </span>
                ))}
              </button>
              <span className="pml-hello-line" style={{ animationDelay: `${420 + (profile.name ?? "you").length * 55}ms` }}>
                , {HELLO[mood.slug] ?? "this room is yours tonight."}
              </span>
            </p>
            {epigraph ?? (
            <figure className="pml-epigraph" key={mood.slug}>
              <span className="pml-epigraph-mark" aria-hidden="true">&ldquo;</span>
              <blockquote className="pml-quote">
                {mood.quote.split(" ").map((w, i) => (
                  <span key={i} className="pml-quote-word" style={{ animationDelay: `${120 + i * 55}ms` }}>
                    {w}{" "}
                  </span>
                ))}
              </blockquote>
              <figcaption className="pml-epigraph-cap">
                <span className="pml-epigraph-rule" aria-hidden="true" />
                {mood.label} · side A
                <span className="pml-epigraph-rule" aria-hidden="true" />
              </figcaption>
            </figure>
            )}

            <StoryShelf
              stories={allStories}
              moodLabel={mood.label}
              theme={t}
              isUserStory={isUserStory}
              onEdit={handleStartEdit}
              onDelete={(s) => handleDeleteStory(s.id || "")}
              isPlaying={playerState.isPlaying}
            />
          </div>
        </div>
      </main>

      <MusicPlayer
        accent={t.accent}
        accent2={t.accent2}
        queue={queue}
        onAddSongs={addSongs}
        userSongIds={extraSongs.map((x) => x.id)}
        onRemoveSong={removeSong}
        openAddSignal={addSignal}
        fallbackTitle={mood.tracks?.[0]?.title || mood.playlistName}
        fallbackArtist={mood.tracks?.[0]?.artist}
        queueName={mood.playlistName}
        playerState={playerState}
        provider={provider}
        {...songs}
      />
    </div>
  );
}
