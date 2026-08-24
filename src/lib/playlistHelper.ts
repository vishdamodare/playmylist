/**
 * Helper to parse and extract playlist IDs and embed URLs from YouTube or Spotify URLs/IDs.
 */

export interface ParsedPlaylist {
  provider: "youtube" | "spotify" | "unknown";
  id: string;
  embedUrl?: string;
}

export function parsePlaylistInput(input: string): ParsedPlaylist {
  if (!input || input.startsWith("REPLACE_WITH")) {
    return { provider: "unknown", id: "" };
  }

  const trimmed = input.trim();

  // Extract base before any query parameters for check
  const base = trimmed.split("?")[0].split("&")[0].trim();

  // Check Spotify URL or URI
  if (trimmed.includes("spotify.com") || trimmed.startsWith("spotify:playlist:")) {
    const idMatch =
      trimmed.match(/playlist\/([a-zA-Z0-9]+)/) ||
      trimmed.match(/spotify:playlist:([a-zA-Z0-9]+)/);
    const id = idMatch ? idMatch[1] : base;
    return {
      provider: "spotify",
      id,
      embedUrl: `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`,
    };
  }

  // Check if base is a Spotify 22-character ID (or contains Spotify query markers)
  if (
    /^[a-zA-Z0-9]{22}$/.test(base) ||
    trimmed.includes("si=") ||
    trimmed.includes("flow_ctx=")
  ) {
    const id = /^[a-zA-Z0-9]{22}$/.test(base) ? base : base.split("?")[0];
    return {
      provider: "spotify",
      id,
      embedUrl: `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`,
    };
  }

  // Check YouTube URL
  if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
    const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listMatch) {
      return {
        provider: "youtube",
        id: listMatch[1],
      };
    }
  }

  // If it starts with standard YouTube playlist prefix PL, RD, UU, OLAK5uy_, FL
  if (/^(PL|RD|UU|OLAK5uy_|FL)[a-zA-Z0-9_-]+$/.test(base)) {
    return {
      provider: "youtube",
      id: base,
    };
  }

  // Fallback default
  return {
    provider: base.startsWith("PL") ? "youtube" : "spotify",
    id: base,
    embedUrl: `https://open.spotify.com/embed/playlist/${base}?utm_source=generator&theme=0`,
  };
}
