/**
 * Helper to parse and extract playlist/video IDs and embed URLs from YouTube or Spotify URLs/IDs.
 */

export interface ParsedPlaylist {
  provider: "youtube" | "spotify" | "unknown";
  type: "playlist" | "video";
  id: string;
  embedUrl?: string;
}

const VIDEO_ID = "([0-9A-Za-z_-]{11})";
const VIDEO_PATTERNS = [
  new RegExp(`[?&]v=${VIDEO_ID}`), // youtube.com/watch?v=, music.youtube.com/watch?v=
  new RegExp(`youtu\\.be/${VIDEO_ID}`),
  new RegExp(`youtube\\.com/(?:shorts|embed|live|v)/${VIDEO_ID}`),
];

/** Pulls the 11-char video ID out of any YouTube song link (or a bare ID). Ignores `list=`. */
export function extractVideoId(input: string): string | null {
  const s = input.trim();
  if (/^[0-9A-Za-z_-]{11}$/.test(s)) return s;
  for (const re of VIDEO_PATTERNS) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

export function parsePlaylistInput(input: string): ParsedPlaylist {
  if (!input || input.startsWith("REPLACE_WITH")) {
    return { provider: "unknown", type: "playlist", id: "" };
  }

  const trimmed = input.trim();
  const base = trimmed.split("?")[0].split("&")[0].trim();
  // YouTube share links carry `?si=` too, so the Spotify heuristics below must skip them.
  const isYouTubeUrl = /youtube\.com|youtu\.be/i.test(trimmed);

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
    !isYouTubeUrl &&
    ((/^[a-zA-Z0-9]{22}$/.test(base) && !base.startsWith("PL") && !base.startsWith("RD")) ||
      trimmed.includes("si=") ||
      trimmed.includes("flow_ctx="))
  ) {
    const id = /^[a-zA-Z0-9]{22}$/.test(base) ? base : base.split("?")[0];
    return {
      provider: "spotify",
      type: "playlist",
      id,
      embedUrl: `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`,
    };
  }

  // 1. Check YouTube playlist parameter (?list=... or &list=...)
  if (trimmed.includes("list=")) {
    const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listMatch && listMatch[1]) {
      return {
        provider: "youtube",
        type: "playlist",
        id: listMatch[1],
      };
    }
  }

  // 2. If it starts with standard YouTube playlist prefix PL, RD, UU, OLAK5uy_, FL
  if (/^(PL|RD|UU|OLAK5uy_|FL)[a-zA-Z0-9_-]+$/.test(base)) {
    return {
      provider: "youtube",
      type: "playlist",
      id: base,
    };
  }

  // 3. Single video link or bare 11-char video ID
  const videoId = extractVideoId(trimmed);
  if (videoId) {
    return { provider: "youtube", type: "video", id: videoId };
  }

  // Fallback
  return {
    provider: base.startsWith("PL") || base.startsWith("RD") ? "youtube" : "spotify",
    type: "playlist",
    id: base,
    embedUrl: `https://open.spotify.com/embed/playlist/${base}?utm_source=generator&theme=0`,
  };
}
