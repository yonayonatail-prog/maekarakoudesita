import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Street } from "./Street";
import { Player } from "./Player";
import { AnimLoopObject } from "./AnimLoopObject";
import { NpcObject, type NpcDef } from "./NpcObject";
import { DoorTrigger, type DoorTriggerDef } from "./DoorTrigger";
import { useGameStore } from "../store/gameStore";
import { CHECKPOINTS, TOTAL_CHECKPOINTS } from "../data/checkpoints";
import { EditorSceneObjects } from "../editor/EditorSceneObjects";
import { setCaptureRenderer } from "./captureController";
import { GhostCrowd } from "./GhostCrowd";
import { PrimitiveMob } from "./PrimitiveMob";
import { Postman } from "./Postman";
import { Season365System } from "./Season365System";
import { SakuraGrove } from "./SakuraTree";
import { Rain } from "./Rain";

const NPCS: NpcDef[] = [
  { id: "npc_passerby_01",  position: [2, 0, -1],   scenarioId: "npc_talk_passerby",   label: "通行人" },
  { id: "npc_shopkeeper_01", position: [-2.5, 0, -3], scenarioId: "npc_talk_shopkeeper", label: "コンビニ店員" },
  { id: "npc_nanami_01",    position: [0, 0, -4],   scenarioId: "whitening_intro",      label: "七海" },
];

const DOOR_TRIGGERS: DoorTriggerDef[] = [
  {
    triggerId: "door_convenience_store",
    targetLocation: "convenience_store",
    position: [-4.5, 0, -2],
    label: "コンビニへ入る",
    rotationY: Math.PI / 2,
  },
  {
    triggerId: "door_apartment",
    targetLocation: "apartment",
    position: [5.5, 0, -4],
    label: "アパートへ帰る",
  },
];

// 撮影トリガーで解放されるドア（unlockedLocations に含まれる場合のみ表示）
const UNLOCKABLE_DOOR_TRIGGERS: (DoorTriggerDef & { unlocksLocation: string })[] = [
  {
    triggerId: "door_dental_bus_stop",
    targetLocation: "dental_bus_stop",
    position: [7.5, 0, -12],
    label: "水科歯科前バス停",
    rotationY: -Math.PI / 4,
    unlocksLocation: "dental_bus_stop",
  },
];

function RendererRegistrar() {
  const { gl } = useThree();
  useEffect(() => {
    setCaptureRenderer(gl);
    return () => setCaptureRenderer(null);
  }, [gl]);
  return null;
}

// =============================================================
// SkySystem — 高速世界の空演出
// replay モード: 1日 ≈ 5.5秒 / 1年 ≈ 55秒 でループ。
// before モード: 認知レベル連動の暗い霧（従来通り）。
// =============================================================

// 記憶フェーズ用静的フォグ色（module-level で GC ゼロ）
const _SFog0 = new THREE.Color("#15161a");
const _SFog1 = new THREE.Color("#241a1a");
const _cogOut = new THREE.Color();

// 昼夜グラデーション stops
interface SkyStop { t: number; sky: THREE.Color; fog: THREE.Color }
const SKY_STOPS: SkyStop[] = [
  { t: 0.00, sky: new THREE.Color(0.03, 0.03, 0.10), fog: new THREE.Color(0.01, 0.01, 0.05) }, // 深夜
  { t: 0.12, sky: new THREE.Color(0.03, 0.03, 0.10), fog: new THREE.Color(0.01, 0.01, 0.05) }, // 深夜続く
  { t: 0.18, sky: new THREE.Color(1.00, 0.45, 0.16), fog: new THREE.Color(0.75, 0.20, 0.03) }, // 日の出
  { t: 0.26, sky: new THREE.Color(0.95, 0.72, 0.32), fog: new THREE.Color(0.65, 0.42, 0.16) }, // 朝金色
  { t: 0.38, sky: new THREE.Color(0.52, 0.80, 0.92), fog: new THREE.Color(0.35, 0.62, 0.80) }, // 昼 空色
  { t: 0.55, sky: new THREE.Color(0.20, 0.40, 0.87), fog: new THREE.Color(0.15, 0.35, 0.72) }, // 正午 深青
  { t: 0.70, sky: new THREE.Color(0.52, 0.80, 0.92), fog: new THREE.Color(0.35, 0.62, 0.80) }, // 午後
  { t: 0.79, sky: new THREE.Color(1.00, 0.32, 0.06), fog: new THREE.Color(0.80, 0.14, 0.02) }, // 夕焼け
  { t: 0.87, sky: new THREE.Color(0.25, 0.00, 0.65), fog: new THREE.Color(0.12, 0.00, 0.30) }, // 黄昏
  { t: 0.94, sky: new THREE.Color(0.04, 0.02, 0.12), fog: new THREE.Color(0.01, 0.01, 0.05) }, // 宵
  { t: 1.00, sky: new THREE.Color(0.03, 0.03, 0.10), fog: new THREE.Color(0.01, 0.01, 0.05) }, // 深夜
];

