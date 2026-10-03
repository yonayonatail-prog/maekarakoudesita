import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { audioManager } from '../lib/audioManager';
import { getScenarioById } from '../data/novelScenario';

// =============================================================
// useAudio — BGM・SE・ボイスをストア状態に同期するフック
// App.tsx のルートでマウントし、アプリ全体で常時有効にする。
// =============================================================

export function useAudio() {
  const bgmId          = useGameStore((s) => s.novelVisualState.currentBgmId);
  const currentVoiceUrl = useGameStore((s) => s.currentVoiceUrl);
  const scenarioId     = useGameStore((s) => s.currentScenarioId);
  const stepIndex      = useGameStore((s) => s.currentStepIndex);

  const prevBgmId = useRef<string | null>(null);

  // ── BGM 制御 ──────────────────────────────────────────────
  useEffect(() => {
    if (bgmId === prevBgmId.current) return;
    prevBgmId.current = bgmId;

    if (!bgmId) {
      audioManager.stopBgm();
      return;
    }

    // TRANSITION イベントにフェード時間が指定されていれば尊重する
    let fadeMs = 800;
    const state    = useGameStore.getState();
    const scenario = getScenarioById(state.currentScenarioId);
    const step     = scenario?.steps[state.currentStepIndex];
    const transEv  = step?.events?.find(
      (e) => e.type === 'TRANSITION' && e.target === 'bgm' && e.payload?.bgmId === bgmId
    );
    if (transEv?.timing?.duration) {
      fadeMs = transEv.timing.duration * 1000;
    }

    audioManager.playBgm(bgmId, fadeMs);
  }, [bgmId]);

  // ── Voice 制御 ────────────────────────────────────────────
  useEffect(() => {
    if (currentVoiceUrl) {
      audioManager.playVoice(currentVoiceUrl);
    } else {
      audioManager.stopVoice();
    }
  }, [currentVoiceUrl]);

  // ── SE イベント（ステップ変化ごとに発火） ──────────────────
  useEffect(() => {
    if (!scenarioId) return;
    const scenario = getScenarioById(scenarioId);
    if (!scenario) return;
    const step = scenario.steps[stepIndex];
    if (!step?.events?.length) return;

    const timers: number[] = [];

    for (const ev of step.events) {
      if (ev.type !== 'PLAY_SE') continue;
      const seId  = ev.payload?.seId as string | undefined;
      if (!seId) continue;
      const delay = (ev.timing?.startAt ?? 0) * 1000;
      const id    = window.setTimeout(() => audioManager.playSe(seId), delay);
      timers.push(id);
    }

    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [scenarioId, stepIndex]);
}
