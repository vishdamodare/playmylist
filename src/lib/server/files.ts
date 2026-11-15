import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

// Neon Object Storage via the Files SDK. Endpoint, region and credentials come from the
// AWS_* variables `neon deploy` / `neon env pull` wrote for this branch.
export const BUCKET = "assets";
// Created on first use, not at import: `next build` loads every route to collect page data,
// and the adapter throws if the AWS_* env vars aren't present at build time.
let client: Files | null = null;
const get = () => (client ??= new Files({ adapter: neon({ bucket: BUCKET }) }));

export const files = new Proxy({} as Files, {
  get(_, key) {
    const f = get();
    const v = Reflect.get(f, key, f);
    return typeof v === "function" ? v.bind(f) : v;
  },
});
