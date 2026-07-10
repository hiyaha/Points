// テキサスホールデムのベッティングロジック(純粋関数)
// Firebase のトランザクション内で Room オブジェクトを直接書き換えて使う。
// 戻り値が string の場合はエラーメッセージ、null の場合は成功。

import type {
  ActionInput,
  HandState,
  Phase,
  PotInfo,
  Room,
} from "../types";

const STREETS: Phase[] = ["preflop", "flop", "turn", "river"];

// ---------------------------------------------------------------------------
// 正規化: Firebase RTDB は空オブジェクトや null のキーを削除するため、
// 読み込んだデータに必ずデフォルト値を補う。
// ---------------------------------------------------------------------------

export function normalizeHand(h: HandState): HandState {
  h.participants = h.participants ?? [];
  h.bets = h.bets ?? {};
  h.committed = h.committed ?? {};
  h.folded = h.folded ?? {};
  h.allIn = h.allIn ?? {};
  h.acted = h.acted ?? {};
  h.actingId = h.actingId ?? null;
  h.pots = h.pots ?? null;
  if (h.pots) {
    for (const pot of h.pots) pot.eligible = pot.eligible ?? [];
  }
  h.results = h.results ?? null;
  return h;
}

export function normalizeRoom(room: Room): Room {
  room.players = room.players ?? {};
  room.playerOrder = room.playerOrder ?? [];
  room.dealerId = room.dealerId ?? null;
  room.hand = room.hand ?? null;
  if (room.hand) normalizeHand(room.hand);
  return room;
}

// ---------------------------------------------------------------------------
// ハンドの開始
// ---------------------------------------------------------------------------

/** ディーラーボタンを次のチップ保有者へ回してから新しいハンドを開始する */
export function nextHand(room: Room): string | null {
  const alive = room.playerOrder.filter(
    (id) => (room.players[id]?.chips ?? 0) > 0,
  );
  if (alive.length < 2) return "チップを持つプレイヤーが2人以上必要です";
  const order = room.playerOrder;
  const cur = room.dealerId ? order.indexOf(room.dealerId) : -1;
  for (let i = 1; i <= order.length; i++) {
    const id = order[(cur + i + order.length) % order.length];
    if ((room.players[id]?.chips ?? 0) > 0) {
      room.dealerId = id;
      break;
    }
  }
  return startHand(room);
}

/** 現在の dealerId のままハンドを開始する(最初のハンド用) */
export function startHand(room: Room): string | null {
  const participants = room.playerOrder.filter(
    (id) => (room.players[id]?.chips ?? 0) > 0,
  );
  if (participants.length < 2) {
    return "チップを持つプレイヤーが2人以上必要です";
  }
  if (
    room.hand &&
    room.hand.phase !== "complete" &&
    room.hand.phase !== "showdown"
  ) {
    return "進行中のハンドがあります";
  }
  if (!room.dealerId || !participants.includes(room.dealerId)) {
    room.dealerId = participants[0];
  }

  const n = participants.length;
  const d = participants.indexOf(room.dealerId);
  // ヘッズアップ(2人)ではディーラーが SB を出し、プリフロップで先に行動する
  const sbIdx = n === 2 ? d : (d + 1) % n;
  const bbIdx = (sbIdx + 1) % n;

  const hand: HandState = {
    handNumber: (room.hand?.handNumber ?? 0) + 1,
    dealerId: room.dealerId,
    sbId: participants[sbIdx],
    bbId: participants[bbIdx],
    participants,
    phase: "preflop",
    bets: {},
    committed: {},
    folded: {},
    allIn: {},
    acted: {},
    // BB がチップ不足で全額出せなくても、コールに必要な額は BB のまま
    currentBet: room.settings.bigBlind,
    minRaise: room.settings.bigBlind,
    actingId: null,
    pots: null,
    results: null,
  };
  room.hand = hand;

  postBlind(room, hand.sbId, room.settings.smallBlind);
  postBlind(room, hand.bbId, room.settings.bigBlind);

  if (isBettingClosed(hand)) {
    // 両ブラインドともオールインなどでアクション不能な場合
    advanceStreet(room);
  } else {
    hand.actingId = nextToAct(hand, hand.bbId);
  }
  return null;
}

function postBlind(room: Room, id: string, amount: number) {
  const hand = room.hand!;
  const p = room.players[id];
  const pay = Math.min(amount, p.chips);
  p.chips -= pay;
  hand.bets[id] = (hand.bets[id] ?? 0) + pay;
  hand.committed[id] = (hand.committed[id] ?? 0) + pay;
  if (p.chips === 0) hand.allIn[id] = true;
}

// ---------------------------------------------------------------------------
// アクションの適用
// ---------------------------------------------------------------------------

