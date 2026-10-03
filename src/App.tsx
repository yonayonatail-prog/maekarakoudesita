import { useCallback, lazy, Suspense, useEffect, useRef, useState } from "react";
import { useGameStore } from "./store/gameStore";
import { TitleScreen } from "./ui/TitleScreen";
import { TutorialToast, RightClickMouseIcon, WasdKeysIcon } from "./ui/TutorialToast";
import { WORLD_OBJECTS } from "./data/worldObjects";
import { setEditorInitialObjects } from "./editor/useEditorStore";
import { useAudio } from "./scene/useAudio";
import type { WorldObject } from "./types";

// three.js を含む重量級シーン・HUDは lazy import にし、タイトル画面の
// 初回描画（ロゴ表示）がこれらのダウンロード・パースを待たないようにする。
// 実体のチャンクは assetPreloader.ts がタイトル滞在中に先読みするため、
// 実際に explore フェーズへ遷移する時点では即座に解決される。
const GameScene = lazy(() => import("./scene/GameScene").then((m) => ({ default: m.GameScene })));
const ConvenienceStoreScene = lazy(() => import("./scene/ConvenienceStoreScene").then((m) => ({ default: m.ConvenienceStoreScene })));
const ApartmentScene = lazy(() => import("./scene/ApartmentScene").then((m) => ({ default: m.ApartmentScene })));
const DentalBusStopScene = lazy(() => import("./scene/DentalBusStopScene").then((m) => ({ default: m.DentalBusStopScene })));
const ResultScene = lazy(() => import("./scene/ResultScene").then((m) => ({ default: m.ResultScene })));
const NovelScene = lazy(() => import("./scene/NovelScene").then((m) => ({ default: m.NovelScene })));
const HUD = lazy(() => import("./ui/HUD").then((m) => ({ default: m.HUD })));
const EndingScreen = lazy(() => import("./ui/EndingScreen").then((m) => ({ default: m.EndingScreen })));
const ResultScreen = lazy(() => import("./ui/ResultScreen").then((m) => ({ default: m.ResultScreen })));
const AssetPlacerGUI = lazy(() => import("./editor/AssetPlacerGUI").then((m) => ({ default: m.AssetPlacerGUI })));

