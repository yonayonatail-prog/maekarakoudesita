import type { Checkpoint } from "../types";

// =============================================================
// チェックポイント定義 — 15年分（2019〜2033）
// 1年に1回の年次タイムリープ設計。
// startDateLabel = 探索（記憶）フェーズ開始の表示日時
// year / month   = 高速再生の観測終点（翌年7月）
// =============================================================

const DEFAULT_WORLD_OBJECT_IDS = [
  "country_maam_size",
  "dental_sign_face",
  "jk_skirt_length",
  "conbini_stock",
  "pedestrian_count",
];

interface YearSeed {
  headline: string;
  worldObjectIds?: string[];
}

const YEAR_SEEDS: YearSeed[] = [
  // CP0: 2019年 → 2020年を観測
  { headline: "ベランダ商店街で連続殺人。被害者の一人が鈴代三海さん。" },
  // CP1: 2020年 → 2021年を観測
  { headline: "マスク社会の到来。容疑者の似顔絵が公開されるも、逮捕に至らず。" },
  // CP2: 2021年 → 2022年を観測
  { headline: "ワクチン接種が進むなか、似顔絵が「微妙に変わった」との声。気のせいか。" },
  // CP3: 2022年 → 2023年を観測（コンビニ→チョコザップ転換年・ポストマン出現）
  { headline: "物価上昇、円安。水科歯科の看板は今日も変わらず笑っている。" },
  // CP4: 2023年 → 2024年を観測
  { headline: "駅前コンビニがフィットネスに転換。マスクが外れ、顔が見えてきた街で。" },
  // CP5: 2024年 → 2025年を観測
  { headline: "AIが生成した顔写真と、あの似顔絵が区別できなくなった。" },
  // CP6: 2025年 → 2026年を観測
  { headline: "第二の事件か。水科歯科は今も営業中。" },
  // CP7: 2026年 → 2027年を観測
  { headline: "歯医者の看板、院長の顔が新しくなった。よく見ると……前から？" },
  // CP8: 2027年 → 2028年を観測
  { headline: "街の再開発。昔の地図と今の地図が、少しだけ合わなくなった。" },
  // CP9: 2028年 → 2029年を観測
  { headline: "徹、35歳。鏡を見る回数が増えた気がする。" },
  // CP10: 2029年 → 2030年を観測
  { headline: "防犯カメラが大幅に増えた。顔認識システムの導入。" },
  // CP11: 2030年 → 2031年を観測
  { headline: "水科歯科、リニューアル工事。一時閉院。" },
  // CP12: 2031年 → 2032年を観測
  { headline: "新しい看板が立った。院長の顔は、少し若返っていた。" },
  // CP13: 2032年 → 2033年を観測
  { headline: "三海の命日。供花が、誰かによって買われている。" },
  // CP14: 2033年 → 2034年を観測（最終年）
  { headline: "事件から15年。未解決のまま、時効まで残りわずか。" },
];

export function generateCheckpoints(): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];

  for (let id = 0; id < YEAR_SEEDS.length; id++) {
    const seed = YEAR_SEEDS[id];
    const startYear = 2019 + id;
    const startDateLabel = id === 0 ? "2019年7月7日 10:00" : `${startYear}年7月 10:00`;

    const observeYear = startYear + 1;
    const age = 26 + id;

    let actNumber: 1 | 2 | 3 | 4 = 1;
    if (id >= 12) actNumber = 4;
    else if (id >= 8) actNumber = 3;
    else if (id >= 4) actNumber = 2;

    checkpoints.push({
      id,
      actNumber,
      year: observeYear,
      month: 7,
      age,
      timeLimit: 420,
      worldObjectIds: seed.worldObjectIds ?? DEFAULT_WORLD_OBJECT_IDS,
      newsEvents: [{ id: `news_${id}`, headline: seed.headline }],
      isDentalVisit: true,
      startDateLabel,
    });
  }

  return checkpoints;
}

export const CHECKPOINTS: Checkpoint[] = generateCheckpoints();
export const TOTAL_CHECKPOINTS = CHECKPOINTS.length; // 15
