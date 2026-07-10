import { describe, expect, it } from "vitest";
import type { Room } from "../types";
import {
  applyAction,
  canRaise,
  distributePots,
  nextHand,
  startHand,
  totalPot,
} from "./poker";

// p0, p1, p2, ... という ID のプレイヤーでルームを作る
function makeRoom(chips: number[], sb = 10, bb = 20): Room {
  const players: Room["players"] = {};
  const playerOrder: string[] = [];
  chips.forEach((c, i) => {
    const id = `p${i}`;
    players[id] = { id, name: `Player${i}`, chips: c };
    playerOrder.push(id);
  });
  return {
    code: "TEST01",
    hostId: "p0",
    status: "playing",
    settings: { initialChips: 1000, smallBlind: sb, bigBlind: bb },
    players,
    playerOrder,
    dealerId: "p0",
    hand: null,
    createdAt: 0,
  };
}

describe("ハンド開始とブラインド", () => {
  it("3人: ディーラーの左隣が SB、その隣が BB、UTG(=ディーラー)から行動", () => {
    const room = makeRoom([1000, 1000, 1000]);
    expect(startHand(room)).toBeNull();
    const h = room.hand!;
    expect(h.sbId).toBe("p1");
    expect(h.bbId).toBe("p2");
    expect(room.players.p1.chips).toBe(990);
    expect(room.players.p2.chips).toBe(980);
    expect(h.currentBet).toBe(20);
    expect(h.minRaise).toBe(20);
    // 3人ではBBの次 = ディーラー(p0)がUTG
    expect(h.actingId).toBe("p0");
  });

  it("ヘッズアップ: ディーラーが SB を出しプリフロップで先に行動する", () => {
    const room = makeRoom([1000, 1000]);
    expect(startHand(room)).toBeNull();
    const h = room.hand!;
    expect(h.sbId).toBe("p0"); // ディーラー = SB
    expect(h.bbId).toBe("p1");
    expect(h.actingId).toBe("p0"); // プリフロップはディーラーから
  });

  it("ヘッズアップ: フロップ以降は BB(非ディーラー)から行動する", () => {
    const room = makeRoom([1000, 1000]);
    startHand(room);
    expect(applyAction(room, "p0", { type: "call" })).toBeNull();
    expect(applyAction(room, "p1", { type: "check" })).toBeNull();
    const h = room.hand!;
    expect(h.phase).toBe("flop");
    expect(h.actingId).toBe("p1");
  });

  it("ブラインドを払いきれないプレイヤーはその分だけオールインになる", () => {
    const room = makeRoom([1000, 1000, 15]); // p2 が BB だが 15 しかない
    startHand(room);
    const h = room.hand!;
    expect(room.players.p2.chips).toBe(0);
    expect(h.allIn.p2).toBe(true);
    expect(h.committed.p2).toBe(15);
    // コールに必要な額は BB の 20 のまま
    expect(h.currentBet).toBe(20);
  });

  it("両者ともブラインドでオールインなら即ショーダウンし超過分は返却", () => {
    const room = makeRoom([5, 15]); // HU: p0=SB(5), p1=BB(15)
    startHand(room);
    const h = room.hand!;
    expect(h.phase).toBe("showdown");
    // p1 の 15 のうちマッチしない 10 は返却される
    expect(room.players.p1.chips).toBe(10);
    expect(h.pots).toEqual([{ amount: 10, eligible: ["p0", "p1"] }]);
  });
});

describe("ベッティングラウンドの進行", () => {
  it("BB にはオプションがある(全員コールでも BB は行動できる)", () => {
    const room = makeRoom([1000, 1000, 1000]);
    startHand(room);
    applyAction(room, "p0", { type: "call" });
    applyAction(room, "p1", { type: "call" });
    const h = room.hand!;
    // 全員 20 だが BB(p2) はまだ行動していない
    expect(h.phase).toBe("preflop");
    expect(h.actingId).toBe("p2");
    // BB はレイズもできる
    expect(canRaise(h, "p2")).toBe(true);
    expect(applyAction(room, "p2", { type: "check" })).toBeNull();
    expect(h.phase).toBe("flop");
  });

  it("フロップ以降はディーラーの左隣から行動する", () => {
    const room = makeRoom([1000, 1000, 1000]);
    startHand(room);
    applyAction(room, "p0", { type: "call" });
    applyAction(room, "p1", { type: "call" });
    applyAction(room, "p2", { type: "check" });
    const h = room.hand!;
    expect(h.phase).toBe("flop");
    expect(h.actingId).toBe("p1"); // ディーラー p0 の左隣
    expect(h.currentBet).toBe(0);
  });

  it("コールが必要な場面でチェックはできない", () => {
    const room = makeRoom([1000, 1000, 1000]);
    startHand(room);
    expect(applyAction(room, "p0", { type: "check" })).not.toBeNull();
  });

  it("手番以外のプレイヤーは行動できない", () => {
    const room = makeRoom([1000, 1000, 1000]);
    startHand(room);
    expect(applyAction(room, "p1", { type: "call" })).not.toBeNull();
  });

  it("全員がフォールドしたら残った1人がポットを獲得してハンド終了", () => {
    const room = makeRoom([1000, 1000, 1000]);
    startHand(room);
    applyAction(room, "p0", { type: "raise", amount: 100 });
    applyAction(room, "p1", { type: "fold" });
    applyAction(room, "p2", { type: "fold" });
    const h = room.hand!;
    expect(h.phase).toBe("complete");
    // p0: 1000 - 100 + (100 + SB10 + BB20) = 1030
    expect(room.players.p0.chips).toBe(1030);
    expect(h.results).toEqual([{ playerId: "p0", amount: 130 }]);
  });
});

