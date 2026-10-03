import React, { useState, useCallback, useRef, type ReactNode } from "react";

// =============================================================
// EditorOverlay — ドラッグ/折りたたみ可能なパネルレイアウト
// §4 パネルレイアウト
// =============================================================

interface EditorOverlayProps {
  children: ReactNode;
  onClose: () => void;
}

export function EditorOverlay({ children, onClose }: EditorOverlayProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // ドラッグ対象はタイトルバーのみ
      if ((e.target as HTMLElement).closest("[data-drag-handle]")) {
        draggingRef.current = true;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        posStartRef.current = { ...position };
        e.preventDefault();
      }
    },
    [position]
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: posStartRef.current.x + dx,
      y: posStartRef.current.y + dy,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  React.useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* タイトルバー */}
      <div
        data-drag-handle
        onMouseDown={handleMouseDown}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 12px",
          background: "rgba(20, 20, 30, 0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          cursor: "move",
          userSelect: "none",
          flexShrink: 0,
          pointerEvents: "auto",
        }}
      >
        <span style={{ fontWeight: "bold", color: "#ffcc00" }}>
          🛠 Asset Placer Editor
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#e0e0e0",
              cursor: "pointer",
              padding: "2px 8px",
              fontSize: "11px",
              fontFamily: "monospace",
            }}
            title={collapsed ? "展開" : "折りたたみ"}
          >
            {collapsed ? "▶" : "▼"}
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#e0e0e0",
              cursor: "pointer",
              padding: "2px 8px",
              fontSize: "11px",
              fontFamily: "monospace",
            }}
            title="エディタを閉じる (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* パネル本体: 左右パネルを端に配置し中央の3Dビューは透過する */}
      {!collapsed && (
        <div
          style={{
            display: "flex",
            flex: 1,
            background: "transparent",
            justifyContent: "space-between",
            alignItems: "flex-start",
            overflow: "hidden",
            minHeight: 0,
            pointerEvents: "none",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}