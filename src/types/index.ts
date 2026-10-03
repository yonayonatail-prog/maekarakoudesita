// =============================================================
// 『前からこうでした』 — 型定義
// 仕様書 §1 システム設計に対応
// =============================================================

/** オブジェクトの状態（仕様 §1-1） */
export type ObjectState =
  | "REAL" // 世界の現在の真実（プレイヤーに見えている）
  | "RECORDED" // 徹が記録済み（上書きから保護）
  | "OVERWRITTEN" // 改竄されて上書き済み（前からこうでした）
  | "RESISTANT"; // 改竄耐性あり（強い想いを込めた記録）

/** 変化の進骨し（露骨さ）パターン */
export type ChangePattern = "A" | "B" | "C";

/** イベント規模 */
export type EventSize = "large" | "small";

/**
 * 変化するワールドオブジェクト（仕様 §1-2）
 * before/after の二状態を animloop で交互に見せる。
 */
export interface WorldObject {
  id: string;
  checkpointId: number;
  state: ObjectState;
  /** 表示用ラベル（撮影/ログ用） */
  label: string;
  /** アセットテンプレートID (将来拡張用、現段階ではオプション) */
  assetId?: string;
  /** 三海に直接関連するか（改竄耐性スコアに加算） */
  relatedToNanami: boolean;
  /** TRUE ルートに必要なフラグを通すか */
  onTruePath: boolean;
  changePattern: ChangePattern;
  eventSize: EventSize;
  /** 変化前後を撮影したか */
  beforeCaptured: boolean;
  afterCaptured: boolean;
  /** ログに記録済みか（両端撮影で成立） */
  isRecorded: boolean;
  /** 改竄耐性が確定したか */
  isResistant: boolean;
  /** このオブジェクトが解放するボトムズ式ブランチ */
  branchFlag: string | null;
  /** 記録完了時に解放されるロケーションID */
  unlocksLocation?: string;
  /** 3D 空間上の配置 */
  position: [number, number, number];
  /** 3D 空間上の回転（エディタ用、デフォルト [0,0,0]） */
  rotation: [number, number, number];
  /** 3D 空間上のスケール（エディタ用、デフォルト [1,1,1]） */
  scale: [number, number, number];
  /** モーフターゲット ウェイト（エディタ用、リグ付きアセットのみ） */
  morphTargets?: MorphTargetData[];
}

/** 異変ログ（仕様 §1-4） */
export interface AnomalyLog {
  id: string;
  objectId: string;
  checkpointId: number;
  timestamp: string; // 「あの事件からXX日目」
  beforeCapture: string; // dataURL or 説明
  afterCapture: string;
  isResistant: boolean;
  isOverwritten: boolean;
  note: string;
}

/** エンディング分岐フラグ（仕様 §6） */
export type EndingFlag =
  | "TRUE_PATH"
  | "NORMAL_OR_TRUE"
  | "BAD_PATH"
  | "PARANOIA_PATH"
  | "PATROL_PATH";

export type EndingId = "TRUE" | "NORMAL" | "BAD" | "PARANOIA" | "PATROL";

/** ニュースイベント */
export interface NewsEvent {
  id: string;
  headline: string;
}

/** 「一年後を観測する」ボタンのアクティベート条件 */
export interface CheckpointEnterCondition {
  /** カメラロール枚数が満たなければボタン無効 */
  minPhotos?: number;
}

/** チェックポイント（仕様 §2-2） */
export interface Checkpoint {
  id: number; // 0〜59
  actNumber: 1 | 2 | 3 | 4;
  year: number; // 西暦（チェックポイント終点の年）
  month: number; // チェックポイント終点の月
  age: number; // 徹の年齢
  timeLimit: number; // 秒（300〜480）
  worldObjectIds: string[];
  newsEvents: NewsEvent[];
  isDentalVisit: boolean;
  startDateLabel: string; // 探索フェーズ開始日時の表示ラベル（例: "2019年7月7日 10:00"）
  /** undefined = 常に有効。設定した場合は条件を満たすまでボタンをロック */
  enterCondition?: CheckpointEnterCondition;
}

