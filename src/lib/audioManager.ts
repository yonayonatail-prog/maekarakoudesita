// =============================================================
// AudioManager — BGM・SE・ボイス 統合オーディオ管理
// 配置規約:
//   BGM   → public/audio/bgm/{id}.mp3
//   SE    → public/audio/se/{id}.mp3
//   Voice → public/audio/voice/{filename}  (voiceUrl がパス付きなら優先)
// =============================================================

const BGM_PATH   = (id: string)  => `/audio/bgm/${id}.mp3`;
const SE_PATH    = (id: string)  => `/audio/se/${id}.mp3`;
const VOICE_PATH = (url: string) =>
  url.startsWith('/') || url.startsWith('http') ? url : `/audio/voice/${url}`;

class AudioManager {
  private bgm: HTMLAudioElement | null = null;
  private bgmId: string | null = null;
  private voice: HTMLAudioElement | null = null;

  private bgmVolume = 0.7;
  private seVolume  = 0.85;

  // ── BGM ──────────────────────────────────────────────────────

  playBgm(id: string, fadeMs = 800): void {
    if (this.bgmId === id) return;

    const prev = this.bgm;

    const el = new Audio(BGM_PATH(id));
    el.loop   = true;
    el.volume = 0;
    el.play().catch(() => {}); // autoplay 拒否は握り潰す

    this.ramp(el, 0, this.bgmVolume, fadeMs);

    if (prev) {
      const fromVol = prev.volume;
      this.ramp(prev, fromVol, 0, fadeMs, () => {
        prev.pause();
        prev.src = '';
      });
    }

    this.bgm   = el;
    this.bgmId = id;
  }

  stopBgm(fadeMs = 800): void {
    if (!this.bgm) return;
    const el = this.bgm;
    this.ramp(el, el.volume, 0, fadeMs, () => {
      el.pause();
      el.src = '';
    });
    this.bgm   = null;
    this.bgmId = null;
  }

  getCurrentBgmId(): string | null {
    return this.bgmId;
  }

  // ── SE ───────────────────────────────────────────────────────

  playSe(id: string): void {
    const el = new Audio(SE_PATH(id));
    el.volume = this.seVolume;
    el.play().catch(() => {});
    el.addEventListener('ended', () => { el.src = ''; }, { once: true });
  }

  // ── Voice ────────────────────────────────────────────────────

  playVoice(urlOrName: string): void {
    this.stopVoice();
    const el = new Audio(VOICE_PATH(urlOrName));
    el.volume = 1.0;
    el.play().catch(() => {});
    this.voice = el;
  }

  stopVoice(): void {
    if (!this.voice) return;
    this.voice.pause();
    this.voice.src = '';
    this.voice = null;
  }

  // ── Volume ────────────────────────────────────────────────────

  setBgmVolume(vol: number): void {
    this.bgmVolume = clamp(vol);
    if (this.bgm) this.bgm.volume = this.bgmVolume;
  }

  setSeVolume(vol: number): void {
    this.seVolume = clamp(vol);
  }

  // ── Internal ──────────────────────────────────────────────────

  private ramp(
    el: HTMLAudioElement,
    from: number,
    to: number,
    ms: number,
    onDone?: () => void
  ): void {
    if (ms <= 0) {
      el.volume = clamp(to);
      onDone?.();
      return;
    }
    const steps = Math.ceil(ms / 16);
    const delta = (to - from) / steps;
    let step = 0;
    const id = window.setInterval(() => {
      step++;
      el.volume = clamp(from + delta * step);
      if (step >= steps) {
        clearInterval(id);
        el.volume = clamp(to);
        onDone?.();
      }
    }, 16);
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export const audioManager = new AudioManager();
