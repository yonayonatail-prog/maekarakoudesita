import { useEffect, useRef, useState, type ReactNode } from "react";

// ---------------------------------------------------------------
// TutorialToast
// プレイヤーへの操作説明トースト。duration ms後にイージングで自動消滅。
// ×ボタンでも即時閉じる。icon / placement / duration は差し替え可能。
// ---------------------------------------------------------------

interface TutorialToastProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  duration?: number;
  onDismiss?: () => void;
  placement?: "center" | "bottom-right" | "bottom-left" | "bottom-center" | "top-right";
}

const EXIT_MS = 380;

// placement ごとの座標スタイル
const PLACEMENT_POS: Record<
  NonNullable<TutorialToastProps["placement"]>,
  React.CSSProperties
> = {
  "center":        { top: "50%", left: "50%" },
  "bottom-right":  { bottom: 32, right: 32 },
  "bottom-left":   { bottom: 32, left: 32 },
  "bottom-center": { bottom: 32, left: "50%" },
  "top-right":     { top: 32, right: 32 },
};

// placement ごとの enter/exit transform
const PLACEMENT_TRANSFORM: Record<
  NonNullable<TutorialToastProps["placement"]>,
  { enter: string; exit: string }
> = {
  "center":        { enter: "translate(-50%, -50%)",        exit: "translate(-50%, -44%)" },
  "bottom-right":  { enter: "translateY(0)",                exit: "translateY(16px)" },
  "bottom-left":   { enter: "translateY(0)",                exit: "translateY(16px)" },
  "bottom-center": { enter: "translateX(-50%) translateY(0)", exit: "translateX(-50%) translateY(16px)" },
  "top-right":     { enter: "translateY(0)",                exit: "translateY(-16px)" },
};

// キーフレームをDOMに1回だけ注入する
(function injectKeyframes() {
  if (document.getElementById("tutorial-toast-kf")) return;
  const s = document.createElement("style");
  s.id = "tutorial-toast-kf";
  s.textContent = `
    @keyframes ttShrink {
      to { transform: scaleX(0); }
    }
    @keyframes ttBlinkRight {
      0%, 100% { opacity: 0.1; box-shadow: none; }
      50%       { opacity: 0.8; box-shadow: 0 0 12px rgba(0,229,255,.8), inset 0 0 8px rgba(0,229,255,.8); }
    }
  `;
  document.head.appendChild(s);
})();

