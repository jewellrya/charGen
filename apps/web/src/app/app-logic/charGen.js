// import { charMaps } from '../../data/charMaps.js';

let canvas = null;
let ctx = null;


// 1x1 transparent pixel for “blank” slot entries
const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAp8B6j3pBV8AAAAASUVORK5CYII=';

// Slot draw order provided by user (from TOP-most to BOTTOM). We'll convert this
// to a bottom-first rank so we can draw base first, then tattoo → … → shoulder last.
const SLOT_DRAW_ORDER_TOP_FIRST = [
  'shoulder',
  'beard',
  'helmet',
  'adornment',
  'hair',
  'hands',
  'chest',
  'feet',
  'legs',
  'underwear',
  'tattoo',
  'base' // note: base is handled separately; included here for completeness
];

// Right‑panel feature & color UI order (top → bottom). Items not listed here
// will appear afterward in their existing discovery order. Special tokens:
//   - 'hairColor'   → Hair color swatch block
//   - 'tattooColor' → Tattoo color swatch block
const FEATURE_PANEL_ORDER_TOP_FIRST = [
  'skin',
  'hair',
  'beard',
  'hairColor',
  'tattoo',
  'tattooColor',
  'adornment',
];

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

function slotRank(slotName) {
  const r = __SLOT_RANK.get(slotName);
  return (typeof r === 'number') ? r : 1000; // unknowns sorted alphabetically beyond known ones
}

function ensureCanvas() {
  if (typeof document === 'undefined') return false;
  if (canvas && ctx) return true;

  const el = document.getElementById('canvas');
  if (!el) return false;

  canvas = el;
  ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  ctx.imageSmoothingEnabled = false;
  return true;
}

function getDefaultHairPalette(racePrimary, subrace) {
  const rp = (racePrimary || '').toLowerCase();
  const sr = (subrace || '').toLowerCase();

  // Human: yellow1
  if (rp === 'human') return hairColors.yellow1;

  // Dwarf: red2
  if (rp === 'dwarf') return hairColors.red2;

  // Halforc: brown1
  if (rp === 'halforc') return hairColors.brown1;

  // Elf subraces
  if (rp === 'elf') {
    if (sr === 'deepelf' || sr === 'deep-elf' || sr === 'deep_elf') return hairColors.gray1;   // Deep Elf
    if (sr === 'highelf' || sr === 'high-elf' || sr === 'high_elf') return hairColors.yellow2; // High Elf
    if (sr === 'woodelf' || sr === 'wood-elf' || sr === 'wood_elf') return hairColors.brown4;  // Wood Elf
  }

  // Fallback for anything not specified
  return hairColors.yellow1;
}

/**
 * Canonicalize race keys. We want "halforc" as the only half-orc key.
 * Converts case-insensitively and strips '-' and '_' when checking.
 */
function canonRace(s) {
  const t = (s || '').toLowerCase();
  const tnorm = t.replace(/[-_]/g, '');
  if (tnorm === 'halforc') return 'halforc';
  return t;
}

const CLASS_OPTIONS = [
  'Fighter', 'Ranger', 'Rogue', 'Sorceror', 'Cleric', 'Warlock', 'Paladin', 'Druid', 'Shaman'
];
let classIndex = -1; // start unset; initial render shows nothing until randomChar picks one

function getCurrentClass() {
  if (classIndex < 0 || !Array.isArray(CLASS_OPTIONS) || CLASS_OPTIONS.length === 0) return '';
  return CLASS_OPTIONS[classIndex];
}
function setClassLabel() {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('selectedClass');
  if (el) el.textContent = getCurrentClass();
}
// --- Class → ArmorType mapping (auto-equips if sprites exist) ---
const CLASS_TO_ARMOR = {
  sorceror: 'cloth', cleric: 'cloth', warlock: 'cloth',
  ranger: 'leather', druid: 'leather', shaman: 'leather',
  fighter: 'mail', paladin: 'mail'
};

function getSelectedArmorType() {
  const cls = (getCurrentClass() || '').toLowerCase();
  return CLASS_TO_ARMOR[cls] || null;
}

function applyArmorForClassToNode(node) {
  if (!node) return;
  const armor = getSelectedArmorType();
  const slots = ['chest', 'legs', 'feet'];

  for (const slot of slots) {
    const ti = node?.presets?.order?.[slot];
    if (typeof ti !== 'number') continue; // slot not present for this race/gender
    const arr = node.template?.[ti] || [];

    // If no armor for this class, or there are no entries in this slot, hard clear
    if (!armor || arr.length <= 1) {
      node.presets.features[slot] = 0; // none
      continue;
    }

    // Find first entry whose `_detail` equals the armor type (e.g., 'cloth')
    let match = -1;
    for (let i = 1; i < arr.length; i++) {
      const det = (arr[i]?._detail || '').toLowerCase();
      if (det === armor) { match = i; break; }
    }

    // Apply match or clear when not found
    node.presets.features[slot] = (match > 0) ? match : 0;
  }
}

// --- Class → Weapon mapping (selects weapon/tool slot by id; clears if missing) ---
const CLASS_TO_WEAPON = {
  sorceror: 2, cleric: 2, warlock: 2, shaman: 2, druid: 2,
  fighter: 1, paladin: 1,
  ranger: 3,
  rogue: 4,
};

function getSelectedWeaponId() {
  const cls = (getCurrentClass() || '').toLowerCase();
  const id = CLASS_TO_WEAPON[cls];
  return (typeof id === 'number' && id > 0) ? id : null;
}

function applyWeaponForClassToNode(node) {
  if (!node) return;
  const wantId = getSelectedWeaponId();

  const hasWeapon = (typeof node?.presets?.order?.weapon === 'number');
  const hasTool   = (typeof node?.presets?.order?.tool === 'number');

  // Prefer 'weapon' if both exist; clear the other to avoid double draw
  let targetSlot = null;
  if (hasWeapon) targetSlot = 'weapon';
  else if (hasTool) targetSlot = 'tool';
  if (!targetSlot) return;

  if (hasWeapon && hasTool) {
    const other = (targetSlot === 'weapon') ? 'tool' : 'weapon';
    node.presets.features[other] = 0;
  }

  const ti  = node.presets.order[targetSlot];
  const arr = node.template?.[ti] || [];

  if (!wantId || arr.length <= 1) {
    node.presets.features[targetSlot] = 0; // no mapping or no options → none
    return;
  }

  // arrays were sorted by _id and got a blank at [0], so index == id (when present)
  const maxId = arr.length - 1;
  node.presets.features[targetSlot] = (wantId <= maxId) ? wantId : 0;
}

// --- Class → Armor Filters (H/S/L/B/C). Use numbers or null to skip a channel.
const CLASS_ARMOR_FILTERS = {
  sorceror: { h: null, s: null, l: null, b: null, c: null },
  cleric:   { h: null, s: -40, l: null, b: +40, c: +30 },
  warlock:  { h: -125, s: null, l: null, b: null, c: null },
  shaman:   { h: null, s: null, l: null, b: null, c: null },
  druid:    { h: null, s: null, l: null, b: null, c: null },
  fighter:  { h: null, s: null, l: null, b: null, c: null },
  paladin:  { h: null, s: null, l: null, b: null, c: null },
  ranger:   { h: null, s: null, l: null, b: null, c: null },
  rogue:    { h: null, s: null, l: null, b: null, c: null },
};

function getSelectedArmorFilterSpec() {
  const cls = (getCurrentClass() || '').toLowerCase();
  return CLASS_ARMOR_FILTERS[cls] || null;
}

// ---- Armor filter mask helpers ----
function _armorFilterHasAnyChannel(spec) {
  if (!spec) return false;
  return ['h','s','l','b','c'].some((k) => typeof spec[k] === 'number');
}

// Apply class armor filter per pixel using the SAME OKLab pipeline as skin filters
function _applyArmorFilterPixelOKLab(r, g, b, spec) {
  // read deltas (numbers or 0)
  const rawH = (typeof spec.h === 'number') ? spec.h : 0; // degrees
  const rawS = (typeof spec.s === 'number') ? spec.s : 0; // percent
  const rawL = (typeof spec.l === 'number') ? spec.l : 0; // percent
  const rawB = (typeof spec.b === 'number') ? spec.b : 0; // PS brightness (−150..+150)
  const rawC = (typeof spec.c === 'number') ? spec.c : 0; // PS contrast   (−100..+100)

  const pureHue = (rawH !== 0) && (rawS === 0) && (rawL === 0) && (rawB === 0) && (rawC === 0);
  const pureMul = (rawH === 0) && (rawS === 0) && (rawC === 0) && (rawL !== 0 || rawB !== 0);
  const hRad = (rawH * Math.PI) / 180;

  // helper: OKLab -> sRGB8 with gamut test (same as skin pipeline)
  const toSRGBUnclamped = (Lx, Ax, Bx) => {
    const l_ = Lx + 0.3963377774 * Ax + 0.2158037573 * Bx;
    const m_ = Lx - 0.1055613458 * Ax - 0.0638541728 * Bx;
    const s_ = Lx - 0.0894841775 * Ax - 1.2914855480 * Bx;
    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;
    let rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    const inGamut = (rLin >= 0 && rLin <= 1) && (gLin >= 0 && gLin <= 1) && (bLin >= 0 && bLin <= 1);
    const to8 = (vLin) => {
      let v = vLin <= 0.0031308 ? vLin * 12.92 : 1.055 * Math.pow(vLin, 1/2.4) - 0.055;
      if (v < 0) v = 0; else if (v > 1) v = 1;
      return Math.round(v * 255);
    };
    return { inGamut, nr: to8(rLin), ng: to8(gLin), nb: to8(bLin) };
  };

  // 1) brightness/lightness only → pure RGB multiply (hue preserved exactly)
  if (pureMul) {
    const mul = (1
      + (rawL / 100) * 0.60
      + (rawB / 150) * 0.30
    );
    const m = Math.max(0.5, Math.min(1.5, mul));
    const R = Math.max(0, Math.min(255, Math.round(r * m)));
    const G = Math.max(0, Math.min(255, Math.round(g * m)));
    const B = Math.max(0, Math.min(255, Math.round(b * m)));
    return [R, G, B];
  }

  // 2) pure hue rotation in OKLab; keep chroma, reduce only if out-of-gamut
  if (pureHue) {
    let [L, A, B_] = srgbToOklab(r, g, b);
    const C0 = Math.hypot(A, B_);
    if (C0 === 0) return [r, g, b];
    let angle = Math.atan2(B_, A) + hRad;
    let scale = 1.0, tries = 0, out;
    do {
      const A1 = (C0 * scale) * Math.cos(angle);
      const B1 = (C0 * scale) * Math.sin(angle);
      out = toSRGBUnclamped(L, A1, B1);
      if (out.inGamut) break;
      scale *= 0.96; // shave chroma until in gamut
      tries++;
    } while (tries < 16);
    return [out.nr, out.ng, out.nb];
  }

  // 3) general case (only apply channels you provided)
  let [L, A, B_] = srgbToOklab(r, g, b);
  const C0 = Math.hypot(A, B_);
  let angle = Math.atan2(B_, A) + hRad; // rotate only if H requested (0 adds nothing)

  const sScale = (rawS === 0) ? 1 : (1 + rawS / 100);
  const lDelta = (rawL / 100) * 0.50;
  const bDelta = (rawB / 150) * 0.35;
  const cScale = (rawC === 0) ? 1 : (1 + (rawC / 100) * 0.85);

  // Lightness path
  let L1 = L + lDelta + bDelta;
  if (cScale !== 1) {
    const mid = 0.5; // same mid as skin
    L1 = (L1 - mid) * cScale + mid;
  }
  if (L1 < 0) L1 = 0; else if (L1 > 1) L1 = 1;

  // Chroma path
  let C1 = C0 * sScale; // only scale if S requested
  if (rawS > 0) {
    const CHROMA_ABS_CAP = 0.40;
    const CHROMA_REL_CAP = C0 * 1.30;
    if (C1 > CHROMA_ABS_CAP) C1 = CHROMA_ABS_CAP;
    if (C1 > CHROMA_REL_CAP) C1 = CHROMA_REL_CAP;
  }

  let scale = (C0 === 0) ? 0 : (C1 / C0);
  let tries = 0, out;
  do {
    const A1 = (C0 * scale) * Math.cos(angle);
    const B1 = (C0 * scale) * Math.sin(angle);
    out = toSRGBUnclamped(L1, A1, B1);
    if (out.inGamut) break;
    scale *= 0.96; // keep hue/lightness, just pull chroma in
    tries++;
  } while (tries < 16);

  return [out.nr, out.ng, out.nb];
}

