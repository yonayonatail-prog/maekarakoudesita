import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export interface DoorTriggerDef {
  triggerId: string;
  targetLocation: string;
  position: [number, number, number];
  label: string;
  width?: number;
  height?: number;
  rotationY?: number;
}

interface Props {
  def: DoorTriggerDef;
  onMeshReady?: (mesh: THREE.Mesh) => void;
}

export function DoorTrigger({ def, onMeshReady }: Props) {
  const { triggerId, targetLocation, position, width = 1.6, height = 2.4, rotationY = 0 } = def;
  const ud = { triggerId, targetLocation };
  const center: [number, number, number] = [0, height / 2, 0];

  const meshRef = useRef<THREE.Mesh>(null);
  const onMeshReadyRef = useRef(onMeshReady);
  onMeshReadyRef.current = onMeshReady;

  useEffect(() => {
    if (meshRef.current) onMeshReadyRef.current?.(meshRef.current);
  }, []);

  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, 0.1)),
    [width, height]
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 当たり判定（不可視） */}
      <mesh
        ref={meshRef}
        position={center}
        userData={ud}
        visible={false}
      >
        <boxGeometry args={[width, height, 0.6]} />
        <meshStandardMaterial />
      </mesh>
      {/* 青白いエッジフレーム */}
      <lineSegments geometry={edges} position={center}>
        <lineBasicMaterial color="#88ddff" transparent opacity={0.85} />
      </lineSegments>
      {/* ほのかな発光面 */}
      <mesh position={center}>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial
          color="#88ddff"
          transparent
          opacity={0.06}
          emissive="#88ddff"
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}