export default function App() {
  useAudio();

  const phase = useGameStore((s) => s.phase);
  const novelState = useGameStore((s) => s.novelState);
  const currentLocation = useGameStore((s) => s.currentLocation);
  const devModeActive = useGameStore((s) => s.devModeActive);
  const [showRclick, setShowRclick] = useState(true);
  const [showWasd, setShowWasd] = useState(false);
  const wasdTimerRef = useRef<number | null>(null);
  const hasRightClicked = useRef(false);
  const wasdMovedRef = useRef(false);

  // フェーズ変更フェード（explore → result など）
  const [displayPhase, setDisplayPhase] = useState(phase);

  // シーン遷移フェード制御（ロケーション変更）
  const [displayLocation, setDisplayLocation] = useState(currentLocation);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  useEffect(() => {
    if (currentLocation === displayLocation) return;
    // タイトル画面からの遷移ではフェードしない（黒画面を防ぐ）
    if (displayPhase === "title") {
      setDisplayLocation(currentLocation);
      return;
    }
    setFadeOpacity(1);
    const t1 = window.setTimeout(() => {
      setDisplayLocation(currentLocation);
      // t2 はクリーンアップに含めない（setDisplayLocation 後のリレンダーで
      // クリーンアップが走ると t2 がキャンセルされてしまうため）
      window.setTimeout(() => setFadeOpacity(0), 50);
    }, 350);
    return () => window.clearTimeout(t1);
  }, [currentLocation, displayLocation, displayPhase]);

  useEffect(() => {
    if (phase === displayPhase) return;
    // result / ending へ切り替わるときだけ全画面フェードを挟む
    if (phase === "result" || phase === "ending" || displayPhase === "result") {
      setFadeOpacity(1);
      const t = window.setTimeout(() => {
        setDisplayPhase(phase);
        window.setTimeout(() => setFadeOpacity(0), 50);
      }, 380);
      return () => window.clearTimeout(t);
    }
    setDisplayPhase(phase);
  }, [phase, displayPhase]);

  // エディタ起動前にデフォルトワールドオブジェクトを注入
  useEffect(() => {
    setEditorInitialObjects(WORLD_OBJECTS as WorldObject[]);
  }, []);

  // Reactが描画を開始した時点で index.html の起動スプラッシュ（素のHTML/CSS）を
  // フェードアウトして除去する。JSバンドルのDL・パース待ちの間の空白を埋めるため。
  useEffect(() => {
    const splash = document.getElementById("boot-splash");
    if (!splash) return;
    splash.style.opacity = "0";
    const t = window.setTimeout(() => splash.remove(), 400);
    return () => window.clearTimeout(t);
  }, []);

  // 右クリック検知 → 1秒後にWASDトーストを表示（1回限り）
  useEffect(() => {
    if (phase !== "explore") return;
    const onRightClick = () => {
      if (hasRightClicked.current) return;
      hasRightClicked.current = true;
      setShowRclick(false);
      wasdTimerRef.current = window.setTimeout(() => setShowWasd(true), 1000);
    };
    window.addEventListener("contextmenu", onRightClick);
    return () => {
      window.removeEventListener("contextmenu", onRightClick);
      if (wasdTimerRef.current) window.clearTimeout(wasdTimerRef.current);
    };
  }, [phase]);

  // WASD押下 → WASDトーストを即時dismiss
  useEffect(() => {
    if (phase !== "explore") return;
    const onKey = (e: KeyboardEvent) => {
      if (!["KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) return;
      if (wasdMovedRef.current) return;
      wasdMovedRef.current = true;
      setShowWasd(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // GUIクローズハンドラ：エディタのクリーンアップとストアリセットを行う
  const handleAssetPlacerClose = useCallback(() => {
    // 1. ゲームストアのエディタ退出処理を実行し、ノベル状態をリセットする
    useGameStore.getState().exitNovel();
    // 2. エディタのポータルDOM要素をクリーンアップする
    // この関数は他のコンポーネント（例: AssetPlacerGUI）内で定義し、windowオブジェクトにアタッチされることを期待する。
    // App.tsxのトップレベルで定義されているため、global scope (window) にアタッチする。
    (window as any).editorCleanup?.();
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {displayPhase === "title" && <TitleScreen />}

      {(displayPhase === "explore" || displayPhase === "ending") && (
        <Suspense fallback={null}>
          {displayLocation === "apartment" ? (
            <ApartmentScene />
          ) : displayLocation === "street" ? (
            <GameScene />
          ) : displayLocation === "dental_bus_stop" ? (
            <DentalBusStopScene />
          ) : (
            <ConvenienceStoreScene />
          )}
          {displayPhase === "explore" && novelState === "IDLE" && <HUD />}
          {displayPhase === "explore" && novelState !== "IDLE" && <NovelScene />}
          {displayPhase === "explore" && novelState === "IDLE" && showRclick && (
            <TutorialToast
              title="右クリックでスタート"
              icon={<RightClickMouseIcon />}
              duration={3000}
              placement="center"
              onDismiss={() => setShowRclick(false)}
            />
          )}
          {displayPhase === "explore" && novelState === "IDLE" && showWasd && (
            <TutorialToast
              title="移動"
              subtitle="Use WASD to move"
              icon={<WasdKeysIcon />}
              duration={3000}
              placement="center"
              onDismiss={() => setShowWasd(false)}
            />
          )}

          {displayPhase === "ending" && <EndingScreen />}
        </Suspense>
      )}

      {/* リザルト画面：洗面所鏡シーン + 結果UI */}
      {displayPhase === "result" && (
        <Suspense fallback={null}>
          <ResultScene />
          <ResultScreen />
        </Suspense>
      )}

      {/* シーン遷移フェードオーバーレイ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 9000,
          background: "black",
          opacity: fadeOpacity,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        }}
      />

      {/* エディタ：Dev モードボタンで起動時のみ表示 */}
      {import.meta.env.DEV && devModeActive && (
        <Suspense fallback={null}>
          <AssetPlacerGUI onClose={handleAssetPlacerClose} />
        </Suspense>
      )}
    </div>
  );
}
