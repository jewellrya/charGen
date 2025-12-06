import {
  CLASS_ARMOR_FILTERS,
  RACE_ARMOR_FILTERS,
  CLASS_OPTIONS,
  CLASS_TO_ARMOR,
  CLASS_TO_WEAPON,
  FEATURE_PANEL_ORDER_TOP_FIRST,
  SLOT_DRAW_ORDER_TOP_FIRST,
  TRANSPARENT_PX,
  isExcludedFeatureBase,
} from './char-gen/constants';
import {
  DEFAULT_SKIN_INDEX_DWARF,
  DEFAULT_SKIN_INDEX_ELF_DEEP,
  DEFAULT_SKIN_INDEX_ELF_HIGH,
  DEFAULT_SKIN_INDEX_ELF_WOOD,
  DEFAULT_SKIN_INDEX_HALFORC,
  DEFAULT_SKIN_INDEX_HUMAN,
  SKIN_FILTERS_HUMAN,
  hairColors,
  tattooColors,
  canonRace,
  getDefaultHairPalette,
  getDefaultSkinIndexForNode,
  getSkinFiltersForNode,
} from './char-gen/palettes';
import { applyArmorFilterPixelOKLab, applySkinFilter, replaceColor } from './char-gen/colorMath';
import {
  buildGroupEntries,
  groupSlotKeysFor,
  slotBaseName,
  slotRank,
} from './char-gen/slotUtils';

let canvas = null;
let ctx = null;

// Global toggle for showing/hiding equipment across all characters.
// Default false; controlled from the React UI.
let __hideEquipment = false;
export function setHideEquipment(v) {
  __hideEquipment = !!v;
  try {
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('nral:hide-eq-changed', { detail: { value: __hideEquipment } }));
    }
  } catch {}
}
export function getHideEquipment() { return !!__hideEquipment; }

