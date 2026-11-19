// Run: node src/lib/playlistHelper.check.ts   (Node 22.6+ strips the types)
import assert from "node:assert/strict";
import { extractVideoId, extractListId, parsePlaylistInput, queueVideoIds } from "./playlistHelper.ts";

const ID = "TQqBjSAK52s";
for (const link of [
  ID,
  `https://www.youtube.com/watch?v=${ID}`,
  `https://youtube.com/watch?v=${ID}&list=RDTQqBjSAK52s&start_radio=1`,
  `https://music.youtube.com/watch?v=${ID}&si=abc123`,
  `https://youtu.be/${ID}?si=Xy7_abc`,
  `https://m.youtube.com/watch?feature=share&v=${ID}`,
  `https://www.youtube.com/shorts/${ID}`,
  `https://www.youtube.com/embed/${ID}`,
  `  ${ID}  `,
]) {
  assert.equal(extractVideoId(link), ID, link);
}

assert.equal(extractVideoId("https://www.youtube.com/playlist?list=PL1234567890"), null);
assert.equal(extractVideoId("hello world"), null);
assert.equal(extractVideoId("https://open.spotify.com/track/abc"), null);

// Regression: youtu.be share links carry ?si= and used to be misread as Spotify.
const share = parsePlaylistInput(`https://youtu.be/${ID}?si=Xy7_abc`);
assert.equal(share.provider, "youtube");
assert.equal(share.id, ID);

// queueVideoIds: valid, de-duplicated, links reduced to IDs
assert.deepEqual(queueVideoIds([ID, `https://youtu.be/${ID}`, "bad", "kJQP7kiw5Fk", "https://www.youtube.com/playlist?list=PL1234567890"]), [ID, "kJQP7kiw5Fk"]);

// extractListId: whole-playlist links (playlist page, album, mix) — but a song inside a playlist stays a song
const PL = "PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj";
assert.equal(extractListId(`https://www.youtube.com/playlist?list=${PL}`), PL);
assert.equal(extractListId(`https://music.youtube.com/playlist?list=OLAK5uy_kCNYhvZ5_RVbpeTq9PL&si=x`), "OLAK5uy_kCNYhvZ5_RVbpeTq9PL");
assert.equal(extractListId(`https://www.youtube.com/watch?v=${ID}&list=RD${ID}&start_radio=1`), `RD${ID}`);
assert.equal(extractListId(`https://www.youtube.com/watch?v=${ID}&list=${PL}&index=3`), null);
assert.equal(extractListId(PL), PL);
assert.equal(extractListId(`https://youtu.be/${ID}`), null);
assert.equal(extractListId("https://www.youtube.com/playlist?list=WL"), null);
assert.equal(extractListId("hello"), null);

// Spotify detection still works.
assert.equal(parsePlaylistInput("https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd?si=x").provider, "spotify");
// Watch link inside a playlist still loads the playlist (mood config behaviour unchanged).
assert.equal(parsePlaylistInput(`https://www.youtube.com/watch?v=${ID}&list=PLabc`).type, "playlist");

console.log("playlistHelper: all checks passed");
