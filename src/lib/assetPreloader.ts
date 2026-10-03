// =============================================================
// assetPreloader — タイトル画面滞在中にゲーム本編のアセットを先読みする
//
// - GLB モデル: TitleScreen 内の <GlbPreloader>（useGLTF）が読み込み、
//   完了時に markGlbLoaded() を呼ぶ。drei / suspend-react のキャッシュに
//   パース済みの状態で載るため、シーンマウント時のロードが不要になる。
// - 画像・動画・JSON: startFetchPreload() が fetch でブラウザキャッシュを温める。
// - JS チャンク: startChunkPreload() が App.tsx の lazy() と同じ import()
//   指定子を呼び、three.js を含む重量級シーンのコードを事前にダウンロード・
//   評価してモジュールキャッシュへ載せる。これにより「探索」クリック時に
//   追加のダウンロード待ちが発生しない（フェード無しの遷移でも黒画面にならない）。
//
// 進捗はファイルサイズ相当の重み（≒KB/100）付きで 0〜1 に正規化し、
// 購読者へ通知する。モジュールレベルで状態を持つため、タイトル画面へ
// 戻ってきても再ロードは走らない。
// =============================================================

export interface PreloadAsset {
  url: string;
  weight: number;
}

// GLB は TitleScreen の GlbPreloader（useGLTF）経由でロードする
export const PRELOAD_GLB_ASSETS: PreloadAsset[] = [
  { url: "/data/models/merged/wall.glb", weight: 1 },
  { url: "/data/models/merged/wall_shelf_Balcony.glb", weight: 5 },
  { url: "/data/models/merged/balcony.glb", weight: 3 },
  { url: "/data/models/human/yukari_test4.glb", weight: 13 },
  { url: "/data/models/human/test_takamiya.glb", weight: 23 },
  { url: "/data/models/merged/sakura.glb", weight: 2 },
];

// fetch でキャッシュを温める静的アセット（ノベルパート・画像・動画）
const FETCH_ASSETS: PreloadAsset[] = [
  { url: "/characters/nanami/base/face.png", weight: 3 },
  { url: "/characters/nanami/parts.json", weight: 1 },
  { url: "/characters/nanami/parts/brow/angry.png", weight: 1 },
  { url: "/characters/nanami/parts/brow/normal.png", weight: 1 },
  { url: "/characters/nanami/parts/brow/smile.png", weight: 1 },
  { url: "/characters/nanami/parts/eye/closed.png", weight: 1 },
  { url: "/characters/nanami/parts/eye/normal.png", weight: 1 },
  { url: "/characters/nanami/parts/eye/smile.png", weight: 1 },
  { url: "/characters/nanami/parts/mouth/dissatisfaction.png", weight: 1 },
  { url: "/characters/nanami/parts/mouth/normal.png", weight: 1 },
  { url: "/characters/nanami/parts/mouth/smallOpen.png", weight: 1 },
  { url: "/characters/nanami/parts/mouth/smile.png", weight: 1 },
  { url: "/characters/nanami/parts/other/brush.png", weight: 1 },
  { url: "/characters/nanami/parts/other/sweat.png", weight: 1 },
  { url: "/characters/nanami/video/smile.webm", weight: 2 },
  { url: "/data/image/2.webp", weight: 1 },
  { url: "/data/image/3.webp", weight: 1 },
  { url: "/data/image/4.webp", weight: 1 },
  { url: "/data/image/5.webp", weight: 2 },
  { url: "/data/image/right_click.webp", weight: 1 },
];

// App.tsx の lazy() と同じ import 指定子（three.js を含む重量級チャンク）
interface ChunkAsset {
  name: string;
  weight: number;
  load: () => Promise<unknown>;
}
const CHUNK_ASSETS: ChunkAsset[] = [
  { name: "GameScene", weight: 8, load: () => import("../scene/GameScene") },
  { name: "ApartmentScene", weight: 8, load: () => import("../scene/ApartmentScene") },
  { name: "ConvenienceStoreScene", weight: 4, load: () => import("../scene/ConvenienceStoreScene") },
  { name: "DentalBusStopScene", weight: 4, load: () => import("../scene/DentalBusStopScene") },
  { name: "ResultScene", weight: 5, load: () => import("../scene/ResultScene") },
  { name: "NovelScene", weight: 5, load: () => import("../scene/NovelScene") },
  { name: "HUD", weight: 3, load: () => import("../ui/HUD") },
  { name: "EndingScreen", weight: 2, load: () => import("../ui/EndingScreen") },
  { name: "ResultScreen", weight: 2, load: () => import("../ui/ResultScreen") },
];

export interface PreloadState {
  /** 0〜1 の重み付き進捗 */
  progress: number;
  /** すべてのアセットが完了（失敗含む）したか */
  ready: boolean;
}

const TOTAL_COUNT = PRELOAD_GLB_ASSETS.length + FETCH_ASSETS.length + CHUNK_ASSETS.length;
const TOTAL_WEIGHT = [...PRELOAD_GLB_ASSETS, ...FETCH_ASSETS, ...CHUNK_ASSETS].reduce(
  (sum, a) => sum + a.weight,
  0,
);

let doneWeight = 0;
let doneCount = 0;
let fetchStarted = false;
let chunksStarted = false;
const finishedKeys = new Set<string>();
const listeners = new Set<(state: PreloadState) => void>();

// 開発時に「?slowload」を付けるとロードUIの確認用に人工遅延を入れる
const SLOW_LOAD =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).has("slowload");

function slowDelay(): Promise<void> {
  if (!SLOW_LOAD) return Promise.resolve();
  return new Promise((r) => setTimeout(r, 500 + Math.random() * 3500));
}

export function getPreloadState(): PreloadState {
  return {
    progress: TOTAL_WEIGHT === 0 ? 1 : doneWeight / TOTAL_WEIGHT,
    ready: doneCount >= TOTAL_COUNT,
  };
}

function finish(key: string, weight: number) {
  if (finishedKeys.has(key)) return;
  finishedKeys.add(key);
  doneWeight += weight;
  doneCount += 1;
  const state = getPreloadState();
  listeners.forEach((fn) => fn(state));
}

/** GLB を useGLTF で読み終えた（or 失敗した）ときに GlbPreloader から呼ぶ */
export function markGlbLoaded(url: string) {
  const asset = PRELOAD_GLB_ASSETS.find((a) => a.url === url);
  if (asset) slowDelay().then(() => finish(asset.url, asset.weight));
}

export function subscribePreload(fn: (state: PreloadState) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** fetch 系アセットの先読みを開始する（多重呼び出しは無視） */
export function startFetchPreload() {
  if (fetchStarted) return;
  fetchStarted = true;
  for (const asset of FETCH_ASSETS) {
    fetch(asset.url)
      .then((res) =>
        res.ok ? res.blob() : Promise.reject(new Error(`HTTP ${res.status}`)),
      )
      .catch((err) => {
        console.warn(`[assetPreloader] 先読み失敗: ${asset.url}`, err);
      })
      .then(slowDelay)
      .finally(() => finish(asset.url, asset.weight));
  }
}

/** シーン等の JS チャンクを先読みする（多重呼び出しは無視） */
export function startChunkPreload() {
  if (chunksStarted) return;
  chunksStarted = true;
  for (const asset of CHUNK_ASSETS) {
    asset
      .load()
      .catch((err) => {
        console.warn(`[assetPreloader] チャンク先読み失敗: ${asset.name}`, err);
      })
      .then(slowDelay)
      .finally(() => finish(asset.name, asset.weight));
  }
}
