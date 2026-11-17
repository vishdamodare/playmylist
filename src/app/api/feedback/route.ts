import { db } from "@/lib/server/db";
import { bad, cleanText, ownerOf } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

/** POST /api/feedback { message, rating?, contact?, page? } — at most 5 per browser per hour. */
export async function POST(req: Request) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  const body = await req.json().catch(() => null);
  const message = cleanText(body?.message, 2000);
  if (!message) return bad("please write a message (up to 2000 characters)");
  const rating = Number.isInteger(body?.rating) && body.rating >= 1 && body.rating <= 4 ? body.rating : null;
  const contact = cleanText(body?.contact, 120);
  const page = cleanText(body?.page, 60);

  const { rows } = await db.query(
    "SELECT count(*)::int AS n FROM feedback WHERE owner_id = $1 AND created_at > now() - interval '1 hour'",
    [owner]
  );
  if (rows[0].n >= 5) return bad("thank you! that's plenty for now, try again in a bit", 429);

  await db.query("INSERT INTO feedback (owner_id, rating, message, contact, page) VALUES ($1, $2, $3, $4, $5)", [
    owner,
    rating,
    message,
    contact,
    page,
  ]);
  return new Response(null, { status: 204 });
}
