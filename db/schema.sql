-- PlayMyList schema. Applied by `npm run db:migrate` (idempotent).

-- Stories posted to a mood's Story Wall / bookshelf.
CREATE TABLE IF NOT EXISTS stories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mood        text NOT NULL,
  owner_id    uuid NOT NULL,            -- anonymous per-browser id; only the owner may edit/delete
  title       text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  content     text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  tags        text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stories_mood_created_idx ON stories (mood, created_at DESC);

-- Voice notes: the audio lives in Object Storage (bucket "assets"); the row stores its key.
CREATE TABLE IF NOT EXISTS voice_notes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mood          text NOT NULL,
  owner_id      uuid NOT NULL,
  object_key    text NOT NULL UNIQUE,
  content_type  text NOT NULL,
  duration_s    integer NOT NULL DEFAULT 0 CHECK (duration_s >= 0),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS voice_notes_owner_mood_idx ON voice_notes (owner_id, mood, created_at DESC);

-- Display signature, e.g. "Anonymous, 24" (NULL = shown as Anonymous). Set for curated sample stories.
ALTER TABLE stories ADD COLUMN IF NOT EXISTS author text CHECK (author IS NULL OR char_length(author) <= 40);

-- Photos / videos a listener uploads to their own space (bytes live in the `assets` bucket under object_key).
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  owner_id uuid NOT NULL,
  object_key text NOT NULL UNIQUE,
  content_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_owner_scope_idx ON media (owner_id, scope, created_at DESC);

-- What a listener asked us to call them (keyed by the anonymous browser id; moves to user_id with sign-in).
CREATE TABLE IF NOT EXISTS profiles (
  owner_id uuid PRIMARY KEY,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 24),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Songs a listener added to a mood or to My Playlist (mirrors their browser list so the admin can see it).
CREATE TABLE IF NOT EXISTS songs (
  owner_id   uuid NOT NULL,
  scope      text NOT NULL,
  video_id   text NOT NULL CHECK (video_id ~ '^[0-9A-Za-z_-]{11}$'),
  title      text NOT NULL DEFAULT '' CHECK (char_length(title) <= 200),
  author     text NOT NULL DEFAULT '' CHECK (char_length(author) <= 120),
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, scope, video_id)
);
CREATE INDEX IF NOT EXISTS songs_created_idx ON songs (created_at DESC);

-- Songs an admin removed: the visitor's browser still has them, so syncing must not bring them back.
CREATE TABLE IF NOT EXISTS removed_songs (
  owner_id   uuid NOT NULL,
  scope      text NOT NULL,
  video_id   text NOT NULL,
  removed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, scope, video_id)
);

-- Feedback visitors send from the "Feedback" tab.
CREATE TABLE IF NOT EXISTS feedback (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL,
  rating     smallint CHECK (rating BETWEEN 1 AND 4),
  message    text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  contact    text CHECK (contact IS NULL OR char_length(contact) <= 120),
  page       text CHECK (page IS NULL OR char_length(page) <= 60),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feedback_owner_created_idx ON feedback (owner_id, created_at DESC);

-- Playlists anyone can publish to the home page ("Made by listeners"), signed by their creator.
CREATE TABLE IF NOT EXISTS community_playlists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL,            -- anonymous per-browser id; only the owner may remove it
  name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  creator     text NOT NULL CHECK (char_length(creator) BETWEEN 1 AND 40),
  song_ids    text[] NOT NULL CHECK (cardinality(song_ids) BETWEEN 1 AND 200),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_playlists_created_idx ON community_playlists (created_at DESC);