// Build an armor mask from the already-loaded layer images, and apply the
// class-selected armor filter only where mask alpha > 0.
function applyArmorFilterMaskOnCanvas(canvas, metas, imgs) {
  const spec = getSelectedArmorFilterSpec();
  if (!spec || !_armorFilterHasAnyChannel(spec)) return;
  if (!canvas || !canvas.getContext) return;
  const ctx0 = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx0) return;

  // 1) Build mask of current armor (chest/legs/feet) by re-drawing those layers
  const mask = document.createElement('canvas');
  mask.width = canvas.width; mask.height = canvas.height;
  const mctx = mask.getContext('2d', { willReadFrequently: true });
  if (!mctx) return;
  mctx.imageSmoothingEnabled = false;

  for (let i = 0; i < metas.length; i++) {
    const meta = (metas[i] || {});
    const nm = String(meta.name || '').toLowerCase();
    const isArmor = nm.startsWith('chest') || nm.startsWith('legs') || nm.startsWith('feet');
    const isBlank = nm.startsWith('._') || nm.startsWith('_'); // our blank placeholder naming
    if (!isArmor || isBlank) continue;
    const img = imgs[i];
    if (!img) continue;
    try { mctx.drawImage(img, 0, 0, mask.width, mask.height); } catch(_) {}
  }

  // 2) Read pixels and apply filter where mask alpha > 0
  const id = ctx0.getImageData(0, 0, canvas.width, canvas.height);
  const md = mctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = id.data, m = md.data;
  for (let p = 0; p < d.length; p += 4) {
    if (m[p + 3] === 0) continue; // only affect armor pixels
    if (d[p + 3] !== 255) continue; // and only fully opaque ones
    const r = d[p], g = d[p + 1], b = d[p + 2];
    const [rr, gg, bb] = _applyArmorFilterPixelOKLab(r, g, b, spec);
    d[p] = rr; d[p + 1] = gg; d[p + 2] = bb; // keep original alpha
  }
  ctx0.putImageData(id, 0, 0);
}

function applyClassArmorAndRedraw() {
  const node = getCurrentNode();
  if (!node) return;
  applyArmorForClassToNode(node);
  applyWeaponForClassToNode(node);
  genCharPresets(node.template);
  notifyFeatures();
}

function selectClass(dir) {
  if (!Array.isArray(CLASS_OPTIONS) || CLASS_OPTIONS.length === 0) return;
  if (classIndex < 0) {
    classIndex = (dir === 'decrease') ? (CLASS_OPTIONS.length - 1) : 0;
  } else if (dir === 'increase') {
    classIndex = (classIndex + 1) % CLASS_OPTIONS.length;
  } else if (dir === 'decrease') {
    classIndex = (classIndex - 1 + CLASS_OPTIONS.length) % CLASS_OPTIONS.length;
  }
  setClassLabel();
  applyClassArmorAndRedraw();
}
function setClassByName(name) {
  const i = CLASS_OPTIONS.indexOf(name);
  if (i >= 0) { classIndex = i; setClassLabel(); applyClassArmorAndRedraw(); }
}

function hairColorShouldBeDisabled(node) {
  const hairSel  = ((node?.presets?.features?.hair)  ?? 0) | 0;
  const hasBeard = typeof node?.presets?.order?.beard === 'number';
  const beardSel = hasBeard ? (((node?.presets?.features?.beard) ?? 0) | 0) : null;

  if (hasBeard) {
    return hairSel === 0 && beardSel === 0; // disable only if BOTH are none
  }
  return hairSel === 0; // no beard slot → fall back to hair only
}

function tattooColorShouldBeDisabled(node) {
  const tattooSel = ((node?.presets?.features?.tattoo) ?? 0) | 0;
  return tattooSel === 0; // disable when no tattoo selected
}

// --- Defaults & randomization helpers (module scope) ---
function snapshotDefaults(node) {
  if (!node || node._defaults) return;
  node._defaults = { presets: JSON.parse(JSON.stringify(node.presets)) };
}

function resetNodeToDefaults(node) {
  if (!node || !node._defaults) return;
  try {
    node.presets = JSON.parse(JSON.stringify(node._defaults.presets));
  } catch {}
}

function randomizeNodeSelections(node) {
  if (!node) return;
  // 1) Skin index (if supported)
  const filters = getSkinFiltersForNode(node);
  if (filters && filters.length) {
    node.presets.features.skin = Math.floor(Math.random() * filters.length);
  }
  // 2) Feature slots (exclude 'skin')
  const order = node.presets.order || {};
  for (const slot of Object.keys(order)) {
    if (slot === 'skin') continue;
    const ti = order[slot];
    const arr = node.template[ti] || [];
    node.presets.features[slot] = (arr.length <= 1) ? 0 : Math.floor(Math.random() * arr.length);
  }

  // 3) Hair & tattoo color palettes (hair color disabled iff BOTH hair & beard are none when beard exists)
  const disabled = hairColorShouldBeDisabled(node);
  if (disabled) {
    if (!node._lastHairPalette && node.presets?.colors?.hair) {
      node._lastHairPalette = node.presets.colors.hair;
    }
    node.presets.colors.hair = null;
  } else {
    const hairKeys = Object.keys(hairColors);
    if (hairKeys.length) {
      const hk = hairKeys[Math.floor(Math.random() * hairKeys.length)];
      node.presets.colors.hair = node._lastHairPalette || hairColors[hk];
    }
  }

  // 4) Tattoo color respects tattoo presence
  const tattooDisabled = tattooColorShouldBeDisabled(node);
  if (tattooDisabled) {
    if (!node._lastTattooColor && node.presets?.colors?.tattoo) {
      node._lastTattooColor = node.presets.colors.tattoo;
    }
    node.presets.colors.tattoo = null;
  } else {
    const tattooKeys = Object.keys(tattooColors);
    if (tattooKeys.length) {
      const tk = tattooKeys[Math.floor(Math.random() * tattooKeys.length)];
      node.presets.colors.tattoo = node._lastTattooColor || tattooColors[tk];
      node._lastTattooColor = node.presets.colors.tattoo;
    }
  }
}

