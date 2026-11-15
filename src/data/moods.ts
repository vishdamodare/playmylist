import { Mood } from "@/types/mood";

export const MOODS: Mood[] = [
  {
    slug: "in-love",
    label: "I'm in Love",
    group: "Love",
    theme: {
      from: "#2B0F14",
      via: "#4A1B22",
      to: "#5C2430",
      accent: "#E8A9AE",
      accent2: "#F0CBA0",
      pulse: 4.2,
    },
    quote: "Some feelings don't need a reason. They just need a song.",
    visualLabel: "GOLDEN HOUR · CITY WALK · 6:48 PM",
    videoSrc: "/videos/moods/in-love.mp4",
    playlistName: "Falling in Love Slowly",
    tracks: [
      { title: "Slow Bloom", artist: "Wren & Sable", duration: "3:12" },
      { title: "First of Many", artist: "Coral Season", duration: "2:58" },
      { title: "Golden Hour Again", artist: "Marlowe", duration: "3:41" },
    ],
    wall: [
      {
        text: "Told my roommate about you tonight and I couldn't stop smiling. She said she's never seen me like this.",
        author: "Anonymous, 22",
      },
      {
        text: "I keep finding excuses to walk past the coffee shop where we met. Worth it every time.",
        author: "Anonymous",
      },
    ],
  },
  {
    slug: "the-weeknd",
    label: "The Weeknd",
    group: "Late Night Drive",
    theme: {
      from: "#0E0508",
      via: "#2B0A12",
      to: "#3B0F17",
      accent: "#8C2733",
      accent2: "#C9A9A9",
      pulse: 6.5,
    },
    quote: "I only call you when it's half past five...",
    visualLabel: "AFTER HOURS · 11:42 PM",
    videoSrc: "/videos/moods/heartbroken.mp4",
    playlistName: "The Weeknd | Late Night Drive",
    tracks: [
      { title: "Unsent", artist: "Low Tide Choir", duration: "4:02" },
      { title: "Empty Side of the Bed", artist: "Nadia Voss", duration: "3:24" },
      { title: "Ghost Light", artist: "Marlowe", duration: "3:57" },
    ],
    wall: [
      {
        text: "Deleted the photos. Kept the playlist. Some things you're just not ready to let go of yet.",
        author: "Anonymous, 29",
      },
      {
        text: "It's been a year. I still set the table for two on accident sometimes.",
        author: "Anonymous",
      },
    ],
  },
  {
    slug: "one-sided",
    label: "One Sided",
    group: "Relationships",
    theme: {
      from: "#120E17",
      via: "#241A2E",
      to: "#2F2038",
      accent: "#9B7FB8",
      accent2: "#C7B8D6",
      pulse: 5.4,
    },
    quote: "I loved loud enough for two people. Only one of us noticed.",
    visualLabel: "EMPTY CHAIR · CAFÉ WINDOW · 4:10 PM",
    videoSrc: "/videos/moods/one-sided.mp4",
    playlistName: "3AM Thoughts",
    tracks: [
      { title: "You Never Asked", artist: "Coral Season", duration: "3:33" },
      { title: "Practiced Reply", artist: "Nadia Voss", duration: "2:49" },
      { title: "Quiet Kind of Loud", artist: "Wren & Sable", duration: "3:15" },
    ],
    wall: [
      {
        text: "I'm good at being someone's favorite secret. I'd like to just be someone's favorite, once.",
        author: "Anonymous, 24",
      },
      {
        text: "Loving someone quietly is still loving them. I just wish it felt like enough.",
        author: "Anonymous",
      },
    ],
  },
  {
    slug: "long-distance",
    label: "Long Distance",
    group: "Relationships",
    theme: {
      from: "#050810",
      via: "#101A30",
      to: "#182644",
      accent: "#7C8FE0",
      accent2: "#C6CEEC",
      pulse: 5.0,
    },
    quote: "Two time zones, one heartbeat, running slightly out of sync.",
    visualLabel: "NIGHT TRAIN · CITY LIGHTS · 1:15 AM",
    videoSrc: "/videos/moods/long-distance.mp4",
    playlistName: "Long Distance Nights",
    tracks: [
      { title: "Seven Hours Ahead", artist: "Marlowe", duration: "3:48" },
      { title: "Time Zones", artist: "Low Tide Choir", duration: "4:11" },
      { title: "Landing Soon", artist: "Wren & Sable", duration: "3:02" },
    ],
    wall: [
      {
        text: "Booked the ticket. 14 days until I get to hug you for real instead of through a screen.",
        author: "Anonymous, 26",
      },
      {
        text: "We do a video call dinner every Friday. It's not the same table, but it's still ours.",
        author: "Anonymous",
      },
    ],
  },
  {
    slug: "lonely",
    label: "Lonely",
    group: "Life",
    theme: {
      from: "#0A0C0F",
      via: "#1A1D22",
      to: "#22262C",
      accent: "#6E7681",
      accent2: "#9AA3AD",
      pulse: 7.2,
    },
    quote: "A full room can still feel like an empty one.",
    visualLabel: "EMPTY ROOM · STREETLIGHT · 10:03 PM",
    videoSrc: "/videos/moods/lonely.mp4",
    playlistName: "Songs for the Quiet Hours",
    tracks: [
      { title: "Radio On", artist: "Nadia Voss", duration: "3:29" },
      { title: "Room for One", artist: "Low Tide Choir", duration: "3:56" },
      { title: "Streetlight Hum", artist: "Coral Season", duration: "2:41" },
    ],
    wall: [
      {
        text: "I called my mom just to hear a voice that wasn't the TV. Didn't even have anything to say.",
        author: "Anonymous, 31",
      },
      {
        text: "Started talking to my plants. They're better listeners than half my group chat.",
        author: "Anonymous",
      },
    ],
  },
  {
    slug: "late-night",
    label: "Late Night",
    group: "Life",
    theme: {
      from: "#07070C",
      via: "#15111F",
      to: "#1F1830",
      accent: "#7A6FBE",
      accent2: "#B7A8E8",
      pulse: 4.6,
    },
    quote: "Every thought sounds louder after midnight.",
    visualLabel: "CEILING FAN · PHONE GLOW · 2:37 AM",
    videoSrc: "/videos/moods/late-night.mp4",
    playlistName: "2AM Thoughts",
    tracks: [
      { title: "Ceiling Fan", artist: "Marlowe", duration: "3:20" },
      { title: "Uninvited", artist: "Nadia Voss", duration: "3:44" },
      { title: "Sit With It", artist: "Wren & Sable", duration: "4:05" },
    ],
    wall: [
      {
        text: "3AM me makes plans that 9AM me has to deal with. We do not communicate well.",
        author: "Anonymous, 20",
      },
      {
        text: "The quiet used to scare me. Now it's the only time my brain slows down enough to hear itself.",
        author: "Anonymous",
      },
    ],
  },
];
