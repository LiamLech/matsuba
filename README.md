# matsuba

散文・詩など複数ジャンルの原稿を管理するための執筆専用Webアプリ。バージョン管理・執筆ログ・レイアウト整形を中核機能とし、将来的にデスクトップ・モバイルアプリへの展開を見据えて設計しています。

## 現在のステータス

**Phase 1 完了**

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## 開発コマンド

| コマンド | 内容 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run typecheck` | 型チェック |
| `npm run lint` | Lintチェック |

## 技術スタック

| 役割 | 技術 |
|------|------|
| UIフレームワーク | React 18 + TypeScript |
| 状態管理 | Zustand |
| リッチテキストエディタ | Tiptap（Phase 2で導入） |
| ローカルDB | IndexedDB |
| ZIPバックアップ | JSZip |
| ビルドツール | Vite |

## 実装済み機能（Phase 1）

- 原稿の作成・編集・削除・リネーム
- バージョン保存・履歴表示
- 1〜3ペイン並列表示・同期スクロール
- 自動保存（IndexedDB）
- ドラッグ＆ドロップ並べ替え・ソート
- タグ付け（カテゴリ内排他選択）・タグフィルタ
- レイアウトプリセット適用・縦書き横書き切り替え
- .txt / .md エクスポート
- ZIPバックアップ（全原稿・単体）
- 設定画面（タグ管理・プリセット管理・クラウド設定枠）
- 執筆ログ（タイムライン・週・月・年カレンダー）
- ログから原稿へのジャンプ
- 未保存マーカー
- ショートカットキー

## ショートカットキー

| 操作 | Windows | Mac |
|------|---------|-----|
| バージョン保存 | `Ctrl+S` | `Cmd+S` |
| 全体バックアップ | `Ctrl+Shift+S` | `Cmd+Shift+S` |
| 編集モード | `Ctrl+1` | `Cmd+1` |
| ログモード | `Ctrl+2` | `Cmd+2` |
| 設定モード | `Ctrl+3` | `Cmd+3` |
| 1ペイン | `Ctrl+Shift+1` | `Cmd+Shift+1` |
| 2ペイン | `Ctrl+Shift+2` | `Cmd+Shift+2` |
| 3ペイン | `Ctrl+Shift+3` | `Cmd+Shift+3` |

## ディレクトリ構成

```
src/
├── types/           # 全型定義
├── store/           # Zustandストア
│   ├── manuscriptStore.ts
│   ├── tagStore.ts
│   ├── layoutStore.ts
│   └── uiStore.ts
├── db/              # IndexedDB操作
├── hooks/           # カスタムフック
│   ├── useAutoSave.ts
│   ├── useEditLog.ts
│   ├── useExport.ts
│   ├── useBackup.ts
│   └── useScrollSync.ts
└── components/
    ├── common/      # Header, Modal, CharCount
    ├── Sidebar/     # 原稿一覧・タグフィルタ
    ├── Editor/      # エディタ・ペイン・バージョンパネル
    ├── Log/         # タイムライン・カレンダービュー
    └── Settings/    # タグ管理・プリセット管理・クラウド設定
```

## 開発ロードマップ

```
Phase 1（完了）
  原稿管理・バージョン管理・3ペイン表示・執筆ログ
  タグ・エクスポート・ZIPバックアップ・設定画面

Phase 2（予定）
  リッチテキストエディタ（Tiptap）
  縦書きの本格対応・ルビ入力
  レイアウトプリセットのカスタマイズ強化
  参考画像添付・PDF出力
  カレンダービューの強化

Phase 3（予定）
  Markdown ↔ リッチテキスト切り替え
  Dropbox / Google Drive API連携
  Electronデスクトップ版
  React Nativeモバイル版（検討）
```

## 設計書

[design-spec.md](./design-spec.md) を参照してください。