// 季節ティント stops
interface SeasonStop { t: number; r: number; g: number; b: number; w: number }
const SEASON_STOPS: SeasonStop[] = [
  { t: 0.00, r: 1.00, g: 0.72, b: 0.77, w: 0.12 }, // 春・桜ピンク
  { t: 0.25, r: 0.00, g: 0.55, b: 1.00, w: 0.06 }, // 夏・鮮青
  { t: 0.50, r: 1.00, g: 0.55, b: 0.00, w: 0.12 }, // 秋・金
  { t: 0.75, r: 0.60, g: 0.70, b: 0.88, w: 0.10 }, // 冬・寒色
  { t: 1.00, r: 1.00, g: 0.72, b: 0.77, w: 0.12 }, // 春（ループ）
];

// useFrame 内アロケーション回避用ワーク変数
const _sky = new THREE.Color();
const _fog = new THREE.Color();
const _tint = new THREE.Color();

function sampleDayCycle(t: number): void {
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const lo = SKY_STOPS[i], hi = SKY_STOPS[i + 1];
    if (t <= hi.t) {
      const a = (t - lo.t) / (hi.t - lo.t);
      _sky.lerpColors(lo.sky, hi.sky, a);
      _fog.lerpColors(lo.fog, hi.fog, a);
      return;
    }
  }
}

function sampleSeasonTint(s: number): number {
  for (let i = 0; i < SEASON_STOPS.length - 1; i++) {
    const lo = SEASON_STOPS[i], hi = SEASON_STOPS[i + 1];
    if (s <= hi.t) {
      const a = (s - lo.t) / (hi.t - lo.t);
      _tint.setRGB(lo.r + (hi.r - lo.r) * a, lo.g + (hi.g - lo.g) * a, lo.b + (hi.b - lo.b) * a);
      return lo.w + (hi.w - lo.w) * a;
    }
  }
  const last = SEASON_STOPS[SEASON_STOPS.length - 1];
  _tint.setRGB(last.r, last.g, last.b);
  return last.w;
}

