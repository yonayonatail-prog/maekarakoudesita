// ホバー中のNPC情報（モジュールスコープ変数でR3F→DOM橋渡し）
let _hoveredNpcId: string | null = null;
let _hoveredNpcLabel: string | null = null;

export function setHoveredNpc(id: string | null, label: string | null) {
  _hoveredNpcId = id;
  _hoveredNpcLabel = label;
}

export function getHoveredNpcId(): string | null { return _hoveredNpcId; }
export function getHoveredNpcLabel(): string | null { return _hoveredNpcLabel; }
