import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { setHoveredNpc } from "./npcRegistry";

// =============================================================
// 一人称コントローラ（仕様 §11-2 / §2-3）
// - WASD / 矢印で水平移動、ポインタロックで視点回転
// - Raycaster による壁コリジョン（collisionMeshes に向けて判定）
// - 慣性（DECELERATION）付き
// =============================================================

const WALK_SPEED = 3.0; // m/s
const LOOK_SENSITIVITY = 0.0022;
const LOOK_VERTICAL_LIMIT = Math.PI / 3; // 上下60度
const EYE_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.5;
const DECELERATION = 10.0;
const NPC_INTERACT_RANGE = 8; // m
const TRIGGER_INTERACT_RANGE = 4; // m

interface Options {
  /** コリジョン対象メッシュ（壁・看板など） */
  collisionMeshes: THREE.Object3D[];
  /** スコープ中は移動・回転を止める */
  locked: boolean;
  /** true のときのみ F キーでポインタロックをトグルできる（高速再生フェーズ限定） */
  allowFKeyLock: boolean;
  /** 世界凍結中は canvas クリックでポインタロックを取得しない（F キーと同期ずれ防止） */
  worldPaused?: boolean;
  /** NPCメッシュ群（左クリック判定用） */
  npcMeshes?: THREE.Object3D[];
  /** NPCをクリックしたときのコールバック */
  onNpcClick?: (npcId: string, scenarioId: string) => void;
  /** ドアなどのシーン遷移トリガーメッシュ群 */
  triggerMeshes?: THREE.Object3D[];
  /** トリガーをクリックしたときのコールバック */
  onTriggerClick?: (triggerId: string, targetLocation: string) => void;
  /** カメラ初期位置（マウント時のみ参照） */
  initialPosition?: [number, number, number];
}

