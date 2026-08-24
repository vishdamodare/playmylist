export interface PlayerState {
  isReady: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  currentVideoId?: string;
  currentVideoTitle?: string;
  currentArtist?: string;
  playlistId?: string;
  volume: number;
  error?: string | null;
}

export interface MusicProvider {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  loadPlaylist: (playlistId: string) => void;
}
