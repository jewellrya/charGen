export function hexToRgb(hex) {
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

export function rgbToHsl(r, g, b) {
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

export function hslToRgb(h, s, l) {
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

export function srgbToLinear(v) {
  // v in 0..1
  if (v <= 0.04045) return v / 12.92;
  return Math.pow((v + 0.055) / 1.055, 2.4);
}

/* ---- sRGB ↔ OKLab helpers (Björn Ottosson) ---- */
export function srgbToOklab(r8, g8, b8) {
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

export function replaceColor(data, colorFind, colorReplace, tolerance = 0, minAlpha = 0) {
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
export function applySkinFilterPaletteSafe(data, filter) {
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

export function applySkinFilter(data, variantIndex, filters, opts = {}) {
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
export function applySkinFilterModernOKLab(data, filter) {
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

export function applyArmorFilterPixelOKLab(r, g, b, spec) {
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

  // Increase saturation influence and remove caps
  const sScale = (rawS === 0) ? 1 : (1 + rawS / 50);
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
  // no chroma caps; rely on gamut fallbacks only

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
