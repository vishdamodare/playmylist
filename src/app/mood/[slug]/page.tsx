import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOODS } from "@/data/moods";
import { PlayMyList } from "@/components/App";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false; // only real moods; anything else 404s

export function generateStaticParams() {
  return MOODS.map((m) => ({ slug: m.slug }));
}

const find = (slug: string) => MOODS.find((m) => m.slug === slug);

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const m = find(params.slug);
  if (!m) return {};
  const title = `${m.label} Songs & Stories: ${m.playlistName}`;
  const description = `${m.quote} Play the ${m.playlistName} playlist and read anonymous ${m.label} stories on PlayMyList.`;
  const url = `/mood/${m.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "music.playlist" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function MoodPage({ params }: { params: { slug: string } }) {
  const m = find(params.slug);
  if (!m) notFound();
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "PlayMyList", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: m.label, item: `${SITE_URL}/mood/${m.slug}` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <PlayMyList initialView={m.slug} />
    </>
  );
}
