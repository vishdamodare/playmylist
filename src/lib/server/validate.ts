import { MOODS } from "@/data/moods";

const MOOD_SLUGS = new Set(MOODS.map((m) => m.slug));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isMood = (v: unknown): v is string => typeof v === "string" && MOOD_SLUGS.has(v);
/** The listener's own room ("My Playlist"): everything stored under it is visible to its owner only. */
export const PERSONAL = "my-playlist";
export const isScope = (v: unknown): v is string => v === PERSONAL || isMood(v);
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/** Anonymous per-browser id sent as `x-pml-owner`; gates edit/delete and private voice notes. */
export function ownerOf(req: Request): string | null {
  const v = req.headers.get("x-pml-owner");
  return isUuid(v) ? v : null;
}

export const bad = (msg: string, status = 400) => Response.json({ error: msg }, { status });

export function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= max ? t : null;
}