/** 撮影結果（仕様 §3-2） */
export type CaptureResult = "SUCCESS" | "PARTIAL" | "MISS" | "OVERWRITTEN";

/** カメラロール1枚分のエントリ */
export interface CaptureEntry {
  id: string;
  imageDataUrl: string;
  /** 違和感ありかどうか（プレイヤーには就寝まで非公開） */
  hasAnomaly: boolean;
  objectId: string | null;
  phase: "before" | "after" | null;
  checkpointId: number;
  capturedAt: number;
}

/** ゲーム全体のフェーズ */
export type GamePhase =
  | "title"
  | "explore"
  | "interlude" // ボトムビュー（就寝・白昼夢）
  | "novel" // ノベルパート
  | "result" // リザルト画面（洗面所鏡シーン）
  | "ending";

/** 現在地（シーン内の場所） */
export type LocationId = "street" | "convenience_store" | "apartment" | "dental_bus_stop";

export type Language = "ja" | "en";

// =============================================================
// 顔ワイプシステム 型定義（Ver.3.0 福笑い方式）
// Base / Lighting / Parts(brow・eye・mouth・other) / Effect のレイヤー構造
// パーツ配置は public/characters/{charId}/parts.json（マニフェスト）で定義。
// マニフェストが無いキャラは従来の expression/{id}/*.png フォルダ方式で描画。
// =============================================================

/** 表情プリセット ID（parts.json の presets キー、または旧 expression/ フォルダ名） */
export type ExpressionId = string;

/** 照明状態 ID（lighting/ フォルダ名と一致） */
export type LightingId =
  | "normal" | "sunset" | "indoor" | "flashlight" | "glow"
  | (string & {});

/** エフェクト ID（effects/{id}.png のファイル名と一致） */
export type EffectId = "blush" | "sweat" | "tears" | (string & {});

/** 福笑いパーツのスロット種別 */
export type PartSlot = "brow" | "eye" | "mouth" | "other";

/**
 * パーツ差分アセット 1 枚分の定義。
 * x, y はベース顔画像のピクセル座標で、パーツ画像の「左上角」を置く位置（赤十字ピボット）。
 */
export interface PartAsset {
  /** キャラクターディレクトリからの相対パス（例: "parts/eye/smile.png"） */
  src: string;
  /** ピボットX（ベース画像ピクセル座標・パーツ左上角） */
  x: number;
  /** ピボットY（ベース画像ピクセル座標・パーツ左上角） */
  y: number;
  /** 表示幅（ベース画像ピクセル単位）。省略時はパーツ画像の実寸を等倍配置 */
  w?: number;
}

/** 表情プリセット: 各スロットのステート名の組み合わせ */
export interface ExpressionPreset {
  brow?:  string;
  eye?:   string;
  mouth?: string;
  other?: string[];
}

/**
 * キャラクターごとのパーツマニフェスト（public/characters/{charId}/parts.json）
 */
export interface CharacterPartsManifest {
  /** ベース顔画像のピクセルサイズ（座標系の基準） */
  canvas: { width: number; height: number };
  /** ベース画像パス（省略時 "base/face.png"） */
  base?: string;
  /** スロット別ステート名 → アセット定義 */
  parts: Partial<Record<PartSlot, Record<string, PartAsset>>>;
  /** 表情プリセット名 → パーツ組み合わせ（シナリオの expression がこれを参照） */
  presets?: Record<string, ExpressionPreset>;
}

/**
 * 表情動画レイヤー（透過webm）。
 * oneshot: ポーズ変化アニメーション用。1回再生後に静止画＋パーツへ戻る。
 * loop:    印象的シーン用。指定が変わるまでループ再生。
 * 再生中は福笑いパーツを非表示にする（動画側に表情が焼き込まれている前提）。
 */
