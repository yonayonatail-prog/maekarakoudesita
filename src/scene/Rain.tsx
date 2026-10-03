import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ============================================================
 * Rain — InstancedMesh による雨エフェクト
 *
 * ・1 ドローコールで数千粒を描画（InstancedMesh）
 * ・粒は細長いカプセル型（three r142 未満なら下のコメント参照）
 * ・useFrame で上→下へループ落下、wind で斜めに流れる
 * ============================================================ */

type RainProps = {
  /** 雨粒の数 */
  count?: number;
  /** 降雨エリアの [幅(x), 奥行(z)]。カメラ周辺をカバーするサイズに */
  area?: [number, number];
  /** 雨が発生する高さ（y=0 が地面想定） */
  height?: number;
  /** 風による水平ドリフト速度 [x, z]（単位/秒）。斜め降りの度合い */
  wind?: [number, number];
  /** 落下速度の [最小, 最大]（単位/秒） */
  speedRange?: [number, number];
  /** 雨粒（軌跡）の長さ */
  dropLength?: number;
  color?: string;
  opacity?: number;
};

type Drop = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion; // 速度ベクトル方向に傾けた回転（固定）
  lengthScale: number;
};

const UP = new THREE.Vector3(0, 1, 0);
const _dummy = new THREE.Object3D(); // 毎フレーム使い回すテンポラリ

export function Rain({
  count = 2500,
  area = [40, 40],
  height = 20,
  wind = [2.5, 0.5],
  speedRange = [14, 22],
  dropLength = 0.5,
  color = "#a8c8e8",
  opacity = 0.35,
}: RainProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  // 各粒の初期状態を一度だけ生成
  const drops = useMemo<Drop[]>(() => {
    const windVec = new THREE.Vector3(wind[0], 0, wind[1]);
    return Array.from({ length: count }, () => {
      const speed = THREE.MathUtils.randFloat(speedRange[0], speedRange[1]);
      // 速度 = 風（水平） + 落下（-y）。粒ごとに落下速度が違うので傾きも微妙に変わる
      const velocity = windVec.clone().setY(-speed);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        UP,
        velocity.clone().normalize()
      );
      return {
        position: new THREE.Vector3(
          THREE.MathUtils.randFloatSpread(area[0]),
          Math.random() * height,
          THREE.MathUtils.randFloatSpread(area[1])
        ),
        velocity,
        quaternion,
        lengthScale: THREE.MathUtils.randFloat(0.7, 1.4),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, area[0], area[1], height, wind[0], wind[1], speedRange[0], speedRange[1]]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // タブ復帰時などの巨大な delta で粒がワープするのを防ぐ
    const dt = Math.min(delta, 0.05);
    const halfX = area[0] / 2;
    const halfZ = area[1] / 2;

    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.position.addScaledVector(d.velocity, dt);

      // 地面より下に落ちたら上空へリスポーン（ザーザーとループ）
      if (d.position.y < 0) {
        d.position.y += height + Math.random() * 2;
        d.position.x = THREE.MathUtils.randFloatSpread(area[0]);
        d.position.z = THREE.MathUtils.randFloatSpread(area[1]);
      }

      // 風で流されてエリア外に出たら反対側にラップ（雨が偏らないように）
      if (d.position.x > halfX) d.position.x -= area[0];
      else if (d.position.x < -halfX) d.position.x += area[0];
      if (d.position.z > halfZ) d.position.z -= area[1];
      else if (d.position.z < -halfZ) d.position.z += area[1];

      _dummy.position.copy(d.position);
      _dummy.quaternion.copy(d.quaternion);
      _dummy.scale.set(1, d.lengthScale, 1);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false} // インスタンスが広範囲に散るためカリング無効化
      onUpdate={(self) => {
        self.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      }}
    >
      {/*
        細長いカプセル型。CapsuleGeometry は three r142 以降。
        古い three を使う場合は次の行に差し替え:
        <cylinderGeometry args={[0.008, 0.008, dropLength, 4, 1]} />
      */}
      <capsuleGeometry args={[0.01, dropLength, 2, 4]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false} // 半透明の粒同士の描画順アーティファクトを回避
      />
    </instancedMesh>
  );
}
