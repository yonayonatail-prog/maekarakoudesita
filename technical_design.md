# Technical Design — AssetPlacerGUI Scene Placement v1

## 1. 概要
AssetPlacerGUI において、動的かつ安全な「新規オブジェクト配置機能」を構築するための設計書。
本機能により、既存の `WorldObject` 中心設計を維持しながら、開発効率と将来的拡張性を両立させる。

## 2. アーキテクチャと依存関係

```
[assetTemplates.ts] (Template定義データ)
       │
       ▼
[ObjectListPanel.tsx] (UI) ──► クリック・イベント
       │
       ▼ [objectFactories.ts] (FactoryでWorldObject生成)
       │
       ▼ [useEditorStore.ts] (Zustandストアで状態追跡 & 保存)
```

### データ・フローと役割分担
1. **データ駆動設計**:
   具体的なアセット（Character、Furniture、Backgroundなど）の名前やIDは `src/editor/assetTemplates.ts` に独立した配列として定義し、UIに動的に結合する。これによりコードへのハードコーディングを一切排除する。
2. **Factoryパターン**:
   `src/editor/objectFactories.ts` にて `WorldObject` の共通初期値の設定と、一意のオブジェクトID（`${prefix}_${timestamp}_${rand}`）の生成を一括で行う。
3. **Zustandストア状態管理**:
   ストアに `addWorldObject` を定義し、状態更新、自動保存（`scheduleSave`）、Undo/Redoスタックの連動を処理する。

## 3. インターフェース

### 型定義の拡張 (`src/types/index.ts`)
```typescript
export interface WorldObject {
  // ...既存のフィールド
  assetId?: string; // アセットテンプレートID (将来拡張用、現段階ではオプション)
}
```

### Factory関数 (`src/editor/objectFactories.ts`)
```typescript
export function createWorldObject(label: string, assetId?: string): WorldObject;
```

### ストアアクション (`src/editor/useEditorStore.ts`)
```typescript
addWorldObject(object: WorldObject): void;
```

## 4. 特筆すべき技術的配慮
* **ID衝突回避**: 同一ミリ秒での連続オブジェクト追加でも衝突が起こらないよう、タイムスタンプに加えて4桁のランダムな36進数を結合したセキュアなID生成を行う。
* **状態整合性**: 新規オブジェクトを追加した直後は、直ちにそのオブジェクトが自動選択状態（`selectedObjectId`）になり、座標編集パネル等がシームレスに機能するように制御する。
* **既存セーブデータ・エクスポートとの互換性**: `assetId` をオプションフィールドにしたため、既存データに非破壊的であり、かつ JSON のシリアライズにもそのまま適合する。
