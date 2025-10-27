// import { charMaps } from '../../data/charMaps.js';

let canvas = null;
let ctx = null;

// 1x1 transparent pixel for “blank” slot entries
const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAp8B6j3pBV8AAAAASUVORK5CYII=';

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

  // Half-orc: brown1
  if (rp === 'halforc' || rp === 'half-orc' || rp === 'half_orc') return hairColors.brown1;

  // Elf subraces
  if (rp === 'elf') {
    if (sr === 'deepelf' || sr === 'deep-elf' || sr === 'deep_elf') return hairColors.gray1;   // Deep Elf
    if (sr === 'highelf' || sr === 'high-elf' || sr === 'high_elf') return hairColors.yellow2; // High Elf
    if (sr === 'woodelf' || sr === 'wood-elf' || sr === 'wood_elf') return hairColors.brown4;  // Wood Elf
  }

  // Fallback for anything not specified
  return hairColors.yellow1;
}

let xOffset = 0;
let yOffset = 0;

async function initFromSprites() {
  if (typeof fetch === 'undefined') return;
  try {
    const res = await fetch('/api/sprites', { cache: 'no-cache' });
    const json = await res.json();
    const manifest = json.manifest || {};

    // Build raceGenderTemplateObject with only a single base layer per gender
    const out = {};

    Object.keys(manifest).forEach((racePrimary) => {
      const node = manifest[racePrimary];

      if (node.races) {
        // has subraces
        out[racePrimary] = { lore: node.lore || '', races: {} };
        Object.keys(node.races).forEach((race) => {
          const rn = node.races[race];
          out[racePrimary].races[race] = { lore: rn.lore || '', genders: {} };
          ['male', 'female'].forEach((g) => {
            const base = rn.genders?.[g]?.base;
            if (!base) return;
            // template: just [ [base] ] (index 0 is "skin/base")
            const tpl = [
              [{ name: `${race.toLowerCase()}${g[0].toUpperCase() + g.slice(1)}1`, src: base.path, x: 0, y: 0 }],
            ];
            out[racePrimary].races[race].genders[g] = {
              template: tpl,
              presets: {
                colors: { hair: getDefaultHairPalette(racePrimary, race), tattoo: tattooColors.green1 },
                features: { skin: DEFAULT_SKIN_INDEX },
                order: { skin: 0 },
              },
              _meta: { racePrimary, subrace: race, gender: g } // for slot defaults later
            };
          });
        });
      } else {
        // no subraces
        out[racePrimary] = { lore: node.lore || '', genders: {} };
        ['male', 'female'].forEach((g) => {
          const base = node.genders?.[g]?.base;
          if (!base) return;
          const tpl = [
            [{ name: `${racePrimary.toLowerCase()}${g[0].toUpperCase() + g.slice(1)}1`, src: base.path, x: 0, y: 0 }],
          ];
          out[racePrimary].genders[g] = {
            template: tpl,
            presets: {
              colors: { hair: getDefaultHairPalette(racePrimary), tattoo: tattooColors.green1 },
              features: { skin: DEFAULT_SKIN_INDEX },
              order: { skin: 0 },
            },
            _meta: { racePrimary, subrace: undefined, gender: g }
          };
        });
      }
    });

    // --- Discover additional feature slots from filenames ---
    // Collect all png paths we can find.
    const assetPaths = new Set();
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

    // Parse filenames: <race(+subrace)+gender>_<slot>+id<idx>.png OR <race(+subrace)+gender>_<slot>.png (no id, e.g. underwear)
    // Examples:
    //   human+male_hair+id1.png
    //   elf+deepelf+female_tool+id2.png
    //   human+male_underwear.png
    const RE_ID = /^(?<chain>[^/_]+)_(?<slot>[a-z0-9]+)\+id(?<id>\d+)\.png$/i;
    const RE_SINGLE = /^(?<chain>[^/_]+)_(?<slot>[a-z0-9]+)\.png$/i; // e.g., human+male_underwear.png
    for (const p of assetPaths) {
      const fname = decodeURIComponent(p.split('/').pop() || '');
      let m = fname.match(RE_ID);
      let id = 0;
      let slot = '';
      let chain = '';

      if (m) {
        slot = (m.groups.slot || '').toLowerCase();
        id = parseInt(m.groups.id, 10) || 0;
        chain = m.groups.chain || '';
      } else {
        m = fname.match(RE_SINGLE);
        if (!m) continue;
        slot = (m.groups.slot || '').toLowerCase();
        chain = m.groups.chain || '';
        // If no explicit id, treat it as id=1 so it sorts after the blank
        id = 1;
      }

      const parts = chain.split('+'); // [race, (subrace), gender]
      const gender = (parts.pop() || '').toLowerCase();
      if (!gender) continue;

      // Find the target gender node inside "out"
      let target = null;
      if (parts.length === 1) {
        const rp = parts[0];
        target = out[rp]?.genders?.[gender] || null;
      } else if (parts.length >= 2) {
        const rp = parts[0], sub = parts[1];
        target = out[rp]?.races?.[sub]?.genders?.[gender] || null;
      }
      if (!target) continue;

      pushSlot(target, slot, { name: `${slot}${id}`, src: p, x: 0, y: 0, _id: id });
    }

    // Finalize slot buffers into template arrays + presets (with a blank first option)
    function finalizeSlots(node) {
      if (!node.__slotBuffers) return;
      const slotNames = Object.keys(node.__slotBuffers).sort(); // deterministic order
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

// Skin filters (HSL-based): entries may include { h, s, l } deltas where
//  - h: hue delta in turns (−1..+1), e.g. −0.04 ≈ −14.4°; wraps around 0..1
//  - s: saturation delta (−1..+1)
//  - l: lightness  delta (−1..+1)
// Place `null` at the index you want to represent “normal / no change”.
const SKIN_FILTERS = [
  { h: 0, s: -0, l: +0.08 }, // 0 (brightest)
  { h: 0, s: -0, l: +0.04 }, // 1
  null,                   // 2 <-- default “normal”
  { h: 0, s: +0, l: -0.04 }, // 3
  { h: 0, s: +0, l: -0.08 }, // 4
  { h: +0.02, s: -0.1, l: -0.25 }, // 5
  { h: +0.04, s: -0.2, l: -0.4 }, // 6
];

const DEFAULT_SKIN_INDEX = (() => {
  const idx = SKIN_FILTERS.findIndex((v) => v === null);
  return idx >= 0 ? idx : 0;
})();

function genColorSwatches(colorObject, subject) {
  let primaryColor, colorName, createdColorValue;

  let subjectCap = subject.charAt(0).toUpperCase() + subject.slice(1);
  if (typeof document === 'undefined') return;
  const swatchRoot = document.getElementById(subject + 'ColorSwatches');
  if (!swatchRoot) return;
  // Ensure container has wrap + gap
  swatchRoot.classList.add('flex', 'flex-wrap', 'gap-4');
  swatchRoot.innerHTML = '';

  function setPrimaryColor() {
    if (Array.isArray(colorObject[colorName])) {
      primaryColor = colorObject[colorName][0];

      if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
        createdColorValue =
          raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'][subject][0];
      } else {
        createdColorValue = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'][subject][0];
      }
    } else {
      primaryColor = colorObject[colorName];
      if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
        createdColorValue =
          raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'][subject];
      } else {
        createdColorValue = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'][subject];
      }
    }
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

  for (let i = 0; i < Object.keys(colorObject).length; i++) {
    colorName = Object.keys(colorObject)[i];
    setPrimaryColor();

    let inputName = 'radio' + subjectCap + 'Color';

    if (primaryColor === createdColorValue) {
      const selectedColorRadio = document.getElementById(inputName + i);
      if (selectedColorRadio) selectedColorRadio.checked = true;
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

function applySkinFilter(data, variantIndex) {
  const f = SKIN_FILTERS[variantIndex];
  if (!f) return; // null means “no change” regardless of index

  const dh = typeof f.h === 'number' ? f.h : 0; // hue delta in turns (−1..+1)
  const ds = typeof f.s === 'number' ? f.s : 0;
  const dl = typeof f.l === 'number' ? f.l : 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue; // skip fully transparent
    const r = data[i], g = data[i + 1], b = data[i + 2];
    let [h, s, l] = rgbToHsl(r, g, b);

    // apply deltas
    h = ((h + dh) % 1 + 1) % 1; // wrap hue into 0..1
    s = clamp01(s + ds);
    l = clamp01(l + dl);

    const [nr, ng, nb] = hslToRgb(h, s, l);
    data[i] = nr; data[i + 1] = ng; data[i + 2] = nb; // keep alpha
  }
}

function applyHairColor(imageData) {
  // Get selected hair palette
  let selected;
  if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
    selected = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].hair;
  } else {
    selected = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].hair;
  }

  // Ensure we have a [light, mid, dark] array
  const light = Array.isArray(selected) ? selected[0] : selected;
  const mid   = Array.isArray(selected) ? (selected[1] ?? selected[0]) : selected;
  const dark  = Array.isArray(selected) ? (selected[2] ?? selected[1] ?? selected[0]) : selected;

  const DEFAULT_LIGHT = '#ad926e';
  const DEFAULT_MID   = '#867155';
  const DEFAULT_DARK  = '#6e5c46';

  const TOL = 8;
  const MIN_A = 1;

  replaceColor(imageData, DEFAULT_LIGHT, light, TOL, MIN_A);
  replaceColor(imageData, DEFAULT_MID,   mid,   TOL, MIN_A);
  replaceColor(imageData, DEFAULT_DARK,  dark,  TOL, MIN_A);
}

function applyTattooColor(imageData) {
  let color;
  if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
    color =
      raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].tattoo;
  } else {
    color = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].tattoo;
  }

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
    
    // Base layer (index 0): apply HSL skin filter (saturation/lightness)
    if (i === 0) {
      const node = getCurrentNode();
      const skinIdx = node?.presets?.features?.skin ?? DEFAULT_SKIN_INDEX;
      // Only apply when the current entry is non-null (null = no change)
      if (SKIN_FILTERS[skinIdx]) {
        const id = octx.getImageData(0, 0, off.width, off.height);
        applySkinFilter(id.data, skinIdx);
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
      octx.putImageData(id, 0, 0);
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
    const features = all.filter((f) => f !== 'underwear'); // hide underwear from UI
    const values = {};
    const counts = {};
    const labels = {};
    const ID_RE = /\+id(\d+)/i;

    for (const f of features) {
      const v = node.presets.features[f] ?? 0;
      values[f] = v;

      if (f === 'skin') {
        const max = SKIN_FILTERS.length;
        counts[f] = max; // number of options equals the array length
        const cur = node.presets.features[f] ?? DEFAULT_SKIN_INDEX;
        labels[f] = String(cur + 1); // 1-based label, so default shows (DEFAULT_SKIN_INDEX+1)
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

    featureSubscribers.forEach((fn) => fn({ features, values, counts, labels }));
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
    const skinIdx = node?.presets?.features?.skin ?? DEFAULT_SKIN_INDEX;
    if (el) el.innerHTML = String(skinIdx + 1);
  }


  // Populate swatch UIs based on current presets (no randomization)
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

// Generate Selected Character with current presets (base + feature slots)
function genCharPresets(raceGenderTemplate) {
  let genChar = [];
  const node = getCurrentNode();
  const base = raceGenderTemplate?.[0]?.[0] ?? null;
  if (!base || !node) return;

  genChar.push(base); // base/skin always first

  // Add each feature layer in the node's order
  const { features, order } = node.presets;
  for (const [slot, selIndex] of Object.entries(features)) {
    if (slot === 'skin') continue;
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
}

// Select character features (increase/decrease per discovered slot).
function selectFeaturePresets(feature, scale) {
  const node = getCurrentNode();
  if (!node) return;

  let max;
  if (feature === 'skin') {
    max = SKIN_FILTERS.length;
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
  genCharPresets(node.template);
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
    let hairColorName = Object.keys(hairColors)[i];
    if (hairColors[hairColorName][0] === raceGenderColorPresets.hair[0]) {
      hairColorIndex = i;
    }
  }

  for (let i = 0; i < Object.keys(tattooColors).length; i++) {
    let tattooColorName = Object.keys(tattooColors)[i];
    if (tattooColors[tattooColorName] === raceGenderColorPresets.tattoo) {
      tattooColorIndex = i;
    }
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
  let selectedHairColor = hairColors[color];

  if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
    raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].hair =
      selectedHairColor;
  } else {
    raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].hair = selectedHairColor;
  }

  hairColorIndex = Object.keys(hairColors).indexOf(color);
  genCharPresets(raceGenderTemplate);
  notifyFeatures();
}

// select tattoo color
function selectTattooColor(color) {
  let selectedTattooColor = tattooColors[color];

  if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
    raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].tattoo =
      selectedTattooColor;
  } else {
    raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].tattoo = selectedTattooColor;
  }

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

// Let React subscribe to live feature list / values
export const onSubscribeFeatures = (cb) => {
  if (typeof window === 'undefined') return () => {};
  featureSubscribers.add(cb);
  try {
    notifyFeatures();
  } catch {}
  return () => featureSubscribers.delete(cb);
};