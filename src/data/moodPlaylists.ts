export interface MoodPlaylistConfig {
  playlistId: string; // Complete YouTube Playlist ID (PL...) or full Playlist URL
}

export const moodPlaylists: Record<string, MoodPlaylistConfig> = {
  "in-love": {
    playlistId: "PL4fGSIFgk5kWzZ_7QdYy0u5F6o_xXw",
  },
  heartbroken: {
    playlistId: "PL3-sRm8xAzY-w9GS19pPWFBEqptdWpY_s",
  },
  "one-sided": {
    playlistId: "PLgzTt0k8mXzEk586ze4Bjvy132184n371",
  },
  "long-distance": {
    playlistId: "PLDisKgcnAC4S3dD_3sD_6aZ3xW6v5Z8mJ",
  },
  lonely: {
    playlistId: "PL6NdkXsTSx62VbYlqA4uRz0g2ZqWjY4A1",
  },
  "late-night": {
    playlistId: "PLOzDu-MXXL3gR3k4Y0Y2z6CgQp9_9t1a8",
  },
};
