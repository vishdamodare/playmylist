"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  Trash2,
  X,
  MessageSquare,
  Lock,
  Send,
  Mic,
  CloudRain,
  Heart,
} from "lucide-react";
import { Mood, WallItem, Story } from "@/types/mood";
import { PlayerState, MusicProvider } from "@/types/player";
import { MusicPlayer } from "@/components/player/MusicPlayer";
import { MoodFx } from "@/components/experience/MoodFx";
import { PageRain } from "@/components/experience/PageRain";
import { storage } from "@/lib/storage";

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
  const [draftTitle, setDraftTitle] = useState("");
  const [draft, setDraft] = useState("");
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [recording, setRecording] = useState(false);
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
    const title = draftTitle.trim() || "Community Reflection";

    if (editingStoryId) {
      // Update existing story
      const updated = communityStories.map((s) =>
        s.id === editingStoryId
          ? {
              ...s,
              title,
              content,
            }
          : s
      );
      setCommunityStories(updated);
      setEditingStoryId(null);
      setDraftTitle("");
      setDraft("");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2200);
      setTab("wall");

      try {
        await storage.set(
          `community_stories:${mood.slug}`,
          JSON.stringify(updated),
          true
        );
      } catch {
        // Ignore
      }
      return;
    }

    // 1. Create new story with custom title
    const newStory: Story = {
      id: `story-${Date.now()}`,
      title,
      author: "You (Just now)",
      tags: ["reflection", mood.label.toLowerCase()],
      content,
      likes: 1,
    };

    const updatedStories = [newStory, ...communityStories].slice(0, 30);
    setCommunityStories(updatedStories);
    setStoryIdx(0); // Immediately switch the story card to show this new story!

    // 2. Also update story wall list
    setWallPosts((posts) => [
      { text: `${title ? `[${title}] ` : ""}${content}`, author: "You" },
      ...posts,
    ]);

    // 3. Clear draft and notify user
    setDraftTitle("");
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
    const updated = communityStories.filter((s) => s.id !== storyId);
    setCommunityStories(updated);
    if (editingStoryId === storyId) {
      handleCancelEdit();
    }
    if (storyIdx >= updated.length + mood.stories.length) {
      setStoryIdx(Math.max(0, updated.length + mood.stories.length - 1));
    }

    try {
      await storage.set(
        `community_stories:${mood.slug}`,
        JSON.stringify(updated),
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
  const isUserStory = story.id?.startsWith("story-") || story.author?.startsWith("You");

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

      {/* Page-wide rain + thunder */}
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
                <MessageSquare size={13} /> Story Wall ({wallPosts.length + communityStories.length})
              </button>
            </div>

            {tab === "write" ? (
              <>
                {editingStoryId && (
                  <div className="pml-notecard-edit-banner">
                    <span>Editing reflection</span>
                    <button
                      className="pml-notecard-edit-cancel"
                      onClick={handleCancelEdit}
                      title="Cancel Edit"
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  className="pml-notecard-title-input"
                  placeholder="Story Title (optional)"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  maxLength={60}
                  aria-label="Story Title"
                />
                <textarea
                  className="pml-notecard-textarea"
                  placeholder="What does this feeling remind you of? Write your story..."
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
                      {editingStoryId ? "Update Story" : "Post it"} <Send size={13} />
                    </button>
                  </div>
                  <p className="pml-notecard-hint">
                    Publishing places your reflection on the Story Wall & Story card.
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
                {/* Community Stories editable list */}
                {communityStories.map((st) => (
                  <div className="pml-wall-item pml-wall-item-user" key={st.id}>
                    <div className="pml-wall-header">
                      <strong className="pml-wall-title">{st.title}</strong>
                      <div className="pml-wall-actions">
                        <button
                          className="pml-action-btn edit"
                          onClick={() => handleStartEdit(st)}
                          title="Edit story"
                        >
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
                    </div>
                    <p className="pml-wall-text">{st.content}</p>
                    <span className="pml-wall-meta pml-mono">You (Just now)</span>
                  </div>
                ))}

                {wallPosts.map((post, i) => (
                  <div className="pml-wall-item" key={`wall-${i}`}>
                    <p className="pml-wall-text">{post.text}</p>
                    <span className="pml-wall-meta pml-mono">{post.author}</span>
                  </div>
                ))}

                {communityStories.length === 0 && wallPosts.length === 0 && (
                  <p className="pml-wall-empty pml-mono">
                    NO REFLECTIONS YET — BE THE FIRST
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="pml-story-col">
          <div className={`pml-story-shield ${rainMode ? "is-raining" : ""}`}>
            <p className="pml-quote">&ldquo;{mood.quote}&rdquo;</p>

            <div key={story.id || storyIdx} className="pml-story-block">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="pml-tags">
                  {story.tags.map((tag) => (
                    <span className="pml-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Edit & Delete buttons if user-authored story */}
                {isUserStory && story.id && (
                  <div className="pml-story-user-actions">
                    <button
                      className="pml-story-action-btn edit"
                      onClick={() => handleStartEdit(story)}
                      title="Edit this story"
                    >
                      <Pencil size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      className="pml-story-action-btn delete"
                      onClick={() => handleDeleteStory(story.id || "")}
                      title="Delete this story"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
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
