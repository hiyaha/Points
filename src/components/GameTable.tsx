import { useState } from "react";
import type { Room } from "../types";
import { PHASE_INSTRUCTIONS, PHASE_LABELS, totalPot } from "../lib/poker";
import ActionBar from "./ActionBar";
import ShowdownPanel from "./ShowdownPanel";
import ResultPanel from "./ResultPanel";

interface Props {
  room: Room;
  playerId: string;
  onLeave: () => void;
}

export default function GameTable({ room, playerId, onLeave }: Props) {
  const [error, setError] = useState<string | null>(null);
  const hand = room.hand;
  const isHost = room.hostId === playerId;

  if (!hand) {
    return <p className="py-20 text-center text-slate-400">ハンドの開始を待っています...</p>;
  }

  const displayOrder = hand.participants.length > 0 ? hand.participants : room.playerOrder;
  // 参加していないプレイヤー(バースト・途中参加)も一覧の下に出す
  const spectators = room.playerOrder.filter((id) => !displayOrder.includes(id));

  return (
    <div className="space-y-4 pb-40">
      <header className="flex items-center justify-between">
        <div>
          <span className="text-sm text-slate-400">ルーム {room.code}</span>
          <span className="ml-3 text-sm text-slate-400">
            ハンド #{hand.handNumber}
          </span>
        </div>
        <button className="text-sm text-slate-500" onClick={onLeave}>
          退出
        </button>
      </header>

      <div className="rounded-lg bg-emerald-900/60 p-4 text-center">
        <p className="text-sm text-emerald-300">{PHASE_LABELS[hand.phase]}</p>
        <p className="text-3xl font-bold">ポット {totalPot(hand)}</p>
        {PHASE_INSTRUCTIONS[hand.phase] && (
          <p className="mt-1 text-xs text-emerald-200/80">
            🃏 {PHASE_INSTRUCTIONS[hand.phase]}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          SB {room.settings.smallBlind} / BB {room.settings.bigBlind}
        </p>
      </div>

      <ul className="space-y-2">
        {displayOrder.map((id) => {
          const p = room.players[id];
          if (!p) return null;
          const isActing = hand.actingId === id;
          const folded = !!hand.folded[id];
          const allIn = !!hand.allIn[id];
          const bet = hand.bets[id] ?? 0;
          return (
            <li
              key={id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                isActing
                  ? "bg-amber-900/60 ring-2 ring-amber-500"
                  : "bg-slate-800"
              } ${folded ? "opacity-40" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{p.name}</span>
                {id === hand.dealerId && <Badge color="bg-white text-slate-900">D</Badge>}
                {id === hand.sbId && <Badge color="bg-sky-700">SB</Badge>}
                {id === hand.bbId && <Badge color="bg-indigo-700">BB</Badge>}
                {id === playerId && (
                  <span className="text-xs text-sky-400">あなた</span>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold">{p.chips}</p>
                <p className="text-xs text-slate-400">
                  {folded
                    ? "フォールド"
                    : allIn
                      ? "オールイン"
                      : bet > 0
                        ? `ベット ${bet}`
                        : isActing
                          ? "考え中..."
                          : ""}
                </p>
              </div>
            </li>
          );
        })}
        {spectators.map((id) => {
          const p = room.players[id];
          if (!p) return null;
          return (
            <li
              key={id}
              className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-slate-500"
            >
              <span>
                {p.name}
                <span className="ml-2 text-xs">
                  {p.chips > 0 ? "次ハンドから参加" : "バースト"}
                </span>
              </span>
              <span>{p.chips}</span>
            </li>
          );
        })}
      </ul>

      {hand.phase === "showdown" && (
        <ShowdownPanel room={room} playerId={playerId} onError={setError} />
      )}

      {hand.phase === "complete" && (
        <ResultPanel room={room} playerId={playerId} onError={setError} />
      )}

      {error && (
        <p className="rounded-lg bg-red-900/50 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      {hand.actingId === playerId && (
        <ActionBar room={room} playerId={playerId} onError={setError} />
      )}

      {hand.actingId && hand.actingId !== playerId && (
        <p className="text-center text-sm text-slate-400">
          {room.players[hand.actingId]?.name} さんの番です
        </p>
      )}

      {!isHost && hand.phase === "showdown" && (
        <p className="text-center text-sm text-slate-400">
          ホストが勝者を選択しています...
        </p>
      )}
    </div>
  );
}

function Badge({ color, children }: { color: string; children: string }) {
  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${color}`}
    >
      {children}
    </span>
  );
}
