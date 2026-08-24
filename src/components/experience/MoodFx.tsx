"use client";

import React from "react";
import { Mood } from "@/types/mood";

function seeded(i: number, salt: number = 1): number {
  const x = Math.sin(i * 12.9898 * salt + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function particles(count: number, salt: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    r1: seeded(i, salt),
    r2: seeded(i + 100, salt),
    r3: seeded(i + 200, salt),
    r4: seeded(i + 300, salt),
  }));
}

interface MoodFxProps {
  mood: Mood;
}

export function MoodFx({ mood }: MoodFxProps) {
  const t = mood.theme;

  if (mood.slug === "heartbroken") {
    const drops = particles(26, 1);
    return (
      <div className="pml-visual-fx" aria-hidden="true">
        {drops.map((d) => (
          <div
            key={d.id}
            className="pml-rain"
            style={{
              left: `${d.r1 * 100}%`,
              animationDuration: `${0.7 + d.r2 * 0.8}s`,
              animationDelay: `${-d.r3 * 2}s`,
              opacity: 0.3 + d.r4 * 0.4,
            }}
          />
        ))}
      </div>
    );
  }

  if (mood.slug === "in-love") {
    const glows = particles(14, 2);
    return (
      <div className="pml-visual-fx" aria-hidden="true">
        <div className="pml-raylayer" />
        {glows.map((g) => (
          <div
            key={g.id}
            className="pml-bokeh"
            style={{
              left: `${g.r1 * 100}%`,
              bottom: `${-10 + g.r2 * 20}%`,
              width: `${6 + g.r3 * 16}px`,
              height: `${6 + g.r3 * 16}px`,
              background: g.r4 > 0.5 ? t.accent : t.accent2,
              animationDuration: `${6 + g.r4 * 6}s`,
              animationDelay: `${-g.r2 * 8}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (mood.slug === "one-sided") {
    const motes = particles(12, 3);
    return (
      <div className="pml-visual-fx" aria-hidden="true">
        <div className="pml-lightbeam" />
        {motes.map((m) => (
          <div
            key={m.id}
            className="pml-dust"
            style={{
              left: `${10 + m.r1 * 80}%`,
              top: `${10 + m.r2 * 70}%`,
              width: `${1.5 + m.r3 * 2}px`,
              height: `${1.5 + m.r3 * 2}px`,
              animationDuration: `${7 + m.r4 * 6}s`,
              animationDelay: `${-m.r1 * 10}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (mood.slug === "long-distance") {
    const streaks = particles(6, 4);
    const stars = particles(22, 5);
    return (
      <div className="pml-visual-fx" aria-hidden="true">
        {stars.map((s) => (
          <div
            key={`s${s.id}`}
            className="pml-star"
            style={{
              left: `${s.r1 * 100}%`,
              top: `${s.r2 * 55}%`,
              width: `${1 + s.r3 * 1.5}px`,
              height: `${1 + s.r3 * 1.5}px`,
              animationDuration: `${2 + s.r4 * 3}s`,
              animationDelay: `${-s.r1 * 4}s`,
            }}
          />
        ))}
        {streaks.map((s) => (
          <div
            key={`k${s.id}`}
            className="pml-streak"
            style={{
              top: `${20 + s.r1 * 55}%`,
              width: `${60 + s.r2 * 70}px`,
              background: `linear-gradient(90deg, transparent, ${t.accent2})`,
              animationDuration: `${3 + s.r3 * 3}s`,
              animationDelay: `${-s.r4 * 6}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (mood.slug === "lonely") {
    const motes = particles(9, 6);
    return (
      <div className="pml-visual-fx" aria-hidden="true">
        <div className="pml-streetcone" />
        {motes.map((m) => (
          <div
            key={m.id}
            className="pml-dust"
            style={{
              left: `${5 + m.r1 * 40}%`,
              top: `${8 + m.r2 * 60}%`,
              width: `${1.5 + m.r3 * 1.5}px`,
              height: `${1.5 + m.r3 * 1.5}px`,
              animationDuration: `${8 + m.r4 * 6}s`,
              animationDelay: `${-m.r1 * 10}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (mood.slug === "late-night") {
    return (
      <div className="pml-visual-fx" aria-hidden="true">
        <div
          className="pml-glowpulse"
          style={{
            left: "58%",
            top: "62%",
            width: 140,
            height: 140,
            background: t.accent2,
          }}
        />
        <div className="pml-fanwrap">
          <div className="pml-fanblade" style={{ transform: "rotate(0deg)" }} />
          <div className="pml-fanblade" style={{ transform: "rotate(120deg)" }} />
          <div className="pml-fanblade" style={{ transform: "rotate(240deg)" }} />
        </div>
      </div>
    );
  }

  return null;
}
