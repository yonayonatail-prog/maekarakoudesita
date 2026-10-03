import { useMemo, useCallback, useEffect, useRef, Suspense } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useGLTF, TransformControls } from "@react-three/drei";
import { useEditorStore } from "./useEditorStore";
import { assetTemplates } from "./assetTemplates";
import type { WorldObject } from "../types";

// =============================================================
// EditorSceneObjects — エディタストアの WorldObjects を3Dシーンに描画
// TransformControls は選択オブジェクトにコロケートして配置する
// =============================================================

interface ModelProps {
  obj: WorldObject;
  modelPath: string;
  isSelected: boolean;
  gizmoMode: "translate" | "rotate" | "scale";
}

function EditorObjectModel({ obj, modelPath, isSelected, gizmoMode }: ModelProps) {
  const { scene } = useGLTF(modelPath);
  const updateWorldObject = useEditorStore((s) => s.updateWorldObject);
  const isDragging = useRef(false);

  // GLBモデルはルートから離れた内部オフセットを持つことがある。
  // その場合、cloneのルート（=ギズモ位置）とメッシュの描画位置がズレる。
  // 対策：cloneをバウンディングボックスでXZ中央・足元Y=0に補正してから
  // コンテナGroupに入れ、TransformControlsはコンテナに付ける。
  const container = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);

    // GLB内部オフセット補正
    const box = new THREE.Box3().setFromObject(clone);
    if (!box.isEmpty()) {
      const center = box.getCenter(new THREE.Vector3());
      const minY = box.min.y;
      clone.position.set(
        clone.position.x - center.x,
        clone.position.y - minY,
        clone.position.z - center.z
      );
    }

    const group = new THREE.Group();
    group.add(clone);

    // mount時の初期transform（以降はuseEffectで同期）
    group.position.set(obj.position[0], obj.position[1], obj.position[2]);
    group.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
    group.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);

    return group;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // ストア変更（TransformPanelなど）をコンテナに反映。
  // ドラッグ中はTransformControlsが直接書き換えているためスキップ。
  const [px, py, pz] = obj.position;
  const [rx, ry, rz] = obj.rotation;
  const [sx, sy, sz] = obj.scale;
  useEffect(() => {
    if (isDragging.current) return;
    container.position.set(px, py, pz);
    container.rotation.set(rx, ry, rz);
    container.scale.set(sx, sy, sz);
  }, [container, px, py, pz, rx, ry, rz, sx, sy, sz]);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    const pos = container.position;
    const rot = container.rotation;
    const scl = container.scale;
    updateWorldObject(obj.id, {
      position: [pos.x, pos.y, pos.z],
      rotation: [rot.x, rot.y, rot.z],
      scale: [scl.x, scl.y, scl.z],
    });
  }, [container, obj.id, updateWorldObject]);

  return (
    <>
      <primitive object={container} />
      {isSelected && (
        <TransformControls
          object={container}
          mode={gizmoMode}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
      )}
    </>
  );
}

function EditorObjectModelWithSuspense(props: ModelProps) {
  return (
    <Suspense fallback={null}>
      <EditorObjectModel {...props} />
    </Suspense>
  );
}

export function EditorSceneObjects() {
  const isEditorEnabled = useEditorStore((s) => s.isEditorEnabled);
  const worldObjects = useEditorStore((s) => s.worldObjects);
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId);
  const gizmoMode = useEditorStore((s) => s.gizmoMode);

  if (!isEditorEnabled) return null;

  return (
    <>
      {worldObjects.map((obj) => {
        if (!obj.assetId) return null;
        const template = assetTemplates.find((t) => t.id === obj.assetId);
        if (!template?.modelPath) return null;

        return (
          <EditorObjectModelWithSuspense
            key={obj.id}
            obj={obj}
            modelPath={template.modelPath}
            isSelected={obj.id === selectedObjectId}
            gizmoMode={gizmoMode}
          />
        );
      })}
    </>
  );
}
