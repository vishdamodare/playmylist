"use client";

import React from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { MOODS } from "@/data/moods";

interface HomeProps {
  onSelectMood: (slug: string) => void;
}

export function Home({ onSelectMood }: HomeProps) {
  return (
    <div className="pml-home">
      <div className="pml-home-bg">
        <div className="pml-orb" />
        <div className="pml-grain" />
      </div>

      <header>
        <nav className="pml-nav" aria-label="Main Navigation">
          <div className="pml-wordmark">PLAYMYLIST</div>
          <div className="pml-navlinks">
            <span className="cursor-pointer hover:text-white transition-colors">Discover</span>
            <span className="cursor-pointer hover:text-white transition-colors">Stories</span>
            <span className="cursor-pointer hover:text-white transition-colors">Playlists</span>
          </div>
        </nav>
      </header>

      <main className="pml-hero">
        <h1>What does your heart sound like tonight?</h1>
        <p className="pml-mono" style={{ fontSize: 11 }}>
          MUSIC · STORIES · VISUALS · ONE FEELING
        </p>

        <div className="pml-moodgrid" role="list" aria-label="Select Mood">
          {MOODS.map((m) => (
            <button
              key={m.slug}
              className="pml-moodchip"
              role="listitem"
              onClick={() => onSelectMood(m.slug)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          className="pml-explore"
          onClick={() => {
            if (MOODS.length > 0) onSelectMood(MOODS[0].slug);
          }}
        >
          Explore all moods <ArrowRight size={13} />
        </button>
      </main>

      <div className="pml-scrolldown" aria-hidden="true">
        <ChevronDown size={18} />
      </div>
    </div>
  );
}
