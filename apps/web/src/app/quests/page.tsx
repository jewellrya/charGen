'use client';

import Link from "next/link";
import useClickSound from "../../components/useClickSound";

export default function QuestPage() {
  const playClick = useClickSound();
  return (
    <main className="py-10 space-y-8 flex-1 flex flex-col">
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Adventures are assembling</h2>
        <p className="text-base leading-relaxed text-base-content/90">
          The first campaign modules are being forged. Soon, your minted heroes will
          brave episodic trials, relic hunts, and faction quests that evolve alongside the
          collection. Stay tuned for drops that unlock paths based on your on-chain traits.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/new-character" className="btn btn-game primary" onClick={() => playClick()}>
            <span>Forge a New Character</span>
          </Link>
          <Link href="/" className="btn btn-game secondary" onClick={() => playClick()}>
            <span>Back to Lore</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
