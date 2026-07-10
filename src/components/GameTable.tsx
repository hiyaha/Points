import { useState } from "react";
import type { Room } from "../types";
import {
  PHASE_INSTRUCTIONS,
  PHASE_LABELS,
  getPositions,
  positionStyle,
  totalPot,
} from "../lib/poker";
import { useGameSounds } from "../lib/useGameSounds";
import { avatarGradient } from "../lib/ui";
import ActionBar from "./ActionBar";
import ShowdownPanel from "./ShowdownPanel";
import ResultPanel from "./ResultPanel";
import GameOverPanel from "./GameOverPanel";

interface Props {
  room: Room;
  playerId: string;
  onLeave: () => void;
}

function seatPositions(
  count: number,
): { x: number; y: number }[] {
  const RX = 46;
  const RY = 42;
  return Array.from({ length: count }, (_, i) => {
    const t = i / count;
    return {
      x: 50 + RX * Math.sin(2 * Math.PI * t),
      y: 50 + RY * Math.cos(2 * Math.PI * t),
    };
  });
}

export default function GameTable({ room, playerId, onLeave }: Props) {
  const [error, setError] = useState<string | null>(null);
  useGameSounds(room, playerId);
  const hand = room.hand;
  const isHost = room.hostId === playerId;

  const alive = room.playerOrder.filter(
    (id) => (room.players[id]?.chips ?? 0) > 0,
  );
  const isGameOver = hand?.phase === "complete" && alive.length <= 1;

  if (isGameOver) {
    return (
      <div className="space-y-4 pb-8">
        <GameOverPanel
          room={room}
          playerId={playerId}
          onLeave={onLeave}
          onError={setError}
        />
        {error && (
          <p className="animate-fade-up rounded-xl border border-red-500/30 bg-red-950/60 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (!hand) {
    return (
      <p className="py-20 text-center text-stone-500">
        ハンドの開始を待っています...
      </p>
    );
  }

  const displayOrder =
    hand.participants.length > 0 ? hand.participants : room.playerOrder;
  const spectators = room.playerOrder.filter(
    (id) => !displayOrder.includes(id),
  );
  const positions = getPositions(hand);

  const myIdx = displayOrder.indexOf(playerId);
  const rotated =
    myIdx >= 0
      ? [...displayOrder.slice(myIdx), ...displayOrder.slice(0, myIdx)]
      : displayOrder;
  const seats = seatPositions(rotated.length);

  return (
    <div className="space-y-3 pb-44">
      <header className="flex items-center justify-between pr-24">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <span className="panel tnum rounded-lg px-2.5 py-1 font-bold tracking-widest text-stone-300">
            {room.code}
          </span>
          <span className="tnum">ハンド #{hand.handNumber}</span>
        </div>
        <button
          className="rounded-lg border border-white/5 bg-white/5 px-3 py-1 text-xs text-stone-500 transition active:scale-95"
          onClick={onLeave}
        >
          退出
        </button>
      </header>

      {/* テーブル */}
      <div
        className="relative mx-auto w-full"
        style={{ paddingBottom: "90%" }}
      >
        <div className="absolute inset-0">
          {/* フェルト */}
          <div className="felt absolute bottom-[20%] left-[15%] right-[15%] top-[20%] rounded-[50%]">
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-300/80">
                {PHASE_LABELS[hand.phase]}
              </p>
              <p className="mt-0.5 text-3xl font-black drop-shadow-lg">
                <span className="text-gold tnum">{totalPot(hand)}</span>
              </p>
              <p className="text-[10px] font-bold tracking-wider text-emerald-200/60">
                POT
              </p>
              {PHASE_INSTRUCTIONS[hand.phase] && (
                <p className="mx-3 mt-2 rounded-full bg-black/30 px-3 py-1 text-[10px] leading-tight text-emerald-100/80">
                  🃏 {PHASE_INSTRUCTIONS[hand.phase]}
                </p>
              )}
              <p className="mt-1 text-[10px] text-emerald-200/40">
                SB {room.settings.smallBlind} / BB {room.settings.bigBlind}
              </p>
            </div>
          </div>

          {/* プレイヤー席 */}
          {rotated.map((id, i) => {
            const p = room.players[id];
            if (!p) return null;
            const seat = seats[i];
            const isActing = hand.actingId === id;
            const folded = !!hand.folded[id];
            const allIn = !!hand.allIn[id];
            const bet = hand.bets[id] ?? 0;
            const isMe = id === playerId;
            const pos = positions[id];

            return (
              <div
                key={id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${seat.x}%`, top: `${seat.y}%` }}
              >
                <div
                  className={`flex flex-col items-center transition-all duration-300 ${
                    folded ? "opacity-25 saturate-0" : ""
                  }`}
                >
                  {/* アバター */}
                  <div className="relative">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-black shadow-xl ring-2 transition-shadow ${
                        isActing
                          ? "animate-glow ring-amber-400 shadow-amber-500/30"
                          : isMe
                            ? "ring-sky-400/70 shadow-sky-500/20"
                            : "ring-white/10"
                      }`}
                      style={{ background: avatarGradient(id) }}
                    >
                      {p.name.charAt(0)}
                    </span>
                    {pos && (
                      <span
                        className={`absolute -right-2.5 -top-1 rounded-full px-1.5 py-0.5 text-[8px] font-black leading-none shadow-md ${
                          pos === "BTN"
                            ? "border border-amber-400 bg-amber-500 text-stone-950"
                            : positionStyle(pos)
                        } ${pos !== "BTN" ? "text-white" : ""}`}
                      >
                        {pos}
                      </span>
                    )}
                  </div>

                  {/* 名前 */}
                  <p
                    className={`mt-0.5 max-w-[5rem] truncate text-center text-[11px] font-bold ${
                      isMe ? "text-sky-300" : "text-stone-200"
                    }`}
                  >
                    {isMe ? "あなた" : p.name}
                  </p>

                  {/* チップ */}
                  <p className="tnum text-xs font-black text-stone-100">
                    {p.chips}
                  </p>

                  {/* ベット/ステータス */}
                  <p className="h-4 text-center text-[10px]">
                    {folded ? (
                      <span className="text-stone-600">フォールド</span>
                    ) : allIn ? (
                      <span className="font-black text-rose-400 drop-shadow-[0_0_4px_rgba(244,63,94,0.4)]">
                        ALL IN
                      </span>
                    ) : bet > 0 ? (
                      <span className="tnum font-bold text-emerald-300">
                        <span className="chip-icon mr-0.5" />
                        {bet}
                      </span>
                    ) : isActing ? (
                      <span className="animate-bounce-soft inline-block text-amber-400">
                        考え中
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 観戦者 */}
      {spectators.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 text-xs text-stone-600">
          {spectators.map((id) => {
            const p = room.players[id];
            if (!p) return null;
            return (
              <span
                key={id}
                className="rounded-full border border-white/5 bg-white/5 px-2.5 py-1"
              >
                {p.name} ({p.chips > 0 ? "次ハンドから" : "バースト"})
              </span>
            );
          })}
        </div>
      )}

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
        <p className="text-center text-sm text-stone-500">
          {room.players[hand.actingId]?.name} さんの番です
        </p>
      )}

      {!isHost && hand.phase === "showdown" && (
        <p className="animate-bounce-soft text-center text-sm text-stone-500">
          ホストが勝者を選択しています...
        </p>
      )}
    </div>
  );
}
