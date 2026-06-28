# matsuba

原稿管理Webアプリ。散文・詩など複数ジャンルの原稿のバージョン管理・執筆ログ・レイアウト整形を行う。

## セットアップ

```bash
npm install
npm run dev
```

## 開発コマンド

| コマンド | 内容 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run typecheck` | 型チェック |
| `npm run lint` | Lintチェック |

## 技術スタック

- React 18 + TypeScript
- Zustand（状態管理）
- Tiptap（リッチテキストエディタ）
- IndexedDB（ローカルDB）
- Vite（ビルドツール）

## フェーズ

- **Phase 1（現在）**: コア機能 — 原稿管理・バージョン管理・3ペイン表示・執筆ログ・タグ
- **Phase 2**: エディタ強化 — リッチテキスト・縦書き・ルビ・PDF出力
- **Phase 3**: 拡張 — クラウド連携・Electron・React Native

## ディレクトリ構成

```
src/
├── types/        # 全型定義
├── store/        # Zustandストア
├── db/           # IndexedDB操作
├── hooks/        # カスタムフック
└── components/   # Reactコンポーネント
    ├── Sidebar/
    ├── Editor/
    ├── VersionPanel/
    ├── Log/
    ├── Settings/
    └── common/
```

## 設計書

`design-spec.md` を参照。
