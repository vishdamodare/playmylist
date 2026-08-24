export interface MoodPlaylistConfig {
  playlistId: string; // Accepts YouTube playlist ID/URL OR Spotify playlist ID/URL
  type?: "youtube" | "spotify";
}

export const moodPlaylists: Record<string, MoodPlaylistConfig> = {
  "in-love": {
    playlistId: "0GX1Nf35vyp7s6ZLQBUxRj?si=MJYMBl34RvKTYNPdWWa-MQ&pi=Av97Zt0yTUCSY&flow_ctx=88f82793-9b8e-419f-9a12-ef97385c8907%3A1787614877&utm_source=whatsapp&pt_success=1&nd=1&dlsi=20c707b19e344f15",
  },
  heartbroken: {
    playlistId: "https://music.youtube.com/watch?v=kocA_1m9C0Y",
  },
  "one-sided": {
    playlistId: "https://music.youtube.com/watch?v=Ha4fSclVanI&list=PLXs1qVXRDTds",
  },
  "long-distance": {
    playlistId: "https://music.youtube.com/watch?v=cG4ME1stMS4&list=PLClxOfevhibo",
  },
  lonely: {
    playlistId: "https://music.youtube.com/watch?v=jfKfPfyJRdk",
  },
  "late-night": {
    playlistId: "https://music.youtube.com/watch?v=5qap5aO4i9A",
  },
};
