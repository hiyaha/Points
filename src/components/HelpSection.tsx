import { useState } from "react";

const TERMS: { term: string; desc: string }[] = [
  {
    term: "ブラインド (SB / BB)",
    desc: "ゲーム開始時に強制的に出すチップ。SB(スモールブラインド)は少額、BB(ビッグブラインド)はその倍額が一般的です。毎ハンド、担当者が順番に回ります。",
  },
  {
    term: "ボタン (BTN)",
    desc: "ディーラーボタンの位置。ポストフロップ(フロップ以降)では最後に行動できるため、最も有利なポジションです。2人対戦ではBTNがSBを兼ねます。",
  },
  {
    term: "ポジション (UTG / MP / CO など)",
    desc: "席順による役割名。UTG(アンダーザガン)はBBの左隣で、プリフロップで最初に行動する最も不利な位置。CO(カットオフ)はBTNの右隣で有利。MP(ミドルポジション)はその中間。HJ(ハイジャック)はCOの右隣です。",
  },
  {
    term: "チェック",
    desc: "追加でチップを出さずにパスすること。誰もベットしていない場合、または自分がBBで全員がコールした場合に選べます。",
  },
  {
    term: "ベット / レイズ",
    desc: "チップを賭けること。最初に賭けるのが「ベット」、誰かのベットに上乗せするのが「レイズ」です。相手にプレッシャーをかけられます。",
  },
  {
    term: "コール",
    desc: "相手のベットと同じ額を出して勝負を続けること。チップが足りない場合は持っている分だけ出す「オールイン」になります。",
  },
  {
    term: "フォールド",
    desc: "手札を捨てて降りること。このハンドで賭けたチップは戻りませんが、それ以上の損失を避けられます。",
  },
  {
    term: "オールイン",
    desc: "持っているチップを全額賭けること。チップが足りない場合でも、持ち分だけで勝負に参加できます(サイドポットが作られます)。",
  },
  {
    term: "ポット",
    desc: "全員が賭けたチップの合計。勝者がこれを獲得します。複数のポット(サイドポット)に分かれることもあります。",
  },
  {
    term: "ショーダウン",
    desc: "全てのベッティングラウンドが終わった後、手札を見せ合って勝者を決めること。ホストが勝者を選択します。",
  },
  {
    term: "ハンド",
    desc: "カードが配られてから勝者が決まるまでの1回分のゲーム。プリフロップ→フロップ→ターン→リバーの4段階でベッティングが行われます。",
  },
  {
    term: "プリフロップ → リバー",
    desc: "プリフロップ: 手札2枚だけで最初のベット。フロップ: 場に3枚公開。ターン: 4枚目公開。リバー: 5枚目公開。手札2枚+場5枚の計7枚から最強の5枚で勝負します。",
  },
];

export function HelpTerms() {
  return (
    <div className="space-y-3">
      {TERMS.map((t) => (
        <div key={t.term}>
          <p className="text-sm font-bold text-amber-400">{t.term}</p>
          <p className="text-xs leading-relaxed text-stone-400">{t.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default function HelpSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-amber-500/10 bg-stone-950/40">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold text-stone-300 transition active:scale-[0.99]"
        onClick={() => setOpen(!open)}
      >
        <span>📖 ポーカー用語ガイド</span>
        <span
          className={`text-xs text-stone-500 transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>
      {open && (
        <div className="animate-fade-up border-t border-white/5 px-4 pb-4 pt-3">
          <HelpTerms />
        </div>
      )}
    </div>
  );
}
