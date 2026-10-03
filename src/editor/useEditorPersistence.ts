import { useEffect, useRef } from "react";
import { useEditorStore } from "./useEditorStore";

// =============================================================
// useEditorPersistence — 永続化フック
// §9 localStorageからの復元監視、isDirtyの外部通知
// 実装計画 Phase5: データ永続化
// =============================================================

const LS_KEY = "editor_world_objects";

export interface EditorPersistenceState {
  /** 保存日時（ISO文字列） */
  lastSaved: string | null;
  /** 変更があるか */
  isDirty: boolean;
  /** 手動でlocalStorageに保存 */
  saveNow: () => void;
  /** localStorageからデータをクリア */
  clearStorage: () => void;
}

/**
 * エディタの永続化状態を監視・管理するフック。
 * - コンポーネントマウント時に localStorage から復元状態を確認
 * - isDirty の変化を検知
 * - saveNow / clearStorage のユーティリティを提供
 */
export function useEditorPersistence(): EditorPersistenceState {
  const isDirty = useEditorStore((s) => s.isDirty);
  const worldObjects = useEditorStore((s) => s.worldObjects);
  const lastSavedRef = useRef<string | null>(null);

  // マウント時にlocalStorageの最終保存日時を取得
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        // 簡易的に現在時刻を最終保存とする（正確なtimestampは保存していないため）
        lastSavedRef.current = new Date().toISOString();
      }
    } catch {
      // ignore
    }
  }, []);

  const saveNow = () => {
    try {
      const toSave = worldObjects.map((o) => ({
        ...o,
        position: o.position,
        rotation: o.rotation,
        scale: o.scale,
      }));
      localStorage.setItem(LS_KEY, JSON.stringify(toSave));
      lastSavedRef.current = new Date().toISOString();
      useEditorStore.getState().markClean();
    } catch {
      // localStorage満杯など
    }
  };

  const clearStorage = () => {
    try {
      localStorage.removeItem(LS_KEY);
      lastSavedRef.current = null;
    } catch {
      // ignore
    }
  };

  return {
    lastSaved: lastSavedRef.current,
    isDirty,
    saveNow,
    clearStorage,
  };
}