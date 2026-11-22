import type { Metadata } from "next";
import { db } from "@/lib/server/db";
import { files } from "@/lib/server/files";
import { MOODS } from "@/data/moods";
import { isUuid } from "@/lib/server/validate";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "PlayMyList · Admin", robots: { index: false, follow: false } };

const scopeName = (s: string) => (s === "my-playlist" ? "My Playlist" : MOODS.find((m) => m.slug === s)?.label ?? s);
const when = (d: string | Date) =>
  new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
const short = (id: string) => id.slice(0, 8);

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export default async function Admin({ searchParams }: { searchParams: { owner?: string } }) {
  const owner = isUuid(searchParams.owner) ? searchParams.owner : null;
  // $1 = owner filter (NULL = everyone)
  const where = (col = "owner_id") => `($1::uuid IS NULL OR ${col} = $1::uuid)`;
  const [people, stories, songs, media, voice, totals, feedback, playlists] = await Promise.all([
    db.query(
      `WITH acts AS (
         SELECT owner_id, created_at AS at FROM stories UNION ALL
         SELECT owner_id, created_at FROM songs UNION ALL
         SELECT owner_id, created_at FROM media UNION ALL
         SELECT owner_id, created_at FROM voice_notes UNION ALL
         SELECT owner_id, updated_at FROM profiles)
       SELECT a.owner_id, p.display_name, min(a.at) AS first_seen, max(a.at) AS last_seen,
         (SELECT count(*) FROM stories s WHERE s.owner_id = a.owner_id)::int AS stories,
         (SELECT count(*) FROM songs s WHERE s.owner_id = a.owner_id)::int AS songs,
         (SELECT count(*) FROM media m WHERE m.owner_id = a.owner_id)::int AS media,
         (SELECT count(*) FROM voice_notes v WHERE v.owner_id = a.owner_id)::int AS voice
       FROM acts a LEFT JOIN profiles p USING (owner_id)
       WHERE ${where("a.owner_id")}
       GROUP BY a.owner_id, p.display_name ORDER BY last_seen DESC LIMIT 500`,
      [owner]
    ),
    db.query(
      `SELECT s.id, s.owner_id, s.mood, s.title, s.content, s.author, p.display_name, s.created_at
       FROM stories s LEFT JOIN profiles p USING (owner_id) WHERE ${where("s.owner_id")} ORDER BY s.created_at DESC LIMIT 300`,
      [owner]
    ),
    db.query(
      `SELECT s.owner_id, s.scope, s.video_id, s.title, s.author, p.display_name, s.created_at
       FROM songs s LEFT JOIN profiles p USING (owner_id) WHERE ${where("s.owner_id")} ORDER BY s.created_at DESC LIMIT 500`,
      [owner]
    ),
    db.query(
      `SELECT m.id, m.owner_id, m.scope, m.object_key, m.content_type, m.size_bytes, p.display_name, m.created_at
       FROM media m LEFT JOIN profiles p USING (owner_id) WHERE ${where("m.owner_id")} ORDER BY m.created_at DESC LIMIT 120`,
      [owner]
    ),
    db.query(
      `SELECT v.id, v.owner_id, v.mood, v.object_key, v.duration_s, p.display_name, v.created_at
       FROM voice_notes v LEFT JOIN profiles p USING (owner_id) WHERE ${where("v.owner_id")} ORDER BY v.created_at DESC LIMIT 120`,
      [owner]
    ),
    db.query(
      `SELECT (SELECT count(*) FROM profiles)::int AS names, (SELECT count(*) FROM stories)::int AS stories,
              (SELECT count(*) FROM songs)::int AS songs, (SELECT count(*) FROM media)::int AS media,
              (SELECT count(*) FROM voice_notes)::int AS voice, (SELECT count(*) FROM feedback)::int AS feedback`
    ),
    db.query(
      `SELECT f.id, f.owner_id, f.rating, f.message, f.contact, f.page, p.display_name, f.created_at
       FROM feedback f LEFT JOIN profiles p USING (owner_id) WHERE ${where("f.owner_id")} ORDER BY f.created_at DESC LIMIT 300`,
      [owner]
    ),
    db.query(
      `SELECT c.id, c.owner_id, c.name, c.creator, c.song_ids, p.display_name, c.created_at,
         (SELECT coalesce(jsonb_object_agg(x.video_id, x.title), '{}')
            FROM (SELECT DISTINCT ON (video_id) video_id, title FROM songs WHERE video_id = ANY(c.song_ids) AND title <> '') x) AS titles
       FROM community_playlists c LEFT JOIN profiles p USING (owner_id) WHERE ${where("c.owner_id")} ORDER BY c.created_at DESC LIMIT 100`,
      [owner]
    ),
  ]);
  const withUrl = (rows: Row[]): Promise<Row[]> =>
    Promise.all(rows.map(async (r) => ({ ...r, url: await files.url(r.object_key, { expiresIn: 3600 }).catch(() => null) })));
  const [mediaRows, voiceRows] = await Promise.all([withUrl(media.rows), withUrl(voice.rows)]);
  const t = totals.rows[0];
  const who = (r: Row) => (
    <a href={`/admin?owner=${r.owner_id}`} className="who">
      {r.display_name || <i>no name</i>} <code>{short(r.owner_id)}</code>
    </a>
  );
  const focus = owner ? people.rows[0] : null;

  return (
    <div className="adm">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <header>
        <h1>PlayMyList admin</h1>
        <nav>
          <a href="#feedback">Feedback</a>
          <a href="#playlists">Home page playlists</a>
          <a href="#people">People</a>
          <a href="#songs">Songs</a>
          <a href="#stories">Stories</a>
          <a href="#media">Photos &amp; videos</a>
          <a href="#voice">Voice notes</a>
        </nav>
      </header>

      {owner ? (
        <p className="filter">
          Showing only <b>{focus?.display_name || "an unnamed visitor"}</b> <code>{owner}</code> · <a href="/admin">show everyone</a>
        </p>
      ) : (
        <div className="stats">
          {[
            ["Feedback", t.feedback],
            ["People with a name", t.names],
            ["Songs added", t.songs],
            ["Stories", t.stories],
            ["Photos & videos", t.media],
            ["Voice notes", t.voice],
          ].map(([k, v]) => (
            <div key={k as string}>
              <b>{v}</b>
              <span>{k}</span>
            </div>
          ))}
        </div>
      )}

      <section id="feedback">
        <h2>Feedback ({feedback.rowCount})</h2>
        <div className="cards">
          {feedback.rows.map((r) => (
            <article key={r.id}>
              <header>
                <b>{r.rating ? ["", "😕 Not for me", "😐 It's okay", "🙂 It's nice", "😍 Love it"][r.rating] : "No rating"}</b>
                <span>{r.page ? scopeName(r.page) : ""}</span>
              </header>
              <p>{r.message}</p>
              {r.contact && <small>Reach them: {r.contact}</small>}
              <footer>
                <span>{who(r)} · {when(r.created_at)}</span>
                <DeleteButton fields={{ kind: "feedback", id: r.id }} confirmText="Remove this feedback?" />
              </footer>
            </article>
          ))}
          {!feedback.rowCount && <p><i>No feedback yet.</i></p>}
        </div>
      </section>

      <section id="playlists">
        <h2>Home page playlists ({playlists.rowCount})</h2>
        <div className="cards">
          {playlists.rows.map((r) => (
            <article key={r.id}>
              <header><b>{r.name}</b><span>by {r.creator} · {r.song_ids.length} songs</span></header>
              <ol className="pl">
                {(r.song_ids as string[]).map((v) => (
                  <li key={v}>
                    <a href={`https://www.youtube.com/watch?v=${v}`} target="_blank" rel="noreferrer">{r.titles[v] || v}</a>
                    <DeleteButton
                      label="Remove"
                      fields={{ kind: "playlist-song", id: r.id, scope: v }}
                      confirmText={
                        r.song_ids.length === 1
                          ? `This is the last song — removing it deletes “${r.name}”. Continue?`
                          : `Remove “${r.titles[v] || v}” from “${r.name}”?`
                      }
                    />
                  </li>
                ))}
              </ol>
              <footer>
                <span>{who(r)} · {when(r.created_at)}</span>
                <DeleteButton fields={{ kind: "playlist", id: r.id }} confirmText={`Delete the playlist “${r.name}” from the home page?`} />
              </footer>
            </article>
          ))}
          {!playlists.rowCount && <p><i>No playlists published yet.</i></p>}
        </div>
      </section>

      <section id="people">
        <h2>People ({people.rowCount})</h2>
        <div className="scroll">
          <table>
            <thead>
              <tr><th>Name</th><th>Songs</th><th>Stories</th><th>Media</th><th>Voice</th><th>First seen</th><th>Last active</th><th></th></tr>
            </thead>
            <tbody>
              {people.rows.map((r) => (
                <tr key={r.owner_id}>
                  <td>{who(r)}</td><td>{r.songs}</td><td>{r.stories}</td><td>{r.media}</td><td>{r.voice}</td>
                  <td>{when(r.first_seen)}</td><td>{when(r.last_seen)}</td>
                  <td>
                    <DeleteButton
                      label="Delete all"
                      fields={{ kind: "person", owner: r.owner_id }}
                      confirmText={`Delete EVERYTHING from ${r.display_name || "this visitor"}? Their name, stories, songs, photos, videos and voice notes. This can't be undone.`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="songs">
        <h2>Songs added ({songs.rowCount})</h2>
        <div className="scroll">
          <table>
            <thead><tr><th>Song</th><th>Added to</th><th>By</th><th>When</th><th></th></tr></thead>
            <tbody>
              {songs.rows.map((r) => (
                <tr key={`${r.owner_id}${r.scope}${r.video_id}`}>
                  <td>
                    <a href={`https://www.youtube.com/watch?v=${r.video_id}`} target="_blank" rel="noreferrer">
                      {r.title || r.video_id}
                    </a>
                    {r.author && <small> · {r.author}</small>}
                  </td>
                  <td>{scopeName(r.scope)}</td><td>{who(r)}</td><td>{when(r.created_at)}</td>
                  <td>
                    <DeleteButton
                      fields={{ kind: "song", owner: r.owner_id, scope: r.scope, id: r.video_id }}
                      confirmText={`Remove “${r.title || r.video_id}” from ${scopeName(r.scope)}?`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="stories">
        <h2>Stories ({stories.rowCount})</h2>
        <div className="cards">
          {stories.rows.map((r) => (
            <article key={r.id}>
              <header><b>{r.title}</b><span>{scopeName(r.mood)}</span></header>
              <p>{r.content}</p>
              <footer>
                <span>{r.author ? `signed “${r.author}” · ` : ""}{who(r)} · {when(r.created_at)}</span>
                <DeleteButton fields={{ kind: "story", id: r.id }} confirmText={`Delete the story “${r.title}”?`} />
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section id="media">
        <h2>Photos &amp; videos ({media.rowCount})</h2>
        <div className="grid">
          {mediaRows.map((r) => (
            <figure key={r.id}>
              {r.url && (r.content_type.startsWith("video/") ? <video src={r.url} controls preload="metadata" /> : <img src={r.url} alt="" loading="lazy" />)}
              <figcaption>
                <span>{scopeName(r.scope)} · {who(r)} · {when(r.created_at)}</span>
                <DeleteButton fields={{ kind: "media", id: r.id }} confirmText="Delete this photo/video?" />
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="voice">
        <h2>Voice notes ({voice.rowCount})</h2>
        <div className="scroll">
          <table>
            <thead><tr><th>Listen</th><th>Mood</th><th>By</th><th>When</th><th></th></tr></thead>
            <tbody>
              {voiceRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.url ? <audio src={r.url} controls preload="none" /> : "—"} <small>{r.duration_s}s</small></td>
                  <td>{scopeName(r.mood)}</td><td>{who(r)}</td><td>{when(r.created_at)}</td>
                  <td><DeleteButton fields={{ kind: "voice", id: r.id }} confirmText="Delete this voice note?" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const css = `
.adm{min-height:100vh;background:#0f0c1a;color:#ece6f5;font:14px/1.5 system-ui,-apple-system,sans-serif;padding:24px 16px 80px;max-width:1200px;margin:0 auto}
.adm a{color:#c4a6ff;text-decoration:none}.adm a:hover{text-decoration:underline}
.adm>header{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:baseline;justify-content:space-between;margin-bottom:20px}
.adm h1{font-size:22px;margin:0;letter-spacing:.02em}.adm nav{display:flex;flex-wrap:wrap;gap:14px}
.adm h2{font-size:16px;margin:36px 0 12px;color:#fff}
.adm code{font-size:11px;color:#8a80a3;background:#1d1830;padding:1px 5px;border-radius:4px}
.adm small{color:#9a90b3}.adm i{color:#8a80a3}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.stats div{background:#1a1528;border:1px solid #2b2342;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column}
.stats b{font-size:26px;color:#fff}.stats span{color:#9a90b3;font-size:12px}
.filter{background:#1a1528;border:1px solid #2b2342;border-radius:10px;padding:10px 14px}
.scroll{overflow-x:auto;border:1px solid #2b2342;border-radius:12px}
.adm table{border-collapse:collapse;width:100%;min-width:640px}
.adm th,.adm td{text-align:left;padding:9px 12px;border-bottom:1px solid #231d36;vertical-align:top}
.adm th{background:#171226;color:#9a90b3;font-weight:500;font-size:12px;position:sticky;top:0}
.adm tr:last-child td{border-bottom:0}.who{white-space:nowrap}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.cards article{background:#1a1528;border:1px solid #2b2342;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px}
.cards header{display:flex;justify-content:space-between;gap:8px}.cards header span{color:#9a90b3;font-size:12px;white-space:nowrap}
.cards p{margin:0;white-space:pre-wrap;max-height:9em;overflow:auto;color:#d6cfe6}
.cards footer{font-size:12px;color:#9a90b3}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.grid figure{margin:0;background:#1a1528;border:1px solid #2b2342;border-radius:12px;overflow:hidden}
.grid img,.grid video{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#000}
.grid figcaption{padding:8px 10px;font-size:12px;color:#9a90b3}
.del{display:inline;margin:0}.del button{background:none;border:1px solid #5a2a3a;color:#ff8fa3;border-radius:6px;padding:3px 9px;font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.del button:hover{background:#3a1622;border-color:#ff8fa3}
.cards footer,.grid figcaption{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.pl{margin:0;padding-left:20px;max-height:14em;overflow:auto;font-size:13px}.pl li{display:flex;justify-content:space-between;gap:8px;padding:2px 0}.pl a{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.adm audio{height:32px;vertical-align:middle;max-width:220px}
`;
