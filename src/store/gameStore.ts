import { create } from "zustand";
import type {
  AnomalyLog,
  BacklogEntry,
  CaptureEntry,
  CaptureResult,
  ChoiceOption,
  EndingFlag,
  GamePhase,
  GameSaveData,
  Language,
  LocationId,
  NovelSaveData,
  NovelState,
  NovelSystemData,
  NovelVisualState,
  ObjectState,
  OverlayType,
  StillDef,
  WorldObject,
} from "../types";
import { CHECKPOINTS, TOTAL_CHECKPOINTS } from "../data/checkpoints";
import { getScenarioById } from "../data/novelScenario";
import { cloneWorldObjects } from "../data/worldObjects";

// =============================================================
// ゲームストア（仕様 §1-3 PlayerState + §4 ログ + §5 タイムリープ）
// =============================================================

// --- 初期値設定ヘルパー関数 ---
function buildInitialWorldObjects(): Record<string, WorldObject> {
  const record: Record<string, WorldObject> = {};
  for (const obj of cloneWorldObjects()) record[obj.id] = obj;
  return record;
}

function initialNovelVisualState(): NovelVisualState {
  return {
    backgroundId: null,
    activeCharacters: [],
    currentBgmId: null,
  };
}

function initialNovelSystemData(): NovelSystemData {
  return {
    readChoices: {} as Record<string, boolean>,
    readSteps: {} as Record<string, boolean>,
    isAutoModeActive: false,
    isNextModeActive: false, // ★ NEXT Mode
  };
}

/** 
 * 汎用的なノベル進行に必要な初期状態を構築する
 */
function initialNovelState(): {
  novelState: NovelState;
  currentScenarioId: string;
  currentStepIndex: number;
  speakerKey: string | null;
  textKey: string;
  currentVoiceUrl: string | null;
  currentChoices: ChoiceOption[];
  backlog: BacklogEntry[];
  novelVisualState: NovelVisualState;
  novelVariables: Record<string, any>;
  novelSystemData: NovelSystemData;
  novelEntryScenarioId: string | null;
  currentStill: StillDef | null;
  isSuspended: boolean;
  overlay: OverlayType;
} {
  return {
  novelState: "IDLE" as NovelState,
  currentScenarioId: "",
  currentStepIndex: 0,
  speakerKey: null,
  textKey: "",
  currentVoiceUrl: null,
  currentChoices: [],
  backlog: [],
  novelVisualState: initialNovelVisualState(),
  novelVariables: {},
  novelSystemData: initialNovelSystemData(),
  novelEntryScenarioId: null,
  currentStill: null,
  isSuspended: false,
  overlay: "none" as OverlayType,
  };
}

// --------------------------------------------------------------------
// 【State Definition】
// --------------------------------------------------------------------
interface GameState {
  // ── フェーズ / 言語
  phase: GamePhase;
  language: Language;

  // ── 基本情報
  currentCheckpoint: number;
  age: number;
  cognitionLevel: number; // 0〜100（0 で PARANOIA）
  
  // ── タイムリープ
  timeleapCount: number;
  
  // ── 記録
  worldObjects: Record<string, WorldObject>;
  anomalyLog: AnomalyLog[];
  branchFlags: string[];
  endingFlags: EndingFlag[];
  unlockedLocations: string[];
  
  // ── ボトムビュー
  readTextIds: string[];
  
  // ── 隠し要素（タイトルのシュリンク）
  titleShrinkCount: number;
  titleShrinkNoticed: boolean;
  
  // ── 探索フェーズのモード
  explorationMode: "before" | "replay"; // before=記憶フェーズ / replay=高速再生フェーズ

  // ── Dev モード（AssetPlacer 表示制御）
  devModeActive: boolean;

  // ── ロケーション（シーン内の場所）
  currentLocation: LocationId;
  setLocation: (loc: LocationId) => void;

  // ── 探索中の一時 UI 状態
  scopeActive: boolean;
  worldPaused: boolean;
  cameraRoll: CaptureEntry[];
  lastCaptureResult: CaptureResult | null;
  timeRemaining: number;
  
