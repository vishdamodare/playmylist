/**
 * Helper to parse and extract playlist/video IDs and embed URLs from YouTube or Spotify URLs/IDs.
 */

export interface ParsedPlaylist {
  provider: "youtube" | "spotify" | "unknown";
  type: "playlist" | "video";
  id: string;
  embedUrl?: string;
}

export function parsePlaylistInput(input: string): ParsedPlaylist {
  if (!input || input.startsWith("REPLACE_WITH")) {
    return { provider: "unknown", type: "playlist", id: "" };
  }

  const trimmed = input.trim();

  // Extract base before any query parameters for check
  const base = trimmed.split("?")[0].split("&")[0].trim();

  // Check Spotify URL or URI or 22-char ID
  if (
    trimmed.includes("spotify.com") ||
    trimmed.startsWith("spotify:playlist:") ||
    trimmed.startsWith("spotify:track:") ||
    trimmed.startsWith("spotify:album:")
  ) {
    const idMatch =
      trimmed.match(/playlist\/([a-zA-Z0-9]+)/) ||
      trimmed.match(/album\/([a-zA-Z0-9]+)/) ||
      trimmed.match(/track\/([a-zA-Z0-9]+)/) ||
      trimmed.match(/spotify:(?:playlist|album|track):([a-zA-Z0-9]+)/);
    const id = idMatch ? idMatch[1] : base;
    return {
      provider: "spotify",
      type: "playlist",
      id,
      embedUrl: `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`,
    };
  }

  if (
    (/^[a-zA-Z0-9]{22}$/.test(base) && !base.startsWith("PL")) ||
    trimmed.includes("si=") ||
    trimmed.includes("flow_ctx=")
  ) {
    const id = /^[a-zA-Z0-9]{22}$/.test(base) ? base : base.split("?")[0];
    return {
      provider: "spotify",
      type: "playlist",
      id,
      embedUrl: `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`,
    };
  }

  // Check YouTube single video / music watch link (watch?v=...)
  if (trimmed.includes("watch?v=") || trimmed.includes("watch/") || trimmed.includes("youtu.be/")) {
    const vMatch =
      trimmed.match(/[?&]v=([0-9A-Za-z_-]{11})/) ||
      trimmed.match(/youtu\.be\/([0-9A-Za-z_-]{11})/);
    if (vMatch) {
      return {
        provider: "youtube",
        type: "video",
        id: vMatch[1],
      };
    }
  }

  // Check YouTube playlist link (?list=...)
  if (trimmed.includes("list=")) {
    const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listMatch) {
      return {
        provider: "youtube",
        type: "playlist",
        id: listMatch[1],
      };
    }
  }

  // If it starts with standard YouTube playlist prefix PL, RD, UU, OLAK5uy_, FL
  if (/^(PL|RD|UU|OLAK5uy_|FL)[a-zA-Z0-9_-]+$/.test(base)) {
    return {
      provider: "youtube",
      type: "playlist",
      id: base,
    };
  }

  // If it's an 11-char YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(base)) {
    return {
      provider: "youtube",
      type: "video",
      id: base,
    };
  }

  // Fallback
  return {
    provider: base.startsWith("PL") ? "youtube" : "spotify",
    type: "playlist",
    id: base,
    embedUrl: `https://open.spotify.com/embed/playlist/${base}?utm_source=generator&theme=0`,
  };
}
