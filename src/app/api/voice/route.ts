import { randomUUID } from "node:crypto";
import { db } from "@/lib/server/db";
import { files } from "@/lib/server/files";
import { bad, isScope, ownerOf } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // ~5 min of Opus audio
const EXT: Record<string, string> = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/mpeg": "mp3" };

/** GET /api/voice?mood=… — this browser's voice notes, each with a 1-hour presigned URL. */
export async function GET(req: Request) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  const mood = new URL(req.url).searchParams.get("mood");
  if (!isScope(mood)) return bad("unknown mood");
  const { rows } = await db.query(
    `SELECT id, object_key, content_type, duration_s, created_at FROM voice_notes
     WHERE owner_id = $1 AND mood = $2 ORDER BY created_at DESC LIMIT 20`,
    [owner, mood]
  );
  const notes = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      duration: r.duration_s,
      createdAt: r.created_at,
      url: await files.url(r.object_key, { expiresIn: 3600 }),
    }))
  );
  return Response.json({ notes });
}

/** POST /api/voice  multipart: audio (Blob), mood, duration — uploads to the bucket, then records the key. */
export async function POST(req: Request) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  const mood = form?.get("mood");
  if (!(audio instanceof Blob)) return bad("missing audio");
  if (!isScope(mood)) return bad("unknown mood");
  const type = (audio.type || "audio/webm").split(";")[0];
  if (!EXT[type]) return bad("unsupported audio type");
  if (audio.size === 0 || audio.size > MAX_BYTES) return bad("audio must be between 1 byte and 5 MB", 413);
  const duration = Math.max(0, Math.min(3600, Math.round(Number(form?.get("duration")) || 0)));

  const key = `voice/${mood}/${owner}/${randomUUID()}.${EXT[type]}`;
  await files.upload(key, audio, { contentType: type });
  try {
    const { rows } = await db.query(
      `INSERT INTO voice_notes (mood, owner_id, object_key, content_type, duration_s)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, duration_s, created_at`,
      [mood, owner, key, type, duration]
    );
    const url = await files.url(key, { expiresIn: 3600 });
    return Response.json({ note: { id: rows[0].id, duration: rows[0].duration_s, createdAt: rows[0].created_at, url } }, { status: 201 });
  } catch (e) {
    await files.delete(key).catch(() => {}); // don't leave an orphaned object if the row failed
    throw e;
  }
}
