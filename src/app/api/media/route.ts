import { randomUUID } from "node:crypto";
import { db } from "@/lib/server/db";
import { files } from "@/lib/server/files";
import { bad, isScope, ownerOf } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

const IMAGE: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const VIDEO: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
const MAX_IMAGE = 10 * 1024 * 1024;
// ponytail: uploads stream through this route; on Vercel (4.5 MB body cap) switch to files.signedUploadUrl for direct-to-bucket uploads.
const MAX_VIDEO = 50 * 1024 * 1024;

const toItem = async (r: { id: string; object_key: string; content_type: string; created_at: string }) => ({
  id: r.id,
  kind: r.content_type.startsWith("video/") ? "video" : "image",
  createdAt: r.created_at,
  url: await files.url(r.object_key, { expiresIn: 3600 }),
});

/** GET /api/media?scope=my-playlist — this browser's photos/videos, newest first, with 1-hour presigned URLs. */
export async function GET(req: Request) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  const scope = new URL(req.url).searchParams.get("scope");
  if (!isScope(scope)) return bad("unknown scope");
  const { rows } = await db.query(
    `SELECT id, object_key, content_type, created_at FROM media
     WHERE owner_id = $1 AND scope = $2 ORDER BY created_at DESC LIMIT 60`,
    [owner, scope]
  );
  return Response.json({ media: await Promise.all(rows.map(toItem)) });
}

/** POST /api/media  multipart: file, scope — uploads to the bucket, then records the key. */
export async function POST(req: Request) {
  const owner = ownerOf(req);
  if (!owner) return bad("missing owner id", 401);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const scope = form?.get("scope");
  if (!(file instanceof Blob)) return bad("missing file");
  if (!isScope(scope)) return bad("unknown scope");
  const type = file.type.split(";")[0];
  const ext = IMAGE[type] ?? VIDEO[type];
  if (!ext) return bad("only JPG, PNG, WebP, GIF photos or MP4, WebM, MOV videos");
  const max = VIDEO[type] ? MAX_VIDEO : MAX_IMAGE;
  if (file.size === 0 || file.size > max) return bad(`${VIDEO[type] ? "videos" : "photos"} can be up to ${max / 1048576} MB`, 413);

  const key = `media/${scope}/${owner}/${randomUUID()}.${ext}`;
  await files.upload(key, file, { contentType: type });
  try {
    const { rows } = await db.query(
      `INSERT INTO media (scope, owner_id, object_key, content_type, size_bytes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, object_key, content_type, created_at`,
      [scope, owner, key, type, file.size]
    );
    return Response.json({ item: await toItem(rows[0]) }, { status: 201 });
  } catch (e) {
    await files.delete(key).catch(() => {}); // don't orphan the object if the row failed
    throw e;
  }
}
