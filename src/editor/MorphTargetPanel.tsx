import React, { useCallback } from "react";
import { useEditorStore } from "./useEditorStore";
import type { MorphTargetData } from "../types";

// =============================================================
// MorphTargetPanel — リグ付きアセットの表情・モーフ設定UI
// §13 モーフターゲットパネル
// =============================================================

export function MorphTargetPanel() {
  const selectedId = useEditorStore((s) => s.selectedObjectId);
  const worldObjects = useEditorStore((s) => s.worldObjects);
  const updateWorldObject = useEditorStore((s) => s.updateWorldObject);
  const collapsedPanels = useEditorStore((s) => s.collapsedPanels);
  const togglePanel = useEditorStore((s) => s.togglePanel);

  const selected = worldObjects.find((o) => o.id === selectedId) ?? null;
  const isCollapsed = collapsedPanels["morph"] ?? false;

  const morphTargets = selected?.morphTargets ?? [];

  const handleWeightChange = useCallback(
    (name: string, weight: number) => {
      if (!selected) return;
      const updated = morphTargets.map((mt) =>
        mt.name === name ? { ...mt, weight } : mt
      );
      updateWorldObject(selected.id, { morphTargets: updated });
    },
    [selected, morphTargets, updateWorldObject]
  );

  const handleWeightReset = useCallback(() => {
    if (!selected) return;
    const reset = morphTargets.map((mt) => ({ ...mt, weight: 0 }));
    updateWorldObject(selected.id, { morphTargets: reset });
  }, [selected, morphTargets, updateWorldObject]);

  if (!selected) {
    return (
      <PanelShell title="Morph Targets" panelId="morph" isCollapsed={isCollapsed} onToggle={togglePanel}>
        <div style={{ padding: "8px", color: "#666" }}>No object selected</div>
      </PanelShell>
    );
  }

  if (morphTargets.length === 0) {
    return (
      <PanelShell title="Morph Targets" panelId="morph" isCollapsed={isCollapsed} onToggle={togglePanel}>
        <div style={{ padding: "8px", color: "#666" }}>No morph targets available</div>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Morph Targets" panelId="morph" isCollapsed={isCollapsed} onToggle={togglePanel}>
      <div style={{ marginBottom: "6px" }}>
        <button
          onClick={handleWeightReset}
          style={{
            width: "100%",
            padding: "2px 6px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#e0e0e0",
            cursor: "pointer",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
        >
          ↺ Reset All Weights
        </button>
      </div>

      <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
        {morphTargets.map((mt) => (
          <MorphTargetRow
            key={mt.name}
            morphTarget={mt}
            onChange={(w) => handleWeightChange(mt.name, w)}
          />
        ))}
      </div>
    </PanelShell>
  );
}

function MorphTargetRow({
  morphTarget,
  onChange,
}: {
  morphTarget: MorphTargetData;
  onChange: (weight: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 4px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* 名前 */}
      <span
        style={{
          flex: 1,
          fontSize: "9px",
          color: "#aaa",
          fontFamily: "monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={morphTarget.name}
      >
        {morphTarget.name}
      </span>

      {/* スライダー */}
      <input
        type="range"
        min={morphTarget.min ?? 0}
        max={morphTarget.max ?? 1}
        step="0.01"
        value={morphTarget.weight}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 2, cursor: "pointer", accentColor: "#ffcc00" }}
      />

      {/* 数値 */}
      <input
        type="number"
        value={morphTarget.weight}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.max(morphTarget.min ?? 0, Math.min(morphTarget.max ?? 1, v)));
        }}
        step={0.01}
        min={morphTarget.min ?? 0}
        max={morphTarget.max ?? 1}
        style={{
          width: "42px",
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#e0e0e0",
          padding: "1px 2px",
          fontSize: "9px",
          fontFamily: "monospace",
          textAlign: "right",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

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