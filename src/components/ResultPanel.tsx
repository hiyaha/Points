import { useState } from "react";
import type { Room } from "../types";
import { sendNextHand, sendRebuy, sendUpdateBlinds } from "../lib/room";

interface Props {
  room: Room;
  playerId: string;
  onError: (msg: string | null) => void;
}

export default function ResultPanel({ room, playerId, onError }: Props) {
  const hand = room.hand!;
  const isHost = room.hostId === playerId;
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sb, setSb] = useState(room.settings.smallBlind);
  const [bb, setBb] = useState(room.settings.bigBlind);

  const busted = room.playerOrder.filter(
    (id) => (room.players[id]?.chips ?? 0) === 0,
  );

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true);
    onError(null);
    const err = await fn();
    setBusy(false);
    if (err) onError(err);
  };

  return (
    <div className="panel animate-fade-up space-y-4 rounded-2xl p-4">
      <h2 className="text-center text-lg font-black">
        <span className="animate-trophy mr-1">🏆</span> ハンド結果
      </h2>
      <ul className="space-y-2">
        {(hand.results ?? []).map((r) => (
          <li
            key={r.playerId}
            className="animate-fade-up flex items-center justify-between rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-950/40 to-transparent px-4 py-2.5"
          >
            <span className="font-bold">{room.players[r.playerId]?.name}</span>
            <span className="text-gold tnum text-lg font-black">
              +{r.amount}
            </span>
          </li>
        ))}
      </ul>

      {isHost && (
        <div className="space-y-3">
          {busted.length > 0 && (
            <div className="rounded-2xl bg-slate-950/50 p-3">
              <p className="mb-2 text-sm text-slate-300">
                バーストしたプレイヤー:
              </p>
              {busted.map((id) => (
                <div
                  key={id}
                  className="flex items-center justify-between py-1"
                >
                  <span>{room.players[id]?.name}</span>
                  <button
                    className="tnum rounded-xl bg-slate-800 px-3 py-1.5 text-sm font-bold transition active:scale-95 disabled:opacity-50"
                    disabled={busy}
                    onClick={() => run(() => sendRebuy(room.code, playerId, id))}
                  >
                    +{room.settings.initialChips} 追加
                  </button>
                </div>
              ))}
            </div>
          )}

          {showSettings ? (
            <div className="animate-fade-up space-y-2 rounded-2xl bg-slate-950/50 p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">SB</label>
                  <input
                    type="number"
                    className="tnum w-full rounded-xl border border-white/10 bg-slate-900 px-2 py-2 outline-none focus:border-emerald-500/60"
                    value={sb}
                    min={1}
                    onChange={(e) => setSb(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">BB</label>
                  <input
                    type="number"
                    className="tnum w-full rounded-xl border border-white/10 bg-slate-900 px-2 py-2 outline-none focus:border-emerald-500/60"
                    value={bb}
                    min={1}
                    onChange={(e) => setBb(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-xl bg-slate-800 py-2.5 text-sm font-bold transition active:scale-95"
                  onClick={() => setShowSettings(false)}
                >
                  閉じる
                </button>
                <button
                  className="rounded-xl bg-gradient-to-b from-emerald-600 to-emerald-800 py-2.5 text-sm font-bold transition active:scale-95 disabled:opacity-50"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const err = await sendUpdateBlinds(
                        room.code,
                        playerId,
                        sb,
                        bb,
                      );
                      if (!err) setShowSettings(false);
                      return err;
                    })
                  }
                >
                  保存
                </button>
              </div>
            </div>
          ) : (
            <button
              className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-slate-300 transition active:scale-[0.98]"
              onClick={() => setShowSettings(true)}
            >
              ⚙️ ブラインドを変更
            </button>
          )}

          <button
            className="w-full rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 py-4 text-lg font-black shadow-lg shadow-emerald-900/50 transition active:scale-[0.98] disabled:opacity-50"
            disabled={busy}
            onClick={() => run(() => sendNextHand(room.code, playerId))}
          >
            次のハンドへ ▶
          </button>
        </div>
      )}

      {!isHost && (
        <p className="animate-bounce-soft text-center text-sm text-slate-400">
          ホストが次のハンドを開始するのを待っています...
        </p>
      )}
    </div>
  );
}
