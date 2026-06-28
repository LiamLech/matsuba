# matsuba 設計書

**バージョン:** 0.5（Phase 2設計確定）
**作成日:** 2026年6月
**ステータス:** Phase 1完了・Phase 2設計確定・実装開始前

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
| リッチテキストエディタ | Tiptap（Phase 2で導入） | ルビのカスタム拡張が可能、Markdown変換対応 |
| ローカルDB | IndexedDB | localStorageより大容量・高速、Electron移行時もそのまま使用可能 |
| ZIPバックアップ | JSZip | ブラウザ上でのフォルダ構造付きZIP生成 |
| PDF出力 | ブラウザprint API / react-pdf（Phase 2） | 確認・共有用途 |
| クラウド連携 | Dropbox API / Google Drive API（Phase 3） | 当初はローカルファイル経由でDropbox・Driveの自動同期を利用 |

### バージョンのcontent形式
- **Phase 1（現在）**：プレーンテキスト（string）
- **Phase 2以降**：Tiptap JSON（ProseMirrorドキュメント形式）+ プレーンテキストを併用保存

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

### Phase 2 — エディタ強化（設計確定・実装開始前）

| # | 機能 | 概要 | 優先順位 |
|---|------|------|----------|
| 17 | Tiptap導入・基本リッチテキスト | SimpleEditorをTiptapに置き換え。太字・イタリック・見出し・リスト・取り消し線 | Step 1 |
| 18 | Tiptap JSON＋プレーンテキスト併用保存 | content（JSON）とcontentText（プレーンテキスト）を両方保存 | Step 1 |
| 19 | ルビ入力 | Tiptapカスタム拡張。4種の入力方法 | Step 2 |
| 20 | レイアウトプリセット強化 | TiptapとプリセットのCSS連携。切り替えがリアルタイムに反映 | Step 3 |
| 21 | PDF出力（確認・共有用） | ブラウザprint APIまたはreact-pdf。タイトル・バージョン・日付をヘッダーに含める | Step 4 |
| 22 | 参考画像添付 | 原稿ごとにサイドパネルで管理。本文エディタには表示しない | Step 5 |
| 23 | カレンダービュー強化 | 原稿ごとのフィルタ・タグごとの色分け表示 | Step 6 |

### Phase 3 — 拡張（予定）

| # | 機能 | 概要 |
|---|------|------|
| 24 | 縦書きの本格対応 | CSS writing-modeとTiptapの統合 |
| 25 | Markdown ↔ リッチテキスト切り替え | エディタモードの切り替え |
| 26 | Dropbox API連携 | APIキーを設定画面で入力し自動同期 |
| 27 | Google Drive API連携 | 同上 |
| 28 | Electronデスクトップ版 | Reactコードを流用 |
| 29 | React Nativeモバイル版 | 検討 |
| 30 | ショートカットキーのカスタマイズ | 設定画面に追加 |
| 31 | 統計グラフ | 月ごと・週ごとの執筆時間グラフ |

---

## 4. データ構造

### Phase 2での変更点

```typescript
// バージョン（Phase 2での変更）
type Version = {
  id: string
  label: string                  // 「初稿」「第二稿」など（表示用）
  content: unknown               // Tiptap JSON（Phase 2以降）
  contentText: string            // プレーンテキスト（新規追加・検索・エクスポート用）
  savedAt: number
  note: string
  charCount: number
}

// 原稿（Phase 2での変更）
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
  currentContent: unknown        // Tiptap JSON（Phase 2以降）
  currentContentText: string     // プレーンテキスト（新規追加）
}

// 参考画像（Phase 2で実装）
type Attachment = {
  id: string
  manuscriptId: string
  fileName: string
  dataUrl: string                // Base64エンコード
  addedAt: number
  note: string
}
```

### 移行方針（Phase 1 → Phase 2）

- **クリーンスタート**：既存のIndexedDBデータを破棄してPhase 2形式で作り直す
- `DB_VERSION` を3に上げてマイグレーションを実行
- 開発初期段階のためデータロスの影響が小さいと判断

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

### 編集モード（Phase 2）

```
┌───────────────────────────────────────────────────────────┐
│ 原稿A ▼  現在版 ▼                               × 閉じる  │
├───────────────────────────────────────────────────────────┤
│ B  I  S  H1 H2 H3  ─  ル  …（ツールバー）               │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Tiptapエディタ（リッチテキスト）                           │
│                                                           │
├───────────────────────────────────────────────────────────┤
│ 散文 | 1,234字 | 書き出し▾ | 履歴 | 設定⚙               │
└───────────────────────────────────────────────────────────┘
```

