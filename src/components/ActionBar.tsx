import { useState } from "react";
import type { ActionInput, Room } from "../types";
import { canRaise } from "../lib/poker";
import { sendAction } from "../lib/room";

interface Props {
  room: Room;
  playerId: string;
  onError: (msg: string | null) => void;
}

export default function ActionBar({ room, playerId, onError }: Props) {
  const hand = room.hand!;
  const me = room.players[playerId];
  const myBet = hand.bets[playerId] ?? 0;
  const toCall = Math.max(0, hand.currentBet - myBet);
  const callAmount = Math.min(toCall, me.chips);
  const maxTarget = myBet + me.chips;
  const minTarget = Math.min(hand.currentBet + hand.minRaise, maxTarget);
  const raiseAllowed = canRaise(hand, playerId) && me.chips > toCall;

  const [raiseTarget, setRaiseTarget] = useState(minTarget);
  const [showRaise, setShowRaise] = useState(false);
  const [busy, setBusy] = useState(false);

  const act = async (action: ActionInput) => {
    setBusy(true);
    onError(null);
    const err = await sendAction(room.code, playerId, action);
    setBusy(false);
    if (err) onError(err);
    else setShowRaise(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-500/20 bg-slate-950/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.6)] backdrop-blur-lg">
      <div className="mx-auto max-w-xl space-y-3">
        <p className="text-center text-sm font-black tracking-wide text-amber-400">
          ⭐ あなたの番です
          {toCall > 0 && (
            <span className="tnum font-bold text-amber-200/90">
              {" "}
              — コールに {callAmount} 必要
            </span>
          )}
        </p>

        {showRaise ? (
          <div className="animate-fade-up space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="range"
                className="flex-1 accent-rose-500"
                min={minTarget}
                max={maxTarget}
                value={raiseTarget}
                onChange={(e) => setRaiseTarget(Number(e.target.value))}
              />
              <input
                type="number"
                className="tnum w-24 rounded-xl border border-white/10 bg-slate-900 px-2 py-2 text-right font-bold outline-none focus:border-rose-500/60"
                min={minTarget}
                max={maxTarget}
                value={raiseTarget}
                onChange={(e) => setRaiseTarget(Number(e.target.value))}
              />
            </div>
            <p className="tnum text-center text-xs text-slate-400">
              このラウンドの合計ベット額(最低 {minTarget} / 最大 {maxTarget})
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                className="rounded-xl bg-slate-800 py-3 text-sm font-bold transition active:scale-95"
                onClick={() => setShowRaise(false)}
              >
                戻る
              </button>
              <button
                className="rounded-xl bg-gradient-to-b from-purple-600 to-purple-800 py-3 text-sm font-bold shadow transition active:scale-95"
                onClick={() => setRaiseTarget(maxTarget)}
              >
                オールイン
              </button>
              <button
                className="tnum rounded-xl bg-gradient-to-b from-rose-500 to-rose-700 py-3 font-black shadow-lg shadow-rose-950/50 transition active:scale-95 disabled:opacity-50"
                disabled={
                  busy || raiseTarget < minTarget || raiseTarget > maxTarget
                }
                onClick={() => act({ type: "raise", amount: raiseTarget })}
              >
                {raiseTarget === maxTarget
                  ? "オールイン!"
                  : hand.currentBet > 0
                    ? `${raiseTarget} にレイズ`
                    : `${raiseTarget} をベット`}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button
              className="rounded-xl border border-white/10 bg-slate-800 py-3.5 font-bold shadow transition active:scale-95 disabled:opacity-50"
              disabled={busy}
              onClick={() => act({ type: "fold" })}
            >
              フォールド
            </button>
            {toCall > 0 ? (
              <button
                className="rounded-xl bg-gradient-to-b from-sky-500 to-sky-700 py-3.5 font-black shadow-lg shadow-sky-950/50 transition active:scale-95 disabled:opacity-50"
                disabled={busy}
                onClick={() => act({ type: "call" })}
              >
                <span className="tnum">コール {callAmount}</span>
                {callAmount >= me.chips && (
                  <span className="block text-xs font-normal">
                    (オールイン)
                  </span>
                )}
              </button>
            ) : (
              <button
                className="rounded-xl bg-gradient-to-b from-sky-500 to-sky-700 py-3.5 font-black shadow-lg shadow-sky-950/50 transition active:scale-95 disabled:opacity-50"
                disabled={busy}
                onClick={() => act({ type: "check" })}
              >
                チェック
              </button>
            )}
            {raiseAllowed ? (
              <button
                className="rounded-xl bg-gradient-to-b from-rose-500 to-rose-700 py-3.5 font-black shadow-lg shadow-rose-950/50 transition active:scale-95 disabled:opacity-50"
                disabled={busy}
                onClick={() => {
                  setRaiseTarget(minTarget);
                  setShowRaise(true);
                }}
              >
                {hand.currentBet > 0 ? "レイズ" : "ベット"}
              </button>
            ) : (
              <button
                className="rounded-xl bg-slate-900 py-3.5 text-xs text-slate-600"
                disabled
              >
                レイズ不可
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
