import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Player } from "./Player";
import { DoorTrigger, type DoorTriggerDef } from "./DoorTrigger";
import { setCaptureRenderer } from "./captureController";
import { useGameStore } from "../store/gameStore";

// 七海の暫定キャラクターモデル（yukari_test4.glb）
// checkpoint === 0（事件前・2019年8月）のみ表示
// 位置は balcony 付近。調整が必要な場合はここの position/rotation を変更してください。
const NANAMI_POSITION: [number, number, number] = [-0.5, 0, -3.2];
const NANAMI_ROTATION_Y = Math.PI; // プレイヤーの方向を向かせる

// GLB の MeshPhysicalMaterial (transmission) は、画面内の窓が多いと
// 透過・反射計算が重くなりやすい。建物用の窓だけを、色付きの薄い
// MeshBasicMaterial に置き換えて、低コストな「ガラスらしさ」を出す。
function isGlassMaterial(material: THREE.Material): boolean {
  const physical = material as THREE.MeshPhysicalMaterial & {
    transmission?: number;
  };
  const label = `${material.name} ${(material.userData as { materialName?: string }).materialName ?? ""}`.toLowerCase();
  return (
    (typeof physical.transmission === "number" && physical.transmission > 0.05) ||
    /glass|window|pane|door|窓|ガラス|マテリアル/.test(label)
  );
}

function applyLightweightGlassMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const replaced = materials.map((material) => {
      if (!isGlassMaterial(material)) return material;
      const source = material as THREE.MeshStandardMaterial;
      const glass = new THREE.MeshBasicMaterial({
        color: "#a7c1cf",
        map: source.map ?? null,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        side: THREE.DoubleSide,
        alphaTest: 0.02,
      });
      glass.name = `${material.name || "glass"}_lightweight`;
      return glass;
    });
    mesh.material = Array.isArray(mesh.material) ? replaced : replaced[0];
    if (replaced.some((material, index) => material !== materials[index])) {
      mesh.castShadow = false;
      mesh.renderOrder = 2;
    }
  });
}

function NanamiCharacter() {
  const { scene } = useGLTF("/data/models/human/yukari_test4.glb");
  const cloned = useRef<THREE.Group>(scene.clone(true));
  return (
    <primitive
      object={cloned.current}
      position={NANAMI_POSITION}
      rotation={[0, NANAMI_ROTATION_Y, 0]}
    />
  );
}

// =============================================================
// ApartmentScene
// プロローグ：徹と七海のアパートの朝
// wall / wall_shelf_Balcony / balcony の3つのMergedBackground GLB
// をすべて原点に配置し、メッシュそのものをコリジョンとして使う。
// =============================================================

const EXIT_DOOR: DoorTriggerDef = {
  triggerId: "door_exit_apartment",
  targetLocation: "street",
  position: [0, 0, 5.5],
  label: "外へ出る",
  width: 1.4,
  height: 2.2,
};

function RendererRegistrar() {
  const { gl } = useThree();
  useEffect(() => {
    setCaptureRenderer(gl);
    return () => setCaptureRenderer(null);
  }, [gl]);
  return null;
}

// GLBを読み込み、内包する全Meshを親のコリジョンコレクタへ渡す
// excludeNames: コリジョンから除外するメッシュ名の部分一致リスト
function ApartmentModel({
  path,
  onMeshes,
  excludeNames = [],
}: {
  path: string;
  onMeshes: (meshes: THREE.Mesh[]) => void;
  excludeNames?: string[];
}) {
  const { scene } = useGLTF(path);
  const cloned = useRef<THREE.Group>(scene.clone(true));

  useEffect(() => {
    applyLightweightGlassMaterials(cloned.current);
    const meshes: THREE.Mesh[] = [];
    cloned.current.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      if (import.meta.env.DEV) {
        console.log(`[ApartmentModel] ${path} mesh: "${mesh.name}"`);
      }
      const excluded = excludeNames.some((n) =>
        mesh.name.toLowerCase().includes(n.toLowerCase())
      );
      if (!excluded) meshes.push(mesh);
    });
    onMeshes(meshes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <primitive object={cloned.current} />;
}

// =============================================================
// ToothbrushSink — 洗面台 + 歯ブラシ2本（七海のは checkpoint>0 で消える）
// checkpoint === 0: 2本（徹＋七海）
// checkpoint > 0:  1本（徹のみ）→ クリックでノベルトリガー
// =============================================================

interface ToothbrushSinkProps {
  checkpoint: number;
  onNpcMesh: (mesh: THREE.Mesh | null) => void;
}

function ToothbrushSink({ checkpoint, onNpcMesh }: ToothbrushSinkProps) {
  const sinkPos: [number, number, number] = [1.0, 0, -1.0];
  const interactMeshRef = useRef<THREE.Mesh>(null);
  const onNpcMeshRef = useRef(onNpcMesh);
  onNpcMeshRef.current = onNpcMesh;

  useEffect(() => {
    if (checkpoint > 0 && interactMeshRef.current) {
      onNpcMeshRef.current(interactMeshRef.current);
    }
  }, [checkpoint]);

  return (
    <group position={sinkPos}>
      {/* 洗面台本体（白いキューブ） */}
      <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.65, 0.14, 0.38]} />
        <meshStandardMaterial color="#e8e4df" roughness={0.25} metalness={0.05} />
      </mesh>
      {/* 洗面台の縁（薄いグレー） */}
      <mesh position={[0, 0.855, 0]}>
        <boxGeometry args={[0.70, 0.05, 0.43]} />
        <meshStandardMaterial color="#ccc8c2" roughness={0.4} />
      </mesh>

      {/* 歯ブラシ - 徹のもの（青、常に表示） */}
      <group position={[-0.10, 0.99, 0.02]}>
        <mesh position={[0, 0.10, 0]}>
          <boxGeometry args={[0.022, 0.19, 0.013]} />
          <meshStandardMaterial color="#3a7aee" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.215, 0]}>
          <boxGeometry args={[0.018, 0.045, 0.018]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.85} />
        </mesh>
      </group>

      {/* 歯ブラシ - 七海のもの（ピンク、checkpoint === 0 のみ表示） */}
      {checkpoint === 0 && (
        <group position={[0.10, 0.99, 0.02]}>
          <mesh position={[0, 0.10, 0]}>
            <boxGeometry args={[0.022, 0.19, 0.013]} />
            <meshStandardMaterial color="#f07898" roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.215, 0]}>
            <boxGeometry args={[0.018, 0.045, 0.018]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.85} />
          </mesh>
        </group>
      )}

      {/* クリック判定用不可視メッシュ（checkpoint > 0 のみ登録） */}
      {checkpoint > 0 && (
        <mesh
          ref={interactMeshRef}
          position={[0, 1.15, 0]}
          userData={{ npcId: "toothbrush_sink", scenarioId: "apartment_toothbrush" }}
          visible={false}
        >
          <boxGeometry args={[0.7, 0.6, 0.45]} />
          <meshStandardMaterial />
        </mesh>
      )}
    </group>
  );
}

