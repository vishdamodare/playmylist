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
    stories: [
      {
        id: "in-love-1",
        title: "The Walk Home",
        author: "Anonymous, 24",
        tags: ["new love", "butterflies"],
        content:
          "We took the long way home again. Neither of us said why. The streetlights were doing that thing where they flicker on one at a time, and I remember thinking — I want to remember this exact version of tired.",
      },
      {
        id: "in-love-2",
        title: "Golden Hour",
        author: "Anonymous",
        tags: ["warm", "hopeful"],
        content:
          "Everything looks different now. The streets I walked a thousand times suddenly look like film stills. I catch myself smiling at nothing — at the way light moves through trees, at songs I've heard a hundred times that suddenly make sense.",
      },
      {
        id: "in-love-3",
        title: "The List",
        author: "Anonymous, 19",
        tags: ["new love", "nervous"],
        content:
          "I made a list once of everything I wanted in someone. You don't match half of it. You match all of the things I didn't know to ask for.",
      },
    ],
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
    stories: [
      {
        id: "weeknd-1",
        title: "After Hours",
        author: "Anonymous",
        tags: ["the weeknd", "late night"],
        content:
          "Driving under empty streetlights at 2 AM with The Weeknd on repeat. Some songs don't heal you. They just understand the night.",
      },
      {
        id: "weeknd-2",
        title: "Half Past Five",
        author: "Anonymous, 24",
        tags: ["the weeknd", "late night"],
        content:
          "My phone still lights up late at night, like some habits never leave. When the city sleeps, the melody takes over.",
      },
      {
        id: "weeknd-3",
        title: "Starboy Vibes",
        author: "Anonymous",
        tags: ["the weeknd", "vibes"],
        content:
          "The baseline hits differently when the world is quiet outside.",
      },
    ],
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
    stories: [
      {
        id: "one-sided-1",
        title: "The Reply I Practiced",
        author: "Anonymous, 21",
        tags: ["one sided", "unspoken"],
        content:
          "I had a whole reply ready if you ever asked how I felt. Three years of editing it down. You never asked. I think some of us just get really good at loving quietly and calling it patience.",
      },
      {
        id: "one-sided-2",
        title: "Front Row",
        author: "Anonymous",
        tags: ["one sided", "friendship"],
        content:
          "I know your coffee order, your Sunday routine, the name of your childhood dog. You know I exist. That's the whole trade, and somehow I keep making it.",
      },
      {
        id: "one-sided-3",
        title: "Almost Said It",
        author: "Anonymous, 23",
        tags: ["one sided", "almost"],
        content:
          "I got as far as 'I need to tell you something' four separate times. Each time I finished the sentence with 'never mind.' I think I like the almost more than I'd like the answer.",
      },
    ],
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
    stories: [
      {
        id: "long-distance-1",
        title: "Seven Hours Ahead",
        author: "Anonymous",
        tags: ["long distance", "waiting"],
        content:
          "You're having breakfast while I'm falling asleep. I've learned to love someone in fragments — a good-morning that arrives at midnight, a goodnight that greets my alarm. Distance made me fluent in a language only we speak.",
      },
      {
        id: "long-distance-2",
        title: "Departures Board",
        author: "Anonymous, 25",
        tags: ["long distance", "airports"],
        content:
          "I've started to like airports. They're the only place that feels honest about how this works — a countdown, a gate number, the exact minute we stop being in the same room.",
      },
      {
        id: "long-distance-3",
        title: "Same Moon",
        author: "Anonymous",
        tags: ["long distance", "small comforts"],
        content:
          "Someone told me we're looking at the same moon, just at different times, and I've never let go of that. It's not much. It's ours.",
      },
    ],
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
    stories: [
      {
        id: "lonely-1",
        title: "The Sound of the Fridge",
        author: "Anonymous, 27",
        tags: ["lonely", "quiet"],
        content:
          "It's not the big moments that get me. It's the small ones — cooking for one, hearing the fridge hum louder than usual. I've started leaving the radio on, just so the apartment sounds a little more like it's mine and a little less like it's just me.",
      },
      {
        id: "lonely-2",
        title: "Group Chat",
        author: "Anonymous",
        tags: ["lonely", "crowded"],
        content:
          "I'm in six group chats and I still typed 'anyone up?' into a search bar before remembering there was no one to send it to.",
      },
      {
        id: "lonely-3",
        title: "Two Cups",
        author: "Anonymous, 30",
        tags: ["lonely", "habit"],
        content:
          "I still buy the two-person size of everything. I tell myself it's just cheaper per unit. I don't examine that sentence too closely.",
      },
    ],
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
    stories: [
      {
        id: "late-night-1",
        title: "The Thoughts That Wait",
        author: "Anonymous",
        tags: ["late night", "overthinking"],
        content:
          "My thoughts are polite during the day. They wait their turn. But at 2AM they all show up at once, uninvited, rearranging the furniture in my head until I give up on sleeping and just sit with them for a while.",
      },
      {
        id: "late-night-2",
        title: "The Replay",
        author: "Anonymous, 22",
        tags: ["late night", "regret"],
        content:
          "I replayed a conversation from 2019 tonight and lost an argument I never actually had. My brain keeps the receipts for things nobody's asking about.",
      },
      {
        id: "late-night-3",
        title: "Ceiling Stare",
        author: "Anonymous",
        tags: ["late night", "insomnia"],
        content:
          "There's a crack in my ceiling shaped like a river. I've mapped its whole coastline by now. Some nights that's the only progress I make.",
      },
    ],
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
