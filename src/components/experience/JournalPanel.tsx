"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PenLine, Mic, Square, Trash2, Lock, Send, MessageSquare, Plus, Check, X } from "lucide-react";
import { Mood } from "@/types/mood";
import { storage } from "@/lib/storage";

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatWhen(ts: number): string {
  return new Date(ts).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface VoiceNote {
  id: string;
  timestamp: number;
  duration: number;
  dataUrl: string;
}

interface WallPost {
  id: string;
  timestamp: number;
  content: string;
  isSelf?: boolean;
}

const MAX_VOICE_NOTES = 6;

interface JournalPanelProps {
  mood: Mood;
  storyIdx: number;
  storyTitle: string;
  onPostStory?: (content: string) => void;
}

type TabMode = "journal" | "wall";

export function JournalPanel({
  mood,
  storyIdx,
  storyTitle,
  onPostStory,
}: JournalPanelProps) {
  const [activeTab, setActiveTab] = useState<TabMode>("journal");
  const [text, setText] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState("");
  const [statusVisible, setStatusVisible] = useState(false);

  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micError, setMicError] = useState("");

  const [posts, setPosts] = useState<WallPost[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);

  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const recTimer = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const elapsedRef = useRef(0);

  const textKey = `journal:${mood.slug}`;
  const voiceKey = `journal-voice:${mood.slug}`;
  const wallKey = `wall:${mood.slug}:${storyIdx}`;

  // Load private draft and voice notes
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setText("");
    setVoiceNotes([]);
    setMicError("");
    setEditingPostId(null);

    (async () => {
      try {
        const result = await storage.get(textKey, false);
        if (!cancelled) setText(result?.value ?? "");
      } catch {
        if (!cancelled) setText("");
      }

      try {
        const result = await storage.get(voiceKey, false);
        if (!cancelled) setVoiceNotes(result?.value ? JSON.parse(result.value) : []);
      } catch {
        if (!cancelled) setVoiceNotes([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (recTimer.current) clearInterval(recTimer.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, [mood.slug, textKey, voiceKey]);

  // Load the wall scoped to current story
  useEffect(() => {
    let cancelled = false;
    setPostsLoaded(false);
    setPosts([]);

    (async () => {
      try {
        const result = await storage.get(wallKey, true);
        if (!cancelled) setPosts(result?.value ? JSON.parse(result.value) : []);
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setPostsLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wallKey]);

  const flashStatus = useCallback((label: string) => {
    setStatus(label);
    setStatusVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setStatusVisible(false), 2200);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    if (!editingPostId) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        storage.set(textKey, value, false).catch(() => {});
      }, 500);
    }
  };

  const handleStartEdit = (post: WallPost) => {
    setEditingPostId(post.id);
    setText(post.content);
    setActiveTab("journal");
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setText("");
  };

  // "Save for myself"
  const handleSaveSelf = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    if (editingPostId) {
      const updated = posts.map((p) =>
        p.id === editingPostId ? { ...p, content: trimmed, timestamp: Date.now() } : p
      );
      try {
        await storage.set(wallKey, JSON.stringify(updated), true);
        setPosts(updated);
        setEditingPostId(null);
        setText("");
        flashStatus("Updated on story wall");
        setActiveTab("wall");
      } catch {
        flashStatus("Couldn't update — try again");
      }
      return;
    }

    const entry: WallPost = {
      id: `${Date.now()}`,
      timestamp: Date.now(),
      content: trimmed,
      isSelf: true,
    };

    const updated = [entry, ...posts].slice(0, 30);
    try {
      await storage.set(textKey, "", false);
      await storage.set(wallKey, JSON.stringify(updated), true);
      setPosts(updated);
      if (onPostStory) onPostStory(trimmed);
      setText("");
      flashStatus("Saved to story wall");
      setActiveTab("wall");
    } catch {
      flashStatus("Couldn't save — try again");
    }
  };

  // "Post it"
  const handlePostAnon = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    if (editingPostId) {
      const updated = posts.map((p) =>
        p.id === editingPostId ? { ...p, content: trimmed, timestamp: Date.now() } : p
      );
      try {
        await storage.set(wallKey, JSON.stringify(updated), true);
        setPosts(updated);
        setEditingPostId(null);
        setText("");
        flashStatus("Updated on story wall!");
        setActiveTab("wall");
      } catch {
        flashStatus("Couldn't update — try again");
      }
      return;
    }

    const entry: WallPost = {
      id: `${Date.now()}`,
      timestamp: Date.now(),
      content: trimmed,
      isSelf: false,
    };

    const updated = [entry, ...posts].slice(0, 30);
    try {
      await storage.set(textKey, "", false);
      await storage.set(wallKey, JSON.stringify(updated), true);
      setPosts(updated);
      if (onPostStory) onPostStory(trimmed);
      setText("");
      flashStatus("Published to stories!");
      setActiveTab("wall");
    } catch {
      flashStatus("Couldn't post — try again");
    }
  };

  const deletePost = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = posts.filter((p) => p.id !== id);
    try {
      await storage.set(wallKey, JSON.stringify(updated), true);
      setPosts(updated);
      if (editingPostId === id) {
        setEditingPostId(null);
        setText("");
      }
      flashStatus("Removed from wall");
    } catch {
      // Ignore
    }
  };

  const persistVoiceNotes = async (updated: VoiceNote[]) => {
    try {
      await storage.set(voiceKey, JSON.stringify(updated), false);
    } catch {
      flashStatus("Couldn't save recording");
    }
  };

  const startRecording = async () => {
    setMicError("");
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setMicError("Microphone access is not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        const dataUrl = await blobToDataURL(blob);
        const entry: VoiceNote = {
          id: `${Date.now()}`,
          timestamp: Date.now(),
          duration: elapsedRef.current,
          dataUrl,
        };
        setVoiceNotes((prev) => {
          const updated = [entry, ...prev].slice(0, MAX_VOICE_NOTES);
          persistVoiceNotes(updated);
          return updated;
        });
        flashStatus("Voice note saved");
        stream.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setElapsed(0);
      elapsedRef.current = 0;
      recTimer.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
      }, 1000);
    } catch {
      setMicError("Couldn't reach the microphone — check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recTimer.current) clearInterval(recTimer.current);
    setRecording(false);
  };

  const deleteVoiceNote = (id: string) => {
    setVoiceNotes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      persistVoiceNotes(updated);
      return updated;
    });
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="pml-journal-clean-container">
      {/* Top Header Segmented Switcher */}
      <div className="pml-journal-topbar">
        <div className="pml-tab-pill-group">
          <button
            onClick={() => setActiveTab("journal")}
            className={`pml-tab-pill ${activeTab === "journal" ? "active" : ""}`}
          >
            <PenLine size={13} />
            <span>{editingPostId ? "Editing" : "Write"}</span>
          </button>
          <button
            onClick={() => setActiveTab("wall")}
            className={`pml-tab-pill ${activeTab === "wall" ? "active" : ""}`}
          >
            <MessageSquare size={13} />
            <span>Story Wall {posts.length > 0 ? `(${posts.length})` : ""}</span>
          </button>
        </div>

        {editingPostId && (
          <button
            onClick={handleCancelEdit}
            className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition-colors"
          >
            <X size={12} />
            <span>Cancel edit</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === "journal" ? (
        <div className="pml-journal-main-area">
          <textarea
            className="pml-journal-clean-textarea"
            value={text}
            placeholder={loaded ? mood.journalPrompt : ""}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={!loaded}
            aria-label={`Journal entry for ${mood.label}`}
            spellCheck={false}
            style={
              {
                caretColor: mood.theme.accent,
              } as React.CSSProperties
            }
          />

          <div className="pml-journal-clean-footer">
            <div className="pml-journal-meta-row">
              <span className="pml-journal-count pml-mono">
                {wordCount > 0
                  ? `${wordCount} WORD${wordCount === 1 ? "" : "S"}`
                  : "NOTHING WRITTEN YET"}
              </span>
              <span
                className={`pml-journal-status pml-mono ${
                  statusVisible ? "opacity-100" : "opacity-0"
                } transition-opacity duration-300`}
              >
                {status}
              </span>
            </div>

            <div className="pml-journal-button-row">
              <button
                className="pml-clean-btn-save"
                onClick={handleSaveSelf}
                disabled={!loaded || !text.trim()}
              >
                <Lock size={13} />
                <span>Save for myself</span>
              </button>

              <button
                className="pml-clean-btn-post"
                onClick={handlePostAnon}
                disabled={!loaded || !text.trim()}
                style={{
                  background: mood.theme.accent,
                  color: "#12080C",
                  boxShadow: `0 4px 20px -2px ${mood.theme.accent}66`,
                }}
              >
                <span>{editingPostId ? "Update thought" : "Post it"}</span>
                {editingPostId ? <Check size={13} /> : <Send size={13} />}
              </button>
            </div>

            <p className="pml-post-subtext">
              Publishing places your reflection on the Story Wall.
            </p>

            <div className="pml-voice-row-container">
              <span className="pml-voice-title pml-mono">VOICE NOTES</span>

              {recording ? (
                <button
                  className="pml-record-pill recording"
                  onClick={stopRecording}
                >
                  <Square size={11} />
                  <span className="pml-mono text-xs">{formatClock(elapsed)}</span>
                </button>
              ) : (
                <button
                  className="pml-record-pill"
                  onClick={startRecording}
                  disabled={!loaded}
                >
                  <Mic size={13} />
                  <span>Record</span>
                </button>
              )}
            </div>

            {micError && <p className="text-xs text-rose-300 mt-2">{micError}</p>}

            {voiceNotes.length > 0 && (
              <div className="pml-voice-list mt-3 max-h-24 overflow-y-auto">
                {voiceNotes.map((note) => (
                  <div className="pml-voice-item" key={note.id}>
                    <span className="pml-voice-meta pml-mono text-[9px]">
                      {formatClock(note.duration || 0)} · {formatWhen(note.timestamp)}
                    </span>
                    <audio
                      className="pml-voice-audio"
                      src={note.dataUrl}
                      controls
                    />
                    <button
                      className="pml-voice-delete"
                      aria-label="Delete voice note"
                      onClick={() => deleteVoiceNote(note.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="pml-journal-main-area">
          <div className="flex items-center justify-between mb-3">
            <div className="pml-mono text-[10px] text-white/50">
              POSTED FOR &ldquo;{storyTitle}&rdquo;
            </div>
            <button
              onClick={() => {
                setEditingPostId(null);
                setText("");
                setActiveTab("journal");
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
            >
              <Plus size={11} />
              <span>Write thought</span>
            </button>
          </div>

          {postsLoaded && posts.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/40">
              <p className="font-serif italic text-lg text-white/60 mb-2">
                No thoughts on the wall for &ldquo;{storyTitle}&rdquo; yet.
              </p>
              <p className="text-xs max-w-xs mb-4">
                Write what this story made you feel and save it to the wall.
              </p>
              <button
                onClick={() => {
                  setEditingPostId(null);
                  setText("");
                  setActiveTab("journal");
                }}
                className="px-4 py-1.5 rounded-full text-xs transition-colors font-medium text-black"
                style={{
                  background: mood.theme.accent,
                }}
              >
                Write a thought
              </button>
            </div>
          )}

          {postsLoaded && posts.length > 0 && (
            <div className="pml-wall-list overflow-y-auto pr-1 flex-1 flex flex-col gap-2.5">
              {posts.map((p) => (
                <div
                  className="pml-wall-item pml-wall-card-interactive backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3 relative group"
                  key={p.id}
                  onClick={() => handleStartEdit(p)}
                  title="Click to edit this reflection"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="pml-wall-time pml-mono text-[9px] text-white/40">
                      {formatWhen(p.timestamp)}
                    </span>
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.isSelf && (
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border text-white/80"
                          style={{
                            borderColor: `${mood.theme.accent}77`,
                            backgroundColor: `${mood.theme.accent}22`,
                          }}
                        >
                          Saved by you
                        </span>
                      )}
                      <button
                        onClick={() => handleStartEdit(p)}
                        className="opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity text-white/40 hover:text-white p-0.5"
                        title="Edit reflection"
                        aria-label="Edit reflection"
                      >
                        <PenLine size={11} />
                      </button>
                      <button
                        onClick={(e) => deletePost(p.id, e)}
                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-white/40 hover:text-rose-400 p-0.5"
                        title="Delete entry"
                        aria-label="Delete entry"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                  <p className="pml-wall-text font-serif italic text-sm leading-relaxed text-neutral-200 m-0">
                    &ldquo;{p.content}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
