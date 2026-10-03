import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Player } from "./Player";
import { DoorTrigger, type DoorTriggerDef } from "./DoorTrigger";
import { setCaptureRenderer } from "./captureController";
import { useState } from "react";

// =============================================================
// 水科歯科前バス停シーン
// ポストマン撮影で解放される新ロケーション。
// 歯科看板・バス停・不審な人物のシルエットが置かれる。
// =============================================================

const DOOR_BACK: DoorTriggerDef = {
  triggerId: "door_back_to_street",
  targetLocation: "street",
  position: [0, 0, 3],
  label: "戻る",
};

function RendererRegistrar() {
  const { gl } = useThree();
  useEffect(() => {
    setCaptureRenderer(gl);
    return () => setCaptureRenderer(null);
  }, [gl]);
  return null;
}

function BusStopScene() {
  const { scene } = useThree();
  const fogRef = useRef(new THREE.Fog("#0d0e14", 6, 35));
  useEffect(() => {
    scene.background = new THREE.Color("#0d0e14");
    scene.fog = fogRef.current;
    return () => { scene.background = null; scene.fog = null; };
  }, [scene]);

  // バス停ポール
  // 歯科看板（大）
  // 不審なシルエット（後ろ向き）
  const signRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (signRef.current) {
      const mat = signRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(clock.elapsedTime * 0.8) * 0.1;
    }
  });

  return (
    <>
      <ambientLight intensity={0.18} />
      <pointLight position={[0, 4, -2]} intensity={1.2} color="#c8c0e0" distance={18} />
      <pointLight position={[-6, 3, -8]} intensity={0.6} color="#ffcc88" distance={12} />

      {/* バス停ポール */}
      <mesh position={[-1.2, 1.5, -4]}>
        <cylinderGeometry args={[0.06, 0.06, 3, 8]} />
        <meshStandardMaterial color="#888" roughness={0.5} />
      </mesh>
      {/* バス停プレート */}
      <mesh position={[-1.2, 3.2, -4]}>
        <boxGeometry args={[0.8, 0.35, 0.06]} />
        <meshStandardMaterial color="#2255aa" emissive="#2255aa" emissiveIntensity={0.25} />
      </mesh>
      <Text position={[-1.2, 3.2, -3.95]} fontSize={0.11} color="#ffffff" anchorX="center" anchorY="middle">
        水科歯科前
      </Text>

      {/* 歯科看板（建物側面） */}
      <mesh ref={signRef} position={[-5, 3.5, -10]}>
        <boxGeometry args={[5, 2.2, 0.2]} />
        <meshStandardMaterial color="#f0ece0" emissive="#f0ece0" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[-5, 3.5, -9.88]} fontSize={0.38} color="#1a1a2a" anchorX="center" anchorY="middle">
        水科歯科医院
      </Text>
      <Text position={[-5, 2.95, -9.88]} fontSize={0.16} color="#555" anchorX="center" anchorY="middle">
        院長　水科 慎一郎
      </Text>

      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.95} />
      </mesh>

      {/* 不審なシルエット（後ろ向きで立っている） */}
      <group position={[2.5, 0, -7]}>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.45, 1.65, 0.3]} />
          <meshStandardMaterial color="#111" roughness={1} />
        </mesh>
        {/* 頭 */}
        <mesh position={[0, 1.88, 0]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#111" roughness={1} />
        </mesh>
      </group>
    </>
  );
}

export function DentalBusStopScene() {
  const meshRef = useRef<THREE.Mesh[]>([]);
  const [doorMeshes, setDoorMeshes] = useState<THREE.Object3D[]>([]);
  const handleDoorMesh = (m: THREE.Mesh) => {
    if (!meshRef.current.includes(m)) {
      meshRef.current.push(m);
      setDoorMeshes([...meshRef.current]);
    }
  };

  return (
    <Canvas
      camera={{ fov: 70, near: 0.1, far: 200, position: [0, 1.7, 2] }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ background: "#0d0e14" }}
    >
      <RendererRegistrar />
      <BusStopScene />
      <DoorTrigger def={DOOR_BACK} onMeshReady={handleDoorMesh} />
      <Player collisionMeshes={[]} npcMeshes={[]} doorMeshes={doorMeshes} />
    </Canvas>
  );
}