export function applyAction(
  room: Room,
  playerId: string,
  action: ActionInput,
): string | null {
  const hand = room.hand;
  if (!hand || hand.phase === "showdown" || hand.phase === "complete") {
    return "現在アクションできません";
  }
  if (hand.actingId !== playerId) return "あなたの手番ではありません";

  const p = room.players[playerId];
  const myBet = hand.bets[playerId] ?? 0;
  const toCall = hand.currentBet - myBet;

  const pay = (amount: number) => {
    p.chips -= amount;
    hand.bets[playerId] = (hand.bets[playerId] ?? 0) + amount;
    hand.committed[playerId] = (hand.committed[playerId] ?? 0) + amount;
    if (p.chips === 0) hand.allIn[playerId] = true;
  };

  switch (action.type) {
    case "fold": {
      hand.folded[playerId] = true;
      break;
    }
    case "check": {
      if (toCall > 0) return "チェックできません(コールが必要です)";
      hand.acted[playerId] = true;
      break;
    }
    case "call": {
      if (toCall <= 0) return "コールの必要はありません(チェックできます)";
      pay(Math.min(toCall, p.chips)); // チップ不足ならオールインでコール
      hand.acted[playerId] = true;
      break;
    }
    case "raise": {
      const target = action.amount; // このラウンドの合計ベット額(レイズ「まで」)
      if (!Number.isInteger(target) || target <= 0) return "金額が不正です";
      if (hand.acted[playerId]) {
        // フルレイズ未満のオールインではレイズ権は復活しない(TDAルール)
        return "このラウンドではこれ以上レイズできません";
      }
      const maxTarget = myBet + p.chips;
      if (target > maxTarget) return "チップが足りません";
      if (target <= hand.currentBet) {
        return "現在のベット額より大きい額を指定してください";
      }
      const fullRaiseMin = hand.currentBet + hand.minRaise;
      const isAllIn = target === maxTarget;
      if (!isAllIn && target < fullRaiseMin) {
        return `最低レイズ額(合計)は ${fullRaiseMin} です`;
      }
      if (target >= fullRaiseMin) {
        // フルレイズ: 他のプレイヤーのレイズ権が復活する
        hand.minRaise = target - hand.currentBet;
        for (const id of hand.participants) {
          if (id !== playerId) delete hand.acted[id];
        }
      }
      // フルレイズ未満のオールインは currentBet だけ更新し minRaise は据え置き
      hand.currentBet = target;
      pay(target - myBet);
      hand.acted[playerId] = true;
      break;
    }
  }

  afterAction(room, playerId);
  return null;
}

/** UI 用: このプレイヤーに現在レイズ権があるか(チップの有無は呼び出し側で確認) */
export function canRaise(hand: HandState, playerId: string): boolean {
  return !hand.acted[playerId];
}

// ---------------------------------------------------------------------------
// 進行制御
// ---------------------------------------------------------------------------

function afterAction(room: Room, lastActor: string) {
  const hand = room.hand!;
  const inHand = hand.participants.filter((id) => !hand.folded[id]);
  if (inHand.length === 1) {
    finishByFold(room, inHand[0]);
    return;
  }
  if (isBettingClosed(hand)) {
    advanceStreet(room);
  } else {
    hand.actingId = nextToAct(hand, lastActor);
  }
}

function isBettingClosed(hand: HandState): boolean {
  const active = hand.participants.filter(
    (id) => !hand.folded[id] && !hand.allIn[id],
  );
  if (active.length === 0) return true;
  if (active.length === 1) {
    // 相手が全員オールイン/フォールド: ベット額さえ揃っていれば終了
    return (hand.bets[active[0]] ?? 0) >= hand.currentBet;
  }
  return active.every(
    (id) => hand.acted[id] && (hand.bets[id] ?? 0) === hand.currentBet,
  );
}

function nextToAct(hand: HandState, from: string): string | null {
  const order = hand.participants;
  const start = order.indexOf(from);
  for (let i = 1; i <= order.length; i++) {
    const id = order[(start + i) % order.length];
    if (hand.folded[id] || hand.allIn[id]) continue;
    if (!hand.acted[id] || (hand.bets[id] ?? 0) < hand.currentBet) return id;
  }
  return null;
}

function firstActiveAfterDealer(hand: HandState): string | null {
  const order = hand.participants;
  const start = order.indexOf(hand.dealerId);
  for (let i = 1; i <= order.length; i++) {
    const id = order[(start + i) % order.length];
    if (!hand.folded[id] && !hand.allIn[id]) return id;
  }
  return null;
}

function advanceStreet(room: Room) {
  const hand = room.hand!;
  for (;;) {
    const idx = STREETS.indexOf(hand.phase);
    if (hand.phase === "river" || idx === -1) {
      toShowdown(room);
      return;
    }
    hand.phase = STREETS[idx + 1];
    hand.bets = {};
    hand.currentBet = 0;
    hand.minRaise = room.settings.bigBlind;
    hand.acted = {};
    const active = hand.participants.filter(
      (id) => !hand.folded[id] && !hand.allIn[id],
    );
    if (active.length <= 1) continue; // ベット不能ならショーダウンまで進める
    hand.actingId = firstActiveAfterDealer(hand);
    return;
  }
}

