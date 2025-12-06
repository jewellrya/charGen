'use client';

import Link from "next/link";
import useClickSound from "../components/useClickSound";

export default function MarketingPage() {
  const playClick = useClickSound();
  return (
    <main className="py-12 space-y-10">
      <section className="grid gap-8 md:grid-cols-2 items-start">
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-base-content/90">
            Forge your legend in The Trials of Nral — a hand-crafted NFT collection of adventurers,
            relics, and stories bound to the on-chain realm. Every character is assembled from
            rich pixel art, battle-worn gear, and lore-driven traits that shape how your hero steps
            into the world.
          </p>
          <div className="space-y-3 text-base-content/80">
            <p className="font-semibold text-primary text-lg">What awaits:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Curated traits with 1/1 artifacts and faction-aligned armaments</li>
              <li>On-chain provenance with rarity baked into every mint</li>
              <li>Adventure hooks that evolve as the world expands</li>
              <li>Playable-ready exports for sharing, minting, and storytelling</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/new-character" className="btn btn-game primary" onClick={() => playClick()}>
              <span>Forge a New Character</span>
            </Link>
            <Link href="/adventure" className="btn btn-game secondary" onClick={() => playClick()}>
              <span>Explore Adventures</span>
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-lg frame-9slice-fancy bg-base-100/70 backdrop-blur">
          <h2 className="text-2xl font-semibold mb-4">Drop Timeline</h2>
          <div className="space-y-3 text-base-content/85">
            <div>
              <p className="font-semibold text-primary">Phase I: Character Forge</p>
              <p>Open the workshop, customize your hero, and lock in their immutable traits.</p>
            </div>
            <div>
              <p className="font-semibold text-primary">Phase II: Relic Hunts</p>
              <p>Embark on limited-run hunts to secure artifacts that alter your destiny.</p>
            </div>
            <div>
              <p className="font-semibold text-primary">Phase III: Trials</p>
              <p>Drop into episodic adventures where your NFT determines your path.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Why Nral?</h3>
        <p className="text-base leading-relaxed text-base-content/90">
          The Trials of Nral blends collectible depth with interactive storytelling.
          Your tokens are more than static art: they are composable heroes ready for
          quests, raids, and the unfolding canon of this universe. Secure your place now
          and be ready when the gate to adventure opens.
        </p>
      </section>
    </main>
  );
}
