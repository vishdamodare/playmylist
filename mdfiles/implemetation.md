# PlayMyList — Implement Real YouTube Mood Playlist Playback

You are working on the existing **PlayMyList** Next.js project.

IMPORTANT:

The PlayMyList frontend/design has already been created.

**DO NOT redesign the website.**

**DO NOT replace the existing UI.**

**DO NOT rebuild the homepage.**

Your job in this phase is to integrate **real YouTube playlist playback into the existing PlayMyList frontend** while preserving the existing visual design, animations, layout, typography, mood cards, and overall aesthetic.

---

# 1. GOAL

The core functionality should be:

```text
User opens PlayMyList
        ↓
User sees moods
        ↓
User clicks a mood
        ↓
PlayMyList identifies the YouTube playlist assigned to that mood
        ↓
YouTube playlist loads
        ↓
The first song starts playing
        ↓
The existing PlayMyList music player UI reflects the real playback
```

Example:

```text
Heartbroken
      ↓
YouTube playlist ID for Heartbroken
      ↓
Load playlist
      ↓
Play first song
```

---

# 2. TECHNOLOGY

Use the existing project stack.

Use:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Framer Motion
* Lucide React
* YouTube IFrame Player API

Do NOT introduce unnecessary technologies.

Do NOT add:

* Redux
* Zustand
* Express
* GraphQL
* separate backend
* database
* authentication
* Spotify integration
* AI

Those will be handled later.

---

# 3. YOUTUBE PLAYLIST ARCHITECTURE

Create a central configuration/data file for mood playlists.

For example:

```text
src/data/moodPlaylists.ts
```

Structure it similarly to:

```ts
export const moodPlaylists = {
  love: {
    name: "I'm in Love",
    playlistId: "YOUR_PLAYLIST_ID",
  },

  heartbroken: {
    name: "Heartbroken",
    playlistId: "YOUR_PLAYLIST_ID",
  },

  oneSided: {
    name: "One Sided",
    playlistId: "YOUR_PLAYLIST_ID",
  },

  longDistance: {
    name: "Long Distance",
    playlistId: "YOUR_PLAYLIST_ID",
  },

  lonely: {
    name: "Lonely",
    playlistId: "YOUR_PLAYLIST_ID",
  },

  lateNight: {
    name: "Late Night",
    playlistId: "YOUR_PLAYLIST_ID",
  },
};
```

Use placeholders for now.

Make it extremely easy for me to replace the playlist IDs later.

---

# 4. YOUTUBE IFRAME PLAYER API

Use the official **YouTube IFrame Player API**.

Do not simply redirect users to YouTube.

Do not open a new browser tab.

Do not use a normal YouTube link as the primary playback mechanism.

The YouTube player should be integrated into the PlayMyList experience.

Create a reusable component such as:

```text
src/components/player/YouTubePlayer.tsx
```

The component should:

* initialize the YouTube player
* accept a playlist ID
* load a playlist
* play the playlist
* expose playback state
* expose current video information
* support play
* pause
* next
* previous
* seek
* volume
* playlist changes
* cleanup on unmount

---

# 5. MOOD CLICK FLOW

When the user clicks a mood card:

```text
MoodCard
    ↓
handleMoodSelect(mood)
    ↓
Find playlist configuration
    ↓
Get playlistId
    ↓
YouTubePlayer.loadPlaylist()
    ↓
YouTubePlayer.playVideo()
```

For example:

```ts
handleMoodSelect("heartbroken");
```

should resolve:

```ts
moodPlaylists.heartbroken.playlistId
```

and load that playlist.

---

# 6. DO NOT BREAK EXISTING MOOD EXPERIENCE

The existing mood experience is already designed.

Keep:

* existing background
* existing visual system
* existing typography
* existing story UI
* existing mood colors
* existing animations
* existing layout
* existing responsive behavior

Only connect the real playback functionality.

The user experience should feel like:

```text
Mood
 ↓
Story + Visual
 ↓
Real YouTube Music
```

---

# 7. MUSIC PLAYER UI

