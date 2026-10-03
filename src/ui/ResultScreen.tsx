import { useMemo, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { WORLD_OBJECTS } from "../data/worldObjects";
import { CHECKPOINTS, TOTAL_CHECKPOINTS } from "../data/checkpoints";
import type { EndingId } from "../types";

const LOCATION_LABELS: Record<string, string> = {
  dental_bus_stop: "水科歯科前バス停",
};

// =============================================================
// ResultScreen
// リザルト画面のUIオーバーレイ（ResultScene の上に重ねる）
// 右側グラデーションパネルにエンディング種別・統計・本文を表示。
// =============================================================

const ENDINGS: Record<EndingId, { titleJa: string; bodyJa: string; color: string; tagline: string }> = {
  TRUE: {
    titleJa: "TRUE END — 勝利の中の喪失",
    bodyJa:
      "犬歯の傷跡で水科を逮捕した。謎は解けた。けれど15年、三海は戻らない。" +
      "片方だけのバーグルット。真っ白な看板。……やっぱり、小さくなってるんだ。分からない世界は、全部。",
    color: "#c8a85a",
    tagline: "それでも、記録し続けた。",
  },
  PARANOIA: {
    titleJa: "PARANOIA END — 観察しすぎの崩壊",
    bodyJa:
      "木も道路も人の身長も空の色も、すべてが変わって見える。" +
      "最後、鏡の中の自分に……誰？",
    color: "#8a3a3a",
    tagline: "鏡の向こうの男を、徹は知らない。",
  },
  BAD: {
    titleJa: "BAD END — 観察しなさすぎの順応",
    bodyJa:
      "徹は世界へ完全に順応した。ニュースに映る犯人（自分の顔）を見ても、" +
      "『ああ、この犯人か』と思う。本人の認知すらデータに上書きされて終了。",
    color: "#555",
    tagline: "前からこうでした。",
  },
  NORMAL: {
    titleJa: "NORMAL END — 勝ち逃げ",
    bodyJa:
      "証拠が弱く、誰も信じない。数年後、新たな連続殺人。" +
      "似顔絵は少しだけ別の誰かに。システムは次の標的へ移行する。",
    color: "#5a6a7a",
    tagline: "世界は、書き換えを続ける。",
  },
  PATROL: {
    titleJa: "パトルーエンド — 囲いの失敗",
    bodyJa:
      "白昼夢を現実と誤認して水科歯科へ吸い込まれた。" +
      "プレイヤーは『捕食』へ学習する。",
    color: "#6a3a5a",
    tagline: "罠だと気づいた時、扉は閉まっていた。",
  },
};

function determineEnding(args: {
  recordedRatio: number;
  resistantCount: number;
  cognition: number;
  truePathCount: number;
}): EndingId {
  const { recordedRatio, resistantCount, cognition, truePathCount } = args;
  if (cognition <= 0) return "PARANOIA";
  if (recordedRatio >= 0.85 && resistantCount >= 1 && truePathCount >= 2) return "TRUE";
  if (recordedRatio <= 0.2) return "BAD";
  return "NORMAL";
}

// 統計バッジ
function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div style={{ fontSize: 9, letterSpacing: 3, color: "#505870", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 300, color: "#b0b8cc", letterSpacing: 1 }}>
        {value}
      </div>
    </div>
  );
}