export function TutorialToast({
  title,
  subtitle,
  icon,
  duration = 3000,
  onDismiss,
  placement = "bottom-right",
}: TutorialToastProps) {
  const [dismissing, setDismissing] = useState(false);
  const autoRef = useRef<number | null>(null);
  const exitRef = useRef<number | null>(null);

  const dismiss = () => {
    if (dismissing) return;
    setDismissing(true);
    exitRef.current = window.setTimeout(() => onDismiss?.(), EXIT_MS);
  };

  useEffect(() => {
    autoRef.current = window.setTimeout(dismiss, duration);
    return () => {
      if (autoRef.current) window.clearTimeout(autoRef.current);
      if (exitRef.current) window.clearTimeout(exitRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pos = PLACEMENT_POS[placement];
  const tf = PLACEMENT_TRANSFORM[placement];

  return (
    <div
      style={{
        position: "absolute",
        ...pos,
        width: 320,
        pointerEvents: "auto",
        zIndex: 200,
        transition: `opacity ${EXIT_MS}ms cubic-bezier(.4,0,1,1), transform ${EXIT_MS}ms cubic-bezier(.4,0,1,1)`,
        opacity: dismissing ? 0 : 1,
        transform: dismissing ? tf.exit : tf.enter,
      }}
    >
      {/* カード本体 */}
      <div
        style={{
          position: "relative",
          padding: "22px 20px 28px",
          background:
            "linear-gradient(135deg, rgba(15,15,26,.96) 0%, rgba(10,10,18,.99) 100%)",
          border: "1px solid rgba(0,229,255,.15)",
          color: "#e0f2f1",
          fontFamily: "'Share Tech Mono', monospace",
          boxShadow:
            "0 0 40px rgba(0,229,255,.04), inset 0 1px 0 rgba(0,229,255,.08)",
        }}
      >
        {/* ×ボタン */}
        <button
          onClick={dismiss}
          style={{
            position: "absolute",
            top: 8,
            right: 12,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            color: "#00e5ff",
            opacity: 0.6,
            lineHeight: 1,
            padding: 2,
            transition: "opacity .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
        >
          ✕
        </button>

        {/* 四隅デコレーション */}
        <ToastCorner pos="tl" />
        <ToastCorner pos="tr" />
        <ToastCorner pos="bl" />
        <ToastCorner pos="br" />

        {/* コンテンツ行 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {icon}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: subtitle ? 18 : 16, fontWeight: 600, letterSpacing: subtitle ? 1 : 0.5 }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* プログレスバー（duration で縮小し消える） */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 2,
            background: "rgba(255,255,255,.05)",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "#00e5ff",
              transformOrigin: "right",
              animation: `ttShrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// 四隅コーナーアクセント
// ---------------------------------------------------------------
const CORNER_STYLES: Record<string, React.CSSProperties> = {
  tl: { top: 0, left: 0, borderWidth: "1px 0 0 1px" },
  tr: { top: 0, right: 0, borderWidth: "1px 1px 0 0" },
  bl: { bottom: 0, left: 0, borderWidth: "0 0 1px 1px" },
  br: { bottom: 0, right: 0, borderWidth: "0 1px 1px 0" },
};

function ToastCorner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 12,
        height: 12,
        borderColor: "#00e5ff",
        borderStyle: "solid",
        opacity: 0.6,
        ...CORNER_STYLES[pos],
      }}
    />
  );
}

// ---------------------------------------------------------------
// WasdKeysIcon
// WASDキー配置グリッド（modal_WASD.html デザイン準拠）
// ---------------------------------------------------------------
export function WasdKeysIcon() {
  const keyStyle: React.CSSProperties = {
    background: "rgba(79,209,197,.05)",
    border: "1px solid #4fd1c5",
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: 14,
    color: "#4fd1c5",
    boxShadow: "inset 0 0 5px rgba(79,209,197,.3)",
    width: 26,
    height: 26,
  };
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 26px)",
        gridTemplateRows: "repeat(2, 26px)",
        gap: 4,
        flexShrink: 0,
        fontFamily: "'Share Tech Mono', monospace",
      }}
    >
      <div style={{ ...keyStyle, gridColumn: 2, gridRow: 1 }}>W</div>
      <div style={{ ...keyStyle, gridColumn: 1, gridRow: 2 }}>A</div>
      <div style={{ ...keyStyle, gridColumn: 2, gridRow: 2 }}>S</div>
      <div style={{ ...keyStyle, gridColumn: 3, gridRow: 2 }}>D</div>
    </div>
  );
}

// ---------------------------------------------------------------
// FKeyIcon
// 視点ロックチュートリアル用 Fキーアイコン（modal_Fkey.html デザイン準拠）
// ---------------------------------------------------------------
export function FKeyIcon() {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        background: "transparent",
        border: "1px solid #4fd1c5",
        borderRadius: "12%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: 16,
        color: "#4fd1c5",
        fontFamily: "'Share Tech Mono', monospace",
        boxShadow: "inset 0 0 5px rgba(79,209,197,.3)",
        flexShrink: 0,
      }}
    >
      F
    </div>
  );
}

// ---------------------------------------------------------------
// RightClickMouseIcon
// 右クリックエリアが明滅するマウスアイコン
// ---------------------------------------------------------------
export function RightClickMouseIcon() {
  return (
    <div
      style={{ width: 34, height: 52, marginLeft: 8, flexShrink: 0 }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          border: "2px solid rgba(0,229,255,.6)",
          borderRadius: 17,
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* 右クリック明滅エリア */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "50%",
            height: "45%",
            background: "#00e5ff",
            borderTopRightRadius: 15,
            zIndex: 1,
            animation: "ttBlinkRight 1s infinite ease-in-out",
          }}
        />
        {/* ボタン部とボディを分ける横線 */}
        <div
          style={{
            position: "absolute",
            top: "45%",
            left: 0,
            width: "100%",
            height: 2,
            background: "rgba(0,229,255,.6)",
          }}
        />
        {/* 左右ボタンを分ける縦線 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            width: 2,
            height: "45%",
            background: "rgba(0,229,255,.6)",
            transform: "translateX(-50%)",
          }}
        />
        {/* スクロールホイール */}
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "50%",
            width: 6,
            height: 12,
            border: "2px solid rgba(0,229,255,.6)",
            borderRadius: 3,
            transform: "translateX(-50%)",
            zIndex: 2,
            background: "#0a0a12",
          }}
        />
      </div>
    </div>
  );
}
