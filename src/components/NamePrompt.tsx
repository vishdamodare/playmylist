"use client";

import React, { useEffect, useRef, useState } from "react";
import { saveName, skipName, useProfile } from "@/lib/profile";

/** The "What should we call you?" card. Mounted once; opened by askName(). */
export function NamePrompt() {
  const { asking, name } = useProfile();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!asking) return;
    setValue(name ?? "");
    setError("");
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skipName();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [asking, name]);

  if (!asking) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      await saveName(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save — try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pml-name-scrim" onClick={(e) => e.target === e.currentTarget && skipName()}>
      <form className="pml-name-card" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="pml-name-q">
        <span className="pml-name-kicker pml-mono">Before you press play</span>
        <h2 id="pml-name-q">
          What should we <em>call you?</em>
        </h2>
        <p>A first name, a nickname, a 2AM alias. It signs your stories and every mood will say hi.</p>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={24}
          placeholder="e.g. Vish, Moonchild, Someone at 3AM"
          aria-label="Your name"
          autoComplete="nickname"
        />
        {error && (
          <p className="pml-name-error" role="alert">
            {error}
          </p>
        )}
        <div className="pml-name-actions">
          <button type="button" className="ghost" onClick={skipName}>
            Stay anonymous
          </button>
          <button type="submit" disabled={!value.trim() || saving}>
            {saving ? "Saving…" : name ? "Change it" : "Call me this"}
          </button>
        </div>
      </form>
    </div>
  );
}
