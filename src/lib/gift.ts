/** A playlist made for someone else, carried entirely in a share link (?gift=…). No server needed. */
export interface Gift {
  name: string;
  to: string;
  ids: string[];
}

const ID = /^[\w-]{11}$/;

export function encodeGift(g: Gift): string {
  const bytes = new TextEncoder().encode(JSON.stringify({ n: g.name, t: g.to, s: g.ids }));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Untrusted URL input: returns null unless it decodes to a sane playlist. */
export function decodeGift(raw: string): Gift | null {
  try {
    const bin = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    const ids = Array.isArray(d.s) ? d.s.filter((x: unknown) => typeof x === "string" && ID.test(x)).slice(0, 200) : [];
    if (!ids.length) return null;
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    return { name: str(d.n, 60) || "A playlist for you", to: str(d.t, 40), ids };
  } catch {
    return null;
  }
}

export function giftUrl(g: Gift): string {
  return `${location.origin}${location.pathname}?gift=${encodeGift(g)}`;
}

/** What the read-only playlist view shows: a gift link, or a listener's published playlist (`by`). */
export interface Received extends Gift {
  by?: string;
  id?: string;
  mine?: boolean;
}
