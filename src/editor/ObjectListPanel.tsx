import { useMemo, useState } from "react";
import { useEditorStore } from "./useEditorStore";
import { assetTemplates } from "./assetTemplates";
import { createWorldObject } from "./objectFactories";

// =============================================================
// ObjectListPanel — 仮想スクロールによるアセット一覧とCPフィルター
// §5 オブジェクト一覧パネル
// ※ Add Object UI は assetTemplates をデータ駆動で描画
// =============================================================

export function ObjectListPanel() {
  const worldObjects = useEditorStore((s) => s.worldObjects);
  const checkpointFilter = useEditorStore((s) => s.checkpointFilter);
  const setCheckpointFilter = useEditorStore((s) => s.setCheckpointFilter);
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId);
  const selectObject = useEditorStore((s) => s.selectObject);
  const addWorldObject = useEditorStore((s) => s.addWorldObject);

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const templatesByCategory = useMemo(() => {
    const groups: Record<string, typeof assetTemplates> = {
      Character: [],
      Furniture: [],
      Background: [],
    };
    for (const t of assetTemplates) {
      if (groups[t.category]) {
        groups[t.category].push(t);
      }
    }
    return groups;
  }, []);

  const filtered = useMemo(() => {
    if (checkpointFilter === "all") return worldObjects;
    return worldObjects.filter((o) => o.checkpointId === checkpointFilter);
  }, [worldObjects, checkpointFilter]);

  // ユニークなCP一覧
  const cpList = useMemo(() => {
    const cps = new Set(worldObjects.map((o) => o.checkpointId));
    return Array.from(cps).sort((a, b) => a - b);
  }, [worldObjects]);

  return (
    <div
      style={{
        width: "280px",
        minWidth: "280px",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(10, 10, 20, 0.8)",
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          padding: "6px 8px",
          background: "rgba(30, 30, 40, 0.9)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          fontWeight: "bold",
          fontSize: "11px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Objects ({filtered.length})</span>
      </div>

      {/* Add Object ボタン & メニュー */}
      <div style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          style={{
            width: "100%",
            padding: "4px 8px",
            background: "rgba(0, 150, 255, 0.15)",
            border: "1px solid rgba(0, 150, 255, 0.3)",
            color: "#66ccff",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: "bold",
            fontFamily: "monospace",
          }}
        >
          {isAddMenuOpen ? "✕ Close Menu" : "＋ Add Object"}
        </button>

        {isAddMenuOpen && (
          <div
            style={{
              background: "rgba(20, 20, 30, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "2px",
              padding: "6px",
              marginTop: "4px",
              maxHeight: "260px",
              overflowY: "auto",
            }}
          >
            {Object.entries(templatesByCategory).map(([category, items]) => (
              <div key={category} style={{ marginBottom: "8px" }}>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#888",
                    textTransform: "uppercase",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    paddingBottom: "2px",
                    marginBottom: "4px",
                    fontWeight: "bold",
                  }}
                >
                  {category}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        const newObj = createWorldObject(item.label, item.id);
                        addWorldObject(newObj);
                        setIsAddMenuOpen(false);
                      }}
                      style={{
                        textAlign: "left",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        padding: "3px 6px",
                        fontSize: "10px",
                        color: "#ccc",
                        cursor: "pointer",
                        borderRadius: "1px",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                        (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                        (e.currentTarget as HTMLButtonElement).style.color = "#ccc";
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CPフィルター */}
      <div
        style={{
          padding: "4px 8px",
          display: "flex",
          gap: "4px",
          flexWrap: "wrap",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          onClick={() => setCheckpointFilter("all")}
          style={{
            background: checkpointFilter === "all" ? "rgba(255,204,0,0.2)" : "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#e0e0e0",
            cursor: "pointer",
            padding: "1px 6px",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
        >
          ALL
        </button>
        {cpList.map((cp) => (
          <button
            key={cp}
            onClick={() => setCheckpointFilter(cp)}
            style={{
              background: checkpointFilter === cp ? "rgba(255,204,0,0.2)" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#e0e0e0",
              cursor: "pointer",
              padding: "1px 6px",
              fontSize: "10px",
              fontFamily: "monospace",
            }}
          >
            CP{cp}
          </button>
        ))}
      </div>

      {/* スクロール可能なオブジェクト一覧 */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "12px", textAlign: "center", color: "#666" }}>
            No objects
          </div>
        ) : (
          filtered.map((obj) => {
            const isSelected = obj.id === selectedObjectId;
            return (
              <div
                key={obj.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "4px 8px",
                  cursor: "pointer",
                  height: "28px",
                  background: isSelected
                    ? "rgba(255, 204, 0, 0.15)"
                    : "transparent",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  boxSizing: "border-box",
                }}
                onClick={() => selectObject(obj.id)}
                title={`CP${obj.checkpointId}: ${obj.label}`}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    marginRight: "8px",
                    flexShrink: 0,
                    background:
                      obj.state === "OVERWRITTEN"
                        ? "#ff4444"
                        : obj.state === "RECORDED"
                          ? "#44aaff"
                          : obj.state === "RESISTANT"
                            ? "#44ff44"
                            : "#888888",
                  }}
                />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {obj.label}
                </span>
                <span style={{ color: "#666", fontSize: "10px", marginLeft: "4px" }}>
                  CP{obj.checkpointId}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}