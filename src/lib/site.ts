/** Public origin for canonical URLs, sitemap and share cards. Set NEXT_PUBLIC_SITE_URL when a custom domain is added. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://playmylist-ten.vercel.app").replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "Mood-based music playlists for every feeling. Press play, leave an anonymous story or voice note, and find songs for love, heartbreak, lonely nights and long drives.";
