// Seeds curated sample stories (db/seed/stories.json). Idempotent upsert on fixed ids; only editorial rows are updated.
// Owned by a reserved editorial id no browser has, so visitors can read but never edit/delete them.
import { readFile } from "node:fs/promises";
import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // env may already be injected
}
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set — run `neon env pull` first");

const EDITORIAL = "00000000-0000-4000-8000-000000000000";
const stories = JSON.parse(await readFile(new URL("../db/seed/stories.json", import.meta.url), "utf8"));

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  let added = 0;
  // Stagger created_at so JSON order (first = newest) is the shelf order.
  for (const [i, s] of stories.entries()) {
    const { rowCount } = await client.query(
      `INSERT INTO stories (id, mood, owner_id, title, content, tags, author, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now() - make_interval(hours => $8))
       ON CONFLICT (id) DO UPDATE SET mood = EXCLUDED.mood, title = EXCLUDED.title, content = EXCLUDED.content,
         tags = EXCLUDED.tags, author = EXCLUDED.author, updated_at = now()
       WHERE stories.owner_id = $3::uuid`,
      [s.id, s.mood, EDITORIAL, s.title, s.content, s.tags, s.author, i]
    );
    added += rowCount;
  }
  const { rows } = await client.query("SELECT mood, count(*)::int AS n FROM stories GROUP BY mood ORDER BY mood");
  console.log(`upserted ${added} (of ${stories.length}); per mood:`, Object.fromEntries(rows.map((r) => [r.mood, r.n])));
} finally {
  await client.end();
}
