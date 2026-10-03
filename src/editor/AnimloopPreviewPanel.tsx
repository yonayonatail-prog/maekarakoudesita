import React, { useCallback } from "react";
import { useEditorStore } from "./useEditorStore";

// =============================================================
// AnimloopPreviewPanel — 手動シークスライダーと再生制御
// §12 animloopプレビューパネル
// =============================================================

export function AnimloopPreviewPanel() {
  const selectedId = useEditorStore((s) => s.selectedObjectId);
  const worldObjects = useEditorStore((s) => s.worldObjects);
  const animloopPreview = useEditorStore((s) => s.animloopPreview);
  const setAnimloopProgress = useEditorStore((s) => s.setAnimloopProgress);
  const toggleAnimloopPlay = useEditorStore((s) => s.toggleAnimloopPlay);
  const setPreviewSpeed = useEditorStore((s) => s.setPreviewSpeed);
  const collapsedPanels = useEditorStore((s) => s.collapsedPanels);
  const togglePanel = useEditorStore((s) => s.togglePanel);

  const selected = worldObjects.find((o) => o.id === selectedId) ?? null;
  const isCollapsed = collapsedPanels["animloop"] ?? false;

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAnimloopProgress(parseFloat(e.target.value));
    },
    [setAnimloopProgress]
  );

  const handleSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPreviewSpeed(parseFloat(e.target.value));
    },
    [setPreviewSpeed]
  );

  if (!selected) {
    return (
      <PanelShell title="Animloop Preview" panelId="animloop" isCollapsed={isCollapsed} onToggle={togglePanel}>
        <div style={{ padding: "8px", color: "#666" }}>No object selected</div>
      </PanelShell>
    );
  }

  const patternSpeeds: Record<string, number> = {
    A: 0.5,
    B: 1.0,
    C: 1.5,
  };
  const suggestedSpeed = patternSpeeds[selected.changePattern] ?? 1.0;

  return (
    <PanelShell title="Animloop Preview" panelId="animloop" isCollapsed={isCollapsed} onToggle={togglePanel}>
      {/* 選択オブジェクト情報 */}
      <div style={{ fontSize: "10px", color: "#888", marginBottom: "6px" }}>
        {selected.label} — Pattern {selected.changePattern} (suggested: {suggestedSpeed}x)
      </div>

      {/* 再生制御 */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
        <button
          onClick={toggleAnimloopPlay}
          style={{
            padding: "2px 8px",
            background: animloopPreview.isPlaying ? "rgba(255,204,0,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${animloopPreview.isPlaying ? "#ffcc00" : "rgba(255,255,255,0.15)"}`,
            color: "#e0e0e0",
            cursor: "pointer",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
        >
          {animloopPreview.isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>

        <button
          onClick={() => setAnimloopProgress(0)}
          style={{
            padding: "2px 6px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#e0e0e0",
            cursor: "pointer",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
        >
          ⏮ 0
        </button>

        <button
          onClick={() => setAnimloopProgress(1)}
          style={{
            padding: "2px 6px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#e0e0e0",
            cursor: "pointer",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
        >
          ⏭ 1
        </button>
      </div>

      {/* シークスライダー */}
      <div style={{ marginBottom: "6px" }}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={animloopPreview.progress}
          onChange={handleSliderChange}
          style={{
            width: "100%",
            cursor: "pointer",
            accentColor: "#ffcc00",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "9px",
            color: "#666",
          }}
        >
          <span>Before (0.0)</span>
          <span>{animloopPreview.progress.toFixed(2)}</span>
          <span>After (1.0)</span>
        </div>
      </div>

      {/* 再生速度 */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "10px", color: "#888", flexShrink: 0 }}>Speed:</span>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={animloopPreview.previewSpeed}
          onChange={handleSpeedChange}
          style={{ flex: 1, cursor: "pointer", accentColor: "#ffcc00" }}
        />
        <span style={{ fontSize: "10px", color: "#ccc", width: "28px", textAlign: "right" }}>
          {animloopPreview.previewSpeed.toFixed(1)}x
        </span>
      </div>
    </PanelShell>
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