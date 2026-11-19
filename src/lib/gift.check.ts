// Run: node src/lib/gift.check.ts
import assert from "node:assert/strict";
import { encodeGift, decodeGift } from "./gift.ts";

const g = { name: "Für dich 💜", to: "Maya", ids: ["dQw4w9WgXcQ", "kJQP7kiw5Fk"] };
assert.deepEqual(decodeGift(encodeGift(g)), g, "round-trips unicode");
assert.ok(!/[+/=]/.test(encodeGift(g)), "url-safe");
assert.equal(decodeGift("garbage!!"), null);
assert.equal(decodeGift(encodeGift({ ...g, ids: [] })), null, "empty playlist rejected");
assert.deepEqual(decodeGift(encodeGift({ ...g, ids: ["bad", "<script>xx", "dQw4w9WgXcQ"] }))?.ids, ["dQw4w9WgXcQ"]);
assert.equal(decodeGift(encodeGift({ ...g, name: "  " }))?.name, "A playlist for you");
console.log("gift: all checks passed");
