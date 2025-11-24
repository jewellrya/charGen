import { useEffect, useMemo } from "react";

const CLICK_SRC = "/assets/audio/click.mp3";

export default function useClickSound() {
  const audio = useMemo(() => {
    if (typeof Audio === "undefined") return null;
    const a = new Audio(CLICK_SRC);
    a.preload = "auto";
    return a;
  }, []);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [audio]);

  return () => {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };
}
