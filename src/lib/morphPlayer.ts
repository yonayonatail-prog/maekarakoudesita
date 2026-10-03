/**
 * morphPlayer — モーフターゲットのGSAPトゥイーンロジック
 * §13 モーフ制御（共有ライブラリ）
 *
 * 本番（ゲームロジック）とエディタの両方で使用される
 */

export interface MorphKeyframe {
  /** 時間（正規化 0〜1） */
  time: number;
  /** モーフターゲットごとのウェイト（0〜1） */
  weights: Record<string, number>;
  /** イージング（GSAP形式） */
  easing?: string;
}

export interface MorphClip {
  /** クリップ名 */
  name: string;
  /** ループするか */
  loop: boolean;
  /** 全体の持続時間（秒） */
  duration: number;
  /** キーフレーム配列（time順にソートされていること） */
  keyframes: MorphKeyframe[];
}

/**
 * キーフレームからGSAPトゥイーン設定を生成する。
 * 0→0.5→1.0 のようにキーフレーム間を補間する。
 *
 * エディタではGSAPのグローバルタイムラインが停止されているため、
 * 呼び出し側で進捗を手動シークする必要がある。
 */
export function buildMorphTimeline(
  clip: MorphClip,
  target: Record<string, number>
): gsap.core.Timeline {
  const tl = window.gsap.timeline({ paused: true });

  if (clip.keyframes.length === 0) return tl;

  const kfs = [...clip.keyframes].sort((a, b) => a.time - b.time);

  for (let i = 0; i < kfs.length; i++) {
    const from = kfs[i];
    const to = kfs[i + 1];

    const segDuration = to
      ? (to.time - from.time) * clip.duration
      : (1 - from.time) * clip.duration;

    const tweenTarget: Record<string, number> = {};
    const allKeys = new Set([
      ...Object.keys(from.weights),
      ...(to ? Object.keys(to.weights) : []),
    ]);

    for (const key of allKeys) {
      tweenTarget[key] = to ? to.weights[key] ?? 0 : from.weights[key];
    }

    const tween: gsap.TweenVars = {
      ...tweenTarget,
      duration: segDuration,
      ease: from.easing ?? "linear",
    };

    // 最初のキーフレームは set、それ以降は to
    if (i === 0) {
      for (const key of allKeys) {
        target[key] = from.weights[key] ?? 0;
      }
      if (to) {
        tl.to(target, tween);
      }
    } else {
      tl.to(target, tween);
    }
  }

  return tl;
}

/**
 * 特定のモーフ名に対するZファイティング対策用の微調整値
 * 顔パーツ（目・口など）が重なるときに Z 位置をわずかにずらす
 */
export function getZMorphOffset(morphName: string): number {
  const offsets: Record<string, number> = {
    eye: 0.001,
    eye_L: 0.001,
    eye_R: 0.001,
    mouth: 0.002,
    eyebrow: 0.0005,
    eyelid: 0.0015,
  };

  for (const [key, offset] of Object.entries(offsets)) {
    if (morphName.toLowerCase().includes(key)) return offset;
  }

  return 0;
}

/** モーフ名の正規化（大文字小文字 + 末尾の数値マージ） */
export function normalizeMorphName(name: string): string {
  return name.trim().toLowerCase();
}