import { useEffect, useState } from "react";
import type {
  CharacterPartsManifest,
  PartAsset,
  PartSlot,
  PortraitState,
} from "../types";

// =============================================================
// faceParts — 福笑い方式 顔ワイプのマニフェスト読込とステート解決
// マニフェスト: public/characters/{charId}/parts.json
// 座標規約: PartAsset.x / .y はベース顔画像ピクセル座標で、
//           パーツ画像の左上角（赤十字ピボット）を置く位置。
// =============================================================

/** 各スロットの解決済みステート名（undefined = そのスロットは非表示） */
export interface ResolvedParts {
  brow?:  string;
  eye?:   string;
  mouth?: string;
  other:  string[];
}

/**
 * PortraitState とマニフェストから、表示すべきパーツステートを解決する。
 * 優先順位: 個別上書き（eyeState 等）＞ presets[expression] ＞ 非表示
 */
export function resolvePartStates(
  portrait: PortraitState,
  manifest: CharacterPartsManifest,
): ResolvedParts {
  const preset = manifest.presets?.[portrait.expression] ?? {};
  return {
    brow:  portrait.browState  ?? preset.brow,
    eye:   portrait.eyeState   ?? preset.eye,
    mouth: portrait.mouthState ?? preset.mouth,
    other: portrait.otherStates ?? preset.other ?? [],
  };
}

/** 解決済みステートからアセット定義を引く（未定義ステートは null） */
export function lookupPartAsset(
  manifest: CharacterPartsManifest,
  slot: PartSlot,
  state: string | undefined,
): PartAsset | null {
  if (!state) return null;
  return manifest.parts[slot]?.[state] ?? null;
}

/** 動画 src をフルパスへ解決（"/"始まりは public 直下、それ以外はキャラ相対） */
export function resolveCharacterAssetPath(characterId: string, src: string): string {
  return src.startsWith("/") ? src : `/characters/${characterId}/${src}`;
}

// ──────────────────────────────────────────────────────────────
// マニフェストの取得（モジュールレベルキャッシュ・404はnull）
// ──────────────────────────────────────────────────────────────
const manifestCache = new Map<string, CharacterPartsManifest | null>();
const manifestPending = new Map<string, Promise<CharacterPartsManifest | null>>();

export function fetchPartsManifest(
  characterId: string,
): Promise<CharacterPartsManifest | null> {
  if (manifestCache.has(characterId)) {
    return Promise.resolve(manifestCache.get(characterId) ?? null);
  }
  const pending = manifestPending.get(characterId);
  if (pending) return pending;

  const promise = fetch(`/characters/${characterId}/parts.json`)
    .then((res) => (res.ok ? (res.json() as Promise<CharacterPartsManifest>) : null))
    .catch(() => null)
    .then((manifest) => {
      manifestCache.set(characterId, manifest);
      manifestPending.delete(characterId);
      return manifest;
    });
  manifestPending.set(characterId, promise);
  return promise;
}

/** テスト用: キャッシュ破棄 */
export function clearPartsManifestCache(): void {
  manifestCache.clear();
  manifestPending.clear();
}

/**
 * キャラクターのパーツマニフェストを取得するフック。
 * 読込中・マニフェスト無しはどちらも null（呼び出し側は旧方式へフォールバック）。
 */
export function usePartsManifest(characterId: string): CharacterPartsManifest | null {
  const [manifest, setManifest] = useState<CharacterPartsManifest | null>(
    () => manifestCache.get(characterId) ?? null,
  );

  useEffect(() => {
    let alive = true;
    if (manifestCache.has(characterId)) {
      setManifest(manifestCache.get(characterId) ?? null);
      return;
    }
    fetchPartsManifest(characterId).then((m) => {
      if (alive) setManifest(m);
    });
    return () => {
      alive = false;
    };
  }, [characterId]);

  return manifest;
}
