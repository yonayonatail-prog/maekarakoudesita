import { useGameStore } from "../store/gameStore";
import { t } from "../data/i18n";

// =============================================================
// ChoiceMenu — ノベルパートの選択肢UI
// 既読判定によるスタイル変更、クリックで選択処理をStoreに委譲
// =============================================================

export function ChoiceMenu() {
  const novelState = useGameStore((s) => s.novelState);
  const currentChoices = useGameStore((s) => s.currentChoices);
  const readChoices = useGameStore((s) => s.novelSystemData.readChoices);
  const language = useGameStore((s) => s.language);
  const selectChoice = useGameStore((s) => s.selectChoice);

  // CHOICE 状態以外は非表示
  if (novelState !== "CHOICE" || currentChoices.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 220,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 320,
        maxWidth: 520,
        pointerEvents: "auto",
        userSelect: "none",
      }}
    >
      {currentChoices.map((choice) => {
        const isRead = !!readChoices[choice.choiceId];
        const text = t(choice.textKey, language);

        return (
          <button
            key={choice.choiceId}
            onClick={() => selectChoice(choice.choiceId, choice.nextScenarioId)}
            style={{
              padding: "14px 24px",
              fontSize: 16,
              letterSpacing: 1,
              lineHeight: 1.5,
              textAlign: "left",
              background: isRead
                ? "rgba(200,168,90,0.15)"
                : "rgba(0,0,0,0.5)",
              color: isRead ? "var(--accent)" : "#e8e2d2",
              border: isRead
                ? "1px solid rgba(200,168,90,0.4)"
                : "1px solid rgba(232,226,210,0.3)",
              borderRadius: 4,
              cursor: "pointer",
              transition: "background 0.2s, border-color 0.2s",
              backdropFilter: "blur(4px)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(200,168,90,0.25)";
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isRead
                ? "rgba(200,168,90,0.15)"
                : "rgba(0,0,0,0.5)";
              e.currentTarget.style.borderColor = isRead
                ? "rgba(200,168,90,0.4)"
                : "rgba(232,226,210,0.3)";
            }}
          >
            {isRead && (
              <span style={{ marginRight: 8, opacity: 0.6 }}>✓</span>
            )}
            {text}
          </button>
        );
      })}
    </div>
  );
}