export function ResultScreen() {
  const worldObjects = useGameStore((s) => s.worldObjects);
  const cognition = useGameStore((s) => s.cognitionLevel);
  const endingFlags = useGameStore((s) => s.endingFlags);
  const cameraRoll = useGameStore((s) => s.cameraRoll);
  const currentCheckpoint = useGameStore((s) => s.currentCheckpoint);
  const unlockedLocations = useGameStore((s) => s.unlockedLocations);
  const resetGame = useGameStore((s) => s.resetGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const saveGame = useGameStore((s) => s.saveGame);
  const [saved, setSaved] = useState(false);

  // この年に存在したオブジェクトと記録状況
  const cp = CHECKPOINTS[currentCheckpoint];
  const thisYearObjects = useMemo(() => cp.worldObjectIds.map((id) => {
    const obj = worldObjects[id];
    return {
      id,
      label: obj?.label ?? id,
      recorded: obj?.isRecorded ?? false,
      resistant: obj?.isResistant ?? false,
      unlocksLocation: obj?.unlocksLocation,
    };
  }), [cp.worldObjectIds, worldObjects]);

  const isFinalYear = currentCheckpoint + 1 >= TOTAL_CHECKPOINTS;
  const yearNumber = currentCheckpoint + 1; // 1-indexed

  const handleSave = () => {
    saveGame();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const endingId = useMemo<EndingId>(() => {
    const total = WORLD_OBJECTS.length;
    const objs = Object.values(worldObjects);
    const recorded = objs.filter((o) => o.isRecorded).length;
    const resistant = objs.filter((o) => o.isResistant).length;
    const truePathCount = endingFlags.filter((f) => f === "TRUE_PATH").length;
    return determineEnding({
      recordedRatio: total > 0 ? recorded / total : 0,
      resistantCount: resistant,
      cognition,
      truePathCount,
    });
  }, [worldObjects, cognition, endingFlags]);

  const ending = ENDINGS[endingId];
  const recordedCount = Object.values(worldObjects).filter((o) => o.isRecorded).length;
  const totalCount = WORLD_OBJECTS.length;
  const photoCount = cameraRoll.length;

  return (
    <div
      className="fade-in"
      style={{
        position: "absolute",
        inset: 0,
        // 左側は透過して ResultScene（徹＋鏡）を見せ、右寄りに暗くする
        background: "linear-gradient(to right, transparent 30%, rgba(4,5,12,0.88) 58%, rgba(4,5,12,0.97) 78%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 5vw",
      }}
    >
      <div
        style={{
          maxWidth: 400,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* 年次プログレス */}
        <div>
          <div style={{ fontSize: 10, letterSpacing: 6, color: "#384050", textTransform: "uppercase", marginBottom: 8 }}>
            {isFinalYear ? "Final Result" : "Result"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 13, color: "rgba(190,200,215,0.6)", letterSpacing: 1 }}>
              {yearNumber} / {TOTAL_CHECKPOINTS} 年目
            </div>
            <div style={{ flex: 1, height: 2, background: "#1a2030", borderRadius: 1 }}>
              <div style={{
                height: "100%",
                width: `${(yearNumber / TOTAL_CHECKPOINTS) * 100}%`,
                background: isFinalYear ? ending.color : "rgba(100,130,180,0.7)",
                borderRadius: 1,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        </div>

        {/* エンディング種別タイトル・本文（最終年のみ） */}
        {isFinalYear && (
          <>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                letterSpacing: 2,
                lineHeight: 1.45,
                color: ending.color,
                textShadow: `0 0 24px ${ending.color}55`,
              }}
            >
              {ending.titleJa}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 2.0,
                color: "rgba(200,208,220,0.85)",
              }}
            >
              {ending.bodyJa}
            </p>
          </>
        )}

        {/* この年の記録リスト */}
        <div style={{ borderTop: "1px solid rgba(80,90,110,0.35)", paddingTop: 16 }}>
          <div style={{ fontSize: 9, letterSpacing: 4, color: "#384050", textTransform: "uppercase", marginBottom: 10 }}>
            この年の記録
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {thisYearObjects.map(({ id, label, recorded, resistant, unlocksLocation: ul }) => {
              const unlocked = ul && unlockedLocations.includes(ul);
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* 記録状態アイコン */}
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10,
                    background: recorded
                      ? resistant ? "rgba(200,168,90,0.25)" : "rgba(60,120,90,0.25)"
                      : "rgba(60,40,40,0.4)",
                    border: `1px solid ${recorded ? (resistant ? "#c8a85a" : "#3a8a5a") : "rgba(100,60,60,0.5)"}`,
                  }}>
                    {recorded ? (resistant ? "★" : "✓") : "✗"}
                  </div>
                  {/* ラベル */}
                  <div style={{
                    fontSize: 12,
                    color: recorded ? "rgba(200,215,200,0.9)" : "rgba(120,110,110,0.7)",
                    flex: 1,
                    letterSpacing: 0.5,
                  }}>
                    {label}
                  </div>
                  {/* 解放バッジ */}
                  {unlocked && (
                    <div style={{
                      fontSize: 9, letterSpacing: 1, padding: "2px 6px",
                      background: "rgba(80,130,200,0.2)",
                      border: "1px solid rgba(80,130,200,0.5)",
                      borderRadius: 2, color: "rgba(140,180,240,0.9)",
                      whiteSpace: "nowrap",
                    }}>
                      🔓 {LOCATION_LABELS[ul!] ?? ul}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 統計バー（常時表示） */}
        <div style={{ display: "flex", gap: 28 }}>
          <StatBadge label="Anomalies" value={`${recordedCount}/${totalCount}`} />
          <StatBadge label="Cognition" value={`${cognition}%`} />
          <StatBadge label="Photos" value={String(photoCount)} />
        </div>

        {/* タグライン（最終年のみ） */}
        {isFinalYear && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontStyle: "italic",
              color: "rgba(150,160,180,0.45)",
              lineHeight: 1.6,
            }}
          >
            "{ending.tagline}"
          </p>
        )}

        {/* ボタン群 */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {!isFinalYear && (
            <button
              onClick={continueGame}
              style={{
                marginTop: 6,
                padding: "11px 0",
                width: 180,
                fontSize: 13,
                background: `rgba(${ending.color === "#c8a85a" ? "200,168,90" : "100,130,180"},0.15)`,
                color: "var(--paper)",
                border: "1px solid var(--accent)",
                borderRadius: 2,
                letterSpacing: 4,
                cursor: "pointer",
                transition: "all 0.25s",
              }}
            >
              次の年へ ▶
            </button>
          )}
          <button
            onClick={handleSave}
            style={{
              marginTop: 6,
              padding: "11px 0",
              width: 180,
              fontSize: 13,
              background: saved ? "rgba(80,160,100,0.18)" : "transparent",
              color: saved ? "rgba(120,210,140,0.9)" : "rgba(190,200,215,0.85)",
              border: `1px solid ${saved ? "rgba(80,160,100,0.6)" : "rgba(100,110,130,0.5)"}`,
              borderRadius: 2,
              letterSpacing: 5,
              cursor: "pointer",
              transition: "all 0.25s",
            }}
          >
            {saved ? "セーブ完了" : "セーブ"}
          </button>
          <button
            onClick={resetGame}
            style={{
              marginTop: 6,
              padding: "11px 0",
              width: 180,
              fontSize: 13,
              background: "transparent",
              color: "rgba(190,200,215,0.85)",
              border: "1px solid rgba(100,110,130,0.5)",
              borderRadius: 2,
              letterSpacing: 5,
              cursor: "pointer",
              transition: "border-color 0.25s, color 0.25s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = ending.color;
              (e.currentTarget as HTMLButtonElement).style.color = ending.color;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(100,110,130,0.5)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(190,200,215,0.85)";
            }}
          >
            タイトルへ
          </button>
        </div>
      </div>
    </div>
  );
}