async function initFromSprites() {
  if (typeof fetch === 'undefined') return;
  try {
    const res = await fetch('/api/sprites', { cache: 'no-cache' });
    const json = await res.json();
    const manifest = json.manifest || {};

    // Build raceGenderTemplateObject with only a single base layer per gender
    const out = {};

    Object.keys(manifest).forEach((racePrimaryRaw) => {
      const racePrimary = racePrimaryRaw;
      const rpKey = canonRace(racePrimaryRaw);
      const node = manifest[racePrimaryRaw];

      if (node.races) {
        // has subraces
        out[rpKey] = { lore: node.lore || '', races: {} };
        Object.keys(node.races).forEach((race) => {
          const rn = node.races[race];
          out[rpKey].races[race] = { lore: rn.lore || '', genders: {} };
          ['male', 'female'].forEach((g) => {
            const base = rn.genders?.[g]?.base;
            if (!base) return;
            // template: just [ [base] ] (index 0 is "skin/base")
            const tpl = [
              [{ name: `${race.toLowerCase()}${g[0].toUpperCase() + g.slice(1)}1`, src: base.path, x: 0, y: 0 }],
            ];
            out[rpKey].races[race].genders[g] = {
              template: tpl,
              presets: {
                colors: { hair: getDefaultHairPalette(racePrimary, race), tattoo: tattooColors.green1 },
                features: {},
                order: {},
              },
              _meta: { racePrimary: rpKey, subrace: race, gender: g }
            };

            // Apply skin filters to supported races (Human, Dwarf, Halforc, Elf subraces)
            const rpLc = (racePrimary || '').toLowerCase();
            const srLc = (race || '').toLowerCase();
            let skinDefault = null;

            if (rpLc === 'human') skinDefault = DEFAULT_SKIN_INDEX_HUMAN;
            else if (rpLc === 'dwarf') skinDefault = DEFAULT_SKIN_INDEX_DWARF;
            else if (rpLc === 'halforc') skinDefault = DEFAULT_SKIN_INDEX_HALFORC;
            else if (rpLc === 'elf') {
              if (srLc === 'highelf' || srLc === 'high-elf' || srLc === 'high_elf') skinDefault = DEFAULT_SKIN_INDEX_ELF_HIGH;
              else if (srLc === 'woodelf' || srLc === 'wood-elf' || srLc === 'wood_elf') skinDefault = DEFAULT_SKIN_INDEX_ELF_WOOD;
              else if (srLc === 'deepelf' || srLc === 'deep-elf' || srLc === 'deep_elf') skinDefault = DEFAULT_SKIN_INDEX_ELF_DEEP;
            }

            if (skinDefault !== null) {
              out[rpKey].races[race].genders[g].presets.features.skin = skinDefault;
              out[rpKey].races[race].genders[g].presets.order.skin = 0;
            }
          });
        });
      } else {
        // no subraces
        out[rpKey] = { lore: node.lore || '', genders: {} };
        ['male', 'female'].forEach((g) => {
          const base = node.genders?.[g]?.base;
          if (!base) return;
          const tpl = [
            [{ name: `${racePrimary.toLowerCase()}${g[0].toUpperCase() + g.slice(1)}1`, src: base.path, x: 0, y: 0 }],
          ];
          out[rpKey].genders[g] = {
            template: tpl,
            presets: {
              colors: { hair: getDefaultHairPalette(racePrimary), tattoo: tattooColors.green1 },
              features: {},
              order: {},
            },
            _meta: { racePrimary: rpKey, subrace: undefined, gender: g }
          };

          // Apply skin filters to supported races (Human, Dwarf, Halforc)
          const rpLc2 = (racePrimary || '').toLowerCase();
          let skinDefault2 = null;

          if (rpLc2 === 'human') skinDefault2 = DEFAULT_SKIN_INDEX_HUMAN;
          else if (rpLc2 === 'dwarf') skinDefault2 = DEFAULT_SKIN_INDEX_DWARF;
          else if (rpLc2 === 'halforc') skinDefault2 = DEFAULT_SKIN_INDEX_HALFORC;

          if (skinDefault2 !== null) {
            out[rpKey].genders[g].presets.features.skin = skinDefault2;
            out[rpKey].genders[g].presets.order.skin = 0;
          }
        });
      }
    });

    // --- Discover additional feature slots from filenames ---
    // Collect all png paths we can find.
    const assetPaths = new Set();
    const raceBackgrounds = new Map();      // rpKey -> background png path
    const subraceBackgrounds = new Map();   // `${rpKey}:${subrace}` -> background png path
    if (Array.isArray(json.files)) json.files.forEach((p) => assetPaths.add(p));
    (function walk(x) {
      if (!x) return;
      if (typeof x === 'string' && /\.png$/i.test(x)) {
        assetPaths.add(x);
        return;
      }
      if (Array.isArray(x)) {
        x.forEach(walk);
        return;
      }
      if (typeof x === 'object') {
        Object.values(x).forEach(walk);
        if (x && typeof x.path === 'string' && /\.png$/i.test(x.path)) assetPaths.add(x.path);
      }
    })(manifest);

    // Attach slot arrays like "hair", "tool"… to a specific gender node.
    function ensureSlot(node, slot) {
      if (!node.__slotBuffers) node.__slotBuffers = {};
      if (!node.__slotBuffers[slot]) node.__slotBuffers[slot] = [];
    }
    function pushSlot(node, slot, obj) {
      ensureSlot(node, slot);
      node.__slotBuffers[slot].push(obj);
    }

    // Parse filenames: <race(+subrace)+gender>_<slot>[+extra...]+id<idx>.png OR <race(+subrace)+gender>_<slot>[+extra...].png (no id, e.g. underwear)
    // Examples:
    //   human+male_hair+id1.png
    //   elf+deepelf+female_tool+id2.png
    //   human+male_underwear.png
    //   human+male_legs+cloth+id1.png
    //   human+male_legs+cloth.png
    // Allow extra detail tokens between slot and id, e.g. human+male_legs+cloth+id1
    const RE_ID = /^(?<chain>[^/_]+)_(?<slot>[a-z0-9]+)(?<rest>(?:\+[a-z0-9]+)*)\+id(?<id>\d+)\.png$/i;
    // Also allow extra tokens on no-id files, e.g. human+male_underwear or human+male_legs+cloth.png
    const RE_SINGLE = /^(?<chain>[^/_]+)_(?<slot>[a-z0-9]+)(?<rest>(?:\+[a-z0-9]+)*)\.png$/i;
    for (const p of assetPaths) {
      const fname = decodeURIComponent(p.split('/').pop() || '');

      // Detect race/subrace background: e.g., human_background.png or elf+highelf_background.png
      const bgm = fname.match(/^(?<chain>[^/_]+)_background\.png$/i);
      if (bgm) {
        const chain = (bgm.groups.chain || '').toLowerCase();
        const parts = chain.split('+').filter(Boolean); // [racePrimary, (subrace)]
        const rp = canonRace(parts[0] || '');
        const sub = parts[1] || null;
        if (rp) {
          if (sub) {
            subraceBackgrounds.set(`${rp}:${sub}`, p);
          } else {
            raceBackgrounds.set(rp, p);
          }
        }
        continue; // skip slot parsing for background assets
      }

      let m = fname.match(RE_ID);
      let id = 0;
      let slot = '';
      let chain = '';
      let detailFirst = null; // first token after slot, e.g. "cloth" from legs+cloth+id1

      if (m) {
        slot = (m.groups.slot || '').toLowerCase();
        id = parseInt(m.groups.id, 10) || 0;
        chain = m.groups.chain || '';
        const rest = (m.groups.rest || ''); // like "+cloth+leather"
        if (rest) {
          const extras = rest.split('+').filter(Boolean); // ["cloth","leather"]
          detailFirst = extras[0] ? extras[0].toLowerCase() : null;
        }
      } else {
        m = fname.match(RE_SINGLE);
        if (!m) continue;
        slot = (m.groups.slot || '').toLowerCase();
        chain = m.groups.chain || '';
        id = 1; // If no explicit id, treat it as id=1 so it sorts after the blank
        const rest = (m.groups.rest || '');
        if (rest) {
          const extras = rest.split('+').filter(Boolean);
          detailFirst = extras[0] ? extras[0].toLowerCase() : null;
        }
      }

      const parts = chain.split('+'); // [race, (subrace), gender]
      const gender = (parts.pop() || '').toLowerCase();
      if (!gender) continue;

      // Find the target gender node inside "out"
      let target = null;
      if (parts.length === 1) {
        const rp = canonRace(parts[0]);
        target = out[rp]?.genders?.[gender] || null;
      } else if (parts.length >= 2) {
        const rp = canonRace(parts[0]);
        const sub = parts[1];
        target = out[rp]?.races?.[sub]?.genders?.[gender] || null;
      }
      if (!target) continue;

      pushSlot(target, slot, { name: `${slot}${id}`, src: p, x: 0, y: 0, _id: id, _detail: detailFirst });
    }

    // Finalize slot buffers into template arrays + presets (with a blank first option)
    function finalizeSlots(node) {
      if (!node.__slotBuffers) return;
      const slotNames = Object.keys(node.__slotBuffers).sort((a, b) => {
        const ra = slotRank(a);
        const rb = slotRank(b);
        if (ra !== rb) return ra - rb; // bottom-first rank
        return a.localeCompare(b);      // alphabetical fallback for unknowns
      });
      for (const slot of slotNames) {
        const arr = node.__slotBuffers[slot]
          .sort((a, b) => (a._id || 0) - (b._id || 0))
          .map(({ _id, ...rest }) => rest);

        // prepend blank
        arr.unshift({ name: `_${slot}_blank`, src: TRANSPARENT_PX, x: 0, y: 0 });

        node.template.push(arr);
        const idx = node.template.length - 1;
        node.presets.order[slot] = idx;

        let defaultIndex = 0;

        // Hair: select first real option if available
        if (slot === 'hair' && arr.length > 1) {
          defaultIndex = 1;
        }

        // Underwear: always select if present so it draws over base (unaffected by skin filter)
        if (slot === 'underwear' && arr.length > 1) {
          defaultIndex = 1;
        }

        // Dwarf male: Beard 1 by default (if present)
        const meta = node._meta || {};
        if (
          slot === 'beard' &&
          arr.length > 1 &&
          (meta.racePrimary || '').toLowerCase() === 'dwarf' &&
          (meta.gender || '').toLowerCase() === 'male'
        ) {
          defaultIndex = 1;
        }

        node.presets.features[slot] = defaultIndex;
      }

      // Seed last known hair palette for restore when hair is toggled off/on
      if (!node._lastHairPalette && node.presets?.colors?.hair) {
        node._lastHairPalette = node.presets.colors.hair;
      }

      // Capture pristine copy of presets for reset
      snapshotDefaults(node);
      delete node.__slotBuffers;
    }

    // Walk every gender node and finalize
    Object.values(out).forEach((rp) => {
      if (rp.races) {
        Object.values(rp.races).forEach((r) => {
          Object.values(r.genders).forEach(finalizeSlots);
        });
      } else if (rp.genders) {
        Object.values(rp.genders).forEach(finalizeSlots);
      }
    });

    // --- Apply user-defined defaults per race/subrace/gender ---
    (function applyCustomDefaults() {
      function setFeature(node, slot, idx) {
        if (!node || typeof idx !== 'number') return;
        const ti = node.presets?.order?.[slot];
        if (typeof ti !== 'number') return;
        const arr = node.template?.[ti] || [];
        const max = Math.max(0, (arr.length - 1)); // account for blank at 0
        if (max <= 0) return; // no real options
        const clamped = Math.max(0, Math.min(idx, max));
        node.presets.features[slot] = clamped;
      }
      function setHairColor(node, name) {
        if (!node || !name) return;
        const pal = hairColors?.[name];
        if (pal) {
          node.presets.colors.hair = pal;
          node._lastHairPalette = pal;
        }
      }
      function setTattooColor(node, name) {
        if (!node || !name) return;
        const col = tattooColors?.[name];
        if (col) node.presets.colors.tattoo = col;
      }

      // Elf subraces
      const elf = out.elf && out.elf.races ? out.elf.races : null;
      if (elf) {
        // wood elf male
        const woodMale = elf.woodelf?.genders?.male;
        if (woodMale) {
          setFeature(woodMale, 'tattoo', 1);
          setFeature(woodMale, 'adornment', 2);
          setFeature(woodMale, 'beard', 4);
          setTattooColor(woodMale, 'orange1');
        }

        // deep elf
        const deepMale = elf.deepelf?.genders?.male;
        if (deepMale) {
          setFeature(deepMale, 'tattoo', 6);
          setHairColor(deepMale, 'gray2');
          setFeature(deepMale, 'hair', 12);
          setFeature(deepMale, 'adornment', 3);
          setFeature(deepMale, 'beard', 6);
          setTattooColor(deepMale, 'red2');
        }
        const deepFemale = elf.deepelf?.genders?.female;
        if (deepFemale) {
          setHairColor(deepFemale, 'black1');
          setTattooColor(deepFemale, 'red2');
        }

        // high elf male: adornment 2, tattoo color blue1
        const highMale = elf.highelf?.genders?.male;
        if (highMale) {
          setFeature(highMale, 'adornment', 2);
          setTattooColor(highMale, 'blue1');
        }
      }

      // human male
      const humanMale = out.human?.genders?.male;
      if (humanMale) {
        setHairColor(humanMale, 'brown3');
        setTattooColor(humanMale, 'orange1');
      }

      // dwarf
      const dwarfMale = out.dwarf?.genders?.male;
      if (dwarfMale) {
        setHairColor(dwarfMale, 'red1');
        setFeature(dwarfMale, 'adornment', 3);
        setFeature(dwarfMale, 'beard', 6);
        setTattooColor(dwarfMale, 'orange1');
      }

      const dwarfFemale = out.dwarf?.genders?.female;
      if (dwarfFemale) {
        setFeature(dwarfFemale, 'hair', 2);
        setHairColor(dwarfFemale, 'red1');
        setFeature(dwarfFemale, 'adornment', 4);
        setTattooColor(dwarfFemale, 'orange1');
      }

      // halforc male
      const halforcMale = out.halforc?.genders?.male;
      if (halforcMale) {
        setHairColor(halforcMale, 'brown1');
        setFeature(halforcMale, 'adornment', 3);
        setFeature(halforcMale, 'hair', 9);
        setFeature(halforcMale, 'beard', 1);
        setTattooColor(halforcMale, 'white1');
      }
    })();

    // Attach backgrounds. Prefer subrace background (e.g., elf+highelf_background.png), else fallback to primary
    Object.entries(out).forEach(([rpKey, rpNode]) => {
      const primaryBg = raceBackgrounds.get(rpKey) || null;
      if (rpNode.races) {
        Object.entries(rpNode.races).forEach(([subKey, rNode]) => {
          const subBg = subraceBackgrounds.get(`${rpKey}:${subKey.toLowerCase()}`) || primaryBg;
          if (!subBg) return;
          Object.values(rNode.genders).forEach((gNode) => {
            gNode._backgroundSrc = subBg;
          });
        });
      } else if (rpNode.genders) {
        if (!primaryBg) return;
        Object.values(rpNode.genders).forEach((gNode) => {
          gNode._backgroundSrc = primaryBg;
        });
      }
    });

    Object.assign(raceGenderTemplateObject, out);
  } catch (e) {
    console.warn('[charGen] Failed to init from sprites', e);
  }
}