There is already a PlayMyList music-player design.

Keep the existing design.

Connect its controls to the actual YouTube player.

The existing:

```text
Play
Pause
Next
Previous
Progress
Volume
```

controls should control the real YouTube playback.

Do not create a second unrelated player UI.

There should be one PlayMyList music player.

---

# 8. PLAYER STATE

Create a clean player state model.

At minimum support:

```ts
type PlayerState = {
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentVideoId?: string;
  currentVideoTitle?: string;
  currentArtist?: string;
  playlistId?: string;
  volume: number;
};
```

Keep this state architecture easy to extend later.

---

# 9. YOUTUBE PLAYER EVENTS

Handle important YouTube events:

* onReady
* onStateChange
* onError
* playback progress
* video change

Use these events to keep the PlayMyList UI synchronized with the actual YouTube player.

For example:

```text
YouTube starts playing
        ↓
PlayMyList play button becomes pause
        ↓
Progress bar updates
        ↓
Current song information updates
```

When the song finishes:

```text
Song finishes
      ↓
YouTube advances
      ↓
PlayMyList detects new song
      ↓
UI updates
```

---

# 10. AUTOPLAY

The desired behavior is:

```text
User clicks mood
      ↓
Load playlist
      ↓
Start playback
```

This click is an explicit user interaction, so use that interaction to initiate playback.

Do not attempt to autoplay audio when the user simply lands on the homepage.

The homepage should remain silent until the user explicitly selects a mood/playback action.

---

# 11. YOUTUBE PLAYER VISIBILITY

The YouTube player should not dominate the PlayMyList UI.

The PlayMyList experience should remain the visual focus.

The player can be visually minimized/embedded according to the capabilities and requirements of the YouTube IFrame API.

However:

**Do not implement anything that violates YouTube's player/API requirements.**

Do not attempt to completely fake YouTube playback.

Do not remove required YouTube branding or controls in ways prohibited by YouTube policies.

---

# 12. CURRENT SONG INFORMATION

When YouTube changes the current song, retrieve the available video information and update:

```text
Song title
Artist/channel
Thumbnail
Duration
Progress
```

The PlayMyList player should display this information.

If YouTube does not expose a specific piece of metadata through the player API, gracefully handle it rather than inventing data.

---

# 13. MOOD → PLAYLIST MAPPING

Use a single source of truth.

Do NOT scatter playlist IDs throughout components.

Bad:

```ts
if (mood === "love") {
  playlistId = "...";
}

if (mood === "heartbroken") {
  playlistId = "...";
}
```

Instead:

```text
mood
 ↓
moodPlaylists
 ↓
playlistId
 ↓
YouTubePlayer
```

This will make it easy to add 20+ moods later.

---

# 14. FUTURE-PROOF ARCHITECTURE

The architecture should eventually allow:

```text
PlayMyList
     │
     ├── YouTube
     │
     └── Spotify
```

But DO NOT implement Spotify now.

Create a clean abstraction if appropriate:

```ts
interface MusicProvider {
  play(): void;
  pause(): void;
  next(): void;
  previous(): void;
  seek(seconds: number): void;
  setVolume(volume: number): void;
}
```

However, don't over-engineer this.

Only implement the YouTube provider now.

---

# 15. STORIES AND VISUALS

For now, keep the existing mock stories and visuals.

When a mood is selected:

```text
Mood selected
      ↓
Playlist loads
      +
Mood stories appear
      +
Mood visual appears
```

Do not build AI story matching yet.

Do not build external Reddit ingestion yet.

Do not build database functionality yet.

---

# 16. ERROR HANDLING

Handle cases such as:

### Invalid playlist

Show a subtle message:

> This playlist isn't available right now.

Do not crash the application.

### YouTube API failure

Keep the rest of the PlayMyList experience usable.

### Video unavailable

Allow YouTube to move to the next available video where possible.

### Network failure

Show a graceful playback error.

Never leave the UI in a permanently loading state.

---

# 17. ENVIRONMENT VARIABLES

If the implementation requires a YouTube API key for any functionality, clearly document the required environment variable.

