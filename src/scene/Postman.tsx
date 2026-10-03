import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../store/gameStore";
import { registerMesh, registerPhase } from "./animloopRegistry";

// ─── 通り抜けパラメータ ─────────────────────────────────────────
const Z_NEAR        =  3.5;   // 手前スタート
const Z_FAR         = -22.0;  // 奥のゴール
const CYCLE         = 60;     // 秒（1分に1回）
const CROSS_SEC     = 4.2;    // 通り抜けにかかる秒数
const POSTMAN_X     =  1.8;   // 通りの端（歩道）

export function Postman() {
  const outerRef         = useRef<THREE.Group>(null);
  const rootRef          = useRef<THREE.Group>(null);
  const leftHipRef       = useRef<THREE.Group>(null);
  const rightHipRef      = useRef<THREE.Group>(null);
  const leftShoulderRef  = useRef<THREE.Group>(null);
  const rightShoulderRef = useRef<THREE.Group>(null);

  const explorationMode = useGameStore((s) => s.explorationMode);
  const worldPaused     = useGameStore((s) => s.worldPaused);
  const modeRef    = useRef(explorationMode);
  const pausedRef  = useRef(worldPaused);
  modeRef.current   = explorationMode;
  pausedRef.current = worldPaused;

  // worldPaused になった瞬間の clock.elapsedTime を保持する
  const frozenTimeRef = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!outerRef.current) return;

    if (modeRef.current !== "replay") {
      outerRef.current.visible = false;
      frozenTimeRef.current = null;
      registerMesh("postman_cp3", null);
      return;
    }

    if (pausedRef.current) {
      // 初めて paused になったフレームで時刻を記憶
      if (frozenTimeRef.current === null) {
        frozenTimeRef.current = clock.elapsedTime;
      }
      const frozenTCycle = frozenTimeRef.current % CYCLE;
      // 通過中だった場合のみ現在位置で静止表示（ポーズ中はアニメ更新しない）
      if (frozenTCycle < CROSS_SEC) {
        outerRef.current.visible = true;
        outerRef.current.position.z = THREE.MathUtils.lerp(Z_NEAR, Z_FAR, frozenTCycle / CROSS_SEC);
        // 凍結中はポストマンが画面に映っている = after フェーズとして登録
        registerPhase("postman_cp3", "after");
        registerMesh("postman_cp3", outerRef.current);
      } else {
        outerRef.current.visible = false;
        registerMesh("postman_cp3", null);
      }
      return;
    }

    // 再生再開時にリセット
    frozenTimeRef.current = null;

    const tCycle = clock.elapsedTime % CYCLE;

    if (tCycle < CROSS_SEC) {
      outerRef.current.visible = true;
      outerRef.current.position.z = THREE.MathUtils.lerp(Z_NEAR, Z_FAR, tCycle / CROSS_SEC);
      registerPhase("postman_cp3", "after");
      registerMesh("postman_cp3", outerRef.current);

      // 走行アニメーション
      const t = clock.elapsedTime;
      const RUN = 7.5;
      if (rootRef.current)          rootRef.current.position.y = Math.abs(Math.sin(t * RUN)) * 0.08;
      const leg = Math.sin(t * RUN) * 0.60;
      if (leftHipRef.current)       leftHipRef.current.rotation.x  =  leg;
      if (rightHipRef.current)      rightHipRef.current.rotation.x = -leg;
      const arm = leg * 0.65;
      if (leftShoulderRef.current)  leftShoulderRef.current.rotation.x  = -arm;
      if (rightShoulderRef.current) rightShoulderRef.current.rotation.x  =  arm;
    } else {
      outerRef.current.visible = false;
    }
  });

  // 体型寸法（PrimitiveMob と共通スケール）
  const LEG_H  = 0.52;
  const BODY_H = 0.50;
  const NECK_H = 0.12;
  const HEAD_S = 0.40;
  const ARM_H  = 0.42;

  const hipY      = LEG_H;
  const bodyY     = hipY  + BODY_H / 2;
  const neckY     = hipY  + BODY_H + NECK_H / 2;
  const headY     = neckY + NECK_H / 2 + HEAD_S / 2;
  const shoulderY = hipY  + BODY_H;

  // 帽子寸法
  const hatBrimY  = headY + HEAD_S / 2 + 0.02;
  const hatBodyY  = headY + HEAD_S / 2 + 0.12;

  return (
    // rotationY=π で -Z 方向（奥）を向く
    <group ref={outerRef} position={[POSTMAN_X, 0, Z_NEAR]} rotation-y={Math.PI} userData={{ objectId: "postman_cp3" }}>
      <group ref={rootRef}>

        {/* ── 帽子ブリム（つば） ── */}
        <mesh position={[0, hatBrimY, 0.04]}>
          <boxGeometry args={[HEAD_S + 0.24, 0.05, HEAD_S + 0.18]} />
          <meshStandardMaterial color="#cc2222" />
        </mesh>

        {/* ── 帽子本体 ── */}
        <mesh position={[0, hatBodyY, 0]}>
          <boxGeometry args={[HEAD_S - 0.02, 0.24, HEAD_S - 0.02]} />
          <meshStandardMaterial color="#cc2222" />
        </mesh>

        {/* ── 頭 ── */}
        <mesh position={[0, headY, 0]}>
          <boxGeometry args={[HEAD_S, HEAD_S, HEAD_S]} />
          <meshStandardMaterial color="#e0b88a" />
        </mesh>

        {/* ── 首 ── */}
        <mesh position={[0, neckY, 0]}>
          <cylinderGeometry args={[0.07, 0.07, NECK_H, 6]} />
          <meshStandardMaterial color="#e0b88a" />
        </mesh>

        {/* ── 胴（赤い制服） ── */}
        <mesh position={[0, bodyY, 0]}>
          <boxGeometry args={[0.40, BODY_H, 0.20]} />
          <meshStandardMaterial color="#cc2222" />
        </mesh>

        {/* ── 郵便バッグ（右腰） ── */}
        <mesh position={[0.30, bodyY - 0.06, 0.12]}>
          <boxGeometry args={[0.18, 0.20, 0.10]} />
          <meshStandardMaterial color="#8a5a2a" />
        </mesh>

        {/* ── 左腕（肩 pivot） ── */}
        <group ref={leftShoulderRef} position={[-0.30, shoulderY, 0]}>
          <mesh position={[0, -ARM_H / 2, 0]}>
            <boxGeometry args={[0.14, ARM_H, 0.14]} />
            <meshStandardMaterial color="#cc2222" />
          </mesh>
        </group>

        {/* ── 右腕（肩 pivot） ── */}
        <group ref={rightShoulderRef} position={[0.30, shoulderY, 0]}>
          <mesh position={[0, -ARM_H / 2, 0]}>
            <boxGeometry args={[0.14, ARM_H, 0.14]} />
            <meshStandardMaterial color="#cc2222" />
          </mesh>
        </group>

        {/* ── 左脚（ヒップ pivot） ── */}
        <group ref={leftHipRef} position={[-0.10, hipY, 0]}>
          <mesh position={[0, -LEG_H / 2, 0]}>
            <boxGeometry args={[0.16, LEG_H, 0.16]} />
            <meshStandardMaterial color="#2a2a3a" />
          </mesh>
        </group>

        {/* ── 右脚（ヒップ pivot） ── */}
        <group ref={rightHipRef} position={[0.10, hipY, 0]}>
          <mesh position={[0, -LEG_H / 2, 0]}>
            <boxGeometry args={[0.16, LEG_H, 0.16]} />
            <meshStandardMaterial color="#2a2a3a" />
          </mesh>
        </group>

      </group>
    </group>
  );
}
