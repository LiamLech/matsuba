# matsuba 設計書

**バージョン:** 0.6（Phase 2完了）
**作成日:** 2026年6月
**ステータス:** Phase 2完了・Phase 3設計中

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
| 状態管理 | Zustand | 軽量・シンプル |
| リッチテキストエディタ | Tiptap 2.10.4（ProseMirror基盤） | ルビのカスタム拡張が可能、Markdown変換対応 |
| ローカルDB | IndexedDB（DB Version 3） | localStorageより大容量・高速 |
| ZIPバックアップ | JSZip | ブラウザ上でのフォルダ構造付きZIP生成 |
| PDF出力 | window.print()（新規ウィンドウ方式） | 確認・共有用途。Phase 3でreact-pdfに移行予定 |
| クラウド連携 | Dropbox API / Google Drive API（Phase 3） | — |

### コンテンツ形式
- **currentContent**：Tiptap JSON（ProseMirrorドキュメント形式）
- **currentContentText**：Markdown文字列（エクスポート・バックアップ・検索用）
- 両方を常に同時保存する設計

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
| 8 | 縦書き・横書き切り替え（簡易版） | ✅ |
| 9 | 文字数表示オン/オフ | ✅ |
| 10 | IndexedDBへの自動保存 | ✅ |
| 11 | .txt / .md エクスポート | ✅ |
| 12 | ZIPバックアップ（全原稿・単体） | ✅ |
| 13 | 設定画面（タグ・プリセット・クラウド設定枠） | ✅ |
| 14 | 未保存マーカー | ✅ |
| 15 | ショートカットキー | ✅ |
| 16 | ログから原稿へのジャンプ | ✅ |

### Phase 2 — エディタ強化（完了）

| # | 機能 | 状態 |
|---|------|------|
| 17 | Tiptap導入・基本リッチテキスト | ✅ |
| 18 | Tiptap JSON＋Markdown併用保存 | ✅ |
| 19 | ルビ入力（4種の入力方法・グループルビ） | ✅ |
| 20 | レイアウトプリセット強化（CSSカスタムプロパティ連携） | ✅ |
| 21 | PDF出力（window.print()方式・確認共有用） | ✅ |
| 22 | 参考画像添付（サイドパネル・ペイン表示・モーダル拡大） | ✅ |
| 23 | カレンダービュー強化（原稿フィルタ・タグ色分け・凡例） | ✅ |

### Phase 3 — 拡張（予定）

| # | 機能 | 優先度 |
|---|------|--------|
| 24 | 縦書き本格対応（TiptapとCSS writing-modeの統合） | 最高 |
| 25 | Markdown ↔ リッチテキスト切り替え | 最高 |
| 26 | Dropbox API連携 | 高 |
| 27 | Google Drive API連携 | 高 |
| 28 | PDF強化（react-pdf・ファイル名自動設定・縦書き対応） | 中 |
| 29 | Electronデスクトップ版 | 中 |
| 30 | React Nativeモバイル版（検討） | 低 |
| 31 | ショートカットキーのカスタマイズ | 低 |
| 32 | 統計グラフ（執筆時間の可視化） | 低 |

---

## 4. データ構造

