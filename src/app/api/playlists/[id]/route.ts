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
