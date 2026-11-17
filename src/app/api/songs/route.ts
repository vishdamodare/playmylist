import { db } from "@/lib/server/db";
import { bad, isScope, ownerOf } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

const VIDEO = /^[0-9A-Za-z_-]{11}$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** PUT /api/songs { scope, songs: [{ id, title, author }] } — replaces this browser's list for that scope. */
export async function PUT(req: Request) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  const body = await req.json().catch(() => null);
  if (!body || !isScope(body.scope) || !Array.isArray(body.songs)) return bad("scope and songs are required");
  if (body.songs.length > 300) return bad("too many songs", 413);
  const seen = new Set<string>();
  let songs = body.songs.flatMap((s: { id?: unknown; title?: unknown; author?: unknown }) => {
    const id = typeof s?.id === "string" && VIDEO.test(s.id) && !seen.has(s.id) ? s.id : null;
    if (!id) return [];
    seen.add(id);
    return [{ id, title: str(s.title, 200), author: str(s.author, 120) }];
  });

  // songs an admin removed stay removed, even though the visitor's browser still lists them
  const { rows: gone } = await db.query("SELECT video_id FROM removed_songs WHERE owner_id = $1 AND scope = $2", [owner, body.scope]);
  if (gone.length) {
    const removed = new Set(gone.map((r) => r.video_id));
    songs = songs.filter((s: { id: string }) => !removed.has(s.id));
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM songs WHERE owner_id = $1 AND scope = $2 AND NOT (video_id = ANY($3::text[]))", [
      owner,
      body.scope,
      songs.map((s: { id: string }) => s.id),
    ]);
    if (songs.length)
      await client.query(
        `INSERT INTO songs (owner_id, scope, video_id, title, author, position)
         SELECT $1, $2, x.id, x.title, x.author, x.pos
         FROM jsonb_to_recordset($3::jsonb) AS x(id text, title text, author text, pos int)
         ON CONFLICT (owner_id, scope, video_id) DO UPDATE SET title = EXCLUDED.title, author = EXCLUDED.author, position = EXCLUDED.position`,
        [owner, body.scope, JSON.stringify(songs.map((x: object, pos: number) => ({ ...x, pos })))]
      );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
  return new Response(null, { status: 204 });
}
