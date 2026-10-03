import React, { useCallback } from "react";
import { useEditorStore } from "./useEditorStore";
import type { ObjectState, ChangePattern, EventSize } from "../types";

// =============================================================
// WorldObjectPanel — プロパティ編集フォーム
// §8 ワールドオブジェクトプロパティパネル
// =============================================================

const STATES: ObjectState[] = ["REAL", "OVERWRITTEN", "RECORDED", "RESISTANT"];
const PATTERNS: ChangePattern[] = ["A", "B", "C"];
const SIZES: EventSize[] = ["small", "large"];

export function WorldObjectPanel() {
  const selectedId = useEditorStore((s) => s.selectedObjectId);
  const worldObjects = useEditorStore((s) => s.worldObjects);
  const updateWorldObject = useEditorStore((s) => s.updateWorldObject);
  const collapsedPanels = useEditorStore((s) => s.collapsedPanels);
  const togglePanel = useEditorStore((s) => s.togglePanel);

  const selected = worldObjects.find((o) => o.id === selectedId) ?? null;
  const isCollapsed = collapsedPanels["worldObject"] ?? false;

  const handleChange = useCallback(
    (field: string, value: unknown) => {
      if (selected) {
        updateWorldObject(selected.id, { [field]: value });
      }
    },
    [selected, updateWorldObject]
  );

  if (!selected) {
    return (
      <PanelShell title="World Object" panelId="worldObject" isCollapsed={isCollapsed} onToggle={togglePanel}>
        <div style={{ padding: "8px", color: "#666" }}>No object selected</div>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="World Object" panelId="worldObject" isCollapsed={isCollapsed} onToggle={togglePanel}>
      {/* ID（読み取り専用） */}
      <FieldRow label="ID">
        <span style={{ color: "#888", fontSize: "10px" }}>{selected.id}</span>
      </FieldRow>

      {/* Label */}
      <FieldRow label="Label">
        <input
          type="text"
          value={selected.label}
          onChange={(e) => handleChange("label", e.target.value)}
          style={inputStyle}
        />
      </FieldRow>

      {/* Checkpoint ID */}
      <FieldRow label="CP">
        <input
          type="number"
          value={selected.checkpointId}
          onChange={(e) => handleChange("checkpointId", parseInt(e.target.value) || 0)}
          style={inputStyle}
        />
      </FieldRow>

      {/* State */}
      <FieldRow label="State">
        <select
          value={selected.state}
          onChange={(e) => handleChange("state", e.target.value)}
          style={selectStyle}
        >
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FieldRow>

      {/* Change Pattern */}
      <FieldRow label="Pattern">
        <select
          value={selected.changePattern}
          onChange={(e) => handleChange("changePattern", e.target.value)}
          style={selectStyle}
        >
          {PATTERNS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </FieldRow>

      {/* Event Size */}
      <FieldRow label="Size">
        <select
          value={selected.eventSize}
          onChange={(e) => handleChange("eventSize", e.target.value)}
          style={selectStyle}
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FieldRow>

      {/* フラグ */}
      <div style={{ marginTop: "6px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "4px" }}>
        <CheckField
          label="Related to Nanami"
          checked={selected.relatedToNanami}
          onChange={(v) => handleChange("relatedToNanami", v)}
        />
        <CheckField
          label="On True Path"
          checked={selected.onTruePath}
          onChange={(v) => handleChange("onTruePath", v)}
        />
        <CheckField
          label="Before Captured"
          checked={selected.beforeCaptured}
          onChange={(v) => handleChange("beforeCaptured", v)}
        />
        <CheckField
          label="After Captured"
          checked={selected.afterCaptured}
          onChange={(v) => handleChange("afterCaptured", v)}
        />
        <CheckField
          label="Is Recorded"
          checked={selected.isRecorded}
          onChange={(v) => handleChange("isRecorded", v)}
        />
        <CheckField
          label="Is Resistant"
          checked={selected.isResistant}
          onChange={(v) => handleChange("isResistant", v)}
        />
      </div>

      {/* Branch Flag */}
      <FieldRow label="Branch Flag">
        <input
          type="text"
          value={selected.branchFlag ?? ""}
          onChange={(e) => handleChange("branchFlag", e.target.value || null)}
          style={inputStyle}
          placeholder="null"
        />
      </FieldRow>
    </PanelShell>
  );
}

// =============================================================
// 共通パネルシェル（TransformPanelと共有するため、本来は共通化すべきだが
// 簡易のためここでも定義）
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
// 共通UI部品
// =============================================================

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#e0e0e0",
  padding: "2px 4px",
  fontSize: "10px",
  fontFamily: "monospace",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "3px", gap: "6px" }}>
      <span style={{ width: "80px", fontSize: "10px", color: "#888", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "10px",
        cursor: "pointer",
        marginBottom: "2px",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ cursor: "pointer" }}
      />
      <span style={{ color: "#aaa" }}>{label}</span>
    </label>
  );
}