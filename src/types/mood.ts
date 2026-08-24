export interface Theme {
  from: string;
  via: string;
  to: string;
  accent: string;
  accent2: string;
  pulse: number;
}

export interface Story {
  id?: string;
  title: string;
  author: string;
  tags: string[];
  content: string;
  likes?: number;
}

export interface WallItem {
  text: string;
  author: string;
}

export interface TrackPlaceholder {
  title: string;
  artist: string;
  duration: string;
}

export interface Mood {
  slug: string;
  label: string;
  group: string;
  theme: Theme;
  quote: string;
  visualLabel: string;
  journalPrompt?: string;
  stories: Story[];
  playlistName: string;
  tracks?: TrackPlaceholder[];
  wall?: WallItem[];
  rainVideoSrc?: string;
}
