import { useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";

// =============================================================
// ResultScene
// リザルト画面の背景シーン：徹のアパート洗面所
// 鏡の前に立つ徹（test_takamiya.glb 暫定）を後ろから映し、
// MeshReflectorMaterial で正面の反射を見せる。
// カメラは右後方固定（映画的構図）。
// =============================================================

const TAKAMIYA_MODEL = "/data/models/human/test_takamiya.glb";

// カメラを鏡方向に向ける
function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 1.55, -0.55);
  }, [camera]);
  return null;
}

// 洗面所の簡易シェル（壁・床・天井）
function BathroomShell() {
  return (
    <>
      {/* 奥の壁（タイル調） */}
      <mesh position={[0, 1.5, -0.9]} receiveShadow>
        <planeGeometry args={[3.5, 3]} />
        <meshStandardMaterial color="#cec9c0" roughness={0.55} metalness={0.02} />
      </mesh>
      {/* 右壁 */}
      <mesh position={[1.6, 1.5, 0.1]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color="#c8c3ba" roughness={0.55} />
      </mesh>
      {/* 左壁 */}
      <mesh position={[-1.6, 1.5, 0.1]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color="#c8c3ba" roughness={0.55} />
      </mesh>
      {/* 床（暗い石目調） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.5, 3]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.65} metalness={0.05} />
      </mesh>
      {/* 天井 */}
      <mesh position={[0, 3.0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.5, 3]} />
        <meshStandardMaterial color="#dbd6ce" roughness={0.9} />
      </mesh>
    </>
  );
}

// 洗面台（鏡の直下）
function Sink() {
  return (
    <group position={[0, 0, -0.48]}>
      {/* 台本体 */}
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.65, 0.14, 0.38]} />
        <meshStandardMaterial color="#e8e4df" roughness={0.28} metalness={0.04} />
      </mesh>
      {/* 台縁 */}
      <mesh position={[0, 0.785, 0]}>
        <boxGeometry args={[0.70, 0.05, 0.43]} />
        <meshStandardMaterial color="#ccc8c2" roughness={0.42} />
      </mesh>
      {/* 蛇口 */}
      <mesh position={[0, 0.97, -0.09]}>
        <cylinderGeometry args={[0.014, 0.014, 0.11, 8]} />
        <meshStandardMaterial color="#a8a4a0" metalness={0.75} roughness={0.18} />
      </mesh>
      {/* 蛇口先端（L字） */}
      <mesh position={[0, 0.945, -0.14]}>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
        <meshStandardMaterial color="#a8a4a0" metalness={0.75} roughness={0.18} />
      </mesh>
    </group>
  );
}

// 鏡：フレーム + MeshReflectorMaterial 鏡面
function Mirror() {
  return (
    <group position={[0, 1.57, -0.73]}>
      {/* 外フレーム */}
      <mesh>
        <boxGeometry args={[0.75, 1.05, 0.022]} />
        <meshStandardMaterial color="#1c1c20" roughness={0.28} metalness={0.65} />
      </mesh>
      {/* 鏡面（ReflectorMaterial） */}
      <mesh position={[0, 0, 0.014]}>
        <planeGeometry args={[0.66, 0.96]} />
        <MeshReflectorMaterial
          resolution={1024}
          blur={[0, 0]}
          mixBlur={0}
          mixStrength={60}
          roughness={0.03}
          depthScale={0}
          minDepthThreshold={0.9}
          maxDepthThreshold={1.0}
          color="#b0b4c0"
          metalness={0.88}
          mirror={0.96}
        />
      </mesh>
    </group>
  );
}

// 高宮徹（暫定 test_takamiya.glb）
// 鏡の前に立ち、鏡を向いている（-Z 方向）
function TakamiyaModel() {
  const { scene } = useGLTF(TAKAMIYA_MODEL);
  const cloned = useRef<THREE.Group>(scene.clone(true));

  useEffect(() => {
    cloned.current.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, []);

  return (
    <primitive
      object={cloned.current}
      position={[0, 0, 0.0]}
      rotation={[0, Math.PI, 0]}
      scale={[1, 1, 1]}
    />
  );
}

function SceneContent() {
  return (
    <>
      <CameraSetup />

      {/* 夜の洗面所照明 */}
      {/* 天井からのメイン蛍光灯（消灯気味） */}
      <ambientLight intensity={0.06} color="#304060" />
      {/* 洗面台上部の白熱ウォールランプ（主光源） */}
      <pointLight
        position={[0, 2.35, -0.55]}
        intensity={2.2}
        color="#d8e8ff"
        distance={3.8}
        decay={2}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      {/* 鏡の内側・徹の顔を照らすリムライト */}
      <pointLight
        position={[0, 1.9, -0.65]}
        intensity={0.55}
        color="#c0cce0"
        distance={1.0}
        decay={2}
      />
      {/* 床からの微弱な反射（暗い石目床）  */}
      <pointLight
        position={[0, 0.3, 0.2]}
        intensity={0.08}
        color="#202840"
        distance={2.0}
        decay={2}
      />

      <BathroomShell />
      <Sink />
      <Mirror />
      <TakamiyaModel />
    </>
  );
}

export function ResultScene() {
  return (
    <Canvas
      camera={{ fov: 52, near: 0.05, far: 30, position: [0.55, 1.62, 1.05] }}
      gl={{ antialias: true }}
      shadows
    >
      <color attach="background" args={["#060810"]} />
      <fog attach="fog" args={["#060810", 6, 18]} />
      <SceneContent />
    </Canvas>
  );
}

useGLTF.preload(TAKAMIYA_MODEL);
