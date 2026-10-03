import { create } from "zustand";
import type {
  WorldObject,
  GizmoMode,
  CollisionMeshData,
  AnimloopPreviewState,
} from "../types";

// =============================================================
// エディタ状態管理（Zustand）
// §5 localStorage自動保存（2秒デバウンス）
// =============================================================

interface EditorState {
  // ── エディタの起動/終了 ──
  isEditorEnabled: boolean;
  enableEditor: () => void;
  disableEditor: () => void;

  // ── シーンオブジェクト管理 ──
  worldObjects: WorldObject[];
  setWorldObjects: (objects: WorldObject[]) => void;
  updateWorldObject: (id: string, patch: Partial<WorldObject>) => void;
  selectedObjectId: string | null;
  selectObject: (id: string | null) => void;

  // ── Gizmo制御 ──
  gizmoMode: GizmoMode;
  setGizmoMode: (mode: GizmoMode) => void;

  // ── CPフィルター ──
  checkpointFilter: number | "all";
  setCheckpointFilter: (cp: number | "all") => void;

  // ── コリジョン可視化 ──
  collisionMeshes: CollisionMeshData[];
  setCollisionMeshes: (meshes: CollisionMeshData[]) => void;
  addCollisionMesh: (mesh: CollisionMeshData) => void;
  updateCollisionMesh: (id: string, patch: Partial<CollisionMeshData>) => void;
  removeCollisionMesh: (id: string) => void;

  // ── Animloopプレビュー ──
  animloopPreview: AnimloopPreviewState;
  setAnimloopProgress: (progress: number) => void;
  toggleAnimloopPlay: () => void;
  setPreviewSpeed: (speed: number) => void;

  // ── 変更追跡 ──
  isDirty: boolean;
  markClean: () => void;

  // ── パネルの折りたたみ ──
  collapsedPanels: Record<string, boolean>;
  togglePanel: (panelId: string) => void;

  // ── オブジェクト操作 ──
  deleteWorldObject: (id: string) => void;
  duplicateSelected: () => void;
  addWorldObject: (object: WorldObject) => void;

  // ── Undo / Redo ──
  undo: () => void;
  redo: () => void;
}

const LS_KEY = "editor_world_objects";

/** localStorageからWorldObjectを読み込む（復元失敗時はnull） */
function loadFromLocalStorage(): WorldObject[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as WorldObject[];
    }
    return null;
  } catch {
    return null;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** 2秒デバウンスでlocalStorageに保存 */
function scheduleSave(objects: WorldObject[]) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const toSave = objects.map((o) => ({
        ...o,
        position: o.position,
        rotation: o.rotation,
        scale: o.scale,
      }));
      localStorage.setItem(LS_KEY, JSON.stringify(toSave));
    } catch {
      // localStorage満杯などは無視
    }
  }, 2000);
}

// ストア外から初期データを注入するための参照
let _initialObjects: WorldObject[] = [];

// Undo/Redo スタック（ストア外部で管理）
const _undoStack: WorldObject[][] = [];
const _redoStack: WorldObject[][] = [];

function _pushUndo(snapshot: WorldObject[]) {
  _undoStack.push(snapshot);
  // スタック上限 50
  if (_undoStack.length > 50) _undoStack.shift();
  // redoスタックは操作のたびにクリア
  _redoStack.length = 0;
}

