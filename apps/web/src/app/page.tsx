'use client';
import React from "react";
import {
  onRandom, onFeatureChange,
  onSelectGender, onSelectRacePrimary, onSelectRace,
  onSubscribeFeatures, onRandomizeFeatures,
  onSelectClass, onInitClassUI,
  getImmutableTraitsSnapshot,
  setHideEquipment, getHideEquipment, applyClassArmorAndRedraw,
} from "./app-logic/charGen";
import { isExcludedFeatureBase } from './app-logic/char-gen/constants';
import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft, faDice } from '@fortawesome/free-solid-svg-icons';
import MintButton from "../components/MintButton";
import PreviewButton from "../components/PreviewButton";

import type { ImmutableTraits } from "@/lib/metadata";

// Types
type Dir = 'increase' | 'decrease';

// Reusable selector using DaisyUI buttons
interface FeatureSelectorProps {
  category: string;
  onChange: (category: string, dir: Dir) => void;
  valueText?: string;
}
const FeatureSelector: React.FC<FeatureSelectorProps> = ({ category, onChange, valueText }) => {
  const id = `${category}Value`;
  const friendly = (() => {
    if (category === 'hairColor') return 'Hair Color';
    if (category === 'tattooColor') return 'Tattoo Color';
    if (category === 'facialhair') return 'Facial Hair';
    return category
      .split(/(?=[A-Z])|_/g)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  })();
  return (
    <>
      <p className="m-0 text-lg font-bold capitalize mb-2">{friendly}</p>

      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          className="btn btn-sm text-lg"
          onClick={() => onChange(category, 'decrease')}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <p id={id} className="m-0 flex-1 text-primary capitalize text-center text-[1.5rem] leading-tight">
          {valueText ?? ""}
        </p>

        <button
          type="button"
          className="btn btn-sm text-lg"
          onClick={() => onChange(category, 'increase')}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </>
  );
};

