/**
 * timelinePlayer — キーフレーム変換ロジック
 * §13 モーフ制御（共有ライブラリ）
 *
 * タイムライン形式のデータをモーフクリップ形式に変換する
 */

import type { MorphKeyframe, MorphClip } from "./morphPlayer";

/** タイムラインのキーフレーム定義（JSONインポート用） */
export interface TimelineKeyframe {
  /** 時間（秒） */
  time: number;
  /** 値 */
  value: number;
  /** イージング */
  easing?: string;
}

/** 1トラック = 1モーフターゲットの時系列データ */
export interface TimelineTrack {
  /** モーフターゲット名 */
  morphName: string;
  /** キーフレーム配列 */
  keyframes: TimelineKeyframe[];
}

/** タイムライン全体 */
export interface TimelineData {
  /** クリップ名 */
  name: string;
  /** 全体の持続時間（秒） */
  duration: number;
  /** ループするか */
  loop: boolean;
  /** 全トラック */
  tracks: TimelineTrack[];
}

/**
 * タイムラインデータをMorphClipに変換する
 *
 * 各トラックのキーフレームを time でマージし、
 * 統合されたキーフレーム配列を生成する
 */
export function timelineToMorphClip(data: TimelineData): MorphClip {
  // 全キーフレームの時刻を収集（重複除去）
  const timeSet = new Set<number>();
  for (const track of data.tracks) {
    for (const kf of track.keyframes) {
      timeSet.add(kf.time);
    }
  }

  // 時刻順にソート
  const times = [...timeSet].sort((a, b) => a - b);

  // 各時刻における全モーフのウェイトを補間で計算
  const keyframes: MorphKeyframe[] = times.map((t) => {
    const weights: Record<string, number> = {};

    for (const track of data.tracks) {
      const value = interpolateTrack(track.keyframes, t);
      weights[track.morphName] = value;
    }

    // 正規化時間
    const normalizedTime = data.duration > 0 ? t / data.duration : 0;

    return {
      time: normalizedTime,
      weights,
      easing: "linear",
    };
  });

  return {
    name: data.name,
    loop: data.loop,
    duration: data.duration,
    keyframes,
  };
}

/**
 * トラックのキーフレームから指定時刻の値を線形補間で取得
 */
function interpolateTrack(
  keyframes: TimelineKeyframe[],
  time: number
): number {
  if (keyframes.length === 0) return 0;

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // 時刻より前の最後のキーフレームを探す
  if (time <= sorted[0].time) return sorted[0].value;
  if (time >= sorted[sorted.length - 1].time)
    return sorted[sorted.length - 1].value;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (time >= a.time && time <= b.time) {
      const t = (time - a.time) / (b.time - a.time);
      return a.value + (b.value - a.value) * t;
    }
  }

  return 0;
}

/**
 * 空のタイムラインデータを作成する
 */
export function createEmptyTimeline(name: string, duration: number): TimelineData {
  return {
    name,
    duration,
    loop: false,
    tracks: [],
  };
}

/**
 * タイムラインデータにトラックを追加する
 */
export function addTrackToTimeline(
  timeline: TimelineData,
  morphName: string
): TimelineData {
  if (timeline.tracks.some((t) => t.morphName === morphName)) return timeline;

  return {
    ...timeline,
    tracks: [
      ...timeline.tracks,
      {
        morphName,
        keyframes: [
          { time: 0, value: 0 },
          { time: timeline.duration, value: 1 },
        ],
      },
    ],
  };
}