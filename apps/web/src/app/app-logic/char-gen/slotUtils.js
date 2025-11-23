import { SLOT_DRAW_ORDER_TOP_FIRST } from './constants';

// Map each known slot to a bottom-first rank (0 = closest to base). Unknown slots get 1000+
const __SLOT_RANK = (() => {
  const m = new Map();
  const n = SLOT_DRAW_ORDER_TOP_FIRST.length;
  for (let i = 0; i < n; i++) {
    const slot = SLOT_DRAW_ORDER_TOP_FIRST[i];
    const bottomFirstRank = (n - 1) - i; // base:0, tattoo:1, …, shoulder:last
    m.set(slot, bottomFirstRank);
  }
  return m;
})();

export function slotRank(slotName) {
  const r = __SLOT_RANK.get(slotName);
  return (typeof r === 'number') ? r : 1000; // unknowns sorted alphabetically beyond known ones
}

// --- UI grouping helpers: treat "adornment+neck", "adornment+chest" as one control ("adornment") ---
export function slotBaseName(slotKey) {
  const s = String(slotKey || '');
  const i = s.indexOf('+');
  return i === -1 ? s : s.slice(0, i);
}

export function groupSlotKeysFor(node, base) {
  const order = node?.presets?.order || {};
  const keys = Object.keys(order).filter((k) => slotBaseName(k) === base);
  // sort deterministically: bottom-first rank, then lexicographic (stable)
  return keys.sort((a, b) => {
    const ra = slotRank(a);
    const rb = slotRank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

// Build a flat, ID-sorted list of entries across a base group; skips duplicate IDs (keeps first occurrence).
export function buildGroupEntries(node, base) {
  const keys = groupSlotKeysFor(node, base);
  const out = [];
  const seen = new Set();

  for (const k of keys) {
    const ti = node?.presets?.order?.[k];
    if (typeof ti !== 'number') continue;
    const arr = node?.template?.[ti] || [];
    for (let idx = 1; idx < arr.length; idx++) { // skip blank at 0
      const it = arr[idx];
      const id = Number(it?.id || 0);
      if (!Number.isFinite(id) || id <= 0) continue;

      const dupKey = `${base}:${id}`;
      if (seen.has(dupKey)) {
        // Allow duplicate ids across all features. Keep only the first occurrence for the UI entry list.
        continue;
      }
      seen.add(dupKey);
      out.push({ slotKey: k, arrIndex: idx, id });
    }
  }

  out.sort((a, b) => a.id - b.id);
  return out;
}
