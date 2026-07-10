// プレイヤーIDとルームコードの生成・保存

const PLAYER_ID_KEY = "poker-player-id";
const PLAYER_NAME_KEY = "poker-player-name";
const ROOM_CODE_KEY = "poker-room-code";

export function getPlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = "p_" + crypto.randomUUID().replaceAll("-", "").slice(0, 16);
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getSavedName(): string {
  return localStorage.getItem(PLAYER_NAME_KEY) ?? "";
}

export function saveName(name: string) {
  localStorage.setItem(PLAYER_NAME_KEY, name);
}

export function getSavedRoomCode(): string | null {
  return localStorage.getItem(ROOM_CODE_KEY);
}

export function saveRoomCode(code: string | null) {
  if (code) localStorage.setItem(ROOM_CODE_KEY, code);
  else localStorage.removeItem(ROOM_CODE_KEY);
}

// 紛らわしい文字(0/O, 1/I など)を除いた文字集合
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(): string {
  let code = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes) code += CODE_CHARS[b % CODE_CHARS.length];
  return code;
}
