import type { MetadataRoute } from "next";
import { MOODS } from "@/data/moods";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...MOODS.map((m) => ({
      url: `${SITE_URL}/mood/${m.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const, // new stories land on mood pages
      priority: 0.8,
    })),
  ];
}
