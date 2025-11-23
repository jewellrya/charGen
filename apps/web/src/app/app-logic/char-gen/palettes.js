export const hairColors = {
  // three targets: [light, mid, dark]; if you authored palettes as 2 tones before, we duplicate the second
  black1: ['#424247', '#232326', '#0e0e0f'],
  black2: ['#4b453e', '#302a24', '#14110f'],
  brown1: ['#51403a', '#362b27', '#241b18'],
  brown2: ['#5f4148', '#4e373d', '#3a292e'],
  brown3: ['#7a6966', '#574845', '#3f3533'],
  brown4: ['#a0815c', '#7e6648', '#5e4b36'],
  blonde1: ['#b9a088', '#a58f79', '#8e7764'],
  blonde2: ['#dbc6ad', '#c7b39d', '#a7927c'],
  blonde3: ['#f6dec2', '#dfc9b0', '#c2ae98'],
  red1: ['#9e6246', '#84523a', '#6c432f'],
  red2: ['#ab4438', '#8f392e', '#712d25'],
  gray1: ['#8a8a8a', '#787878', '#5f5f5f'],
  gray2: ['#acacac', '#909090', '#7a7a7a'],
  gray3: ['#c4c4c4', '#acacac', '#959595'],
  white1: ['#e4e4e4', '#d2d2d2', '#bdbdbd'],
};

export const tattooColors = {
  brown1: '#6d451e',
  brown2: '#9d7a65',
  red1: '#8a4646',
  red2: '#9b2121',
  orange1: '#d38c1a',
  yellow1: '#e1cb26',
  lime1: '#b8bc6b',
  green1: '#4a630c',
  green2: '#5ba347',
  cyan1: '#659d91',
  blue1: '#4164ab',
  violet1: '#75659d',
  black1: '#6a645f',
  gray1: '#a5a09a',
  white1: '#e6dbd2',
  white2: '#d5dae0',
};

function canonRace(s) {
  const t = (s || '').toLowerCase();
  const tnorm = t.replace(/[-_]/g, '');
  if (tnorm === 'halforc') return 'halforc';
  return tnorm;
}

export function getDefaultHairPalette(racePrimary, subrace) {
  const rp = (racePrimary || '').toLowerCase();
  const sr = (subrace || '').toLowerCase();

  // Human
  if (rp === 'human') return hairColors.blonde1;

  // Dwarf
  if (rp === 'dwarf') return hairColors.red2;

  // Halforc
  if (rp === 'halforc') return hairColors.brown1;

  // Elf subraces
  if (rp === 'elf') {
    if (sr === 'deepelf' || sr === 'deep-elf' || sr === 'deep_elf') return hairColors.gray1;   // Deep Elf
    if (sr === 'highelf' || sr === 'high-elf' || sr === 'high_elf') return hairColors.blonde2; // High Elf
    if (sr === 'woodelf' || sr === 'wood-elf' || sr === 'wood_elf') return hairColors.brown4;  // Wood Elf
  }

  // Fallback for anything not specified
  return hairColors.brown3;
}

// Skin filters (HSL-based): entries may include { h, s, l, b, c } deltas where
//  - h: hue delta in **degrees** (−180..+180)
//  - s: saturation delta in **percent** (−100..+100)
//  - l: lightness  delta in **percent** (−100..+100)
//  - b: brightness in **Photoshop slider units** (−150..+150), mapped as additive offset b/255 in L*
//  - c: contrast   in **Photoshop slider units** (−100..+100), mapped as scale 1 + c/100 in L*
// Place `null` at the index you want to represent “normal / no change”.
export const SKIN_FILTERS_HUMAN = [
  { s: -30, l: +25 },
  { s: -30, l: +25, h: +40 },
  { s: -15, l: +15 },
  { s: -15, l: +15, h: +40 },
  null,                   // <-- default “normal”
  { s: +10, l: -15, c: +5 },
  { s: +10, l: -15, c: +5, h: +40 },
  { s: +25, l: -20, c: +10 },
  { s: +25, l: -20, c: +10, h: +40 },
  { s: +60, l: -30, c: +30 },
  { s: +60, l: -30, c: +30, h: +40 },
  { s: +75, l: -50, c: +40 },
  { s: +100, l: -75, c: +50 },
];

