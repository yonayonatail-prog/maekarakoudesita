import { useMemo, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { WORLD_OBJECTS } from "../data/worldObjects";
import { CreditsRoll } from "./CreditsRoll";
import type { EndingId } from "../types";

// =============================================================
// エンディング画面（仕様 §6 / §13 マルチエンディング）
// 記録総量・認知レベル・TRUE フラグからエンドを決定する。
// =============================================================

const ENDINGS: Record<EndingId, { titleJa: string; titleEn: string; bodyJa: string; color: string }> = {
  TRUE: {
    titleJa: "TRUE END — 勝利の中の喪失",
    titleEn: "TRUE END — Loss Within Victory",
    bodyJa:
      "犬歯の傷跡で水科を逮捕した。謎は解けた。けれど15年、三海は戻らない。" +
      "片方だけのバーグルット。真っ白な看板。……やっぱり、小さくなってるんだ。分からない世界は、全部。",
    color: "#c8a85a",
  },
  PARANOIA: {
    titleJa: "PARANOIA END — 観察しすぎの崩壊",
    titleEn: "PARANOIA END — Collapse of the Watcher",
    bodyJa:
      "木も道路も人の身長も空の色も、すべてが変わって見える。" +
      "最後、鏡の中の自分に……誰？",
    color: "#7a3a3a",
  },
  BAD: {
    titleJa: "BAD END — 観察しなさすぎの順応",
    titleEn: "BAD END — Surrender",
    bodyJa:
      "徹は世界へ完全に順応した。ニュースに映る犯人（自分の顔）を見ても、" +
      "『ああ、この犯人か』と思う。本人の認知すらデータに上書きされて終了。",
    color: "#444",
  },
  NORMAL: {
    titleJa: "NORMAL END — 勝ち逃げ",
    titleEn: "NORMAL END — Inconclusive",
    bodyJa:
      "証拠が弱く、誰も信じない。数年後、新たな連続殺人。" +
      "似顔絵は少しだけ別の誰かに。システムは次の標的へ移行する。",
    color: "#5a6a7a",
  },
  PATROL: {
    titleJa: "パトルーエンド — 囲いの失敗",
    titleEn: "PATROL END — The Folly of Caging",
    bodyJa:
      "白昼夢を現実と誤認して水科歯科へ吸い込まれた。" +
      "プレイヤーは『捕食』へ学習する。",
    color: "#6a3a5a",
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

export function EndingScreen() {
  const ja = useGameStore((s) => s.language) === "ja";
  const worldObjects = useGameStore((s) => s.worldObjects);
  const cognition = useGameStore((s) => s.cognitionLevel);
  const endingFlags = useGameStore((s) => s.endingFlags);
  const resetGame = useGameStore((s) => s.resetGame);
  const [showCredits, setShowCredits] = useState(false);

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

  if (showCredits) {
    return <CreditsRoll onClose={resetGame} />;
  }

  return (
    <div
      className="fade-in"
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(5,5,5,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        textAlign: "center",
        gap: 22,
      }}
    >
      <h1 style={{ color: ending.color, margin: 0, fontSize: 32, letterSpacing: 3 }}>
        {ja ? ending.titleJa : ending.titleEn}
      </h1>
      <p style={{ maxWidth: 560, lineHeight: 1.9, opacity: 0.9, fontSize: 15 }}>
        {ending.bodyJa}
      </p>
      <p style={{ opacity: 0.5, fontSize: 13, fontStyle: "italic" }}>
        {ja
          ? "「“小さくなった”と言い続けることだけが、彼女がいた証明だった。」"
          : "\"To keep saying it shrank was the only proof she ever existed.\""}
      </p>
      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
        <button
          onClick={() => setShowCredits(true)}
          style={{
            padding: "12px 32px",
            fontSize: 14,
            background: "transparent",
            color: "var(--paper)",
            border: "1px solid rgba(216,212,200,0.35)",
            borderRadius: 2,
            letterSpacing: 3,
          }}
        >
          {ja ? "スタッフロール" : "STAFF ROLL"}
        </button>
        <button
          onClick={resetGame}
          style={{
            padding: "12px 40px",
            fontSize: 16,
            background: "transparent",
            color: "var(--paper)",
            border: "1px solid var(--accent)",
            borderRadius: 2,
            letterSpacing: 4,
          }}
        >
          {ja ? "タイトルへ" : "TO TITLE"}
        </button>
      </div>
    </div>
  );
}