export function setEditorInitialObjects(objects: WorldObject[]) {
  _initialObjects = objects;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  isEditorEnabled: false,

  enableEditor: () => {
    // localStorageから復元試行、なければ注入済みの初期データ
    const saved = loadFromLocalStorage();
    const objects = saved ?? _initialObjects;
    set({
      isEditorEnabled: true,
      worldObjects: objects,
      selectedObjectId: null,
      gizmoMode: "translate",
      checkpointFilter: "all",
      animloopPreview: {
        progress: 0,
        isPlaying: false,
        previewSpeed: 1.0,
      },
      isDirty: false,
      collapsedPanels: {},
      collisionMeshes: [],
    });
  },

  disableEditor: () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      scheduleSave(get().worldObjects);
    }
    set({
      isEditorEnabled: false,
      selectedObjectId: null,
      collisionMeshes: [],
    });
  },

  worldObjects: [],

  setWorldObjects: (objects: WorldObject[]) => {
    set({ worldObjects: objects, isDirty: true });
    scheduleSave(objects);
  },

  updateWorldObject: (id: string, patch: Partial<WorldObject>) => {
    const next = get().worldObjects.map((o) =>
      o.id === id ? { ...o, ...patch } : o
    );
    set({ worldObjects: next, isDirty: true });
    scheduleSave(next);
  },

  selectedObjectId: null,

  selectObject: (id: string | null) => {
    set({ selectedObjectId: id });
  },

  gizmoMode: "translate",

  setGizmoMode: (mode: GizmoMode) => {
    set({ gizmoMode: mode });
  },

  checkpointFilter: "all",

  setCheckpointFilter: (cp: number | "all") => {
    set({ checkpointFilter: cp });
  },

  collisionMeshes: [],

  setCollisionMeshes: (meshes: CollisionMeshData[]) => {
    set({ collisionMeshes: meshes });
  },

  addCollisionMesh: (mesh: CollisionMeshData) => {
    set((s) => ({ collisionMeshes: [...s.collisionMeshes, mesh] }));
  },

  updateCollisionMesh: (id: string, patch: Partial<CollisionMeshData>) => {
    set((s) => ({
      collisionMeshes: s.collisionMeshes.map((m) =>
        m.id === id ? { ...m, ...patch } : m
      ),
    }));
  },

  removeCollisionMesh: (id: string) => {
    set((s) => ({
      collisionMeshes: s.collisionMeshes.filter((m) => m.id !== id),
    }));
  },

  animloopPreview: {
    progress: 0,
    isPlaying: false,
    previewSpeed: 1.0,
  },

  setAnimloopProgress: (progress: number) => {
    set((s) => ({
      animloopPreview: { ...s.animloopPreview, progress },
    }));
  },

  toggleAnimloopPlay: () => {
    set((s) => ({
      animloopPreview: {
        ...s.animloopPreview,
        isPlaying: !s.animloopPreview.isPlaying,
      },
    }));
  },

  setPreviewSpeed: (speed: number) => {
    set((s) => ({
      animloopPreview: { ...s.animloopPreview, previewSpeed: speed },
    }));
  },

  isDirty: false,

  markClean: () => {
    set({ isDirty: false });
  },

  collapsedPanels: {},

  togglePanel: (panelId: string) => {
    set((s) => ({
      collapsedPanels: {
        ...s.collapsedPanels,
        [panelId]: !s.collapsedPanels[panelId],
      },
    }));
  },

  // ── オブジェクト削除 ──
  deleteWorldObject: (id: string) => {
    const prev = get().worldObjects;
    const next = prev.filter((o) => o.id !== id);
    _pushUndo(prev);
    set({
      worldObjects: next,
      selectedObjectId: get().selectedObjectId === id ? null : get().selectedObjectId,
      isDirty: true,
    });
    scheduleSave(next);
  },

  // ── オブジェクト追加 ──
  addWorldObject: (object: WorldObject) => {
    const prev = get().worldObjects;
    _pushUndo(prev);
    const next = [...prev, object];
    set({
      worldObjects: next,
      selectedObjectId: object.id,
      isDirty: true,
    });
    scheduleSave(next);
  },

  // ── 選択オブジェクトの複製 ──
  duplicateSelected: () => {
    const { selectedObjectId, worldObjects } = get();
    const src = worldObjects.find((o) => o.id === selectedObjectId);
    if (!src) return;
    const dup: WorldObject = {
      ...src,
      id: `${src.id}_dup_${Date.now()}`,
      label: `${src.label} (copy)`,
      position: [
        src.position[0] + 0.5,
        src.position[1],
        src.position[2] + 0.5,
      ] as [number, number, number],
    };
    _pushUndo(worldObjects);
    const next = [...worldObjects, dup];
    set({ worldObjects: next, selectedObjectId: dup.id, isDirty: true });
    scheduleSave(next);
  },

  // ── Undo / Redo ──
  undo: () => {
    const prev = _undoStack.pop();
    if (!prev) return;
    _redoStack.push(get().worldObjects);
    set({ worldObjects: prev, isDirty: true });
    scheduleSave(prev);
  },

  redo: () => {
    const next = _redoStack.pop();
    if (!next) return;
    _undoStack.push(get().worldObjects);
    set({ worldObjects: next, isDirty: true });
    scheduleSave(next);
  },
}));