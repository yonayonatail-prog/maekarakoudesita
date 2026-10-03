// =============================================================
// MenuOverlay — ノベルパートのメニューオーバーレイ
// セーブ/ロード/設定/タイトルに戻る 機能を提供
// 表示中はサスペンド状態（isSuspended=true）になり全入力遮断
// =============================================================

import { useState } from "react";
import { useGameStore } from "../store/gameStore";

type MenuTab = "save" | "load" | "settings";

export function MenuOverlay() {
  const overlay = useGameStore((s) => s.overlay);
  const language = useGameStore((s) => s.language);
  const backgroundId = useGameStore((s) => s.novelVisualState.backgroundId);
  const setOverlay = useGameStore((s) => s.setOverlay);
  const exitNovel = useGameStore((s) => s.exitNovel);
  const resetGame = useGameStore((s) => s.resetGame);
  const serializeSaveData = useGameStore((s) => s.serializeSaveData);
  const loadNovelState = useGameStore((s) => s.loadNovelState);

  const [activeTab, setActiveTab] = useState<MenuTab>("save");
  const [saveSlots, setSaveSlots] = useState<Array<{ id: number; label: string; exists: boolean }>>(() =>
    Array.from({ length: 9 }, (_, i) => ({
      id: i + 1,
      label: `${language === "ja" ? "スロット" : "Slot"} ${i + 1}`,
      exists: !!localStorage.getItem(`__novel_save_${i + 1}__`),
    }))
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // メニューが非表示なら何も描画しない
  if (overlay !== "menu") return null;

  const ja = language === "ja";

  const isDarkBg =
    !backgroundId ||
    backgroundId.includes("night") ||
    backgroundId.includes("evening") ||
    backgroundId.includes("dark");

  const bgColor = isDarkBg ? "rgba(0,0,0,0.92)" : "rgba(232,226,210,0.95)";
  const textColor = isDarkBg ? "#e8e2d2" : "#16140f";
  const accentColor = "var(--accent, #c8a85a)";
  const borderColor = isDarkBg ? "rgba(232,226,210,0.15)" : "rgba(22,20,15,0.15)";
  const mutedColor = isDarkBg ? "rgba(232,226,210,0.4)" : "rgba(22,20,15,0.4)";

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  }

  function handleSave(slotId: number) {
    try {
      const data = serializeSaveData();
      localStorage.setItem(`__novel_save_${slotId}__`, JSON.stringify(data));
      setSaveSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, exists: true } : s))
      );
      showToast(ja ? `スロット${slotId}にセーブしました` : `Saved to slot ${slotId}`);
    } catch {
      showToast(ja ? "セーブに失敗しました" : "Save failed");
    }
  }

  function handleLoad(slotId: number) {
    try {
      const raw = localStorage.getItem(`__novel_save_${slotId}__`);
      if (!raw) {
        showToast(ja ? "セーブデータがありません" : "No save data");
        return;
      }
      const data = JSON.parse(raw);
      loadNovelState(data);
      setOverlay("none");
      showToast(ja ? `スロット${slotId}からロードしました` : `Loaded from slot ${slotId}`);
    } catch {
      showToast(ja ? "ロードに失敗しました" : "Load failed");
    }
  }

  function handleTitleReturn() {
    resetGame();
    setOverlay("none");
  }

  const tabStyle = (tab: MenuTab): React.CSSProperties => ({
    padding: "8px 20px",
    fontSize: 13,
    letterSpacing: 1.5,
    background: activeTab === tab ? accentColor : "transparent",
    color: activeTab === tab ? "#16140f" : mutedColor,
    border: `1px solid ${activeTab === tab ? accentColor : borderColor}`,
    borderRadius: 2,
    cursor: "pointer",
    transition: "all 0.15s",
  });

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
          {ja ? "メニュー" : "Menu"}
        </span>
        <button
          onClick={() => setOverlay("none")}
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
          {ja ? "閉じる" : "Close"}
        </button>
      </div>

      {/* タブ */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 24px",
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <button
          style={tabStyle("save")}
          onClick={() => setActiveTab("save")}
        >
          {ja ? "セーブ" : "Save"}
        </button>
        <button
          style={tabStyle("load")}
          onClick={() => setActiveTab("load")}
        >
          {ja ? "ロード" : "Load"}
        </button>
        <button
          style={tabStyle("settings")}
          onClick={() => setActiveTab("settings")}
        >
          {ja ? "設定" : "Settings"}
        </button>
      </div>

      {/* コンテンツ */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
        }}
      >
        {activeTab === "save" && (
          <div>
            <p style={{ fontSize: 12, color: mutedColor, marginBottom: 16 }}>
              {ja ? "セーブスロットを選んでください" : "Select a save slot"}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              {saveSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleSave(slot.id)}
                  style={{
                    padding: "14px 12px",
                    fontSize: 13,
                    background: slot.exists
                      ? "rgba(200,168,90,0.12)"
                      : "rgba(0,0,0,0.2)",
                    color: textColor,
                    border: `1px solid ${
                      slot.exists ? "rgba(200,168,90,0.3)" : borderColor
                    }`,
                    borderRadius: 4,
                    cursor: "pointer",
                    transition: "background 0.15s",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {slot.label}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.5 }}>
                    {slot.exists
                      ? ja
                        ? "データあり"
                        : "Data exists"
                      : ja
                      ? "空"
                      : "Empty"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "load" && (
          <div>
            <p style={{ fontSize: 12, color: mutedColor, marginBottom: 16 }}>
              {ja
                ? "ロードするセーブスロットを選んでください"
                : "Select a save slot to load"}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              {saveSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleLoad(slot.id)}
                  disabled={!slot.exists}
                  style={{
                    padding: "14px 12px",
                    fontSize: 13,
                    background: slot.exists
                      ? "rgba(200,168,90,0.12)"
                      : "rgba(0,0,0,0.1)",
                    color: slot.exists ? textColor : mutedColor,
                    border: `1px solid ${
                      slot.exists ? "rgba(200,168,90,0.3)" : borderColor
                    }`,
                    borderRadius: 4,
                    cursor: slot.exists ? "pointer" : "not-allowed",
                    transition: "background 0.15s",
                    textAlign: "center",
                    opacity: slot.exists ? 1 : 0.4,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {slot.label}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.5 }}>
                    {slot.exists
                      ? ja
                        ? "データあり"
                        : "Data exists"
                      : ja
                      ? "空"
                      : "Empty"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <p style={{ fontSize: 12, color: mutedColor, marginBottom: 16 }}>
              {ja ? "設定" : "Settings"}
            </p>

            {/* タイトルに戻る */}
            <button
              onClick={handleTitleReturn}
              style={{
                padding: "12px 24px",
                fontSize: 13,
                letterSpacing: 1,
                background: "rgba(176,65,58,0.15)",
                color: "#b0413a",
                border: "1px solid rgba(176,65,58,0.3)",
                borderRadius: 4,
                cursor: "pointer",
                transition: "background 0.15s",
                width: "100%",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {ja ? "タイトルに戻る" : "Return to Title"}
            </button>

            <button
              onClick={() => exitNovel()}
              style={{
                padding: "12px 24px",
                fontSize: 13,
                letterSpacing: 1,
                background: "rgba(255,255,255,0.05)",
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 4,
                cursor: "pointer",
                transition: "background 0.15s",
                width: "100%",
                textAlign: "center",
              }}
            >
              {ja ? "探索に戻る" : "Return to Exploration"}
            </button>
          </div>
        )}
      </div>

      {/* トースト通知 */}
      {toastMessage && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 24px",
            background: "rgba(0,0,0,0.85)",
            color: "#e8e2d2",
            borderRadius: 4,
            fontSize: 13,
            letterSpacing: 0.5,
            whiteSpace: "nowrap",
            zIndex: 300,
            transition: "opacity 0.2s",
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}