export default function Home() {
  const [canvasDebug, setCanvasDebug] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // dynamic feature slots discovered from filenames (hair, tool, etc.)
  const [features, setFeatures] = useState<string[]>([]);
  const [featureValues, setFeatureValues] = useState<Record<string, number>>({});
  const [featureCounts, setFeatureCounts] = useState<Record<string, number>>({});
  const [featureLabels, setFeatureLabels] = useState<Record<string, string>>({});
  const [uiOrder, setUiOrder] = useState<string[]>([]);

  // Global equipment visibility toggle (does not change draw yet; logs only)
  const [hideEquipment, setHideEquipmentState] = useState<boolean>(false);

  const isRenderBlank = useCallback(() => {
    if (typeof document === 'undefined') return false; // SSR guard

    // Prefer the exported <img> inside #charGen
    const img = document.querySelector('#charGen img') as HTMLImageElement | null;
    if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      return false;
    }

    // Fallback: inspect the hidden canvas for any non-transparent pixel
    const c = document.getElementById('canvas') as HTMLCanvasElement | null;
    if (c) {
      const ctx2d = c.getContext('2d', { willReadFrequently: true });
      if (ctx2d) {
        try {
          const w = c.width, h = c.height;
          if (w && h) {
            const id = ctx2d.getImageData(0, 0, w, h);
            const d = id.data;
            for (let i = 3; i < d.length; i += 4) {
              if (d[i] !== 0) return false; // found some drawn pixel
            }
          }
        } catch (_) {}
      }
    }
    return true; // nothing visible yet
  }, []);

  const checkAndReportRender = useCallback((label: string) => {
    setTimeout(() => {
      const blank = isRenderBlank();
      if (blank) {
        setCanvasDebug(`No image rendered in #charGen after "${label}". Ensure assets exist under /public/assets and charGen.js ran.`);
        setLoading(true);
      } else {
        setCanvasDebug('');
        setLoading(false);
      }
    }, 120);
  }, [isRenderBlank]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // nudge any UI init that might be lazy
      try { onInitClassUI?.(); } catch {}
      // Try to kick a first render if nothing has drawn yet
      let triedRandom = false;
      for (let attempt = 0; attempt < 25 && !cancelled; attempt++) {
        const blank = isRenderBlank();
        if (!blank) { setCanvasDebug(''); setLoading(false); return; }
        if (!triedRandom) {
          try { await (onRandom?.()); } catch {}
          triedRandom = true;
        }
        await new Promise(r => setTimeout(r, 200)); // wait and re-check
      }
      if (!cancelled) {
        // Give a clear hint and stop the spinner so it doesn't look stuck
        setCanvasDebug('No image rendered. Check /api/sprites, asset paths under /public/assets, and that charGen initialized.');
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isRenderBlank]);

  useEffect(() => {
    onInitClassUI?.();
  }, []);

  // Subscribe to dynamic feature slots
  useEffect(() => {
    const unsub = onSubscribeFeatures?.((state: {features:string[], uiOrder?:string[], values:Record<string,number>, counts:Record<string,number>, labels?:Record<string,string>}) => {
      setFeatures(state.features);
      setUiOrder(Array.isArray(state.uiOrder) ? state.uiOrder : state.features);
      setFeatureValues(state.values);
      setFeatureCounts(state.counts);
      setFeatureLabels(state.labels || {});
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  const [immutableTraits, setImmutableTraits] = useState<ImmutableTraits | null>(null);

  const refreshImmutableTraits = useCallback(() => {
    try {
      const snap = getImmutableTraitsSnapshot?.();
      if (snap) setImmutableTraits(snap);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[page] failed to snapshot traits", e);
    }
  }, []);

  // Local wrappers to call imported actions and then validate canvas output
  const handleRandom = useCallback(async () => {
    setLoading(true);
    await onRandom();
    checkAndReportRender('Random');
    refreshImmutableTraits();
  }, [checkAndReportRender, refreshImmutableTraits]);

  const handleFeatureChange = useCallback((category: string, dir: Dir) => {
    onFeatureChange(category, dir);
    checkAndReportRender(`Change ${category} ${dir}`);
    refreshImmutableTraits();
  }, [checkAndReportRender, refreshImmutableTraits]);

  const handleSelectGender = useCallback((g: 'male' | 'female') => {
    // If Hide equipment is ON, turn it off when switching gender
    try {
      if (typeof getHideEquipment === 'function' && getHideEquipment()) {
        setHideEquipment(false);
        setHideEquipmentState(false);
        try { applyClassArmorAndRedraw(); } catch {}
      }
    } catch {}

    onSelectGender(g);
    checkAndReportRender(`Select gender ${g}`);
    refreshImmutableTraits();
  }, [checkAndReportRender, refreshImmutableTraits]);

  const handleSelectRacePrimary = useCallback((dir: Dir) => {
    // If Hide equipment is ON, turn it off when switching primary race
    try {
      if (typeof getHideEquipment === 'function' && getHideEquipment()) {
        setHideEquipment(false);
        setHideEquipmentState(false);
        try { applyClassArmorAndRedraw(); } catch {}
      }
    } catch {}

    onSelectRacePrimary(dir);
    checkAndReportRender(`Race primary ${dir}`);
    refreshImmutableTraits();
  }, [checkAndReportRender, refreshImmutableTraits]);

  const handleSelectRace = useCallback((dir: Dir) => {
    // If Hide equipment is ON, turn it off when switching subrace/domain
    try {
      if (typeof getHideEquipment === 'function' && getHideEquipment()) {
        setHideEquipment(false);
        setHideEquipmentState(false);
        try { applyClassArmorAndRedraw(); } catch {}
      }
    } catch {}

    onSelectRace(dir);
    checkAndReportRender(`Race ${dir}`);
    refreshImmutableTraits();
  }, [checkAndReportRender, refreshImmutableTraits]);

  const handleSelectClass = useCallback((dir: Dir) => {
    // If Hide equipment is ON, turn it off when switching class
    try {
      if (typeof getHideEquipment === 'function' && getHideEquipment()) {
        setHideEquipment(false);
        setHideEquipmentState(false);
        // Class selection will re-apply armor internally, but force a redraw just in case
        try { applyClassArmorAndRedraw(); } catch {}
      }
    } catch {}

    onSelectClass(dir);
    // keep the canvas debug accurate after class swap
    try { checkAndReportRender(`Select class ${dir}`); } catch {}
    refreshImmutableTraits();
  }, [checkAndReportRender, refreshImmutableTraits]);

  const handleRandomizeFeatures = useCallback(async () => {
    setLoading(true);
    await onRandomizeFeatures();
    checkAndReportRender('Randomize features');
    refreshImmutableTraits();
  }, [checkAndReportRender, refreshImmutableTraits]);

  // Title-case helper for names like "derp" => "Derp", "john doe" => "John Doe"
  const toTitleCase = (s: string) =>
    (s || '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
      .join(' ');

  const handleNameBlur = useCallback(() => {
    const el = (typeof document !== 'undefined')
      ? (document.getElementById('charName') as HTMLInputElement | null)
      : null;
    if (!el) return;
    const formatted = toTitleCase(el.value || '');
    if (formatted !== el.value) el.value = formatted;
    refreshImmutableTraits();
  }, [refreshImmutableTraits]);

  useEffect(() => {
    refreshImmutableTraits();
  }, [refreshImmutableTraits]);

  // Sync hideEquipment checkbox when changed from outside
  useEffect(() => {
    function onHideChanged(e: any) {
      const v = e?.detail?.value;
      if (typeof v === 'boolean') {
        setHideEquipmentState(v);
      } else {
        try { setHideEquipmentState(!!getHideEquipment()); } catch {}
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('nral:hide-eq-changed', onHideChanged);
      return () => document.removeEventListener('nral:hide-eq-changed', onHideChanged);
    }
  }, []);

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <header className="flex items-start justify-between gap-6 pt-8 pb-4 mb-4 md:pt-12 md:pb-6 md:mb-6 border-b border-base-300">
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight">The Trials of Nral</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-sm"
              onClick={async () => {
                const img = document.querySelector<HTMLImageElement>('#charGen img');
                if (!img || !img.complete || img.naturalWidth === 0) {
                  alert('No image yet');
                  return;
                }
                // Mirror <img> into an offscreen canvas (natural size)
                const c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                const ctx = c.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, 0, 0);

                const id = ctx.getImageData(0, 0, c.width, c.height);
                const d = id.data;
                const counts = new Map<number, number>();
                for (let i = 0; i < d.length; i += 4) {
                  if (d[i + 3] === 0) continue; // skip fully transparent
                  const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
                  counts.set(key, (counts.get(key) || 0) + 1);
                }
                const toHex = (k: number) => '#' + k.toString(16).padStart(6, '0');
                const rows = Array.from(counts.entries())
                  .map(([k, v]) => ({ hex: toHex(k), count: v }))
                  .sort((a, b) => b.count - a.count);

                // eslint-disable-next-line no-console
                console.table(rows);
              }}
              aria-label="Dump Hex Palette"
              title="Dump Hex Palette"
            >
              <span className="hidden sm:inline">Hexes</span>
            </button>
            
            <PreviewButton traits={immutableTraits} />
            <MintButton traits={immutableTraits} />
          </div>
        </header>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left column */}
          <div className="col-span-12 md:col-span-3">
            {/* Random Character (moved here) */}
            <div className="mb-6">
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleRandom}
                aria-label="Random Character"
                title="Random Character"
              >
                <FontAwesomeIcon icon={faDice} className="me-2" />
                <span className="hidden sm:inline">Random Character</span>
              </button>
            </div>
            {/* Gender Toggle (DaisyUI button radios) */}
            <div className="join w-full mb-6">
              <input
                type="radio"
                name="genderRadio"
                id="genderRadio1"
                autoComplete="off"
                aria-label="Male"
                className="join-item btn"
                onClick={() => handleSelectGender("male")}
              />
              <input
                type="radio"
                name="genderRadio"
                id="genderRadio2"
                autoComplete="off"
                aria-label="Female"
                className="join-item btn"
                onClick={() => handleSelectGender("female")}
              />
            </div>

            <div className="mb-6">
              <p className="font-bold mb-2">Name</p>
              <div className="flex gap-2">
                <input
                  id="charName"
                  type="text"
                  className="input flex-1 text-[1.5rem] leading-tight"
                  onBlur={handleNameBlur}
                />
                <button
                  type="button"
                  className="btn text-lg"
                  onClick={() => {
                    const names = ['Aren', 'Belira', 'Cador', 'Darin', 'Elandra', 'Faren', 'Garin', 'Helira', 'Isen', 'Jora', 'Kael', 'Lirien', 'Maren', 'Naris', 'Orin', 'Pelyn', 'Quara', 'Rhen', 'Sorin', 'Talia'];
                    const randomName = names[Math.floor(Math.random() * names.length)];
                    const nameInput = document.getElementById('charName');
                    if (nameInput && 'value' in nameInput) (nameInput as HTMLInputElement).value = randomName;
                    refreshImmutableTraits();
                  }}
                >
                  Random
                </button>
              </div>
            </div>

            {/* Select Race */}
            <p className="mb-2 text-base font-bold">Race</p>
          
            <div className="mb-6">
              {/* Primary race selector */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm text-lg"
                  onClick={() => handleSelectRacePrimary("decrease")}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                <div id="selectedRacePrimary" className="flex-1 text-primary capitalize text-center text-[1.5rem] leading-tight" />

                <button
                  type="button"
                  className="btn btn-sm text-lg"
                  onClick={() => handleSelectRacePrimary("increase")}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>

              {/* Sub-race / domain selector */}
              <div id="selectedRaceDom" className="mt-3 flex items-center gap-2 hidden">
                <button
                  type="button"
                  className="btn btn-sm text-lg"
                  onClick={() => handleSelectRace("decrease")}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                <div id="selectedRace" className="flex-1 text-primary capitalize text-center text-[1.5rem] leading-tight" />

                <button
                  type="button"
                  className="btn btn-sm text-lg"
                  onClick={() => handleSelectRace("increase")}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>

            {/* Class select */}
            <p className="mb-2 text-base font-bold">Class</p>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm text-lg"
                  onClick={() => handleSelectClass("decrease")}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                <div id="selectedClass" className="flex-1 text-primary capitalize text-center text-[1.5rem] leading-tight" />

                <button
                  type="button"
                  className="btn btn-sm text-lg"
                  onClick={() => handleSelectClass("increase")}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>
          </div>

          {/* Middle column */}
          <div className="col-span-12 md:col-span-6">
            
            <canvas id="canvas" width={360} height={600} className="hidden" />
            <div id="drawAmount" className="text-sm text-base-content/70" />
            {loading && (
              <div className="flex flex-col items-center py-8 text-base-content/70" aria-live="polite" aria-busy="true">
                <span className="loading loading-spinner loading-md mb-2"></span>
                <span>Generating random character...</span>
              </div>
            )}
            <div id="charGen" className={`flex justify-center ${loading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} />
            {canvasDebug && (
              <p className="mt-2 text-sm text-error">{canvasDebug}</p>
            )}
          </div>

          {/* Right column */}
          <div className="col-span-12 md:col-span-3">
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleRandomizeFeatures}
                aria-label="Randomize Features"
                title="Randomize Features"
              >
                <FontAwesomeIcon icon={faDice} />
              </button>

              {/* Hide equipment toggle (logs only for now) */}
              <label className="label cursor-pointer flex items-center gap-2 m-0 ms-auto">
                <input
                  type="checkbox"
                  className="toggle toggle-sm"
                  checked={hideEquipment}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setHideEquipmentState(next);
                    try { setHideEquipment(next); } catch {}
                    // Trigger a redraw path so `applyClassArmorAndRedraw()` logs the value.
                    try { applyClassArmorAndRedraw(); } catch {}
                  }}
                />
                <span className="label-text text-sm">Hide equipment</span>
              </label>
            </div>

            {(uiOrder.length ? uiOrder : features).map((key) => {
              if (key === 'hairColor') {
                return (
                  <div key="hairColor-block" className="mb-6">
                    <p className="m-0 text-base font-bold mb-2">Hair Color</p>
                    <div id="hairColorSwatches" />
                  </div>
                );
              }
              if (key === 'tattooColor') {
                return (
                  <div key="tattooColor-block" className="mb-6">
                    <p className="m-0 text-base font-bold mb-2">Tattoo Color</p>
                    <div id="tattooColorSwatches" />
                  </div>
                );
              }
              // Hide any excluded feature families (weapon, etc.)
              if (isExcludedFeatureBase(key)) {
                return null;
              }
              // Default: feature selector row
              return (
                <FeatureSelector
                  key={key}
                  category={key}
                  onChange={handleFeatureChange}
                  valueText={featureLabels[key] ?? ((featureValues[key] ?? 0) === 0 ? 'none' : String(featureValues[key]))}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
