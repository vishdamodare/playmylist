import { db } from "@/lib/server/db";
import { bad, cleanText, ownerOf } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

const ID = /^[\w-]{11}$/;
const COLS = "id, name, creator, song_ids, created_at, (owner_id = $1::uuid) AS mine";

/** GET /api/playlists — community playlists, newest first. */
export async function GET(req: Request) {
  const owner = ownerOf(req) ?? "00000000-0000-0000-0000-000000000000";
  const { rows } = await db.query(`SELECT ${COLS} FROM community_playlists ORDER BY created_at DESC LIMIT 60`, [owner]);
  return Response.json({ playlists: rows });
}

/** POST /api/playlists  { name, creator, ids } */
export async function POST(req: Request) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  const body = await req.json().catch(() => null);
  const name = cleanText(body?.name, 60);
  const creator = cleanText(body?.creator, 40);
  if (!name || !creator) return bad("a playlist name and your name are required");
  const ids = Array.isArray(body.ids)
    ? Array.from(new Set(body.ids.filter((x: unknown): x is string => typeof x === "string" && ID.test(x)))).slice(0, 200)
    : [];
  if (!ids.length) return bad("add at least one song");
  // ponytail: per-browser cap only; add real rate limiting / moderation if spam shows up
  const { rows: count } = await db.query("SELECT count(*)::int AS n FROM community_playlists WHERE owner_id = $1", [owner]);
  if (count[0].n >= 20) return bad("you've published 20 playlists — remove one first", 429);
  const { rows } = await db.query(
    `INSERT INTO community_playlists (owner_id, name, creator, song_ids) VALUES ($1, $2, $3, $4)
     RETURNING ${COLS}`,
    [owner, name, creator, ids]
  );
  return Response.json({ playlist: rows[0] }, { status: 201 });
}
