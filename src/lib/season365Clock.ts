// =============================================================
// season365Clock — 365日高速世界の「共有時計」
//
// 空・雲（useSeason365System）と街の桜並木（SakuraTree）が同じ
// uCurrentDay / uTime を参照するための単一の真実源。ShaderMaterial の
// uniform にはこの { value } オブジェクトをそのまま渡す（同一参照なので
// 毎フレーム自動で最新値が読まれる）。
//
// 進行はどこか1箇所からのみ行う（useSeason365System の useFrame が担当）。
// replay モードでない間は誰も advance しないため、値は凍結される。
// =============================================================

/**
 * 世界の開始日（0〜365）。夏（新緑）スタート。
 * 桜シェーダーで葉が完全な緑になるのは day 120〜150。通常時間の世界
 * （before フェーズ）は時計が凍結されるため、この値がそのまま木の色になる。
 * 高速世界（replay）もこの日から進み始める。
 */
export const SEASON_START_DAY = 125;

/** uCurrentDay（0〜365）。全季節シェーダー共有。夏始まり。 */
export const seasonDayUniform = { value: SEASON_START_DAY };

/** uTime（経過秒）。風の揺れ・パーティクル駆動用。 */
export const seasonTimeUniform = { value: 0 };

/** 高速世界の進行速度（日/秒）。 */
export const SEASON_DAYS_PER_SEC = 60;

/**
 * 共有時計を1フレーム分進める。1フレームにつき1回だけ呼ぶこと
 * （useSeason365System が唯一の呼び出し元）。
 */
export function advanceSeasonClock(delta: number): void {
  seasonDayUniform.value = (seasonDayUniform.value + delta * SEASON_DAYS_PER_SEC) % 365;
  seasonTimeUniform.value += delta;
}
