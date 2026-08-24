export interface MoodPlaylistConfig {
  playlistId: string; // Paste your full YouTube Playlist URL or raw Playlist ID (PL...)
}

export const moodPlaylists: Record<string, MoodPlaylistConfig> = {
  "in-love": {
    playlistId: "PL4fGSIFgk5kWzZ_7QdYy0u5F6o_xXw", // Paste your full Love playlist here
  },
  heartbroken: {
    playlistId: "PL3-sRm8xAzY-w9GS19pPWFBEqptdWpY_s", // Paste your full Heartbroken playlist here
  },
  "one-sided": {
    playlistId: "PLgzTt0k8mXzEk586ze4Bjvy132184n371", // Paste your full One Sided playlist here
  },
  "long-distance": {
    playlistId: "PLDisKgcnAC4S3dD_3sD_6aZ3xW6v5Z8mJ", // Paste your full Long Distance playlist here
  },
  lonely: {
    playlistId: "PL6NdkXsTSx62VbYlqA4uRz0g2ZqWjY4A1", // Paste your full Lonely playlist here
  },
  "late-night": {
    playlistId: "PLOzDu-MXXL3gR3k4Y0Y2z6CgQp9_9t1a8", // Paste your full Late Night playlist here
  },
};
