import { useEffect } from "react";
import { useEditorStore } from "./useEditorStore";

// =============================================================
// useEditorKeyboard — エディタ用キーボードショートカット
// 仕様 §15 ホットキー
// =============================================================

export function useEditorKeyboard() {
  const isEditorEnabled = useEditorStore((s) => s.isEditorEnabled);
  const selectObject = useEditorStore((s) => s.selectObject);
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId);
  const deleteWorldObject = useEditorStore((s) => s.deleteWorldObject);
  const gizmoMode = useEditorStore((s) => s.gizmoMode);
  const setGizmoMode = useEditorStore((s) => s.setGizmoMode);
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const worldObjects = useEditorStore((s) => s.worldObjects);

  useEffect(() => {
    if (!isEditorEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // テキスト入力中は無視
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      // Undo: Ctrl+Z
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((ctrl && e.key === "z" && e.shiftKey) || (ctrl && e.key === "y")) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete: Delete or Backspace
      if ((e.key === "Delete" || e.key === "Backspace") && selectedObjectId) {
        e.preventDefault();
        deleteWorldObject(selectedObjectId);
        return;
      }

      // Duplicate: Ctrl+D
      if (ctrl && e.key === "d" && selectedObjectId) {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Gizmo mode: W (translate), E (rotate), R (scale)
      if (!ctrl) {
        switch (e.key.toLowerCase()) {
          case "w":
            if (gizmoMode !== "translate") {
              e.preventDefault();
              setGizmoMode("translate");
            }
            return;
          case "e":
            if (gizmoMode !== "rotate") {
              e.preventDefault();
              setGizmoMode("rotate");
            }
            return;
          case "r":
            if (gizmoMode !== "scale") {
              e.preventDefault();
              setGizmoMode("scale");
            }
            return;
          case "escape":
            e.preventDefault();
            selectObject(null);
            return;
          case "tab": {
            // オブジェクト間を巡回選択
            if (worldObjects.length === 0) return;
            e.preventDefault();
            const currentIdx = worldObjects.findIndex((o) => o.id === selectedObjectId);
            const nextIdx = e.shiftKey
              ? (currentIdx <= 0 ? worldObjects.length - 1 : currentIdx - 1)
              : (currentIdx >= worldObjects.length - 1 ? 0 : currentIdx + 1);
            selectObject(worldObjects[nextIdx].id);
            return;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isEditorEnabled,
    undo,
    redo,
    selectedObjectId,
    deleteWorldObject,
    duplicateSelected,
    gizmoMode,
    setGizmoMode,
    selectObject,
    worldObjects,
  ]);
}