---

## 6. コンポーネント構成

```
src/
├── types/
│   └── index.ts                    # Phase 2でVersion・Manuscriptの型を更新
├── store/
│   ├── manuscriptStore.ts
│   ├── tagStore.ts
│   ├── layoutStore.ts
│   └── uiStore.ts
├── db/
│   └── index.ts                    # DB_VERSION: 3に更新
├── hooks/
│   ├── useAutoSave.ts
│   ├── useEditLog.ts
│   ├── useExport.ts                # contentTextを使用するよう更新
│   ├── useBackup.ts                # contentTextを使用するよう更新
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
    │   ├── TiptapEditor.tsx        # 新規：SimpleEditorを置き換え
    │   ├── Toolbar.tsx             # 新規：書式ツールバー
    │   ├── RubyInput.tsx           # 新規：ルビ入力ダイアログ（Step 2）
    │   ├── VersionPanel.tsx
    │   ├── ExportMenu.tsx
    │   ├── AttachmentPanel.tsx     # 新規：参考画像添付（Step 5）
    │   └── ManuscriptDetailPanel.tsx
    ├── Log/
    │   ├── LogView.tsx
    │   ├── Timeline.tsx
    │   └── CalendarView.tsx        # 強化：原稿フィルタ・タグ色分け（Step 6）
    └── Settings/
        ├── SettingsView.tsx
        ├── TagManager.tsx
        ├── LayoutPresetEditor.tsx
        └── CloudSettings.tsx
```

---

## 7. ルビ仕様（Phase 2・Step 2）

### 入力記法
`{薔薇|ばら}` 形式を採用。

### 入力方法（4種併用）
| 方法 | 操作 | 実装 |
|------|------|------|
| ショートカット | テキストを選択 → `Ctrl+R`（Mac: `Cmd+R`）→ ダイアログ | TiptapコマンドをキーバインドにマップY |
| 右クリックメニュー | テキストを選択 → 右クリック →「ルビを追加」| ContextMenuイベントで制御 |
| ツールバーボタン | テキストを選択 → ツールバーの「ルビ」ボタン | Toolbarコンポーネントから呼び出し |
| 記法の直接入力 | `{薔薇|ばら}` と入力した瞬間に自動変換 | Tiptap InputRuleで実装 |

### 表示設定
- デフォルト：グループルビ（単語全体にまとめて振る）
- モノルビ（一文字ずつ）はダイアログで切り替え可能
- Phase 3の縦書き実装時にルビ位置を右側に自動調整

### Tiptapカスタム拡張の構造
```typescript
// RubyExtension（Tiptapカスタムマーク）
const Ruby = Mark.create({
  name: 'ruby',
  addAttributes() {
    return {
      reading: { default: '' },   // 読み仮名
      type: { default: 'group' }, // 'group' | 'mono'
    }
  },
  // renderHTMLで<ruby><rt>を出力
  // addInputRulesで {漢字|かな} 記法を自動変換
  // addKeyboardShortcutsでCtrl+Rを登録
})
```

---

## 8. レイアウトプリセット（Phase 2での強化）

Phase 1では `fontSize` や `lineHeight` をインラインスタイルで適用していた。
Phase 2ではTiptapのエディタルートにCSSカスタムプロパティを付与して管理する。

```typescript
// TiptapEditorのルート要素に適用
const presetToCssVars = (preset: LayoutPreset): React.CSSProperties => ({
  '--editor-font-size':         `${preset.fontSize}px`,
  '--editor-line-height':       preset.lineHeight,
  '--editor-letter-spacing':    `${preset.letterSpacing}em`,
  '--editor-text-indent':       preset.indent === 'none' ? '0' : preset.indent,
  '--editor-text-align':        preset.alignment,
  '--editor-paragraph-spacing': `${preset.paragraphSpacing}em`,
})
```

---

## 9. PDF出力仕様（Phase 2・Step 4）

### 用途
確認・共有用。入稿データとしての使用は想定しない。

### 実装方針
ブラウザの `window.print()` APIを使用した印刷ダイアログ経由のPDF保存を第一候補とする。スタイルシートで印刷用レイアウトを定義する。

