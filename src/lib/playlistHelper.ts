/**
 * Helper to parse and extract playlist IDs from YouTube or Spotify URLs/IDs.
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

  // Check Spotify
  if (trimmed.includes("spotify.com") || trimmed.startsWith("spotify:playlist:")) {
    const idMatch =
      trimmed.match(/playlist\/([a-zA-Z0-9]+)/) ||
      trimmed.match(/spotify:playlist:([a-zA-Z0-9]+)/);
    const id = idMatch ? idMatch[1] : trimmed;
    return {
      provider: "spotify",
      id,
      embedUrl: `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`,
    };
  }

  // Check YouTube URL or direct ID
  if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
    const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listMatch) {
      return {
        provider: "youtube",
        id: listMatch[1],
      };
    }
  }

  // If it starts with standard YouTube playlist prefix PL, RD, UU, OLAK5uy_
  if (/^(PL|RD|UU|OLAK5uy_|FL)[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      provider: "youtube",
      id: trimmed,
    };
  }

  // If it's a Spotify 22-character alphanumeric ID
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return {
      provider: "spotify",
      id: trimmed,
      embedUrl: `https://open.spotify.com/embed/playlist/${trimmed}?utm_source=generator&theme=0`,
    };
  }

  // Default to YouTube ID
  return {
    provider: "youtube",
    id: trimmed,
  };
}
