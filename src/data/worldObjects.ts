import type { WorldObject } from "../types";

// =============================================================
// 変化するワールドオブジェクトの定義
// 「変化が起こるのは毎回固定のオブジェクト」（仕様 memo）
// 各オブジェクトは before/after の二状態を持ち、その checkpointId で
// 出現する。値は data 駆動で増やせる。
// =============================================================

/** WorldObject の初期状態を生成するヘルパ */
function makeObject(
  partial: Pick<
    WorldObject,
    "id" | "checkpointId" | "label" | "changePattern" | "eventSize" | "position"
  > &
    Partial<WorldObject>
): WorldObject {
  return {
    state: "REAL",
    relatedToNanami: false,
    onTruePath: false,
    beforeCaptured: false,
    afterCaptured: false,
    isRecorded: false,
    isResistant: false,
    branchFlag: null,
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    ...partial,
  };
}

/**
 * 街に配置される変化オブジェクトのマスターデータ。
 * checkpointId はそのオブジェクトが「変化を見せ始める」CP。
 */
export const WORLD_OBJECTS: WorldObject[] = [
  // ── カントリーマアム：全ての縮小モチーフの起点（第1幕で目に見える A パターン）
  makeObject({
    id: "country_maam_size",
    checkpointId: 0,
    label: "カントリーマアム",
    changePattern: "A",
    eventSize: "large",
    position: [2.2, 1.1, -6],
    branchFlag: "branch_country_maam_001",
    onTruePath: true,
  }),
  // ── 歯科の巨大看板（院長の顔）：終盤スコープ必須・三海の歯に繋がる核
  makeObject({
    id: "dental_sign_face",
    checkpointId: 0,
    label: "水科歯科の看板（院長の顔）",
    changePattern: "B",
    eventSize: "large",
    position: [-7, 4.5, -14],
    relatedToNanami: true,
    onTruePath: true,
  }),
  // ── JK のスカート丈
  makeObject({
    id: "jk_skirt_length",
    checkpointId: 0,
    label: "女子高生のスカート丈",
    changePattern: "B",
    eventSize: "small",
    position: [5.5, 0.9, -10],
  }),
  // ── コンビニの棚の在庫
  makeObject({
    id: "conbini_stock",
    checkpointId: 0,
    label: "コンビニの棚の品数",
    changePattern: "B",
    eventSize: "small",
    position: [-4.5, 1.3, -3],
  }),
  // ── 通行人の数（コスト/シュリンク演出）
  makeObject({
    id: "pedestrian_count",
    checkpointId: 0,
    label: "通行人の数",
    changePattern: "C",
    eventSize: "small",
    position: [0, 0.9, -18],
  }),
  // ── 不審な郵便配達員（CP3〜）: 記録で水科歯科前バス停を解放
  makeObject({
    id: "postman_cp3",
    checkpointId: 3,
    label: "郵便配達員",
    changePattern: "A",
    eventSize: "large",
    position: [4.2, 0.9, -9],
    onTruePath: true,
    relatedToNanami: true,
    branchFlag: "branch_postman_001",
    unlocksLocation: "dental_bus_stop",
  }),
];

/** id から WorldObject を引く（ストア初期化用にディープコピーを返す） */
export function cloneWorldObjects(): WorldObject[] {
  return WORLD_OBJECTS.map((o) => ({
    ...o,
    position: [...o.position] as [number, number, number],
    rotation: [...o.rotation] as [number, number, number],
    scale: [...o.scale] as [number, number, number],
  }));
}