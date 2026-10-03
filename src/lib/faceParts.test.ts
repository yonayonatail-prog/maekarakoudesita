import { describe, it, expect } from "vitest";
import { resolvePartStates, lookupPartAsset, resolveCharacterAssetPath } from "./faceParts";
import type { CharacterPartsManifest, PortraitState } from "../types";

const manifest: CharacterPartsManifest = {
  canvas: { width: 400, height: 500 },
  parts: {
    eye: {
      normal: { src: "parts/eye/normal.png", x: 132, y: 155 },
      smile:  { src: "parts/eye/smile.png",  x: 132, y: 155 },
      closed: { src: "parts/eye/closed.png", x: 132, y: 155 },
    },
    mouth: {
      smile:           { src: "parts/mouth/smile.png",           x: 170, y: 300 },
      dissatisfaction: { src: "parts/mouth/dissatisfaction.png", x: 170, y: 300 },
    },
    brow: {
      angry: { src: "parts/brow/angry.png", x: 130, y: 120 },
    },
    other: {
      sweat: { src: "parts/other/sweat.png", x: 40, y: 60 },
    },
  },
  presets: {
    smile:    { eye: "smile", mouth: "smile" },
    troubled: { eye: "normal", mouth: "dissatisfaction", other: ["sweat"] },
  },
};

function portrait(over: Partial<PortraitState>): PortraitState {
  return { expression: "neutral", lighting: "normal", effects: [], ...over };
}

describe("resolvePartStates", () => {
  it("presets[expression] からパーツステートを展開する", () => {
    const r = resolvePartStates(portrait({ expression: "smile" }), manifest);
    expect(r).toEqual({ brow: undefined, eye: "smile", mouth: "smile", other: [] });
  });

  it("個別上書き（eyeState等）がプリセットより優先される", () => {
    const r = resolvePartStates(
      portrait({ expression: "smile", eyeState: "closed", browState: "angry" }),
      manifest,
    );
    expect(r.eye).toBe("closed");
    expect(r.brow).toBe("angry");
    expect(r.mouth).toBe("smile"); // 上書きされていないスロットはプリセット値
  });

  it("プリセットの other 配列が引き継がれ、otherStates 指定で上書きできる", () => {
    expect(resolvePartStates(portrait({ expression: "troubled" }), manifest).other)
      .toEqual(["sweat"]);
    expect(
      resolvePartStates(portrait({ expression: "troubled", otherStates: [] }), manifest).other,
    ).toEqual([]);
  });

  it("未定義のプリセット名は全スロット非表示（other は空配列）", () => {
    const r = resolvePartStates(portrait({ expression: "unknown_preset" }), manifest);
    expect(r).toEqual({ brow: undefined, eye: undefined, mouth: undefined, other: [] });
  });
});

describe("lookupPartAsset", () => {
  it("スロットとステート名からアセット定義を引く", () => {
    expect(lookupPartAsset(manifest, "eye", "smile")?.src).toBe("parts/eye/smile.png");
  });

  it("ステート未指定・未定義ステートは null", () => {
    expect(lookupPartAsset(manifest, "eye", undefined)).toBeNull();
    expect(lookupPartAsset(manifest, "eye", "no_such_state")).toBeNull();
    expect(lookupPartAsset(manifest, "brow", "smile")).toBeNull();
  });
});

describe("resolveCharacterAssetPath", () => {
  it("相対パスはキャラクターディレクトリ配下に解決される", () => {
    expect(resolveCharacterAssetPath("nanami", "video/pose.webm"))
      .toBe("/characters/nanami/video/pose.webm");
  });

  it('"/"始まりは public 直下としてそのまま使う', () => {
    expect(resolveCharacterAssetPath("nanami", "/shared/video/pose.webm"))
      .toBe("/shared/video/pose.webm");
  });
});
