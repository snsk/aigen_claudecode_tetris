# Claude Code Development Guidelines

## テスト駆動開発フロー

このプロジェクトでは、以下の開発フローを遵守してください：

### 1. 修正前の確認
- 変更を加える前に、現在のテスト状態を確認
```bash
npm test -- --run
```

### 2. 変更実施
- コードの修正やリファクタリングを実施
- 新機能追加時は、対応するテストも作成

### 3. テスト実行
- 変更後は必ずテストを実行
```bash
npm test -- --run
```

### 4. テスト失敗時の対応
- 失敗したテストを確認し、修正
- 既存の機能を壊していないか確認

### 5. ビルド確認
- テストがパスしたら、ビルドも確認
```bash
npm run build
```

## 重要なコマンド

### テスト関連
- `npm test` - テストをウォッチモードで実行
- `npm test -- --run` - テストを一回だけ実行
- `npm run test:ui` - Vitest UIでテストを確認

### ビルド・開発
- `npm run dev` - 開発サーバーを起動
- `npm run build` - プロダクションビルド
- `npm run preview` - ビルド結果をプレビュー

### コード品質
- `npm run lint` - ESLintでコード品質チェック
- `npm run typecheck` - TypeScriptの型チェック
- `npm run format` - Prettierでコードフォーマット

## テスト追加のガイドライン

新機能を追加する際は、以下の種類のテストを検討してください：

1. **ユニットテスト** - 個々の関数やクラスの動作
2. **統合テスト** - 複数のコンポーネントの連携
3. **エッジケース** - 境界値や異常系の処理

テストファイルは `src/**/__tests__/` ディレクトリに配置してください。

## 現在のテスト構成

- `src/core/__tests__/board.test.ts` - ボード関連のテスト
- `src/core/__tests__/piece.test.ts` - ピース関連のテスト
- `src/core/__tests__/bag.test.ts` - 7-bagアルゴリズムのテスト
- `src/core/__tests__/game.test.ts` - ゲームロジック全体のテスト

## 注意事項

- コミット前には必ず `npm run lint` と `npm run typecheck` を実行
- プルリクエスト作成前には全てのテストがパスすることを確認
- 新機能には必ず対応するテストを追加