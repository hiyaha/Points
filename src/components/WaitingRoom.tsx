import { useState } from "react";
import type { Room } from "../types";
import { deleteRoom, sendReorderPlayers, startGame } from "../lib/room";
import { avatarGradient } from "../lib/ui";
import HelpSection from "./HelpSection";

interface Props {
  room: Room;
  playerId: string;
  onLeave: () => void;
}

function previewPositions(order: string[], n: number): Record<string, string> {
  if (n < 2) return {};
  const pos: Record<string, string> = {};
  const dealerIdx = 0;
  if (n === 2) {
    pos[order[0]] = "BTN / SB";
    pos[order[1]] = "BB";
    return pos;
  }
  pos[order[dealerIdx]] = "BTN";
  pos[order[(dealerIdx + 1) % n]] = "SB";
  pos[order[(dealerIdx + 2) % n]] = "BB";

  const middle: string[] = [];
  for (let i = 3; i < n; i++) {
    middle.push(order[(dealerIdx + i) % n]);
  }
  if (middle.length === 1) {
    pos[middle[0]] = "UTG";
  } else if (middle.length === 2) {
    pos[middle[0]] = "UTG";
    pos[middle[1]] = "CO";
  } else if (middle.length === 3) {
    pos[middle[0]] = "UTG";
    pos[middle[1]] = "MP";
    pos[middle[2]] = "CO";
  } else if (middle.length === 4) {
    pos[middle[0]] = "UTG";
    pos[middle[1]] = "UTG+1";
    pos[middle[2]] = "HJ";
    pos[middle[3]] = "CO";
  } else if (middle.length >= 5) {
    pos[middle[0]] = "UTG";
    for (let i = 1; i < middle.length - 2; i++) {
      pos[middle[i]] = `UTG+${i}`;
    }
    pos[middle[middle.length - 2]] = "HJ";
    pos[middle[middle.length - 1]] = "CO";
  }
  return pos;
}

const POS_COLORS: Record<string, string> = {
  BTN: "bg-amber-500 text-slate-950",
  "BTN / SB": "bg-amber-500 text-slate-950",
  SB: "bg-sky-600",
  BB: "bg-indigo-600",
  UTG: "bg-rose-600",
  "UTG+1": "bg-rose-700",
  CO: "bg-purple-600",
  HJ: "bg-purple-700",
  MP: "bg-slate-600",
};

export default function WaitingRoom({ room, playerId, onLeave }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === playerId;
  const order = room.playerOrder;
  const n = order.length;
  const positions = previewPositions(order, n);

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

  const movePlayer = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= n) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    setBusy(true);
    const err = await sendReorderPlayers(room.code, playerId, newOrder);
    setBusy(false);
    if (err) setError(err);
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
        <h2 className="mb-1 font-bold">
          席順
          <span className="ml-2 rounded-full bg-emerald-900/70 px-2 py-0.5 text-xs text-emerald-300">
            {n}人
          </span>
        </h2>
        {isHost && n >= 2 && (
          <p className="mb-3 text-xs text-slate-500">
            実際の着席順に合わせて並べ替えてください(▲▼ボタンで移動)
          </p>
        )}
        {!isHost && n >= 2 && (
          <p className="mb-3 text-xs text-slate-500">
            ホストが席順を設定しています
          </p>
        )}
        <ul className="space-y-2">
          {order.map((id, i) => (
            <li
              key={id}
              className="animate-fade-up flex items-center gap-2 rounded-xl bg-slate-950/40 px-3 py-2"
            >
              <span className="w-5 text-center text-xs font-bold text-slate-500">
                {i + 1}
              </span>
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-black shadow"
                style={{ background: avatarGradient(id) }}
              >
                {room.players[id]?.name?.charAt(0) ?? "?"}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {room.players[id]?.name}
              </span>
              {positions[id] && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${POS_COLORS[positions[id]] ?? "bg-slate-600"}`}
                >
                  {positions[id]}
                </span>
              )}
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
              {isHost && (
                <span className="flex flex-col gap-0.5">
                  <button
                    className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[10px] text-slate-400 transition active:scale-90 disabled:opacity-20"
                    disabled={busy || i === 0}
                    onClick={() => movePlayer(i, -1)}
                  >
                    ▲
                  </button>
                  <button
                    className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[10px] text-slate-400 transition active:scale-90 disabled:opacity-20"
                    disabled={busy || i === n - 1}
                    onClick={() => movePlayer(i, 1)}
                  >
                    ▼
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
        {n >= 2 && (
          <p className="mt-3 rounded-xl bg-slate-950/50 px-3 py-2 text-xs leading-relaxed text-slate-500">
            最初のハンドは席順1番目が BTN(ボタン) になります。以降、毎ハンド時計回りに移動します。プリフロップでは UTG(BBの左隣)から行動します。
          </p>
        )}
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
            disabled={busy || n < 2}
            onClick={handleStart}
          >
            {n < 2 ? "2人以上でゲーム開始できます" : "🎲 ゲーム開始"}
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

      <HelpSection />

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
