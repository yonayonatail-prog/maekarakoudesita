import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { CHECKPOINTS, TOTAL_CHECKPOINTS } from "../data/checkpoints";
import { getFocusedObjectId, captureScreenshot } from "../scene/captureController";
import { getPhase } from "../scene/animloopRegistry";
import { getHoveredNpcLabel } from "../scene/npcRegistry";
import { AnomalyLogPanel } from "./AnomalyLogPanel";
import { CameraRollModal } from "./CameraRollModal";

// =============================================================
// 探索 HUD
// Fキー: 世界一時停止トグル
// カメラボタン: 停止中のみ有効。撮影→演出→「記録しました」（世界は停止継続、Fで手動再開）
// =============================================================

export function HUD() {
  const language = useGameStore((s) => s.language);
  const currentCheckpoint = useGameStore((s) => s.currentCheckpoint);
  const age = useGameStore((s) => s.age);
  const cognitionLevel = useGameStore((s) => s.cognitionLevel);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const worldPaused = useGameStore((s) => s.worldPaused);
  const toggleWorldPause = useGameStore((s) => s.toggleWorldPause);
  const addToCameraRoll = useGameStore((s) => s.addToCameraRoll);
  const advanceCheckpoint = useGameStore((s) => s.advanceCheckpoint);
  const cameraRollCount = useGameStore((s) => s.cameraRoll.length);
  const anomalyCount = useGameStore((s) => s.anomalyLog.length);
  const explorationMode = useGameStore((s) => s.explorationMode);
  const startReplay = useGameStore((s) => s.startReplay);

  const cp = CHECKPOINTS[currentCheckpoint];
  const ja = language === "ja";

  const cameraRoll = useGameStore((s) => s.cameraRoll);
  const lastPhoto = cameraRoll.length > 0 ? cameraRoll[cameraRoll.length - 1] : null;

  const [hudVisible, setHudVisible] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [showCameraRoll, setShowCameraRoll] = useState(false);
  const modalOpenRef = useRef(false);
  const canAdvanceRef = useRef(true);

  const enterCondition = cp.enterCondition;
  const canAdvance = !enterCondition ||
    (enterCondition.minPhotos === undefined || cameraRollCount >= enterCondition.minPhotos);
  canAdvanceRef.current = canAdvance;
  const [toast, setToast] = useState<string | null>(null);
  const [npcHoverLabel, setNpcHoverLabel] = useState<string | null>(null);
  const [flashing, setFlashing] = useState(false);
  const [flyAnim, setFlyAnim] = useState(false);
  const [flyImageUrl, setFlyImageUrl] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const rollIconRef = useRef<HTMLDivElement>(null);

  // NPCホバーラベルをrAFでポーリング（R3F外からレジストリを読む）
  useEffect(() => {
    let rafId: number;
    const poll = () => {
      setNpcHoverLabel(getHoveredNpcLabel());
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // モーダルが開いている間は F キーを無効化するための ref 同期
  useEffect(() => {
    modalOpenRef.current = showCameraRoll || showLog;
  }, [showCameraRoll, showLog]);

  // Tab / Q でHUD表示トグル、F で世界一時停止、Enter でワープ（beforeフェーズ）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Tab" || e.code === "KeyQ") {
        e.preventDefault();
        setHudVisible((v) => !v);
      }
      if (e.code === "KeyF" && !modalOpenRef.current) {
        e.preventDefault();
        toggleWorldPause();
      }
      if (e.code === "Enter" && explorationMode === "before" && !modalOpenRef.current && canAdvanceRef.current) {
        e.preventDefault();
        startReplay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleWorldPause, explorationMode, startReplay]);

  const flashToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2000);
  };

  const onShoot = () => {
    if (!worldPaused) return;

    const screenshotUrl = captureScreenshot();
    const focusedId = getFocusedObjectId();
    const phase = focusedId ? getPhase(focusedId) : null;
    const hasAnomaly = !!focusedId && phase === "after";

    addToCameraRoll({
      id: `photo_${Date.now()}`,
      imageDataUrl: screenshotUrl ?? "",
      hasAnomaly,
      objectId: focusedId,
      phase,
      checkpointId: currentCheckpoint,
      capturedAt: Date.now(),
    });

    // ホワイトフラッシュ
    setFlashing(true);
    window.setTimeout(() => setFlashing(false), 300);

    // 飛翔アニメ：カメラロールアイコンの位置を計測してCSS変数に渡す
    if (screenshotUrl) {
      setFlyImageUrl(screenshotUrl);
      if (rollIconRef.current) {
        const rect = rollIconRef.current.getBoundingClientRect();
        const tx = rect.left + rect.width / 2 - window.innerWidth / 2;
        const ty = rect.top + rect.height / 2 - window.innerHeight / 2;
        document.documentElement.style.setProperty("--fly-tx", `${tx}px`);
        document.documentElement.style.setProperty("--fly-ty", `${ty}px`);
      }
      setFlyAnim(true);
      window.setTimeout(() => setFlyAnim(false), 800);
    }

    // トースト（フラッシュ後に表示）
    window.setTimeout(() => flashToast(ja ? "記録しました" : "Recorded"), 350);
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);

  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      opacity: hudVisible ? 1 : 0,
      visibility: hudVisible ? "visible" : "hidden",
      transition: "opacity 0.15s",
    }}>
      {/* ホワイトフラッシュ */}
      {flashing && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(255,255,255,0.85)",
          animation: "flashOut 0.3s ease-out forwards",
          pointerEvents: "none",
          zIndex: 100,
        }} />
      )}

      {/* 世界停止オーバーレイ */}
      {worldPaused && (
        <div style={{
          position: "absolute", inset: 0,
          boxShadow: "inset 0 0 0 3px rgba(100,180,255,0.6)",
          pointerEvents: "none",
          zIndex: 10,
        }} />
      )}

      {/* 通知バー */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "10px 16px",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        fontSize: 13,
      }}>
        {explorationMode === "before" ? (
          <>
            <div>
              <div style={{ color: "var(--accent)", letterSpacing: 1 }}>
                {ja ? "探索フェーズ" : "Exploration Phase"}
              </div>
              <div style={{ opacity: 0.7, marginTop: 4 }}>
                {ja ? "変化前の世界を記憶してください" : "Memorize the world before changes"}
              </div>
            </div>
            <div style={{ textAlign: "right", lineHeight: 1.5 }}>
              <div style={{ opacity: 0.6, fontSize: 11, letterSpacing: 1 }}>
                {ja ? "通常時間" : "Normal Time"}
              </div>
              <div>{ja ? "徹" : "Toru"} {age}{ja ? "歳" : "y/o"}</div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div style={{ color: "var(--accent)", letterSpacing: 1 }}>
                🦷 {ja ? "水科歯科・定期検診 14:00〜" : "Mizushina Dental — checkup 14:00"}
              </div>
              <div style={{ opacity: 0.8, marginTop: 4, maxWidth: 420 }}>
                {cp.newsEvents[0]?.headline}
              </div>
            </div>
            <div style={{ textAlign: "right", lineHeight: 1.5 }}>
              <div>
                {cp.year}年{cp.month}月 ・ {ja ? "徹" : "Toru"} {age}{ja ? "歳" : "y/o"}
              </div>
              <div style={{ opacity: 0.7 }}>CP {currentCheckpoint + 1} / {TOTAL_CHECKPOINTS}</div>
              <div style={{ opacity: 0.7 }}>⏱ {minutes}:{seconds.toString().padStart(2, "0")}</div>
            </div>
          </>
        )}
      </div>

      {/* 認知メーター */}
      <div style={{ position: "absolute", top: 64, left: 16, width: 160 }}>
        <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 3 }}>
          {ja ? "認知レベル" : "COGNITION"}
        </div>
        <div style={{ height: 6, background: "#222", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${cognitionLevel}%`,
            background: cognitionLevel > 40 ? "var(--accent)" : "var(--danger)",
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* 世界停止インジケータ */}
      {worldPaused && (
        <div style={{
          position: "absolute", top: 64, right: 16,
          fontSize: 12, color: "rgba(100,180,255,0.9)",
          letterSpacing: 1, textShadow: "0 0 8px rgba(100,180,255,0.5)",
        }}>
          ⏸ {ja ? "世界停止中" : "WORLD PAUSED"}
        </div>
      )}

      {/* クロスヘア */}
      <Crosshair highlighted={!!npcHoverLabel && explorationMode === "before"} />

      {/* NPC会話ヒント（クロスヘア下） */}
      {npcHoverLabel && explorationMode === "before" && (
        <div style={{
          position: "absolute",
          top: "calc(50% + 18px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.72)",
          border: "1px solid rgba(255,255,255,0.35)",
          padding: "4px 14px",
          fontSize: 12,
          borderRadius: 2,
          pointerEvents: "none",
          whiteSpace: "nowrap",
          letterSpacing: 1,
        }}>
          {npcHoverLabel} — {ja ? "クリックで話す" : "Click to talk"}
        </div>
      )}

      {/* 飛翔アニメ（撮影画像がカメラロールへ飛ぶ） */}
      {flyAnim && flyImageUrl && (
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: 120, height: 80,
          marginLeft: -60, marginTop: -40,
          backgroundImage: `url(${flyImageUrl})`,
          backgroundSize: "cover",
          borderRadius: 4,
          border: "2px solid #fff",
          animation: "flyToRoll 0.8s cubic-bezier(0.4,0,1,1) forwards",
          pointerEvents: "none",
          zIndex: 50,
        }} />
      )}

      {/* トースト */}
      {toast && (
        <div className="fade-in" style={{
          position: "absolute", top: "20%", left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.8)",
          border: "1px solid var(--accent)",
          padding: "10px 22px", fontSize: 14, borderRadius: 3,
          maxWidth: "80%", textAlign: "center",
        }}>
          {toast}
        </div>
      )}

      {/* 下部操作 */}
      {explorationMode === "before" ? (
        /* ── 記憶フェーズ UI ── */
        <div style={{
          position: "absolute", bottom: 20, left: 0, right: 0,
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 12, pointerEvents: "auto",
        }}>
          <div style={{
            background: "rgba(0,0,0,0.72)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 4,
            padding: "8px 28px",
            textAlign: "center",
            lineHeight: 1.9,
          }}>
            <div style={{ fontSize: 11, opacity: 0.55, letterSpacing: 1 }}>
              {ja ? "通常時間で時が流れています" : "Normal time is flowing"}
            </div>
            <div style={{ fontSize: 15 }}>
              {ja ? `現在　${cp.startDateLabel}　この世界を記録してください` : `Now: ${cp.startDateLabel} — Record this world`}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            {!canAdvance && enterCondition?.minPhotos !== undefined && (
              <div style={{ fontSize: 11, color: "rgba(255,180,80,0.85)", letterSpacing: 1 }}>
                {ja
                  ? `あと ${enterCondition.minPhotos - cameraRollCount} 枚記録してください`
                  : `Record ${enterCondition.minPhotos - cameraRollCount} more photo(s)`}
              </div>
            )}
            <button
              onClick={() => { if (canAdvance) startReplay(); }}
              disabled={!canAdvance}
              style={{
                padding: "13px 32px",
                fontSize: 14,
                background: canAdvance ? "rgba(160,70,70,0.22)" : "rgba(60,60,60,0.35)",
                color: canAdvance ? "#eeaaaa" : "rgba(255,255,255,0.25)",
                border: `1px solid ${canAdvance ? "rgba(200,90,90,0.55)" : "rgba(255,255,255,0.12)"}`,
                borderRadius: 3,
                letterSpacing: 1,
                cursor: canAdvance ? "pointer" : "default",
                boxShadow: canAdvance ? "0 0 22px rgba(160,70,70,0.18)" : "none",
                transition: "all 0.2s",
              }}
            >
              {ja ? "[ Enter ]キー　一年後を観測する" : "[ Enter ]  Observe one year later"}
            </button>
          </div>
        </div>
      ) : (
        /* ── 高速再生フェーズ UI ── */
        <div style={{
          position: "absolute", bottom: 20, left: 0, right: 0,
          display: "flex", justifyContent: "center", alignItems: "center",
          gap: 14, pointerEvents: "auto",
        }}>
          <HudButton onClick={() => setShowLog(true)}>
            {ja ? "ログ" : "LOG"} ({anomalyCount})
          </HudButton>

          {/* Fキーヒント + カメラボタン */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}>
            <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 1 }}>
              [F] {ja ? "世界を止める" : "FREEZE"}
            </div>
            <button
              onClick={onShoot}
              disabled={!worldPaused}
              style={{
                width: 64, height: 64, borderRadius: "50%",
                border: `3px solid ${worldPaused ? "rgba(100,180,255,0.9)" : "rgba(255,255,255,0.25)"}`,
                background: worldPaused ? "rgba(100,180,255,0.2)" : "rgba(255,255,255,0.08)",
                color: worldPaused ? "rgba(100,180,255,1)" : "rgba(255,255,255,0.3)",
                fontSize: 22, cursor: worldPaused ? "pointer" : "default",
                transition: "all 0.2s",
                boxShadow: worldPaused ? "0 0 16px rgba(100,180,255,0.4)" : "none",
              }}
            >
              📷
            </button>
          </div>

          {/* カメラロールサムネイル */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            <div style={{ fontSize: 10, opacity: 0.5 }}>
              {ja ? "カメラロール" : "ROLL"}
            </div>
            <div
              ref={rollIconRef}
              onClick={() => setShowCameraRoll(true)}
              style={{
                width: 48, height: 48, borderRadius: 8,
                border: lastPhoto
                  ? "2px solid rgba(100,180,255,0.7)"
                  : "1px solid rgba(255,255,255,0.3)",
                background: lastPhoto && lastPhoto.imageDataUrl
                  ? `url(${lastPhoto.imageDataUrl}) center/cover`
                  : "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, color: "var(--paper)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                boxShadow: lastPhoto ? "0 0 10px rgba(100,180,255,0.3)" : "none",
                transition: "box-shadow 0.2s",
              }}
            >
              {!lastPhoto && <span style={{ opacity: 0.4 }}>{cameraRollCount}</span>}
              {cameraRollCount > 0 && (
                <div style={{
                  position: "absolute", bottom: 2, right: 3,
                  fontSize: 9, color: "#fff",
                  textShadow: "0 0 4px rgba(0,0,0,0.8)",
                  fontWeight: 600,
                }}>
                  {cameraRollCount}
                </div>
              )}
            </div>
          </div>

          <HudButton onClick={advanceCheckpoint}>
            {ja ? "帰宅して就寝 ▶" : "GO HOME ▶"}
          </HudButton>
        </div>
      )}

      {/* CSSアニメ定義 */}
      <style>{`
        @keyframes flashOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes flyToRoll {
          0%   { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--fly-tx, 80px), var(--fly-ty, calc(50vh - 30px))) scale(0.12); opacity: 0; }
        }
      `}</style>

      {showLog && <AnomalyLogPanel onClose={() => setShowLog(false)} />}
      {showCameraRoll && <CameraRollModal onClose={() => setShowCameraRoll(false)} />}
    </div>
  );
}

function Crosshair({ highlighted }: { highlighted?: boolean }) {
  return (
    <div style={{
      position: "absolute", top: "50%", left: "50%",
      width: 10, height: 10,
      marginLeft: -5, marginTop: -5,
      border: `2px solid ${highlighted ? "rgba(255,220,80,0.9)" : "rgba(255,255,255,0.6)"}`,
      borderRadius: "50%",
      transition: "border-color 0.1s",
    }} />
  );
}

function HudButton({
  onClick, active, children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 18px", fontSize: 13,
        background: active ? "var(--accent)" : "rgba(0,0,0,0.6)",
        color: active ? "#16140f" : "var(--paper)",
        border: "1px solid var(--accent)",
        borderRadius: 3, letterSpacing: 1,
      }}
    >
      {children}
    </button>
  );
}
