import { useState } from "react";
import type { Room } from "../types";
import { sendDistribute } from "../lib/room";

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
    <div className="space-y-4 rounded-lg bg-slate-800 p-4">
      <h2 className="font-bold">勝者を選択してください</h2>
      <p className="text-xs text-slate-400">
        引き分け(チョップ)の場合は複数人を選択するとポットが分割されます
      </p>
      {pots.map((pot, i) => (
        <div key={i} className="rounded-lg bg-slate-900 p-3">
          <p className="mb-2 text-sm font-bold text-emerald-300">
            {pots.length === 1
              ? `ポット ${pot.amount}`
              : i === 0
                ? `メインポット ${pot.amount}`
                : `サイドポット${i} ${pot.amount}`}
          </p>
          <div className="flex flex-wrap gap-2">
            {pot.eligible.map((id) => (
              <button
                key={id}
                className={`rounded-full px-3 py-1 text-sm ${
                  selections[i]?.includes(id)
                    ? "bg-emerald-600 font-bold"
                    : "bg-slate-700 text-slate-300"
                }`}
                onClick={() => toggle(i, id)}
              >
                {room.players[id]?.name}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        className="w-full rounded-lg bg-emerald-600 py-3 font-bold disabled:opacity-50"
        disabled={busy || !allSelected}
        onClick={handleDistribute}
      >
        ポットを分配する
      </button>
    </div>
  );
}
