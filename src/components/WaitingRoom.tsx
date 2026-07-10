import { useState } from "react";
import type { Room } from "../types";
import { deleteRoom, startGame } from "../lib/room";

interface Props {
  room: Room;
  playerId: string;
  onLeave: () => void;
}

export default function WaitingRoom({ room, playerId, onLeave }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isHost = room.hostId === playerId;

  const handleStart = async () => {
    setBusy(true);
    const err = await startGame(room.code, playerId);
    setBusy(false);
    setError(err);
  };

  const handleDisband = async () => {
    if (!confirm("ルームを解散しますか?")) return;
    await deleteRoom(room.code, playerId);
    onLeave();
  };

  return (
    <div className="space-y-6">
      <header className="text-center">
        <p className="text-sm text-slate-400">ルームコード</p>
        <p className="text-4xl font-bold tracking-[0.3em]">{room.code}</p>
        <p className="mt-2 text-sm text-slate-400">
          このコードを友人に共有して参加してもらってください
        </p>
      </header>

      <div className="rounded-lg bg-slate-800 p-4">
        <h2 className="mb-2 font-bold">
          参加者({room.playerOrder.length}人)
        </h2>
        <ul className="space-y-1">
          {room.playerOrder.map((id) => (
            <li key={id} className="flex justify-between">
              <span>
                {room.players[id]?.name}
                {id === room.hostId && (
                  <span className="ml-2 text-xs text-amber-400">ホスト</span>
                )}
                {id === playerId && (
                  <span className="ml-2 text-xs text-sky-400">あなた</span>
                )}
              </span>
              <span className="text-slate-400">{room.players[id]?.chips}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg bg-slate-800 p-4 text-sm text-slate-300">
        <p>初期チップ: {room.settings.initialChips}</p>
        <p>
          ブラインド: SB {room.settings.smallBlind} / BB {room.settings.bigBlind}
        </p>
      </div>

      {isHost ? (
        <div className="space-y-3">
          <button
            className="w-full rounded-lg bg-emerald-600 py-3 font-bold disabled:opacity-50"
            disabled={busy || room.playerOrder.length < 2}
            onClick={handleStart}
          >
            {room.playerOrder.length < 2
              ? "2人以上でゲーム開始できます"
              : "ゲーム開始"}
          </button>
          <button
            className="w-full rounded-lg border border-red-800 py-2 text-sm text-red-400"
            onClick={handleDisband}
          >
            ルームを解散
          </button>
        </div>
      ) : (
        <p className="text-center text-slate-400">ホストの開始を待っています...</p>
      )}

      <button className="w-full py-2 text-sm text-slate-500" onClick={onLeave}>
        退出する(データは残ります)
      </button>

      {error && (
        <p className="rounded-lg bg-red-900/50 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
    </div>
  );
}