let preload = function (imageArray, callback) {
  let completed = 0;
  const total = imageArray.length;
  const loadedImages = new Array(total);

  if (total === 0) {
    callback([]);
    return;
  }

  for (let i = 0; i < total; i++) {
    const src = imageArray[i]?.src;
    const imgObj = new Image();

    imgObj.onload = function () {
      loadedImages[i] = imgObj;
      completed++;
      if (completed === total) callback(loadedImages);
    };

    imgObj.onerror = function () {
      console.warn('[charGen] Failed to load image:', src);
      const fimg = new Image();
      fimg.src = TRANSPARENT_PX;
      loadedImages[i] = fimg;
      completed++;
      if (completed === total) callback(loadedImages);
    };

    imgObj.src = src;
  }
};

let hairColorIndex;
let hairColors = {
  // three targets: [light, mid, dark]; if you authored palettes as 2 tones before, we duplicate the second
  black1: ['#4b4d59', '#25262c', '#1b1c20'],
  black2: ['#4a4839', '#25251b', '#1c1b14'],
  brown1: ['#51403a', '#362b27', '#241b18'],
  brown2: ['#5f4148', '#4e373d', '#3a292e'],
  brown3: ['#7a6966', '#574845', '#3f3533'],
  brown4: ['#a0815c', '#7e6648', '#5e4b36'],
  yellow1: ['#b9a088', '#a58f79', '#8e7764'],
  yellow2: ['#dbc6ad', '#c7b39d', '#a7927c'],
  yellow3: ['#f6dec2', '#dfc9b0', '#c2ae98'],
  red1: ['#9e6246', '#84523a', '#6c432f'],
  red2: ['#ab4438', '#8f392e', '#712d25'],
  gray1: ['#8a8a8a', '#787878', '#5f5f5f'],
  gray2: ['#c5c5c5', '#a6a6a6', '#8a8a8a'],
  white1: ['#e4e4e4', '#d2d2d2', '#bdbdbd'],
};

