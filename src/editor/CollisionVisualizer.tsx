import React from "react";
import { useEditorStore } from "./useEditorStore";
import type { CollisionType } from "../types";

// =============================================================
// CollisionVisualizer — 種別ごとのコリジョン可視化とTransform操作
// §10 コリジョン可視化パネル
// =============================================================

const COLORS: Record<CollisionType, string> = {
  wall: "rgba(255, 80, 80, 0.4)",
  floor: "rgba(80, 80, 255, 0.4)",
  trigger: "rgba(80, 255, 80, 0.4)",
  boundary: "rgba(255, 255, 80, 0.4)",
};

const COLLISION_TYPES: CollisionType[] = ["wall", "floor", "trigger", "boundary"];

export function CollisionVisualizer() {
  const collisionMeshes = useEditorStore((s) => s.collisionMeshes);
  const addCollisionMesh = useEditorStore((s) => s.addCollisionMesh);
  const updateCollisionMesh = useEditorStore((s) => s.updateCollisionMesh);
  const removeCollisionMesh = useEditorStore((s) => s.removeCollisionMesh);
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId);
  const selectObject = useEditorStore((s) => s.selectObject);
  const collapsedPanels = useEditorStore((s) => s.collapsedPanels);
  const togglePanel = useEditorStore((s) => s.togglePanel);

  const isCollapsed = collapsedPanels["collision"] ?? false;

  const handleAdd = () => {
    const id = `collision_${Date.now()}`;
    addCollisionMesh({
      id,
      type: "wall",
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });
  };

  return (
    <div
      style={{
        background: "rgba(20, 20, 30, 0.9)",
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => togglePanel("collision")}
        style={{
          padding: "4px 8px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(30, 30, 40, 0.8)",
          borderBottom: isCollapsed ? "none" : "1px solid rgba(255,255,255,0.1)",
          fontSize: "11px",
          fontWeight: "bold",
          userSelect: "none",
        }}
      >
        <span>Collision ({collisionMeshes.length})</span>
        <span>{isCollapsed ? "▶" : "▼"}</span>
      </div>

      {!isCollapsed && (
        <div style={{ padding: "6px 8px" }}>
          <button
            onClick={handleAdd}
            style={{
              width: "100%",
              padding: "3px 8px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#e0e0e0",
              cursor: "pointer",
              fontSize: "10px",
              fontFamily: "monospace",
              marginBottom: "6px",
            }}
          >
            + Add Collision Mesh
          </button>

          {collisionMeshes.length === 0 ? (
            <div style={{ color: "#666", fontSize: "10px", textAlign: "center" }}>
              No collision meshes
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "300px", overflowY: "auto" }}>
              {collisionMeshes.map((mesh) => (
                <CollisionEntry
                  key={mesh.id}
                  mesh={mesh}
                  isSelected={selectedObjectId === mesh.id}
                  onSelect={() => selectObject(mesh.id)}
                  onUpdate={(updates) => updateCollisionMesh(mesh.id, updates)}
                  onRemove={() => removeCollisionMesh(mesh.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CollisionEntry({
  mesh,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}: {
  mesh: { id: string; type: CollisionType; position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] };
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<{ type: CollisionType; position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        background: isSelected ? "rgba(255,204,0,0.15)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isSelected ? "#ffcc00" : "rgba(255,255,255,0.08)"}`,
        padding: "4px 6px",
        fontSize: "10px",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px", cursor: "pointer" }}
        onClick={onSelect}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: COLORS[mesh.type],
            }}
          />
          <span style={{ color: "#ccc" }}>{mesh.id.slice(-8)}</span>
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            background: "none",
            border: "none",
            color: "#ff4444",
            cursor: "pointer",
            fontSize: "12px",
            padding: "0 2px",
          }}
          title="Remove"
        >
          ×
        </button>
      </div>

      {/* Type selector */}
      <div style={{ marginBottom: "3px" }}>
        <select
          value={mesh.type}
          onChange={(e) => onUpdate({ type: e.target.value as CollisionType })}
          style={miniSelectStyle}
        >
          {COLLISION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Position */}
      <Vec3Row label="Pos" values={mesh.position} onChange={(v) => onUpdate({ position: v })} />
      <Vec3Row label="Rot" values={mesh.rotation} onChange={(v) => onUpdate({ rotation: v })} />
      <Vec3Row label="Scl" values={mesh.scale} onChange={(v) => onUpdate({ scale: v })} />
    </div>
  );
}

function Vec3Row({
  label,
  values,
  onChange,
}: {
  label: string;
  values: [number, number, number];
  onChange: (v: [number, number, number]) => void;
}) {
  const axes = ["X", "Y", "Z"];
  const colors = ["#ff4444", "#44ff44", "#4488ff"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "1px" }}>
      <span style={{ color: "#666", width: "22px", fontSize: "9px" }}>{label}</span>
      {axes.map((axis, i) => (
        <input
          key={axis}
          type="number"
          value={values[i]}
          onChange={(e) => {
            const next = [...values] as [number, number, number];
            next[i] = parseFloat(e.target.value) || 0;
            onChange(next);
          }}
          step={0.1}
          style={{
            ...miniInputStyle,
            width: "100%",
            color: colors[i],
          }}
        />
      ))}
    </div>
  );
}

const miniInputStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "1px 2px",
  fontSize: "9px",
  fontFamily: "monospace",
  textAlign: "right",
  boxSizing: "border-box",
};

const miniSelectStyle: React.CSSProperties = {
  ...miniInputStyle,
  width: "100%",
  color: "#e0e0e0",
  cursor: "pointer",
};