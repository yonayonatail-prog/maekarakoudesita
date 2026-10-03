import { Component, Suspense, useEffect, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import { PRELOAD_GLB_ASSETS, markGlbLoaded } from "../lib/assetPreloader";

// =============================================================
// TitleGlbPreloader — タイトル画面滞在中に本編GLBを先読みする層。
// three.js / @react-three/drei への依存をここに閉じ込め、
// TitleScreen 自体は動的 import(lazy) 経由でしか触れないようにする。
// これにより初回表示（ロゴ描画）が three.js のダウンロード・パースを
// 待たなくて済む。
// =============================================================

function GlbMarker({ url }: { url: string }) {
  useGLTF(url);
  useEffect(() => {
    markGlbLoaded(url);
  }, [url]);
  return null;
}

class GlbErrorBoundary extends Component<
  { url: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn(`[TitleScreen] GLB 先読み失敗: ${this.props.url}`, error);
    markGlbLoaded(this.props.url);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function TitleGlbPreloader() {
  return (
    <>
      {PRELOAD_GLB_ASSETS.map((asset) => (
        <GlbErrorBoundary key={asset.url} url={asset.url}>
          <Suspense fallback={null}>
            <GlbMarker url={asset.url} />
          </Suspense>
        </GlbErrorBoundary>
      ))}
    </>
  );
}
