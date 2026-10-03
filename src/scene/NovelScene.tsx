import { useEffect, useCallback, useState, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { TextWindow } from "../ui/TextWindow";
import { ChoiceMenu } from "../ui/ChoiceMenu";
import { AnomalyLogPanel } from "../ui/AnomalyLogPanel";
import { MenuOverlay } from "../ui/MenuOverlay";
import { CharacterSprite } from "../ui/CharacterSprite";
import type { StillDef } from "../types";

// =============================================================
// NovelScene — 3Dシーン上に重ねる会話オーバーレイ
// 画面下部にテキストウィンドウ＋ミニマムなシステムボタンを表示
// ======================================================================

/** オートモードの自動送り間隔（ms） */
const AUTO_ADVANCE_MS = 3000;

export function NovelScene() {
  const novelState = useGameStore((s) => s.novelState);
  const isAutoMode = useGameStore((s) => s.novelSystemData.isAutoModeActive);
  const isNextMode = useGameStore((s) => s.novelSystemData.isNextModeActive);
  const isSuspended = useGameStore((s) => s.isSuspended);
  const handleScreenClick = useGameStore((s) => s.handleScreenClick);
  const goToNextStep = useGameStore((s) => s.goToNextStep);
  const toggleAutoMode = useGameStore((s) => s.toggleAutoMode);
  const toggleNextMode = useGameStore((s) => s.toggleNextMode);
  const setOverlay = useGameStore((s) => s.setOverlay);
  const exitNovel = useGameStore((s) => s.exitNovel);
  const language = useGameStore((s) => s.language);

  // スキップ確認バーの表示フラグ
  const [skipConfirm, setSkipConfirm] = useState(false);

  // シナリオ完了時に自動的にオーバーレイを閉じる
  useEffect(() => {
    if (novelState === "COMPLETED") {
      exitNovel();
    }
  }, [novelState, exitNovel]);

  // シナリオが変わったらスキップ確認を閉じる
  useEffect(() => {
    setSkipConfirm(false);
  }, [novelState]);

  // オートモード：WAITING_CLICK で自動送り
  useEffect(() => {
    if (isSuspended) return;
    if (!isAutoMode || novelState !== "WAITING_CLICK") return;
    const timer = setTimeout(() => {
      goToNextStep();
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [isAutoMode, novelState, goToNextStep, isSuspended]);

  // DEV モード専用ショートカット: Ctrl+Shift+S で即スキップ
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === "KeyS") {
        e.preventDefault();
        exitNovel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exitNovel]);

  // テキストパネルのクリックでテキスト進行（システムUIクリックは除外）
  const handlePanelClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const isSystemUi = target.closest("[data-novel-system-ui]") || target.closest("[data-overlay]");
      if (isSystemUi) return;
      // 確認バーが出ている間は本文クリックでキャンセル
      if (skipConfirm) { setSkipConfirm(false); return; }
      handleScreenClick();
    },
    [handleScreenClick, skipConfirm]
  );

  const ja = language === "ja";

  return (
    // 全画面透明オーバーレイ（ポインタイベントは子に委譲）
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        pointerEvents: "none",
        isolation: "isolate",
      }}
    >
      {/* スチルオーバーレイ（3Dシーン上・立ち絵の後ろ） */}
      <StillLayer />

      {/* 立ち絵（左側バストアップ2D） */}
      <CharacterSprite />

      {/* 選択肢（テキストパネルの上に出現） */}
      <ChoiceMenu />

      {/* 画面下部テキストパネル */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          zIndex: 20,
        }}
        onClick={handlePanelClick}
      >
        {/* スキップ確認バー（SKIPボタン押下後に表示） */}
        {skipConfirm && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 8,
              padding: "6px 12px",
              background: "rgba(0,0,0,0.82)",
              borderTop: "1px solid rgba(192,80,74,0.5)",
            }}
            data-novel-system-ui
          >
            <span style={{ fontSize: 11, color: "#e8e2d2", letterSpacing: 1 }}>
              {ja ? "シナリオをスキップしますか？" : "Skip this scenario?"}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); exitNovel(); }}
              style={{ ...btn(false), color: "#c0504a", borderColor: "rgba(192,80,74,0.6)", padding: "3px 10px" }}
            >
              {ja ? "スキップ" : "SKIP"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setSkipConfirm(false); }}
              style={{ ...btn(false), padding: "3px 10px" }}
            >
              {ja ? "戻る" : "BACK"}
            </button>
          </div>
        )}

        {/* システムボタン群：テキスト右端にミニマムに配置 */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "4px 12px 0",
            gap: 4,
          }}
          data-novel-system-ui
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleAutoMode(); }}
            style={btn(isAutoMode)}
            title={ja ? "オート" : "Auto"}
          >
            AUTO
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleNextMode(); }}
            style={btn(isNextMode)}
            title={ja ? "次へスキップ" : "Skip"}
          >
            NEXT
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOverlay("log"); }}
            style={btn(false)}
            title={ja ? "ログ" : "Log"}
          >
            LOG
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOverlay("menu"); }}
            style={btn(false)}
            title={ja ? "メニュー" : "Menu"}
          >
            MENU
          </button>
          {/* スキップボタン: 1クリック目で確認バー / DEV では Ctrl+Shift+S でも即スキップ */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (import.meta.env.DEV) { exitNovel(); return; }
              setSkipConfirm((v) => !v);
            }}
            style={{
              ...btn(skipConfirm),
              color: skipConfirm ? "#16140f" : "#c0a060",
              borderColor: skipConfirm ? "var(--accent)" : "rgba(192,160,96,0.4)",
            }}
            title={
              ja
                ? import.meta.env.DEV
                  ? "シナリオをスキップ (Ctrl+Shift+S)"
                  : "シナリオをスキップ"
                : import.meta.env.DEV
                ? "Skip scenario (Ctrl+Shift+S)"
                : "Skip scenario"
            }
          >
            SKIP
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); exitNovel(); }}
            style={{ ...btn(false), color: "#c0504a" }}
            title={ja ? "会話を閉じる" : "Close"}
          >
            ✕
          </button>
        </div>

        {/* テキストウィンドウ */}
        <TextWindow />
      </div>

      {/* ログ / メニューオーバーレイ（全画面） */}
      <AnomalyLogPanel />
      <MenuOverlay />
    </div>
  );
}

