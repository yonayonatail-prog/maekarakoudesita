import { lazy, Suspense, useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import {
  getPreloadState,
  startChunkPreload,
  startFetchPreload,
  subscribePreload,
  type PreloadState,
} from "../lib/assetPreloader";

// =============================================================
// タイトル画面（仕様 §7-4 / §13-4 + readOnly/title_image.html 準拠）
// 映画の画角（2.35:1）レターボックス、Cannyエッジ都市背景、
// 横断歩道レイヤー、シネマティックボカシ光源の4層構成。
// タイトル滞在中にゲーム本編のアセットを先読みし、完了までは
// 「NOW LOADING」+ 横断歩道ストライプのプログレスを表示する。
// 起動するたびにロゴが少しずつシュリンクする隠し演出は維持。
//
// GLB先読み（three.js/drei依存）は TitleGlbPreloader へ切り出し、
// lazy import にしている。ロゴの初回描画が three.js のダウンロード・
// パースを待たされないようにするため。
// =============================================================

const STRIPE_COUNT = 14;

const GlbPreloader = lazy(() => import("./TitleGlbPreloader"));

function usePreload(): PreloadState {
  const [state, setState] = useState<PreloadState>(getPreloadState);
  useEffect(() => {
    startFetchPreload();
    startChunkPreload();
    setState(getPreloadState());
    return subscribePreload(setState);
  }, []);
  return state;
}

// ── 背景レイヤー ──────────────────────────────────────────────

/** 3層目: Cannyエッジ都市背景 */
function CannyCityBackground() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 5,
        pointerEvents: "none",
        opacity: 0.18,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 500"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" stroke="#3a414a" strokeWidth="2" opacity="0.7">
          <path d="M 0,500 L 0,280 L 40,280 L 40,350 L 90,350 L 90,220 L 150,220 L 150,400 L 210,400 L 210,180 L 280,180 L 280,310 L 320,310 L 320,500" />
          <path d="M 100,240 L 140,240 M 100,270 L 140,270 M 100,300 L 140,300" />
          <path d="M 225,200 L 265,200 M 225,240 L 265,240 M 225,280 L 265,280" />
          <path d="M 320,500 L 320,250 L 390,250 L 390,420 L 440,420 L 440,150 L 520,150 L 520,320 L 600,320 L 600,200 L 680,200 L 680,450 L 750,450 L 750,130 L 850,130 L 850,500" />
          <path
            d="M 455,180 L 505,180 M 455,220 L 505,220 M 455,260 L 505,260"
            strokeDasharray="2,2"
          />
          <path d="M 770,160 L 830,160 M 770,200 L 830,200 M 770,240 L 830,240" />
          <path d="M 850,500 L 850,220 L 920,220 L 920,300 L 1000,300 L 1000,90 L 1100,90 L 1100,380 L 1200,380 L 1200,500" />
          <path d="M 1020,120 L 1080,120 M 1020,160 L 1080,160 M 1020,200 L 1080,200 M 1020,240 L 1080,240" />
        </g>
      </svg>
    </div>
  );
}

/** 3.5層目: 横断歩道レイヤー（左のロゴゾーンへ向けて闇に消えるマスク付き） */
function CrosswalkLayer() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        width: "100%",
        height: "100%",
        zIndex: 7,
        pointerEvents: "none",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-end",
        opacity: 0.22,
        WebkitMaskImage:
          "linear-gradient(to right, rgba(0,0,0,0) 25%, rgba(0,0,0,1) 60%)",
        maskImage:
          "linear-gradient(to right, rgba(0,0,0,0) 25%, rgba(0,0,0,1) 60%)",
      }}
    >
      <img
        src="/title/line_oudanhodou.webp"
        alt=""
        style={{
          width: "65%",
          height: "auto",
          objectFit: "contain",
          marginBottom: "-2%",
        }}
      />
    </div>
  );
}

/** 2層目: 2重のSVGボカシ（光源エフェクト） */
function BlurLightLayer() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter
            id="title-cinematic-blur"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="70" />
          </filter>
        </defs>
        <circle
          cx="30%"
          cy="50%"
          r="20%"
          fill="#292d36"
          filter="url(#title-cinematic-blur)"
          opacity="0.65"
        />
        <circle
          cx="30%"
          cy="50%"
          r="13%"
          fill="#3a414a"
          filter="url(#title-cinematic-blur)"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}

// ── ロード UI（横断歩道ストライプ） ───────────────────────────

function LoadingStripes({ progress }: { progress: number }) {
  const lit = Math.round(progress * STRIPE_COUNT);
  return (
    <div className="title-loading">
      <div className="title-loading-label">NOW LOADING</div>
      <div className="title-stripes">
        {Array.from({ length: STRIPE_COUNT }, (_, i) => (
          <div key={i} className={`title-stripe${i < lit ? " lit" : ""}`} />
        ))}
      </div>
      <div className="title-loading-percent">
        {Math.round(progress * 100)}%
      </div>
    </div>
  );
}

// ── 本体 ──────────────────────────────────────────────────────

