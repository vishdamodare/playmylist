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
      className="fixed -top-[9999px] -left-[9999px] w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div id={containerId} className="w-full h-full" />
    </div>
  );
}
