// ============================================================
// matsuba - 型定義
// ============================================================

// ------------------------------------------------------------
// 共通
// ------------------------------------------------------------

/** アプリ全体で使うID型（UUID文字列） */
export type ID = string

/** Unixタイムスタンプ（秒） */
export type Timestamp = number

// ------------------------------------------------------------
// レイアウトプリセット
// ------------------------------------------------------------

export type LayoutPresetId = 'prose' | 'poem' | 'manuscript-paper' | (string & {})

export type TextAlignment = 'left' | 'center' | 'right' | 'justify'
export type IndentSize = 'none' | '1em' | '2em'

export type LayoutPreset = {
  id: LayoutPresetId
  label: string
  /** trueの場合は削除不可 */
  isBuiltIn: boolean
  lineHeight: number
  fontSize: number
  indent: IndentSize
  alignment: TextAlignment
  /** em単位 */
  letterSpacing: number
  /** em単位 */
  paragraphSpacing: number
}

// ------------------------------------------------------------
// タグ
// ------------------------------------------------------------

export type TagId = ID
export type TagCategoryId = ID

export type Tag = {
  id: TagId
  categoryId: TagCategoryId
  label: string
  color: string
}

export type TagCategory = {
  id: TagCategoryId
  label: string
  color: string
  tags: Tag[]
}

// ------------------------------------------------------------
// 執筆ログ
// ------------------------------------------------------------

export type EditLogId = ID

export type EditLog = {
  id: EditLogId
  startedAt: Timestamp
  endedAt: Timestamp
  /** このセッションでの文字数の増減 */
  charCountDelta: number
}

// ------------------------------------------------------------
// バージョン
// ------------------------------------------------------------

export type VersionId = ID

/**
 * Tiptap（ProseMirror）のドキュメントJSON形式
 * 実際の型はTiptapのJSONContent型に準拠するが、
 * 外部依存を避けるためここではunknownとして扱う
 */
export type TiptapJSON = unknown

export type Version = {
  id: VersionId
  /** 「初稿」「第二稿」など */
  label: string
  /** Tiptap JSON形式のコンテンツ */
  content: TiptapJSON
  savedAt: Timestamp
  /** 任意メモ */
  note: string
  charCount: number
}

// ------------------------------------------------------------
// 参考画像（Phase 2）
// ------------------------------------------------------------

export type AttachmentId = ID

export type Attachment = {
  id: AttachmentId
  manuscriptId: ManuscriptId
  fileName: string
  /** Base64エンコードされた画像データ */
  dataUrl: string
  addedAt: Timestamp
  note: string
}

// ------------------------------------------------------------
// 原稿
// ------------------------------------------------------------

export type ManuscriptId = ID

export type WritingDirection = 'horizontal' | 'vertical'

export type Manuscript = {
  id: ManuscriptId
  title: string
  createdAt: Timestamp
  updatedAt: Timestamp
  /** 手動ドラッグ並べ替え用の順序 */
  order: number
  direction: WritingDirection
  layoutId: LayoutPresetId
  tags: TagId[]
  /** 参考画像（Phase 2で使用） */
  attachments: Attachment[]
  versions: Version[]
  logs: EditLog[]
  /** 現在編集中のコンテンツ（バージョン保存前の作業内容） */
  currentContent: string
}

// ------------------------------------------------------------
// UIの状態
// ------------------------------------------------------------

export type ViewMode = 'editor' | 'log' | 'settings'

export type PaneState = {
  manuscriptId: ManuscriptId | null
  /** nullなら現在編集中の最新版 */
  versionId: VersionId | null
}

export type PaneCount = 1 | 2 | 3
export type PaneIndex = 0 | 1 | 2

export type UIState = {
  paneCount: PaneCount
  /** 常に3つ保持し、paneCountで表示数を制御する */
  panes: [PaneState, PaneState, PaneState]
  activePaneIndex: PaneIndex
  viewMode: ViewMode
  scrollSynced: boolean
  charCountVisible: boolean
}

// ------------------------------------------------------------
// ソート
// ------------------------------------------------------------

export type SortKey = 'manual' | 'title' | 'createdAt' | 'updatedAt'
export type SortOrder = 'asc' | 'desc'

export type SortConfig = {
  key: SortKey
  order: SortOrder
}

// ------------------------------------------------------------
// カレンダービュー
// ------------------------------------------------------------

export type CalendarViewMode = 'week' | 'month' | 'year'

// ------------------------------------------------------------
// エクスポート
// ------------------------------------------------------------

export type ExportFormat = 'txt' | 'md' | 'pdf'

