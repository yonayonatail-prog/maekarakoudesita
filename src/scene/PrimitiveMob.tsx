import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── スプライトシート（4表情 × 64px） ────────────────────────────

const FACE_FRAMES = 4;
const FW = 64;
const FH = 64;

type Expr = "neutral" | "smile" | "surprised" | "sleepy";
const EXPRS: Expr[] = ["neutral", "smile", "surprised", "sleepy"];

function drawFace(ctx: CanvasRenderingContext2D, fi: number, expr: Expr) {
  const ox = fi * FW;
  const cx = ox + FW / 2;
  const cy = FH / 2;

  ctx.fillStyle = "#e0b88a";
  ctx.fillRect(ox, 0, FW, FH);
  ctx.fillStyle = "#1a1008";

  if (expr === "neutral") {
    ctx.fillRect(cx - 20, cy - 10, 13, 4);
    ctx.fillRect(cx +  7, cy - 10, 13, 4);
    ctx.strokeStyle = "#1a1008"; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx - 9, cy + 14); ctx.lineTo(cx + 9, cy + 14); ctx.stroke();

  } else if (expr === "smile") {
    ctx.fillRect(cx - 19, cy - 10, 11, 5);
    ctx.fillRect(cx +  8, cy - 10, 11, 5);
    ctx.strokeStyle = "#1a1008"; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cx, cy + 5, 12, 0.2, Math.PI - 0.2); ctx.stroke();

  } else if (expr === "surprised") {
    ctx.beginPath(); ctx.arc(cx - 14, cy - 7, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 14, cy - 7, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx - 14, cy - 7, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 14, cy - 7, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1a1008";
    ctx.beginPath(); ctx.arc(cx - 13, cy - 7, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 13, cy - 7, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy + 14, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#6a1a10";
    ctx.beginPath(); ctx.arc(cx, cy + 14, 5, 0, Math.PI * 2); ctx.fill();

  } else { // sleepy
    ctx.fillRect(cx - 19, cy - 10, 13, 3);
    ctx.fillRect(cx +  7, cy - 10, 13, 3);
    ctx.fillRect(cx - 19, cy -  5, 13, 6);
    ctx.fillRect(cx +  7, cy -  5, 13, 6);
    ctx.strokeStyle = "#1a1008"; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx - 8, cy + 16); ctx.lineTo(cx + 8, cy + 16); ctx.stroke();
  }
}

function buildFaceSpriteSheet(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width  = FW * FACE_FRAMES;
  canvas.height = FH;
  const ctx = canvas.getContext("2d")!;
  EXPRS.forEach((expr, i) => drawFace(ctx, i, expr));
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS     = THREE.RepeatWrapping;
  tex.repeat.set(1 / FACE_FRAMES, 1);
  return tex;
}

let _sheet: THREE.CanvasTexture | null = null;
const getSheet = (): THREE.CanvasTexture => (_sheet ??= buildFaceSpriteSheet());

// ─── 歩行 Z レンジ ──────────────────────────────────────────────

const Z_NEAR  =  3.5;
const Z_FAR   = -22.0;
const Z_RANGE = Z_NEAR - Z_FAR; // 25.5

// ─── コンポーネント ──────────────────────────────────────────────

export interface PrimitiveMobProps {
  position:       [number, number, number]; // 歩行時は [x, y, *] (Z は自動上書き)
  rotationY?:     number;
  skinColor?:     string;
  hairColor?:     string;
  clothColor?:    string;
  pantsColor?:    string;
  exprInterval?:  number; // 表情切替秒数
  walkSpeed?:     number; // 脚・腕サイクル速度
  phase?:         number; // アニメ位相オフセット
  // 通り移動
  moveDirection?: -1 | 1; // -1: 手前→奥, 1: 奥→手前
  moveZSpeed?:    number;  // 移動速度 units/sec
  moveZPhase?:    number;  // Z 初期フェーズ (0 ~ Z_RANGE 内)
}

