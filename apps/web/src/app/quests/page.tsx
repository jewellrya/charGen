'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "../../components/icons";
import useClickSound from "../../components/useClickSound";

type Character = {
  id: string;
  name: string;
  title: string;
  level: number;
  class: string;
  origin: string;
  portraitHue: string;
  currency: { gold: number; silver: number; copper: number };
  equipped: { slot: string; item: string }[];
  bag: string[];
};

const characters: Character[] = [
  {
    id: "nral-1842",
    name: "Kaela Emberreach",
    title: "Warden of the North Span",
    level: 12,
    class: "Ranger",
    origin: "Shardfen",
    portraitHue: "from-amber-500/50 to-orange-700/70",
    currency: { gold: 128, silver: 43, copper: 9 },
    equipped: [
      { slot: "Weapon", item: "Moonbow Mk.II" },
      { slot: "Armor", item: "Skyweave Jerkin" },
      { slot: "Trinket", item: "Stone of the Vigils" },
    ],
    bag: ["Rope (50ft)", "Healing Draught x2", "Wayfinder", "Scout Rations"],
  },
  {
    id: "nral-2077",
    name: "Tarin Blackglass",
    title: "Arcanist of the Obsidian Choir",
    level: 15,
    class: "Warlock",
    origin: "Ebonreach",
    portraitHue: "from-indigo-500/50 to-purple-700/70",
    currency: { gold: 92, silver: 11, copper: 47 },
    equipped: [
      { slot: "Weapon", item: "Hexbound Scepter" },
      { slot: "Armor", item: "Nightlace Cloak" },
      { slot: "Trinket", item: "Witchglass Sigil" },
    ],
    bag: ["Dark Aether Vial", "Spell Ink", "Ancient Coin", "Warding Chalk"],
  },
  {
    id: "nral-0310",
    name: "Ryn of Hollowforge",
    title: "Breaker of Seals",
    level: 9,
    class: "Cleric",
    origin: "The Hollow",
    portraitHue: "from-teal-500/50 to-emerald-700/70",
    currency: { gold: 41, silver: 88, copper: 5 },
    equipped: [
      { slot: "Weapon", item: "Sunglass Mace" },
      { slot: "Armor", item: "Aegis of Dawn" },
      { slot: "Trinket", item: "Reliquary of Light" },
    ],
    bag: ["Blessed Water", "Incense x3", "Bone Dice", "Field Journal"],
  },
];

const quests = [
  {
    title: "Echoes in the Verdant Barrow",
    tier: "Elite",
    summary: "Rootbound spirits guard relics beneath the moss. Recover the lost glyphstone before nightfall.",
    reward: "450 XP · 35g · Verdant Signet",
    risk: "Poison, spectral guardians, maze-like tunnels",
  },
  {
    title: "Ashen Messenger",
    tier: "Standard",
    summary: "Courier a sealed ember-scroll through contested airspace. Intercepted messages will ignite a skystorm.",
    reward: "310 XP · 18g · Favor with the Emberreach",
    risk: "Aerial skirmishers, line-of-sight wards",
  },
  {
    title: "Vault of the Obsidian Choir",
    tier: "Epic",
    summary: "Descend past mirrored wards to claim a resonant shard rumored to amplify spellcraft.",
    reward: "620 XP · 55g · Obsidian Resonator",
    risk: "Arcane backlash, shifting corridors, hexed sentries",
  },
];

export default function QuestPage() {
  const playClick = useClickSound();
  const [selectedId, setSelectedId] = useState<string>(characters[0]?.id ?? "");
  const selected = useMemo(
    () => characters.find((c) => c.id === selectedId) ?? characters[0],
    [selectedId],
  );

  return (
    <main className="py-6 md:py-10 space-y-6 flex-1 flex flex-col">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          {characters.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`btn btn-game ${selected?.id === c.id ? 'primary' : 'secondary'} h-auto py-2 px-3 flex items-center gap-3`}
              onClick={() => {
                playClick();
                setSelectedId(c.id);
              }}
            >
              <div
                className={`w-10 h-10 rounded-sm bg-gradient-to-br ${c.portraitHue} frame-9slice`}
                aria-hidden="true"
              />
              <div className="text-left leading-tight">
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs text-base-content/70">{c.class}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="ms-auto flex items-center gap-3">
          <button
            type="button"
            className="btn btn-game secondary"
            onClick={() => playClick()}
          >
            <Icon icon="Wallet" className="me-1" />
            <span>Sync Wallet</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Quest stack */}
        <div className="md:col-span-7 space-y-4 overflow-y-auto pr-1">
          {quests.map((q, idx) => (
            <article
              key={q.title}
              className="bg-base-200 px-4 py-4 md:px-6 md:py-5 space-y-3 rounded"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-primary/40 to-base-300/60 frame-9slice" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{q.title}</h3>
                    <span className="badge badge-sm badge-outline">{q.tier}</span>
                  </div>
                  <p className="text-sm text-base-content/80">{q.summary}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-primary font-semibold">{q.reward}</p>
                  <p className="text-xs text-base-content/70">Risks: {q.risk}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="btn btn-game primary"
                  onClick={() => playClick()}
                >
                  <span>Embark</span>
                </button>
                <button
                  type="button"
                  className="btn btn-game secondary"
                  onClick={() => playClick()}
                >
                  <span>Preview Intel</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Character sheet */}
        <div className="md:col-span-5 flex flex-col gap-4 min-h-0">
          <div className="bg-base-200 px-4 py-4 space-y-3 rounded">
            <div className="flex items-center gap-3">
              <div className={`w-16 h-16 rounded-sm bg-gradient-to-br ${selected?.portraitHue} frame-9slice`} />
              <div className="flex-1">
                <p className="text-sm uppercase tracking-wide text-base-content/60">{selected?.origin}</p>
                <h3 className="text-xl font-semibold leading-tight">{selected?.name}</h3>
                <p className="text-sm text-base-content/80">{selected?.title}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-base-content/70">Level</p>
                <p className="text-2xl font-semibold text-primary">{selected?.level}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-base-200/50 rounded">
                <p className="text-xs text-base-content/70">Gold</p>
                <p className="font-semibold text-primary">{selected?.currency.gold}</p>
              </div>
              <div className="p-2 bg-base-200/50 rounded">
                <p className="text-xs text-base-content/70">Silver</p>
                <p className="font-semibold text-primary">{selected?.currency.silver}</p>
              </div>
              <div className="p-2 bg-base-200/50 rounded">
                <p className="text-xs text-base-content/70">Copper</p>
                <p className="font-semibold text-primary">{selected?.currency.copper}</p>
              </div>
            </div>
          </div>

          <div className="bg-base-200 px-4 py-4 space-y-3 flex-1 min-h-0 overflow-y-auto rounded">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Equipped</h4>
                <span className="badge badge-outline">{selected?.class}</span>
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selected?.equipped.map((eq) => (
                <div key={eq.slot} className="p-3 bg-base-200/50 rounded">
                  <p className="text-xs text-base-content/70 uppercase tracking-wide">{eq.slot}</p>
                  <p className="font-semibold">{eq.item}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-2">Inventory</h4>
              <div className="grid grid-cols-2 gap-2">
                {selected?.bag.map((item) => (
                  <div key={item} className="p-2 bg-base-200/40 rounded text-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
