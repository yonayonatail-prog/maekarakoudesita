import { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import type {
  PortraitState,
  LightingId,
  CharacterPartsManifest,
  PartAsset,
  PortraitVideo,
} from "../types";
import {
  usePartsManifest,
  resolvePartStates,
  lookupPartAsset,
  resolveCharacterAssetPath,
} from "../lib/faceParts";

// ──────────────────────────────────────────────────────────────
// キャラクターカラー（プレースホルダー用）
// ──────────────────────────────────────────────────────────────
const CHAR_COLORS: Record<string, string> = {
  nanami:     "#8fb8a0",
  togawa:     "#6a7890",
  passerby:   "#7a8a88",
  shopkeeper: "#a09070",
  takeru:     "#6a8fba",
  director:   "#a08060",
  default:    "#9a8878",
};

const CANVAS_W = 420;
const CANVAS_H = 600;

// ──────────────────────────────────────────────────────────────
// Lighting プリセット（CSS ファースト）
// ──────────────────────────────────────────────────────────────
interface LightingPreset {
  gradient?:  string;
  blendMode?: React.CSSProperties["mixBlendMode"];
  opacity?:   number;
  filter?:    string;
}

const LIGHTING_PRESETS: Record<string, LightingPreset> = {
  normal: {},
  sunset: {
    gradient:  "linear-gradient(to bottom, rgba(255,130,50,0.55) 0%, rgba(200,60,0,0.35) 100%)",
    blendMode: "multiply",
  },
  indoor: {
    gradient:  "linear-gradient(to bottom, rgba(255,220,150,0.45) 0%, rgba(220,160,80,0.28) 100%)",
    blendMode: "multiply",
  },
  flashlight: {
    gradient:  "radial-gradient(ellipse 60% 70% at 50% 35%, transparent 20%, rgba(0,0,30,0.92) 78%)",
    blendMode: "multiply",
  },
  glow: {
    gradient:  "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.55) 0%, transparent 62%)",
    blendMode: "screen",
  },
};

const DEFAULT_PORTRAIT: PortraitState = {
  expression: "neutral",
  lighting:   "normal",
  effects:    [],
};

// ──────────────────────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────────────────────
export function CharacterSprite() {
  const activeCharacters = useGameStore((s) => s.novelVisualState.activeCharacters);
  const speakerKey       = useGameStore((s) => s.speakerKey);
  const novelState       = useGameStore((s) => s.novelState);

  if (novelState === "IDLE" || novelState === "COMPLETED") return null;
  if (!activeCharacters?.length) return null;

  const activeSpeakerId = speakerKey?.replace(/^speaker\./, "") ?? null;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
      {activeCharacters.map((char, idx) => (
        <PortraitSlot
          key={char.characterId}
          characterId={char.characterId}
          portrait={char.portrait ?? DEFAULT_PORTRAIT}
          isSpeaking={char.characterId === activeSpeakerId}
          slotIndex={idx}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PortraitSlot — 1キャラ分のコンテナ
// アスペクト比はマニフェストの canvas を優先（無ければ従来の420x600）
// ──────────────────────────────────────────────────────────────
interface PortraitSlotProps {
  characterId: string;
  portrait:    PortraitState;
  isSpeaking:  boolean;
  slotIndex:   number;
}

function PortraitSlot({ characterId, portrait, isSpeaking, slotIndex }: PortraitSlotProps) {
  const color    = CHAR_COLORS[characterId] ?? CHAR_COLORS.default;
  const isRight  = slotIndex % 2 === 1;
  const manifest = usePartsManifest(characterId);

  const canvasW = manifest?.canvas.width  ?? CANVAS_W;
  const canvasH = manifest?.canvas.height ?? CANVAS_H;

  return (
    <div
      className="sprite-enter"
      style={{
        position: "absolute",
        bottom: 0,
        width: "clamp(140px, 22vw, 300px)",
        ...(isRight ? { right: "2vw" } : { left: "2vw" }),
        filter: isSpeaking
          ? "brightness(1.05) saturate(1.1)"
          : "brightness(0.55) saturate(0.5)",
        transition: "filter 0.35s ease",
        WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 12%)",
        maskImage:        "linear-gradient(to top, transparent 0%, black 12%)",
      }}
    >
      <div
        className={isSpeaking ? "sprite-loop-speak" : "sprite-loop-idle"}
        style={{
          position:    "relative",
          width:       "100%",
          aspectRatio: `${canvasW} / ${canvasH}`,
          transform:   isRight ? "scaleX(-1)" : undefined,
        }}
      >
        <PortraitLayers
          characterId={characterId}
          portrait={portrait}
          color={color}
          manifest={manifest}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PortraitLayers — 描画順: (Base + Parts | Video) → Lighting → Effect
// マニフェストあり: 福笑い方式（parts.json の座標でパーツを配置）
// マニフェストなし: 従来の expression/{id}/*.png フォルダ方式
// ──────────────────────────────────────────────────────────────
interface PortraitLayersProps {
  characterId: string;
  portrait:    PortraitState;
  color:       string;
  manifest:    CharacterPartsManifest | null;
}

function PortraitLayers({ characterId, portrait, color, manifest }: PortraitLayersProps) {
  const { expression, lighting, effects, video } = portrait;
  const base = `/characters/${characterId}`;

  // oneshot動画は再生完了後に静止画へ戻る
  const videoSrc = video ? resolveCharacterAssetPath(characterId, video.src) : null;
  const [videoDone, setVideoDone] = useState(false);
  useEffect(() => { setVideoDone(false); }, [videoSrc]);
  const videoActive = !!video && !!videoSrc && !videoDone;

  const basePath = manifest?.base ?? "base/face.png";

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Layer 0: Base（動画再生中も下敷きとして表示し、動画側が全身を覆う想定） */}
      {!videoActive && (
        <ImageLayer
          src={`${base}/${basePath}`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
          fallback={<PlaceholderBust color={color} expression={expression} />}
        />
      )}

      {/* Layer 0.5: 表情動画（透過webm・再生中はベース＋パーツを置き換え） */}
      {videoActive && video && videoSrc && (
        <PortraitVideoLayer
          src={videoSrc}
          video={video}
          onFinished={() => setVideoDone(true)}
        />
      )}

      {/* Layer 1: Parts（福笑い方式）— 動画再生中は非表示 */}
      {!videoActive && manifest && (
        <ManifestParts characterId={characterId} portrait={portrait} manifest={manifest} />
      )}
      {!videoActive && !manifest && (
        <ExpressionLayers character={characterId} expression={expression} />
      )}

      {/* Layer 2: Lighting（CSSグラデーション＋任意画像） */}
      <LightingLayer character={characterId} lighting={lighting} />

      {/* Layer 3: Effects */}
      {effects.map((fx) => (
        <OptionalImage
          key={fx}
          src={`${base}/effects/${fx}.png`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ManifestParts — parts.json の座標に従って brow / eye / mouth / other を配置
// ──────────────────────────────────────────────────────────────
function ManifestParts({
  characterId,
  portrait,
  manifest,
}: {
  characterId: string;
  portrait:    PortraitState;
  manifest:    CharacterPartsManifest;
}) {
  const resolved = resolvePartStates(portrait, manifest);

  const brow  = lookupPartAsset(manifest, "brow",  resolved.brow);
  const eye   = lookupPartAsset(manifest, "eye",   resolved.eye);
  const mouth = lookupPartAsset(manifest, "mouth", resolved.mouth);

  return (
    <>
      {brow  && <PartLayer characterId={characterId} asset={brow}  canvas={manifest.canvas} />}
      {eye   && <PartLayer characterId={characterId} asset={eye}   canvas={manifest.canvas} />}
      {mouth && <PartLayer characterId={characterId} asset={mouth} canvas={manifest.canvas} />}
      {resolved.other.map((state) => {
        const asset = lookupPartAsset(manifest, "other", state);
        return asset
          ? <PartLayer key={state} characterId={characterId} asset={asset} canvas={manifest.canvas} />
          : null;
      })}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// PartLayer — パーツ1枚をピボット座標（画像左上角）で絶対配置
// 表示幅: asset.w（ベース画像px）指定時はそれを、無指定時は実寸等倍を
// ベースcanvasに対する％へ換算して配置する
// ──────────────────────────────────────────────────────────────
function PartLayer({
  characterId,
  asset,
  canvas,
}: {
  characterId: string;
  asset:       PartAsset;
  canvas:      { width: number; height: number };
}) {
  const src = resolveCharacterAssetPath(characterId, asset.src);
  const [naturalW, setNaturalW] = useState<number | null>(null);
  const [failed, setFailed]     = useState(false);
  useEffect(() => { setFailed(false); setNaturalW(null); }, [src]);

  if (failed) return null;

  const displayW = asset.w ?? naturalW;

  return (
    <img
      src={src}
      alt=""
      onLoad={(e) => setNaturalW(e.currentTarget.naturalWidth)}
      onError={() => setFailed(true)}
      style={{
        position:   "absolute",
        left:       `${(asset.x / canvas.width)  * 100}%`,
        top:        `${(asset.y / canvas.height) * 100}%`,
        width:      displayW != null ? `${(displayW / canvas.width) * 100}%` : undefined,
        height:     "auto",
        display:    "block",
        // 実寸取得前の誤スケール表示を防ぐ
        visibility: displayW != null ? "visible" : "hidden",
        pointerEvents: "none",
      }}
    />
  );
}

// ──────────────────────────────────────────────────────────────
// PortraitVideoLayer — 透過webm表情動画
// oneshot: 再生完了で onFinished（静止画へ復帰） / loop: ループ再生
// 再生エラー時も onFinished で静止画へフォールバック
// ──────────────────────────────────────────────────────────────
function PortraitVideoLayer({
  src,
  video,
  onFinished,
}: {
  src:        string;
  video:      PortraitVideo;
  onFinished: () => void;
}) {
  return (
    <video
      src={src}
      autoPlay
      muted
      playsInline
      loop={video.mode === "loop"}
      onEnded={video.mode === "oneshot" ? onFinished : undefined}
      onError={onFinished}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        objectFit: "contain",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}

// ──────────────────────────────────────────────────────────────
// LightingLayer
// ──────────────────────────────────────────────────────────────
function LightingLayer({ character, lighting }: { character: string; lighting: LightingId }) {
  const preset = LIGHTING_PRESETS[lighting] ?? {};
  const dir    = `/characters/${character}/lighting/${lighting}`;

  return (
    <>
      {/* CSSグラデーションオーバーレイ */}
      {preset.gradient && (
        <div
          style={{
            position:      "absolute",
            inset:         0,
            background:    preset.gradient,
            mixBlendMode:  preset.blendMode ?? "normal",
            opacity:       preset.opacity   ?? 1,
            filter:        preset.filter,
            pointerEvents: "none",
          }}
        />
      )}
      {/* 任意: overlay.png */}
      <OptionalImage
        src={`${dir}/overlay.png`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
      />
      {/* 任意: shadow.png */}
      <OptionalImage
        src={`${dir}/shadow.png`}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "contain", mixBlendMode: "multiply",
        }}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// ExpressionLayers — 旧フォルダ方式（parts.json が無いキャラ用フォールバック）
// ──────────────────────────────────────────────────────────────
function ExpressionLayers({ character, expression }: { character: string; expression: string }) {
  const dir = `/characters/${character}/expression/${expression}`;
  const s: React.CSSProperties = {
    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain",
  };
  return (
    <>
      <OptionalImage src={`${dir}/brow.png`}  style={s} />
      <OptionalImage src={`${dir}/eye.png`}   style={s} />
      <OptionalImage src={`${dir}/mouth.png`} style={s} />
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// ImageLayer — 読み込み失敗時に fallback を表示
// ──────────────────────────────────────────────────────────────
interface ImageLayerProps {
  src:      string;
  style:    React.CSSProperties;
  fallback: React.ReactNode;
}

function ImageLayer({ src, style, fallback }: ImageLayerProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);

  if (failed) return <div style={style}>{fallback}</div>;
  return <img src={src} alt="" onError={() => setFailed(true)} style={{ ...style, display: "block" }} />;
}

// ──────────────────────────────────────────────────────────────
// OptionalImage — 存在しない場合は何も表示しない（フォールバックなし）
// ──────────────────────────────────────────────────────────────
function OptionalImage({ src, style }: { src: string; style: React.CSSProperties }) {
  const [exists, setExists] = useState(true);
  useEffect(() => { setExists(true); }, [src]);
  if (!exists) return null;
  return <img src={src} alt="" onError={() => setExists(false)} style={{ ...style, display: "block" }} />;
}

// ──────────────────────────────────────────────────────────────
// PlaceholderBust — 画像未配置時の開発用SVGシルエット
// ──────────────────────────────────────────────────────────────
function PlaceholderBust({ color, expression }: { color: string; expression: string }) {
  const gradId = `pb-${color.replace("#", "")}`;
  return (
    <svg
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.92" />
          <stop offset="100%" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {/* 胴体 */}
      <rect x="50"  y="295" width="320" height="320" rx="40" fill={`url(#${gradId})`} />
      {/* 首 */}
      <rect x="178" y="235" width="64"  height="68"  rx="18" fill={color} opacity="0.88" />
      {/* 頭 */}
      <ellipse cx="210" cy="158" rx="112" ry="130" fill={color} opacity="0.92" />
      {/* 髪（上） */}
      <ellipse cx="210" cy="68"  rx="120" ry="58"  fill={color} opacity="0.72" />
      {/* 髪（左） */}
      <ellipse cx="104" cy="145" rx="28"  ry="90"  fill={color} opacity="0.68" />
      {/* 髪（右） */}
      <ellipse cx="316" cy="145" rx="28"  ry="90"  fill={color} opacity="0.68" />
      {/* 表情名ラベル */}
      <text
        x="210" y="340"
        textAnchor="middle" fontSize="22"
        fontFamily="sans-serif"
        fill="rgba(232,226,210,0.65)"
        fontWeight="600"
      >
        {expression}
      </text>
    </svg>
  );
}
