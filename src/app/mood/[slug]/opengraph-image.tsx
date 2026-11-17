import { MOODS } from "@/data/moods";
import { ogCard, OG_SIZE } from "@/lib/ogCard";

export const alt = "A PlayMyList mood";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return MOODS.map((m) => ({ slug: m.slug }));
}

export default function Image({ params }: { params: { slug: string } }) {
  const m = MOODS.find((x) => x.slug === params.slug) ?? MOODS[0];
  return ogCard({
    eyebrow: `PLAYMYLIST · ${m.label.toUpperCase()}`,
    title: m.quote,
    line: `${m.playlistName}: press play and leave your story.`,
    from: m.theme.via,
    via: m.theme.to,
    accent: m.theme.accent,
  });
}
