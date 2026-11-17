import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** 1200×630 share card: gradient, eyebrow, big title, one line underneath. Shared by the site + each mood. */
export function ogCard(o: { eyebrow: string; title: string; line: string; from: string; via: string; accent: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background: `linear-gradient(135deg, ${o.from} 0%, ${o.via} 55%, #0d0a1a 100%)`,
          color: "#f3ece4",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, letterSpacing: 10, color: o.accent }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: "#1b1430", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff6f96", fontSize: 26, letterSpacing: 0 }}>
            ♥
          </div>
          {o.eyebrow}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 78, fontStyle: "italic", lineHeight: 1.05, maxWidth: 1000 }}>{o.title}</div>
          <div style={{ fontSize: 32, color: "rgba(243,236,228,.75)", maxWidth: 980, lineHeight: 1.35 }}>{o.line}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, letterSpacing: 4, color: "rgba(243,236,228,.6)" }}>
          <span>MUSIC · STORIES · ONE FEELING</span>
          <span>made with ♥ by Vish</span>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
