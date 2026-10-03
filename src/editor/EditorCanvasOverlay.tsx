import React, { useCallback, useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import { useEditorStore } from "./useEditorStore";

// =============================================================
// EditorCanvasOverlay — Raycaster + TransformControls + Outline
// §9 エディタキャンバスオーバーレイ
// =============================================================

export function EditorCanvasOverlay() {
  const scene = useThree((s) => s.scene);

  const selectedObjectId = useEditorStore((s) => s.selectedObjectId);
  const worldObjects = useEditorStore((s) => s.worldObjects);
  const gizmoMode = useEditorStore((s) => s.gizmoMode);
  const updateWorldObject = useEditorStore((s) => s.updateWorldObject);

  const transformRef = useRef<any>(null);

  // 選択中のオブジェクトをシーンから検索
  const selectedSceneObject = React.useMemo(() => {
    if (!selectedObjectId) return null;
    return scene.getObjectByName(`editor-obj-${selectedObjectId}`);
  }, [scene, selectedObjectId]);

  // TransformControlsの変更をStoreに反映
  const handleTransformChange = useCallback(() => {
    if (!selectedSceneObject || !selectedObjectId) return;
    const obj = worldObjects.find((o) => o.id === selectedObjectId);
    if (!obj) return;

    // TransformControlsは世界座標系でオブジェクトを変更する
    // ここでは位置・回転・スケールを取得してstoreに反映
    const pos = selectedSceneObject.position;
    const rot = selectedSceneObject.rotation;
    const scl = selectedSceneObject.scale;

    updateWorldObject(selectedObjectId, {
      position: [pos.x, pos.y, pos.z],
      rotation: [rot.x, rot.y, rot.z],
      scale: [scl.x, scl.y, scl.z],
    });
  }, [selectedObjectId, worldObjects, updateWorldObject, selectedSceneObject]);

  // Gizmoモードが変更されたら TransformControls のモードを更新
  useEffect(() => {
    if (transformRef.current) {
      transformRef.current.setMode(gizmoMode);
    }
  }, [gizmoMode]);

  if (!selectedSceneObject) return null;

  return (
    <TransformControls
      ref={transformRef}
      object={selectedSceneObject}
      mode={gizmoMode}
      onChange={handleTransformChange}
      onObjectChange={handleTransformChange}
    />
  );
}