export interface PortraitVideo {
  /** "/"始まりは public 直下、それ以外はキャラクターディレクトリ相対 */
  src:  string;
  mode: "oneshot" | "loop";
}

/** キャラクター立ち絵の演出状態 */
export interface PortraitState {
  /** 表情プリセット名（parts.json の presets を参照） */
  expression: ExpressionId;
  /** 個別パーツ上書き（プリセットより優先） */
  browState?:   string;
  eyeState?:    string;
  mouthState?:  string;
  otherStates?: string[];
  /** 表情動画（指定中は静止画パーツの代わりに再生） */
  video?:     PortraitVideo;
  lighting:   LightingId;
  effects:    EffectId[];
}

// =============================================================
// ノベルパート 型定義（ノベルゲーム機能要件.md 準拠）
// =============================================================

/** ノベルパート状態遷移フェーズ */
export type NovelState = 'IDLE' | 'TYPING' | 'WAITING_CLICK' | 'CHOICE' | 'COMPLETED' | 'MENU';

/** オーバーレイ表示種別 */
export type OverlayType = "none" | "log" | "menu";

/** ノベル演出状態（ロード復元用） */
export interface NovelVisualState {
  backgroundId: string | null;
  activeCharacters: Array<{
    characterId: string;
    poseId: string;
    position: [number, number, number];
    facialBlendShape: Record<string, number>;
    motionState: string | null;
    /** 立ち絵レイヤーシステム用（未指定時はデフォルト表情） */
    portrait?: PortraitState;
  }>;
  currentBgmId: string | null;
}

/** 単一選択肢 */
export interface ChoiceOption {
  choiceId: string;
  textKey: string;
  nextScenarioId: string | null;
  effects?: Record<string, any>;
}

/** バックログエントリ */
export interface BacklogEntry {
  speakerKey: string | null;
  textKey: string;
  voiceUrl?: string;
}

/** ゲーム全体のセーブデータ */
export interface GameSaveData {
  version: 1;
  savedAt: number;
  phase: GamePhase;
  language: Language;
  currentCheckpoint: number;
  age: number;
  cognitionLevel: number;
  timeleapCount: number;
  worldObjects: Record<string, WorldObject>;
  anomalyLog: AnomalyLog[];
  branchFlags: string[];
  endingFlags: EndingFlag[];
  cameraRoll: CaptureEntry[];
  unlockedLocations: string[];
}

/** 完全シリアライズ可能なセーブスロット用データ */
export interface NovelSaveData {
  currentScenarioId: string;
  currentStepIndex: number;
  novelState: NovelState;
  speakerKey: string | null;
  textKey: string;
  currentVoiceUrl: string | null;
  visualState: NovelVisualState;
  variables: Record<string, any>;
  updatedAt: number;
}

/** 全セーブデータで共有するシステム用データ */
export interface NovelSystemData {
  readChoices: Record<string, boolean>;
  readSteps: Record<string, boolean>;
  isAutoModeActive: boolean;
  isNextModeActive: boolean;
}

/** 3Dアニメーション制御イベント */
export interface SceneControlEvent {
  type: 'TRANSITION' | 'TRIGGER_ANIMATION' | 'CAMERA_CUT' | 'LIP_SYNC_START' | 'MOTION_SWITCH' | 'PLAY_SE';
  target: any;
  timing?: { startAt: number; duration?: number };
  /** PLAY_SE: { seId: string }  /  TRANSITION(bgm): { bgmId: string }  etc. */
  payload: any;
}

/**
 * スチル演出の定義。
 * id は将来の画像アセット差し替えキー。
 * color は暫定単色プレースホルダー（例: "#0e1520"）。
 */
export interface StillDef {
  id: string;
  color: string;
  /** 開発メモ（将来の画像差し替え目安） */
  label?: string;
}

