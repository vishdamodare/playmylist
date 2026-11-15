import { db } from "@/lib/server/db";
import { bad, cleanText, isUuid, ownerOf } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

/** PATCH /api/stories/:id  { title, content } — owner only. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  if (!isUuid(params.id)) return bad("bad id");
  const body = await req.json().catch(() => null);
  const title = cleanText(body?.title, 80);
  const content = cleanText(body?.content, 5000);
  if (!title || !content) return bad("title and content are required");
  const { rows } = await db.query(
    `UPDATE stories SET title = $3, content = $4, updated_at = now()
     WHERE id = $1 AND owner_id = $2
     RETURNING id, mood, title, content, tags, author, created_at, true AS mine`,
    [params.id, owner, title, content]
  );
  return rows[0] ? Response.json({ story: rows[0] }) : bad("not found", 404);
}

/** DELETE /api/stories/:id — owner only. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  if (!isUuid(params.id)) return bad("bad id");
  const { rowCount } = await db.query("DELETE FROM stories WHERE id = $1 AND owner_id = $2", [params.id, owner]);
  return rowCount ? new Response(null, { status: 204 }) : bad("not found", 404);
}
