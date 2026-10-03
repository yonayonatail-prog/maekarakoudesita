import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGameStore } from "./gameStore";

// 依存する外部データやモジュールをモックするための準備
vi.mock("../data/novelScenario", () => ({
  getScenarioById: vi.fn(),
}));

describe("gameStore — 初期状態の検証", () => {
  it("ストアが初期値で正しく初期化されていること", () => {
    const s = useGameStore.getState();
    expect(s.phase).toBe("title");
    expect(s.currentCheckpoint).toBe(0);
    expect(s.novelState).toBe("IDLE");
    expect(s.isSuspended).toBe(false);
  });
});

describe("gameStore — novelState 遷移と制御（NEXT概念統一版）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // テスト開始前にストアをクリーンな状態にリセット
    useGameStore.setState({
      novelState: "IDLE",
      currentScenarioId: "",
      currentStepIndex: 0,
      speakerKey: null,
      textKey: "",
      currentVoiceUrl: null,
      currentChoices: [],
      backlog: [],
      novelVisualState: {
        backgroundId: null,
        activeCharacters: [],
        currentBgmId: null,
      },
      novelVariables: {},
      novelSystemData: {
        readChoices: {},
        readSteps: {},
        isAutoModeActive: false,
        isNextModeActive: false, // ★ NEXT概念に統一
      },
      novelEntryScenarioId: null,
      isSuspended: false,
      overlay: "none" as const,
    });
  });

  it("advanceNovel() で TYPING → WAITING_CLICK に遷移する（NEXTトリガー）", () => {
    useGameStore.setState({ novelState: "TYPING" as const, textKey: "test.key" });
    useGameStore.getState().advanceNovel();
    const s = useGameStore.getState();
    expect(s.novelState).toBe("WAITING_CLICK");
  });

  it("IDLEまたはCHOICE状態からのadvanceNovel()呼び出しもWAITING_CLICKに遷移する", () => {
    // IDLEから
    useGameStore.setState({ novelState: "IDLE" as const });
    useGameStore.getState().advanceNovel();
    expect(useGameStore.getState().novelState).toBe("WAITING_CLICK");

    // CHOICEから
    useGameStore.setState({ novelState: "CHOICE" as const });
    useGameStore.getState().advanceNovel();
    expect(useGameStore.getState().novelState).toBe("WAITING_CLICK");
  });
});

describe("gameStore — 画面クリックイベントの処理 (handleScreenClick)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // テスト用にストア状態をセット
    useGameStore.setState({
      novelState: "WAITING_CLICK" as const,
      currentScenarioId: "intro",
      currentStepIndex: 0,
      speakerKey: null,
      textKey: "text.intro_01",
    });
  });

  it("WAITING_CLICK状態でのクリックは、goToNextStepを呼び出す", () => {
    const mockGoToNextStep = vi.fn();
    // goToNextStepをスパイモック（stateの操作としてラップ）
    const originalGoToNextStep = useGameStore.getState().goToNextStep;
    useGameStore.setState({ goToNextStep: mockGoToNextStep } as never);

    useGameStore.getState().handleScreenClick();

    expect(mockGoToNextStep).toHaveBeenCalledTimes(1);

    // クリーンアップ: 元の関数に戻す
    useGameStore.setState({ goToNextStep: originalGoToNextStep } as never);
  });

  it("TYPING状態でのクリックは、advanceNovelを呼び出してWAITING_CLICKに遷移させる", () => {
    useGameStore.setState({
      novelState: "TYPING" as const,
      currentScenarioId: "intro",
      currentStepIndex: 0,
    });

    // advanceNovelがhandleScreenClickから呼ばれることを確認する
    const mockAdvanceNovel = vi.fn();
    const originalAdvanceNovel = useGameStore.getState().advanceNovel;
    useGameStore.setState({ advanceNovel: mockAdvanceNovel } as never);

    useGameStore.getState().handleScreenClick();

    expect(mockAdvanceNovel).toHaveBeenCalledTimes(1);

    // クリーンアップ
    useGameStore.setState({ advanceNovel: originalAdvanceNovel } as never);
  });

  it("サスペンド中は全てのクリックイベント処理がスキップされる", () => {
    // advanceNovelとgoToNextStepをスパイモック
    const mockAdvanceNovel = vi.fn();
    const mockGoToNextStep = vi.fn();
    const originalAdvanceNovel = useGameStore.getState().advanceNovel;
    const originalGoToNextStep = useGameStore.getState().goToNextStep;
    useGameStore.setState({
      advanceNovel: mockAdvanceNovel,
      goToNextStep: mockGoToNextStep,
    } as never);

    // サスペンド状態を強制設定
    useGameStore.setState({ isSuspended: true });

    useGameStore.getState().handleScreenClick();

    // 検証: サスペンド時は両方呼ばれない
    expect(mockAdvanceNovel).not.toHaveBeenCalled();
    expect(mockGoToNextStep).not.toHaveBeenCalled();

    // クリーンアップ
    useGameStore.setState({
      advanceNovel: originalAdvanceNovel,
      goToNextStep: originalGoToNextStep,
    } as never);
  });
});

describe("gameStore — オートモード / NEXTモード", () => {
  it("toggleAutoMode で isAutoModeActive が反転する", () => {
    expect(useGameStore.getState().novelSystemData.isAutoModeActive).toBe(false);
    useGameStore.getState().toggleAutoMode();
    expect(useGameStore.getState().novelSystemData.isAutoModeActive).toBe(true);
  });

  it("toggleNextMode で isNextModeActive が反転する（★ NEXT概念統一）", () => {
    expect(useGameStore.getState().novelSystemData.isNextModeActive).toBe(false);
    useGameStore.getState().toggleNextMode();
    expect(useGameStore.getState().novelSystemData.isNextModeActive).toBe(true);
  });
});