describe("レイズのルール", () => {
  it("最低レイズ幅は直前のレイズ幅(最初は BB)", () => {
    const room = makeRoom([1000, 1000, 1000]);
    startHand(room);
    // 最低レイズは 20+20=40
    expect(applyAction(room, "p0", { type: "raise", amount: 39 })).not.toBeNull();
    expect(applyAction(room, "p0", { type: "raise", amount: 40 })).toBeNull();
    // 次の最低レイズは 40+20=60
    expect(applyAction(room, "p1", { type: "raise", amount: 59 })).not.toBeNull();
    expect(applyAction(room, "p1", { type: "raise", amount: 100 })).toBeNull();
    // p1 が 60 幅のレイズをしたので次の最低レイズは 100+60=160
    const h = room.hand!;
    expect(h.minRaise).toBe(60);
    expect(applyAction(room, "p2", { type: "raise", amount: 159 })).not.toBeNull();
    expect(applyAction(room, "p2", { type: "raise", amount: 160 })).toBeNull();
  });

  it("フルレイズ未満のオールインでは行動済みプレイヤーのレイズ権は復活しない", () => {
    const room = makeRoom([1000, 1000, 130]);
    startHand(room);
    applyAction(room, "p0", { type: "raise", amount: 100 }); // minRaise=80
    applyAction(room, "p1", { type: "call" });
    // p2(BB) が 130 でオールイン: フルレイズ(180)未満
    expect(applyAction(room, "p2", { type: "raise", amount: 130 })).toBeNull();
    const h = room.hand!;
    expect(h.currentBet).toBe(130);
    expect(h.minRaise).toBe(80); // 据え置き
    // p0 はコール/フォールドのみ(レイズ不可)
    expect(h.actingId).toBe("p0");
    expect(canRaise(h, "p0")).toBe(false);
    expect(applyAction(room, "p0", { type: "raise", amount: 210 })).not.toBeNull();
    expect(applyAction(room, "p0", { type: "call" })).toBeNull();
    expect(applyAction(room, "p1", { type: "call" })).toBeNull();
    expect(room.hand!.phase).toBe("flop");
  });

  it("フルレイズのオールインなら行動済みプレイヤーもレイズできる", () => {
    const room = makeRoom([1000, 1000, 200]);
    startHand(room);
    applyAction(room, "p0", { type: "raise", amount: 100 }); // minRaise=80
    applyAction(room, "p1", { type: "call" });
    // p2 が 200 でオールイン: 100+80=180 以上なのでフルレイズ
    expect(applyAction(room, "p2", { type: "raise", amount: 200 })).toBeNull();
    const h = room.hand!;
    expect(h.minRaise).toBe(100);
    expect(canRaise(h, "p0")).toBe(true);
    expect(applyAction(room, "p0", { type: "raise", amount: 300 })).toBeNull();
  });

  it("チップが足りない額のレイズはできない", () => {
    const room = makeRoom([50, 1000, 1000]);
    startHand(room);
    expect(applyAction(room, "p0", { type: "raise", amount: 51 })).not.toBeNull();
    expect(applyAction(room, "p0", { type: "raise", amount: 50 })).toBeNull(); // オールイン
    expect(room.hand!.allIn.p0).toBe(true);
  });

  it("チップ不足のコールはオールインになる", () => {
    const room = makeRoom([1000, 1000, 1000]);
    startHand(room);
    applyAction(room, "p0", { type: "raise", amount: 500 });
    room.players.p1.chips = 40; // SB 済みなので残り 40
    expect(applyAction(room, "p1", { type: "call" })).toBeNull();
    const h = room.hand!;
    expect(h.allIn.p1).toBe(true);
    expect(h.committed.p1).toBe(50); // SB10 + 40
  });
});

