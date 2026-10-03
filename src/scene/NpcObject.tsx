import * as THREE from "three";

export interface NpcDef {
  id: string;
  position: [number, number, number];
  scenarioId: string;
  label: string;
}

interface Props {
  def: NpcDef;
  onGroupReady?: (group: THREE.Group) => void;
}

export function NpcObject({ def, onGroupReady }: Props) {
  const { id, position, scenarioId, label } = def;
  const ud = { npcId: id, scenarioId, npcLabel: label };

  return (
    <group
      position={position}
      ref={(g) => { if (g) onGroupReady?.(g); }}
    >
      {/* 胴体 */}
      <mesh position={[0, 0.85, 0]} userData={ud}>
        <boxGeometry args={[0.45, 1.1, 0.3]} />
        <meshStandardMaterial color="#9a9590" roughness={0.9} />
      </mesh>
      {/* 頭部 */}
      <mesh position={[0, 1.55, 0]} userData={ud}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#d4a882" roughness={0.8} />
      </mesh>
    </group>
  );
}
