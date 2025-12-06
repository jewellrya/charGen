'use client';

import { createContext, useContext, useEffect, useRef, useState } from "react";

const AUDIO_SRC = "/assets/audio/Forgotten%20Gate.mp3";

type MusicContextValue = {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (v: boolean) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (enabled) {
      audio.play().catch(() => setEnabled(false));
    } else {
      audio.pause();
    }
  }, [enabled]);

  const value: MusicContextValue = {
    enabled,
    toggle: () => setEnabled((v) => !v),
    setEnabled,
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    return {
      enabled: false,
      toggle: () => {},
      setEnabled: () => {},
    };
  }
  return ctx;
}