// =============================================================
// StillLayer — フェードつき単色スチルオーバーレイ
// zIndex: 2 → CharacterSprite(10) より後ろ、3Dシーンより前
// still undefined = 前コマ維持 / null = フェードアウトして消去
// =============================================================

const STILL_FADE_MS = 400;

function StillLayer() {
  const still = useGameStore((s) => s.currentStill);
  const [displayed, setDisplayed] = useState<StillDef | null>(still);
  const [opacity, setOpacity] = useState(still ? 0 : 0); // 常に 0 スタートでフェードイン
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  };

  useEffect(() => {
    clearTimer();

    if (!displayed && still) {
      // null → still: set してフェードイン
      setDisplayed(still);
      timerRef.current = window.setTimeout(() => setOpacity(1), 16);
    } else if (displayed && !still) {
      // still → null: フェードアウト後に消去
      setOpacity(0);
      timerRef.current = window.setTimeout(() => setDisplayed(null), STILL_FADE_MS);
    } else if (displayed && still && displayed.id !== still.id) {
      // still A → still B: フェードアウト → 差し替え → フェードイン
      setOpacity(0);
      timerRef.current = window.setTimeout(() => {
        setDisplayed(still);
        timerRef.current = window.setTimeout(() => setOpacity(1), 16);
      }, STILL_FADE_MS);
    } else if (displayed && still) {
      // 同一 id で color だけ変化: 即時反映（CSS background-color transition が補間）
      setDisplayed(still);
    }

    return clearTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still?.id ?? null, still?.color ?? null]);

  if (!displayed) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 2,
        background: displayed.color,
        opacity,
        transition: `opacity ${STILL_FADE_MS}ms ease, background-color 0.3s ease`,
        pointerEvents: "none",
      }}
    />
  );
}

/** コンパクトなシステムボタンスタイル */
function btn(active: boolean): React.CSSProperties {
  return {
    padding: "2px 7px",
    fontSize: 10,
    letterSpacing: 1,
    background: active ? "var(--accent)" : "rgba(0,0,0,0.55)",
    color: active ? "#16140f" : "#e8e2d2",
    border: active
      ? "1px solid var(--accent)"
      : "1px solid rgba(232,226,210,0.2)",
    borderRadius: 2,
    cursor: "pointer",
    backdropFilter: "blur(4px)",
    fontFamily: "inherit",
    transition: "background 0.15s",
  };
}
