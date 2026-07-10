// ゲーム全体で共有する型定義

export type Phase =
  | "preflop"
  | "flop"
  | "turn"
  | "river"
  | "showdown"
  | "complete";

export interface Settings {
  initialChips: number;
  smallBlind: number;
  bigBlind: number;
}

export interface Player {
  id: string;
  name: string;
  chips: number;
}

export interface PotInfo {
  amount: number;
  /** このポットを獲得する資格のあるプレイヤーID */
  eligible: string[];
}

export interface WinResult {
  playerId: string;
  amount: number;
}

export interface HandState {
  handNumber: number;
  dealerId: string;
  sbId: string;
  bbId: string;
  /** このハンドの参加者(席順)。ハンド開始時にチップを持っていた人 */
  participants: string[];
  phase: Phase;
  /** 現在のベッティングラウンドで各自が出した額 */
  bets: Record<string, number>;
  /** このハンドで各自が出した累計額(bets を含む) */
  committed: Record<string, number>;
  folded: Record<string, boolean>;
  allIn: Record<string, boolean>;
  /** 直近のフルレイズ以降にアクション済みか(レイズ権の管理に使う) */
  acted: Record<string, boolean>;
  /** 現在のラウンドでコールに必要な合計ベット額 */
  currentBet: number;
  /** 最低レイズ幅(直近のフルレイズの増分) */
  minRaise: number;
  actingId: string | null;
  /** ショーダウン時に確定するポット(未コール分は返却済み) */
  pots: PotInfo[] | null;
  /** ハンド終了時の獲得結果 */
  results: WinResult[] | null;
}

export type RoomStatus = "lobby" | "playing";

export interface Room {
  code: string;
  hostId: string;
  status: RoomStatus;
  settings: Settings;
  players: Record<string, Player>;
  /** 席順(参加順) */
  playerOrder: string[];
  dealerId: string | null;
  hand: HandState | null;
  createdAt: number;
}

export type ActionInput =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call" }
  | { type: "raise"; amount: number };