export type ExportOptions = {
  format: ExportFormat
  versionId: VersionId | null
  includeMetadata: boolean
}

// ------------------------------------------------------------
// 設定（Phase 3のクラウド連携用枠）
// ------------------------------------------------------------

export type CloudProvider = 'dropbox' | 'google-drive'

export type CloudSettings = {
  provider: CloudProvider | null
  /** APIキー（Phase 3で使用） */
  apiKey: string | null
  /** ローカルの保存先フォルダパス */
  localSavePath: string | null
  /** タイトルの最大文字数（ファイル名用） */
  titleMaxLength: number
}

export type AppSettings = {
  cloud: CloudSettings
  /** 自動保存のデバウンス間隔（ミリ秒） */
  autoSaveDebounceMs: number
  /** ルビの入力方法 */
  rubyInputMode: 'dialog' | 'syntax'
}

// ------------------------------------------------------------
// デフォルト値
// ------------------------------------------------------------

export const DEFAULT_LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'prose',
    label: '散文',
    isBuiltIn: true,
    lineHeight: 1.9,
    fontSize: 16,
    indent: '1em',
    alignment: 'justify',
    letterSpacing: 0.02,
    paragraphSpacing: 1,
  },
  {
    id: 'poem',
    label: '詩',
    isBuiltIn: true,
    lineHeight: 2.4,
    fontSize: 16,
    indent: 'none',
    alignment: 'left',
    letterSpacing: 0.05,
    paragraphSpacing: 1.5,
  },
  {
    id: 'manuscript-paper',
    label: '原稿用紙',
    isBuiltIn: true,
    lineHeight: 2.0,
    fontSize: 14,
    indent: '1em',
    alignment: 'justify',
    letterSpacing: 0.0,
    paragraphSpacing: 0,
  },
]

export const DEFAULT_TAG_CATEGORIES: TagCategory[] = [
  {
    id: 'genre',
    label: 'ジャンル',
    color: '#6E9BC9',
    tags: [
      { id: 'genre-poem',      categoryId: 'genre', label: '詩',     color: '#6E9BC9' },
      { id: 'genre-prose',     categoryId: 'genre', label: '散文',   color: '#6E9BC9' },
      { id: 'genre-essay',     categoryId: 'genre', label: 'エッセイ', color: '#6E9BC9' },
      { id: 'genre-zuihitsu',  categoryId: 'genre', label: '随筆',   color: '#6E9BC9' },
      { id: 'genre-criticism', categoryId: 'genre', label: '評論',   color: '#6E9BC9' },
      { id: 'genre-script',    categoryId: 'genre', label: '脚本',   color: '#6E9BC9' },
      { id: 'genre-other',     categoryId: 'genre', label: 'その他', color: '#6E9BC9' },
    ],
  },
  {
    id: 'status',
    label: '状態',
    color: '#C9A96E',
    tags: [
      { id: 'status-idea',     categoryId: 'status', label: 'アイデア', color: '#C9A96E' },
      { id: 'status-writing',  categoryId: 'status', label: '執筆中',  color: '#6EC98A' },
      { id: 'status-revising', categoryId: 'status', label: '推敲中',  color: '#C9C96E' },
      { id: 'status-done',     categoryId: 'status', label: '完成',    color: '#9B9B9B' },
      { id: 'status-hold',     categoryId: 'status', label: '保留',    color: '#C96E6E' },
    ],
  },
  {
    id: 'publication',
    label: '公開先',
    color: '#9B6EC9',
    tags: [
      { id: 'pub-undecided', categoryId: 'publication', label: '未定',   color: '#9B6EC9' },
      { id: 'pub-doujin',    categoryId: 'publication', label: '同人',   color: '#9B6EC9' },
      { id: 'pub-commercial',categoryId: 'publication', label: '商業',   color: '#9B6EC9' },
      { id: 'pub-web',       categoryId: 'publication', label: 'Web',    color: '#9B6EC9' },
      { id: 'pub-private',   categoryId: 'publication', label: '非公開', color: '#9B6EC9' },
    ],
  },
]

export const DEFAULT_UI_STATE: UIState = {
  paneCount: 1,
  panes: [
    { manuscriptId: null, versionId: null },
    { manuscriptId: null, versionId: null },
    { manuscriptId: null, versionId: null },
  ],
  activePaneIndex: 0,
  viewMode: 'editor',
  scrollSynced: false,
  charCountVisible: true,
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  cloud: {
    provider: null,
    apiKey: null,
    localSavePath: null,
    titleMaxLength: 20,
  },
  autoSaveDebounceMs: 500,
  rubyInputMode: 'dialog',
}
