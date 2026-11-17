"use client";

import React from "react";
import { PageRain } from "@/components/experience/PageRain";
import { WeatherCanvas } from "@/components/experience/WeatherCanvas";
import { SnowCanvas } from "@/components/experience/SnowCanvas";

export type Weather = "rain" | "storm" | "wind" | "snow" | "sun" | "night";

function seeded(i: number, salt = 1): number {
  const x = Math.sin(i * 12.9898 * salt + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Page-wide weather layer. Pure CSS particles, seeded so SSR/CSR match and nothing jumps on re-render. */
export function PageWeather({ kind, rainVideoSrc }: { kind: Weather; rainVideoSrc?: string }) {
  if (kind === "rain") return <PageRain videoSrc={rainVideoSrc} />;
  if (kind === "storm" || kind === "wind") return <WeatherCanvas kind={kind} />;

  if (kind === "snow") {
    return (
      <div className="pml-page-weather pml-wx pml-wx-snow" aria-hidden="true">
        <div className="pml-snow-tint" />
        <SnowCanvas />
        <div className="pml-frost" />
      </div>
    );
  }

  if (kind === "sun") {
    return (
      <div className="pml-page-weather pml-wx pml-wx-sun" aria-hidden="true">
        <div className="pml-sun-wash" />
        <div className="pml-sun-rays" />
        <div className="pml-sun-orb" />
        {range(4).map((i) => (
          <span key={i} className={`pml-flare f${i}`} />
        ))}
        {range(34).map((i) => (
          <span
            key={i}
            className="pml-glint"
            style={{
              left: `${seeded(i, 5) * 100}%`,
              top: `${seeded(i, 9) * 100}%`,
              animationDuration: `${9 + seeded(i, 21) * 10}s, ${2 + seeded(i, 23) * 3}s`,
              animationDelay: `${-seeded(i, 27) * 12}s, ${-seeded(i, 29) * 4}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // night
  return (
    <div className="pml-page-weather pml-wx pml-wx-night" aria-hidden="true">
      <div className="pml-night-sky" />
      {range(110).map((i) => (
        <span
          key={i}
          className="pml-nstar"
          style={{
            left: `${seeded(i, 31) * 100}%`,
            top: `${Math.pow(seeded(i, 37), 1.6) * 70}%`,
            width: 1 + seeded(i, 41) * 2,
            height: 1 + seeded(i, 41) * 2,
            animationDuration: `${2 + seeded(i, 43) * 4}s`,
            animationDelay: `${-seeded(i, 47) * 6}s`,
          }}
        />
      ))}
      <div className="pml-moon" />
      <span className="pml-shooting" />
      {range(16).map((i) => (
        <span
          key={i}
          className="pml-firefly"
          style={{
            left: `${seeded(i, 53) * 100}%`,
            top: `${45 + seeded(i, 59) * 50}%`,
            animationDuration: `${10 + seeded(i, 61) * 10}s, ${2 + seeded(i, 67) * 2.5}s`,
            animationDelay: `${-seeded(i, 71) * 14}s, ${-seeded(i, 73) * 3}s`,
          }}
        />
      ))}
    </div>
  );
}