export function useFirstPersonControls({ collisionMeshes, locked, allowFKeyLock, worldPaused, npcMeshes, onNpcClick, triggerMeshes, onTriggerClick, initialPosition }: Options) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const isPointerLocked = useRef(false);
  const worldPausedRef = useRef(false);
  worldPausedRef.current = worldPaused ?? false;
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const npcRaycaster = useMemo(() => new THREE.Raycaster(), []);
  const npcMeshesRef = useRef<THREE.Object3D[]>([]);
  npcMeshesRef.current = npcMeshes ?? [];
  const onNpcClickRef = useRef(onNpcClick);
  onNpcClickRef.current = onNpcClick;
  const triggerMeshesRef = useRef<THREE.Object3D[]>([]);
  triggerMeshesRef.current = triggerMeshes ?? [];
  const onTriggerClickRef = useRef(onTriggerClick);
  onTriggerClickRef.current = onTriggerClick;
  const initialPositionRef = useRef(initialPosition);

  // 初期位置（マウント時のみ参照）
  useEffect(() => {
    const pos = initialPositionRef.current;
    camera.position.set(pos?.[0] ?? 0, EYE_HEIGHT, pos?.[2] ?? 4);
    euler.current.setFromQuaternion(camera.quaternion);
  }, [camera]);

  // キー入力
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // ポインタロック + マウス回転
  // 右クリック: 常にポインタロックをトグル（両フェーズで視点回転可能）
  // F キー: 高速再生フェーズ（allowFKeyLock）のみポインタロックをトグル
  useEffect(() => {
    const canvas = gl.domElement;
    const acquireLock = () => {
      if (locked) return;
      if (isPointerLocked.current) document.exitPointerLock();
      else canvas.requestPointerLock();
    };
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      acquireLock();
    };
    const onKeyF = (e: KeyboardEvent) => {
      if (e.code !== "KeyF") return;
      if (!allowFKeyLock) return; // 記憶フェーズでは F キーはポインタロックに使わない
      e.preventDefault();
      acquireLock();
    };
    const onLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current || locked) return;
      euler.current.y -= e.movementX * LOOK_SENSITIVITY;
      euler.current.x -= e.movementY * LOOK_SENSITIVITY;
      euler.current.x = Math.max(
        -LOOK_VERTICAL_LIMIT,
        Math.min(LOOK_VERTICAL_LIMIT, euler.current.x)
      );
      camera.quaternion.setFromEuler(euler.current);
    };
    canvas.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyF);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyF);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [camera, gl, locked, allowFKeyLock]);

  // 左クリック: 未ロック時はカーソルロック取得、ロック時はNPCへの話しかけ判定
  useEffect(() => {
    const canvas = gl.domElement;
    const onClick = () => {
      if (locked) return; // スコープ中は無視
      if (!isPointerLocked.current) {
        // 世界凍結中はクリックでポインタロックを取得しない。
        // F キーが worldPaused と isPointerLocked を同時にトグルする設計のため、
        // ここで単独取得するとその後の F キー操作が反転する。
        if (!worldPausedRef.current) canvas.requestPointerLock();
        return;
      }
      // ポインタロック済み → NPC ヒット判定
      if (npcMeshesRef.current.length > 0 && onNpcClickRef.current) {
        npcRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hits = npcRaycaster.intersectObjects(npcMeshesRef.current, true);
        if (hits.length > 0 && hits[0].distance < NPC_INTERACT_RANGE) {
          const { npcId, scenarioId } = hits[0].object.userData as { npcId?: string; scenarioId?: string };
          if (npcId && scenarioId) onNpcClickRef.current(npcId, scenarioId);
        }
      }
      // ドアトリガー判定
      if (triggerMeshesRef.current.length > 0 && onTriggerClickRef.current) {
        npcRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hits = npcRaycaster.intersectObjects(triggerMeshesRef.current, true);
        if (hits.length > 0 && hits[0].distance < TRIGGER_INTERACT_RANGE) {
          const { triggerId, targetLocation } = hits[0].object.userData as { triggerId?: string; targetLocation?: string };
          if (triggerId && targetLocation) onTriggerClickRef.current(triggerId, targetLocation);
        }
      }
    };
    canvas.addEventListener("click", onClick);
    return () => canvas.removeEventListener("click", onClick);
  }, [camera, gl, locked, npcRaycaster]);

  // タッチ（スマホ）回転：1本指ドラッグで視点
  useEffect(() => {
    const canvas = gl.domElement;
    let lastX = 0;
    let lastY = 0;
    let active = false;
    const start = (e: TouchEvent) => {
      if (locked || e.touches.length !== 1) return;
      active = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    };
    const move = (e: TouchEvent) => {
      if (!active || locked || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      euler.current.y -= dx * LOOK_SENSITIVITY * 1.5;
      euler.current.x -= dy * LOOK_SENSITIVITY * 1.5;
      euler.current.x = Math.max(
        -LOOK_VERTICAL_LIMIT,
        Math.min(LOOK_VERTICAL_LIMIT, euler.current.x)
      );
      camera.quaternion.setFromEuler(euler.current);
    };
    const end = () => {
      active = false;
    };
    canvas.addEventListener("touchstart", start, { passive: true });
    canvas.addEventListener("touchmove", move, { passive: true });
    canvas.addEventListener("touchend", end);
    return () => {
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
    };
  }, [camera, gl, locked]);

  // 毎フレーム: NPCホバー検知（クロスヘアが人に向いているか）
  useFrame(() => {
    if (npcMeshesRef.current.length === 0) return;
    npcRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hits = npcRaycaster.intersectObjects(npcMeshesRef.current, true);
    if (hits.length > 0 && hits[0].distance < NPC_INTERACT_RANGE) {
      const { npcId, npcLabel } = hits[0].object.userData as { npcId?: string; npcLabel?: string };
      setHoveredNpc(npcId ?? null, npcLabel ?? null);
    } else {
      setHoveredNpc(null, null);
    }
  });

  // 移動 + コリジョン
  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);

    // 入力（前後 / 左右）
    const forward =
      (keys.current["KeyW"] || keys.current["ArrowUp"] ? 1 : 0) -
      (keys.current["KeyS"] || keys.current["ArrowDown"] ? 1 : 0);
    const strafe =
      (keys.current["KeyD"] || keys.current["ArrowRight"] ? 1 : 0) -
      (keys.current["KeyA"] || keys.current["ArrowLeft"] ? 1 : 0);

    // 目標速度へ慣性で近づける（locked 時は 0 に減速）
    const targetVz = locked ? 0 : forward * WALK_SPEED;
    const targetVx = locked ? 0 : strafe * WALK_SPEED;
    const smoothing = 1 - Math.exp(-DECELERATION * dt);
    velocity.current.z += (targetVz - velocity.current.z) * smoothing;
    velocity.current.x += (targetVx - velocity.current.x) * smoothing;

    // カメラ向きに沿った移動ベクトルへ変換（dir = 前方, right = 右方）
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3()
      .crossVectors(dir, new THREE.Vector3(0, 1, 0))
      .normalize();

    const move = new THREE.Vector3();
    move.addScaledVector(dir, velocity.current.z * dt); // 前後
    move.addScaledVector(right, velocity.current.x * dt); // 左右

    // コリジョン：移動方向に Ray を飛ばして壁判定
    if (move.lengthSq() > 1e-8 && collisionMeshes.length > 0) {
      const moveDir = move.clone().normalize();
      raycaster.set(camera.position, moveDir);
      const hits = raycaster.intersectObjects(collisionMeshes, false);
      if (hits.length > 0 && hits[0].distance < PLAYER_RADIUS + move.length()) {
        // 壁に当たる → 移動を止める（簡易）。速度もリセットしてめり込み防止
        move.multiplyScalar(0);
        velocity.current.set(0, 0, 0);
      }
    }

    camera.position.add(move);
    camera.position.y = EYE_HEIGHT;

    // 街の境界（不可視の壁）。z は手前 +6、奥 -BOUND の範囲に制限
    const BOUND = 24;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -5.5, 5.5);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -BOUND, 6);
  });
}
