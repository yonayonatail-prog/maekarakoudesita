import { useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useFirstPersonControls } from "./useFirstPersonControls";
import { setCaptureCamera } from "./captureController";
import { useGameStore } from "../store/gameStore";
import type { LocationId } from "../types";

interface Props {
  collisionMeshes: THREE.Object3D[];
  npcMeshes: THREE.Object3D[];
  doorMeshes?: THREE.Object3D[];
  initialPosition?: [number, number, number];
}

const BASE_FOV = 75;
const SCOPE_FOV = 28;

export function Player({ collisionMeshes, npcMeshes, doorMeshes, initialPosition }: Props) {
  const { camera } = useThree();
  const scopeActive = useGameStore((s) => s.scopeActive);
  const worldPaused = useGameStore((s) => s.worldPaused);
  const explorationMode = useGameStore((s) => s.explorationMode);
  const novelState = useGameStore((s) => s.novelState);
  const tickTime = useGameStore((s) => s.tickTime);
  const startNovel = useGameStore((s) => s.startNovel);
  const setLocation = useGameStore((s) => s.setLocation);

  const novelActive = novelState !== "IDLE";

  const handleNpcClick = useCallback((npcId: string, scenarioId: string) => {
    if (explorationMode !== "before") return;
    if (novelActive) return;
    void npcId;
    startNovel(scenarioId);
  }, [explorationMode, startNovel, novelActive]);

  const handleDoorClick = useCallback((_triggerId: string, targetLocation: string) => {
    if (novelActive) return;
    setLocation(targetLocation as LocationId);
  }, [novelActive, setLocation]);

  useFirstPersonControls({
    collisionMeshes,
    locked: scopeActive || novelActive,
    allowFKeyLock: explorationMode === "replay",
    worldPaused,
    npcMeshes: explorationMode === "before" && !novelActive ? npcMeshes : [],
    onNpcClick: handleNpcClick,
    triggerMeshes: doorMeshes ?? [],
    onTriggerClick: handleDoorClick,
    initialPosition,
  });

  useEffect(() => {
    setCaptureCamera(camera);
    return () => setCaptureCamera(null);
  }, [camera]);

  // スコープのズーム（FOV 補間） + 時間経過
  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const target = scopeActive ? SCOPE_FOV : BASE_FOV;
    if (Math.abs(cam.fov - target) > 0.1) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, target, Math.min(1, dt * 8));
      cam.updateProjectionMatrix();
    }
    tickTime(Math.min(dt, 0.05));
  });

  return null;
}
