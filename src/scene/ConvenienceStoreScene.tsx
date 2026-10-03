import { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Player } from "./Player";
import { DoorTrigger, type DoorTriggerDef } from "./DoorTrigger";
import { setCaptureRenderer } from "./captureController";

// 出口トリガー（外へ戻る）
const EXIT_TRIGGER: DoorTriggerDef = {
  triggerId: "door_exit_to_street",
  targetLocation: "street",
  position: [0, 0, 5.2],
  label: "外へ出る",
  width: 1.6,
  height: 2.4,
};

// プレイヤー入場位置（ドアの内側）
const ENTRY_POSITION: [number, number, number] = [0, 1.7, 4.0];

// 棚段の Z 位置
const SHELF_Z_POSITIONS = [-4, -2, 0, 2];

function RendererRegistrar() {
  const { gl } = useThree();
  useEffect(() => {
    setCaptureRenderer(gl);
    return () => setCaptureRenderer(null);
  }, [gl]);
  return null;
}

export function ConvenienceStoreScene() {
  // 壁コリジョンメッシュ収集
  const wallsRef = useRef<THREE.Mesh[]>([]);
  const [wallMeshes, setWallMeshes] = useState<THREE.Object3D[]>([]);
  const handleWall = (m: THREE.Mesh | null) => {
    if (m && !wallsRef.current.includes(m)) {
      wallsRef.current.push(m);
      setWallMeshes([...wallsRef.current]);
    }
  };

  // 出口トリガーメッシュ
  const [exitMeshes, setExitMeshes] = useState<THREE.Object3D[]>([]);
  const handleExitMesh = (m: THREE.Mesh) => setExitMeshes([m]);

  return (
    <Canvas
      camera={{ fov: 75, near: 0.1, far: 60, position: ENTRY_POSITION }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      shadows
      style={{ background: "#e8e4dc" }}
    >
      <color attach="background" args={["#e8e4dc"]} />
      <ambientLight intensity={1.6} />
      <pointLight position={[0, 2.8, 0]} intensity={2.5} castShadow />
      <pointLight position={[0, 2.8, -3]} intensity={1.8} />

      <RendererRegistrar />

      {/* 床 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 12]} />
        <meshStandardMaterial color="#c4bdb0" roughness={0.85} />
      </mesh>

      {/* 天井 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3, 0]}>
        <planeGeometry args={[8, 12]} />
        <meshStandardMaterial color="#f0ede8" roughness={0.4} />
      </mesh>

      {/* 奥の壁 */}
      <mesh position={[0, 1.5, -6]} ref={handleWall} receiveShadow>
        <boxGeometry args={[8, 3, 0.2]} />
        <meshStandardMaterial color="#ddd8d0" roughness={0.8} />
      </mesh>

      {/* 左の壁 */}
      <mesh position={[-4, 1.5, 0]} ref={handleWall} receiveShadow>
        <boxGeometry args={[0.2, 3, 12]} />
        <meshStandardMaterial color="#d8d4cc" roughness={0.8} />
      </mesh>

      {/* 右の壁 */}
      <mesh position={[4, 1.5, 0]} ref={handleWall} receiveShadow>
        <boxGeometry args={[0.2, 3, 12]} />
        <meshStandardMaterial color="#d8d4cc" roughness={0.8} />
      </mesh>

      {/* 手前の壁（ドア左） */}
      <mesh position={[-3, 1.5, 6]} ref={handleWall}>
        <boxGeometry args={[2, 3, 0.2]} />
        <meshStandardMaterial color="#ddd8d0" roughness={0.8} />
      </mesh>

      {/* 手前の壁（ドア右） */}
      <mesh position={[3, 1.5, 6]} ref={handleWall}>
        <boxGeometry args={[2, 3, 0.2]} />
        <meshStandardMaterial color="#ddd8d0" roughness={0.8} />
      </mesh>

      {/* ドア上部 */}
      <mesh position={[0, 2.6, 6]} ref={handleWall}>
        <boxGeometry args={[2, 0.8, 0.2]} />
        <meshStandardMaterial color="#ddd8d0" roughness={0.8} />
      </mesh>

      {/* 左壁沿いの棚 */}
      {SHELF_Z_POSITIONS.map((z) => (
        <group key={z} position={[-3.3, 0, z]}>
          {[0.5, 1.0, 1.5].map((y) => (
            <mesh key={y} position={[0, y, 0]} castShadow>
              <boxGeometry args={[0.4, 0.05, 1.2]} />
              <meshStandardMaterial color="#a89880" roughness={0.6} />
            </mesh>
          ))}
          {/* 棚支柱 */}
          <mesh position={[-0.18, 0.9, 0.55]}>
            <boxGeometry args={[0.04, 1.8, 0.04]} />
            <meshStandardMaterial color="#888070" roughness={0.7} />
          </mesh>
          <mesh position={[-0.18, 0.9, -0.55]}>
            <boxGeometry args={[0.04, 1.8, 0.04]} />
            <meshStandardMaterial color="#888070" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* カウンター */}
      <mesh position={[2, 0.5, -4.5]} castShadow>
        <boxGeometry args={[3, 1, 0.9]} />
        <meshStandardMaterial color="#8a7060" roughness={0.7} />
      </mesh>
      {/* カウンター天板 */}
      <mesh position={[2, 1.02, -4.5]}>
        <boxGeometry args={[3.1, 0.05, 0.95]} />
        <meshStandardMaterial color="#6a5248" roughness={0.5} />
      </mesh>

      {/* 出口トリガー */}
      <DoorTrigger def={EXIT_TRIGGER} onMeshReady={handleExitMesh} />

      <Player
        collisionMeshes={wallMeshes}
        npcMeshes={[]}
        doorMeshes={exitMeshes}
        initialPosition={ENTRY_POSITION}
      />
    </Canvas>
  );
}
