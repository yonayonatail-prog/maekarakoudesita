import React, { useCallback, useEffect, useState } from "react";
import { useEditorStore } from "./useEditorStore";
import type { GizmoMode } from "../types";

// =============================================================
// TransformPanel — 数値入力とGizmo連動制御
// §7 トランスフォームパネル
// =============================================================

const GIZMO_MODES: GizmoMode[] = ["translate", "rotate", "scale"];

export function TransformPanel() {
  const selectedId = useEditorStore((s) => s.selectedObjectId);
  const worldObjects = useEditorStore((s) => s.worldObjects);
  const updateWorldObject = useEditorStore((s) => s.updateWorldObject);
  const gizmoMode = useEditorStore((s) => s.gizmoMode);
  const setGizmoMode = useEditorStore((s) => s.setGizmoMode);
  const collapsedPanels = useEditorStore((s) => s.collapsedPanels);
  const togglePanel = useEditorStore((s) => s.togglePanel);

  const selected = worldObjects.find((o) => o.id === selectedId) ?? null;
  const isCollapsed = collapsedPanels["transform"] ?? false;

  const [localPosition, setLocalPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [localRotation, setLocalRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [localScale, setLocalScale] = useState<[number, number, number]>([1, 1, 1]);

  // 選択オブジェクトからローカル状態を同期
  useEffect(() => {
    if (selected) {
      setLocalPosition([...selected.position]);
      setLocalRotation([...selected.rotation]);
      setLocalScale([...selected.scale]);
    }
  }, [selected?.id]);

  const handlePositionChange = useCallback(
    (axis: number, value: number) => {
      const next = [...localPosition] as [number, number, number];
      next[axis] = value;
      setLocalPosition(next);
      if (selected) {
        updateWorldObject(selected.id, { position: next });
      }
    },
    [localPosition, selected, updateWorldObject]
  );

  const handleRotationChange = useCallback(
    (axis: number, value: number) => {
      const next = [...localRotation] as [number, number, number];
      next[axis] = value;
      setLocalRotation(next);
      if (selected) {
        updateWorldObject(selected.id, { rotation: next });
      }
    },
    [localRotation, selected, updateWorldObject]
  );

  const handleScaleChange = useCallback(
    (axis: number, value: number) => {
      const next = [...localScale] as [number, number, number];
      next[axis] = value;
      setLocalScale(next);
      if (selected) {
        updateWorldObject(selected.id, { scale: next });
      }
    },
    [localScale, selected, updateWorldObject]
  );

  if (!selected) {
    return (
      <PanelShell title="Transform" panelId="transform" isCollapsed={isCollapsed} onToggle={togglePanel}>
        <div style={{ padding: "8px", color: "#666" }}>No object selected</div>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Transform" panelId="transform" isCollapsed={isCollapsed} onToggle={togglePanel}>
      {/* Gizmoモード切替 */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
        {GIZMO_MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => setGizmoMode(mode)}
            style={{
              flex: 1,
              padding: "2px 4px",
              border: `1px solid ${gizmoMode === mode ? "#ffcc00" : "rgba(255,255,255,0.15)"}`,
              background: gizmoMode === mode ? "rgba(255,204,0,0.15)" : "rgba(255,255,255,0.05)",
              color: "#e0e0e0",
              cursor: "pointer",
              fontSize: "10px",
              fontFamily: "monospace",
              textTransform: "capitalize",
            }}
          >
            {mode === "translate" ? "W" : mode === "rotate" ? "E" : "R"}
          </button>
        ))}
      </div>

      {/* Position */}
      <Vec3Input
        label="Position"
        values={localPosition}
        onChange={handlePositionChange}
        step={0.1}
      />

      {/* Rotation */}
      <Vec3Input
        label="Rotation"
        values={localRotation}
        onChange={handleRotationChange}
        step={1}
      />

      {/* Scale */}
      <Vec3Input
        label="Scale"
        values={localScale}
        onChange={handleScaleChange}
        step={0.1}
        min={0.01}
      />
    </PanelShell>
  );
}

// =============================================================
// 共通パネルシェル
// =============================================================

function PanelShell({
  title,
  panelId,
  isCollapsed,
  onToggle,
  children,
}: {
  title: string;
  panelId: string;
  isCollapsed: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(20, 20, 30, 0.9)",
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => onToggle(panelId)}
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
        <span>{title}</span>
        <span>{isCollapsed ? "▶" : "▼"}</span>
      </div>
      {!isCollapsed && <div style={{ padding: "6px 8px" }}>{children}</div>}
    </div>
  );
}

// =============================================================
// 3成分入力コンポーネント
// =============================================================

function Vec3Input({
  label,
  values,
  onChange,
  step = 0.1,
  min,
}: {
  label: string;
  values: [number, number, number];
  onChange: (axis: number, value: number) => void;
  step?: number;
  min?: number;
}) {
  const axisLabels = ["X", "Y", "Z"];
  return (
    <div style={{ marginBottom: "4px" }}>
      <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>{label}</div>
      <div style={{ display: "flex", gap: "4px" }}>
        {axisLabels.map((axis, i) => (
          <label
            key={axis}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              flex: 1,
            }}
          >
            <span style={{ color: i === 0 ? "#ff4444" : i === 1 ? "#44ff44" : "#4488ff", fontSize: "10px" }}>
              {axis}
            </span>
            <input
              type="number"
              value={values[i]}
              onChange={(e) => onChange(i, parseFloat(e.target.value) || 0)}
              step={step}
              min={min}
              style={{
                width: "100%",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#e0e0e0",
                padding: "2px 4px",
                fontSize: "10px",
                fontFamily: "monospace",
                textAlign: "right",
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}