```typescript
// 原稿
type Manuscript = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  order: number
  direction: 'horizontal' | 'vertical'
  layoutId: LayoutPresetId
  tags: TagId[]
  attachments: Attachment[]
  versions: Version[]
  logs: EditLog[]
  currentContent: TiptapJSON      // Tiptap JSONコンテンツ
  currentContentText: string      // Markdownテキスト（エクスポート用）
}

// バージョン
type Version = {
  id: string
  label: string                   // 「初稿」「第二稿」など（表示用）
  content: TiptapJSON
  contentText: string             // Markdownテキスト
  savedAt: number
  note: string
  charCount: number
}

// 執筆ログ
type EditLog = {
  id: string
  startedAt: number
  endedAt: number
  charCountDelta: number
}

// タグ
type TagCategory = {
  id: string
  label: string
  color: string
  tags: Tag[]
}

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

// 参考画像
type Attachment = {
  id: string
  manuscriptId: string
  fileName: string
  dataUrl: string                 // Base64
  addedAt: number
  note: string
}

// ペイン状態
type PaneMode = VersionId | 'attachments' | null

type PaneState = {
  manuscriptId: string | null
  versionId: PaneMode             // null=現在版, 'attachments'=参考画像ペイン
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
│  （サムネ │  [ログモード]  タイムライン / カレンダー       │
│   イル付）│  [設定モード]  タグ・プリセット・クラウド設定   │
│・ソート   │                                              │
│・タグ    │                                              │
│  フィルタ │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 編集モード（ペイン構成）

```
┌───────────────────────────────────────────────────────────┐
│ 原稿A ▼  現在版 ▼（または過去版・参考画像）      × 閉じる  │
├───────────────────────────────────────────────────────────┤
│ B  I  S  H1 H2 H3  ─  ルビ  ↩ ↪（ツールバー）           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Tiptapエディタ（リッチテキスト・ルビ対応）                 │
│                                                           │
├───────────────────────────────────────────────────────────┤
│ 散文 | 1,234字 | 書き出し▾ | 履歴 | 🖼 | 設定⚙          │
└───────────────────────────────────────────────────────────┘
```

---

## 6. コンポーネント構成

```
src/
├── types/index.ts
├── store/
│   ├── manuscriptStore.ts      # 参考画像操作を含む
│   ├── tagStore.ts
│   ├── layoutStore.ts
│   └── uiStore.ts
├── db/index.ts                 # DB Version 3
├── hooks/
│   ├── useAutoSave.ts
│   ├── useEditLog.ts
│   ├── useExport.ts            # contentTextベース
│   ├── useBackup.ts            # 画像をZIPに含む
│   ├── useScrollSync.ts
│   └── usePrint.ts             # window.print()方式
├── utils/
│   ├── tiptapToMarkdown.ts     # Tiptap JSON → Markdown変換
│   └── tiptapToHtml.ts         # Tiptap JSON → HTML変換（印刷用）
└── components/
    ├── common/
    │   ├── Header.tsx
    │   ├── Modal.tsx
    │   └── CharCount.tsx
    ├── Sidebar/
    │   ├── Sidebar.tsx
    │   ├── ManuscriptList.tsx
    │   ├── ManuscriptItem.tsx  # サムネイル表示対応
    │   └── TagFilter.tsx
    ├── Editor/
    │   ├── PaneContainer.tsx
    │   ├── EditorPane.tsx
    │   ├── PaneHeader.tsx      # 参考画像ペイン対応
    │   ├── TiptapEditor.tsx
    │   ├── Toolbar.tsx
    │   ├── RubyInput.tsx
    │   ├── VersionPanel.tsx
    │   ├── ExportMenu.tsx
    │   ├── ManuscriptDetailPanel.tsx
    │   ├── AttachmentPanel.tsx # 参考画像サイドパネル
    │   ├── AttachmentPane.tsx  # 参考画像ペイン表示
    │   ├── AttachmentViewer.tsx # モーダル拡大表示
    │   └── extensions/
    │       └── Ruby.ts         # Tiptapルビ拡張（インラインノード）
    ├── Log/
    │   ├── LogView.tsx
    │   ├── Timeline.tsx
    │   └── CalendarView.tsx    # 原稿フィルタ・タグ色分け対応
    └── Settings/
        ├── SettingsView.tsx
        ├── TagManager.tsx
        ├── LayoutPresetEditor.tsx
        └── CloudSettings.tsx