function SkySystem({ decay }: { decay: number }) {
  const { scene } = useThree();

  const explorationMode = useGameStore((s) => s.explorationMode);
  const worldPaused    = useGameStore((s) => s.worldPaused);
  const cognitionLevel = useGameStore((s) => s.cognitionLevel);
  const modeRef   = useRef(explorationMode);
  const pausedRef = useRef(worldPaused);
  const cogRef    = useRef(cognitionLevel);
  modeRef.current   = explorationMode;
  pausedRef.current = worldPaused;
  cogRef.current    = cognitionLevel;

  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef     = useRef<THREE.DirectionalLight>(null);
  const hemiRef    = useRef<THREE.HemisphereLight>(null);

  const dayT    = useRef(0.42); // 初期: 午後
  const seasonT = useRef(0.0);

  const bgColor  = useMemo(() => new THREE.Color(), []);
  const fogColor = useMemo(() => new THREE.Color(), []);
  const fogInst  = useMemo(() => new THREE.Fog(fogColor, 8, 55), [fogColor]);

  useEffect(() => {
    scene.background = bgColor;
    scene.fog = fogInst;
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, bgColor, fogInst]);

  useFrame((_, delta) => {
    const isReplay = modeRef.current === "replay";

    if (isReplay && !pausedRef.current) {
      dayT.current    = (dayT.current    + delta * 0.18)  % 1; // 約5.5秒/1日
      seasonT.current = (seasonT.current + delta * 0.018) % 1; // 約55秒/1年
    }

    if (isReplay) {
      // 昼夜サンプリング → 季節ティントをブレンド
      sampleDayCycle(dayT.current);
      const tw = sampleSeasonTint(seasonT.current);
      _sky.r += (_tint.r - _sky.r) * tw;
      _sky.g += (_tint.g - _sky.g) * tw;
      _sky.b += (_tint.b - _sky.b) * tw;
      _fog.r += (_tint.r - _fog.r) * tw * 0.5;
      _fog.g += (_tint.g - _fog.g) * tw * 0.5;
      _fog.b += (_tint.b - _fog.b) * tw * 0.5;

      fogInst.near = 12;
      fogInst.far  = 80;
    } else {
      // 記憶フェーズ: 認知レベル連動の暗い霧
      const cog = cogRef.current;
      _cogOut.lerpColors(_SFog0, _SFog1, 1 - cog / 100);
      _sky.copy(_cogOut);
      _fog.copy(_cogOut);
      fogInst.near = 8  + (cog / 100) * 6;
      fogInst.far  = 30 + (cog / 100) * 25 - decay * 15;
    }

    bgColor.copy(_sky);
    fogColor.copy(_fog);

    // ライト: 空の明度を proxy にして強度を動かす
    if (isReplay) {
      const lum = _sky.r * 0.299 + _sky.g * 0.587 + _sky.b * 0.114;
      if (ambientRef.current) ambientRef.current.intensity = THREE.MathUtils.lerp(0.04, 0.65, Math.min(lum * 3.5, 1));
      if (dirRef.current)     dirRef.current.intensity     = THREE.MathUtils.lerp(0, 1.1 * (1 - decay * 0.4), Math.min(lum * 5, 1));
      if (hemiRef.current)    hemiRef.current.color.copy(_sky);
    } else {
      if (ambientRef.current) ambientRef.current.intensity = 0.55;
      if (dirRef.current)     dirRef.current.intensity     = 1.1 * (1 - decay * 0.4);
      if (hemiRef.current)    hemiRef.current.color.set("#cdd3dc");
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.55} />
      <directionalLight
        ref={dirRef}
        position={[5, 12, 2]}
        intensity={1.1 * (1 - decay * 0.4)}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight ref={hemiRef} args={["#cdd3dc", "#3a3833", 0.4]} />
    </>
  );
}

// =============================================================
// ゲーム本体シーン（Canvas）
// =============================================================

export function GameScene() {
  const currentCheckpoint  = useGameStore((s) => s.currentCheckpoint);
  const worldObjects       = useGameStore((s) => s.worldObjects);
  const explorationMode    = useGameStore((s) => s.explorationMode);
  const unlockedLocations  = useGameStore((s) => s.unlockedLocations);

  const decay = currentCheckpoint / TOTAL_CHECKPOINTS;
  const cp    = CHECKPOINTS[currentCheckpoint];

  const activeObjects = useMemo(
    () => cp.worldObjectIds.map((id) => worldObjects[id]).filter(Boolean),
    [cp.worldObjectIds, worldObjects]
  );

  const collisionRef = useRef<Set<THREE.Mesh>>(new Set());
  const [collisionMeshes, setCollisionMeshes] = useState<THREE.Object3D[]>([]);
  const handleCollisionMesh = (m: THREE.Mesh | null) => {
    if (m) {
      collisionRef.current.add(m);
      setCollisionMeshes(Array.from(collisionRef.current));
    }
  };

  const npcGroupsRef = useRef<THREE.Group[]>([]);
  const [npcMeshes, setNpcMeshes] = useState<THREE.Object3D[]>([]);
  const handleNpcGroup = (g: THREE.Group) => {
    if (!npcGroupsRef.current.includes(g)) {
      npcGroupsRef.current.push(g);
      setNpcMeshes([...npcGroupsRef.current]);
    }
  };

  const doorMeshesRef = useRef<THREE.Mesh[]>([]);
  const [doorMeshes, setDoorMeshes] = useState<THREE.Object3D[]>([]);
  const handleDoorMesh = (m: THREE.Mesh) => {
    if (!doorMeshesRef.current.includes(m)) {
      doorMeshesRef.current.push(m);
      setDoorMeshes([...doorMeshesRef.current]);
    }
  };

  return (
    <Canvas
      camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1.7, 4] }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      shadows
      style={{ background: "#15161a" }}
    >
      <SkySystem decay={decay} />
      <Season365System />

      <RendererRegistrar />
      <Street decay={decay} onCollisionMesh={handleCollisionMesh} />
      <SakuraGrove />
      {explorationMode === "replay" && <GhostCrowd shape="person" color="#888888" />}
      {(currentCheckpoint === 0 || currentCheckpoint === 3) && <Postman />}

      {/* 2019年7月7日（CP0）の雨演出 */}
      {currentCheckpoint === 0 && (
        <Rain
          count={2500}
          area={[50, 50]}
          height={22}
          wind={[2.5, 0.8]}
          speedRange={[14, 22]}
          dropLength={0.5}
          color="#a8c8e8"
          opacity={0.4}
        />
      )}

      {/* 歩行モブ（手前→奥 6体: rotationY=π で -Z を向く） */}
      <PrimitiveMob position={[ 3.5, 0, 0]} rotationY={Math.PI} moveDirection={-1} moveZSpeed={1.8} moveZPhase={ 0} skinColor="#e0b88a" hairColor="#2a1a0a" clothColor="#4a506a" pantsColor="#2a2a3a" phase={0.0} exprInterval={2.5} walkSpeed={3.2} />
      <PrimitiveMob position={[-3.8, 0, 0]} rotationY={Math.PI} moveDirection={-1} moveZSpeed={2.4} moveZPhase={ 8} skinColor="#c8906a" hairColor="#1a0a0a" clothColor="#5a6a3a" pantsColor="#3a2a1a" phase={1.3} exprInterval={3.0} walkSpeed={3.8} />
      <PrimitiveMob position={[ 4.2, 0, 0]} rotationY={Math.PI} moveDirection={-1} moveZSpeed={1.5} moveZPhase={16} skinColor="#f0caa0" hairColor="#7a5a20" clothColor="#8a3a3a" pantsColor="#1a1a2a" phase={2.7} exprInterval={2.0} walkSpeed={2.8} />
      <PrimitiveMob position={[-4.0, 0, 0]} rotationY={Math.PI} moveDirection={-1} moveZSpeed={2.9} moveZPhase={ 4} skinColor="#d4a070" hairColor="#0a0808" clothColor="#6a6a6a" pantsColor="#3a3a4a" phase={0.9} exprInterval={3.5} walkSpeed={4.2} />
      <PrimitiveMob position={[ 3.0, 0, 0]} rotationY={Math.PI} moveDirection={-1} moveZSpeed={2.0} moveZPhase={12} skinColor="#e8c090" hairColor="#5a3a10" clothColor="#4a3a7a" pantsColor="#2a2a3a" phase={1.8} exprInterval={2.2} walkSpeed={3.0} />
      <PrimitiveMob position={[-2.8, 0, 0]} rotationY={Math.PI} moveDirection={-1} moveZSpeed={1.6} moveZPhase={20} skinColor="#b87850" hairColor="#080606" clothColor="#6a8a5a" pantsColor="#2a1a0a" phase={3.5} exprInterval={4.0} walkSpeed={2.6} />
      {/* 歩行モブ（奥→手前 2体: rotationY=0 で +Z を向く = プレイヤーに顔を向ける） */}
      <PrimitiveMob position={[ 2.2, 0, 0]} rotationY={0}        moveDirection={ 1} moveZSpeed={2.1} moveZPhase={ 6} skinColor="#f4d8b0" hairColor="#4a2a0a" clothColor="#7a4a2a" pantsColor="#3a2a1a" phase={2.2} exprInterval={2.8} walkSpeed={3.1} />
      <PrimitiveMob position={[-3.2, 0, 0]} rotationY={0}        moveDirection={ 1} moveZSpeed={1.9} moveZPhase={14} skinColor="#c49060" hairColor="#1a1010" clothColor="#3a6a8a" pantsColor="#2a2a3a" phase={4.0} exprInterval={3.2} walkSpeed={2.7} />

      {activeObjects.map((obj) => (
        <AnimLoopObject key={obj.id} object={obj} />
      ))}

      {NPCS.map((def) => (
        <NpcObject key={def.id} def={def} onGroupReady={handleNpcGroup} />
      ))}

      {DOOR_TRIGGERS.map((def) => (
        <DoorTrigger key={def.triggerId} def={def} onMeshReady={handleDoorMesh} />
      ))}
      {UNLOCKABLE_DOOR_TRIGGERS
        .filter((def) => unlockedLocations.includes(def.unlocksLocation))
        .map((def) => (
          <DoorTrigger key={def.triggerId} def={def} onMeshReady={handleDoorMesh} />
        ))
      }

      <Player collisionMeshes={collisionMeshes} npcMeshes={npcMeshes} doorMeshes={doorMeshes} />

      {import.meta.env.DEV && <EditorSceneObjects />}
    </Canvas>
  );
}
