"use client";

import React from "react";

function seeded(i: number, salt = 1): number {
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

interface PageRainProps {
  videoSrc?: string;
}

export function PageRain({ videoSrc }: PageRainProps) {
  const drops = particles(70, 21);

  return (
    <div className="pml-page-weather" aria-hidden="true">
      {videoSrc && (
        <video
          className="pml-page-rain-video"
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
        />
      )}
      <div className="pml-page-rain-fallback">
        {drops.map((d) => (
          <div
            key={d.id}
            className="pml-page-rain-drop"
            style={{
              left: `${d.r1 * 100}%`,
              height: `${50 + d.r2 * 60}px`,
              animationDuration: `${0.55 + d.r3 * 0.6}s`,
              animationDelay: `${-d.r4 * 2.4}s`,
              opacity: 0.3 + d.r2 * 0.5,
            }}
          />
        ))}
      </div>
      <div className="pml-page-mist" />
    </div>
  );
}
