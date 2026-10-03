import * as THREE from "three";

// =============================================================
// animloop レジストリ
// 各変化オブジェクトが「今 before/after どちらのフェーズか」と
// レイキャスト用メッシュを登録する共有ストア。
// シャッター処理（中央レイキャスト）がここを参照して撮影判定する。
// =============================================================

export type Phase = "before" | "after";

interface Entry {
  phase: Phase;
  mesh: THREE.Object3D | null;
}

const registry = new Map<string, Entry>();

export function registerPhase(objectId: string, phase: Phase) {
  const e = registry.get(objectId);
  if (e) e.phase = phase;
  else registry.set(objectId, { phase, mesh: null });
}

export function registerMesh(objectId: string, mesh: THREE.Object3D | null) {
  const e = registry.get(objectId);
  if (e) e.mesh = mesh;
  else registry.set(objectId, { phase: "before", mesh });
}

export function getPhase(objectId: string): Phase {
  return registry.get(objectId)?.phase ?? "before";
}

/** 現在登録されている全レイキャスト対象メッシュ */
export function getRaycastMeshes(): THREE.Object3D[] {
  const meshes: THREE.Object3D[] = [];
  for (const e of registry.values()) if (e.mesh) meshes.push(e.mesh);
  return meshes;
}

export function clearRegistry() {
  registry.clear();
}