  // ── ノベルパート
  novelState: NovelState;
  currentScenarioId: string;
  currentStepIndex: number;
  speakerKey: string | null;
  textKey: string;
  currentVoiceUrl: string | null;
  currentChoices: ChoiceOption[];
  backlog: BacklogEntry[];
  novelVisualState: NovelVisualState;
  novelVariables: Record<string, any>;
  novelSystemData: NovelSystemData;
  novelEntryScenarioId: string | null;
  /** 現在表示中のスチル（null = なし） */
  currentStill: StillDef | null;

  // ── 全体制御
  isSuspended: boolean;
  overlay: OverlayType;

  // ── セーブ
  hasSave: boolean;

  // ── アクション
  setLanguage: (language: Language) => void;
  startGame: () => void;
  startDevMode: () => void;
  incrementTitleShrink: () => void;
  noticeTitleShrink: () => void;
  startReplay: () => void;
  setScopeActive: (scopeActive: boolean) => void;
  toggleWorldPause: () => void;
  addToCameraRoll: (entry: CaptureEntry) => void;
  captureObject: (objectId: string, phase: "before" | "after") => CaptureResult;
  tickTime: (dt: number) => void;
  advanceCheckpoint: () => void;
  executeTimeleap: () => "SUCCESS" | "PARANOIA_TRIGGER";
  resetGame: () => void;

  // --- ノベルアクション ---
  startNovel: (scenarioId: string) => void;
  handleScreenClick: () => void;
  advanceNovel: () => void; // NEXT/ADVANCEのロジック名統一
  goToNextStep: () => void;
  selectChoice: (choiceId: string, nextScenarioId: string | null) => void;
  addBacklogEntry: (speakerKey: string | null, textKey: string, voiceUrl?: string) => void;
  toggleAutoMode: (active?: boolean) => void;
  toggleNextMode: (active?: boolean) => void; // ★ NEXT Mode
  exitNovel: () => void;
  serializeSaveData: () => NovelSaveData;
  loadNovelState: (data: NovelSaveData) => void;
  setOverlay: (overlay: OverlayType) => void;
  continueGame: () => void;
  saveGame: () => void;
  loadSavedGame: () => void;
}

/** 改竄耐性スコア判定（仕様 §4-3） */
function checkResistance(obj: WorldObject): boolean {
  let score = 0;
  if (obj.relatedToNanami) score += 50;
  if (obj.onTruePath) score += 30;
  if (obj.isRecorded) score += 20;
  return score >= 50;
}

/** タイムリープの認知削り量（仕様 §5-1） */
function cognitionCost(timeleapCount: number): number {
  const base = 5;
  const multiplier = 1 + timeleapCount * 0.1;
  return Math.min(base * multiplier, 25);
}

