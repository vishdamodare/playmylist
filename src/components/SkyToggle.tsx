"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";

/** Compact Morning/Night switch for page headers. The choice applies to the whole site. */
export function SkyToggle({ mode, onChange }: { mode: "morning" | "night"; onChange: (m: "morning" | "night") => void }) {
  const morning = mode === "morning";
  return (
    <button
      className={`pml-skytoggle ${morning ? "is-morning" : ""}`}
      onClick={() => onChange(morning ? "night" : "morning")}
      aria-label={morning ? "Switch to night" : "Switch to morning"}
      title={morning ? "Switch to night" : "Switch to morning"}
    >
      <span className="pml-skytoggle-knob">{morning ? <Sun size={13} /> : <Moon size={13} />}</span>
      <span className="pml-skytoggle-label">{morning ? "Morning" : "Night"}</span>
    </button>
  );
}