let tattooColorIndex;
let tattooColors = {
  red1: '#8a4646',
  red2: '#6d451e',
  orange1: '#9d7a65',
  yellow1: '#b8bc6b',
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

// Skin filters (HSL-based): entries may include { h, s, l, b, c } deltas where
//  - h: hue delta in **degrees** (−180..+180)
//  - s: saturation delta in **percent** (−100..+100)
//  - l: lightness  delta in **percent** (−100..+100)
//  - b: brightness in **Photoshop slider units** (−150..+150), mapped as additive offset b/255 in L*
//  - c: contrast   in **Photoshop slider units** (−100..+100), mapped as scale 1 + c/100 in L*
// Place `null` at the index you want to represent “normal / no change”.
const SKIN_FILTERS_HUMAN = [
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

const SKIN_FILTERS_DWARF = [
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

const SKIN_FILTERS_HALFORC = [
  { b: +40, s: -40 },
  { b: +100 },
  { b: +15, s: -60 },
  { b: +40 },
  null,
  { b: -40 },
  { b: -25, s: -60 },
];

const SKIN_FILTERS_ELF_HIGH = [
  { s: -20, l: +10 },
  { s: -10, l: +5 },
  null,
  { s: +10, l: -10, c: +5 },
  { s: +25, l: -20, c: +10 },
];

const SKIN_FILTERS_ELF_WOOD = [
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

const SKIN_FILTERS_ELF_DEEP = [
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
const getDefaultSkinIndex = (filters) => {
  const idx = filters.findIndex((v) => v === null);
  return idx >= 0 ? idx : 0;
};

const DEFAULT_SKIN_INDEX_HUMAN = getDefaultSkinIndex(SKIN_FILTERS_HUMAN);
const DEFAULT_SKIN_INDEX_DWARF = getDefaultSkinIndex(SKIN_FILTERS_DWARF);
const DEFAULT_SKIN_INDEX_HALFORC = getDefaultSkinIndex(SKIN_FILTERS_HALFORC);
const DEFAULT_SKIN_INDEX_ELF_HIGH = getDefaultSkinIndex(SKIN_FILTERS_ELF_HIGH);
const DEFAULT_SKIN_INDEX_ELF_WOOD = getDefaultSkinIndex(SKIN_FILTERS_ELF_WOOD);
const DEFAULT_SKIN_INDEX_ELF_DEEP = getDefaultSkinIndex(SKIN_FILTERS_ELF_DEEP);

/**
 * Return the filters array for the node (race/subrace), or null if not supported.
 */
function getSkinFiltersForNode(node) {
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
function getDefaultSkinIndexForNode(node) {
  const filters = getSkinFiltersForNode(node) || SKIN_FILTERS_HUMAN;
  return getDefaultSkinIndex(filters);
}

// After React renders the swatch containers, rebuild hair/tattoo swatches on the next tick
function refreshColorSwatchesDeferred() {
  if (typeof document === 'undefined') return;
  const run = () => {
    try {
      genColorSwatches(hairColors, 'hair');
      genColorSwatches(tattooColors, 'tattoo');
    } catch {}
  };
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => setTimeout(run, 0));
  } else {
    setTimeout(run, 0);
  }
}

function genColorSwatches(colorObject, subject) {
  let primaryColor, colorName, createdColorValue;

  let subjectCap = subject.charAt(0).toUpperCase() + subject.slice(1);
  if (typeof document === 'undefined') return;
  const swatchRoot = document.getElementById(subject + 'ColorSwatches');
  if (!swatchRoot) return;
  // Ensure container has wrap + gap
  swatchRoot.classList.add('flex', 'flex-wrap', 'gap-4');
  swatchRoot.innerHTML = '';

  const node = getCurrentNode();
  const swatchDisabled = (subject === 'hair')
    ? hairColorShouldBeDisabled(node)
    : (subject === 'tattoo')
      ? tattooColorShouldBeDisabled(node)
      : false;

  if (swatchDisabled) {
    swatchRoot.classList.add('opacity-25', 'pointer-events-none');
  } else {
    swatchRoot.classList.remove('opacity-25', 'pointer-events-none');
  }
  swatchRoot.setAttribute('aria-disabled', swatchDisabled ? 'true' : 'false');

  function setPrimaryColor() {
    if (Array.isArray(colorObject[colorName])) {
      primaryColor = colorObject[colorName][0];
    } else {
      primaryColor = colorObject[colorName];
    }
    // Current selection from presets (may be null when hair is none)
    const selNode = getCurrentNode();
    const sel = selNode?.presets?.colors?.[subject] ?? null;
    createdColorValue = Array.isArray(sel) ? sel[0] : sel;
  }

  for (let i = 0; i < Object.keys(colorObject).length; i++) {
    colorName = Object.keys(colorObject)[i];
    setPrimaryColor();

    let inputName = 'radio' + subjectCap + 'Color';

    let colorSwatchComponent =
      '<div class="w-7">' +
      '<input class="sr-only peer" id="' + inputName + i.toString() + '" type="radio" name="' + inputName + '" autocomplete="off">' +
      '<label onclick=select' + subjectCap + 'Color("' + colorName + '") ' +
      'class="block w-10 cursor-pointer rounded border border-2 border-base-300 p-1 hover:bg-base-300 transition' +
      'peer-checked:border-2 peer-checked:border-primary" ' +
      'for="' + inputName + i.toString() + '">' +
      '<span class="block h-6 w-full rounded" style="background-color: ' + primaryColor + '"></span>' +
      '</label>' +
      '</div>';
    swatchRoot.innerHTML += colorSwatchComponent;
  }

  // Disable/enable radios based on swatchDisabled (apply after swatches are built)
  {
    const inputs = swatchRoot.querySelectorAll('input[type="radio"]');
    inputs.forEach((inp) => {
      if (swatchDisabled) {
        inp.setAttribute('disabled', 'true');
        // Ensure no selection is visually/semantically active when disabled
        inp.checked = false;
        inp.removeAttribute('checked');
      } else {
        inp.removeAttribute('disabled');
      }
    });
  }

  for (let i = 0; i < Object.keys(colorObject).length; i++) {
    colorName = Object.keys(colorObject)[i];
    setPrimaryColor();

    const inputName = 'radio' + subjectCap + 'Color';
    if (!swatchDisabled && primaryColor === createdColorValue) {
      const selectedColorRadio = document.getElementById(inputName + i);
      if (selectedColorRadio && 'checked' in selectedColorRadio) {
        (selectedColorRadio).checked = true;
      }
    }
  }
}

function hexToRgb(hex) {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  }
  throw new Error('Bad Hex: ' + hex);
}

function rgbToHex(r, g, b) {
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function darkenHex(hex, percent) {
  const [r, g, b] = hexToRgb(hex);
  const factor = Math.max(0, 1 - percent / 100);
  const dr = Math.round(r * factor);
  const dg = Math.round(g * factor);
  const db = Math.round(b * factor);
  return rgbToHex(dr, dg, db);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max - min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function clamp01(x){ return Math.min(1, Math.max(0, x)); }

// Photoshop-style tonemap: MODERN (sRGB-aware) only. Legacy pipeline removed.


function srgbToLinear(v) {
  // v in 0..1
  if (v <= 0.04045) return v / 12.92;
  return Math.pow((v + 0.055) / 1.055, 2.4);
}
function linearToSrgb(v) {
  // v in 0..1
  if (v <= 0.0031308) return v * 12.92;
  return 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

// --- sRGB ↔ Lab helpers (D65) ---
function srgbToXyz01(v) {
  // v in 0..1 sRGB → linear → XYZ using D65 matrix
  const r = srgbToLinear(v[0]);
  const g = srgbToLinear(v[1]);
  const b = srgbToLinear(v[2]);
  // sRGB to XYZ (D65)
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
  return [x, y, z];
}

function xyzToLabD65(x, y, z) {
  // Reference white D65
  const Xn = 0.95047, Yn = 1.00000, Zn = 1.08883;
  let xr = x / Xn, yr = y / Yn, zr = z / Zn;
  const f = (t) => (t > 216/24389 ? Math.cbrt(t) : (841/108) * t + 4/29);
  const fx = f(xr), fy = f(yr), fz = f(zr);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);
  return [L, a, b];
}

function labToXyzD65(L, a, b) {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const finv = (t) => (t ** 3 > 216/24389 ? t ** 3 : (108/841) * (t - 4/29));
  const Xn = 0.95047, Yn = 1.00000, Zn = 1.08883;
  const xr = finv(fx), yr = finv(fy), zr = finv(fz);
  return [xr * Xn, yr * Yn, zr * Zn];
}

function xyz01ToSrgb(v) {
  const x = v[0], y = v[1], z = v[2];
  // XYZ (D65) to linear sRGB
  let r =  3.2404542 * x + -1.5371385 * y + -0.4985314 * z;
  let g = -0.9692660 * x +  1.8760108 * y +  0.0415560 * z;
  let b =  0.0556434 * x + -0.2040259 * y +  1.0572252 * z;
  // linear → sRGB
  r = clamp01(linearToSrgb(r));
  g = clamp01(linearToSrgb(g));
  b = clamp01(linearToSrgb(b));
  return [r, g, b];
}

function srgbToLab(r8, g8, b8) {
  const v = [r8/255, g8/255, b8/255];
  const xyz = srgbToXyz01(v);
  return xyzToLabD65(xyz[0], xyz[1], xyz[2]);
}


function labToSrgb(L, a, b) {
  const xyz = labToXyzD65(L, a, b);
  const sr = xyz01ToSrgb(xyz);
  return [Math.round(sr[0]*255), Math.round(sr[1]*255), Math.round(sr[2]*255)];
}

/* ---- sRGB ↔ OKLab helpers (Björn Ottosson) ---- */
function srgbToOklab(r8, g8, b8) {
  // sRGB 0..255 -> linear 0..1
  let r = srgbToLinear(r8 / 255);
  let g = srgbToLinear(g8 / 255);
  let b = srgbToLinear(b8 / 255);

  // linear sRGB -> LMS
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  // cube-root nonlinearity
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // LMS -> OKLab
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  return [L, A, B]; // L in 0..1
}


function replaceColor(data, colorFind, colorReplace, tolerance = 0, minAlpha = 0) {
  const [fr, fg, fb] = hexToRgb(colorFind);
  const [rr, rg, rb] = hexToRgb(colorReplace);
  const tol = Math.max(0, tolerance|0);
  const minA = Math.max(0, Math.min(255, minAlpha|0));

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a >= minA &&
        Math.abs(r - fr) <= tol &&
        Math.abs(g - fg) <= tol &&
        Math.abs(b - fb) <= tol) {
      data[i]     = rr;
      data[i + 1] = rg;
      data[i + 2] = rb;
      // leave alpha unchanged
    }
  }
}

// Palette-safe skin filter (race-scoped):
// Operates only on fully opaque pixels (alpha ≥ 250) and maps each unique RGB
// to a single adjusted RGB. Hue is preserved; we only tweak lightness and clamp
// saturation so high-chroma texels can't blow up. This avoids per-pixel drift
// and semi-transparent edge artifacts.
function applySkinFilterPaletteSafe(data, filter) {
  if (!filter) return;
  // Read raw values; default missing fields to 0
  const rawH = (typeof filter.h === 'number') ? filter.h : 0; // degrees
  const rawS = (typeof filter.s === 'number') ? filter.s : 0; // percent
  const rawL = (typeof filter.l === 'number') ? filter.l : 0; // percent
  const rawB = (typeof filter.b === 'number') ? filter.b : 0; // PS brightness (−150..+150)
  const rawC = (typeof filter.c === 'number') ? filter.c : 0; // PS contrast   (−100..+100)

  // If we're only nudging brightness/lightness, don't touch hue/saturation at all.
  const pureMul = (rawH === 0) && (rawS === 0) && (rawC === 0);

  // Map sliders to a pure RGB multiply (preserves hue ratios; no weird greens)
  // rawL in % (−100..+100), rawB in PS units (−150..+150)
  const mulFromL = (rawL / 100) * 0.6;      // moderate effect from L
  const mulFromB = (rawB / 150) * 0.3;      // smaller effect from PS brightness
  const mul = Math.max(0.5, Math.min(1.5, 1 + mulFromL + mulFromB));

  // Build a map from original RGB to adjusted RGB (skip only fully transparent texels)
  const map = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a !== 255) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = (r << 16) | (g << 8) | b;
    if (map.has(key)) continue;

    // Pure channel-wise multiply → preserves hue relationships
    let rr = Math.round(r * mul);
    let gg = Math.round(g * mul);
    let bb = Math.round(b * mul);
    rr = rr < 0 ? 0 : (rr > 255 ? 255 : rr);
    gg = gg < 0 ? 0 : (gg > 255 ? 255 : gg);
    bb = bb < 0 ? 0 : (bb > 255 ? 255 : bb);

    let out;

    if (pureMul) {
      // STRICT: do not touch hue/saturation at all for brightness-only or tiny tweaks
      out = [rr, gg, bb];
    } else {
      // Guard rails (only for bigger changes involving s/h/c)
      const [, s0] = rgbToHsl(r, g, b);
      let   [hh, ss, ll] = rgbToHsl(rr, gg, bb);

      // Never increase saturation vs original
      ss = Math.min(ss, s0);

      // Generic hard cap only; remove hue-specific green handling
      if (ss > 0.75) {
        ss = 0.75;
      }
      [rr, gg, bb] = hslToRgb(hh, ss, ll);
      out = [rr, gg, bb];
    }

    // Safety: if conversion produced invalids, fall back
    if (!Number.isFinite(out[0]) || !Number.isFinite(out[1]) || !Number.isFinite(out[2])) {
      out = [r, g, b];
    }
    map.set(key, out);
  }

  // Second pass: apply mapping to all but fully transparent texels
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] !== 255) continue;
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    const out = map.get(key);
    if (out) {
      data[i]     = out[0];
      data[i + 1] = out[1];
      data[i + 2] = out[2];
    }
  }
}

function applySkinFilter(data, variantIndex, filters = SKIN_FILTERS_HUMAN, opts = {}) {
  const f = filters[variantIndex];
  if (!f) return; // null entry = no-op

  // Resolve pipeline: filter.mode > opts.pipeline > 'modern'
  const pipeline = (f && typeof f.mode === 'string') ? f.mode
                   : (typeof opts.pipeline === 'string' ? opts.pipeline : 'modern');

  if (pipeline === 'safe') {
    applySkinFilterPaletteSafe(data, f);
    return;
  }
  // Default: modern perceptual path (OKLab-based for H/S/L and B/C)
  applySkinFilterModernOKLab(data, f);
}