// Snapshot used by notifyFeatures/onSubscribeFeatures to expose grouped controls to the UI.
function buildFeatureUiSnapshot() {
  const node = getCurrentNode ? getCurrentNode() : null;
  if (!node) return { features: [], uiOrder: [], values: {}, counts: {}, labels: {} };

  const orderMap = node.presets?.order || {};
  const allKeys = Object.keys(orderMap);

  const groups = new Map(); // base -> [slotKey, slotKey+detail, ...]
  for (const k of allKeys) {
    const base = slotBaseName(k);
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push(k);
  }

  // Order bases by FEATURE_PANEL_ORDER_TOP_FIRST, then by rank/name
  let bases = Array.from(groups.keys()).sort((a, b) => {
    const ai = FEATURE_PANEL_ORDER_TOP_FIRST.indexOf(a);
    const bi = FEATURE_PANEL_ORDER_TOP_FIRST.indexOf(b);
    if (ai !== -1 || bi !== -1) {
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    }
    const ra = slotRank(a), rb = slotRank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
  // Exclude any base listed in EXCLUDED_FEATURE_BASES (e.g., "weapon")
  bases = bases.filter(b => !isExcludedFeatureBase(b));

  const features = [];
  const values = {};
  const counts = {};
  const labels = {};

  for (const base of bases) {
    const family = groups.get(base);
    features.push(base); // single control per base family

    let entries = [];
    try {
      entries = buildGroupEntries(node, base);
      counts[base] = entries.length;
    } catch (e) {
      counts[base] = 0;
      values[base] = 0;
      labels[base] = `ERROR: ${e && e.message ? e.message : 'duplicate id'}`;
      continue;
    }

    // Determine currently selected ID (first non-zero among the family's concrete slots)
    let selectedId = 0;
    for (const k of family) {
      const sel = (node?.presets?.features?.[k] ?? 0) | 0;
      if (sel > 0) {
        const ti = node.presets.order[k];
        const arr = node.template[ti] || [];
        const it = arr[sel];
        const id = Number(it?.id || 0);
        if (id > 0) { selectedId = id; break; }
      }
    }

    values[base] = selectedId;
    labels[base] = selectedId === 0 ? 'none' : String(selectedId);
  }

  return { features, uiOrder: features, values, counts, labels };
}

// --- Selected ID helpers (array index -> normalized file id) ---
function _selectedIdForSlot(node, slotKey) {
  const ti = node?.presets?.order?.[slotKey];
  if (typeof ti !== 'number') return 0;
  const sel = (node?.presets?.features?.[slotKey] ?? 0) | 0;
  if (sel <= 0) return 0;
  const arr = node?.template?.[ti] || [];
  const it = arr[sel];
  const id = Number(it?.id || 0);
  return Number.isFinite(id) ? id : 0;
}

// Read a whole base "family" like "adornment" across concrete keys (e.g., "adornment+neck", "adornment+chest", …)
function _selectedIdForBase(node, base) {
  const fam = groupSlotKeysFor(node, base);
  for (const k of fam) {
    const id = _selectedIdForSlot(node, k);
    if (id > 0) return id;
  }
  return 0;
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

    // If no armor for this class, or there are no entries in this slot, or if hideEquipment is on, hard clear
    if (!armor || arr.length <= 1 || __hideEquipment) {
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

function getSelectedWeaponId() {
  const cls = (getCurrentClass() || '').toLowerCase();
  const id = CLASS_TO_WEAPON[cls];
  return (typeof id === 'number' && id > 0) ? id : null;
}

function applyWeaponForClassToNode(node) {
  if (!node) return;

  const wantId = getSelectedWeaponId();
  const family = groupSlotKeysFor(node, 'weapon'); // e.g. ["weapon", "weapon+back"]
  if (!family || family.length === 0) return;

  // If hidden or no id requested, clear all weapon slots.
  if (__hideEquipment || !wantId) {
    for (const k of family) {
      node.presets.features[k] = 0;
    }
    return;
  }

  // For each concrete weapon slot variant, find the array index whose .id equals wantId.
  // If found, apply it; otherwise clear that slot. This allows multi-part weapons
  // (e.g., bow in front + quiver in back) to render together when they share the same id.
  for (const k of family) {
    const ti = node?.presets?.order?.[k];
    if (typeof ti !== 'number') { continue; }
    const arr = node?.template?.[ti] || [];
    let foundIdx = 0;
    for (let idx = 1; idx < arr.length; idx++) {
      const ent = arr[idx];
      const fileId = Number(ent?.id || 0);
      if (fileId === wantId) { foundIdx = idx; break; }
    }
    node.presets.features[k] = foundIdx; // 0 clears if not found in this variant
  }
}

function getSelectedArmorFilterSpec() {
  const cls = (getCurrentClass() || '').toLowerCase();
  return CLASS_ARMOR_FILTERS[cls] || null;
}

function getRaceArmorFilterSpec(node) {
  const rp = canonRace(node?._meta?.racePrimary || '');
  if (!rp) return null;
  return RACE_ARMOR_FILTERS[rp] || null;
}

function combineArmorFilters(specA, specB) {
  if (!specA && !specB) return null;
  const out = {};
  const keys = ['h','s','l','b','c'];
  for (const k of keys) {
    const a = (specA && typeof specA[k] === 'number') ? specA[k] : null;
    const b = (specB && typeof specB[k] === 'number') ? specB[k] : null;
    if (a === null && b === null) {
      out[k] = null;
    } else if (a === null) {
      out[k] = b;
    } else if (b === null) {
      out[k] = a;
    } else {
      out[k] = a + b;
    }
  }
  return out;
}

// ---- Armor filter mask helpers ----
function _armorFilterHasAnyChannel(spec) {
  if (!spec) return false;
  return ['h','s','l','b','c'].some((k) => typeof spec[k] === 'number');
}

function getSelectedSkinNumber(node) {
  const filters = getSkinFiltersForNode(node) || SKIN_FILTERS_HUMAN;
  const max = Array.isArray(filters) ? filters.length : 0;
  let idx = (typeof node?.presets?.features?.skin === 'number')
    ? node.presets.features.skin
    : getDefaultSkinIndexForNode(node);
  if (!Number.isFinite(idx) || idx < 0) idx = 0;
  if (max > 0 && idx >= max) idx = max - 1;
  return max === 0 ? 0 : (idx + 1); // 1-based for metadata/display
}

export function applyClassArmorAndRedraw() {
  const node = getCurrentNode();
  if (!node) return;

  applyArmorForClassToNode(node);
  applyWeaponForClassToNode(node);
  genCharPresets(node.template);
  notifyFeatures();
}

// Build a minimal, immutable traits snapshot for metadata.
// Uses grouped families so "adornment+neck" shows up as one "adornment" trait.
export function getImmutableTraitsSnapshot() {
  const node = (typeof getCurrentNode === 'function') ? getCurrentNode() : null;
  if (!node) return null;

  // Name from the input box
  let name = null;
  try {
    const el = (typeof document !== 'undefined') ? document.getElementById('charName') : null;
    if (el && 'value' in el) {
      const v = (el.value || '').trim();
      name = v || null;
    }
  } catch {}

  // Basic meta
  const gender = node?._meta?.gender || null;
  const race   = node?._meta?.subrace || node?._meta?.racePrimary || null;

  let className = null;
  try { className = (typeof getCurrentClass === 'function') ? getCurrentClass() : null; } catch {}

  // Colors → attempt to map back to palette keys
  let hairColor = null, tattooColor = null;
  try {
    const hc = node?.presets?.colors?.hair || null;
    if (hc && typeof hairColors === 'object') {
      for (const k in hairColors) { if (hairColors[k] === hc) { hairColor = k; break; } }
      if (!hairColor) {
        const s = JSON.stringify(hc);
        for (const k in hairColors) { try { if (JSON.stringify(hairColors[k]) === s) { hairColor = k; break; } } catch {}
        }
      }
    }
  } catch {}
  try {
    const tc = node?.presets?.colors?.tattoo || null;
    if (tc && typeof tattooColors === 'object') {
      for (const k in tattooColors) { if (tattooColors[k] === tc) { tattooColor = k; break; } }
      if (!tattooColor) {
        const s = JSON.stringify(tc);
        for (const k in tattooColors) { try { if (JSON.stringify(tattooColors[k]) === s) { tattooColor = k; break; } } catch {}
        }
      }
    }
  } catch {}

  // Numeric features (normalize by file id, not array index)
  const skin      = getSelectedSkinNumber(node);
  const hair      = _selectedIdForSlot(node, 'hair');
  const facialHair = _selectedIdForSlot(node, 'facialhair');
  const tattoo    = _selectedIdForSlot(node, 'tattoo');
  const adornment = _selectedIdForBase(node, 'adornment'); // ← family‑aware (adornment+neck/chest/etc.)

  return {
    name, gender, race, className,
    skin, hair, hairColor, facialHair, tattoo, tattooColor, adornment
  };
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

function hairColorShouldBeDisabled(node) {
  const hairSel  = ((node?.presets?.features?.hair)  ?? 0) | 0;
  const hasFacial = typeof node?.presets?.order?.facialhair === 'number';
  const facialSel = hasFacial ? (((node?.presets?.features?.facialhair) ?? 0) | 0) : null;

  if (hasFacial) {
    return hairSel === 0 && facialSel === 0; // disable only if BOTH are none
  }
  return hairSel === 0; // no facial hair slot → fall back to hair only
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
  // 2) Feature slots (exclude 'skin' and 'weapon' family)
  const order = node.presets.order || {};
  for (const slot of Object.keys(order)) {
    if (slot === 'skin') continue;
    if (isExcludedFeatureBase(slotBaseName(slot))) continue; // excluded families are never randomized
    if (slot === 'chest' || slot === 'legs' || slot === 'feet') continue;
    const ti = order[slot];
    const arr = node.template[ti] || [];
    node.presets.features[slot] = (arr.length <= 1) ? 0 : Math.floor(Math.random() * arr.length);
  }

  // 3) Hair & tattoo color palettes (hair color disabled iff BOTH hair & facial hair are none when facial hair exists)
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

    // Attach slot arrays like "hair" to a specific gender node.
    function ensureSlot(node, slotKey) {
      if (!node.__slotBuffers) node.__slotBuffers = {};
      if (!node.__slotBuffers[slotKey]) node.__slotBuffers[slotKey] = [];
    }
    // If a composite "slot+detail" is present in SLOT_DRAW_ORDER_TOP_FIRST, group by that composite
    // so we can control layer z‑order for specific variants (e.g., "adornment+chest") without
    // losing the plain base slot (e.g., "adornment").
    function pushSlot(node, slot, detailFirst, obj) {
      const composite = (detailFirst ? `${slot}+${detailFirst}` : null);
      const useComposite = !!(composite && SLOT_DRAW_ORDER_TOP_FIRST.includes(composite));
      const slotKey = useComposite ? composite : slot;
      ensureSlot(node, slotKey);
      // Preserve base slot and detail on each entry for downstream consumers
      const enriched = { ...obj, _slotBase: slot, _detail: detailFirst || null };
      node.__slotBuffers[slotKey].push(enriched);
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

      pushSlot(target, slot, detailFirst, { name: `${slot}${id}`, src: p, x: 0, y: 0, _id: id });
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
          .map(({ _id, ...rest }) => ({ ...rest, id: (_id || 0) }));

        // prepend blank
        arr.unshift({ name: `_${slot}_blank`, src: TRANSPARENT_PX, x: 0, y: 0, id: 0 });

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

        // Dwarf male: Facial Hair 1 by default (if present)
        const meta = node._meta || {};
        if (
          slot === 'facialhair' &&
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
          setFeature(woodMale, 'facialhair', 4);
          setTattooColor(woodMale, 'brown2');
        }
        const woodFemale = elf.woodelf?.genders?.female;
        if (woodFemale) {
          setFeature(woodFemale, 'tattoo', 4);
          setFeature(woodFemale, 'adornment', 3);
          setTattooColor(woodFemale, 'brown2');
        }

        // deep elf
        const deepMale = elf.deepelf?.genders?.male;
        if (deepMale) {
          setFeature(deepMale, 'tattoo', 6);
          setHairColor(deepMale, 'gray2');
          setFeature(deepMale, 'hair', 12);
          setFeature(deepMale, 'adornment', 3);
          setFeature(deepMale, 'facialhair', 6);
          setTattooColor(deepMale, 'red1');
        }
        const deepFemale = elf.deepelf?.genders?.female;
        if (deepFemale) {
          setFeature(deepFemale, 'hair', 7);
          setHairColor(deepFemale, 'black2');
          setFeature(deepFemale, 'tattoo', 7);
          setTattooColor(deepFemale, 'brown2');
          setFeature(deepFemale, 'adornment', 2);
        }

        // high elf male: adornment 2, tattoo color blue1
        const highMale = elf.highelf?.genders?.male;
        if (highMale) {
          setFeature(highMale, 'adornment', 2);
          setTattooColor(highMale, 'blue1');
        }
        const highFemale = elf.highelf?.genders?.female;
        if (highFemale) {
          setTattooColor(highFemale, 'cyan1');
        }
      }

      // human male
      const humanMale = out.human?.genders?.male;
      if (humanMale) {
        setHairColor(humanMale, 'brown3');
        setTattooColor(humanMale, 'brown2');
      }

      // dwarf
      const dwarfMale = out.dwarf?.genders?.male;
      if (dwarfMale) {
        setHairColor(dwarfMale, 'red1');
        setFeature(dwarfMale, 'adornment', 3);
        setFeature(dwarfMale, 'facialhair', 6);
        setTattooColor(dwarfMale, 'brown2');
      }

      const dwarfFemale = out.dwarf?.genders?.female;
      if (dwarfFemale) {
        setFeature(dwarfFemale, 'hair', 2);
        setHairColor(dwarfFemale, 'red1');
        setFeature(dwarfFemale, 'adornment', 4);
        setTattooColor(dwarfFemale, 'brown2');
      }

      // halforc
      const halforcMale = out.halforc?.genders?.male;
      if (halforcMale) {
        setHairColor(halforcMale, 'brown1');
        setFeature(halforcMale, 'adornment', 3);
        setFeature(halforcMale, 'hair', 9);
        setFeature(halforcMale, 'facialhair', 1);
        setTattooColor(halforcMale, 'white1');
      }
      const halforcFemale = out.halforc?.genders?.female;
      if (halforcFemale) {
        setFeature(halforcFemale, 'skin', 2);
        setHairColor(halforcFemale, 'black2');
        setFeature(halforcFemale, 'adornment', 1);
        setFeature(halforcFemale, 'hair', 10);
        setFeature(halforcFemale, 'tattoo', 6);
        setTattooColor(halforcFemale, 'brown1');
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
let tattooColorIndex;

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
      '<label onclick="(window.__playClick && window.__playClick()), select' + subjectCap + 'Color(\'' + colorName + '\')" ' +
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

      if (lname.startsWith('hair') || lname.startsWith('facialhair')) {
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
        const classSpec = getSelectedArmorFilterSpec();
        const raceSpec = getRaceArmorFilterSpec(getCurrentNode());
        const spec = combineArmorFilters(classSpec, raceSpec);
        if (spec && _armorFilterHasAnyChannel(spec)) {
          const id = octx.getImageData(0, 0, off.width, off.height);
          const d = id.data;
          for (let i2 = 0; i2 < d.length; i2 += 4) {
            if (d[i2 + 3] !== 255) continue; // operate only on fully opaque texels of the sprite
            const r0 = d[i2], g0 = d[i2 + 1], b0 = d[i2 + 2];
            const [rr, gg, bb] = applyArmorFilterPixelOKLab(r0, g0, b0, spec);
            d[i2] = rr; d[i2 + 1] = gg; d[i2 + 2] = bb; // keep alpha as‑is
          }
          octx.putImageData(id, 0, 0);
        }
      } else if (lname.startsWith('weapon')) {
        const raceSpec = getRaceArmorFilterSpec(getCurrentNode());
        const spec = raceSpec;
        if (spec && _armorFilterHasAnyChannel(spec)) {
          const id = octx.getImageData(0, 0, off.width, off.height);
          const d = id.data;
          for (let i2 = 0; i2 < d.length; i2 += 4) {
            if (d[i2 + 3] !== 255) continue;
            const r0 = d[i2], g0 = d[i2 + 1], b0 = d[i2 + 2];
            const [rr, gg, bb] = applyArmorFilterPixelOKLab(r0, g0, b0, spec);
            d[i2] = rr; d[i2 + 1] = gg; d[i2 + 2] = bb;
          }
          octx.putImageData(id, 0, 0);
        }
      }

      // Composite processed layer onto main canvas
      ctx.drawImage(off, 0, 0);
    }



    let img = canvas.toDataURL('image/png');
    if (typeof document !== 'undefined') {
      const cg = document.getElementById('charGen');
      if (cg) {
        const container = document.createElement('div');
        container.id = `component_${name}`;
        container.className = 'w-full md:w-3/4 lg:w-7/10';

        const inner = document.createElement('div');
        inner.className = 'flex flex-col items-center gap-2';

        const imgEl = document.createElement('img');
        imgEl.id = `img_${name}`;
        imgEl.src = img;
        imgEl.className = 'w-full mx-auto';
        inner.appendChild(imgEl);

        container.appendChild(inner);

        if (!replace) {
          cg.appendChild(container);
        } else {
          cg.innerHTML = '';
          cg.appendChild(container);
        }
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

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
// ---- Grouping helpers (combine slots like "adornment+neck", "adornment+chest" under "adornment") ----
function _canonSlotName(slot) {
  return String(slot || '').split('+')[0];
}
function _isAutoManaged(slot) {
  // hide underwear + class-controlled armor/weapon from UI
  return ['underwear', 'chest', 'legs', 'feet', 'weapon'].includes(slot);
}
function _buildGroupMap(node) {
  const map = new Map();
  if (!node || !node.presets || !node.presets.features) return map;
  for (const raw of Object.keys(node.presets.features)) {
    if (_isAutoManaged(raw)) continue;
    const base = _canonSlotName(raw);
    if (!map.has(base)) map.set(base, []);
    if (!map.get(base).includes(raw)) map.get(base).push(raw);
  }
  // stable ordering inside each base group
  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => a.localeCompare(b));
  }
  return map;
}
// Build a flat options list across all sub-slots in a base group.
// Returns { options: [{slot, index, item}], max: number, ptr: number, label: string }
function _groupStateFor(node, base) {
  const ID_RE = /\+id(\d+)/i;
  const res = { options: [], max: 0, ptr: 0, label: 'none' };
  if (!node || !node.presets) return res;
  const order = node.presets.order || {};
  const features = node.presets.features || {};
  const t = node.template || [];
  const groups = _buildGroupMap(node);
  const slots = groups.get(base);
  if (!slots || !slots.length) return res;

  // Build option list (skip index 0 placeholders)
  const options = [];
  for (const s of slots) {
    const ti = order[s];
    const arr = (typeof ti === 'number') ? (t[ti] || []) : [];
    for (let i = 1; i < arr.length; i++) {
      options.push({ slot: s, index: i, item: arr[i] });
    }
  }
  res.options = options;
  res.max = options.length + 1; // + "none"

  // Determine current pointer and label
  let curSlot = null, curIndex = 0, label = 'none';
  for (const s of slots) {
    const v = features[s] ?? 0;
    if (typeof v === 'number' && v > 0) { curSlot = s; curIndex = v; break; }
  }
  if (curSlot) {
    let ordinal = 0;
    for (const opt of options) {
      if (opt.slot === curSlot && opt.index === curIndex) break;
      ordinal++;
    }
    res.ptr = ordinal + 1; // shift by "none"
    const item = options[ordinal]?.item;
    if (item) {
      const fromName = (item?.name || '').match(/(\d+)/);
      if (fromName && fromName[1]) {
        label = String(parseInt(fromName[1], 10));
      } else {
        const src = item?.src ? decodeURIComponent(item.src) : '';
        const m = src.match(ID_RE);
        label = m ? String(parseInt(m[1], 10)) : String(curIndex);
      }
    }
  }
  res.label = label;
  return res;
}
function notifyFeatures() {
  try {
    const node = getCurrentNode();
    if (!node || !node.presets || !node.presets.features) return;

    const values = {};
    const counts = {};
    const labels = {};

    // First: handle special color pseudo-slots and skin
    const groups = _buildGroupMap(node);
    // The canonical list of features to show in the UI (grouped)
    const featureList = Array.from(groups.keys());

    // Compute counts/labels/values for grouped features
    for (const base of featureList) {
      if (base === 'skin') {
        const filters = getSkinFiltersForNode(node) || SKIN_FILTERS_HUMAN;
        counts[base] = filters.length;
        const cur = node.presets.features[base] ?? getDefaultSkinIndexForNode(node);
        labels[base] = String((cur ?? 0) + 1);
        values[base] = cur ?? 0;
        continue;
      }
      const st = _groupStateFor(node, base);
      counts[base] = st.max;
      values[base] = st.ptr;       // UI pointer (0 = none)
      labels[base] = st.label;     // human-friendly number
    }

    // UI order: explicit FEATURE_PANEL_ORDER_TOP_FIRST (includes "hairColor"/"tattooColor"), then rest
    const ordered = [];
    const listed = new Set();
    for (const key of FEATURE_PANEL_ORDER_TOP_FIRST) {
      if (key === 'hairColor' || key === 'tattooColor') {
        ordered.push(key); listed.add(key); continue;
      }
      if (featureList.includes(key)) { ordered.push(key); listed.add(key); }
    }
    for (const f of featureList) { if (!listed.has(f)) ordered.push(f); }

    // Broadcast to modern subscribers
    if (typeof __featureSubs !== 'undefined' && Array.isArray(__featureSubs)) {
      for (const fn of __featureSubs) {
        try { fn({ features: featureList, uiOrder: ordered, values, counts, labels }); } catch {}
      }
    }
    // Back-compat Set-based subscribers
    if (typeof featureSubscribers !== 'undefined' && featureSubscribers && typeof featureSubscribers.forEach === 'function') {
      featureSubscribers.forEach((fn) => {
        try { fn({ features: featureList, uiOrder: ordered, values, counts, labels }); } catch {}
      });
    }
  } catch (e) {
    // swallow to avoid breaking draws; this is UI-only
  }
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

  // Base/skin layer (drawn after any behind-base slots; marked so recolor logic can find it)
  const baseLayer = { ...base, _isBase: true };

  // Add each feature layer in the node's order
  const { features, order } = node.presets;
  const orderedSlots = Object.keys(features)
    .filter((s) => s !== 'skin')
    .sort((a, b) => {
      const ia = (typeof order[a] === 'number') ? order[a] : 9999;
      const ib = (typeof order[b] === 'number') ? order[b] : 9999;
      return ia - ib; // lower template index draws earlier (closer to base)
    });

  const layersBeforeBase = [];
  const layersAfterBase = [];

  for (const slot of orderedSlots) {
    const selIndex = features[slot];
    const ti = order[slot];
    const arr = raceGenderTemplate[ti];
    // Only draw when a real option is selected (skip index 0 which is the transparent placeholder)
    if (typeof selIndex === 'number' && selIndex > 0) {
      const chosen = arr?.[selIndex] || null;
      if (chosen) {
        const layer = { ...chosen, _slot: slot };
        // Any slot variant ending in "+back" should render behind the base body layer.
        if (slot.endsWith('+back')) {
          layersBeforeBase.push(layer);
        } else {
          layersAfterBase.push(layer);
        }
      }
    }
  }

  genChar.push(...layersBeforeBase);
  genChar.push(baseLayer);
  const genName = `${racePrimaryIndex ?? 0}${raceIndex ?? ''}${genderIndex ?? 0}0000${padZeroes(
    hairColorIndex,
    2
  )}${padZeroes(tattooColorIndex, 2)}`;
  genChar.push(...layersAfterBase);
  drawChar(genChar, genName, true);
  notifyFeatures();
  refreshColorSwatchesDeferred();
}

// Select character features (increase/decrease per discovered slot).
function selectFeaturePresets(feature, scale) {
  const node = getCurrentNode();
  if (!node) return;

  // ---- Grouped virtual features (e.g., "adornment" combines "adornment+head", etc.) ----
  const groups = _buildGroupMap(node);
  const groupSlots = (!node.presets.features.hasOwnProperty(feature)) ? groups.get(feature) : null;

  // Special-case "skin" is backed by skin filter list
  if (feature === 'skin') {
    const filters = getSkinFiltersForNode(node) || SKIN_FILTERS_HUMAN;
    const max = filters.length;
    const cur = node.presets.features[feature] ?? 0;
    node.presets.features[feature] = (scale === 'increase')
      ? ((cur + 1) % max)
      : ((cur - 1 + max) % max);
    genCharPresets(node.template);
    genColorSwatches(hairColors, 'hair');
    genColorSwatches(tattooColors, 'tattoo');
    notifyFeatures();
    return;
  }

  if (groupSlots && groupSlots.length) {
    // Build flattened option list across all sub-slots
    const st = _groupStateFor(node, feature);
    const max = st.max || 1;
    const curPtr = st.ptr || 0;
    let nextPtr = curPtr;
    if (scale === 'increase') nextPtr = (curPtr + 1) % max;
    else if (scale === 'decrease') nextPtr = (curPtr - 1 + max) % max;

    // Apply: 0 => clear all; otherwise set exactly one slot/index and clear others
    for (const s of groupSlots) node.presets.features[s] = 0;
    if (nextPtr > 0) {
      const opt = st.options[nextPtr - 1];
      if (opt) {
        node.presets.features[opt.slot] = opt.index;
      }
    }

    // Render + notify
    genCharPresets(node.template);
    genColorSwatches(hairColors, 'hair');
    genColorSwatches(tattooColors, 'tattoo');
    notifyFeatures();
    return;
  }

  // ---- Default (non-grouped) behavior ----
  let max;
  const ti = node.presets.order[feature];
  if (typeof ti !== 'number') return; // unknown feature
  max = (node.template[ti] || []).length;
  if (!max) return;

  const cur = node.presets.features[feature] ?? 0;
  if (scale === 'increase') {
    node.presets.features[feature] = (cur + 1) % max;
  } else if (scale === 'decrease') {
    node.presets.features[feature] = (cur - 1 + max) % max;
  }

  // Preserve existing hair/tattoo color enable/disable behavior
  if (feature === 'hair' || feature === 'facialhair') {
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
  // If BOTH hair and (existing) facial hair are none, ignore color picks
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

  if (elPrimary) elPrimary.innerHTML = racePrimaryName.includes('halforc') ? 'Half-orc' : racePrimaryName;
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
  window.__playClick = window.__playClick || null;

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
const __featureSubs = [];

export function onSubscribeFeatures(cb) {
  if (typeof cb === 'function') {
    __featureSubs.push(cb);
    try { cb(buildFeatureUiSnapshot()); } catch {}
  }
  return function unsubscribe() {
    const i = __featureSubs.indexOf(cb);
    if (i >= 0) __featureSubs.splice(i, 1);
  };
}
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

// ... keep existing code above

function findHairKeyForNode(node) {
  const pal = node?.presets?.colors?.hair;
  if (!pal) return null;
  if (!Array.isArray(pal)) return null;

  for (const [key, value] of Object.entries(hairColors)) {
    if (!Array.isArray(value)) continue;
    if (value.length !== pal.length) continue;
    let same = true;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== pal[i]) { same = false; break; }
    }
    if (same) return key;
  }
  return null;
}

function findTattooKeyForNode(node) {
  const col = node?.presets?.colors?.tattoo;
  if (!col) return null;
  for (const [key, value] of Object.entries(tattooColors)) {
    if (value === col) return key;
  }
  return null;
}

/**
 * Snapshot the current immutable-ish builder state so React/metadata can use it.
 * This is intentionally "display facing": uses the same labels as the UI where possible.
 */
export function getDisplayTraitsSnapshot() {
  if (typeof document === 'undefined') return null;

  const node = getCurrentNode ? getCurrentNode() : null;
  if (!node) return null;

  // Name from input
  let name = null;
  const nameEl = document.getElementById('charName');
  if (nameEl && 'value' in nameEl) {
    const v = nameEl.value.trim();
    if (v) name = v;
  }

  // Race label: prefer subrace label when subrace DOM is visible
  let raceLabel = null;
  const primaryEl = document.getElementById('selectedRacePrimary');
  const domEl = document.getElementById('selectedRaceDom');
  const subEl = document.getElementById('selectedRace');
  if (domEl && !domEl.classList.contains('hidden') && subEl && subEl.textContent) {
    raceLabel = subEl.textContent.trim(); // e.g. "High Elf"
  } else if (primaryEl && primaryEl.textContent) {
    raceLabel = primaryEl.textContent.trim(); // e.g. "Human"
  }

  // Class label
  let classLabel = null;
  const classEl = document.getElementById('selectedClass');
  if (classEl && classEl.textContent) {
    const v = classEl.textContent.trim();
    if (v) classLabel = v;
  }

  // Gender from node meta (fallback to DOM later if needed)
  const meta = node._meta || {};
  let genderLabel = null;
  if (meta.gender) {
    const g = String(meta.gender);
    genderLabel = g.charAt(0).toUpperCase() + g.slice(1);
  }

  const feats = (node.presets && node.presets.features) || {};

  const skin = getSelectedSkinNumber(node);
  const hair = (typeof feats.hair === 'number') ? feats.hair : null;
  const facialHair = (typeof feats.facialhair === 'number') ? feats.facialhair : null;
  const tattoo = (typeof feats.tattoo === 'number') ? feats.tattoo : null;
  const adornment = (typeof feats.adornment === 'number') ? feats.adornment : null;

  const hairColorKey = findHairKeyForNode(node);
  const tattooColorKey = findTattooKeyForNode(node);

  return {
    name,
    gender: genderLabel,
    race: raceLabel,
    className: classLabel,
    skin,
    hair,
    hairColor: hairColorKey,
    facialHair,
    tattoo,
    tattooColor: tattooColorKey,
    adornment,
  };
}
