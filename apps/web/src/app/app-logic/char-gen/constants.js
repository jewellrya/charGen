export const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAp8B6j3pBV8AAAAASUVORK5CYII=';

// --- Feature groups to exclude from the right-side UI (by base name) ---
// Use lower-case base keys here (e.g., "weapon"). Add more bases as needed.
export const EXCLUDED_FEATURE_BASES = new Set(['weapon']);

export function isExcludedFeatureBase(key) {
  const k = String(key || '').toLowerCase();
  return EXCLUDED_FEATURE_BASES.has(k);
}

// Slot draw order provided by user (from TOP-most to BOTTOM).
// Supports composite overrides like "adornment+chest" or "adornment+neck".
// We'll convert this to a bottom-first rank so we can draw base first,
// then tattoo → … → shoulder last.
export const SLOT_DRAW_ORDER_TOP_FIRST = [
  // TOP-most → BOTTOM
  'shoulder',
  'weapon',          // front-side weapons (draw above character)
  'helmet',
  'adornment+head',
  'beard',
  'hair',
  'adornment+neck',
  'hands',
  'chest',
  'adornment+chest',
  'feet',
  'legs',
  'adornment',
  'weapon+back',     // back-side weapons (draw behind body/hair)
  'underwear',
  'tattoo',
  'base'             // base handled separately; kept for completeness
];

// Right‑panel feature & color UI order (top → bottom). Items not listed here
// will appear afterward in their existing discovery order. Special tokens:
//   - 'hairColor'   → Hair color swatch block
//   - 'tattooColor' → Tattoo color swatch block
export const FEATURE_PANEL_ORDER_TOP_FIRST = [
  'skin',
  'hair',
  'beard',
  'hairColor',
  'tattoo',
  'tattooColor',
  'adornment',
];

// Class controls
export const CLASS_OPTIONS = [
  'Fighter', 'Ranger', 'Rogue', 'Sorceror', 'Cleric', 'Warlock', 'Paladin', 'Druid', 'Shaman'
];

// --- Class → ArmorType mapping (auto-equips if sprites exist) ---
export const CLASS_TO_ARMOR = {
  sorceror: 'cloth', cleric: 'cloth', warlock: 'cloth',
  ranger: 'leather', druid: 'leather', shaman: 'leather', rogue: 'leather',
  fighter: 'mail', paladin: 'mail'
};

// --- Class → Weapon mapping (selects weapon slot by id; clears if missing) ---
export const CLASS_TO_WEAPON = {
  sorceror: 2, cleric: 2, warlock: 2, shaman: 2, druid: 2,
  fighter: 1, paladin: 1,
  ranger: 3,
  rogue: 4,
};

// Per-class armor filter masks
export const CLASS_ARMOR_FILTERS = {
  sorceror: { h: null, s: null, l: null, b: null, c: null },
  cleric:   { h: null, s: -80, l: null, b: +20, c: +30 },
  warlock:  { h: -125, s: -30, l: null, b: -120, c: +50 },
  shaman:   { h: -20, s: -30, l: null, b: -80, c: -20 },
  druid:    { h: +55, s: -30, l: null, b: -40, c: +40 },
  fighter:  { h: null, s: null, l: null, b: null, c: null },
  paladin:  { h: +30, s: +120, l: null, b: +80, c: null },
  ranger:   { h: null, s: null, l: null, b: null, c: null },
  rogue:    { h: null, s: -80, l: null, b: -60, c: null },
};
