import { useState } from "react";
import type { Room } from "../types";
import { PHASE_INSTRUCTIONS, PHASE_LABELS, totalPot } from "../lib/poker";
import { useGameSounds } from "../lib/useGameSounds";
import { avatarGradient } from "../lib/ui";
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
  useGameSounds(room, playerId);
  const hand = room.hand;
  const isHost = room.hostId === playerId;

  if (!hand) {
    return (
      <p className="py-20 text-center text-slate-400">
        ハンドの開始を待っています...
      </p>
    );
  }

  const displayOrder =
    hand.participants.length > 0 ? hand.participants : room.playerOrder;
  // 参加していないプレイヤー(バースト・途中参加)も一覧の下に出す
  const spectators = room.playerOrder.filter((id) => !displayOrder.includes(id));

  return (
    <div className="space-y-4 pb-44">
      <header className="flex items-center justify-between pr-24">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="panel tnum rounded-lg px-2.5 py-1 font-bold tracking-widest">
            {room.code}
          </span>
          <span className="tnum">ハンド #{hand.handNumber}</span>
        </div>
        <button className="text-sm text-slate-500" onClick={onLeave}>
          退出
        </button>
      </header>

      <div className="felt rounded-[2rem] border border-emerald-950/80 px-4 py-6 text-center">
        <p className="text-xs font-bold tracking-widest text-emerald-300/90 uppercase">
          {PHASE_LABELS[hand.phase]}
        </p>
        <p className="mt-1 text-4xl font-black drop-shadow-lg">
          <span className="text-gold tnum">{totalPot(hand)}</span>
        </p>
        <p className="text-xs font-bold tracking-wider text-emerald-200/70">
          POT
        </p>
        {PHASE_INSTRUCTIONS[hand.phase] && (
          <p className="mx-auto mt-3 max-w-xs rounded-full bg-black/25 px-4 py-1.5 text-xs text-emerald-100/90">
            🃏 {PHASE_INSTRUCTIONS[hand.phase]}
          </p>
        )}
        <p className="mt-2 text-[11px] text-emerald-200/50">
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
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-300 ${
                isActing
                  ? "animate-glow bg-amber-950/50 ring-2 ring-amber-400"
                  : "panel"
              } ${folded ? "opacity-35 saturate-0" : ""}`}
            >
              <span
                className="relative flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-black shadow-lg"
                style={{ background: avatarGradient(id) }}
              >
                {p.name.charAt(0)}
                {id === hand.dealerId && (
                  <span className="chip-badge absolute -right-1.5 -top-1.5 border-slate-400 bg-white text-slate-900">
                    D
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5">
                  <span className="truncate font-bold">{p.name}</span>
                  {id === hand.sbId && (
                    <span className="chip-badge bg-sky-600">SB</span>
                  )}
                  {id === hand.bbId && (
                    <span className="chip-badge bg-indigo-600">BB</span>
                  )}
                  {id === playerId && (
                    <span className="flex-none rounded-full bg-sky-900/60 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">
                      あなた
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs">
                  {folded ? (
                    <span className="text-slate-500">フォールド</span>
                  ) : allIn ? (
                    <span className="font-bold text-rose-400">
                      オールイン!
                    </span>
                  ) : bet > 0 ? (
                    <span className="text-emerald-300">
                      <span className="chip-icon mr-1" />
                      ベット <span className="tnum font-bold">{bet}</span>
                    </span>
                  ) : isActing ? (
                    <span className="animate-bounce-soft inline-block text-amber-300">
                      考え中...
                    </span>
                  ) : (
                    <span className="text-transparent">-</span>
                  )}
                </p>
              </div>
              <p className="tnum text-right text-lg font-black">
                {p.chips}
                <span className="block text-[10px] font-normal text-slate-500">
                  チップ
                </span>
              </p>
            </li>
          );
        })}
        {spectators.map((id) => {
          const p = room.players[id];
          if (!p) return null;
          return (
            <li
              key={id}
              className="flex items-center justify-between rounded-2xl bg-slate-950/30 px-3 py-2 text-slate-500"
            >
              <span className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold opacity-50"
                  style={{ background: avatarGradient(id) }}
                >
                  {p.name.charAt(0)}
                </span>
                {p.name}
                <span className="text-xs">
                  {p.chips > 0 ? "次ハンドから参加" : "バースト"}
                </span>
              </span>
              <span className="tnum">{p.chips}</span>
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
        <p className="animate-fade-up rounded-xl border border-red-500/30 bg-red-950/60 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
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
        <p className="animate-bounce-soft text-center text-sm text-slate-400">
          ホストが勝者を選択しています...
        </p>
      )}
    </div>
  );
}
