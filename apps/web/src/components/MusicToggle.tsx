import React, { useEffect, useRef, useState } from "react";

const AUDIO_SRC = "/assets/audio/Forgotten%20Gate.mp3";

export default function MusicToggle() {
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

  return (
    <button
      type="button"
      className={`btn btn-sm ${enabled ? "btn-primary" : ""}`}
      onClick={() => setEnabled((v) => !v)}
    >
      {enabled ? "🔊 Music On" : "🔈 Music Off"}
    </button>
  );
}
