import { PlayMyList } from "@/components/App";
import { SITE_URL } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "PlayMyList",
      description: "Mood-based music playlists, anonymous stories and voice notes for every feeling.",
      inLanguage: "en",
      creator: { "@id": `${SITE_URL}/#vish` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#vish`,
      name: "Vish Damodare",
      url: SITE_URL,
      sameAs: ["https://instagram.com/vish_damodare"],
    },
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PlayMyList />
    </>
  );
}
