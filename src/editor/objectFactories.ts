import type { WorldObject } from "../types";

/**
 * 一意なオブジェクトIDを生成する。
 * 既存のID設計と衝突を避けるためにタイムスタンプと短いランダム文字列を結合する。
 */
export function generateId(prefix: string = "obj"): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${ts}_${rand}`;
}

/**
 * 新規ワールドオブジェクトを共通初期値に基づいて作成する。
 */
export function createWorldObject(
  label: string,
  assetId?: string
): WorldObject {
  return {
    id: generateId(assetId || "obj"),
    checkpointId: 0,
    state: "REAL",
    label,
    assetId,
    relatedToNanami: false,
    onTruePath: false,
    changePattern: "A",
    eventSize: "small",
    beforeCaptured: false,
    afterCaptured: false,
    isRecorded: false,
    isResistant: false,
    branchFlag: null,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  };
}