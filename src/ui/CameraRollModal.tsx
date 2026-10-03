import { useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { CHECKPOINTS } from "../data/checkpoints";

interface Props {
  onClose: () => void;
}

export function CameraRollModal({ onClose }: Props) {
  const cameraRoll = useGameStore((s) => s.cameraRoll);
  const language = useGameStore((s) => s.language);
  const ja = language === "ja";
  const scrollRef = useRef<HTMLDivElement>(null);

  // 新しい順に並べる
  const photos = [...cameraRoll].reverse();

  const formatDate = (entry: (typeof cameraRoll)[number]) => {
    const cp = CHECKPOINTS[entry.checkpointId];
    if (!cp) return "";
    return ja ? `${cp.year}年${cp.month}月` : `${cp.month}/${cp.year}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        pointerEvents: "auto",
      }}
      onClick={onClose}
    >
      {/* スマホフレーム */}
      <div
        style={{
          width: 300,
          height: 540,
          background: "#000",
          border: "11px solid #2a2a2a",
          borderRadius: 38,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "inset 0 0 20px rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.7)",
          position: "relative",
          overflow: "hidden",
          pointerEvents: "auto",
          animation: "rollModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 画面光沢 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%)",
            pointerEvents: "none",
            borderRadius: 27,
            zIndex: 10,
          }}
        />

        {/* ヘッダー */}
        <div
          style={{
            height: 48,
            background: "rgba(18,18,18,0.92)",
            backdropFilter: "blur(12px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 14px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
            zIndex: 5,
          }}
        >
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>
            {ja ? "ライブラリ" : "Library"}
          </span>
          <span
            style={{ color: "#007aff", fontSize: 13, cursor: "pointer" }}
            onClick={onClose}
          >
            {ja ? "閉じる" : "Close"}
          </span>
        </div>

        {/* 写真グリッド */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          <div
            style={{
              padding: "6px 6px",
              boxSizing: "border-box",
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 3,
              alignContent: "start",
            }}
          >
          {photos.length === 0 ? (
            <div
              style={{
                gridColumn: "span 4",
                color: "rgba(255,255,255,0.28)",
                textAlign: "center",
                paddingTop: 60,
                fontSize: 12,
                lineHeight: 1.8,
              }}
            >
              📷
              <br />
              {ja ? "まだ写真がありません" : "No photos yet"}
            </div>
          ) : (
            photos.map((entry, i) => {
              const isLarge = i === 0;
              return (
                <div
                  key={entry.id}
                  style={{
                    aspectRatio: "1 / 1",
                    background: "#1a1a2e",
                    borderRadius: isLarge ? 5 : 3,
                    backgroundImage: entry.imageDataUrl
                      ? `url(${entry.imageDataUrl})`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    boxShadow: entry.hasAnomaly
                      ? "inset 0 0 0 2px rgba(100,180,255,0.75)"
                      : "inset 0 0 0 1px rgba(255,255,255,0.08)",
                    minWidth: 0,
                    position: "relative",
                    overflow: "hidden",
                    ...(isLarge
                      ? { gridColumn: "span 2", gridRow: "span 2" }
                      : {}),
                  }}
                >
                  {/* 日付ラベル（大きいカードのみ） */}
                  {isLarge && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "16px 6px 5px",
                        background:
                          "linear-gradient(transparent, rgba(0,0,0,0.65))",
                        fontSize: 9,
                        color: "rgba(255,255,255,0.85)",
                        fontWeight: 500,
                      }}
                    >
                      {formatDate(entry)}
                    </div>
                  )}
                  {/* 異変マーカー */}
                  {entry.hasAnomaly && (
                    <div
                      style={{
                        position: "absolute",
                        top: 3,
                        right: 3,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "rgba(100,180,255,0.95)",
                        boxShadow: "0 0 4px rgba(100,180,255,0.6)",
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* フッタータブ */}
        <div
          style={{
            height: 56,
            background: "rgba(18,18,18,0.95)",
            backdropFilter: "blur(12px)",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
            zIndex: 5,
            paddingBottom: 4,
          }}
        >
          {[
            { emoji: "📅", label: ja ? "年別" : "Years" },
            { emoji: "🗓", label: ja ? "月別" : "Months" },
            { emoji: "📋", label: ja ? "日別" : "Days" },
            { emoji: "🖼", label: ja ? "すべて" : "All", active: true },
          ].map((tab) => (
            <div
              key={tab.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontSize: 10,
                color: tab.active ? "#007aff" : "#636366",
                cursor: "pointer",
                gap: 1,
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.emoji}</span>
              <span>{tab.label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes rollModalIn {
          0%   { transform: scale(0.82) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
