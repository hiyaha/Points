// 効果音とBGM。Web Audio API でその場で合成するため、
// 音声ファイルのダウンロードや著作権の心配が不要。

const SE_KEY = "poker-se-enabled";
const BGM_KEY = "poker-bgm-enabled";

let ctx: AudioContext | null = null;
let seGain: GainNode | null = null;
let bgmGain: GainNode | null = null;
let bgmTimer: ReturnType<typeof setInterval> | null = null;
let nextChordTime = 0;
let chordIndex = 0;

function readFlag(key: string, defaultOn: boolean): boolean {
  const v = localStorage.getItem(key);
  return v === null ? defaultOn : v === "1";
}

export function isSeEnabled(): boolean {
  return readFlag(SE_KEY, true);
}

export function isBgmEnabled(): boolean {
  return readFlag(BGM_KEY, true);
}

export function setSeEnabled(on: boolean) {
  localStorage.setItem(SE_KEY, on ? "1" : "0");
}

export function setBgmEnabled(on: boolean) {
  localStorage.setItem(BGM_KEY, on ? "1" : "0");
  if (on) startBgm();
  else stopBgm();
}

/**
 * 最初のユーザー操作(タップ等)で呼ぶ。
 * ブラウザの自動再生制限があるため AudioContext はここで初期化する。
 */
export function unlock() {
  if (!ctx) {
    ctx = new AudioContext();
    seGain = ctx.createGain();
    seGain.gain.value = 0.6;
    seGain.connect(ctx.destination);
    bgmGain = ctx.createGain();
    bgmGain.gain.value = 1;
    bgmGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  if (isBgmEnabled()) startBgm();
}

// ---------------------------------------------------------------------------
// 効果音の部品
// ---------------------------------------------------------------------------

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  at?: number;
  slideTo?: number;
}

function tone(freq: number, dur: number, opts: ToneOpts = {}) {
  if (!ctx || !seGain || !isSeEnabled()) return;
  const t = ctx.currentTime + (opts.at ?? 0);
  const osc = ctx.createOscillator();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t);
  if (opts.slideTo) {
    osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + dur);
  }
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(opts.gain ?? 0.2, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(seGain);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noiseBurst(
  dur: number,
  filterFrom: number,
  filterTo: number,
  gain: number,
  at = 0,
) {
  if (!ctx || !seGain || !isSeEnabled()) return;
  const t = ctx.currentTime + at;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFrom, t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(filterTo, 40), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(seGain);
  src.start(t);
  src.stop(t + dur + 0.05);
}

// ---------------------------------------------------------------------------
// 効果音
// ---------------------------------------------------------------------------

export const se = {
  /** チップを出す音(カチャッ) */
  chip() {
    tone(2100, 0.06, { type: "triangle", gain: 0.22 });
    tone(2700, 0.09, { type: "triangle", gain: 0.16, at: 0.05 });
  },
  /** フォールド(カードを滑らせる音) */
  fold() {
    noiseBurst(0.28, 1400, 220, 0.14);
  },
  /** チェック(テーブルをノックする音) */
  check() {
    tone(190, 0.07, { type: "sine", gain: 0.35 });
    tone(165, 0.08, { type: "sine", gain: 0.3, at: 0.12 });
  },
  /** オールイン(せり上がる音+チップ) */
  allIn() {
    tone(220, 0.5, { type: "sawtooth", gain: 0.1, slideTo: 700 });
    tone(2100, 0.06, { type: "triangle", gain: 0.2, at: 0.15 });
    tone(2500, 0.06, { type: "triangle", gain: 0.2, at: 0.28 });
    tone(2900, 0.09, { type: "triangle", gain: 0.18, at: 0.4 });
  },
  /** 勝利(ファンファーレ風アルペジオ) */
  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => tone(f, 0.4, { gain: 0.16, at: i * 0.09 }));
    tone(1318.5, 0.6, { gain: 0.12, at: 0.38 });
  },
  /** 自分の手番の通知 */
  turn() {
    tone(880, 0.18, { gain: 0.14 });
    tone(1174.66, 0.3, { gain: 0.11, at: 0.1 });
  },
  /** カードを配る音(次のストリートへ) */
  deal() {
    noiseBurst(0.05, 3000, 900, 0.12);
    noiseBurst(0.05, 3000, 900, 0.12, 0.09);
    noiseBurst(0.07, 2500, 700, 0.12, 0.18);
  },
};

// ---------------------------------------------------------------------------
// BGM: ローファイなコード進行(Dm7 → G7 → Cmaj7 → Am7)をループ
// ---------------------------------------------------------------------------

const CHORDS: number[][] = [
  [146.83, 174.61, 220.0, 261.63], // Dm7
  [196.0, 246.94, 293.66, 349.23], // G7
  [130.81, 164.81, 196.0, 246.94], // Cmaj7
  [110.0, 130.81, 164.81, 196.0], // Am7
];
const CHORD_DUR = 3.2;

function startBgm() {
  if (!ctx || !bgmGain || bgmTimer !== null) return;
  nextChordTime = ctx.currentTime + 0.15;
  bgmTimer = setInterval(() => {
    if (!ctx) return;
    while (nextChordTime < ctx.currentTime + 0.8) {
      playChord(CHORDS[chordIndex % CHORDS.length], nextChordTime);
      chordIndex++;
      nextChordTime += CHORD_DUR;
    }
  }, 250);
}

function stopBgm() {
  if (bgmTimer !== null) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
}

function playChord(freqs: number[], t: number) {
  const dur = CHORD_DUR + 0.8; // 次のコードと少し重ねてなめらかに
  for (const f of freqs) pad(f, t, dur, 0.028, "triangle");
  pad(freqs[0] / 2, t, dur, 0.05, "sine"); // ベース音
}

function pad(
  freq: number,
  t: number,
  dur: number,
  gain: number,
  type: OscillatorType,
) {
  if (!ctx || !bgmGain) return;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.9);
  g.gain.setValueAtTime(gain, t + dur - 1.0);
  g.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(g).connect(bgmGain);
  osc.start(t);
  osc.stop(t + dur + 0.1);
}
