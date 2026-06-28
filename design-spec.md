# matsuba 設計書

**バージョン:** 0.4（Phase 1完了）
**作成日:** 2026年6月
**ステータス:** Phase 1完了・Phase 2設計中

---

## 1. プロジェクト概要

### 目的
散文・詩など複数ジャンルの原稿を管理するための執筆専用Webアプリ。バージョン管理・執筆ログ・レイアウト整形を中核機能とし、将来的にデスクトップ・モバイルアプリへ展開することを見据えて設計する。

### 対応環境
| 環境 | フェーズ |
|------|----------|
| Webブラウザ（Chrome / Safari / Firefox） | Phase 1〜 |
| Windows / Mac / Android / iPhone | Phase 1〜（ブラウザ経由） |
| デスクトップアプリ（Electron） | Phase 3 |
| モバイルアプリ（React Native） | Phase 3（検討） |

---

## 2. 技術スタック

| 役割 | 技術 | 選定理由 |
|------|------|----------|
| UIフレームワーク | React + TypeScript | クロスプラットフォーム展開のしやすさ、共同開発での可読性 |
| 状態管理 | Zustand | 軽量・シンプル、後にReduxへ移行も可能 |
| リッチテキストエディタ | Tiptap（Phase 2） | ルビ・縦書きのカスタム拡張が可能、Markdown変換対応 |
| ローカルDB | IndexedDB | localStorageより大容量・高速、Electron移行時もそのまま使用可能 |
| ZIPバックアップ | JSZip | ブラウザ上でのフォルダ構造付きZIP生成 |
| PDF出力 | react-pdf（Phase 2） | — |
| クラウド連携 | Dropbox API / Google Drive API（Phase 3） | 当初はローカルファイル経由でDropbox・Driveの自動同期を利用 |

### バージョンのcontent形式
Phase 1ではプレーンテキスト（string）。Phase 2でTiptap JSON（ProseMirrorドキュメント形式）に移行する。

---

## 3. 機能要件

### Phase 1 — コア機能（完了）

| # | 機能 | 状態 |
|---|------|------|
| 1 | 原稿の作成・編集・削除・リネーム | ✅ |
| 2 | バージョン保存・履歴管理 | ✅ |
| 3 | 3ペイン並列表示・同期スクロール | ✅ |
| 4 | 手動ドラッグ＋ソート | ✅ |
| 5 | 執筆ログ（秒単位記録・タイムライン・カレンダー） | ✅ |
| 6 | タグ管理（カテゴリ内排他選択） | ✅ |
| 7 | レイアウトプリセット適用 | ✅ |
| 8 | 縦書き・横書き切り替え（原稿ごと） | ✅ |
| 9 | 文字数表示オン/オフ | ✅ |
| 10 | IndexedDBへの自動保存 | ✅ |
| 11 | .txt / .md エクスポート | ✅ |
| 12 | ZIPバックアップ（全原稿・単体） | ✅ |
| 13 | 設定画面（タグ・プリセット・クラウド枠） | ✅ |
| 14 | 未保存マーカー | ✅ |
| 15 | ショートカットキー | ✅ |
| 16 | ログから原稿へのジャンプ | ✅ |

### Phase 2 — エディタ強化（予定）

| # | 機能 | 概要 |
|---|------|------|
| 17 | リッチテキストエディタ（Tiptap） | 太字・見出し・リストなどの書式 |
| 18 | 縦書きの本格対応 | CSS writing-modeとTiptapの統合 |
| 19 | レイアウトプリセットのカスタマイズ強化 | Tiptap連携 |
| 20 | ルビ入力（4種の入力方法） | 記法・ダイアログ・ショートカット・ツールバー |
| 21 | 参考画像添付 | 原稿ごとにサイドパネルで管理 |
| 22 | PDF出力 | 縦書き・ルビ対応 |
| 23 | カレンダービューの強化 | 原稿ごとのフィルタ |

### Phase 3 — 拡張（予定）

| # | 機能 | 概要 |
|---|------|------|
| 24 | Markdown ↔ リッチテキスト切り替え | エディタモードの切り替え |
| 25 | Dropbox API連携 | APIキーを設定画面で入力し自動同期 |
| 26 | Google Drive API連携 | 同上 |
| 27 | Electronデスクトップ版 | Reactコードを流用 |
| 28 | React Nativeモバイル版 | 検討 |

---

## 4. データ構造

