import { useMemo } from "react";
import * as THREE from "three";

// =============================================================
// 街の環境（仕様 §2 / §15 世界の縮小演出）
// 地面・建物・看板土台。建物メッシュはコリジョン対象として
// 親へ渡す。進行度（checkpoint）に応じて密度を落とす。
// =============================================================

interface Props {
  /** 進行度 0..1（1 に近いほど街が縮む/疎になる） */
  decay: number;
  /** コリジョン対象メッシュの収集コールバック */
  onCollisionMesh: (mesh: THREE.Mesh | null) => void;
}

interface Building {
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
}

export function Street({ decay, onCollisionMesh }: Props) {
  const buildings = useMemo<Building[]>(
    () => [
      { pos: [-9, 3, -14], size: [6, 6, 4], color: "#3b3a36" },
      { pos: [9, 4, -14], size: [6, 8, 4], color: "#34332f" },
      { pos: [-9, 2.5, -22], size: [6, 5, 4], color: "#3f3e39" },
      { pos: [9, 3.5, -22], size: [6, 7, 4], color: "#33322d" },
      { pos: [-6, 1.5, -2], size: [3, 3, 3], color: "#454339" }, // コンビニ
      { pos: [7, 2, -10], size: [3, 4, 3], color: "#3a3933" },
    ],
    []
  );

  // 街灯/电柱（コスト感）
  const poles = useMemo(
    () => [-3, 3, -3, 3].map((x, i) => [x, 0, -4 - i * 6] as [number, number, number]),
    []
  );

  const groundColor = useMemo(() => {
    const c = new THREE.Color("#2a2a28").lerp(new THREE.Color("#1a1a1a"), decay);
    return `#${c.getHexString()}`;
  }, [decay]);

  return (
    <group>
      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -12]} receiveShadow>
        <planeGeometry args={[60, 70]} />
        <meshStandardMaterial color={groundColor} roughness={1} />
      </mesh>

      {/* 道路の中央線 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -16]}>
        <planeGeometry args={[0.3, 50]} />
        <meshStandardMaterial color="#c8b85a" opacity={0.4 * (1 - decay)} transparent />
      </mesh>

      {/* 建物（コリジョン対象） */}
      {buildings.map((b, i) => (
        <mesh
          key={i}
          position={b.pos}
          ref={(m) => onCollisionMesh(m)}
          castShadow
        >
          <boxGeometry args={b.size} />
          <meshStandardMaterial
            color={b.color}
            roughness={0.9}
            // decay が進むとテクスチャ解像度低下の代わりに彩度を落とす
            metalness={0}
          />
        </mesh>
      ))}

      {/* 電柱 */}
      {poles.map((p, i) => (
        <mesh key={`pole${i}`} position={[p[0], 2, p[2]]}>
          <cylinderGeometry args={[0.12, 0.12, 4, 8]} />
          <meshStandardMaterial color="#55524a" />
        </mesh>
      ))}

      {/* 看板土台（水科歯科） */}
      <mesh position={[-7, 2, -13.6]}>
        <boxGeometry args={[0.4, 4, 0.4]} />
        <meshStandardMaterial color="#4a4842" />
      </mesh>
    </group>
  );
}