export function TitleScreen() {
  const language = useGameStore((s) => s.language);
  const setLanguage = useGameStore((s) => s.setLanguage);
  const startGame = useGameStore((s) => s.startGame);
  const startDevMode = useGameStore((s) => s.startDevMode);
  const hasSave = useGameStore((s) => s.hasSave);
  const loadSavedGame = useGameStore((s) => s.loadSavedGame);
  const shrinkCount = useGameStore((s) => s.titleShrinkCount);
  const incrementShrink = useGameStore((s) => s.incrementTitleShrink);
  const noticed = useGameStore((s) => s.titleShrinkNoticed);
  const notice = useGameStore((s) => s.noticeTitleShrink);

  const { progress, ready } = usePreload();
  const [taps, setTaps] = useState(0);

  // 起動ごとにシュリンクを進める
  useEffect(() => {
    incrementShrink();
  }, [incrementShrink]);

  const shrinkFactor = Math.max(0.6, 1 - shrinkCount * 0.01);

  const handleLogoTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const n = taps + 1;
    setTaps(n);
    if (shrinkCount > 5 && n >= 3 && !noticed) notice();
  };

  const handleStart = () => {
    if (ready) startGame();
  };

  const ja = language === "ja";

  return (
    <div className="title-screen">
      {/* シネマビューポート（クリックで開始） */}
      <div
        className={`title-viewport${ready ? " ready" : ""}`}
        onClick={handleStart}
      >
        <CannyCityBackground />
        <CrosswalkLayer />
        <BlurLightLayer />

        {/* 1層目: コンテンツグリッド */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 20,
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            {/* シュリンク隠し演出はラッパーの scale で行う */}
            <div
              style={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                transform: `scale(${shrinkFactor})`,
                transition: "transform 0.4s ease",
                pointerEvents: "none",
              }}
            >
              <img
                src="/title/logo.webp"
                alt={ja ? "前からこうでした" : "It's Always Been This Way"}
                className="title-logo-img"
                draggable={false}
                onClick={handleLogoTap}
                style={{ pointerEvents: "auto", cursor: "pointer" }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              paddingRight: "5vw",
              height: "100%",
            }}
          >
            <div className="title-catchphrase">
              {ja ? (
                <>
                  あなたの大切なものは、
                  <br />
                  生まれたときからずっと、少しずつ小さく――
                </>
              ) : (
                <>
                  Your precious things have always been
                  <br />
                  shrinking, little by little.
                </>
              )}
            </div>

            {noticed && (
              <p
                className="fade-in"
                style={{
                  color: "#6b6046",
                  fontSize: "clamp(11px, 1.2vw, 14px)",
                  letterSpacing: "0.15em",
                  margin: "0 0 1.2vw",
                }}
              >
                {ja
                  ? "……ロゴ、小さくなってない？　気のせいか。"
                  : "...is the logo smaller? Must be imagining it."}
              </p>
            )}

            {ready ? (
              <div className="fade-in">
                <div className="title-prompt">CLICK TO START</div>
                {hasSave && (
                  <button
                    className="title-continue"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadSavedGame();
                    }}
                  >
                    {ja ? "つづきから" : "CONTINUE"}
                  </button>
                )}
              </div>
            ) : (
              <LoadingStripes progress={progress} />
            )}
          </div>
        </div>
      </div>

      {/* 操作ヒント（下部レターボックス内） */}
      <p
        style={{
          position: "absolute",
          bottom: "5vh",
          left: 0,
          width: "100%",
          textAlign: "center",
          color: "#33383f",
          fontSize: 11,
          letterSpacing: "0.15em",
          margin: 0,
          pointerEvents: "none",
        }}
      >
        {ja
          ? "クリックで視点ロック / WASD・矢印で移動 / 異変をスコープで撮影"
          : "Click to lock pointer / WASD to move / capture anomalies with scope"}
      </p>

      {/* 言語切替（右下） */}
      <div
        style={{
          position: "absolute",
          bottom: "1.2vh",
          right: 16,
          display: "flex",
          gap: 4,
          zIndex: 110,
        }}
      >
        <button
          className={`title-lang-btn${ja ? " active" : ""}`}
          onClick={() => setLanguage("ja")}
        >
          日本語
        </button>
        <span style={{ color: "#33383f", fontSize: 12, alignSelf: "center" }}>
          /
        </span>
        <button
          className={`title-lang-btn${!ja ? " active" : ""}`}
          onClick={() => setLanguage("en")}
        >
          English
        </button>
      </div>

      {/* Dev モード（左下・開発時のみ） */}
      {import.meta.env.DEV && (
        <button
          onClick={startDevMode}
          style={{
            position: "absolute",
            bottom: "1.2vh",
            left: 16,
            zIndex: 110,
            padding: "4px 12px",
            fontSize: 11,
            background: "transparent",
            color: "#4a4436",
            border: "1px dashed #4a4436",
            borderRadius: 2,
            letterSpacing: "0.1em",
          }}
        >
          Dev モード（AssetPlacer）
        </button>
      )}

      {/* GLB 先読み（非表示、three.js は別チャンクとして遅延ロード） */}
      <Suspense fallback={null}>
        <GlbPreloader />
      </Suspense>
    </div>
  );
}
