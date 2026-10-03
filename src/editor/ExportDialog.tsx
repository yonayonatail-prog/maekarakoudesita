import { useCallback, useMemo } from "react";
import { useEditorStore } from "./useEditorStore";
import type { WorldObject } from "../types";

// =============================================================
// ExportDialog — 変更差分ダイアログ、JSONダウンロード
// §17 エクスポートダイアログ
// =============================================================

interface Props {
  initialObjects?: WorldObject[];
  onClose?: () => void;
}

export function ExportDialog({ initialObjects = [], onClose }: Props) {
  const worldObjects = useEditorStore((s) => s.worldObjects);

  const diff = useMemo(() => {
    const result: {
      added: WorldObject[];
      removed: WorldObject[];
      modified: { before: WorldObject; after: WorldObject }[];
    } = {
      added: [],
      removed: [],
      modified: [],
    };

    const oldMap = new Map(initialObjects.map((o) => [o.id, o]));
    const newMap = new Map(worldObjects.map((o) => [o.id, o]));

    // Added
    for (const [id, obj] of newMap) {
      if (!oldMap.has(id)) result.added.push(obj);
    }

    // Removed
    for (const [id, obj] of oldMap) {
      if (!newMap.has(id)) result.removed.push(obj);
    }

    // Modified
    for (const [id, newObj] of newMap) {
      const oldObj = oldMap.get(id);
      if (oldObj && JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
        result.modified.push({ before: oldObj, after: newObj });
      }
    }

    return result;
  }, [initialObjects, worldObjects]);

  const handleExport = useCallback(() => {
    const json = JSON.stringify(worldObjects, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "world_objects.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [worldObjects]);

  const totalChanges = diff.added.length + diff.removed.length + diff.modified.length;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        pointerEvents: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a1a2e",
          border: "1px solid rgba(255,204,0,0.3)",
          padding: "16px",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflowY: "auto",
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#e0e0e0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            paddingBottom: "8px",
          }}
        >
          <span style={{ fontWeight: "bold", fontSize: "13px" }}>
            Export — {totalChanges} changes
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ×
          </button>
        </div>

        {/* Summary */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          <Badge color="#44ff44" label="Added" count={diff.added.length} />
          <Badge color="#ff4444" label="Removed" count={diff.removed.length} />
          <Badge color="#ffcc00" label="Modified" count={diff.modified.length} />
        </div>

        {/* Added list */}
        {diff.added.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <div style={{ color: "#44ff44", marginBottom: "4px" }}>+ Added ({diff.added.length})</div>
            {diff.added.map((o) => (
              <div key={o.id} style={{ paddingLeft: "12px", color: "#aaa" }}>
                + {o.label} ({o.id})
              </div>
            ))}
          </div>
        )}

        {/* Removed list */}
        {diff.removed.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <div style={{ color: "#ff4444", marginBottom: "4px" }}>− Removed ({diff.removed.length})</div>
            {diff.removed.map((o) => (
              <div key={o.id} style={{ paddingLeft: "12px", color: "#aaa" }}>
                − {o.label} ({o.id})
              </div>
            ))}
          </div>
        )}

        {/* Modified list */}
        {diff.modified.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <div style={{ color: "#ffcc00", marginBottom: "4px" }}>~ Modified ({diff.modified.length})</div>
            {diff.modified.map(({ before, after }) => {
              const changedFields = getChangedFields(before, after);
              return (
                <div key={before.id} style={{ paddingLeft: "12px", color: "#aaa", marginBottom: "2px" }}>
                  ~ {after.label} — {changedFields.join(", ")}
                </div>
              );
            })}
          </div>
        )}

        {totalChanges === 0 && (
          <div style={{ color: "#666", textAlign: "center", padding: "16px" }}>
            No changes detected
          </div>
        )}

        {/* Export button */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px", marginTop: "12px" }}>
          <button
            onClick={handleExport}
            disabled={totalChanges === 0}
            style={{
              width: "100%",
              padding: "8px",
              background: totalChanges > 0 ? "rgba(255,204,0,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${totalChanges > 0 ? "#ffcc00" : "rgba(255,255,255,0.1)"}`,
              color: totalChanges > 0 ? "#ffcc00" : "#555",
              cursor: totalChanges > 0 ? "pointer" : "default",
              fontSize: "12px",
              fontFamily: "monospace",
              fontWeight: "bold",
            }}
          >
            Download world_objects.json
          </button>
          <div style={{ color: "#666", fontSize: "9px", marginTop: "4px", textAlign: "center" }}>
            Save to public/data/ folder and restart to apply
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px" }}>
      <span
        style={{
          display: "inline-block",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: color,
        }}
      />
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ color: color, fontWeight: "bold" }}>{count}</span>
    </div>
  );
}

/** 変更されたフィールド名を返す（浅い比較） */
function getChangedFields(
  before: WorldObject,
  after: WorldObject
): string[] {
  const fields: string[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    const bv = JSON.stringify((before as any)[k]);
    const av = JSON.stringify((after as any)[k]);
    if (bv !== av) fields.push(k);
  }
  return fields;
}