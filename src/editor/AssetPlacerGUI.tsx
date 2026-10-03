import { useEffect, useRef, useCallback, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { useEditorStore, setEditorInitialObjects } from "./useEditorStore";
import { useGameStore } from "../store/gameStore";
import { EditorOverlay } from "./EditorOverlay";
import { ObjectListPanel } from "./ObjectListPanel";
import { TransformPanel } from "./TransformPanel";
import { WorldObjectPanel } from "./WorldObjectPanel";
import { AnimloopPreviewPanel } from "./AnimloopPreviewPanel";
import { ExportDialog } from "./ExportDialog";
import { MorphTargetPanel } from "./MorphTargetPanel";
import { ExpressionJsonEditor } from "./ExpressionJsonEditor";
import { TimelineEditorPanel } from "./TimelineEditorPanel";
import { CollisionVisualizer } from "./CollisionVisualizer";
import { useEditorKeyboard } from "./useEditorKeyboard";
import type { WorldObject } from "../types";

// =============================================================
// AssetPlacerGUI — エディタのルートコンポーネント
// §3 起動・終了制御、GSAP全局停止/再開
// ==============================================================

interface AssetPlacerGUIProps {
  initialWorldObjects?: WorldObject[];
  onClose?: () => void;
}

export function AssetPlacerGUI({ initialWorldObjects, onClose }: AssetPlacerGUIProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const enableEditor = useEditorStore((s) => s.enableEditor);
  const disableEditor = useEditorStore((s) => s.disableEditor);
  const isEditorEnabled = useEditorStore((s) => s.isEditorEnabled);

  // GSAP グローバルタイムライン停止
  const timelinePausedRef = useRef(false);

  useEffect(() => {
    // 動的 import で gsap を取得（存在しない場合はスキップ）
    import("gsap").then((gsap) => {
      if (!timelinePausedRef.current) {
        gsap.default.globalTimeline.pause();
        timelinePausedRef.current = true;
      }
    }).catch(() => {
      // gsap 未導入の場合は無視
    });

    return () => {
      // アンマウント時にGSAP再開
      if (timelinePausedRef.current) {
        import("gsap").then((gsap) => {
          gsap.default.globalTimeline.resume();
          timelinePausedRef.current = false;
        }).catch(() => {});
      }
    };
  }, []);

  // キーボードショートカット
  useEditorKeyboard();

  // エディタ起動（初期データ注入、外部で注入済みの場合はスキップ）
  useEffect(() => {
    if (initialWorldObjects) {
      setEditorInitialObjects(initialWorldObjects);
    }
    // GameScene の Canvas が存在しないフェーズ（title / novel）ではエディタ用の
    // 3D オブジェクトが描画できないため、explore フェーズに切り替える
    const { phase, startGame } = useGameStore.getState();
    if (phase !== "explore" && phase !== "ending") {
      startGame();
    }
    enableEditor();
  }, []);

  // 終了処理
  const handleClose = useCallback(() => {
    disableEditor();
    onClose?.();
  }, [disableEditor, onClose]);

  if (!isEditorEnabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        pointerEvents: "none",
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#e0e0e0",
      }}
    >
      {/* パネルレイアウト */}
      <EditorOverlay onClose={handleClose}>
        {/* 左パネル: オブジェクト一覧 */}
        <div style={{ pointerEvents: "auto", height: "100%", display: "flex", flexDirection: "column" }}>
          <ObjectListPanel />
        </div>

        {/* 右パネル: アコーディオン */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", pointerEvents: "auto", overflowY: "auto", maxHeight: "100vh" }}>
          <TransformPanel />
          <WorldObjectPanel />
          <AnimloopPreviewPanel />
          <MorphTargetPanel />
          <ExpressionJsonEditor />
          <TimelineEditorPanel />
          <CollisionVisualizer />
          <div style={{ padding: "4px 0" }}>
            <button
              onClick={() => setIsExportOpen(true)}
              style={{
                width: "100%",
                padding: "6px 12px",
                background: "rgba(255,204,0,0.1)",
                border: "1px solid rgba(255,204,0,0.3)",
                color: "#ffcc00",
                cursor: "pointer",
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: "bold",
              }}
            >
              📦 Export JSON
            </button>
          </div>
          {isExportOpen && (
            <ExportDialog onClose={() => setIsExportOpen(false)} />
          )}
        </div>
      </EditorOverlay>
    </div>
  );
}

// =============================================================
// エディタの遅延マウント用ヘルパ
// App.tsx から呼び出して DOM にポータルする
// ===========================================================

let editorRoot: Root | null = null;
let editorContainer: HTMLElement | null = null;

export function mountEditor(
  initialWorldObjects: WorldObject[],
  onClose: () => void
) {
  if (editorContainer) {
    // 既に起動中
    return;
  }

  editorContainer = document.createElement("div");
  editorContainer.id = "asset-placer-editor-root";
  document.body.appendChild(editorContainer);

  editorRoot = createRoot(editorContainer);
  editorRoot.render(
    <AssetPlacerGUI initialWorldObjects={initialWorldObjects} onClose={onClose} />
  );
}

export function unmountEditor() {
  if (editorRoot) {
    editorRoot.unmount();
    editorRoot = null;
  }
  if (editorContainer) {
    document.body.removeChild(editorContainer);
    editorContainer = null;
  }
}