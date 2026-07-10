import { useCallback, useEffect, useState } from "react";
import { isConfigured } from "./firebaseConfig";
import { getPlayerId, getSavedRoomCode, saveRoomCode } from "./lib/id";
import { subscribeRoom } from "./lib/room";
import type { Room } from "./types";
import SetupScreen from "./components/SetupScreen";
import Lobby from "./components/Lobby";
import WaitingRoom from "./components/WaitingRoom";
import GameTable from "./components/GameTable";
import SoundToggles from "./components/SoundToggles";
import HelpModal from "./components/HelpModal";
import { unlock } from "./lib/sound";

export default function App() {
  const [roomCode, setRoomCode] = useState<string | null>(() =>
    isConfigured ? getSavedRoomCode() : null,
  );
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const playerId = isConfigured ? getPlayerId() : "";

  useEffect(() => {
    // ブラウザの自動再生制限があるため、最初のタップで音声を有効化する
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    if (!roomCode) {
      setRoom(null);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeRoom(roomCode, (r) => {
      setLoading(false);
      setRoom(r);
      if (!r) {
        // ルームが存在しない(解散された等)
        saveRoomCode(null);
        setRoomCode(null);
      }
    });
    return unsubscribe;
  }, [roomCode]);

  const enterRoom = useCallback((code: string) => {
    saveRoomCode(code);
    setRoomCode(code);
  }, []);

  const leaveRoom = useCallback(() => {
    saveRoomCode(null);
    setRoomCode(null);
  }, []);

  if (!isConfigured) return <SetupScreen />;

  return (
    <div className="bg-app min-h-screen text-stone-100">
      <SoundToggles />
      <button
        aria-label="ヘルプ"
        className="fixed left-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/30 bg-amber-900/50 text-sm backdrop-blur-md shadow-[0_0_8px_rgba(245,158,11,0.15)] transition active:scale-90"
        onClick={() => setShowHelp(true)}
      >
        📖
      </button>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      <div className="mx-auto max-w-xl px-4 py-6">
        {!roomCode ? (
          <Lobby playerId={playerId} onEnterRoom={enterRoom} />
        ) : loading || !room ? (
          <p className="py-20 text-center text-slate-400">読み込み中...</p>
        ) : room.status === "lobby" ? (
          <WaitingRoom room={room} playerId={playerId} onLeave={leaveRoom} />
        ) : (
          <GameTable room={room} playerId={playerId} onLeave={leaveRoom} />
        )}
      </div>
    </div>
  );
}