export const useGameStore = create<GameState>((set, get) => ({
  // ── フェーズ / 言語
  phase: "title",
  language: "ja",

  // ── 基本情報
  currentCheckpoint: 0,
  age: 26,
  cognitionLevel: 100, // 0〜100（0 で PARANOIA）
  
  // ── タイムリープ
  timeleapCount: 0,
  
  // ── 記録
  worldObjects: buildInitialWorldObjects(),
  anomalyLog: [],
  branchFlags: [],
  endingFlags: [],
  
  // ── ボトムビュー
  readTextIds: [],
  
  // ── 隠し要素（タイトルのシュリンク）
  titleShrinkCount: 0,
  titleShrinkNoticed: false,
  
  // ── 探索フェーズのモード
  explorationMode: "before" as const,

  // ── Dev モード
  devModeActive: false,

  // ── ロケーション
  currentLocation: "apartment" as LocationId,

  // ── 探索中の一時 UI 状態
  scopeActive: false,
  worldPaused: false,
  cameraRoll: [],
  lastCaptureResult: null,
  timeRemaining: CHECKPOINTS[0].timeLimit,
  
  // ── ノベルパート初期値
  ...initialNovelState(),

  // ── 全体制御
  isSuspended: false,
  overlay: "none",

  // ── 解放済みロケーション
  unlockedLocations: [] as string[],

  // ── セーブ
  hasSave: typeof localStorage !== "undefined" && localStorage.getItem("maekarakoudesita_save") !== null,

  // ── アクション
  setLanguage: (language) => set({ language }),
  startGame: () => {
    set({
      phase: "explore",
      explorationMode: "before",
      currentLocation: "apartment",
      currentCheckpoint: 0,
      age: CHECKPOINTS[0].age,
      cognitionLevel: 100,
      timeleapCount: 0,
      worldObjects: buildInitialWorldObjects(),
      anomalyLog: [],
      branchFlags: [],
      endingFlags: [],
      unlockedLocations: [],
      timeRemaining: CHECKPOINTS[0].timeLimit,
      // ノベル状態リセット（startNovel で直後に上書きされる）
      novelState: "IDLE",
      currentScenarioId: "",
      currentStepIndex: 0,
      speakerKey: null,
      textKey: "",
      currentVoiceUrl: null,
      currentChoices: [],
      backlog: [],
      novelVisualState: initialNovelVisualState(),
      novelVariables: {},
      novelSystemData: initialNovelSystemData(),
      novelEntryScenarioId: null,
      currentStill: null,
      isSuspended: false,
      overlay: "none",
      devModeActive: false,
    });
    // プロローグシナリオをゲーム開始直後に起動
    get().startNovel("prologue");
  },

  incrementTitleShrink: () => set({ titleShrinkCount: get().titleShrinkCount + 1 }),
  noticeTitleShrink: () => set({ titleShrinkNoticed: true }),

  startReplay: () => set({ explorationMode: "replay" }),

  startDevMode: () => {
    get().startGame();
    set({ currentLocation: "street", explorationMode: "replay", devModeActive: true });
  },
  setLocation: (loc) => set({ currentLocation: loc }),
  setScopeActive: (scopeActive) => set({ scopeActive }),
  toggleWorldPause: () => set((s) => ({ worldPaused: !s.worldPaused })),
  addToCameraRoll: (entry) => set((s) => ({ cameraRoll: [...s.cameraRoll, entry] })),

  captureObject: (objectId, phase) => {
    const state = get();
    const obj = state.worldObjects[objectId];
    if (!obj) return "MISS";

    if (obj.state === "OVERWRITTEN") {
      set({ lastCaptureResult: "OVERWRITTEN" });
      return "OVERWRITTEN";
    }

    const updated: WorldObject = { ...obj };
    if (phase === "before") updated.beforeCaptured = true;
    else updated.afterCaptured = true;

    let result: CaptureResult = "PARTIAL";

    if (updated.beforeCaptured && updated.afterCaptured && !updated.isRecorded) {
      updated.isRecorded = true;
      updated.state = "RECORDED";
      updated.isResistant = checkResistance(updated);

      const cp = CHECKPOINTS[state.currentCheckpoint];
      const log: AnomalyLog = {
        id: `log_${objectId}_${Date.now()}`,
        objectId,
        checkpointId: state.currentCheckpoint,
        timestamp: `あの事件から ${Math.max(1, state.currentCheckpoint) * 90} 日目`,
        beforeCapture: `${updated.label}（変化前）`,
        afterCapture: `${updated.label}（変化後 / ${cp.year}年${cp.month}月）`,
        isResistant: updated.isResistant,
        isOverwritten: false,
        note: `${updated.label}が変わっている。前からこうだった、なんてことはない。`,
      };

      const branchFlags = [...state.branchFlags];
      const endingFlags = [...state.endingFlags];
      if (updated.branchFlag && !branchFlags.includes(updated.branchFlag)) {
        branchFlags.push(updated.branchFlag);
        if (updated.onTruePath) endingFlags.push("TRUE_PATH");
        else endingFlags.push("NORMAL_OR_TRUE");
      }

      // 撮影トリガーによるロケーション解放
      const unlockedLocations = [...state.unlockedLocations];
      if (updated.unlocksLocation && !unlockedLocations.includes(updated.unlocksLocation)) {
        unlockedLocations.push(updated.unlocksLocation);
      }

      set({
        worldObjects: { ...state.worldObjects, [objectId]: updated },
        anomalyLog: [...state.anomalyLog, log],
        branchFlags,
        endingFlags,
        unlockedLocations,
        lastCaptureResult: "SUCCESS",
      });
      return "SUCCESS";
    }

    set({
      worldObjects: { ...state.worldObjects, [objectId]: updated },
      lastCaptureResult: result,
    });
    return result;
  },

  tickTime: (dt) => {
    const state = get();
    const t = state.timeRemaining;
    if (t > 0) set({ timeRemaining: Math.max(0, t - dt) });
  },

  advanceCheckpoint: () => {
    const state = get();

    // カメラロールの違和感ありエントリをこのCPの異変ログに昇格
    const anomalyEntries = state.cameraRoll.filter(
      (e) => e.checkpointId === state.currentCheckpoint && e.hasAnomaly && e.objectId
    );

    const newObjects: Record<string, WorldObject> = { ...state.worldObjects };
    const newAnomalyLog = [...state.anomalyLog];
    const branchFlags = [...state.branchFlags];
    const endingFlags = [...state.endingFlags];
    const unlockedLocations = [...state.unlockedLocations];

    for (const entry of anomalyEntries) {
      const obj = newObjects[entry.objectId!];
      if (!obj || obj.isRecorded) continue;
      const isResistant = checkResistance(obj);
      newObjects[entry.objectId!] = {
        ...obj,
        isRecorded: true,
        state: "RECORDED" as ObjectState,
        isResistant,
      };
      newAnomalyLog.push({
        id: `log_${entry.objectId}_${entry.capturedAt}`,
        objectId: entry.objectId!,
        checkpointId: state.currentCheckpoint,
        timestamp: `あの事件から ${Math.max(1, state.currentCheckpoint) * 90} 日目`,
        beforeCapture: "",
        afterCapture: entry.imageDataUrl,
        isResistant,
        isOverwritten: false,
        note: `${obj.label}の違和感を記録した。`,
      });
      if (obj.branchFlag && !branchFlags.includes(obj.branchFlag)) {
        branchFlags.push(obj.branchFlag);
        endingFlags.push(obj.onTruePath ? "TRUE_PATH" : "NORMAL_OR_TRUE");
      }
      if (obj.unlocksLocation && !unlockedLocations.includes(obj.unlocksLocation)) {
        unlockedLocations.push(obj.unlocksLocation);
      }
    }

    // 未記録オブジェクトを上書き状態に
    for (const [id, obj] of Object.entries(newObjects)) {
      if (!obj.isRecorded && !obj.isResistant) {
        newObjects[id] = { ...obj, state: "OVERWRITTEN" as ObjectState };
      }
    }

    set({ worldObjects: newObjects, anomalyLog: newAnomalyLog, branchFlags, endingFlags, unlockedLocations, phase: "result" });
  },

  executeTimeleap: () => {
    const state = get();
    if (state.cognitionLevel <= 0) {
      set({ phase: "result" });
      return "PARANOIA_TRIGGER";
    }
    const cost = cognitionCost(state.timeleapCount);
    set({
      timeleapCount: state.timeleapCount + 1,
      cognitionLevel: Math.max(0, state.cognitionLevel - cost),
    });
    return "SUCCESS";
  },

  resetGame: () =>
    set({
      phase: "title",
      explorationMode: "before",
      currentLocation: "apartment",
      currentCheckpoint: 0,
      age: 26,
      cognitionLevel: 100,
      timeleapCount: 0,
      worldObjects: buildInitialWorldObjects(),
      anomalyLog: [],
      branchFlags: [],
      endingFlags: [],
      unlockedLocations: [],
      timeRemaining: CHECKPOINTS[0].timeLimit,
      lastCaptureResult: null,
      // ノベル状態リセット
      novelState: "IDLE",
      currentScenarioId: "",
      currentStepIndex: 0,
      speakerKey: null,
      textKey: "",
      currentVoiceUrl: null,
      currentChoices: [],
      backlog: [],
      novelVisualState: initialNovelVisualState(),
      novelVariables: {},
      novelSystemData: initialNovelSystemData(),
      novelEntryScenarioId: null,
      isSuspended: false,
      overlay: "none",
      devModeActive: false,
    }),

  // ── ノベルアクション実装 ──
  /** 3Dシーンはそのままにノベルオーバーレイを開始する（phase は explore のまま） */
  startNovel: (scenarioId) => {
    const scenario = getScenarioById(scenarioId);
    if (!scenario || scenario.steps.length === 0) return;

    // 会話中は視点操作を無効にするためポインタロックを解除
    if (document.pointerLockElement) document.exitPointerLock();

    const firstStep = scenario.steps[0];
    set({
      novelState: "TYPING",
      currentScenarioId: scenarioId,
      currentStepIndex: 0,
      speakerKey: firstStep.speakerKey ?? null,
      textKey: firstStep.textKey,
      currentVoiceUrl: firstStep.voiceUrl ?? null,
      currentChoices: firstStep.choices ?? [],
      novelVisualState: firstStep.visualState ?? {
        ...get().novelVisualState,
        backgroundId: firstStep.backgroundId ?? get().novelVisualState.backgroundId,
      },
      ...(firstStep.still !== undefined && { currentStill: firstStep.still }),
      isSuspended: false,
      overlay: "none",
    });
  },

  /** 画面クリック時のメイン制御（TYPING→NEXT_TRIGGER、WAITING_CLICK→次へ） */
  handleScreenClick: () => {
    // サスペンド中は全入力遮断
    if (get().isSuspended) return;
    const { novelState } = get();
    if (novelState === "TYPING") {
      // 進行のトリガーをNEXT/ADVANCEに統一
      get().advanceNovel();
    } else if (novelState === "WAITING_CLICK") {
      // 待機状態の場合は、次のステップへ進むトリガー
      get().goToNextStep();
    }
    // CHOICE の場合はクリックでは何もしない（選択肢ボタンで操作）
  },

  /** タイピングを完了状態にする（NEXTトリガー） */
  advanceNovel: () => {
    // サスペンド中は進行不可
    if (get().isSuspended) return;
    // ★ 処理ロジック名変更：skipTyping() -> advanceNovel()
    set({ novelState: "WAITING_CLICK" });
  },

  /** 次のステップへ進む（NEXTトリガー） */
  goToNextStep: () => {
    // サスペンド中は進行不可
    if (get().isSuspended) return;

    const state = get();
    const scenario = getScenarioById(state.currentScenarioId);
    if (!scenario) return;

    // 1. バックログ追加
    state.addBacklogEntry(state.speakerKey, state.textKey, state.currentVoiceUrl ?? undefined);

    const nextIndex = state.currentStepIndex + 1;
    if (nextIndex >= scenario.steps.length) {
      // シナリオ終了
      set({
        novelState: "COMPLETED",
        currentStepIndex: nextIndex,
        speakerKey: null,
        textKey: "",
        currentVoiceUrl: null,
        currentChoices: [],
      });
      return;
    }

    const nextStep = scenario.steps[nextIndex];

    // 2. NEXTモード判定（★ スキップモード -> NEXTモード）
    if (state.novelSystemData.isNextModeActive) {
      // 全ステップスキップ処理：次のステップが選択肢を持つ場合はそこで停止する
      let skipIndex = nextIndex;
      while (skipIndex < scenario.steps.length) {
        const step = scenario.steps[skipIndex];
        state.addBacklogEntry(
          step.speakerKey ?? null,
          step.textKey,
          step.voiceUrl
        );
        // 選択肢がある場合はそこでスキップ停止
        if (step.choices && step.choices.length > 0) {
          const finalStep = step;
          set({
            novelState: "CHOICE",
            currentStepIndex: skipIndex,
            speakerKey: finalStep.speakerKey ?? null,
            textKey: finalStep.textKey,
            currentVoiceUrl: finalStep.voiceUrl ?? null,
            currentChoices: finalStep.choices ?? [],
            novelVisualState: finalStep.visualState ?? {
              ...state.novelVisualState,
              backgroundId: finalStep.backgroundId ?? state.novelVisualState.backgroundId,
  },
})
          return;
        }
        skipIndex++;
      }

      // 全ステップスキップ＝シナリオ終了
      set({
        novelState: "COMPLETED",
        currentStepIndex: skipIndex,
        speakerKey: null,
        textKey: "",
        currentVoiceUrl: null,
        currentChoices: [],
      });
      return;
    }

    // 3. 通常進行 (NEXTモードではない場合)
    const visualState = nextStep.visualState ?? {
      ...state.novelVisualState,
      backgroundId: nextStep.backgroundId ?? state.novelVisualState.backgroundId,
    };

    // 表情動画が再生中の場合、次のステップでも video フィールドを保持
    // (PortraitLayers コンポーネントのリマウント時に useState がリセットされるのを防ぐ)
    const updatedVisualState = (() => {
      if (!visualState.activeCharacters) return visualState;
      return {
        ...visualState,
        activeCharacters: visualState.activeCharacters.map((char, idx) => {
          const prevChar = state.novelVisualState.activeCharacters?.[idx];
          // 前のステップに video が存在し、現在のステップにない場合は、video を保持
          if (prevChar?.portrait?.video && !char.portrait?.video) {
            return {
              ...char,
              portrait: {
                ...char.portrait,
                video: prevChar.portrait.video,
              },
            };
          }
          return char;
        }),
      };
    })();

    set({
      novelState: nextStep.choices && nextStep.choices.length > 0 ? "CHOICE" : "TYPING",
      currentStepIndex: nextIndex,
      speakerKey: nextStep.speakerKey ?? null,
      textKey: nextStep.textKey,
      currentVoiceUrl: nextStep.voiceUrl ?? null,
      currentChoices: nextStep.choices ?? [],
      novelVisualState: updatedVisualState,
      ...(nextStep.still !== undefined && { currentStill: nextStep.still }),
    });
  },

  selectChoice: (choiceId, nextScenarioId) => {
    // サスペンド中は選択不可
    if (get().isSuspended) return;

    const state = get();
    // 既読フラグを記録
    const readChoices = {
      ...state.novelSystemData.readChoices,
      [choiceId]: true,
    };
    // 選択肢をバックログに追加
    const choiceOption = state.currentChoices.find((c) => c.choiceId === choiceId);
    if (choiceOption) {
      state.addBacklogEntry(null, choiceOption.textKey);
    }
    // 次のシナリオへ
    if (nextScenarioId) {
      set({
        novelSystemData: { ...state.novelSystemData, readChoices },
        currentChoices: [],
      });
      get().startNovel(nextScenarioId);
    } else {
      // 遷移先がない場合は終了
      set({
        novelState: "COMPLETED",
        currentChoices: [],
        novelSystemData: { ...state.novelSystemData, readChoices },
      });
    }
  },

  addBacklogEntry: (speakerKey, textKey, voiceUrl) => {
    set((s) => ({
      backlog: [...s.backlog, { speakerKey, textKey, voiceUrl }],
    }));
  },

  // --- [NEXT/ADVANCE関連] ---
  /** オートモード切り替え */
  toggleAutoMode: (active) => {
    set((s) => ({
      novelSystemData: {
        ...s.novelSystemData,
        isAutoModeActive: active ?? !s.novelSystemData.isAutoModeActive,
      },
    }));
  },

  /** NEXTモード切り替え */
  toggleNextMode: (active) => {
    set((s) => ({
      novelSystemData: {
        ...s.novelSystemData,
        isNextModeActive: active ?? !s.novelSystemData.isNextModeActive,
      },
    }));
  },

  /** ノベルパート終了（探索に戻る） */
  exitNovel: () => {
    set({
      phase: "explore",
      novelState: "IDLE",
      currentScenarioId: "",
      currentStepIndex: 0,
      speakerKey: null,
      textKey: "",
      currentVoiceUrl: null,
      currentChoices: [],
      novelEntryScenarioId: null,
      currentStill: null,
      isSuspended: false,
      overlay: "none",
    });
  },

  // ── 共通ロジック ──
  serializeSaveData: () => {
    const s = get();
    return {
      currentScenarioId: s.currentScenarioId,
      currentStepIndex: s.currentStepIndex,
      novelState: s.novelState,
      speakerKey: s.speakerKey,
      textKey: s.textKey,
      currentVoiceUrl: s.currentVoiceUrl,
      visualState: { ...s.novelVisualState },
      variables: { ...s.novelVariables },
      updatedAt: Date.now(),
    };
  },

  loadNovelState: (data) => {
    set({
      novelState: data.novelState === "TYPING" ? "WAITING_CLICK" : data.novelState,
      currentScenarioId: data.currentScenarioId,
      currentStepIndex: data.currentStepIndex,
      speakerKey: data.speakerKey,
      textKey: data.textKey,
      currentVoiceUrl: data.currentVoiceUrl,
      novelVisualState: { ...data.visualState },
      novelVariables: { ...data.variables },
      isSuspended: false,
      overlay: "none",
    });
  },

  setOverlay: (overlay) => {
    const state = get();
    const isOpening = overlay !== "none";
    set({
      overlay,
      isSuspended: isOpening,
      // オーバーレイを開くときはオート/NEXTを解除
      ...(isOpening
        ? {
            novelSystemData: {
              ...state.novelSystemData,
              isAutoModeActive: false,
              isNextModeActive: false,
            }
          }
        : {}),
    });
  },

  continueGame: () => {
    const state = get();
    const nextCpId = state.currentCheckpoint + 1;
    if (nextCpId >= TOTAL_CHECKPOINTS) return;
    const cp = CHECKPOINTS[nextCpId];
    set({
      phase: "explore",
      explorationMode: "before",
      currentLocation: "apartment",
      currentCheckpoint: nextCpId,
      age: cp.age,
      timeRemaining: cp.timeLimit,
      worldObjects: buildInitialWorldObjects(),
      cameraRoll: [],
      lastCaptureResult: null,
      worldPaused: false,
      scopeActive: false,
      novelState: "IDLE",
      currentScenarioId: "",
      currentStepIndex: 0,
      speakerKey: null,
      textKey: "",
      currentVoiceUrl: null,
      currentChoices: [],
      novelEntryScenarioId: null,
      isSuspended: false,
      overlay: "none",
    });
  },

  saveGame: () => {
    const s = get();
    const data: GameSaveData = {
      version: 1,
      savedAt: Date.now(),
      phase: s.phase,
      language: s.language,
      currentCheckpoint: s.currentCheckpoint,
      age: s.age,
      cognitionLevel: s.cognitionLevel,
      timeleapCount: s.timeleapCount,
      worldObjects: s.worldObjects,
      anomalyLog: s.anomalyLog,
      branchFlags: s.branchFlags,
      endingFlags: s.endingFlags,
      cameraRoll: s.cameraRoll,
      unlockedLocations: s.unlockedLocations,
    };
    localStorage.setItem("maekarakoudesita_save", JSON.stringify(data));
    set({ hasSave: true });
  },

  loadSavedGame: () => {
    const raw = localStorage.getItem("maekarakoudesita_save");
    if (!raw) return;
    const data: GameSaveData = JSON.parse(raw);
    // セーブ時点のCPは完了済みなので次年から開始（最終年なら最終年から）
    const nextCpId = Math.min(data.currentCheckpoint + 1, TOTAL_CHECKPOINTS - 1);
    const cp = CHECKPOINTS[nextCpId];
    set({
      language: data.language,
      currentCheckpoint: nextCpId,
      age: cp.age,
      cognitionLevel: data.cognitionLevel,
      timeleapCount: data.timeleapCount,
      worldObjects: buildInitialWorldObjects(),
      anomalyLog: data.anomalyLog,
      branchFlags: data.branchFlags,
      endingFlags: data.endingFlags,
      unlockedLocations: data.unlockedLocations ?? [],
      phase: "explore",
      explorationMode: "before",
      currentLocation: "apartment",
      timeRemaining: cp.timeLimit,
      cameraRoll: [],
      lastCaptureResult: null,
      worldPaused: false,
      scopeActive: false,
      novelState: "IDLE",
      currentScenarioId: "",
      currentStepIndex: 0,
      speakerKey: null,
      textKey: "",
      currentVoiceUrl: null,
      currentChoices: [],
      novelEntryScenarioId: null,
      isSuspended: false,
      overlay: "none",
    });
  },
}));