// Modern unified filter: OKLab/OKLCH-like edits (perceptual). Works for any layer/race.
function applySkinFilterModernOKLab(data, filter) {
  // Read raw values; default missing fields to 0
  const rawH = (typeof filter.h === 'number') ? filter.h : 0; // degrees (−180..+180)
  const rawS = (typeof filter.s === 'number') ? filter.s : 0; // percent (−100..+100)
  const rawL = (typeof filter.l === 'number') ? filter.l : 0; // percent (−100..+100)
  const rawB = (typeof filter.b === 'number') ? filter.b : 0; // PS brightness (−150..+150)
  const rawC = (typeof filter.c === 'number') ? filter.c : 0; // PS contrast   (−100..+100)

  // Branching flags
  const pureHue = (rawH !== 0) && (rawS === 0) && (rawL === 0) && (rawB === 0) && (rawC === 0);
  const pureMul = (rawH === 0) && (rawS === 0) && (rawC === 0) && (rawL !== 0 || rawB !== 0);

  const hRad   = (rawH * Math.PI) / 180;         // hue rotation in radians

  // Helper: convert OKLab -> linear sRGB (unclamped), test gamut in linear, then gamma encode to 0..255
  const toSRGBUnclamped = (Lx, Ax, Bx) => {
    const l_ = Lx + 0.3963377774 * Ax + 0.2158037573 * Bx;
    const m_ = Lx - 0.1055613458 * Ax - 0.0638541728 * Bx;
    const s_ = Lx - 0.0894841775 * Ax - 1.2914855480 * Bx;
    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;
    let rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    const inGamut = (rLin >= 0 && rLin <= 1) && (gLin >= 0 && gLin <= 1) && (bLin >= 0 && bLin <= 1);
    const to8 = (vLin) => {
      let v = vLin <= 0.0031308 ? vLin * 12.92 : 1.055 * Math.pow(vLin, 1/2.4) - 0.055;
      if (v < 0) v = 0; else if (v > 1) v = 1;
      return Math.round(v * 255);
    };
    return { inGamut, nr: to8(rLin), ng: to8(gLin), nb: to8(bLin) };
  };

  // 1) PURE RGB MULTIPLY for brightness/lightness-only (no H/S/C requested)
  if (pureMul) {
    const mul = (1
      + (rawL / 100) * 0.60  // moderate effect from L
      + (rawB / 150) * 0.30  // smaller effect from PS brightness
    );
    const m = Math.max(0.5, Math.min(1.5, mul));
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] !== 255) continue;
      data[i]     = Math.max(0, Math.min(255, Math.round(data[i]     * m)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(data[i + 1] * m)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(data[i + 2] * m)));
    }
    return;
  }

  // 2) PURE HUE ROTATION (keep L and C; reduce C only if needed for gamut)
  if (pureHue) {
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a !== 255) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];

      let [L, A, B_] = srgbToOklab(r, g, b);
      const C0 = Math.hypot(A, B_);
      if (C0 === 0) continue; // achromatic

      let angle = Math.atan2(B_, A) + hRad;
      let scale = 1.0, tries = 0, out;
      do {
        const A1 = (C0 * scale) * Math.cos(angle);
        const B1 = (C0 * scale) * Math.sin(angle);
        out = toSRGBUnclamped(L, A1, B1);
        if (out.inGamut) break;
        scale *= 0.96; // reduce chroma until in gamut
        tries++;
      } while (tries < 16);

      data[i]     = out.nr;
      data[i + 1] = out.ng;
      data[i + 2] = out.nb;
    }
    return;
  }

  // 3) MIXED / GENERAL CASE (OKLab). Only apply the sliders you provided.
  const sScale = (rawS === 0) ? 1 : (1 + rawS / 100);  // only scale C if S was requested
  const lDelta = (rawL / 100) * 0.50;                  // L delta
  const bDelta = (rawB / 150) * 0.35;                  // brightness -> L offset
  const cScale = (rawC === 0) ? 1 : (1 + (rawC / 100) * 0.85); // contrast scale

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a !== 255) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];

    let [L, A, B_] = srgbToOklab(r, g, b);
    const C0 = Math.hypot(A, B_);
    let angle = Math.atan2(B_, A);

    if (hRad !== 0) angle += hRad; // only if H requested

    // Lightness pipeline: only L/B/Contrast affect L
    let L1 = L + lDelta + bDelta;
    if (cScale !== 1) {
      const mid = 0.5;
      L1 = (L1 - mid) * cScale + mid; // contrast around mid
    }
    if (L1 < 0) L1 = 0; else if (L1 > 1) L1 = 1;

    // Chroma pipeline: keep original C unless S requested
    let C1 = C0 * sScale;

    // No global chroma caps when S wasn't asked for; only enforce gamut.
    if (rawS > 0) {
      // Allow increases but keep them sane; avoid neon explosions
      const CHROMA_ABS_CAP = 0.40;     // absolute OKLab chroma ceiling
      const CHROMA_REL_CAP = C0 * 1.30; // no more than +30% over source
      C1 = Math.min(C1, CHROMA_ABS_CAP, CHROMA_REL_CAP);
    }

    // Try convert; if out of gamut, reduce chroma only (preserve your requested L/H/C changes)
    let scale = (C0 === 0) ? 0 : (C1 / C0);
    let tries = 0, out;
    do {
      const A1 = (C0 * scale) * Math.cos(angle);
      const B1 = (C0 * scale) * Math.sin(angle);
      out = toSRGBUnclamped(L1, A1, B1);
      if (out.inGamut) break;
      scale *= 0.96; // shave chroma until we fit sRGB
      tries++;
    } while (tries < 16);

    data[i]     = out.nr;
    data[i + 1] = out.ng;
    data[i + 2] = out.nb;
  }
}

// Based on #ad926e #867155 #6e5c46 base sprites.
function applyHairColor(imageData) {
  // Get selected hair palette for the current node
  let selected;
  if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
    selected = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].hair;
  } else {
    selected = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].hair;
  }

  // If hair is disabled or palette is null, keep sprite defaults
  if (!selected) return;

  // Ensure we have a [light, mid, dark] array
  const light = Array.isArray(selected) ? selected[0] : selected;
  const mid   = Array.isArray(selected) ? (selected[1] ?? selected[0]) : selected;
  const dark  = Array.isArray(selected) ? (selected[2] ?? selected[1] ?? selected[0]) : selected;

  const DEFAULT_LIGHT = '#ad926e';
  const DEFAULT_MID   = '#867155';
  const DEFAULT_DARK  = '#6e5c46';

  const TOL = 8;   // raise to 12–16 if your authored base tones drifted a bit
  const MIN_A = 1; // skip only fully transparent

  replaceColor(imageData, DEFAULT_LIGHT, light, TOL, MIN_A);
  replaceColor(imageData, DEFAULT_MID,   mid,   TOL, MIN_A);
  replaceColor(imageData, DEFAULT_DARK,  dark,  TOL, MIN_A);
}

// Based on #8a4646 base sprites.
function applyTattooColor(imageData) {
  let color;
  if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
    color =
      raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].tattoo;
  } else {
    color = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].tattoo;
  }

  if (!color) return; // disabled → keep sprite defaults
  replaceColor(imageData, '#8a4646', color);
}

