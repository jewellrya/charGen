'use client';
import React from "react";
import { onRandom, onPermute, onFeatureChange, onSelectGender, onSelectRacePrimary, onSelectRace } from "./app-logic/charGen";
import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';

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
  return (
    <>
      <p className="m-0 text-base font-bold capitalize mb-2">{category}</p>

      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => onChange(category, 'decrease')}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <p id={id} className="m-0 flex-1 text-primary capitalize text-center">
          {valueText ?? ""}
        </p>

        <button
          type="button"
          className="btn btn-sm"
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

  const isRenderBlank = useCallback(() => {
    if (typeof document === 'undefined') return false; // can't check on SSR

    // Only check the exported IMG inside #charGen (what users actually see)
    const img = document.querySelector('#charGen img') as HTMLImageElement | null;
    if (!img) return true; // nothing injected yet
    if (!img.complete) return true; // not loaded yet
    if (img.naturalWidth === 0 || img.naturalHeight === 0) return true; // failed load
    return false; // visible render present
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
    setLoading(true);
    onRandom();
    checkAndReportRender('initial random');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local wrappers to call imported actions and then validate canvas output
  const handleRandom = useCallback(() => {
    setLoading(true);
    onRandom();
    checkAndReportRender('Random');
  }, [checkAndReportRender]);

  const handlePermute = useCallback(() => {
    onPermute();
    checkAndReportRender('Permute');
  }, [checkAndReportRender]);

  const handleFeatureChange = useCallback((category: string, dir: Dir) => {
    onFeatureChange(category, dir);
    checkAndReportRender(`Change ${category} ${dir}`);
  }, [checkAndReportRender]);

  const handleSelectGender = useCallback((g: 'male' | 'female') => {
    onSelectGender(g);
    checkAndReportRender(`Select gender ${g}`);
  }, [checkAndReportRender]);

  const handleSelectRacePrimary = useCallback((dir: Dir) => {
    onSelectRacePrimary(dir);
    checkAndReportRender(`Race primary ${dir}`);
  }, [checkAndReportRender]);

  const handleSelectRace = useCallback((dir: Dir) => {
    onSelectRace(dir);
    checkAndReportRender(`Race ${dir}`);
  }, [checkAndReportRender]);

  return (
    <>
      <div className="max-w-6xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-8 pb-6 border-b border-base-300">
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleRandom}
            aria-label="Random Character"
            title="Random Character"
          >
            <span className="hidden sm:inline">Random</span>
          </button>

          <button
            type="button"
            className="btn btn-sm ms-auto"
            onClick={handlePermute}
            aria-label="Permute"
            title="Permute"
          >
            <span className="hidden sm:inline">Permute</span>
          </button>

          <button
            className="btn btn-sm"
            onClick={async () => {
              const img = document.querySelector<HTMLImageElement>('#charGen img');
              if (!img) return alert('No image yet');
              const dataURL = img.src;
              const res = await fetch('/api/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataURL, name: 'nral-test.png' })
              });
              const json = await res.json();
              console.log(json);
              if (!res.ok) return alert(`Pin failed: ${json.error || res.status}`);
              window.open(json.url, '_blank');
            }}
          >
            <span className="hidden sm:inline">Pin Test</span>
          </button>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left column */}
          <div className="col-span-12 md:col-span-3">
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
                  className="input flex-1"
                />
                <button
                  type="button"
                  className="btn "
                  onClick={() => {
                    const names = ['Aren', 'Belira', 'Cador', 'Darin', 'Elandra', 'Faren', 'Garin', 'Helira', 'Isen', 'Jora', 'Kael', 'Lirien', 'Maren', 'Naris', 'Orin', 'Pelyn', 'Quara', 'Rhen', 'Sorin', 'Talia'];
                    const randomName = names[Math.floor(Math.random() * names.length)];
                    const nameInput = document.getElementById('charName');
                    if (nameInput && 'value' in nameInput) nameInput.value = randomName;
                  }}
                >
                  Random
                </button>
              </div>
            </div>

            {/* Select Race */}
            <p className="mb-2 text-base font-bold">Race</p>
          
            <div className="mb-4">
              {/* Primary race selector */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => handleSelectRacePrimary("decrease")}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                <div id="selectedRacePrimary" className="flex-1 text-primary capitalize text-center" />

                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => handleSelectRacePrimary("increase")}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>

              {/* Sub-race / domain selector */}
              <div id="selectedRaceDom" className="mt-3 flex items-center gap-2 hidden">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => handleSelectRace("decrease")}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                <div id="selectedRace" className="flex-1 text-primary capitalize text-center" />

                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => handleSelectRace("increase")}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p id="selectedRacePrimaryLore" className="m-0 text-sm text-base-content/60" />
            </div>

            <div className="mb-4">
              <p id="selectedRaceLore" className="m-0 text-sm text-base-content/60" />
            </div>
          </div>

          {/* Middle column */}
          <div className="col-span-12 md:col-span-6">
            
            <canvas id="canvas" width={360} height={600} className="hidden" />
            <div id="drawAmount" className="mb-2 text-sm text-base-content/70" />
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
            <FeatureSelector category="skin" onChange={handleFeatureChange} />
            <FeatureSelector category="hair" onChange={handleFeatureChange} />
            <FeatureSelector category="beard" onChange={handleFeatureChange} />

            <div className="mb-6">
              <p className="font-bold mb-2">Hair Color</p>
              <div
                id="hairColorSwatches"
                className="mt-2 mb-4 flex flex-wrap gap-2"
                role="group"
                aria-label="Hair color"
              />
            </div>

            <FeatureSelector category="adornment" onChange={handleFeatureChange} />
            <FeatureSelector category="tattoo" onChange={handleFeatureChange} />

            <div className="mb-6">
              <p className="font-bold mb-2">Tattoo Color</p>
              <div
                id="tattooColorSwatches"
                className="mt-2 mb-4 flex flex-wrap gap-2"
                role="group"
                aria-label="Tattoo color"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}