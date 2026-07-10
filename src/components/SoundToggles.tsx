import { useState } from "react";
import {
  isBgmEnabled,
  isSeEnabled,
  setBgmEnabled,
  setSeEnabled,
  unlock,
} from "../lib/sound";

/** 画面右上に常駐する BGM / 効果音の ON/OFF スイッチ */
export default function SoundToggles() {
  const [bgmOn, setBgmOn] = useState(isBgmEnabled());
  const [seOn, setSeOn] = useState(isSeEnabled());

  return (
    <div className="fixed right-3 top-3 z-50 flex gap-2">
      <button
        aria-label={`BGM ${bgmOn ? "オフにする" : "オンにする"}`}
        className={`flex h-9 w-9 items-center justify-center rounded-full border text-base backdrop-blur transition ${
          bgmOn
            ? "border-emerald-500/50 bg-emerald-900/60"
            : "border-slate-600/50 bg-slate-900/60 opacity-50 grayscale"
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
        className={`flex h-9 w-9 items-center justify-center rounded-full border text-base backdrop-blur transition ${
          seOn
            ? "border-emerald-500/50 bg-emerald-900/60"
            : "border-slate-600/50 bg-slate-900/60 opacity-50 grayscale"
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