export function PrimitiveMob({
  position,
  rotationY      = 0,
  skinColor      = "#e0b88a",
  hairColor      = "#2a1a0a",
  clothColor     = "#4a506a",
  pantsColor     = "#2a2a3a",
  exprInterval   = 2.5,
  walkSpeed      = 3.0,
  phase          = 0,
  moveDirection,
  moveZSpeed     = 2.0,
  moveZPhase     = 0,
}: PrimitiveMobProps) {
  const outerRef         = useRef<THREE.Group>(null);
  const rootRef          = useRef<THREE.Group>(null);
  const leftHipRef       = useRef<THREE.Group>(null);
  const rightHipRef      = useRef<THREE.Group>(null);
  const leftShoulderRef  = useRef<THREE.Group>(null);
  const rightShoulderRef = useRef<THREE.Group>(null);

  // 共有シートをクローン → インスタンスごとに独立した offset
  const faceTex = useMemo(() => {
    const t = getSheet().clone();
    t.needsUpdate = true;
    return t;
  }, []);
  useEffect(() => () => faceTex.dispose(), [faceTex]);

  // BoxGeometry 6面: +x, -x, +y, -y, +z(前), -z(後)
  const headMats = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: skinColor }),
      new THREE.MeshStandardMaterial({ color: skinColor }),
      new THREE.MeshStandardMaterial({ color: skinColor }),
      new THREE.MeshStandardMaterial({ color: skinColor }),
      new THREE.MeshStandardMaterial({ map: faceTex }),   // +z 前面 = 顔
      new THREE.MeshStandardMaterial({ color: skinColor }),
    ],
    [skinColor, faceTex]
  );
  useEffect(() => () => headMats.forEach((m) => m.dispose()), [headMats]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;

    // 表情フレーム切替
    faceTex.offset.x = (Math.floor(t / exprInterval) % FACE_FRAMES) / FACE_FRAMES;

    // Z 方向移動（ループ）
    if (moveDirection !== undefined && outerRef.current) {
      const looped = ((moveZPhase + moveZSpeed * clock.elapsedTime) % Z_RANGE + Z_RANGE) % Z_RANGE;
      outerRef.current.position.z =
        moveDirection > 0 ? Z_FAR + looped : Z_NEAR - looped;
    }

    // 上下ボブ
    if (rootRef.current) {
      rootRef.current.position.y = Math.abs(Math.sin(t * walkSpeed)) * 0.045;
    }

    // 脚スイング（ヒップ pivot）
    const legSwing = Math.sin(t * walkSpeed) * 0.38;
    if (leftHipRef.current)  leftHipRef.current.rotation.x  =  legSwing;
    if (rightHipRef.current) rightHipRef.current.rotation.x = -legSwing;

    // 腕スイング（肩 pivot・脚と逆位相）
    const armSwing = legSwing * 0.65;
    if (leftShoulderRef.current)  leftShoulderRef.current.rotation.x  = -armSwing;
    if (rightShoulderRef.current) rightShoulderRef.current.rotation.x  =  armSwing;
  });

  // 寸法（下端 y=0 基準）
  const LEG_H  = 0.52;
  const BODY_H = 0.50;
  const NECK_H = 0.12;
  const HEAD_S = 0.40;
  const ARM_H  = 0.42;
  const HAIR_T = 0.08;

  const hipY      = LEG_H;
  const bodyY     = hipY  + BODY_H / 2;
  const neckY     = hipY  + BODY_H + NECK_H / 2;
  const headY     = neckY + NECK_H / 2 + HEAD_S / 2;
  const hairY     = headY + HEAD_S  / 2 + HAIR_T / 2;
  const shoulderY = hipY  + BODY_H; // 腕 pivot（肩）

  return (
    <group ref={outerRef} position={position} rotation-y={rotationY}>
      <group ref={rootRef}>

        {/* 髪 */}
        <mesh position={[0, hairY, 0]}>
          <boxGeometry args={[HEAD_S + 0.06, HAIR_T, HEAD_S + 0.06]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>

        {/* 頭（前面に顔テクスチャ） */}
        <mesh position={[0, headY, 0]} material={headMats}>
          <boxGeometry args={[HEAD_S, HEAD_S, HEAD_S]} />
        </mesh>

        {/* 首 */}
        <mesh position={[0, neckY, 0]}>
          <cylinderGeometry args={[0.07, 0.07, NECK_H, 6]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>

        {/* 胴 */}
        <mesh position={[0, bodyY, 0]}>
          <boxGeometry args={[0.40, BODY_H, 0.20]} />
          <meshStandardMaterial color={clothColor} />
        </mesh>

        {/* 左腕（肩 pivot） */}
        <group ref={leftShoulderRef} position={[-0.30, shoulderY, 0]}>
          <mesh position={[0, -ARM_H / 2, 0]}>
            <boxGeometry args={[0.14, ARM_H, 0.14]} />
            <meshStandardMaterial color={clothColor} />
          </mesh>
        </group>

        {/* 右腕（肩 pivot） */}
        <group ref={rightShoulderRef} position={[0.30, shoulderY, 0]}>
          <mesh position={[0, -ARM_H / 2, 0]}>
            <boxGeometry args={[0.14, ARM_H, 0.14]} />
            <meshStandardMaterial color={clothColor} />
          </mesh>
        </group>

        {/* 左脚（ヒップ pivot） */}
        <group ref={leftHipRef} position={[-0.10, hipY, 0]}>
          <mesh position={[0, -LEG_H / 2, 0]}>
            <boxGeometry args={[0.16, LEG_H, 0.16]} />
            <meshStandardMaterial color={pantsColor} />
          </mesh>
        </group>

        {/* 右脚（ヒップ pivot） */}
        <group ref={rightHipRef} position={[0.10, hipY, 0]}>
          <mesh position={[0, -LEG_H / 2, 0]}>
            <boxGeometry args={[0.16, LEG_H, 0.16]} />
            <meshStandardMaterial color={pantsColor} />
          </mesh>
        </group>

      </group>
    </group>
  );
}
