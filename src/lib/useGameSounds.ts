// ルーム状態の変化を監視して効果音を鳴らすフック。
// 自分の操作も他人の操作も、同期されてきた状態の差分から一律に検出する。

import { useEffect, useRef } from "react";
import type { Room } from "../types";
import { totalPot } from "./poker";
import { se } from "./sound";

interface Snapshot {
  handNumber: number;
  phase: string;
  actingId: string | null;
  foldCount: number;
  allInCount: number;
  potTotal: number;
}

export function useGameSounds(room: Room, playerId: string) {
  const prev = useRef<Snapshot | null>(null);

  useEffect(() => {
    const hand = room.hand;
    if (!hand) {
      prev.current = null;
      return;
    }
    const cur: Snapshot = {
      handNumber: hand.handNumber,
      phase: hand.phase,
      actingId: hand.actingId,
      foldCount: Object.values(hand.folded).filter(Boolean).length,
      allInCount: Object.values(hand.allIn).filter(Boolean).length,
      potTotal: totalPot(hand),
    };
    const p = prev.current;
    prev.current = cur;
    if (!p) return;

    if (cur.handNumber !== p.handNumber) {
      se.deal();
    } else if (cur.phase === "complete" && p.phase !== "complete") {
      se.win();
    } else {
      if (cur.allInCount > p.allInCount) se.allIn();
      else if (cur.potTotal > p.potTotal) se.chip();
      if (cur.foldCount > p.foldCount) se.fold();
      if (cur.phase !== p.phase) se.deal();
      const nothingChanged =
        cur.potTotal === p.potTotal &&
        cur.foldCount === p.foldCount &&
        cur.allInCount === p.allInCount &&
        cur.phase === p.phase;
      if (nothingChanged && cur.actingId !== p.actingId) se.check();
    }
    if (cur.actingId === playerId && p.actingId !== playerId) se.turn();
  }, [room, playerId]);
}