```typescript
// 原稿
type Manuscript = {
  id: string
  title: string
  createdAt: number              // Unixタイムスタンプ（秒）
  updatedAt: number
  order: number                  // 手動ドラッグ並べ替え用
  direction: 'horizontal' | 'vertical'
  layoutId: LayoutPresetId
  tags: TagId[]
  attachments: Attachment[]      // 参考画像（Phase 2）
  versions: Version[]
  logs: EditLog[]
  currentContent: string         // 現在編集中のコンテンツ
}

// バージョン
type Version = {
  id: string
  label: string                  // 「初稿」「第二稿」など（表示用）
  content: string                // Phase 1: プレーンテキスト / Phase 2: Tiptap JSON
  savedAt: number
  note: string
  charCount: number
}

// 執筆ログ（セッション単位）
type EditLog = {
  id: string
  startedAt: number              // 秒単位
  endedAt: number
  charCountDelta: number
}

// タグカテゴリ
type TagCategory = {
  id: string
  label: string
  color: string
  tags: Tag[]
}

// タグ（カテゴリ内で排他選択）
type Tag = {
  id: string
  categoryId: string
  label: string
  color: string
}

// レイアウトプリセット
type LayoutPreset = {
  id: string
  label: string
  isBuiltIn: boolean
  lineHeight: number
  fontSize: number
  indent: 'none' | '1em' | '2em'
  alignment: 'left' | 'center' | 'right' | 'justify'
  letterSpacing: number
  paragraphSpacing: number
}
```

---

## 5. UI構成

### 全体レイアウト

```
┌─────────────────────────────────────────────────────────┐
│  ヘッダー（matsuba・ペイン数・同期・バックアップ・モード）  │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│サイドバー │  メインエリア（表示モードによって切り替わる）    │
│          │                                              │
│・原稿一覧 │  [編集モード] 1〜3ペインのエディタ            │
│・ソート   │  [ログモード]  タイムライン / カレンダー       │
│・タグ    │  [設定モード]  タグ・プリセット・クラウド設定   │
│  フィルタ │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 編集モード（ペイン構成）

```
ペイン数ボタン：[ □ ]  [ □□ ]  [ □□□ ]

┌───────────────┬───────────────┬───────────────┐
│ 原稿A ▼ 現在版▼│ 原稿B ▼ 現在版▼│ 原稿A ▼ 第二稿▼│
├───────────────┼───────────────┼───────────────┤
│               │               │               │
│  エディタ      │  エディタ      │  読み取り専用  │
│               │               │               │
├───────────────┼───────────────┼───────────────┤
│ 散文 | 文字数  │               │               │
│ 書き出し▾ 履歴 │               │               │
│ 設定⚙         │               │               │
└───────────────┴───────────────┴───────────────┘
```

### ログモード

```
[ タイムライン ] [ カレンダー ]

タイムライン：日付でグループ化、セッション一覧、原稿名クリックで編集画面にジャンプ
カレンダー：週・月・年の3粒度切り替え
```

---

## 6. コンポーネント構成

```
src/
├── types/
│   └── index.ts
├── store/
│   ├── manuscriptStore.ts
│   ├── tagStore.ts
│   ├── layoutStore.ts
│   └── uiStore.ts
├── db/
│   └── index.ts
├── hooks/
│   ├── useAutoSave.ts
│   ├── useEditLog.ts
│   ├── useExport.ts
│   ├── useBackup.ts
│   └── useScrollSync.ts
└── components/
    ├── common/
    │   ├── Header.tsx
    │   ├── Modal.tsx
    │   └── CharCount.tsx
    ├── Sidebar/
    │   ├── Sidebar.tsx
    │   ├── ManuscriptList.tsx
    │   ├── ManuscriptItem.tsx
    │   └── TagFilter.tsx
    ├── Editor/
    │   ├── PaneContainer.tsx
    │   ├── EditorPane.tsx
    │   ├── PaneHeader.tsx
    │   ├── SimpleEditor.tsx        # Phase 2でTiptapに置き換え
    │   ├── VersionPanel.tsx
    │   ├── ExportMenu.tsx
    │   └── ManuscriptDetailPanel.tsx
    ├── Log/
    │   ├── LogView.tsx
    │   ├── Timeline.tsx
    │   └── CalendarView.tsx
    └── Settings/
        ├── SettingsView.tsx
        ├── TagManager.tsx
        ├── LayoutPresetEditor.tsx
        └── CloudSettings.tsx
