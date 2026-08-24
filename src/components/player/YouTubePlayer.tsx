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
      className="fixed bottom-0 right-0 w-[320px] h-[200px] opacity-[0.005] pointer-events-none overflow-hidden -z-50"
      aria-hidden="true"
      style={{ clipPath: "inset(100%)" }}
    >
      <div id={containerId} className="w-full h-full" />
    </div>
  );
}
