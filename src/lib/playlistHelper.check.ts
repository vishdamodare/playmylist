// Run: node src/lib/playlistHelper.check.ts   (Node 22.6+ strips the types)
import assert from "node:assert/strict";
import { extractVideoId, parsePlaylistInput } from "./playlistHelper.ts";

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

// Spotify detection still works.
assert.equal(parsePlaylistInput("https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd?si=x").provider, "spotify");
// Watch link inside a playlist still loads the playlist (mood config behaviour unchanged).
assert.equal(parsePlaylistInput(`https://www.youtube.com/watch?v=${ID}&list=PLabc`).type, "playlist");

console.log("playlistHelper: all checks passed");
