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
    <div className="space-y-4 rounded-lg bg-slate-800 p-4">
      <h2 className="font-bold">ハンド結果</h2>
      <ul className="space-y-1">
        {(hand.results ?? []).map((r) => (
          <li key={r.playerId} className="flex justify-between">
            <span>{room.players[r.playerId]?.name}</span>
            <span className="font-bold text-emerald-400">+{r.amount}</span>
          </li>
        ))}
      </ul>

      {isHost && (
        <div className="space-y-3">
          {busted.length > 0 && (
            <div className="rounded-lg bg-slate-900 p-3">
              <p className="mb-2 text-sm text-slate-300">バーストしたプレイヤー:</p>
              {busted.map((id) => (
                <div key={id} className="flex items-center justify-between py-1">
                  <span>{room.players[id]?.name}</span>
                  <button
                    className="rounded-lg bg-slate-700 px-3 py-1 text-sm disabled:opacity-50"
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
            <div className="space-y-2 rounded-lg bg-slate-900 p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">SB</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-1"
                    value={sb}
                    min={1}
                    onChange={(e) => setSb(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">BB</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-1"
                    value={bb}
                    min={1}
                    onChange={(e) => setBb(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-lg bg-slate-700 py-2 text-sm"
                  onClick={() => setShowSettings(false)}
                >
                  閉じる
                </button>
                <button
                  className="rounded-lg bg-emerald-700 py-2 text-sm disabled:opacity-50"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const err = await sendUpdateBlinds(room.code, playerId, sb, bb);
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
              className="w-full rounded-lg border border-slate-600 py-2 text-sm text-slate-300"
              onClick={() => setShowSettings(true)}
            >
              ブラインドを変更
            </button>
          )}

          <button
            className="w-full rounded-lg bg-emerald-600 py-3 font-bold disabled:opacity-50"
            disabled={busy}
            onClick={() => run(() => sendNextHand(room.code, playerId))}
          >
            次のハンドへ
          </button>
        </div>
      )}

      {!isHost && (
        <p className="text-center text-sm text-slate-400">
          ホストが次のハンドを開始するのを待っています...
        </p>
      )}
    </div>
  );
}
