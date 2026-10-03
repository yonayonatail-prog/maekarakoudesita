import React, { useCallback, useState } from "react";
import { useEditorStore } from "./useEditorStore";
import type { ExpressionFile, ExpressionEntryDirect, ExpressionEntryDiff } from "../types";

// =============================================================
// ExpressionJsonEditor — 表情JSON簡易編集パネル
// §13 表情定義編集（JSONダウンロード機能付き）
// =============================================================

interface Props {
  onClose?: () => void;
}

export function ExpressionJsonEditor(_props: Props) {
  const collapsedPanels = useEditorStore((s) => s.collapsedPanels);
  const togglePanel = useEditorStore((s) => s.togglePanel);
  const isCollapsed = collapsedPanels["expression"] ?? false;

  const [jsonText, setJsonText] = useState<string>(generateSampleJson());
  const [parseError, setParseError] = useState<string | null>(null);

  const handleDownload = useCallback(() => {
    // バリデーション
    try {
      JSON.parse(jsonText);
      setParseError(null);
    } catch (e: any) {
      setParseError(e.message);
      return;
    }

    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expressions.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [jsonText]);

  const handleValidate = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText) as ExpressionFile;
      // 簡易バリデーション: 各エントリの型チェック
      for (const [key, entry] of Object.entries(parsed)) {
        if (!entry) {
          setParseError(`Entry "${key}": value is empty`);
          return;
        }
        if ("morphs" in entry) {
          const d = entry as ExpressionEntryDirect;
          if (typeof d.time !== "number") {
            setParseError(`Entry "${key}": missing "time"`);
            return;
          }
        } else if ("from" in entry) {
          const d = entry as ExpressionEntryDiff;
          if (!d.from || !d.to) {
            setParseError(`Entry "${key}": missing "from"/"to"`);
            return;
          }
        } else {
          setParseError(`Entry "${key}": unknown format`);
          return;
        }
      }
      setParseError(null);
    } catch (e: any) {
      setParseError(e.message);
      return;
    }

    // JSON整形
    try {
      const formatted = JSON.stringify(JSON.parse(jsonText), null, 2);
      setJsonText(formatted);
      setParseError(null);
    } catch (e: any) {
      setParseError(e.message);
    }
  }, [jsonText]);

  const handleReset = useCallback(() => {
    setJsonText(generateSampleJson());
    setParseError(null);
  }, []);

  return (
    <PanelShell title="Expression JSON Editor" panelId="expression" isCollapsed={isCollapsed} onToggle={togglePanel}>
      <div style={{ fontSize: "9px", color: "#666", marginBottom: "6px" }}>
        Edit expression definition JSON (direct / diff format)
      </div>

      {/* ツールバー */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
        <button
          onClick={handleValidate}
          style={{
            padding: "2px 8px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#e0e0e0",
            cursor: "pointer",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
        >
          Validate & Format
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: "2px 8px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#e0e0e0",
            cursor: "pointer",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
        >
          Reset Sample
        </button>
        <button
          onClick={handleDownload}
          style={{
            padding: "2px 8px",
            background: "rgba(255,204,0,0.1)",
            border: "1px solid #ffcc00",
            color: "#ffcc00",
            cursor: "pointer",
            fontSize: "10px",
            fontFamily: "monospace",
            fontWeight: "bold",
          }}
        >
          Download
        </button>
      </div>

      {/* エラー表示 */}
      {parseError && (
        <div
          style={{
            padding: "4px 6px",
            background: "rgba(255,50,50,0.1)",
            border: "1px solid rgba(255,50,50,0.3)",
            color: "#ff5555",
            fontSize: "9px",
            fontFamily: "monospace",
            marginBottom: "6px",
            wordBreak: "break-all",
          }}
        >
          Error: {parseError}
        </div>
      )}

      <div
        style={{
          fontSize: "8px",
          color: "#555",
          marginBottom: "4px",
          lineHeight: 1.4,
        }}
      >
        Format: {"{ "}
        "expressionName": {"{"} "morphs": {"{"} "eye": 1.0 {"}"}, "time": 1.0 {"}"} {"}"}
        <br />
        Diff: {"{ "}
        "expressionName": {"{"} "from": "base", "to": "smile", "time": 2.0 {"}"} {"}"}
      </div>

      {/* テキストエリア */}
      <textarea
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value);
          setParseError(null);
        }}
        spellCheck={false}
        style={{
          width: "100%",
          height: "200px",
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#e0e0e0",
          fontFamily: "monospace",
          fontSize: "10px",
          padding: "6px",
          boxSizing: "border-box",
          resize: "vertical",
          outline: "none",
          lineHeight: 1.5,
        }}
      />
    </PanelShell>
  );
}

function generateSampleJson(): string {
  const sample: ExpressionFile = {
    neutral: {
      morphs: { eye: 0, mouth: 0, eyebrow: 0 },
      time: 1.0,
    },
    happy: {
      morphs: { eye: 0.8, mouth: 1.0, eyebrow: 0.5 },
      time: 0.5,
    },
    surprise: {
      morphs: { eye: 1.0, mouth: 0.3, eyebrow: 1.0 },
      time: 0.3,
      ease: "power2.out",
    },
    blink: {
      from: "neutral",
      to: "neutral",
      time: 0.1,
      ease: "steps(1)",
    },
  };
  return JSON.stringify(sample, null, 2);
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