function drawChar(imageArray, name, replace) {
  if (!ensureCanvas()) return;
  preload(imageArray, function (loadedImages) {
    for (let i = 0; i < imageArray.length; i++) {
      const meta = imageArray[i] || {};
      const img = loadedImages[i];

      // Draw into an offscreen canvas (so recolor affects only this layer)
      const off = document.createElement('canvas');
      off.width = canvas.width;
      off.height = canvas.height;
      const octx = off.getContext('2d', { willReadFrequently: true });
      if (!octx) continue;
      octx.imageSmoothingEnabled = false;

      octx.drawImage(img, 0, 0, off.width, off.height);

      // Recolor only the relevant layer
      const lname = (meta.name || '').toLowerCase();

      // Base layer: apply skin filter for supported races (identified by _isBase flag)
      if (meta && meta._isBase) {
        const node = getCurrentNode();
        const filters = getSkinFiltersForNode(node);
        if (filters) {
          const skinIdx = node?.presets?.features?.skin ?? getDefaultSkinIndexForNode(node);
          const id = octx.getImageData(0, 0, off.width, off.height);

          if (!window.__onceSkinStats) {
            const d = id.data; let minA = 255, maxA = 0; let uniq = 0;
            let semi = 0, opaque = 0, transparent = 0;
            const seen = new Set();
            for (let i2 = 0; i2 < d.length; i2 += 4) {
              const a = d[i2 + 3];
              if (a < minA) minA = a;
              if (a > maxA) maxA = a;
              if (a === 0) transparent++;
              else if (a === 255) opaque++;
              else semi++;
              const k = (d[i2] << 16) | (d[i2 + 1] << 8) | d[i2 + 2];
              if (!seen.has(k)) { seen.add(k); uniq++; }
            }
            console.log('[skin/base stats]', { minA, maxA, uniqueColors: uniq, semiAlpha: semi > 0, semiCount: semi, opaque, transparent });
            window.__onceSkinStats = true;
          }

          applySkinFilter(id.data, skinIdx, filters);
          octx.putImageData(id, 0, 0);
        }
      }

      if (lname.startsWith('hair') || lname.startsWith('beard')) {
        const id = octx.getImageData(0, 0, off.width, off.height);
        applyHairColor(id.data);
        octx.putImageData(id, 0, 0);
      } else if (lname.startsWith('tattoo')) {
        const id = octx.getImageData(0, 0, off.width, off.height);
        applyTattooColor(id.data);
        // Reduce tattoo layer opacity to 80%
        const d = id.data;
        for (let i2 = 0; i2 < d.length; i2 += 4) {
          if (d[i2 + 3] === 0) continue; // keep fully transparent pixels as-is
          d[i2 + 3] = Math.round(d[i2 + 3] * 0.7);
        }
        octx.putImageData(id, 0, 0);
      }
      else if (lname.startsWith('chest') || lname.startsWith('legs') || lname.startsWith('feet')) {
        const spec = getSelectedArmorFilterSpec();
        if (spec && _armorFilterHasAnyChannel(spec)) {
          const id = octx.getImageData(0, 0, off.width, off.height);
          const d = id.data;
          for (let i2 = 0; i2 < d.length; i2 += 4) {
            if (d[i2 + 3] !== 255) continue; // operate only on fully opaque texels of the sprite
            const r0 = d[i2], g0 = d[i2 + 1], b0 = d[i2 + 2];
            const [rr, gg, bb] = _applyArmorFilterPixelOKLab(r0, g0, b0, spec);
            d[i2] = rr; d[i2 + 1] = gg; d[i2 + 2] = bb; // keep alpha as‑is
          }
          octx.putImageData(id, 0, 0);
        }
      }

      // Composite processed layer onto main canvas
      ctx.drawImage(off, 0, 0);
    }



    let img = canvas.toDataURL('image/png');
    let charGenComponent =
      '<div id="component_' +
      name +
      '" class="w-full md:w-1/2"><div class="flex flex-col items-center gap-2"><img id="img_' +
      name +
      '" src="' +
      img +
      '" class="mx-auto"/><a class="link text-center truncate" href="' +
      img +
      '" download="' +
      name +
      '">Export "' +
      name +
      '"</a></div></div>';

    if (typeof document !== 'undefined') {
      const cg = document.getElementById('charGen');
      if (cg) {
        if (!replace) {
          cg.innerHTML += charGenComponent;
        } else {
          cg.innerHTML = charGenComponent;
        }
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

let drawAmount = 0;

// Generate all possible permutations of characters.
function permute() {
  console.log('Permute is disabled for base-only mode.');
}

let raceGenderTemplateObject = {};

// pad zeros so number is always x digits long.
function padZeroes(number, length) {
  let my_string = '' + number;
  while (my_string.length < length) {
    my_string = '0' + my_string;
  }

  return my_string;
}

let racePrimaryIndex,
  racePrimaryName,
  racePrimaryLore,
  raceIndex,
  raceName,
  raceLore,
  genderIndex,
  genderName,
  raceGenderColorPresets,
  raceGenderFeaturePresets,
  raceGenderTemplate;

// subscribers for dynamic feature list in React
const featureSubscribers = new Set();
function getCurrentNode() {
  if (!raceGenderTemplateObject || !racePrimaryName) return null;
  if (raceGenderTemplateObject[racePrimaryName]?.races) {
    return raceGenderTemplateObject[racePrimaryName].races?.[raceName]?.genders?.[genderName] || null;
  }
  return raceGenderTemplateObject[racePrimaryName]?.genders?.[genderName] || null;
}
function notifyFeatures() {
  try {
    const node = getCurrentNode();
    if (!node) return;
    const all = Object.keys(node.presets.features);
    const features = all.filter((f) => !['underwear', 'chest', 'legs', 'feet', 'weapon'].includes(f)); // hide underwear, armor, and weapon (class-controlled)
    const values = {};
    const counts = {};
    const labels = {};
    const ID_RE = /\+id(\d+)/i;

    for (const f of features) {
      const v = node.presets.features[f] ?? 0;
      values[f] = v;

      if (f === 'skin') {
        const filters = getSkinFiltersForNode(node) || SKIN_FILTERS_HUMAN;
        const max = filters.length;
        counts[f] = max;
        const cur = node.presets.features[f] ?? getDefaultSkinIndexForNode(node);
        labels[f] = String(cur + 1);
        continue;
      }

      const ti = node.presets.order[f];
      const arr = node.template[ti] || [];
      counts[f] = arr.length;

      let label = 'none';
      if (v > 0) {
        const item = arr[v];
        const byName = (item?.name || '').match(/(\d+)/);
        if (byName && byName[1]) {
          label = String(parseInt(byName[1], 10));
        } else {
          const src = item?.src ? decodeURIComponent(item.src) : '';
          const m = src.match(ID_RE);
          label = m ? String(parseInt(m[1], 10)) : String(v);
        }
      }
      labels[f] = label;
    }

    // Build UI order: start with explicit FEATURE_PANEL_ORDER_TOP_FIRST, then add remaining features
    const setListed = new Set();
    const ordered = [];

    for (const key of FEATURE_PANEL_ORDER_TOP_FIRST) {
      if (key === 'hairColor' || key === 'tattooColor') {
        ordered.push(key);
        setListed.add(key);
        continue;
      }
      if (features.includes(key)) {
        ordered.push(key);
        setListed.add(key);
      }
    }
    for (const f of features) {
      if (!setListed.has(f)) ordered.push(f);
    }

    featureSubscribers.forEach((fn) => fn({
      features,          // raw feature keys (back‑compat)
      uiOrder: ordered,  // preferred UI order including color tokens
      values,
      counts,
      labels,
    }));
  } catch {};
}

// Select Character Features Randomly
function randomChar() {
  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  if (!raceGenderTemplateObject || Object.keys(raceGenderTemplateObject).length === 0) {
    console.warn('[charGen] No sprites manifest yet');
    return;
  }

  racePrimaryIndex = getRandomInt(Object.keys(raceGenderTemplateObject).length);
  racePrimaryName = Object.keys(raceGenderTemplateObject)[racePrimaryIndex];
  if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
    raceIndex = getRandomInt(Object.keys(raceGenderTemplateObject[racePrimaryName]['races']).length);
    raceName = Object.keys(raceGenderTemplateObject[racePrimaryName]['races'])[raceIndex];
    genderIndex = getRandomInt(
      Object.keys(raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders']).length
    );
    genderName = Object.keys(raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'])[genderIndex];
    raceGenderColorPresets =
      raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'];
    raceGenderFeaturePresets =
      raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['features'];
    raceGenderTemplate =
      raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['template'];
  } else {
    genderIndex = getRandomInt(Object.keys(raceGenderTemplateObject[racePrimaryName]['genders']).length);
    genderName = Object.keys(raceGenderTemplateObject[racePrimaryName]['genders'])[genderIndex];
    raceGenderColorPresets = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'];
    raceGenderFeaturePresets = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['features'];
    raceGenderTemplate = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['template'];
  }

  genRaceNameAndLore();

  // Randomize class (UI-only; not part of randomizeFeatures)
  if (Array.isArray(CLASS_OPTIONS) && CLASS_OPTIONS.length > 0) {
    classIndex = Math.floor(Math.random() * CLASS_OPTIONS.length);
    setClassLabel();
  }

  // check gender radio (browser only)
  if (typeof document !== 'undefined') {
    const selectedGenderRadio = document.getElementById('genderRadio' + (genderIndex + 1));
    if (selectedGenderRadio) selectedGenderRadio.checked = true;
  }

  // Base-only: just push the single base layer at [0][0]
  // Display index for skin if present
  if (typeof document !== 'undefined') {
    const el = document.getElementById('skinValue');
    const node = getCurrentNode();
    const skinIdx = node?.presets?.features?.skin ?? getDefaultSkinIndexForNode(node);
    if (el) el.innerHTML = String(skinIdx + 1);
  }

  // Randomize all features & colors for this starting character (keep presets for template switching)
  const activeNode = getCurrentNode();
  if (activeNode) {
    randomizeNodeSelections(activeNode);
  }
  // Force a fresh random hair palette for full random-character as well
  if (activeNode && !hairColorShouldBeDisabled(activeNode)) {
    const keys = Object.keys(hairColors);
    if (keys.length) {
      const k = keys[Math.floor(Math.random() * keys.length)];
      activeNode.presets.colors.hair = hairColors[k];
      activeNode._lastHairPalette = activeNode.presets.colors.hair;
    }
  }

  // Apply class-driven armor (if matching sprites exist)
  applyArmorForClassToNode(activeNode);
  applyWeaponForClassToNode(activeNode);

  // Ensure indices reflect randomized color choices
  applyColorIndex();

  // Populate swatch UIs based on current presets (now randomized)
  genColorSwatches(hairColors, 'hair');
  genColorSwatches(tattooColors, 'tattoo');

  // Simple name: racePrimary + optional subrace + gender indexes
  const genName =
    (racePrimaryIndex ?? 0).toString() +
    (raceIndex ? raceIndex.toString() : '') +
    (genderIndex ?? 0).toString() +
    '0000' +
    padZeroes(hairColorIndex, 2) +
    padZeroes(tattooColorIndex, 2);

  // Render with current presets (includes default hair index if present)
  genCharPresets(raceGenderTemplate);
}

// Randomize only the current node's features/colors (keep selected race/gender)
function randomizeCurrentFeatures() {
  const node = getCurrentNode();
  if (!node) return;
  // Randomize this node's feature indices and color palettes
  randomizeNodeSelections(node);
  // Force a fresh random hair palette (independent of _lastHairPalette) when enabled
  if (!hairColorShouldBeDisabled(node)) {
    const keys = Object.keys(hairColors);
    if (keys.length) {
      const k = keys[Math.floor(Math.random() * keys.length)];
      node.presets.colors.hair = hairColors[k];
      node._lastHairPalette = node.presets.colors.hair;
    }
  }
  // Sync indices used by UI labels and name seed
  applyColorIndex();
  // Rebuild color swatch UIs to reflect new presets
  genColorSwatches(hairColors, 'hair');
  genColorSwatches(tattooColors, 'tattoo');
  // Redraw character with current template + randomized selections
  genCharPresets(node.template);
  notifyFeatures();
}

// Generate Selected Character with current presets (base + feature slots)
function genCharPresets(raceGenderTemplate) {
  let genChar = [];
  const node = getCurrentNode();
  const base = raceGenderTemplate?.[0]?.[0] ?? null;
  if (!base || !node) return;

  // Enforce class→armor choice at draw time as well (race/gender switches)
  applyArmorForClassToNode(node);
  applyWeaponForClassToNode(node);

  // Background (if present) must be bottom-most
  if (node._backgroundSrc) {
    genChar.push({ name: '_background', src: node._backgroundSrc, x: 0, y: 0, _slot: 'background' });
  }

  // Base/skin next (mark so recolor logic can find it regardless of index)
  const baseLayer = { ...base, _isBase: true };
  genChar.push(baseLayer);

  // Add each feature layer in the node's order
  const { features, order } = node.presets;
  const orderedSlots = Object.keys(features)
    .filter((s) => s !== 'skin')
    .sort((a, b) => {
      const ia = (typeof order[a] === 'number') ? order[a] : 9999;
      const ib = (typeof order[b] === 'number') ? order[b] : 9999;
      return ia - ib; // lower template index draws earlier (closer to base)
    });

  for (const slot of orderedSlots) {
    const selIndex = features[slot];
    const ti = order[slot];
    const arr = raceGenderTemplate[ti];
    // Only draw when a real option is selected (skip index 0 which is the transparent placeholder)
    if (typeof selIndex === 'number' && selIndex > 0) {
      const chosen = arr?.[selIndex] || null;
      if (chosen) genChar.push(chosen);
    }
  }

  const genName = `${racePrimaryIndex ?? 0}${raceIndex ?? ''}${genderIndex ?? 0}0000${padZeroes(
    hairColorIndex,
    2
  )}${padZeroes(tattooColorIndex, 2)}`;
  drawChar(genChar, genName, true);
  notifyFeatures();
  refreshColorSwatchesDeferred();
}

// Select character features (increase/decrease per discovered slot).
function selectFeaturePresets(feature, scale) {
  const node = getCurrentNode();
  if (!node) return;

  let max;
  if (feature === 'skin') {
  const filters = getSkinFiltersForNode(node) || SKIN_FILTERS_HUMAN;
  max = filters.length;
} else {
    const ti = node.presets.order[feature];
    if (typeof ti !== 'number') return; // unknown feature
    max = (node.template[ti] || []).length;
  }
  if (!max) return;

  const cur = node.presets.features[feature] ?? 0;
  if (scale === 'increase') {
    node.presets.features[feature] = (cur + 1) % max;
  } else if (scale === 'decrease') {
    node.presets.features[feature] = (cur - 1 + max) % max;
  }

  raceGenderFeaturePresets = node.presets.features;

  if (feature === 'hair' || feature === 'beard') {
    const disabled = hairColorShouldBeDisabled(node);
    if (disabled) {
      if (!node._lastHairPalette && node.presets?.colors?.hair) {
        node._lastHairPalette = node.presets.colors.hair;
      }
      node.presets.colors.hair = null;
    } else {
      if (!node.presets?.colors?.hair) {
        node.presets.colors.hair =
          node._lastHairPalette || getDefaultHairPalette(node?._meta?.racePrimary, node?._meta?.subrace);
      }
    }
  }

  if (feature === 'tattoo') {
    const disabled = tattooColorShouldBeDisabled(node);
    if (disabled) {
      if (!node._lastTattooColor && node.presets?.colors?.tattoo) {
        node._lastTattooColor = node.presets.colors.tattoo;
      }
      node.presets.colors.tattoo = null;
    } else {
      if (!node.presets?.colors?.tattoo) {
        const keys = Object.keys(tattooColors);
        node.presets.colors.tattoo = node._lastTattooColor || (keys.length ? tattooColors[keys[0]] : null);
      }
    }
  }
  
  genCharPresets(node.template);
  genColorSwatches(hairColors, 'hair');
  genColorSwatches(tattooColors, 'tattoo');
  notifyFeatures();
}

function applyColorIndex() {
  if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
    raceGenderColorPresets =
      raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'];
  } else {
    raceGenderColorPresets = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'];
  }

  for (let i = 0; i < Object.keys(hairColors).length; i++) {
    const hairColorName = Object.keys(hairColors)[i];
    const cur = raceGenderColorPresets?.hair;
    if (!cur) continue; // keep previous index when hair disabled
    const palette0 = Array.isArray(hairColors[hairColorName]) ? hairColors[hairColorName][0] : hairColors[hairColorName];
    const cur0 = Array.isArray(cur) ? cur[0] : cur;
    if (palette0 === cur0) hairColorIndex = i;
  }

  for (let i = 0; i < Object.keys(tattooColors).length; i++) {
    const name = Object.keys(tattooColors)[i];
    const cur = raceGenderColorPresets?.tattoo;
    if (!cur) continue;
    if (tattooColors[name] === cur) tattooColorIndex = i;
  }
}

// select gender
function selectGender(gender) {
  function changeGender() {
    if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
      genderName = Object.keys(raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'])[genderIndex];
      raceGenderTemplate =
        raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['template'];
    } else {
      genderName = Object.keys(raceGenderTemplateObject[racePrimaryName]['genders'])[genderIndex];
      raceGenderTemplate = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['template'];
    }

    applyColorIndex();
    genCharPresets(raceGenderTemplate);
    genColorSwatches(hairColors, 'hair');
    genColorSwatches(tattooColors, 'tattoo');
    notifyFeatures();
  }

  if (gender === 'male') {
    if (genderIndex > 0) {
      genderIndex--;
      changeGender();
    }
  }
  if (gender === 'female') {
    if (genderIndex < 1) {
      genderIndex++;
      changeGender();
    }
  }
}

// select primary race
function selectRacePrimary(scale) {
  function changeRacePrimary() {
    racePrimaryName = Object.keys(raceGenderTemplateObject)[racePrimaryIndex];

    if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
      if (raceIndex === undefined) {
        raceIndex = 0;
      } else if (raceIndex > Object.keys(raceGenderTemplateObject[racePrimaryName]['races']).length - 1) {
        raceIndex = Object.keys(raceGenderTemplateObject[racePrimaryName]['races']).length - 1;
      }
      raceName = Object.keys(raceGenderTemplateObject[racePrimaryName]['races'])[raceIndex];
      raceGenderTemplate =
        raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['template'];
    } else {
      raceGenderTemplate = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['template'];
    }

    applyColorIndex();
    genCharPresets(raceGenderTemplate);
    genRaceNameAndLore();
    genColorSwatches(hairColors, 'hair');
    genColorSwatches(tattooColors, 'tattoo');
    notifyFeatures();
  }

  if (scale === 'increase') {
    if (racePrimaryIndex < Object.keys(raceGenderTemplateObject).length - 1) {
      racePrimaryIndex++;
      changeRacePrimary();
    } else {
      racePrimaryIndex = 0;
      changeRacePrimary();
    }
  }

  if (scale === 'decrease') {
    if (racePrimaryIndex > 0) {
      racePrimaryIndex--;
      changeRacePrimary();
    } else {
      racePrimaryIndex = Object.keys(raceGenderTemplateObject).length - 1;
      changeRacePrimary();
    }
  }
}

// select race
function selectRace(scale) {
  function changeRace() {
    raceName = Object.keys(raceGenderTemplateObject[racePrimaryName]['races'])[raceIndex];
    raceGenderTemplate =
      raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['template'];
    genCharPresets(raceGenderTemplate);

    applyColorIndex();
    genRaceNameAndLore();
    genColorSwatches(hairColors, 'hair');
    genColorSwatches(tattooColors, 'tattoo');
    notifyFeatures();
  }

  if (scale === 'increase') {
    if (raceIndex < Object.keys(raceGenderTemplateObject[racePrimaryName]['races']).length - 1) {
      raceIndex++;
      changeRace();
    } else {
      raceIndex = 0;
      changeRace();
    }
  }

  if (scale === 'decrease') {
    if (raceIndex > 0) {
      raceIndex--;
      changeRace();
    } else {
      raceIndex = Object.keys(raceGenderTemplateObject[racePrimaryName]['races']).length - 1;
      changeRace();
    }
  }
}

// select hair color
function selectHairColor(color) {
  const node = getCurrentNode();
  // If BOTH hair and (existing) beard are none, ignore color picks
  if (node && hairColorShouldBeDisabled(node)) return;

  const selectedHairColor = hairColors[color];

  if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
    raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].hair =
      selectedHairColor;
  } else {
    raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].hair = selectedHairColor;
  }

  // cache last palette for restore when hair toggled off/on
  if (node) node._lastHairPalette = selectedHairColor;

  hairColorIndex = Object.keys(hairColors).indexOf(color);
  genCharPresets(raceGenderTemplate);
  notifyFeatures();
}

// select tattoo color
function selectTattooColor(color) {
  const node = getCurrentNode();
  if (node && tattooColorShouldBeDisabled(node)) return;

  let selectedTattooColor = tattooColors[color];

  if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
    raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].tattoo =
      selectedTattooColor;
  } else {
    raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].tattoo = selectedTattooColor;
  }

  // cache last palette for restore when tattoo toggled off/on
  if (node) node._lastTattooColor = selectedTattooColor;

  tattooColorIndex = Object.keys(tattooColors).indexOf(color);
  genCharPresets(raceGenderTemplate);
  notifyFeatures();
}

