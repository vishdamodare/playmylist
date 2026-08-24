"use client";

import React from "react";

interface YouTubePlayerProps {
  containerId?: string;
}

export function YouTubePlayer({
  containerId = "youtube-player-element",
}: YouTubePlayerProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        width: "200px",
        height: "120px",
        opacity: 0.001,
        pointerEvents: "none",
        zIndex: -50,
        overflow: "hidden",
      }}
    >
      <div id={containerId} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
