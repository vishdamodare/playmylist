import { db } from "@/lib/server/db";
import { bad, cleanText, isScope, ownerOf, PERSONAL } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

const COLS = "id, mood, title, content, tags, author, created_at, (owner_id = $2::uuid) AS mine";

/** GET /api/stories?mood=in-love — newest first (all public moods when `mood` is omitted). Personal = owner only. */
export async function GET(req: Request) {
  const mood = new URL(req.url).searchParams.get("mood");
  if (mood !== null && !isScope(mood)) return bad("unknown mood");
  const owner = ownerOf(req) ?? "00000000-0000-0000-0000-000000000000";
  const { rows } =
    mood === PERSONAL
      ? await db.query(`SELECT ${COLS} FROM stories WHERE mood = $1 AND owner_id = $2 ORDER BY created_at DESC LIMIT 200`, [mood, owner])
      : mood
        ? await db.query(`SELECT ${COLS} FROM stories WHERE mood = $1 ORDER BY created_at DESC LIMIT 200`, [mood, owner])
        : await db.query(`SELECT ${COLS} FROM stories WHERE mood <> $1 ORDER BY created_at DESC LIMIT 600`, [PERSONAL, owner]);
  return Response.json({ stories: rows });
}

/** POST /api/stories  { mood, title, content, tags? } */
export async function POST(req: Request) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  const body = await req.json().catch(() => null);
  if (!body || !isScope(body.mood)) return bad("unknown mood");
  const title = cleanText(body.title, 80);
  const content = cleanText(body.content, 5000);
  if (!title || !content) return bad("title and content are required");
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t: unknown): t is string => typeof t === "string").map((t: string) => t.slice(0, 30)).slice(0, 5)
    : [];
  const { rows } = await db.query(
    `INSERT INTO stories (mood, owner_id, title, content, tags, author)
     VALUES ($1, $2, $3, $4, $5, (SELECT display_name FROM profiles WHERE owner_id = $2))
     RETURNING id, mood, title, content, tags, author, created_at, true AS mine`,
    [body.mood, owner, title, content, tags]
  );
  return Response.json({ story: rows[0] }, { status: 201 });
}