```

---

## 7. 状態管理（uiStore）

```typescript
type PaneState = {
  manuscriptId: string | null
  versionId: string | null        // nullなら現在編集中の版
}

type UIState = {
  paneCount: 1 | 2 | 3
  panes: [PaneState, PaneState, PaneState]  // 常に3つ保持
  activePaneIndex: 0 | 1 | 2
  viewMode: 'editor' | 'log' | 'settings'
  scrollSynced: boolean
  charCountVisible: boolean
}
```

---

## 8. タグの初期カテゴリ

カテゴリ内で排他選択（1カテゴリにつき1タグまで付与可能）。

| カテゴリ | 初期タグ |
|----------|----------|
| ジャンル | 詩・散文・エッセイ・随筆・評論・脚本・その他 |
| 状態 | アイデア・執筆中・推敲中・完成・保留 |
| 公開先 | 未定・同人・商業・Web・非公開 |

---

## 9. ルビ仕様（Phase 2）

### 入力記法
`{薔薇|ばら}` 形式を採用。

### 入力方法（4種併用）
| 方法 | 操作 |
|------|------|
| ショートカット | テキストを選択 → `Ctrl+R`（Mac: `Cmd+R`）→ ダイアログ |
| 右クリックメニュー | テキストを選択 → 右クリック →「ルビを追加」|
| ツールバーボタン | テキストを選択 → ツールバーの「ルビ」ボタン |
| 記法の直接入力 | `{薔薇|ばら}` と入力した瞬間に自動変換 |

### 表示設定
- デフォルト：グループルビ
- 縦書き時はルビを文字の右に表示（CSSで自動制御）

---

## 10. レイアウトプリセット（初期値）

| プリセット | 用途 | 主な設定 |
|-----------|------|----------|
| 散文 | 小説・エッセイ | 段落インデントあり、行間1.9、両端揃え |
| 詩 | 詩・歌詞 | インデントなし、行間2.4、左揃え |
| 原稿用紙 | 縦書き原稿 | 縦書き、行間2.0 |

組み込みプリセットは削除不可（`isBuiltIn: true`）。カスタムプリセットは自由に作成・削除可能。

---

## 11. カレンダービュー仕様

週・月・年の3粒度を切り替え可能。

| ビュー | 表示内容 |
|--------|----------|
| 週 | 縦軸（時間）×横軸（曜日）。執筆セッションをブロックで表示 |
| 月 | 1ヶ月のカレンダー。執筆した日をマーク。日付クリックでセッション詳細 |
| 年 | 365日をグリッドで並べて表示。執筆量を色の濃さで表現 |

---

## 12. ローカルファイルの命名規則

**D案（フォルダ分け＋バージョン管理）** を採用。

```
matsuba_backup_YYYYMMDD.zip
  薔薇について/
    current.md
    v01_20260615.md
    v02_20260622.md
```

- 原稿ごとにフォルダを作成
- `current.md` は常に最新の編集内容
- バージョンは `v01`, `v02`... 形式（ゼロパディング）
- タイトルが長い場合は先頭20文字を上限（設定で変更可能）

---

## 13. ショートカットキー（固定・Phase 1実装済み）

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

Phase 2以降でカスタマイズ対応を検討。

---

## 14. 未確定事項・今後の検討

| 項目 | 内容 |
|------|------|
| PDF出力のレイアウト | 縦書き・ルビを含むPDF生成の実装方法（Phase 2で詳細設計） |
| Electronへの移行タイミング | Phase 3の優先順位 |
| モバイルアプリの方式 | React NativeかPWAか |
| ショートカットのカスタマイズ | Phase 2以降で設定画面に追加 |

---

## 15. 開発フェーズ概要

```
Phase 1（完了）
  原稿管理・バージョン管理・3ペイン表示・同期スクロール
  執筆ログ・タグ・ドラッグ並べ替え・自動保存
  .txt / .md エクスポート・ZIPバックアップ
  設定画面・未保存マーカー・ショートカットキー

Phase 2（予定）
  リッチテキストエディタ（Tiptap）・縦書き本格対応
  レイアウトプリセット強化・ルビ入力
  参考画像添付・PDF出力

Phase 3（予定）
  Markdown ↔ リッチテキスト切り替え
  Dropbox / Google Drive API連携
  Electronデスクトップ版・React Nativeモバイル版
```
