// =============================================================
// AnomalyLogPanel — ノベルパートのバックログ（ログ履歴）表示オーバーレイ
// メニュー/ログ表示中はサスペンド状態になり、画面クリック進行が遮断される
// =============================================================

import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { t } from "../data/i18n";

export function AnomalyLogPanel({ onClose }: { onClose?: () => void }) {
  const overlay = useGameStore((s) => s.overlay);
  const backlog = useGameStore((s) => s.backlog);
  const language = useGameStore((s) => s.language);
  const setOverlay = useGameStore((s) => s.setOverlay);
  const backgroundId = useGameStore((s) => s.novelVisualState.backgroundId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ログが非表示なら何も描画しない
  if (overlay !== "log") return null;

  const isDarkBg =
    !backgroundId ||
    backgroundId.includes("night") ||
    backgroundId.includes("evening") ||
    backgroundId.includes("dark");

  const bgColor = isDarkBg ? "rgba(0,0,0,0.92)" : "rgba(232,226,210,0.95)";
  const textColor = isDarkBg ? "#e8e2d2" : "#16140f";
  const accentColor = "var(--accent, #c8a85a)";
  const borderColor = isDarkBg ? "rgba(232,226,210,0.15)" : "rgba(22,20,15,0.15)";

  // 表示時に最下部（最新ログ）へスクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [backlog.length]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        zIndex: 200,
        background: bgColor,
        backdropFilter: "blur(8px)",
        userSelect: "none",
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 2,
            color: accentColor,
          }}
        >
          {language === "ja" ? "ログ" : "Log"}
        </span>
        <button
          onClick={() => {
            if (onClose) onClose();
            setOverlay("none");
          }}
          style={{
            padding: "6px 16px",
            fontSize: 12,
            letterSpacing: 1,
            background: "rgba(255,255,255,0.08)",
            color: textColor,
            border: `1px solid ${borderColor}`,
            borderRadius: 2,
            cursor: "pointer",
            transition: "background 0.15s",
          }}
        >
          {language === "ja" ? "閉じる" : "Close"}
        </button>
      </div>

      {/* ログ一覧（スクロール可能） */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 24px",
        }}
      >
        {backlog.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: textColor,
              opacity: 0.4,
              paddingTop: 60,
              fontSize: 14,
            }}
          >
            {language === "ja" ? "ログはまだありません" : "No log entries yet"}
          </div>
        ) : (
          backlog.map((entry, i) => {
            const speakerLabel = entry.speakerKey
              ? t(entry.speakerKey, language)
              : null;
            const displayText = t(entry.textKey, language);

            return (
              <div
                key={i}
                style={{
                  marginBottom: 14,
                  padding: "10px 14px",
                  borderLeft: `3px solid ${
                    speakerLabel ? accentColor : "transparent"
                  }`,
                  borderRadius: 2,
                  background: speakerLabel
                    ? "rgba(255,255,255,0.03)"
                    : "transparent",
                }}
              >
                {speakerLabel && (
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: accentColor,
                      marginBottom: 3,
                      letterSpacing: 1,
                    }}
                  >
                    {speakerLabel}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: textColor,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {displayText}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}