```
出力内容：
  ヘッダー：タイトル・バージョン名・日付
  本文：Tiptapのコンテンツ（書式・ルビを含む）
  フッター：ページ番号
```

### react-pdfへの切り替え条件
`window.print()` で縦書き・ルビのレンダリングが不十分な場合は `react-pdf` に切り替える（Phase 3で判断）。

---

## 10. 参考画像添付仕様（Phase 2・Step 5）

### 設計方針
- 本文エディタには画像を表示しない（執筆体験を損なわないため）
- 原稿ごとにサイドパネル（`AttachmentPanel`）で管理
- 用途：執筆の参考・インスピレーション画像・資料写真

### UI
```
┌─────────────────────┐
│ 参考画像            │
│ ＋ 画像を追加       │
├─────────────────────┤
│ [画像サムネイル]    │
│ ファイル名          │
│ メモ欄              │
│ × 削除              │
└─────────────────────┘
```

### データ
```typescript
type Attachment = {
  id: string
  manuscriptId: string
  fileName: string
  dataUrl: string    // Base64（IndexedDBに保存）
  addedAt: number
  note: string
}
```

---

## 11. カレンダービュー強化仕様（Phase 2・Step 6）

### 追加機能

**原稿ごとのフィルタ**
- カレンダー上部にフィルタドロップダウンを設置
- 「すべての原稿」または特定の原稿を選択して表示を絞り込む

**タグごとの色分け**
- 各原稿に付与された「ジャンル」カテゴリのタグの色をカレンダーセルに反映
- 複数原稿を書いた日は最初の原稿のタグ色を使用（または混色）

---

## 12. タグ仕様

### 初期カテゴリ
カテゴリ内で排他選択（1カテゴリにつき1タグまで付与可能）。

| カテゴリ | 初期タグ |
|----------|----------|
| ジャンル | 詩・散文・エッセイ・随筆・評論・脚本・その他 |
| 状態 | アイデア・執筆中・推敲中・完成・保留 |
| 公開先 | 未定・同人・商業・Web・非公開 |

---

## 13. ショートカットキー

### Phase 1実装済み（固定）

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

### Phase 2追加予定

| 操作 | Windows | Mac |
|------|---------|-----|
| ルビを追加 | `Ctrl+R` | `Cmd+R` |

### Phase 3予定
ショートカットキーのカスタマイズ機能を設定画面に追加。

---

## 14. ローカルファイルの命名規則

```
matsuba_backup_YYYYMMDD.zip
  薔薇について/
    current.md
    v01_20260615.md    ← v01, v02... 形式（ゼロパディング）
    v02_20260622.md
```

- タイトルが長い場合は先頭20文字を上限（設定で変更可能）
- `.md` ファイルの内容は `contentText`（プレーンテキスト）を使用

---

## 15. 未確定事項・今後の検討

| 項目 | 内容 | 検討時期 |
|------|------|----------|
| PDF出力の実装方法 | `window.print()` vs `react-pdf` | Phase 2 Step 4 |
| 縦書きとTiptapの統合 | CSS writing-modeとの互換性 | Phase 3 |
| Electronへの移行タイミング | Phase 3の優先順位 | Phase 2完了後 |
| モバイルアプリの方式 | React NativeかPWAか | Phase 3 |
| 統計グラフ | 月ごと・週ごとの執筆時間グラフ | Phase 3 |
| ショートカットのカスタマイズ | 設定画面に追加 | Phase 3 |

---

## 16. 開発フェーズ概要

```
Phase 1（完了）
  原稿管理・バージョン管理・3ペイン表示・同期スクロール
  執筆ログ・タグ・ドラッグ並べ替え・自動保存
  .txt / .md エクスポート・ZIPバックアップ
  設定画面・未保存マーカー・ショートカットキー

Phase 2（実装開始前）
  Step 1: Tiptap導入・基本リッチテキスト・JSON+テキスト併用保存
  Step 2: ルビ入力（Tiptapカスタム拡張）
  Step 3: レイアウトプリセット強化
  Step 4: PDF出力（確認・共有用）
  Step 5: 参考画像添付
  Step 6: カレンダービュー強化（原稿フィルタ・タグ色分け）

Phase 3（予定）
  縦書きの本格対応（Tiptap統合）
  Markdown ↔ リッチテキスト切り替え
  Dropbox / Google Drive API連携
  Electronデスクトップ版
  React Nativeモバイル版（検討）
  ショートカットキーのカスタマイズ
  統計グラフ
```
