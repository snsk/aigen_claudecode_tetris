# Marathon Tetris

Tetris Design Guideline準拠のマラソン専用テトリスゲームです。低スペックPCでも60fpsを維持しながら、リッチなビジュアルエフェクトを実現しています。

## 特徴

- **Tetris Design Guideline準拠**
  - SRS（Super Rotation System）回転系
  - 7-Bagランダマイザー
  - 500msロックディレイ
  - ガイドライン準拠の色彩とゲームルール

- **パフォーマンス最適化**
  - Intel UHD 620相当のGPUで60fps維持
  - WebGL/Canvas2D自動フォールバック
  - メモリ使用量：JSヒープ32MB以下

- **アクセシビリティ**
  - 高コントラストな配色
  - 色覚多様性に配慮したデザイン
  - PWA対応でオフラインプレイ可能

## ビルド手順

### 必要環境
- Node.js 18.0.0以上
- npm または pnpm

### インストール
```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# ビルドのプレビュー
npm run preview
```

### ローカル実行
ビルド後、`dist/index.html`をダブルクリックすることで、ローカル環境でもゲームを起動できます。

## 操作方法

| キー | 動作 |
|------|------|
| ← → | 左右移動 |
| ↓ | ソフトドロップ |
| ↑ または X | 時計回り回転 |
| Z | 反時計回り回転 |
| C | ホールド |
| Space | ハードドロップ |
| P | 一時停止 |

## ゲームルール

- **目標**: 999ライン消去でゲームクリア
- **レベルアップ**: 10ライン消去ごと（最大レベル29）
- **スコアリング**:
  - シングル: 100点
  - ダブル: 300点
  - トリプル: 500点
  - テトリス: 800点（Back-to-Backで1.5倍）
  - コンボボーナスあり

## 技術仕様

- **フレームワーク**: PixiJS v8（WebGL/Canvas2D）
- **言語**: TypeScript（ES2022）
- **ビルドツール**: Vite + ESBuild
- **バンドルサイズ**: 150KB以下（gzip圧縮時）

## 参考資料

- [Tetris Guideline - Tetris Wiki](https://tetris.wiki/Tetris_Guideline)
- [Super Rotation System - Tetris Wiki](https://tetris.wiki/Super_Rotation_System)

## ライセンス

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.