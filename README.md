# 前からこうでした

React / TypeScript / React Three Fiber で制作中のブラウザゲームです。

## 開発環境

Node.js と npm、Git LFS をインストールしてから実行してください。

```sh
git lfs pull
npm ci
npm run dev
```

```sh
npm run build
npm run test
```

## 保存内容

2026-10-03 時点の制作途中のスナップショットです。ソースコード、仕様書、アプリと開発用エディタが参照する実行用アセットを含みます。

保存時の `npm run build` は `src/store/gameStore.ts:653` の型エラー（`portrait.expression` が `undefined` になり得る）で失敗しています。制作途中の状態をそのまま保存しています。

3D モデルと動画は Git LFS で管理しています。依存パッケージ、ビルド出力、ローカル設定、未使用素材、Blender の制作ファイル、確認画像、作業スクリプトは `.gitignore` で除外しています。新しい素材をアプリから使う際は、該当する除外ルールを解除してください。

素材の出典・利用条件は同梱のクレジットや各素材の記録を確認してください。
