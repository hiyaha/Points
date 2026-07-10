import { useState } from "react";
import type { Room } from "../types";
import { sendRebuy } from "../lib/room";
import { avatarGradient } from "../lib/ui";

interface Props {
  room: Room;
  playerId: string;
  onLeave: () => void;
  onError: (msg: string | null) => void;
}

export default function GameOverPanel({
  room,
  playerId,
  onLeave,
  onError,
}: Props) {
  const isHost = room.hostId === playerId;
  const [busy, setBusy] = useState(false);

  const ranking = [...room.playerOrder].sort(
    (a, b) => (room.players[b]?.chips ?? 0) - (room.players[a]?.chips ?? 0),
  );
  const winnerId = ranking[0];
  const winner = room.players[winnerId];

  const busted = room.playerOrder.filter(
    (id) => (room.players[id]?.chips ?? 0) === 0,
  );

  const handleRebuy = async (id: string) => {
    setBusy(true);
    onError(null);
    const err = await sendRebuy(room.code, playerId, id);
    setBusy(false);
    if (err) onError(err);
  };

  return (
    <div className="panel animate-fade-up space-y-5 rounded-2xl p-5">
      <div className="text-center">
        <p className="text-4xl">👑</p>
        <h2 className="mt-2 text-2xl font-black text-amber-400">
          ゲーム終了!
        </h2>
        <p className="mt-1 text-sm text-stone-400">
          全てのチップが1人に集まりました
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-950/60 to-transparent py-5">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black shadow-xl ring-2 ring-amber-400/50"
          style={{ background: avatarGradient(winnerId) }}
        >
          {winner?.name?.charAt(0)}
        </span>
        <p className="text-xl font-black text-stone-100">{winner?.name}</p>
        <p className="text-gold tnum text-2xl font-black">{winner?.chips}</p>
        <p className="text-xs text-stone-400">チップ獲得</p>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-bold text-stone-300">最終順位</p>
        {ranking.map((id, i) => {
          const p = room.players[id];
          if (!p) return null;
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
          return (
            <div
              key={id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                i === 0
                  ? "border border-amber-500/20 bg-amber-950/40"
                  : "bg-stone-950/40"
              }`}
            >
              <span className="w-6 text-center text-sm">
                {medal || `${i + 1}.`}
              </span>
              <span
                className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold"
                style={{ background: avatarGradient(id) }}
              >
                {p.name.charAt(0)}
              </span>
              <span className="flex-1 truncate font-medium text-stone-200">
                {p.name}
              </span>
              <span className="tnum text-sm text-stone-400">{p.chips}</span>
            </div>
          );
        })}
      </div>

      {isHost && busted.length > 0 && (
        <div className="space-y-2 rounded-2xl bg-stone-950/50 p-3">
          <p className="text-sm text-stone-300">
            チップを追加して続けることもできます:
          </p>
          {busted.map((id) => (
            <div key={id} className="flex items-center justify-between py-1">
              <span className="text-stone-200">{room.players[id]?.name}</span>
              <button
                className="tnum rounded-xl border border-white/10 bg-stone-800 px-3 py-1.5 text-sm font-bold text-stone-200 transition active:scale-95 disabled:opacity-50"
                disabled={busy}
                onClick={() => handleRebuy(id)}
              >
                +{room.settings.initialChips} 追加
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        className="w-full rounded-xl border border-white/10 py-3 text-sm text-stone-400 transition active:scale-[0.98]"
        onClick={onLeave}
      >
        ロビーに戻る
      </button>
    </div>
  );
}
