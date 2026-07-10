import { useState } from "react";
import { getSavedName, saveName } from "../lib/id";
import { createRoom, joinRoom } from "../lib/room";

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
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">♠ ポーカーチップカウンター</h1>
        <p className="mt-1 text-sm text-slate-400">
          テキサスホールデム用のチップ管理アプリ
        </p>
      </header>

      <div>
        <label className="mb-1 block text-sm text-slate-300">あなたの名前</label>
        <input
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2"
          value={name}
          maxLength={12}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: たろう"
        />
      </div>

      <div className="flex overflow-hidden rounded-lg border border-slate-600">
        <button
          className={`flex-1 py-2 text-sm font-medium ${mode === "create" ? "bg-emerald-700" : "bg-slate-800 text-slate-400"}`}
          onClick={() => setMode("create")}
        >
          ルームを作る
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${mode === "join" ? "bg-emerald-700" : "bg-slate-800 text-slate-400"}`}
          onClick={() => setMode("join")}
        >
          ルームに参加
        </button>
      </div>

      {mode === "create" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">初期チップ</label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2"
                value={initialChips}
                min={1}
                onChange={(e) => setInitialChips(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">SB(小)</label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2"
                value={smallBlind}
                min={1}
                onChange={(e) => setSmallBlind(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">BB(大)</label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2"
                value={bigBlind}
                min={1}
                onChange={(e) => setBigBlind(Number(e.target.value))}
              />
            </div>
          </div>
          <button
            className="w-full rounded-lg bg-emerald-600 py-3 font-bold disabled:opacity-50"
            disabled={busy}
            onClick={handleCreate}
          >
            ルームを作成する
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">ルームコード</label>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-center text-xl tracking-[0.3em] uppercase"
              value={joinCode}
              maxLength={6}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="ABC123"
            />
          </div>
          <button
            className="w-full rounded-lg bg-emerald-600 py-3 font-bold disabled:opacity-50"
            disabled={busy}
            onClick={handleJoin}
          >
            参加する
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-900/50 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
    </div>
  );
}
