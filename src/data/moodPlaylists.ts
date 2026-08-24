export interface MoodPlaylistConfig {
  playlistId: string; // Paste your full YouTube Playlist URL or raw Playlist ID (PL...)
}

export const moodPlaylists: Record<string, MoodPlaylistConfig> = {
  "in-love": {
    playlistId: "https://open.spotify.com/playlist/0GX1Nf35vyp7s6ZLQBUxRj?si=MJYMBl34RvKTYNPdWWa-MQ&utm_source=whatsapp&pi=Av97Zt0yTUCSY&pt_success=1&nd=1&dlsi=6147ea9655b14220", // Paste your full Love playlist here
  },
  heartbroken: {
    playlistId: "PL3-sRm8xAzY-w9GS19pPWFBEqptdWpY_s", // Paste your full Heartbroken playlist here
  },
  "one-sided": {
    playlistId: "https://music.youtube.com/playlist?list=PLXs1qVXRDTds", // Paste your full One Sided playlist here
  },
  "long-distance": {
    playlistId: "https://music.youtube.com/playlist?list=PLClxOfevhibo", // Paste your full Long Distance playlist here
  },
  lonely: {
    playlistId: "PL6NdkXsTSx62VbYlqA4uRz0g2ZqWjY4A1", // Paste your full Lonely playlist here
  },
  "late-night": {
    playlistId: "PLOzDu-MXXL3gR3k4Y0Y2z6CgQp9_9t1a8", // Paste your full Late Night playlist here
  },
};
