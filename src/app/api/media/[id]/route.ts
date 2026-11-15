import { db } from "@/lib/server/db";
import { files } from "@/lib/server/files";
import { bad, isUuid, ownerOf } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

/** DELETE /api/media/:id — owner only; removes the row and its object. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  if (!isUuid(params.id)) return bad("bad id");
  const { rows } = await db.query("DELETE FROM media WHERE id = $1 AND owner_id = $2 RETURNING object_key", [
    params.id,
    owner,
  ]);
  if (!rows[0]) return bad("not found", 404);
  await files.delete(rows[0].object_key).catch(() => {});
  return new Response(null, { status: 204 });
}
