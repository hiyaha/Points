import { useState } from "react";
import { getSavedName, saveName } from "../lib/id";
import { createRoom, joinRoom } from "../lib/room";
import HelpSection from "./HelpSection";

interface Props {
  playerId: string;
  onEnterRoom: (code: string) => void;
}

export default function Lobby({ playerId, onEnterRoom }: Props) {
  const [name, setName] = useState(getSavedName());
  const [mode, setMode] = useState<"create" | "join">("create");
  const [joinCode, setJoinCode] = useState("");
  const [initialChips, setInitialChips] = useState(1000);
  const [smallBlind, setSmallBlind] = useState(10);
  const [bigBlind, setBigBlind] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const validateName = (): boolean => {
    if (!name.trim()) {
      setError("名前を入力してください");
      return false;
    }
    saveName(name.trim());
    return true;
  };

  const handleCreate = async () => {
    setError(null);
    if (!validateName()) return;
    if (smallBlind <= 0 || bigBlind < smallBlind) {
      setError("ブラインド額が不正です(BB は SB 以上にしてください)");
      return;
    }
    if (initialChips < bigBlind) {
      setError("初期チップは BB 以上にしてください");
      return;
    }
    setBusy(true);
    const result = await createRoom(playerId, name.trim(), {
      initialChips,
      smallBlind,
      bigBlind,
    });
    setBusy(false);
    if (result.error) setError(result.error);
    else if (result.code) onEnterRoom(result.code);
  };

  const handleJoin = async () => {
    setError(null);
    if (!validateName()) return;
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError("ルームコードを入力してください");
      return;
    }
    setBusy(true);
    const err = await joinRoom(code, playerId, name.trim());
    setBusy(false);
    if (err) setError(err);
    else onEnterRoom(code);
  };

  return (
    <div className="animate-fade-up space-y-6 pt-8">
      <header className="text-center">
        <p className="mb-2 text-3xl tracking-[0.5em]">
          <span className="drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]">♠</span>
          <span className="text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.3)]">♥</span>
          <span className="text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.3)]">♦</span>
          <span className="drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]">♣</span>
        </p>
        <h1 className="text-gold text-3xl font-black tracking-wide">
          ポーカーチップカウンター
        </h1>
        <div className="divider-gold mx-auto mt-3 w-32" />
        <p className="mt-3 text-sm text-stone-400">
          テキサスホールデム用のチップ管理アプリ
        </p>
      </header>

      <div className="panel rounded-2xl p-5">
        <label className="mb-1.5 block text-sm font-semibold text-stone-300">
          あなたの名前
        </label>
        <input
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/15"
          value={name}
          maxLength={12}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: たろう"
        />
      </div>

      <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black/20 p-1">
        <button
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
            mode === "create"
              ? "btn-primary text-white shadow-lg"
              : "text-stone-500 hover:text-stone-300"
          }`}
          onClick={() => setMode("create")}
        >
          ルームを作る
        </button>
        <button
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
            mode === "join"
              ? "btn-primary text-white shadow-lg"
              : "text-stone-500 hover:text-stone-300"
          }`}
          onClick={() => setMode("join")}
        >
          ルームに参加
        </button>
      </div>

      {mode === "create" ? (
        <div className="animate-fade-up space-y-4">
          <div className="panel rounded-2xl p-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-400">
                  初期チップ
                </label>
                <input
                  type="number"
                  className="tnum w-full rounded-xl border border-white/10 bg-black/30 px-2 py-2.5 text-stone-100 outline-none transition focus:border-amber-500/40"
                  value={initialChips}
                  min={1}
                  onChange={(e) => setInitialChips(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-400">
                  SB(小)
                </label>
                <input
                  type="number"
                  className="tnum w-full rounded-xl border border-white/10 bg-black/30 px-2 py-2.5 text-stone-100 outline-none transition focus:border-amber-500/40"
                  value={smallBlind}
                  min={1}
                  onChange={(e) => setSmallBlind(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-400">
                  BB(大)
                </label>
                <input
                  type="number"
                  className="tnum w-full rounded-xl border border-white/10 bg-black/30 px-2 py-2.5 text-stone-100 outline-none transition focus:border-amber-500/40"
                  value={bigBlind}
                  min={1}
                  onChange={(e) => setBigBlind(Number(e.target.value))}
                />
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-stone-500">
              各プレイヤーに配られる初期チップと、毎ハンド強制ベットされるブラインド額を設定します。SB(スモールブラインド)はBB(ビッグブラインド)の半額が一般的です。
            </p>
          </div>
          <button
            className="btn-primary w-full rounded-2xl py-4 text-lg font-black text-white disabled:opacity-50"
            disabled={busy}
            onClick={handleCreate}
          >
            ルームを作成する
          </button>
        </div>
      ) : (
        <div className="animate-fade-up space-y-4">
          <div className="panel rounded-2xl p-4">
            <label className="mb-1.5 block text-sm font-semibold text-stone-300">
              ルームコード
            </label>
            <input
              className="tnum w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-2xl font-bold tracking-[0.35em] uppercase text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-amber-500/40"
              value={joinCode}
              maxLength={6}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="ABC123"
            />
          </div>
          <button
            className="btn-primary w-full rounded-2xl py-4 text-lg font-black text-white disabled:opacity-50"
            disabled={busy}
            onClick={handleJoin}
          >
            参加する
          </button>
        </div>
      )}

      {error && (
        <p className="animate-fade-up rounded-xl border border-red-500/30 bg-red-950/60 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <HelpSection />
    </div>
  );
}