export const SKIN_FILTERS_DWARF = [
  { l: +25 },
  { l: +15 },
  { s: -30, l: +15 },
  null,
  { l: -15, c: +20 },
  { s: -30, l: -15, c: +20 },
  { l: -5, c: +20 },
  { s: -30, l: -20, c: +30 },
  { s: -5, l: -20, c: +40 },
  { s: -30, l: -30, c: +40 },
];

export const SKIN_FILTERS_HALFORC = [
  { b: +40, s: -40 },
  { b: +100 },
  { b: +15, s: -60 },
  { b: +40 },
  null,
  { b: -40 },
  { b: -25, s: -60 },
];

export const SKIN_FILTERS_ELF_HIGH = [
  { s: -20, l: +10 },
  { s: -10, l: +5 },
  null,
  { s: +10, l: -10, c: +5 },
  { s: +25, l: -20, c: +10 },
];

export const SKIN_FILTERS_ELF_WOOD = [
  { s: -15, l: +15 },
  { s: -15, l: +15, h: +30 },
  null,
  { h: +30 },
  { s: +10, l: -15, c: +5 },
  { s: +10, l: -15, c: +5, h: +30 },
  { s: +25, l: -35, c: +10 },
  { s: +25, l: -35, c: +10, h: +30 },
  { s: +75, l: -50, c: +40 },
];

export const SKIN_FILTERS_ELF_DEEP = [
  { s: -30, l: +25 },
  { s: -15, l: +15 },
  null,
  { s: +10, l: -15, c: +5 },
  { s: +25, l: -20, c: +10 },
  { s: +60, l: -30, c: +30 },
];

/**
 * Compute the default skin index (the entry where the filter is `null`)
 * for any provided skin filter list.
 */
export const getDefaultSkinIndex = (filters) => {
  const idx = filters.findIndex((v) => v === null);
  return idx >= 0 ? idx : 0;
};

export const DEFAULT_SKIN_INDEX_HUMAN = getDefaultSkinIndex(SKIN_FILTERS_HUMAN);
export const DEFAULT_SKIN_INDEX_DWARF = getDefaultSkinIndex(SKIN_FILTERS_DWARF);
export const DEFAULT_SKIN_INDEX_HALFORC = getDefaultSkinIndex(SKIN_FILTERS_HALFORC);
export const DEFAULT_SKIN_INDEX_ELF_HIGH = getDefaultSkinIndex(SKIN_FILTERS_ELF_HIGH);
export const DEFAULT_SKIN_INDEX_ELF_WOOD = getDefaultSkinIndex(SKIN_FILTERS_ELF_WOOD);
export const DEFAULT_SKIN_INDEX_ELF_DEEP = getDefaultSkinIndex(SKIN_FILTERS_ELF_DEEP);

/**
 * Return the filters array for the node (race/subrace), or null if not supported.
 */
export function getSkinFiltersForNode(node) {
  const rp = ((node?._meta?.racePrimary) || '').toLowerCase();
  const sr = ((node?._meta?.subrace) || '').toLowerCase();

  if (rp === 'human') return SKIN_FILTERS_HUMAN;
  if (rp === 'dwarf') return SKIN_FILTERS_DWARF;
  if (rp === 'halforc') return SKIN_FILTERS_HALFORC;

  if (rp === 'elf') {
    if (sr === 'highelf' || sr === 'high-elf' || sr === 'high_elf') return SKIN_FILTERS_ELF_HIGH;
    if (sr === 'woodelf' || sr === 'wood-elf' || sr === 'wood_elf') return SKIN_FILTERS_ELF_WOOD;
    if (sr === 'deepelf' || sr === 'deep-elf' || sr === 'deep_elf') return SKIN_FILTERS_ELF_DEEP;
  }
  return null; // others: no skin filter for now
}

/**
 * Determine the default skin index for the current node's race.
 * Falls back to HUMAN filters when the race is unknown.
 */
export function getDefaultSkinIndexForNode(node) {
  const filters = getSkinFiltersForNode(node) || SKIN_FILTERS_HUMAN;
  return getDefaultSkinIndex(filters);
}

export { canonRace };