```

---

## 7. ルビ仕様（実装済み）

### 入力方法（4種）
| 方法 | 操作 |
|------|------|
| ショートカット | テキストを選択 → `Ctrl+Shift+R`（Mac: `Cmd+Shift+R`）|
| 右クリックメニュー | テキストを選択 → 右クリック（テキスト選択中のみ）|
| ツールバーボタン | テキストを選択 → ツールバーの「ルビ」ボタン |
| 記法の直接入力 | `{薔薇|ばら}` と入力した瞬間に自動変換 |

### 仕様
- グループルビのみ（モノルビは削除）
- Tiptapインラインノードとして実装
- Markdownエクスポート時は `{ベーステキスト|よみ}` 形式で出力

---

## 8. タグ仕様

カテゴリ内で排他選択（1カテゴリにつき1タグまで）。

| カテゴリ | 初期タグ |
|----------|----------|
| ジャンル | 詩・散文・エッセイ・随筆・評論・脚本・その他 |
| 状態 | アイデア・執筆中・推敲中・完成・保留 |
| 公開先 | 未定・同人・商業・Web・非公開 |

カレンダービューでは「ジャンル」カテゴリのタグ色が原稿の色として使用される。

---

## 9. レイアウトプリセット

CSSカスタムプロパティ（`--editor-*`）でエディタとプレビューを統一管理。

| プリセット | 用途 |
|-----------|------|
| 散文 | 小説・エッセイ（組み込み・削除不可） |
| 詩 | 詩・歌詞（組み込み・削除不可） |
| 原稿用紙 | 縦書き原稿（組み込み・削除不可） |

カスタムプリセットは自由に作成・削除可能。

---

## 10. ファイル命名規則

```
matsuba_backup_YYYYMMDD.zip
  原稿タイトル/
    current.md          ← 現在の版（Markdown）
    v01_YYYYMMDD.md    ← バージョン（Markdown）
    v02_YYYYMMDD.md
    images/
      01_filename.jpg   ← 参考画像
      02_filename.png
```

- タイトルは最大20文字（記号はアンダースコアに変換）
- バージョンは `v01`, `v02`... 形式（ゼロパディング）

---

## 11. ショートカットキー（固定）

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
| ルビを追加 | `Ctrl+Shift+R` | `Cmd+Shift+R` |

Phase 3でカスタマイズ機能を追加予定。

---

## 12. PDF出力仕様

### 現在（Phase 2）
- `window.print()` を使用した新規ウィンドウ方式
- ファイル名は手動入力が必要（ブラウザのセキュリティ制限）
- タイトル・バージョン・日付をヘッダーに含める
- 書式（太字・見出し・ルビ）が印刷に反映される

### Phase 3予定
- `react-pdf` に移行してファイル名の自動設定に対応
- 縦書き対応

---

## 13. 参考画像仕様（Phase 2実装済み）

### 表示方式
| 方式 | 場所 | 説明 |
|------|------|------|
| サムネイル | サイドバー | 最大3枚表示、3枚超は +N 表示 |
| サイドパネル | エディタ右側 | ステータスバーの🖼ボタンで開閉 |
| ペイン表示 | エディタペイン | ペインヘッダーのドロップダウンで「参考画像」を選択 |
| モーダル拡大 | 全画面 | サムネイルクリックで表示、左右キーで切り替え |

### データ
- Base64でIndexedDBに保存
- ZIPバックアップ時に `images/` フォルダとして含まれる

---

## 14. 未確定事項・今後の検討

| 項目 | 内容 | 検討時期 |
|------|------|----------|
| 縦書きとTiptapの統合 | CSS writing-modeとの互換性 | Phase 3 |
| react-pdfへの移行 | ファイル名自動設定・縦書き対応 | Phase 3 |
| Electronへの移行タイミング | Phase 3の優先順位 | Phase 2完了後 |
| モバイルアプリの方式 | React NativeかPWAか | Phase 3後半 |
| ショートカットのカスタマイズ | 設定画面に追加 | Phase 3 |
| 統計グラフ | 月ごと・週ごとの執筆時間グラフ | Phase 3後半 |

---

## 15. 開発フェーズ概要

```
Phase 1（完了）
  原稿管理・バージョン管理・3ペイン表示・同期スクロール
  執筆ログ・タグ・ドラッグ並べ替え・自動保存
  .txt / .md エクスポート・ZIPバックアップ
  設定画面・未保存マーカー・ショートカットキー

Phase 2（完了）
  Tiptapリッチテキストエディタ導入
  JSON + Markdownの併用保存
  ルビ入力（4種の入力方法）
  レイアウトプリセット強化（CSSカスタムプロパティ）
  PDF出力（window.print()方式）
  参考画像添付（サイドパネル・ペイン・モーダル）
  カレンダービュー強化（原稿フィルタ・タグ色分け）

Phase 3（予定・優先度順）
  最優先：縦書き本格対応・Markdown切り替え
  高：Dropbox / Google Drive API連携
  中：PDF強化（react-pdf）・Electronデスクトップ版
  低：React Native・ショートカットカスタマイズ・統計グラフ
```
