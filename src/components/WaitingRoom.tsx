import { useState } from "react";
import type { Room } from "../types";
import { deleteRoom, startGame } from "../lib/room";
import { avatarGradient } from "../lib/ui";

interface Props {
  room: Room;
  playerId: string;
  onLeave: () => void;
}

export default function WaitingRoom({ room, playerId, onLeave }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボード非対応環境では何もしない
    }
  };

  return (
    <div className="animate-fade-up space-y-6 pt-6">
      <header className="text-center">
        <p className="text-sm text-slate-400">ルームコード</p>
        <button
          className="panel mx-auto mt-2 block rounded-2xl px-8 py-4 transition active:scale-[0.97]"
          onClick={handleCopy}
        >
          <span className="text-gold tnum text-4xl font-black tracking-[0.3em]">
            {room.code}
          </span>
          <span className="mt-1 block text-xs text-slate-400">
            {copied ? "コピーしました ✓" : "タップしてコピー"}
          </span>
        </button>
        <p className="mt-3 text-sm text-slate-400">
          このコードを友人に共有して参加してもらってください
        </p>
      </header>

      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-bold">
          参加者
          <span className="ml-2 rounded-full bg-emerald-900/70 px-2 py-0.5 text-xs text-emerald-300">
            {room.playerOrder.length}人
          </span>
        </h2>
        <ul className="space-y-2">
          {room.playerOrder.map((id) => (
            <li
              key={id}
              className="animate-fade-up flex items-center gap-3 rounded-xl bg-slate-950/40 px-3 py-2"
            >
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-black shadow"
                style={{ background: avatarGradient(id) }}
              >
                {room.players[id]?.name?.charAt(0) ?? "?"}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {room.players[id]?.name}
              </span>
              {id === room.hostId && (
                <span className="rounded-full bg-amber-900/60 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  ホスト
                </span>
              )}
              {id === playerId && (
                <span className="rounded-full bg-sky-900/60 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                  あなた
                </span>
              )}
              <span className="tnum text-slate-400">
                {room.players[id]?.chips}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel flex justify-around rounded-2xl p-4 text-center text-sm">
        <div>
          <p className="text-xs text-slate-400">初期チップ</p>
          <p className="tnum mt-0.5 font-bold">{room.settings.initialChips}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">SB / BB</p>
          <p className="tnum mt-0.5 font-bold">
            {room.settings.smallBlind} / {room.settings.bigBlind}
          </p>
        </div>
      </div>

      {isHost ? (
        <div className="space-y-3">
          <button
            className="w-full rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 py-4 text-lg font-black shadow-lg shadow-emerald-900/50 transition active:scale-[0.98] disabled:opacity-50"
            disabled={busy || room.playerOrder.length < 2}
            onClick={handleStart}
          >
            {room.playerOrder.length < 2
              ? "2人以上でゲーム開始できます"
              : "🎲 ゲーム開始"}
          </button>
          <button
            className="w-full rounded-xl border border-red-500/30 py-2.5 text-sm text-red-400 transition active:scale-[0.98]"
            onClick={handleDisband}
          >
            ルームを解散
          </button>
        </div>
      ) : (
        <p className="animate-bounce-soft text-center text-slate-400">
          ホストの開始を待っています...
        </p>
      )}

      <button className="w-full py-2 text-sm text-slate-500" onClick={onLeave}>
        退出する(データは残ります)
      </button>

      {error && (
        <p className="animate-fade-up rounded-xl border border-red-500/30 bg-red-950/60 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