Do not expose secret credentials in client-side source code.

If the IFrame Player API functionality being used does not require a key, do not unnecessarily add one.

Create/update:

```text
.env.example
```

only if necessary.

---

# 18. COMPONENT ARCHITECTURE

Keep the implementation modular.

Suggested structure:

```text
src/
├── components/
│   ├── player/
│   │   ├── YouTubePlayer.tsx
│   │   ├── MusicPlayer.tsx
│   │   └── PlayerControls.tsx
│   │
│   ├── mood/
│   │   └── MoodCard.tsx
│   │
│   └── experience/
│       └── MoodExperience.tsx
│
├── data/
│   └── moodPlaylists.ts
│
├── hooks/
│   └── useYouTubePlayer.ts
│
└── types/
    └── player.ts
```

Adapt this structure to the existing project rather than blindly creating duplicate files.

---

# 19. IMPORTANT: INSPECT EXISTING CODE FIRST

Before changing anything:

1. Inspect the current project structure.
2. Find the existing mood components.
3. Find the existing music player component.
4. Find the existing mood experience page.
5. Find the existing state management.
6. Determine how mood selection currently works.
7. Reuse existing components wherever possible.

Do not duplicate functionality.

Do not create competing components that perform the same job.

---

# 20. TESTING CHECKLIST

After implementation, verify:

### Mood selection

* [ ] Clicking Love loads the Love playlist.
* [ ] Clicking Heartbroken loads the Heartbroken playlist.
* [ ] Clicking One Sided loads the One Sided playlist.
* [ ] Clicking Long Distance loads the Long Distance playlist.
* [ ] Clicking Lonely loads the Lonely playlist.
* [ ] Clicking Late Night loads the Late Night playlist.

### Playback

* [ ] First song starts after mood selection.
* [ ] Play works.
* [ ] Pause works.
* [ ] Next works.
* [ ] Previous works.
* [ ] Progress updates.
* [ ] Seeking works.
* [ ] Volume works.
* [ ] Song changes update the UI.
* [ ] Playlist changes work when another mood is selected.

### UI

* [ ] Existing design is preserved.
* [ ] Existing animations are preserved.
* [ ] Mobile layout still works.
* [ ] No layout shift caused by YouTube player.
* [ ] No console errors.
* [ ] No hydration errors.

### Error handling

* [ ] Invalid playlist does not crash the page.
* [ ] Unavailable video is handled gracefully.
* [ ] YouTube API errors are handled.
* [ ] Loading states work correctly.

---

# 21. PLACEHOLDER PLAYLIST IDS

Until I provide the real playlist IDs, use clearly identifiable placeholders:

```ts
const moodPlaylists = {
  love: "REPLACE_WITH_LOVE_PLAYLIST_ID",
  heartbroken: "REPLACE_WITH_HEARTBROKEN_PLAYLIST_ID",
  oneSided: "REPLACE_WITH_ONE_SIDED_PLAYLIST_ID",
  longDistance: "REPLACE_WITH_LONG_DISTANCE_PLAYLIST_ID",
  lonely: "REPLACE_WITH_LONELY_PLAYLIST_ID",
  lateNight: "REPLACE_WITH_LATE_NIGHT_PLAYLIST_ID",
};
```

Make replacing these values later extremely easy.

Do not fabricate real playlist IDs.

---

# 22. FINAL REQUIREMENT

The final user experience must be:

```text
PLAYMYLIST

"What does your heart sound like tonight?"

        ↓

     Heartbroken

        ↓

YouTube playlist loads

        ↓

First song starts

        ↓

Heartbroken visual appears

        ↓

Heartbreak story appears

        ↓

PlayMyList music player displays
the real current YouTube song

        ↓

User can control playback
without leaving PlayMyList
```

The goal is not simply to "embed YouTube."

The goal is to make YouTube the **music engine underneath the existing PlayMyList cinematic experience**.

Preserve the existing design and implement the playback functionality cleanly, modularly, and in a way that can later support Spotify as another music provider.
