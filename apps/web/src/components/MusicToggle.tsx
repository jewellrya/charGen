'use client';

import useClickSound from "./useClickSound";
import { useMusic } from "./MusicProvider";

export default function MusicToggle() {
  const playClick = useClickSound();
  const { enabled, toggle } = useMusic();

  return (
    <button
      type="button"
      className={`btn btn-sm btn-game ${enabled ? "primary" : "secondary"}`}
      onClick={() => {
        playClick();
        toggle();
      }}
    >
      {enabled ? "🔊 Music On" : "🔈 Music Off"}
    </button>
  );
}
