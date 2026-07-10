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
        <p className="mb-1 text-2xl tracking-[0.4em]">
          <span className="text-slate-200">♠</span>
          <span className="text-red-500">♥</span>
          <span className="text-red-500">♦</span>
          <span className="text-slate-200">♣</span>
        </p>
        <h1 className="text-gold text-3xl font-black tracking-wide">
          ポーカーチップカウンター
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          テキサスホールデム用のチップ管理アプリ
        </p>
      </header>

      <div className="panel rounded-2xl p-5">
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          あなたの名前
        </label>
        <input
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
          value={name}
          maxLength={12}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: たろう"
        />
      </div>

      <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 p-1">
        <button
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
            mode === "create"
              ? "bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-lg"
              : "text-slate-400"
          }`}
          onClick={() => setMode("create")}
        >
          ルームを作る
        </button>
        <button
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
            mode === "join"
              ? "bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-lg"
              : "text-slate-400"
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
                <label className="mb-1 block text-xs text-slate-400">
                  初期チップ
                </label>
                <input
                  type="number"
                  className="tnum w-full rounded-xl border border-white/10 bg-slate-950/60 px-2 py-2.5 outline-none transition focus:border-emerald-500/60"
                  value={initialChips}
                  min={1}
                  onChange={(e) => setInitialChips(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">SB(小)</label>
                <input
                  type="number"
                  className="tnum w-full rounded-xl border border-white/10 bg-slate-950/60 px-2 py-2.5 outline-none transition focus:border-emerald-500/60"
                  value={smallBlind}
                  min={1}
                  onChange={(e) => setSmallBlind(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">BB(大)</label>
                <input
                  type="number"
                  className="tnum w-full rounded-xl border border-white/10 bg-slate-950/60 px-2 py-2.5 outline-none transition focus:border-emerald-500/60"
                  value={bigBlind}
                  min={1}
                  onChange={(e) => setBigBlind(Number(e.target.value))}
                />
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              各プレイヤーに配られる初期チップと、毎ハンド強制ベットされるブラインド額を設定します。SB(スモールブラインド)はBB(ビッグブラインド)の半額が一般的です。
            </p>
          </div>
          <button
            className="w-full rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 py-4 text-lg font-black shadow-lg shadow-emerald-900/50 transition active:scale-[0.98] disabled:opacity-50"
            disabled={busy}
            onClick={handleCreate}
          >
            ルームを作成する
          </button>
        </div>
      ) : (
        <div className="animate-fade-up space-y-4">
          <div className="panel rounded-2xl p-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              ルームコード
            </label>
            <input
              className="tnum w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3 text-center text-2xl font-bold tracking-[0.35em] uppercase outline-none transition focus:border-emerald-500/60"
              value={joinCode}
              maxLength={6}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="ABC123"
            />
          </div>
          <button
            className="w-full rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 py-4 text-lg font-black shadow-lg shadow-emerald-900/50 transition active:scale-[0.98] disabled:opacity-50"
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
