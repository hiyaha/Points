import { useState } from "react";
import {
  isBgmEnabled,
  isSeEnabled,
  setBgmEnabled,
  setSeEnabled,
  unlock,
} from "../lib/sound";

export default function SoundToggles() {
  const [bgmOn, setBgmOn] = useState(isBgmEnabled());
  const [seOn, setSeOn] = useState(isSeEnabled());

  return (
    <div className="fixed right-3 top-3 z-50 flex gap-1.5">
      <button
        aria-label={`BGM ${bgmOn ? "オフにする" : "オンにする"}`}
        className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm backdrop-blur-md transition active:scale-90 ${
          bgmOn
            ? "border-amber-500/30 bg-amber-900/50 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
            : "border-stone-700/50 bg-stone-900/60 opacity-50 grayscale"
        }`}
        onClick={() => {
          unlock();
          const next = !bgmOn;
          setBgmEnabled(next);
          setBgmOn(next);
        }}
      >
        🎵
      </button>
      <button
        aria-label={`効果音 ${seOn ? "オフにする" : "オンにする"}`}
        className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm backdrop-blur-md transition active:scale-90 ${
          seOn
            ? "border-amber-500/30 bg-amber-900/50 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
            : "border-stone-700/50 bg-stone-900/60 opacity-50 grayscale"
        }`}
        onClick={() => {
          unlock();
          const next = !seOn;
          setSeEnabled(next);
          setSeOn(next);
        }}
      >
        {seOn ? "🔊" : "🔇"}
      </button>
    </div>
  );
}
