# 表情アセット仕様（福笑い方式 Ver.3.0）

キャラクターごとに `public/characters/{characterId}/` を作り、その直下に
`parts.json`（パーツマニフェスト）を置くと福笑い方式の顔ワイプが有効になります。
`parts.json` が無いキャラクターは従来の `expression/{表情}/brow|eye|mouth.png`
フォルダ方式で描画されます（後方互換）。

## ディレクトリ構成

```
public/characters/nanami/
├── parts.json              ← パーツマニフェスト（このファイルが本仕様の中心）
├── base/
│   └── face.png            ← ベース立ち絵（座標系の基準になる画像）
├── parts/
│   ├── brow/normal.png …   ← 眉差分（透過PNG）
│   ├── eye/smile.png  …    ← 目差分
│   ├── mouth/smile.png …   ← 口差分
│   └── other/sweat.png …   ← 汗・赤面など
├── video/
│   └── pose_change.webm    ← 表情動画（VP9 透過webm）
├── lighting/…              ← （任意）照明オーバーレイ
└── effects/…               ← （任意）全面エフェクトPNG
```

## 座標の規約（ピボット）

- `x`, `y` は **ベース画像（base/face.png）のピクセル座標**。
- パーツ画像の **左上角（赤十字ピボット）** をその座標に置きます。
- パーツPNGはベース画像と同じ解像度スケールで書き出せば `w` は不要です。
  異なるスケールで書き出した場合のみ、`w`（ベース画像px単位の表示幅）を指定してください。

## parts.json の書式

```jsonc
{
  // ベース画像のピクセルサイズ（座標系の基準）
  "canvas": { "width": 400, "height": 500 },
  "base": "base/face.png",          // 省略可（デフォルト同値）

  "parts": {
    "eye": {
      // ステート名: { 画像パス, ピボットX, ピボットY }
      "smile":  { "src": "parts/eye/smile.png",  "x": 132, "y": 155 },
      "closed": { "src": "parts/eye/closed.png", "x": 132, "y": 155 }
    },
    "mouth": { ... },
    "brow":  { ... },
    "other": { "sweat": { ... }, "blush": { ... } }
  },

  // シナリオの expression 名 → パーツ組み合わせ
  "presets": {
    "smile": { "eye": "smile", "mouth": "smile", "brow": "smile" },
    "troubled": { "eye": "normal", "mouth": "dissatisfaction", "brow": "normal", "other": ["sweat"] }
  }
}
```

## シナリオからの指定方法

```ts
// 従来どおりプリセット名で指定（presets を参照して展開される）
portrait: { expression: "smile", lighting: "normal", effects: [] }

// パーツを個別に上書き（プリセットより優先）
portrait: {
  expression: "smile",
  eyeState: "closed",           // 目だけ closed に差し替え
  otherStates: ["sweat"],
  lighting: "normal", effects: [],
}

// 表情動画（透過webm）
portrait: {
  expression: "smile",
  video: { src: "video/pose_change.webm", mode: "oneshot" },  // 1回再生→静止画へ復帰
  lighting: "normal", effects: [],
}
// mode: "loop" で印象的シーン用ループ再生（次の portrait 指定まで継続）
```

## 表情動画（webm）の注意

- VP9・アルファチャンネル付き webm（`alpha_mode=1`）を使用。
- Chrome / Edge / Firefox で透過再生可。**Safari は VP9 アルファ非対応**。
- 再生中は福笑いパーツとベースが非表示になり、動画が立ち絵全体を置き換えます
  （動画側に表情・ポーズが焼き込まれている前提）。
- `oneshot` は再生完了・再生エラー時に静止画＋パーツ表示へ自動復帰します。
