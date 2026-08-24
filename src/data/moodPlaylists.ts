export interface MoodPlaylistConfig {
  playlistId: string; // Accepts YouTube playlist ID/URL OR Spotify playlist ID/URL
  type?: "youtube" | "spotify";
}

export const moodPlaylists: Record<string, MoodPlaylistConfig> = {
  "in-love": {
    playlistId: "REPLACE_WITH_LOVE_PLAYLIST_ID",
  },
  heartbroken: {
    playlistId: "REPLACE_WITH_HEARTBROKEN_PLAYLIST_ID",
  },
  "one-sided": {
    playlistId: "REPLACE_WITH_ONE_SIDED_PLAYLIST_ID",
  },
  "long-distance": {
    playlistId: "REPLACE_WITH_LONG_DISTANCE_PLAYLIST_ID",
  },
  lonely: {
    playlistId: "REPLACE_WITH_LONELY_PLAYLIST_ID",
  },
  "late-night": {
    playlistId: "REPLACE_WITH_LATE_NIGHT_PLAYLIST_ID",
  },
};
