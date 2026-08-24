export interface MoodPlaylistConfig {
  playlistId: string | string[]; // Full YouTube Playlist ID (PL...), Playlist URL, or array of YouTube track URLs
}

export const moodPlaylists: Record<string, MoodPlaylistConfig> = {
  "in-love": {
    playlistId: [
      "https://www.youtube.com/watch?v=2Vv-BfVoq4g", // Perfect - Ed Sheeran
      "https://www.youtube.com/watch?v=GxldQ9eX2wo", // Until I Found You - Stephen Sanchez
      "https://www.youtube.com/watch?v=PEM0Vs8jf1w", // Golden Hour - JVKE
      "https://www.youtube.com/watch?v=lp-EO5I60KA", // Thinking Out Loud
    ],
  },
  heartbroken: {
    playlistId: [
      "https://www.youtube.com/watch?v=kocA_1m9C0Y", // Alag Aasmaan - Anuv Jain
      "https://www.youtube.com/watch?v=zABLecsR5UE", // Someone You Loved - Lewis Capaldi
      "https://www.youtube.com/watch?v=51u5fnyrGj4", // Arcade - Duncan Laurence
      "https://www.youtube.com/watch?v=Ha4fSclVanI", // Husn - Anuv Jain
    ],
  },
  "one-sided": {
    playlistId: [
      "https://www.youtube.com/watch?v=Ha4fSclVanI", // Husn - Anuv Jain
      "https://www.youtube.com/watch?v=cG4ME1stMS4", // Faasle - Aditya Rikhari
      "https://www.youtube.com/watch?v=kocA_1m9C0Y", // Alag Aasmaan - Anuv Jain
      "https://www.youtube.com/watch?v=mD_u6Bv3V6w", // Baarishein - Anuv Jain
    ],
  },
  "long-distance": {
    playlistId: [
      "https://www.youtube.com/watch?v=cG4ME1stMS4", // Faasle - Aditya Rikhari
      "https://www.youtube.com/watch?v=Ha4fSclVanI", // Husn - Anuv Jain
      "https://www.youtube.com/watch?v=0k1gZ2_C4vE", // Mishri - Anuv Jain
      "https://www.youtube.com/watch?v=33z_LqE0x2Y", // Riha - Anuv Jain
    ],
  },
  lonely: {
    playlistId: [
      "https://www.youtube.com/watch?v=jfKfPfyJRdk", // Lofi Hip Hop Chill Beats
      "https://www.youtube.com/watch?v=5qap5aO4i9A", // Midnight City Lights Beats
      "https://www.youtube.com/watch?v=kocA_1m9C0Y", // Alag Aasmaan
    ],
  },
  "late-night": {
    playlistId: [
      "https://www.youtube.com/watch?v=5qap5aO4i9A", // Late Night Beats
      "https://www.youtube.com/watch?v=jfKfPfyJRdk", // Lofi Girl Midnight
      "https://www.youtube.com/watch?v=Ha4fSclVanI", // Husn
    ],
  },
};
