import { useEffect, useRef, useState, type ReactNode } from "react";

interface CreditAsset {
  name: string;
  creator: string;
  url: string;
  license: string;
}

interface CreditsData {
  title: string;
  subtitle: string;
  year: string;
  staff: Array<{ role: string; name: string }>;
  author: { message: string; x: string };
  assets: CreditAsset[];
}

interface Props {
  onClose: () => void;
}

export function CreditsRoll({ onClose }: Props) {
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [done, setDone] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);

  useEffect(() => {
    fetch("/credits.json")
      .then((r) => r.json())
      .then(setCredits)
      .catch(() =>
        setCredits({
          title: "前からこうでした",
          subtitle: "MAEKARA KOUDE SHITA",
          year: "2025",
          staff: [],
          author: { message: "ありがとうございました。", x: "" },
          assets: [],
        })
      );
  }, []);

  useEffect(() => {
    if (!credits || !innerRef.current) return;
    const inner = innerRef.current;
    const viewH = inner.parentElement?.clientHeight ?? window.innerHeight;
    const contentH = inner.scrollHeight;
    // 60ms per px ≈ 映画字幕ペース
    const duration = Math.max(50000, (contentH + viewH) * 60);

    const anim = inner.animate(
      [
        { transform: `translateY(${viewH}px)` },
        { transform: `translateY(-${contentH}px)` },
      ],
      { duration, easing: "linear", fill: "forwards" }
    );
    animRef.current = anim;
    anim.onfinish = () => setDone(true);
    return () => anim.cancel();
  }, [credits]);

  const skip = () => {
    animRef.current?.finish();
    setDone(true);
  };

  return (
    <div
      className="fade-in"
      style={{
        position: "absolute",
        inset: 0,
        background: "#050505",
        overflow: "hidden",
        zIndex: 100,
      }}
    >
      {/* スクロール本体 */}
      <div
        ref={innerRef}
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(580px, 90vw)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          paddingBottom: 120,
          color: "var(--paper)",
          fontFamily: "inherit",
        }}
      >
        {credits && (
          <>
            {/* タイトルブロック */}
            <div style={{ textAlign: "center", marginBottom: 80, marginTop: 20 }}>
              <p style={{ fontSize: 11, letterSpacing: 6, opacity: 0.45, margin: "0 0 12px" }}>
                {credits.subtitle}
              </p>
              <h1 style={{ fontSize: 28, letterSpacing: 4, color: "var(--accent)", margin: "0 0 8px" }}>
                {credits.title}
              </h1>
              <p style={{ fontSize: 12, opacity: 0.35, margin: 0 }}>{credits.year}</p>
            </div>

            {/* スタッフ */}
            {credits.staff.length > 0 && (
              <Section>
                {credits.staff.map((s, i) => (
                  <StaffRow key={i} role={s.role} name={s.name} />
                ))}
              </Section>
            )}

            {/* 使用素材 */}
            {credits.assets.length > 0 && (
              <>
                <Divider label="使用素材" />
                <Section>
                  {credits.assets.map((a, i) => (
                    <AssetRow key={i} asset={a} />
                  ))}
                </Section>
              </>
            )}

            {/* 感謝メッセージ */}
            <div style={{ textAlign: "center", marginTop: 72, padding: "0 16px" }}>
              {credits.author.message.split("\n").map((line, i) => (
                <p key={i} style={{ fontSize: 13, opacity: 0.7, lineHeight: 2, margin: "4px 0" }}>
                  {line}
                </p>
              ))}
              {credits.author.x && (
                <p
                  style={{
                    marginTop: 24,
                    fontSize: 13,
                    color: "var(--accent)",
                    letterSpacing: 1,
                  }}
                >
                  {credits.author.x}
                </p>
              )}
            </div>

            {/* フィン */}
            <p
              style={{
                marginTop: 80,
                fontSize: 11,
                letterSpacing: 8,
                opacity: 0.3,
                textTransform: "uppercase",
              }}
            >
              fin
            </p>
          </>
        )}
      </div>

      {/* スキップボタン */}
      {!done && (
        <button
          onClick={skip}
          style={{
            position: "absolute",
            top: 20,
            right: 24,
            background: "transparent",
            color: "rgba(216,212,200,0.4)",
            border: "1px solid rgba(216,212,200,0.2)",
            borderRadius: 2,
            padding: "6px 18px",
            fontSize: 12,
            letterSpacing: 3,
          }}
        >
          SKIP
        </button>
      )}

      {/* タイトルへボタン（スクロール終了後） */}
      {done && (
        <div
          className="fade-in"
          style={{
            position: "absolute",
            bottom: 60,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "var(--paper)",
              border: "1px solid var(--accent)",
              borderRadius: 2,
              padding: "12px 40px",
              fontSize: 16,
              letterSpacing: 4,
            }}
          >
            タイトルへ
          </button>
        </div>
      )}
    </div>
  );
}

// ── 内部コンポーネント ──

function Section({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        padding: "0 8px",
        marginBottom: 48,
      }}
    >
      {children}
    </div>
  );
}

function StaffRow({ role, name }: { role: string; name: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 11, letterSpacing: 3, opacity: 0.45, margin: "0 0 6px", textTransform: "uppercase" }}>
        {role}
      </p>
      <p style={{ fontSize: 18, letterSpacing: 2, margin: 0 }}>{name}</p>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 16,
        margin: "24px 0 32px",
        padding: "0 8px",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "rgba(216,212,200,0.15)" }} />
      <span style={{ fontSize: 10, letterSpacing: 4, opacity: 0.4 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(216,212,200,0.15)" }} />
    </div>
  );
}

function AssetRow({ asset }: { asset: CreditAsset }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 14, margin: "0 0 4px", letterSpacing: 1 }}>{asset.name}</p>
      <p style={{ fontSize: 12, opacity: 0.55, margin: "0 0 2px" }}>{asset.creator}</p>
      <p style={{ fontSize: 10, opacity: 0.35, margin: 0, letterSpacing: 1 }}>{asset.license}</p>
    </div>
  );
}
