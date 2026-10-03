import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { ChangePattern, WorldObject } from "../types";
import { registerMesh, registerPhase } from "./animloopRegistry";
import { useGameStore } from "../store/gameStore";

// =============================================================
// 変化オブジェクト（仕様 §3-1 animloop）
// before / after をループで交互に提示する。
// changePattern によりループ速度が変わる（A=露骨, C=一瞬）。
// 記録済み（RECORDED/RESISTANT）は変化が固定され色で示す。
// 上書き済み（OVERWRITTEN）は after に固定＝「前からこう」。
// =============================================================

// 仮実装: 本番アセット導入前は長スパンで変化させてプレイヤーに気づかれにくくする
const LOOP_SPEEDS: Record<ChangePattern, number> = {
  A: 14.0,
  B: 22.0,
  C: 34.0,
};

interface Props {
  object: WorldObject;
}

export function AnimLoopObject({ object }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const phaseRef = useRef<"before" | "after">("before");
  const blendRef = useRef(0);
  const worldPaused = useGameStore((s) => s.worldPaused);
  const worldPausedRef = useRef(false);
  worldPausedRef.current = worldPaused;
  const explorationMode = useGameStore((s) => s.explorationMode);
  const explorationModeRef = useRef<"before" | "replay">("before");
  explorationModeRef.current = explorationMode;
  const loop = LOOP_SPEEDS[object.changePattern];

  // before/after の見た目差分（オブジェクト種別で表現を変える）
  const visual = useMemo(() => deriveVisual(object), [object]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    if (explorationModeRef.current === "before") {
      // 記憶フェーズ: 変化前の姿で固定
      blendRef.current = 0;
    } else if (!worldPausedRef.current) {
      // 高速再生フェーズ: 通常アニメーション
      if (object.state === "OVERWRITTEN") {
        blendRef.current = 1;
      } else if (object.state === "RECORDED" || object.state === "RESISTANT") {
        blendRef.current = 0.5;
      } else {
        const t = (clock.elapsedTime % loop) / loop;
        blendRef.current = t < 0.5 ? t * 2 : (1 - t) * 2;
      }
    }

    const blend = blendRef.current;
    const phase: "before" | "after" = blend >= 0.5 ? "after" : "before";
    if (phase !== phaseRef.current) {
      phaseRef.current = phase;
      registerPhase(object.id, phase);
    }

    // スケール補間（縮小モチーフ）
    const s = THREE.MathUtils.lerp(visual.beforeScale, visual.afterScale, blend);
    groupRef.current.scale.setScalar(s);

    // 色補間
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.lerpColors(visual.beforeColor, visual.afterColor, blend);
      const recorded = object.state === "RECORDED" || object.state === "RESISTANT";
      mat.emissive.set(recorded ? (object.isResistant ? "#c8a85a" : "#2a4a6a") : "#000000");
      mat.emissiveIntensity = recorded ? 0.5 : 0;
    }
  });

  return (
    <group ref={groupRef} position={object.position}>
      <mesh
        ref={(m) => {
          meshRef.current = m;
          registerMesh(object.id, m);
        }}
        userData={{ objectId: object.id }}
      >
        <boxGeometry args={visual.size} />
        <meshStandardMaterial color={visual.beforeColor} roughness={0.7} />
      </mesh>
      <Text
        position={[0, visual.size[1] / 2 + 0.4, 0]}
        fontSize={0.28}
        color="#d8d4c8"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.01}
        outlineColor="#000"
      >
        {object.label}
      </Text>
    </group>
  );
}

interface Visual {
  size: [number, number, number];
  beforeScale: number;
  afterScale: number;
  beforeColor: THREE.Color;
  afterColor: THREE.Color;
}

function deriveVisual(object: WorldObject): Visual {
  switch (object.id) {
    case "country_maam_size":
      return {
        size: [1.0, 1.0, 0.4],
        beforeScale: 1.0,
        afterScale: 0.7, // 縮む
        beforeColor: new THREE.Color("#caa46a"),
        afterColor: new THREE.Color("#b8915a"),
      };
    case "dental_sign_face":
      return {
        size: [4, 2.2, 0.3],
        beforeScale: 1.0,
        afterScale: 1.0,
        beforeColor: new THREE.Color("#e8e2d0"),
        afterColor: new THREE.Color("#d8c8b0"), // 顔がじわっと変わる
      };
    case "jk_skirt_length":
      return {
        size: [0.5, 1.2, 0.3],
        beforeScale: 1.0,
        afterScale: 0.85,
        beforeColor: new THREE.Color("#3a4a6a"),
        afterColor: new THREE.Color("#2a3a55"),
      };
    case "conbini_stock":
      return {
        size: [2.0, 1.4, 0.6],
        beforeScale: 1.0,
        afterScale: 0.8,
        beforeColor: new THREE.Color("#5a8a6a"),
        afterColor: new THREE.Color("#456a52"),
      };
    case "pedestrian_count":
      return {
        size: [0.5, 1.7, 0.5],
        beforeScale: 1.0,
        afterScale: 0.6,
        beforeColor: new THREE.Color("#888"),
        afterColor: new THREE.Color("#555"),
      };
    case "postman_cp3":
      return {
        size: [0.45, 1.65, 0.45],
        beforeScale: 1.0,
        afterScale: 1.0,
        beforeColor: new THREE.Color("#2255aa"), // 青い制服
        afterColor: new THREE.Color("#aa2222"),  // 別人？赤みがかった姿
      };
    default:
      return {
        size: [1, 1, 1],
        beforeScale: 1,
        afterScale: 0.8,
        beforeColor: new THREE.Color("#888"),
        afterColor: new THREE.Color("#666"),
      };
  }
}
