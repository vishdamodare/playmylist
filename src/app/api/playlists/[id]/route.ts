import { db } from "@/lib/server/db";
import { bad, isUuid, ownerOf } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

/** DELETE /api/playlists/:id — owner only. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  if (!isUuid(params.id)) return bad("bad id");
  const { rowCount } = await db.query("DELETE FROM community_playlists WHERE id = $1 AND owner_id = $2", [params.id, owner]);
  return rowCount ? new Response(null, { status: 204 }) : bad("not found", 404);
}

/** PATCH /api/playlists/:id { remove: videoId } — owner drops one song; removing the last one unpublishes it. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  if (!isUuid(params.id)) return bad("bad id");
  const body = await req.json().catch(() => null);
  const vid = body?.remove;
  if (typeof vid !== "string" || !/^[\w-]{11}$/.test(vid)) return bad("bad song id");
  const { rows } = await db.query(
    "UPDATE community_playlists SET song_ids = array_remove(song_ids, $3) WHERE id = $1 AND owner_id = $2 AND cardinality(song_ids) > 1 RETURNING song_ids",
    [params.id, owner, vid]
  );
  if (rows[0]) return Response.json({ ids: rows[0].song_ids });
  // last song (or not yours): deleting the last song removes the whole playlist
  const { rowCount } = await db.query(
    "DELETE FROM community_playlists WHERE id = $1 AND owner_id = $2 AND song_ids = ARRAY[$3]::text[]",
    [params.id, owner, vid]
  );
  return rowCount ? Response.json({ ids: [] }) : bad("not found", 404);
}
