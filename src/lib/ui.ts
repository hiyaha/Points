// 見た目まわりの小さなユーティリティ

/** プレイヤーIDから安定した色相(0-359)を作る。アバターの色分けに使う */
export function hueFromId(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function avatarGradient(id: string): string {
  const hue = hueFromId(id);
  return `linear-gradient(135deg, hsl(${hue} 65% 50%), hsl(${hue} 70% 32%))`;
}
