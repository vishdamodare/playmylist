import { db } from "@/lib/server/db";
import { bad, ownerOf } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

/** GET /api/profile — the name this browser asked us to call it (or null). */
export async function GET(req: Request) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  const { rows } = await db.query("SELECT display_name FROM profiles WHERE owner_id = $1", [owner]);
  return Response.json({ name: rows[0]?.display_name ?? null });
}

/** PUT /api/profile { name } — saves the name and re-signs this browser's stories with it. */
export async function PUT(req: Request) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  const body = await req.json().catch(() => null);
  // collapse whitespace, drop control characters
  const name = typeof body?.name === "string" ? body.name.replace(/[\p{C}]/gu, "").replace(/\s+/g, " ").trim() : "";
  if (name.length < 1 || name.length > 24) return bad("name must be 1–24 characters");
  await db.query(
    `INSERT INTO profiles (owner_id, display_name) VALUES ($1, $2)
     ON CONFLICT (owner_id) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = now()`,
    [owner, name]
  );
  await db.query("UPDATE stories SET author = $2 WHERE owner_id = $1", [owner, name]);
  return Response.json({ name });
}
