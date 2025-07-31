# aigen_claudecode_tetris


```markdown

# プロジェクト概要
PC の GPU 性能が低い環境でも 60 fps を維持しながら、リッチなビジュアルを持つ「マラソン専用テトリス」を開発してください。ルールは TGM などの派生ではなく **Tetris Design Guideline**（以下「ガイドライン」）準拠とします。

# 要求
・ルートに配置された index.html をダブルクリックしてゲームを起動します
・この環境において、エラーが発生しないことを厳重にチェックすること

---

## 使用技術・ライブラリ
1. **レンダラ**  
   - デフォルト: **PixiJS v8** を WebGL モードで使用し、WebGL 非対応環境は自動で Canvas2D にフォールバックさせます。  
   - ピクセルアートを前提に最近の GPU であれば WebGPU パスへの拡張を視野に入れてください。
2. **パーティクル／エフェクト**  
   - PixiJS 付属の `ParticleContainer` で大多数の演出を賄い、より動的な演出は **tsparticles** など 30 KB 以下のライブラリで補完してください。  
3. **開発言語／環境**  
   - **TypeScript**（ES2022）  
   - **Vite** + ESBuild でバンドル（最終バンドル < 150 KB gzip）  
   - ESLint・Prettier・Vitest を導入し CI で静的解析と単体テストを実行します。

---

## 機能要件
| 区分 | 詳細 |
|------|------|
| ゲームモード | **マラソンのみ**（消去ライン数で LvUP、Lv29 相当で 999 Lines 完走をゲームクリアとみなします） |
| ルール | ガイドライン準拠<br>– **SRS 回転系**・**7-Bag ランダマイザ**・**Lock Delay = 500 ms**・**ARE/Line Clear Delay なし**<br>– ソフト/ハードドロップ両対応 |
| UI 要素 | 10 × 20 フィールド（隠し行 2）／Next 5／Hold 1／Score・Level・Lines／FPS インジケータ |
| 操作 | キーボード: ←→↓ ↑=回転 (CW) Z/X=CCW/CW C=Hold Space=HardDrop P=一時停止<br>タッチ操作はオプション実装 |

---

## 非機能要件
- **パフォーマンス**: Intel UHD 620 相当で 60 fps（Canvas フォールバック時 40 fps 以上）  
- **メモリ**: JS ヒープ 32 MB 以下・テクスチャ合計 48 MB 以下  
- **アクセシビリティ**: 色覚多様性に配慮し、Tetromino 色は高コントラスト + 形状判別枠を付与  
- **オフライン対応**: Service Worker でアセットをキャッシュし、PWA に対応  

---

## 基本アーキテクチャ

src/  
├─ core/ # ゲームロジック (TypeScript)  
│ ├─ board.ts # 行列状態・衝突判定  
│ ├─ piece.ts # テトロミノ座標/SRS kick  
│ ├─ bag.ts # 7-Bag RNG  
│ └─ game.ts # ステートマシン & イベント  
├─ renderer/ # PixiJS シーン  
├─ ui/ # スコア・パネル類 (PixiJS + DOM 組み合わせ可)  
└─ main.ts # エントリポイント・DI

- **Game Loop**: `requestAnimationFrame` + 固定Δt のロジック更新。  
- **ECS/MVC** いずれかを採用し、ロジックと描画を疎結合に保ちます。  
- **状態管理**: Redux Toolkit Lite または Zustand を任意で利用可。

---

## グラフィック & エフェクト指針
1. **Line Clear**: 背景をフェード → ブラー → パーティクル閃光（50 ms）  
2. **T-Spin / Back-to-Back**: 紫系グロー + 星形パーティクル 80 個以内  
3. **Combo**: 2 連鎖以上で Combo 表示をスケールアップ演出  
4. **ゲーム開始／終了**: αフェードイン・アウト（200 ms）  
> **重要**: パーティクル総数は同時 300 未満。PixiJS `ParticleContainer` でバッチ描画し、低性能環境では opacity と数を半減させてください。

---

## テスト & デバッグ
- **ユニットテスト**: SRS キックテーブル／行消去判定／7-Bag 排出順の確率テスト  
- **E2E**: Playwright で 1,000 Line 完走シナリオを自動プレイし FPS を測定  
- **ガイドライン準拠**: Tetris Wiki の SRS 定義と比較し、回転挙動をスナップショットテストすること。

---

## ビルド & デプロイ
1. `pnpm install && pnpm build` で Release ビルドを生成  
2. GitHub Actions で `gh-pages` へ自動デプロイし、リリースタグに Changelog を付与  
3. `npm run profile` で `source-map-explorer` によりバンドルサイズを確認

---

## 納品物
- 完全な GitHub リポジトリ（MIT ライセンス）  
- `/public` 内に 256 × 256 と 512 × 512 の PWA アイコン  
- README（日本語）にビルド手順・キーバインド・ガイドライン引用元 URL を記載してください

---

### 追加ガイド
- コードは **JSDoc + TypeScript の型安全** を徹底し、AI が後続改修可能な形でコメントを多めに残してください。  
- ハード依存は避け、レンダラ層はインターフェイス経由で差し替え可能にしてください。  
- CSS は Tailwind 3 系を利用し、UI 部品はできる限り Semantic HTML を優先してください。
```
