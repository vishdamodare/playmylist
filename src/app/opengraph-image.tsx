import { ogCard, OG_SIZE } from "@/lib/ogCard";

export const alt = "PlayMyList: what does your heart sound like tonight?";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "PLAYMYLIST",
    title: "What does your heart sound like tonight?",
    line: "Mood playlists, anonymous stories and voice notes for every feeling.",
    from: "#2b1a4a",
    via: "#4a2040",
    accent: "#d6b25e",
  });
}