/** ノベルシナリオの1ステップ（発話 or 地の文） */
export interface NovelStep {
  speakerKey: string | null;
  textKey: string;
  voiceUrl?: string;
  backgroundId?: string;
  /** このステップで実行する演出イベント */
  events?: SceneControlEvent[];
  /** このステップの後に表示する選択肢 */
  choices?: ChoiceOption[];
  /** このステップの3D演出状態（立ち絵・表情・BGM・モーション） */
  visualState?: NovelVisualState;
  /**
   * スチルオーバーレイ制御。
   * undefined = 前ステップのスチルを維持 / null = スチルを消去 / StillDef = 切り替え
   */
  still?: StillDef | null;
}

/** ノベルシナリオ全体 */
export interface NovelScenario {
  id: string;
  steps: NovelStep[];
}

// =============================================================
// エディタ用 型定義（asset_placer_gui_spec.md 準拠）
// =============================================================

/** Gizmoモード */
export type GizmoMode = "translate" | "rotate" | "scale";

/** モーフターゲットデータ（エディタ用） */
export interface MorphTargetData {
  name: string;
  weight: number;
  min?: number;
  max?: number;
}

/** コリジョンメッシュ種別 */
export type CollisionType = "wall" | "floor" | "trigger" | "boundary";

/** コリジョンメッシュデータ */
export interface CollisionMeshData {
  id: string;
  type: CollisionType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

/** animloopプレビュー状態 */
export interface AnimloopPreviewState {
  progress: number;       // 0.0（変化前）〜 1.0（変化後）
  isPlaying: boolean;
  previewSpeed: number;   // changePatternから自動設定（手動変更も可）
}

/** エディタエクスポートJSON構造 */
export interface EditorExport {
  version: string;                  // "1.0"
  exportedAt: string;               // ISO8601タイムスタンプ
  checkpointId: number | "all";     // フィルターに応じて変化
  objects: WorldObject[];           // 編集後のWorldObject配列
  collisionMeshes: CollisionMeshData[]; // コリジョン座標
  riggedAssets: RiggedAsset[];      // リグ付きアセット定義
}

// =============================================================
// モーフ・表情制御 型定義（仕様 §13, §14）
// =============================================================

/** 表情エントリ（直接定義） */
export interface ExpressionEntryDirect {
  morphs: Record<string, number>;
  time: number;
  ease?: string;
}

/** 表情エントリ（差分定義） */
export interface ExpressionEntryDiff {
  from: string;
  to: string;
  time: number;
  ease?: string;
}

/** 表情エントリ（2種類のunion） */
export type ExpressionEntry = ExpressionEntryDirect | ExpressionEntryDiff;

/** 表情定義ファイルのルート構造 */
export type ExpressionFile = Record<string, ExpressionEntry>;

/** リグ付きアセット定義 */
export interface RiggedAsset {
  id: string;
  assetType: "human" | "cat";
  glbPath: string;
  checkpointId: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  expressionKeys: {
    before: string;
    after: string;
    default: string;
  };
  timelineIds: string[];
}

/** モーフトリガー種別 */
export type MorphTrigger =
  | { type: "animloop_before" }
  | { type: "animloop_after" }
  | { type: "checkpoint_enter"; checkpointId: number }
  | { type: "player_nearby"; radius: number }
  | { type: "always" };

/** モーフキーフレーム */
export interface MorphKeyframe {
  time: number;   // 0〜totalDuration
  value: number;  // 0.0〜1.0
  ease: string;   // GSAPイージング文字列
}

/** モーフトラック */
export interface MorphTrack {
  morphName: string;
  keyframes: MorphKeyframe[];
}

/** モーフタイムライン定義 */
export interface MorphTimeline {
  trigger: MorphTrigger;
  loop: boolean;
  yoyo: boolean;
  totalDuration: number;
  tracks: MorphTrack[];
}

/** タイムラインファイルのルート構造 */
export type TimelineFile = Record<string, MorphTimeline>;