function genRaceNameAndLore() {
  if (typeof document === 'undefined') return;
  racePrimaryLore = raceGenderTemplateObject[racePrimaryName]['lore'];

  const elPrimary = document.getElementById('selectedRacePrimary');
  const elPrimaryLore = document.getElementById('selectedRacePrimaryLore');
  const elRaceDom = document.getElementById('selectedRaceDom');
  const elRace = document.getElementById('selectedRace');
  const elRaceLore = document.getElementById('selectedRaceLore');

  if (elPrimary) elPrimary.innerHTML = racePrimaryName.includes('halforc') ? 'Halforc' : racePrimaryName;
  if (elPrimaryLore) elPrimaryLore.innerHTML = racePrimaryLore || '';

  if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
    raceLore = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['lore'];
    if (elRaceDom) elRaceDom.classList.remove('hidden');

    let raceLabel = raceName;
    if (raceName.includes('elf')) raceLabel = raceName.split('elf')[0] + ' Elf';
    else if (raceName.includes('alokr')) raceLabel = "Halok'r";

    if (elRace) elRace.innerHTML = raceLabel;
    if (elRaceLore) elRaceLore.innerHTML = raceLore || '';
  } else {
    if (elRaceDom) elRaceDom.classList.add('hidden');
    if (elRace) elRace.innerHTML = '';
    if (elRaceLore) elRaceLore.innerHTML = '';
  }
}

if (typeof window !== 'undefined') {
  window.permute = permute;
  window.selectFeaturePresets = selectFeaturePresets;
  window.selectGender = selectGender;
  window.selectRacePrimary = selectRacePrimary;
  window.selectRace = selectRace;
  window.selectHairColor = selectHairColor;
  window.selectTattooColor = selectTattooColor;
  window.randomChar = randomChar;
  window.randomizeCurrentFeatures = randomizeCurrentFeatures;

  const run = async () => {
    if (!ensureCanvas()) return;
    await initFromSprites();
    randomChar();
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(run, 0);
  } else {
    window.addEventListener('DOMContentLoaded', run, { once: true });
  }
}

// ---- Named exports for React clients (safe guards for SSR) ----
export const onRandom = async () => {
  if (typeof window === 'undefined') return;
  if (!ensureCanvas()) return;
  if (!raceGenderTemplateObject || Object.keys(raceGenderTemplateObject).length === 0) {
    await initFromSprites();
  }
  randomChar();
};

export const onPermute = () => {
  if (typeof window !== 'undefined') permute();
};

export const onFeatureChange = (category, dir) => {
  if (typeof window !== 'undefined') selectFeaturePresets(category, dir);
};

export const onSelectGender = (g) => {
  if (typeof window !== 'undefined') selectGender(g);
};

export const onSelectRacePrimary = (dir) => {
  if (typeof window !== 'undefined') selectRacePrimary(dir);
};

export const onSelectRace = (dir) => {
  if (typeof window !== 'undefined') selectRace(dir);
};

export function onSelectClass(dir) {
  selectClass(dir);
}
export function onInitClassUI() {
  setClassLabel();
}
export function onSetClass(name) {
  setClassByName(name);
}

// Let React subscribe to live feature list / values
export const onSubscribeFeatures = (cb) => {
  if (typeof window === 'undefined') return () => {};
  featureSubscribers.add(cb);
  try {
    notifyFeatures();
  } catch {}
  return () => featureSubscribers.delete(cb);
};

// Export skin filter name getter (index-aligned)
export const skinFilterNameAt = (i) => getSkinFilterName(i);

export const onRandomizeFeatures = async () => {
  if (typeof window === 'undefined') return;
  if (!ensureCanvas()) return;
  if (!raceGenderTemplateObject || Object.keys(raceGenderTemplateObject).length === 0) {
    await initFromSprites();
  }
  randomizeCurrentFeatures();
};