import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { t } from "../data/i18n";

// =============================================================
// TextWindow — ノベルパートのテキスト表示ウィンドウ
// タイピングエフェクト、キャラ名表示、背景色に応じたCSS変数切替
// =============================================================

/** 一文字あたりの表示時間（ms） */
const CHAR_INTERVAL_MS = 40;
/** 最大表示文字数（パフォーマンス/レイアウト安定用） */
const MAX_VISIBLE_CHARS = 800;

export function TextWindow() {
  // 状態の参照をuseGameStoreから分割して取得
  const novelState = useGameStore((s) => s.novelState);
  const speakerKey = useGameStore((s) => s.speakerKey);
  const textKey = useGameStore((s) => s.textKey);
  const language = useGameStore((s) => s.language);
  const backgroundId = useGameStore((s) => s.novelVisualState.backgroundId);
  const isNextMode = useGameStore((s) => s.novelSystemData.isNextModeActive);
  const advanceNovel = useGameStore((s) => s.advanceNovel);
  
  const [displayedChars, setDisplayedChars] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── レンダリング用の派生値（useEffectより前に定義） ──

  const isDarkBg =
    !backgroundId ||
    backgroundId.includes("night") ||
    backgroundId.includes("evening") ||
    backgroundId.includes("dark");

  const speakerLabel = speakerKey ? t(speakerKey, language) : "";
  const displayText = t(textKey, language);

  // デバッグ: レンダリング時の値を確認
  console.log(`[TextWindow] textKey="${textKey}" novelState="${novelState}" speakerKey="${speakerKey}" displayText.length=${displayText.length}`);

  // テキストキーが変わったらタイピング再開
  useEffect(() => {
    if (novelState === "TYPING") {
      setDisplayedChars(0);
      // タイピングが開始した瞬間からタイマーを開始
      timerRef.current = setInterval(() => {
        setDisplayedChars((prev) => {
          // ★ 実際のテキスト長を上限として比較し、超過したら完了
          const next = prev + 1;
          if (next >= displayText.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            // タイピング完了後は、ゲームストアに状態遷移を任せる
            advanceNovel(); 
            return displayText.length;
          }
          return next;
        });
      }, CHAR_INTERVAL_MS);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [textKey, novelState, advanceNovel, displayText.length, isNextMode]); // isNextModeを依存配列に追加

  // WAITING_CLICK で全文字表示
  useEffect(() => {
    if (novelState === "WAITING_CLICK" || novelState === "CHOICE") {
      setDisplayedChars(MAX_VISIBLE_CHARS);
    }
  }, [novelState]);

  const charsToShow = Math.min(displayedChars, displayText.length);

  // デバッグ: 表示文字数と全文長
  console.log(`[TextWindow] charsToShow=${charsToShow} displayText="${displayText.slice(0, 60)}"`);

  const visibleText = displayText.slice(0, charsToShow);

  return (
    <div
      className={`text-window ${isDarkBg ? "bg-dark" : "bg-light"}`}
      style={{
        padding: "20px 40px 28px",
        background: isDarkBg
          ? "linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.60) 70%, transparent 100%)"
          : "linear-gradient(0deg, rgba(232,226,210,0.95) 0%, rgba(232,226,210,0.60) 70%, transparent 100%)",
        pointerEvents: "auto",
        userSelect: "none",
      }}
    >
      {/* キャラ名 */}
      {speakerLabel && (
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: 2,
            marginBottom: 6,
            color: isDarkBg ? "var(--accent)" : "#6b4e2e",
          }}
        >
          {speakerLabel}
        </div>
      )}

      {/* テキスト本文 */}
      <div
        style={{
          fontSize: 17,
          lineHeight: 1.9,
          letterSpacing: 0.5,
          color: isDarkBg ? "#e8e2d2" : "#16140f",
          textShadow: isDarkBg
            ? "0 1px 4px rgba(0,0,0,0.6), 0 0 12px rgba(0,0,0,0.3)"
            : "0 1px 4px rgba(232,226,210,0.6), 0 0 12px rgba(232,226,210,0.3)",
          minHeight: "3.8em",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {visibleText}
        {novelState === "TYPING" && charsToShow < displayText.length && (
          <span
            style={{
              animation: "blink 0.8s step-end infinite",
              color: isDarkBg ? "var(--accent)" : "#6b4e2e",
            }}
          >
            ▍
          </span>
        )}

        {/* 続行アイコン（WAITING_CLICK 時） */}
        {/* このアイコンは、NovelSceneコンポーネントがクリックをキャッチし、
        次のステップへの進行をトリガーするため、ここでは単に表示のみ行う。 */}
        {novelState === "WAITING_CLICK" && (
          <span className="next-indicator" style={{ marginLeft: 8 }}>
            ▼
          </span>
        )}
      </div>
    </div>
  );
}