// =============================================================
// ApartmentSceneInner
// =============================================================

function ApartmentSceneInner() {
  const currentCheckpoint = useGameStore((s) => s.currentCheckpoint);

  const collectedMeshes = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const [collisionMeshes, setCollisionMeshes] = useState<THREE.Object3D[]>([]);
  const [npcMeshes, setNpcMeshes] = useState<THREE.Object3D[]>([]);
  const [doorMeshes, setDoorMeshes] = useState<THREE.Object3D[]>([]);

  const handleGlbMeshes = (key: string) => (meshes: THREE.Mesh[]) => {
    collectedMeshes.current.set(key, meshes);
    const all: THREE.Object3D[] = [];
    for (const m of collectedMeshes.current.values()) all.push(...m);
    setCollisionMeshes(all);
  };

  const handleNpcMesh = useCallback((mesh: THREE.Mesh | null) => {
    setNpcMeshes(mesh ? [mesh] : []);
  }, []);

  const handleDoorMesh = useCallback((m: THREE.Mesh) => {
    setDoorMeshes([m]);
  }, []);

  return (
    <>
      <RendererRegistrar />

      {/* 朝の光：東から差し込む逆光気味の柔らかい自然光 */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[4, 8, -2]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight args={["#d8dce8", "#b8a898", 0.35]} />

      {/* 空気感：やや白っぽい朝のフォグ */}
      <fog attach="fog" args={["#e8eaf0", 8, 30]} />

      {/* MergedBackground 階層1 GLB — すべて原点に配置 */}
      <ApartmentModel
        path="/data/models/merged/wall.glb"
        onMeshes={handleGlbMeshes("wall")}
      />
      <ApartmentModel
        path="/data/models/merged/wall_shelf_Balcony.glb"
        onMeshes={handleGlbMeshes("wall_shelf")}
        // ベランダ開口部を塞ぐメッシュ名を開発ログで確認後ここに追加:
        // excludeNames={["balcony_door", "sliding", "サッシ"]}
      />
      <ApartmentModel
        path="/data/models/merged/balcony.glb"
        onMeshes={handleGlbMeshes("balcony")}
        // 床メッシュをコリジョンから除外したい場合:
        // excludeNames={["floor", "床"]}
      />

      {/* 洗面台 + 歯ブラシ */}
      <ToothbrushSink
        checkpoint={currentCheckpoint}
        onNpcMesh={handleNpcMesh}
      />

      {/* 七海（暫定: yukari_test4.glb）— checkpoint 0 = 事件前のみ表示 */}
      {currentCheckpoint === 0 && <NanamiCharacter />}

      {/* 出口トリガー（アパート入口方向） */}
      <DoorTrigger def={EXIT_DOOR} onMeshReady={handleDoorMesh} />

      <Player
        collisionMeshes={collisionMeshes}
        npcMeshes={npcMeshes}
        doorMeshes={doorMeshes}
      />
    </>
  );
}

export function ApartmentScene() {
  return (
    <Canvas
      camera={{ fov: 70, near: 0.05, far: 200, position: [0, 1.7, 2] }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      shadows
      style={{ background: "#e8eaf0" }}
    >
      <color attach="background" args={["#e8eaf0"]} />
      <ApartmentSceneInner />
    </Canvas>
  );
}

// プリロード（遷移前にキャッシュに乗せる）
useGLTF.preload("/data/models/merged/wall.glb");
useGLTF.preload("/data/models/merged/wall_shelf_Balcony.glb");
useGLTF.preload("/data/models/merged/balcony.glb");
useGLTF.preload("/data/models/human/yukari_test4.glb");