describe("サイドポットと分配", () => {
  it("3人オールインで額が違えばサイドポットができ、超過分は返却される", () => {
    const room = makeRoom([1000, 300, 100]);
    startHand(room); // p1=SB(10), p2=BB(20)
    applyAction(room, "p0", { type: "raise", amount: 1000 });
    applyAction(room, "p1", { type: "call" }); // 300 でオールイン
    applyAction(room, "p2", { type: "call" }); // 100 でオールイン
    const h = room.hand!;
    expect(h.phase).toBe("showdown");
    // p0 の 1000 のうち誰にもコールされない 700 は返却
    expect(room.players.p0.chips).toBe(700);
    expect(h.pots).toEqual([
      { amount: 300, eligible: ["p0", "p1", "p2"] }, // メイン: 100×3
      { amount: 400, eligible: ["p0", "p1"] }, // サイド: 200×2
    ]);
    // p2 がメイン、p1 がサイドを獲得
    expect(distributePots(room, [["p2"], ["p1"]])).toBeNull();
    expect(room.players.p2.chips).toBe(300);
    expect(room.players.p1.chips).toBe(400);
    // チップ総量は不変
    const total = Object.values(room.players).reduce((a, p) => a + p.chips, 0);
    expect(total).toBe(1400);
  });

  it("フォールドしたプレイヤーのチップもポットに含まれ、獲得資格はない", () => {
    const room = makeRoom([1000, 1000, 1000]);
    startHand(room);
    applyAction(room, "p0", { type: "raise", amount: 100 });
    applyAction(room, "p1", { type: "call" });
    applyAction(room, "p2", { type: "fold" }); // BB 20 はポットに残る
    // フロップ以降全員チェックでショーダウンへ
    for (const street of ["flop", "turn", "river"]) {
      expect(room.hand!.phase).toBe(street);
      applyAction(room, "p1", { type: "check" });
      applyAction(room, "p0", { type: "check" });
    }
    const h = room.hand!;
    expect(h.phase).toBe("showdown");
    expect(h.pots).toEqual([{ amount: 220, eligible: ["p0", "p1"] }]);
  });

  it("スプリットポットの端数はディーラーの左隣に近い勝者が受け取る", () => {
    const room = makeRoom([1000, 1000, 1000], 10, 20);
    startHand(room);
    applyAction(room, "p0", { type: "call" });
    applyAction(room, "p1", { type: "call" });
    applyAction(room, "p2", { type: "check" }); // ポット 60
    // フロップ: p1 が 25 ベット、全員コール → ポット 135
    applyAction(room, "p1", { type: "raise", amount: 25 });
    applyAction(room, "p2", { type: "call" });
    applyAction(room, "p0", { type: "call" });
    // ターン・リバーは全員チェック
    for (let i = 0; i < 2; i++) {
      applyAction(room, "p1", { type: "check" });
      applyAction(room, "p2", { type: "check" });
      applyAction(room, "p0", { type: "check" });
    }
    const h = room.hand!;
    expect(h.phase).toBe("showdown");
    expect(totalPot(h)).toBe(135);
    // p0 と p2 のチョップ: 67 ずつ + 端数 1 はディーラー(p0)の左隣に近い p2 へ
    expect(distributePots(room, [["p0", "p2"]])).toBeNull();
    expect(room.players.p2.chips).toBe(1000 - 45 + 68);
    expect(room.players.p0.chips).toBe(1000 - 45 + 67);
  });

  it("獲得資格のないプレイヤーを勝者に選ぶとエラー", () => {
    const room = makeRoom([1000, 300, 100]);
    startHand(room);
    applyAction(room, "p0", { type: "raise", amount: 1000 });
    applyAction(room, "p1", { type: "call" });
    applyAction(room, "p2", { type: "call" });
    // サイドポット(p0, p1 のみ資格)に p2 を指定
    expect(distributePots(room, [["p2"], ["p2"]])).not.toBeNull();
  });
});

describe("ハンドをまたぐ進行", () => {
  it("ディーラーボタンは次のチップ保有者へ移動する", () => {
    const room = makeRoom([1000, 1000, 1000]);
    startHand(room);
    // p0 レイズ → 全員フォールドでハンド終了
    applyAction(room, "p0", { type: "raise", amount: 100 });
    applyAction(room, "p1", { type: "fold" });
    applyAction(room, "p2", { type: "fold" });
    expect(room.hand!.phase).toBe("complete");
    expect(nextHand(room)).toBeNull();
    expect(room.dealerId).toBe("p1");
    expect(room.hand!.handNumber).toBe(2);
  });

  it("チップが尽きたプレイヤーは次のハンドに参加しない", () => {
    const room = makeRoom([1000, 1000, 0]);
    expect(startHand(room)).toBeNull();
    expect(room.hand!.participants).toEqual(["p0", "p1"]);
  });

  it("チップ保有者が1人だけならハンドを開始できない", () => {
    const room = makeRoom([1000, 0, 0]);
    expect(startHand(room)).not.toBeNull();
  });

  it("複数ストリートにまたがるベットが committed に累積される", () => {
    const room = makeRoom([1000, 1000]);
    startHand(room); // HU: p0=SB
    applyAction(room, "p0", { type: "call" }); // 20
    applyAction(room, "p1", { type: "check" });
    // フロップ: p1 ベット 50、p0 コール
    applyAction(room, "p1", { type: "raise", amount: 50 });
    applyAction(room, "p0", { type: "call" });
    const h = room.hand!;
    expect(h.phase).toBe("turn");
    expect(h.committed.p0).toBe(70);
    expect(h.committed.p1).toBe(70);
    expect(totalPot(h)).toBe(140);
    expect(h.bets).toEqual({}); // 新しいストリートではリセット
  });
});
