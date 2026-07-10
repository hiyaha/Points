import { useState } from "react";
import type { Room } from "../types";
import { sendDistribute } from "../lib/room";
import { avatarGradient } from "../lib/ui";

interface Props {
  room: Room;
  playerId: string;
  onError: (msg: string | null) => void;
}

export default function ShowdownPanel({ room, playerId, onError }: Props) {
  const hand = room.hand!;
  const pots = hand.pots ?? [];
  const isHost = room.hostId === playerId;
  const [selections, setSelections] = useState<string[][]>(() =>
    pots.map(() => []),
  );
  const [busy, setBusy] = useState(false);

  const toggle = (potIndex: number, id: string) => {
    setSelections((prev) =>
      prev.map((winners, i) =>
        i === potIndex
          ? winners.includes(id)
            ? winners.filter((w) => w !== id)
            : [...winners, id]
          : winners,
      ),
    );
  };

  const allSelected = selections.every((w) => w.length > 0);

  const handleDistribute = async () => {
    setBusy(true);
    onError(null);
    const err = await sendDistribute(room.code, playerId, selections);
    setBusy(false);
    if (err) onError(err);
  };

  if (!isHost) return null;

  return (
    <div className="panel animate-fade-up space-y-4 rounded-2xl p-4">
      <h2 className="font-black">🏁 勝者を選択してください</h2>
      <p className="text-xs text-slate-400">
        引き分け(チョップ)の場合は複数人を選択するとポットが分割されます
      </p>
      {pots.map((pot, i) => (
        <div key={i} className="rounded-2xl bg-slate-950/50 p-3">
          <p className="mb-2.5 text-sm font-black text-emerald-300">
            {pots.length === 1
              ? "ポット"
              : i === 0
                ? "メインポット"
                : `サイドポット${i}`}{" "}
            <span className="text-gold tnum text-base">{pot.amount}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {pot.eligible.map((id) => {
              const selected = selections[i]?.includes(id);
              return (
                <button
                  key={id}
                  className={`flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3.5 text-sm font-bold transition active:scale-95 ${
                    selected
                      ? "bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-950/50"
                      : "bg-slate-800 text-slate-300"
                  }`}
                  onClick={() => toggle(i, id)}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white"
                    style={{ background: avatarGradient(id) }}
                  >
                    {room.players[id]?.name?.charAt(0)}
                  </span>
                  {room.players[id]?.name}
                  {selected && " ✓"}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button
        className="w-full rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 py-4 font-black shadow-lg shadow-emerald-900/50 transition active:scale-[0.98] disabled:opacity-40"
        disabled={busy || !allSelected}
        onClick={handleDistribute}
      >
        💰 ポットを分配する
      </button>
    </div>
  );
}
