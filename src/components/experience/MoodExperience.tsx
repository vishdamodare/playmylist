"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  MessageSquare,
  Lock,
  Send,
  Mic,
  CloudRain,
} from "lucide-react";
import { Mood, WallItem, Story } from "@/types/mood";
import { PlayerState, MusicProvider } from "@/types/player";
import { MusicPlayer } from "@/components/player/MusicPlayer";
import { MoodFx } from "@/components/experience/MoodFx";
import { PageRain } from "@/components/experience/PageRain";
import { storage } from "@/lib/storage";

function hexToRgbTriplet(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

interface MoodExperienceProps {
  mood: Mood;
  onBack: () => void;
  playerState: PlayerState;
  provider: MusicProvider;
}

export function MoodExperience({
  mood,
  onBack,
  playerState,
  provider,
}: MoodExperienceProps) {
  const t = mood.theme;
  const bg = `linear-gradient(160deg, ${t.from} 0%, ${t.via} 55%, ${t.to} 100%)`;

  const [storyIdx, setStoryIdx] = useState(0);
  useEffect(() => {
    setStoryIdx(0);
  }, [mood.slug]);

  const [rainMode, setRainMode] = useState(false);
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
  const [draft, setDraft] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [recording, setRecording] = useState(false);
  const [wallPosts, setWallPosts] = useState<WallItem[]>(mood.wall || []);
  const [communityStories, setCommunityStories] = useState<Story[]>([]);
  const [videoError, setVideoError] = useState(false);

  // Load persistent community stories when mood changes
  useEffect(() => {
    let cancelled = false;
    setWallPosts(mood.wall || []);
    setDraft("");
    setTab("write");
    setVideoError(false);

    (async () => {
      try {
        const stored = await storage.get(`community_stories:${mood.slug}`, true);
        if (!cancelled && stored?.value) {
          setCommunityStories(JSON.parse(stored.value));
        } else if (!cancelled) {
          setCommunityStories([]);
        }
      } catch {
        if (!cancelled) setCommunityStories([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mood.slug, mood.wall]);

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  const handleSave = () => {
    if (!draft.trim()) return;
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const handlePost = async () => {
    if (!draft.trim()) return;
    const content = draft.trim();

    // 1. Create new story
    const newStory: Story = {
      id: `story-${Date.now()}`,
      title: "Community Reflection",
      author: "You (Just now)",
      tags: ["reflection", mood.label.toLowerCase()],
      content,
      likes: 1,
    };

    const updatedStories = [newStory, ...communityStories].slice(0, 30);
    setCommunityStories(updatedStories);
    setStoryIdx(0); // Immediately switch the story card to show this new story!

    // 2. Also update story wall list
    setWallPosts((posts) => [{ text: content, author: "You" }, ...posts]);

    // 3. Clear draft and notify user
    setDraft("");
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
    setTab("wall");

    // 4. Persist to storage
    try {
      await storage.set(
        `community_stories:${mood.slug}`,
        JSON.stringify(updatedStories),
        true
      );
    } catch {
      // Ignore
    }
  };

  const toggleRecord = () => {
    if (recording) return;
    setRecording(true);
    setTimeout(() => setRecording(false), 2400);
  };

  // Combine user posted stories with default mood stories
  const allStories = [...communityStories, ...mood.stories];
  const story = allStories[storyIdx] || allStories[0] || mood.stories[0];
  const prevStory = () =>
    setStoryIdx((i) => (i - 1 + allStories.length) % allStories.length);
  const nextStory = () =>
    setStoryIdx((i) => (i + 1) % allStories.length);

  return (
    <div className="pml-mood pml-mood-enter" style={{ background: bg }}>
      <header>
        <nav className="pml-mood-nav" aria-label="Mood navigation">
          <button className="pml-back" onClick={onBack}>
            <ArrowLeft size={15} /> Moods
          </button>
          <div className="pml-moodlabel-pill pml-mono" style={{ fontSize: 11 }}>
            {mood.label.toUpperCase()}
          </div>
        </nav>
      </header>

      <div className="pml-pulse" aria-hidden="true">
        <div
          className="pml-pulse-dot"
          style={{ background: t.accent, animationDuration: `${t.pulse}s` }}
        />
      </div>

      {/* Page-wide rain + thunder — covers the whole screen, sits below
          the story shield and player so those two stay dry/legible. */}
      {rainMode && <PageRain videoSrc={mood.rainVideoSrc} />}
      {rainMode && <div key={flashKey} className="pml-page-thunder-flash" aria-hidden="true" />}

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
            {mood.videoSrc && !videoError ? (
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

            <button
              className={`pml-rainmode-btn ${rainMode ? "active" : ""}`}
              onClick={() => setRainMode((r) => !r)}
              aria-pressed={rainMode}
              aria-label="Toggle rain mode"
            >
              <CloudRain size={13} /> {rainMode ? "Rain on" : "Rain"}
            </button>

            <div className="pml-visual-caption pml-mono">{mood.visualLabel}</div>
          </div>

          <div
            className="pml-notecard"
            style={
              {
                "--nvia": t.via,
                "--nfrom": t.from,
              } as React.CSSProperties
            }
          >
            <div className="pml-notecard-tabs">
              <button
                className={`pml-notecard-tab ${tab === "write" ? "active" : ""}`}
                onClick={() => setTab("write")}
              >
                <Pencil size={13} /> Write
              </button>
              <button
                className={`pml-notecard-tab ${tab === "wall" ? "active" : ""}`}
                onClick={() => setTab("wall")}
              >
                <MessageSquare size={13} /> Story Wall ({wallPosts.length})
              </button>
            </div>

            {tab === "write" ? (
              <>
                <textarea
                  className="pml-notecard-textarea"
                  placeholder="What does this feeling remind you of?"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  aria-label={`Reflection for ${mood.label}`}
                />
                <div className="pml-notecard-footer">
                  <span className="pml-notecard-status pml-mono">
                    {savedFlash
                      ? "SAVED ✓"
                      : wordCount
                      ? `${wordCount} WORD${wordCount === 1 ? "" : "S"}`
                      : "NOTHING WRITTEN YET"}
                  </span>
                  <div className="pml-notecard-actions">
                    <button className="pml-notecard-btn ghost" onClick={handleSave}>
                      <Lock size={13} /> Save for myself
                    </button>
                    <button
                      className="pml-notecard-btn solid"
                      style={{ background: t.accent }}
                      onClick={handlePost}
                      disabled={!draft.trim()}
                    >
                      Post it <Send size={13} />
                    </button>
                  </div>
                  <p className="pml-notecard-hint">
                    Publishing places your reflection on the Story Wall.
                  </p>
                </div>
                <div className="pml-notecard-voice">
                  <span className="pml-mono">VOICE NOTES</span>
                  <button
                    className={`pml-notecard-record ${
                      recording ? "is-recording" : ""
                    }`}
                    onClick={toggleRecord}
                    style={
                      {
                        "--rec-color": t.accent,
                        "--rec-rgb": hexToRgbTriplet(t.accent),
                      } as React.CSSProperties
                    }
                  >
                    <Mic size={13} /> {recording ? "Recording…" : "Record"}
                  </button>
                </div>
              </>
            ) : (
              <div className="pml-wall-list">
                {wallPosts.length === 0 ? (
                  <p className="pml-wall-empty pml-mono">
                    NO REFLECTIONS YET — BE THE FIRST
                  </p>
                ) : (
                  wallPosts.map((post, i) => (
                    <div className="pml-wall-item" key={i}>
                      <p className="pml-wall-text">{post.text}</p>
                      <span className="pml-wall-meta pml-mono">{post.author}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="pml-story-col">
          <div className={`pml-story-shield ${rainMode ? "is-raining" : ""}`}>
            <p className="pml-quote">&ldquo;{mood.quote}&rdquo;</p>

            <div key={storyIdx} className="pml-story-block">
              <div className="pml-tags">
                {story.tags.map((tag) => (
                  <span className="pml-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="pml-story-title">{story.title}</h2>
              <p className="pml-story-content">{story.content}</p>
              <p className="pml-story-author">{story.author}</p>
            </div>

            <div className="pml-storynav">
              <button
                className="pml-storynav-btn"
                onClick={prevStory}
                aria-label="Previous story"
              >
                <ArrowLeft size={13} /> Previous story
              </button>
              <span className="pml-storynav-count pml-mono">
                {storyIdx + 1} / {allStories.length}
              </span>
              <button
                className="pml-storynav-btn"
                onClick={nextStory}
                aria-label="Next story"
              >
                Next story <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </main>

      <MusicPlayer mood={mood} playerState={playerState} provider={provider} />
    </div>
  );
}
