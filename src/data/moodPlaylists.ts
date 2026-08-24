export interface MoodPlaylistConfig {
  playlistId?: string; // YouTube or Spotify single URL / Playlist URL
  tracks?: string[];   // Array of YouTube track URLs for Next/Previous cycling
}

export const moodPlaylists: Record<string, MoodPlaylistConfig> = {
  "in-love": {
    tracks: [
      "https://www.youtube.com/watch?v=fHI8X4893Ts", // Perfect
      "https://www.youtube.com/watch?v=lp-EO5I60KA", // Thinking Out Loud
      "https://www.youtube.com/watch?v=kJQP7kiw5Fk", // Romance
      "https://www.youtube.com/watch?v=2Vv-BfVoq4g", // Acoustic
    ],
  },
  "one-sided": {
    tracks: [
      "https://www.youtube.com/watch?v=Ha4fSclVanI", // Husn - Anuv Jain
      "https://www.youtube.com/watch?v=cG4ME1stMS4", // Faasle - Aditya Rikhari
      "https://www.youtube.com/watch?v=kocA_1m9C0Y", // Alag Aasmaan
      "https://www.youtube.com/watch?v=fHI8X4893Ts", // Acoustic
    ],
  },
  "long-distance": {
    tracks: [
      "https://www.youtube.com/watch?v=cG4ME1stMS4", // Faasle - Aditya Rikhari
      "https://www.youtube.com/watch?v=Ha4fSclVanI", // Husn - Anuv Jain
      "https://www.youtube.com/watch?v=5qap5aO4i9A", // Lofi Late Night
      "https://www.youtube.com/watch?v=jfKfPfyJRdk", // Lofi Chill
    ],
  },
  heartbroken: {
    tracks: [
      "https://www.youtube.com/watch?v=kocA_1m9C0Y",
      "https://www.youtube.com/watch?v=Ha4fSclVanI",
      "https://www.youtube.com/watch?v=cG4ME1stMS4",
    ],
  },
  lonely: {
    tracks: [
      "https://www.youtube.com/watch?v=jfKfPfyJRdk",
      "https://www.youtube.com/watch?v=5qap5aO4i9A",
      "https://www.youtube.com/watch?v=kocA_1m9C0Y",
    ],
  },
  "late-night": {
    tracks: [
      "https://www.youtube.com/watch?v=5qap5aO4i9A",
      "https://www.youtube.com/watch?v=jfKfPfyJRdk",
      "https://www.youtube.com/watch?v=Ha4fSclVanI",
    ],
  },
};
