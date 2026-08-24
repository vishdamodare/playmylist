export interface MoodPlaylistConfig {
  playlistId: string; // Complete YouTube Playlist ID (PL...) or full Playlist URL / Spotify URL
}

export const moodPlaylists: Record<string, MoodPlaylistConfig> = {
  "in-love": {
    playlistId: "https://open.spotify.com/playlist/0GX1Nf35vyp7s6ZLQBUxRj?si=MJYMBl34RvKTYNPdWWa-MQ&utm_source=whatsapp&pi=Av97Zt0yTUCSY&pt_success=1&nd=1&dlsi=6147ea9655b14220",
  },
  heartbroken: {
    playlistId: "PLwxNMb28XmpeypJMHfNbJ4RAFkRtmAN3P",
  },
  "one-sided": {
    playlistId: "PLwxNMb28XmpcpxBm1RoGRx4mVKNRIrKkG",
  },
  "long-distance": {
    playlistId: "PLwxNMb28XmpeypJMHfNbJ4RAFkRtmAN3P",
  },
  lonely: {
    playlistId: "PLwxNMb28XmpcpxBm1RoGRx4mVKNRIrKkG",
  },
  "late-night": {
    playlistId: "PLwxNMb28XmpeypJMHfNbJ4RAFkRtmAN3P",
  },
};
