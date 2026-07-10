// Firebase Realtime Database 上のルーム操作。
// 変更はすべてトランザクションで行い、同時操作による不整合を防ぐ。

import {
  get,
  onValue,
  ref,
  runTransaction,
  set,
  type Unsubscribe,
} from "firebase/database";
import { getDb } from "../firebase";
import type { ActionInput, Room, Settings } from "../types";
import {
  applyAction,
  distributePots,
  nextHand,
  normalizeRoom,
  startHand,
} from "./poker";
import { generateRoomCode } from "./id";

function roomRef(code: string) {
  return ref(getDb(), `rooms/${code}`);
}

/** undefined を含むと RTDB への書き込みが失敗するため除去する */
function clean<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * ルームに対する更新をトランザクションで実行する。
 * mutate はルームを直接書き換え、失敗時はエラーメッセージを返す。
 */
async function withRoom(
  code: string,
  mutate: (room: Room) => string | null,
): Promise<string | null> {
  let err: string | null = null;
  const result = await runTransaction(roomRef(code), (data: Room | null) => {
    err = null;
    if (data === null) {
      // ローカルキャッシュ未取得の場合は null のまま返し、
      // サーバー値との競合で再実行させる(標準パターン)
      return data;
    }
    const room = normalizeRoom(data);
    err = mutate(room);
    if (err) return undefined; // 中断(書き込みなし)
    return clean(room);
  });
  if (err) return err;
  if (!result.committed) return "操作が競合しました。もう一度お試しください";
  if (!result.snapshot.exists()) return "ルームが見つかりません";
  return null;
}

export async function createRoom(
  hostId: string,
  hostName: string,
  settings: Settings,
): Promise<{ code?: string; error?: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const existing = await get(roomRef(code));
    if (existing.exists()) continue;
    const room: Room = {
      code,
      hostId,
      status: "lobby",
      settings,
      players: {
        [hostId]: { id: hostId, name: hostName, chips: settings.initialChips },
      },
      playerOrder: [hostId],
      dealerId: null,
      hand: null,
      createdAt: Date.now(),
    };
    await set(roomRef(code), clean(room));
    return { code };
  }
  return { error: "ルームコードの生成に失敗しました。もう一度お試しください" };
}

export async function joinRoom(
  code: string,
  playerId: string,
  name: string,
): Promise<string | null> {
  const snapshot = await get(roomRef(code));
  if (!snapshot.exists()) return "ルームが見つかりません";
  return withRoom(code, (room) => {
    if (room.players[playerId]) {
      // 再入室: 名前だけ更新
      room.players[playerId].name = name;
      return null;
    }
    room.players[playerId] = {
      id: playerId,
      name,
      chips: room.settings.initialChips,
    };
    room.playerOrder.push(playerId);
    return null;
  });
}

export function subscribeRoom(
  code: string,
  callback: (room: Room | null) => void,
): Unsubscribe {
  return onValue(roomRef(code), (snapshot) => {
    const data = snapshot.val() as Room | null;
    callback(data ? normalizeRoom(data) : null);
  });
}

export function startGame(code: string, byId: string): Promise<string | null> {
  return withRoom(code, (room) => {
    if (room.hostId !== byId) return "ホストのみ開始できます";
    if (room.status !== "lobby") return "すでに開始しています";
    if (room.playerOrder.length < 2) return "プレイヤーが2人以上必要です";
    room.status = "playing";
    room.dealerId = room.playerOrder[0];
    return startHand(room);
  });
}

export function sendAction(
  code: string,
  playerId: string,
  action: ActionInput,
): Promise<string | null> {
  return withRoom(code, (room) => applyAction(room, playerId, action));
}

export function sendDistribute(
  code: string,
  byId: string,
  winnersPerPot: string[][],
): Promise<string | null> {
  return withRoom(code, (room) => {
    if (room.hostId !== byId) return "ホストのみ操作できます";
    return distributePots(room, winnersPerPot);
  });
}

export function sendNextHand(code: string, byId: string): Promise<string | null> {
  return withRoom(code, (room) => {
    if (room.hostId !== byId) return "ホストのみ操作できます";
    if (room.hand && room.hand.phase !== "complete") {
      return "ハンドが終了していません";
    }
    return nextHand(room);
  });
}

/** バーストしたプレイヤーへの持ち直し(リバイ) */
export function sendRebuy(
  code: string,
  byId: string,
  targetId: string,
): Promise<string | null> {
  return withRoom(code, (room) => {
    if (room.hostId !== byId) return "ホストのみ操作できます";
    if (room.hand && room.hand.phase !== "complete") {
      return "ハンド終了後に操作してください";
    }
    const p = room.players[targetId];
    if (!p) return "プレイヤーが見つかりません";
    p.chips += room.settings.initialChips;
    return null;
  });
}

/** ブラインド額の変更(ハンド間のみ) */
export function sendUpdateBlinds(
  code: string,
  byId: string,
  smallBlind: number,
  bigBlind: number,
): Promise<string | null> {
  return withRoom(code, (room) => {
    if (room.hostId !== byId) return "ホストのみ操作できます";
    if (room.hand && room.hand.phase !== "complete") {
      return "ハンド終了後に変更してください";
    }
    if (
      !Number.isInteger(smallBlind) ||
      !Number.isInteger(bigBlind) ||
      smallBlind <= 0 ||
      bigBlind < smallBlind
    ) {
      return "ブラインド額が不正です(BB は SB 以上にしてください)";
    }
    room.settings.smallBlind = smallBlind;
    room.settings.bigBlind = bigBlind;
    return null;
  });
}

/** ルームの解散(ホストのみ) */
export async function deleteRoom(code: string, byId: string): Promise<string | null> {
  const snapshot = await get(roomRef(code));
  if (!snapshot.exists()) return null;
  const room = snapshot.val() as Room;
  if (room.hostId !== byId) return "ホストのみ解散できます";
  await set(roomRef(code), null);
  return null;
}
