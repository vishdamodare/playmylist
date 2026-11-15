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
        bottom: "0px",
        right: "0px",
        // 200×200 is YouTube's minimum embed size; a smaller player nudges it to a lower video
        // quality, so the (invisible) video costs less to decode — we only need the audio.
        width: "200px",
        height: "200px",
        opacity: 0.02,
        pointerEvents: "none",
        zIndex: -50,
        overflow: "hidden",
      }}
    >
      <div id={containerId} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
