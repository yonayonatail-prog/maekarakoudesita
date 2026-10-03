import { useSeason365System } from "../lib/hooks/useSeason365System";
import { useGameStore } from "../store/gameStore";

/**
 * 365日高速世界のシェーダーシステム
 * replayモード時に、空、雲、季節変化を管理
 */
export function Season365System() {
  const explorationMode = useGameStore((s) => s.explorationMode);
  const isEnabled = explorationMode === "replay";

  useSeason365System(isEnabled);

  return null;
}
