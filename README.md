# PlayMyList

**Music · Stories · Visuals · One Feeling.**

PlayMyList is a mood-first music space. Pick how you feel — *I'm in Love*, *The Weeknd*, *One Sided*, *Long Distance*, *Lonely*, *Late Night* — and you step into a room built for that feeling: a soundtrack, a shelf of stories written by strangers, a writing desk for your own, and weather to match.

## Features

**Mood rooms**
- A curated YouTube soundtrack per mood, with a full player bar, song list and a mini player that follows you home
- *Add your song* — paste any YouTube link to add it to a mood's queue
- Live weather over the page: rain, storm, wind, snow, sunshine and night
- A 90s-style room: VHS panel, film grain, story shelf with an animated companion
- A personal greeting on every mood — *"Hey Moonchild, can't sleep either? Stay a while."*

**Stories**
- A bookshelf of stories per mood; open one as a 3D book with page turns, text flowed to fit each page
- 24 curated sample stories (4 per mood), plus everything visitors post
- Write on the desk and **post it to the shelf**, or keep it as a private draft
- Edit or delete your own stories; posts are signed with the name you choose

**Voice**
- Press **Rec** to record a voice note — and what you say is typed into the journal as you talk (Web Speech API; Chrome, Edge, Safari)

**My Playlist**
- Your own room, in the same layout as a mood: build a playlist from YouTube links, upload photos and videos (shown as a slideshow), write and record — all private to you

**Everywhere**
- *What should we call you?* — a one-time prompt; the name signs your stories and every mood says hi
- Morning / Night mode across the whole site, with a live animated sky on the home page
- Home page scroll story with *PlayMyList FM*, plus Discover, Stories (library) and Playlists pages
- Smooth screen changes via the View Transitions API; respects *reduced motion*

## Tech stack

| Layer | Choice |
| --- | --- |
| App | [Next.js 14](https://nextjs.org) (App Router), React 18, TypeScript |
| Styling | Tailwind CSS + hand-written CSS (`src/app/globals.css`) |
| Database | [Neon](https://neon.com) Postgres via `pg` |
| File storage | Neon Object Storage (S3-compatible) via [`files-sdk`](https://files-sdk.dev) |
| Music | YouTube IFrame Player API |
| Speech | Browser Web Speech API |

## Getting started

### Prerequisites

- Node.js **20.12+** (the database scripts use `process.loadEnvFile`)
- A Neon project with Postgres and Object Storage (a private bucket named `assets`)

### 1. Install

```bash
npm install
```

### 2. Configure environment

Create `.env.local` in the project root. With the [Neon CLI](https://neon.com/docs/cli/install) you can pull it directly:

```bash
neon link --project-id <your-project-id>
neon deploy        # provisions the `assets` bucket declared in neon.ts and writes .env.local
```

Or fill it in by hand:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Pooled Postgres connection string (used by the app) |
| `DATABASE_URL_UNPOOLED` | Direct connection string (used for migrations) |
| `AWS_ACCESS_KEY_ID` | Object Storage access key |
| `AWS_SECRET_ACCESS_KEY` | Object Storage secret key |
| `AWS_ENDPOINT_URL_S3` | Object Storage endpoint for your branch |
| `AWS_REGION` | Object Storage region, e.g. `ap-southeast-1` |

> `.env.local` and `.neon` are git-ignored. Never commit them.

### 3. Create the tables and sample stories

```bash
npm run db:migrate   # applies db/schema.sql (safe to re-run)
npm run db:seed      # inserts/updates the 24 sample stories from db/seed/stories.json
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Lint |
| `npm run db:migrate` | Apply `db/schema.sql` over the direct connection |
| `npm run db:seed` | Upsert the curated sample stories (never touches visitor stories) |

> Don't run `npm run build` while `npm run dev` is running in the same folder — both write to `.next/` and the dev server will start serving pages without CSS/JS. Stop dev, build, then `rm -rf .next && npm run dev`.

## How data is stored

Visitors don't sign in (yet). Each browser gets an anonymous id (`pml_owner_id` in localStorage), sent as the `x-pml-owner` header; the server uses it to decide what you can edit, delete or see.

| Data | Where | Who can see it |
| --- | --- | --- |
| Stories on a mood shelf | Postgres `stories` | Everyone (only the author can edit/delete) |
| Stories in *My Playlist* | Postgres `stories` (scope `my-playlist`) | Only the author |
| Voice notes | Object Storage `voice/…` + Postgres `voice_notes` | Only the author |
| Photos & videos | Object Storage `media/…` + Postgres `media` | Only the uploader |
| Your name | Postgres `profiles` | Shown on your stories |
| Curated playlists & mood content | Code (`src/data/`) | Everyone |
| Songs you add, My Playlist songs, private drafts | Browser localStorage | Only that browser |

Files are private in the bucket and served through 1-hour presigned URLs.

### API

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/stories` | `GET ?mood=`, `POST` | List / create stories |
| `/api/stories/:id` | `PATCH`, `DELETE` | Edit / delete your story |
| `/api/voice` | `GET ?mood=`, `POST` (multipart) | Your voice notes / upload one (≤ 5 MB) |
| `/api/voice/:id` | `DELETE` | Delete a voice note |
| `/api/media` | `GET ?scope=`, `POST` (multipart) | Your photos & videos / upload (photos ≤ 10 MB, videos ≤ 50 MB) |
| `/api/media/:id` | `DELETE` | Delete a photo or video |
| `/api/profile` | `GET`, `PUT` | Read / set what we call you (1–24 chars) |

## Project structure

```
db/
  schema.sql            tables: stories, voice_notes, media, profiles
  seed/stories.json     the 24 curated sample stories
scripts/
  db-migrate.mjs        applies the schema
  db-seed.mjs           upserts sample stories
neon.ts                 Neon infrastructure config (bucket: assets)
src/
  app/
    page.tsx            screen switching + View Transitions
    api/                route handlers (stories, voice, media, profile)
    globals.css         all component styles
  components/
    home/               home page, sky, scroll sections
    experience/         mood room: shelf, book reader, weather, effects
    playlist/           My Playlist room + photo/video wall
    player/             YouTube player + player bar
    browse/             Discover, Stories (library), Playlists pages
    NamePrompt.tsx      "What should we call you?"
  data/                 moods and their playlists
  hooks/                useYouTubePlayer
  lib/
    api.ts              client for the API (+ anonymous owner id)
    profile.ts          shared name store
    server/             db pool, file storage, validation
```

## Deploying

1. Deploy to any Next.js host (e.g. [Vercel](https://vercel.com)).
2. Add every variable from `.env.local` to the host's environment settings.
3. Run `npm run db:migrate` and `npm run db:seed` once against the production database.

**Before going public**

- Uploads currently stream through the API route. Vercel limits request bodies to **4.5 MB**, so large videos need direct-to-bucket uploads (`files.signedUploadUrl`) there.
- Anyone can post; consider moderation (a report button or word filter) before sharing widely.

## Roadmap

- Google sign-in — move names, songs, playlists and drafts from the browser to the account
- Direct-to-bucket uploads for large videos
- Story moderation and reporting
