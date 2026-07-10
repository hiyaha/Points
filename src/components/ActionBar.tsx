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
    <div className="fixed inset-x-0 bottom-0 border-t border-slate-700 bg-slate-900/95 p-4 backdrop-blur">
      <div className="mx-auto max-w-xl space-y-3">
        <p className="text-center text-sm font-bold text-amber-400">
          あなたの番です
          {toCall > 0 && ` — コールに ${callAmount} 必要`}
        </p>

        {showRaise ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="range"
                className="flex-1"
                min={minTarget}
                max={maxTarget}
                value={raiseTarget}
                onChange={(e) => setRaiseTarget(Number(e.target.value))}
              />
              <input
                type="number"
                className="w-24 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-right"
                min={minTarget}
                max={maxTarget}
                value={raiseTarget}
                onChange={(e) => setRaiseTarget(Number(e.target.value))}
              />
            </div>
            <p className="text-center text-xs text-slate-400">
              このラウンドの合計ベット額(最低 {minTarget} / 最大 {maxTarget})
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                className="rounded-lg bg-slate-700 py-2 text-sm"
                onClick={() => setShowRaise(false)}
              >
                戻る
              </button>
              <button
                className="rounded-lg bg-slate-700 py-2 text-sm"
                onClick={() => setRaiseTarget(maxTarget)}
              >
                オールイン
              </button>
              <button
                className="rounded-lg bg-rose-600 py-2 font-bold disabled:opacity-50"
                disabled={busy || raiseTarget < minTarget || raiseTarget > maxTarget}
                onClick={() => act({ type: "raise", amount: raiseTarget })}
              >
                {raiseTarget === maxTarget
                  ? "オールイン"
                  : hand.currentBet > 0
                    ? `${raiseTarget} にレイズ`
                    : `${raiseTarget} をベット`}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button
              className="rounded-lg bg-slate-700 py-3 font-bold disabled:opacity-50"
              disabled={busy}
              onClick={() => act({ type: "fold" })}
            >
              フォールド
            </button>
            {toCall > 0 ? (
              <button
                className="rounded-lg bg-sky-600 py-3 font-bold disabled:opacity-50"
                disabled={busy}
                onClick={() => act({ type: "call" })}
              >
                コール {callAmount}
                {callAmount >= me.chips && (
                  <span className="block text-xs font-normal">(オールイン)</span>
                )}
              </button>
            ) : (
              <button
                className="rounded-lg bg-sky-600 py-3 font-bold disabled:opacity-50"
                disabled={busy}
                onClick={() => act({ type: "check" })}
              >
                チェック
              </button>
            )}
            {raiseAllowed ? (
              <button
                className="rounded-lg bg-rose-600 py-3 font-bold disabled:opacity-50"
                disabled={busy}
                onClick={() => {
                  setRaiseTarget(minTarget);
                  setShowRaise(true);
                }}
              >
                {hand.currentBet > 0 ? "レイズ" : "ベット"}
              </button>
            ) : (
              <button className="rounded-lg bg-slate-800 py-3 text-xs text-slate-500" disabled>
                レイズ不可
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
