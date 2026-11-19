import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL, SITE_DESCRIPTION } from "@/lib/site";

const TITLE = "PlayMyList: Mood Playlists & Stories for Every Feeling";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | PlayMyList" },
  description: SITE_DESCRIPTION,
  applicationName: "PlayMyList",
  authors: [{ name: "Vish Damodare", url: "https://instagram.com/vish_damodare" }],
  creator: "Vish Damodare",
  keywords: ["mood playlist", "songs for my mood", "love songs", "sad songs", "late night songs", "long distance songs", "anonymous stories"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "PlayMyList", title: TITLE, description: SITE_DESCRIPTION, url: "/", locale: "en_US" },
  twitter: { card: "summary_large_image", title: TITLE, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
  verification: { google: "IQ4vfKuj7dIfGyBZ-FgXiHI8dbSzREeS2BrIS5jxKsQ" }, // Google Search Console
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* warm up YouTube (player + thumbnails) while the page loads, so the first song starts sooner */}
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500&family=Caveat:wght@500;600&family=Special+Elite&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
