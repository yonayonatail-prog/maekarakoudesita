import { useEffect, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 25;
const Z_NEAR  =  2.5;
const Z_FAR   = -14.0;
const Z_RANGE = Z_NEAR - Z_FAR;
const X_SPREAD = 7.0;

// ─── テクスチャ生成（白ベース → material.color で色付け）────────

function buildPersonTexture(): THREE.CanvasTexture {
  const W = 128; const H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2;
  for (const { blur, alpha, sx } of [
    { blur: 18, alpha: 0.18, sx: 2.6 },
    { blur: 8,  alpha: 0.32, sx: 1.3 },
    { blur: 3,  alpha: 0.55, sx: 1.0 },
  ]) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.filter = `blur(${blur}px)`; ctx.fillStyle = "#fff";
    drawPersonShape(ctx, cx, sx);
    ctx.restore();
  }
  return new THREE.CanvasTexture(canvas);
}

function drawPersonShape(ctx: CanvasRenderingContext2D, cx: number, sx: number) {
  ctx.beginPath(); ctx.ellipse(cx,            28, 14 * sx, 17,    0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx,            60, 18 * sx, 10,    0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx,           100, 16 * sx, 30,    0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx,           140, 14 * sx, 14,    0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx - 10 * sx, 188,  9 * sx, 38,  0.08, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 10 * sx, 192,  9 * sx, 36, -0.08, 0, Math.PI * 2); ctx.fill();
}

function buildCarTexture(): THREE.CanvasTexture {
  const W = 256; const H = 128;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  for (const { blur, alpha } of [
    { blur: 14, alpha: 0.18 },
    { blur: 6,  alpha: 0.32 },
    { blur: 2,  alpha: 0.55 },
  ]) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.filter = `blur(${blur}px)`; ctx.fillStyle = "#fff";
    drawCarShape(ctx);
    ctx.restore();
  }
  return new THREE.CanvasTexture(canvas);
}

function drawCarShape(ctx: CanvasRenderingContext2D) {
  ctx.beginPath(); ctx.roundRect(10, 62, 236, 42, 6); ctx.fill();         // ボディ下部
  ctx.beginPath();                                                          // キャビン（台形）
  ctx.moveTo(52, 62); ctx.lineTo(205, 62); ctx.lineTo(185, 18); ctx.lineTo(72, 18);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(238, 84, 10, 18, 0, 0, Math.PI * 2); ctx.fill(); // フロント
  ctx.beginPath(); ctx.ellipse( 18, 84, 10, 18, 0, 0, Math.PI * 2); ctx.fill(); // リア
  ctx.beginPath(); ctx.arc( 62, 104, 24, 0, Math.PI * 2); ctx.fill();           // 左タイヤ
  ctx.beginPath(); ctx.arc(194, 104, 24, 0, Math.PI * 2); ctx.fill();           // 右タイヤ
}

// ─── メインコンポーネント ────────────────────────────────────────

export type GhostShape = "person" | "car";

interface GhostData {
  x: number;
  startOffset: number;
  speed: number;
  scale: number;
}

interface Props {
  shape?: GhostShape;
  color?: string;
}

export function GhostCrowd({ shape = "person", color = "#000000" }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  const planeW  = shape === "car" ? 2.2  : 0.85;
  const planeH  = shape === "car" ? 0.85 : 1.9;
  const yCenter = shape === "car" ? 0.42 : 0.95;

  const texture  = useMemo(() => shape === "car" ? buildCarTexture() : buildPersonTexture(), [shape]);
  const geometry = useMemo(() => new THREE.PlaneGeometry(planeW, planeH), [planeW, planeH]);
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({
      map: texture,
      color,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    [texture, color]
  );

  useEffect(() => {
    return () => { geometry.dispose(); material.dispose(); texture.dispose(); };
  }, [geometry, material, texture]);

  const ghosts = useMemo<GhostData[]>(
    () => Array.from({ length: COUNT }, () => ({
      x:           (Math.random() - 0.5) * X_SPREAD,
      startOffset: Math.random() * Z_RANGE,
      speed:       THREE.MathUtils.lerp(shape === "car" ? 8 : 4, shape === "car" ? 18 : 11, Math.random()),
      scale:       THREE.MathUtils.lerp(0.6, 1.1, Math.random()),
    })),
    [shape]
  );

  // draw call 1回・useFrame 1回で全インスタンスを更新
  useFrame(({ clock, camera }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    for (let i = 0; i < COUNT; i++) {
      const g = ghosts[i];
      const looped = ((g.startOffset + g.speed * t) % Z_RANGE + Z_RANGE) % Z_RANGE;
      const z = Z_NEAR - looped;

      dummy.position.set(g.x, g.scale * yCenter, z);
      dummy.scale.setScalar(g.scale);
      dummy.rotation.y = Math.atan2(camera.position.x - g.x, camera.position.z - z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} />;
}
