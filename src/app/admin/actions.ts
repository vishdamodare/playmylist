"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/server/db";
import { files } from "@/lib/server/files";
import { isUuid } from "@/lib/server/validate";
import { isAdmin } from "@/lib/adminAuth";

const VIDEO = /^[0-9A-Za-z_-]{11}$/;

/** One action for every delete button on /admin. Re-checks the password: actions are plain POSTs. */
export async function adminDelete(form: FormData) {
  if (!isAdmin(headers().get("authorization"))) throw new Error("Admin only");
  const kind = form.get("kind"), id = form.get("id");
  const owner = form.get("owner"), scope = form.get("scope");

  if (kind === "story" && isUuid(id)) {
    await db.query("DELETE FROM stories WHERE id = $1", [id]);
  } else if (kind === "playlist" && isUuid(id)) {
    await db.query("DELETE FROM community_playlists WHERE id = $1", [id]);
  } else if (kind === "playlist-song" && isUuid(id) && typeof scope === "string" && VIDEO.test(scope)) {
    // scope = the video id here; the last song takes the playlist with it (song_ids can't be empty)
    await db.query("DELETE FROM community_playlists WHERE id = $1 AND song_ids = ARRAY[$2]::text[]", [id, scope]);
    await db.query("UPDATE community_playlists SET song_ids = array_remove(song_ids, $2) WHERE id = $1", [id, scope]);
  } else if (kind === "feedback" && isUuid(id)) {
    await db.query("DELETE FROM feedback WHERE id = $1", [id]);
  } else if ((kind === "media" || kind === "voice") && isUuid(id)) {
    const table = kind === "media" ? "media" : "voice_notes";
    const { rows } = await db.query(`DELETE FROM ${table} WHERE id = $1 RETURNING object_key`, [id]);
    if (rows[0]) await files.delete(rows[0].object_key).catch(() => {}); // row is gone; a stray object is harmless
  } else if (kind === "song" && isUuid(owner) && typeof scope === "string" && typeof id === "string" && VIDEO.test(id)) {
    await db.query("DELETE FROM songs WHERE owner_id = $1 AND scope = $2 AND video_id = $3", [owner, scope, id]);
    await db.query(
      "INSERT INTO removed_songs (owner_id, scope, video_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [owner, scope, id]
    );
  } else if (kind === "person" && isUuid(owner)) {
    const keys = await db.query(
      "SELECT object_key FROM media WHERE owner_id = $1 UNION ALL SELECT object_key FROM voice_notes WHERE owner_id = $1",
      [owner]
    );
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO removed_songs (owner_id, scope, video_id) SELECT owner_id, scope, video_id FROM songs WHERE owner_id = $1 ON CONFLICT DO NOTHING",
        [owner]
      );
      for (const t of ["stories", "songs", "media", "voice_notes", "feedback", "community_playlists", "profiles"])
        await client.query(`DELETE FROM ${t} WHERE owner_id = $1`, [owner]);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
    await Promise.all(keys.rows.map((r) => files.delete(r.object_key).catch(() => {})));
  } else {
    throw new Error("bad delete request");
  }
  revalidatePath("/admin");
}
