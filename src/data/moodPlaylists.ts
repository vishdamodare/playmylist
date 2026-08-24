export interface MoodPlaylistConfig {
  playlistId: string | string[]; // Can be a single song ID, an array of song IDs, or a playlist URL/ID
}

export const moodPlaylists: Record<string, MoodPlaylistConfig> = {
  "in-love": {
    playlistId: [],
  },
  heartbroken: {
    playlistId: [],
  },
  "one-sided": {
    playlistId: [],
  },
  "long-distance": {
    playlistId: [],
  },
  lonely: {
    playlistId: [],
  },
  "late-night": {
    playlistId: [],
  },
};