function finishByFold(room: Room, winnerId: string) {
  const hand = room.hand!;
  const total = Object.values(hand.committed).reduce((a, b) => a + b, 0);
  room.players[winnerId].chips += total;
  hand.phase = "complete";
  hand.actingId = null;
  hand.results = [{ playerId: winnerId, amount: total }];
}

function toShowdown(room: Room) {
  const hand = room.hand!;
  hand.phase = "showdown";
  hand.actingId = null;
  const pots = computePots(hand);
  // 誰にもコールされなかった超過分(資格者が1人だけの最上位レイヤー)は返却
  while (pots.length > 0 && pots[pots.length - 1].eligible.length === 1) {
    const top = pots.pop()!;
    const id = top.eligible[0];
    room.players[id].chips += top.amount;
    hand.committed[id] -= top.amount;
  }
  hand.pots = pots;
}

// ---------------------------------------------------------------------------
// ポット計算と分配
// ---------------------------------------------------------------------------

/** committed からメインポット/サイドポットを計算する */
export function computePots(hand: HandState): PotInfo[] {
  const committed = hand.committed;
  const levels = [...new Set(Object.values(committed).filter((v) => v > 0))]
    .sort((a, b) => a - b);
  const pots: PotInfo[] = [];
  let prev = 0;
  for (const level of levels) {
    let amount = 0;
    for (const id of Object.keys(committed)) {
      amount += Math.max(0, Math.min(committed[id], level) - prev);
    }
    const eligible = hand.participants.filter(
      (id) => !hand.folded[id] && (committed[id] ?? 0) >= level,
    );
    const last = pots[pots.length - 1];
    if (last && sameMembers(last.eligible, eligible)) {
      last.amount += amount;
    } else {
      pots.push({ amount, eligible });
    }
    prev = level;
  }
  return pots;
}

function sameMembers(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}

/** ディーラーの左隣から順に並べた席順(端数チップの優先順位に使う) */
function seatOrderAfterDealer(hand: HandState): string[] {
  const order = hand.participants;
  const start = order.indexOf(hand.dealerId);
  return order.map((_, i) => order[(start + 1 + i) % order.length]);
}

/**
 * ショーダウンでホストが選んだ勝者にポットを分配する。
 * winnersPerPot[i] は hand.pots[i] の勝者(複数ならスプリット)。
 */
export function distributePots(
  room: Room,
  winnersPerPot: string[][],
): string | null {
  const hand = room.hand;
  if (!hand || hand.phase !== "showdown" || !hand.pots) {
    return "ショーダウン中ではありません";
  }
  if (winnersPerPot.length !== hand.pots.length) {
    return "すべてのポットの勝者を選択してください";
  }
  for (let i = 0; i < hand.pots.length; i++) {
    const winners = winnersPerPot[i] ?? [];
    if (winners.length === 0) return "勝者が選択されていないポットがあります";
    for (const w of winners) {
      if (!hand.pots[i].eligible.includes(w)) {
        return "このポットの獲得資格がないプレイヤーが含まれています";
      }
    }
  }

  const priority = seatOrderAfterDealer(hand);
  const winnings: Record<string, number> = {};
  for (let i = 0; i < hand.pots.length; i++) {
    const pot = hand.pots[i];
    const winners = [...winnersPerPot[i]].sort(
      (a, b) => priority.indexOf(a) - priority.indexOf(b),
    );
    const share = Math.floor(pot.amount / winners.length);
    let remainder = pot.amount - share * winners.length;
    for (const w of winners) {
      // 端数はディーラーの左隣に近い勝者から1枚ずつ
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      winnings[w] = (winnings[w] ?? 0) + share + extra;
    }
  }

  for (const [id, amount] of Object.entries(winnings)) {
    room.players[id].chips += amount;
  }
  hand.phase = "complete";
  hand.results = Object.entries(winnings).map(([playerId, amount]) => ({
    playerId,
    amount,
  }));
  return null;
}

// ---------------------------------------------------------------------------
// UI 補助
// ---------------------------------------------------------------------------

/** 現在のポット総額(進行中のベットを含む) */
export function totalPot(hand: HandState): number {
  return Object.values(hand.committed).reduce((a, b) => a + b, 0);
}

export const PHASE_LABELS: Record<Phase, string> = {
  preflop: "プリフロップ",
  flop: "フロップ",
  turn: "ターン",
  river: "リバー",
  showdown: "ショーダウン",
  complete: "ハンド終了",
};

export const PHASE_INSTRUCTIONS: Record<Phase, string> = {
  preflop: "各プレイヤーに手札を2枚ずつ配ってください",
  flop: "場にフロップ(3枚)を出してください",
  turn: "場にターン(4枚目)を出してください",
  river: "場にリバー(5枚目)を出してください",
  showdown: "残りのコミュニティカードを出し、手札を公開してください",
  complete: "",
};
