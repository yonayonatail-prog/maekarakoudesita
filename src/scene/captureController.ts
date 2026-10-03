import * as THREE from "three";
import type { CaptureResult } from "../types";
import { useGameStore } from "../store/gameStore";
import { getPhase, getRaycastMeshes } from "./animloopRegistry";

// =============================================================
// 撮影コントローラ
// - レンダラーとカメラを登録し、スクリーンショット取得とレイキャストを提供する。
// - shoot() は旧互換用。新UXでは HUD が captureScreenshot()+getFocusedObjectId() を直接使う。
// =============================================================

let activeCamera: THREE.Camera | null = null;
let activeRenderer: THREE.WebGLRenderer | null = null;
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

export function setCaptureCamera(camera: THREE.Camera | null) {
  activeCamera = camera;
}

export function setCaptureRenderer(renderer: THREE.WebGLRenderer | null) {
  activeRenderer = renderer;
}

/** 現在フレームのスクリーンショットを dataURL で返す */
export function captureScreenshot(): string | null {
  if (!activeRenderer) return null;
  return activeRenderer.domElement.toDataURL("image/jpeg", 0.92);
}

/** 中央に捉えているオブジェクト id */
export function getFocusedObjectId(): string | null {
  if (!activeCamera) return null;
  raycaster.setFromCamera(center, activeCamera);
  const hits = raycaster.intersectObjects(getRaycastMeshes(), false);
  for (const hit of hits) {
    const id = hit.object.userData?.objectId as string | undefined;
    if (id) return id;
  }
  return null;
}

/** @deprecated 旧スコープ方式の撮影。新UXでは使用しない。 */
export function shoot(): { result: CaptureResult; objectId: string | null; phase: "before" | "after" | null } {
  const objectId = getFocusedObjectId();
  if (!objectId) return { result: "MISS", objectId: null, phase: null };
  const phase = getPhase(objectId);
  const result = useGameStore.getState().captureObject(objectId, phase);
  return { result, objectId, phase };
}
