// ============================================================
// matsuba - 原稿ストア（Zustand）
// ============================================================

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type {
  Manuscript,
  ManuscriptId,
  Version,
  VersionId,
  EditLog,
  SortConfig,
  Attachment,
  AttachmentId,
} from '../types'
import {
  getAllManuscripts,
  putManuscript,
  deleteManuscript,
} from '../db'

// ------------------------------------------------------------
// バージョンラベルの自動生成
// ------------------------------------------------------------

const VERSION_LABELS = [
  '初稿', '第二稿', '第三稿', '第四稿', '第五稿',
  '第六稿', '第七稿', '第八稿', '第九稿', '第十稿',
]

function nextVersionLabel(versions: Version[]): string {
  const n = versions.length
  return VERSION_LABELS[n] ?? `第${n + 1}稿`
}

// ------------------------------------------------------------
// ソート
// ------------------------------------------------------------

function sortManuscripts(manuscripts: Manuscript[], config: SortConfig): Manuscript[] {
  return [...manuscripts].sort((a, b) => {
    let cmp = 0
    switch (config.key) {
      case 'manual':
        cmp = a.order - b.order
        break
      case 'title':
        cmp = a.title.localeCompare(b.title, 'ja')
        break
      case 'createdAt':
        cmp = a.createdAt - b.createdAt
        break
      case 'updatedAt':
        cmp = a.updatedAt - b.updatedAt
        break
    }
    return config.order === 'asc' ? cmp : -cmp
  })
}

// ------------------------------------------------------------
// ストアの型
// ------------------------------------------------------------

type ManuscriptStore = {
  manuscripts: Manuscript[]
  sortConfig: SortConfig
  isLoading: boolean

  // 初期化
  loadAll: () => Promise<void>

  // 原稿CRUD
  createManuscript: (title: string) => Promise<Manuscript>
  updateManuscript: (id: ManuscriptId, patch: Partial<Manuscript>) => Promise<void>
  removeManuscript: (id: ManuscriptId) => Promise<void>

  // 手動並べ替え
  reorderManuscripts: (fromIndex: number, toIndex: number) => Promise<void>

  // ソート
  setSortConfig: (config: SortConfig) => void

  // バージョン
  saveVersion: (manuscriptId: ManuscriptId, label?: string, note?: string) => Promise<Version>
  removeVersion: (manuscriptId: ManuscriptId, versionId: VersionId) => Promise<void>

  // 執筆ログ
  appendLog: (manuscriptId: ManuscriptId, log: Omit<EditLog, 'id'>) => Promise<void>

  // 参考画像
  addAttachment: (manuscriptId: ManuscriptId, attachment: Omit<Attachment, 'id' | 'manuscriptId' | 'addedAt'>) => Promise<void>
  removeAttachment: (manuscriptId: ManuscriptId, attachmentId: AttachmentId) => Promise<void>
  updateAttachmentNote: (manuscriptId: ManuscriptId, attachmentId: AttachmentId, note: string) => Promise<void>

  // セレクター
  getSorted: () => Manuscript[]
  getById: (id: ManuscriptId) => Manuscript | undefined
}

// ------------------------------------------------------------
// ストアの実装
// ------------------------------------------------------------

export const useManuscriptStore = create<ManuscriptStore>((set, get) => ({
  manuscripts: [],
  sortConfig: { key: 'manual', order: 'asc' },
  isLoading: false,

  // ── 初期化 ──────────────────────────────────────────────

  loadAll: async () => {
    set({ isLoading: true })
    try {
      const manuscripts = await getAllManuscripts()
      set({ manuscripts, isLoading: false })
    } catch (err) {
      console.error('原稿の読み込みに失敗しました', err)
      set({ isLoading: false })
    }
  },

  // ── 原稿CRUD ─────────────────────────────────────────────

  createManuscript: async (title) => {
    const { manuscripts } = get()
    const now = Math.floor(Date.now() / 1000)
    const manuscript: Manuscript = {
      id: nanoid(),
      title,
      createdAt: now,
      updatedAt: now,
      order: manuscripts.length,
      direction: 'horizontal',
      layoutId: 'prose',
      editorMode: 'rich',
      tags: [],
      attachments: [],
      versions: [],
      logs: [],
      currentContent: null,
      currentContentText: '',
    }
    await putManuscript(manuscript)
    set({ manuscripts: [...manuscripts, manuscript] })
    return manuscript
  },

  updateManuscript: async (id, patch) => {
    const { manuscripts } = get()
    const now = Math.floor(Date.now() / 1000)
    const updated = manuscripts.map((m) =>
      m.id === id ? { ...m, ...patch, updatedAt: now } : m
    )
    const target = updated.find((m) => m.id === id)
    if (target) {
      await putManuscript(target)
      set({ manuscripts: updated })
    }
  },

  removeManuscript: async (id) => {
    const { manuscripts } = get()
    await deleteManuscript(id)
    set({ manuscripts: manuscripts.filter((m) => m.id !== id) })
  },

  // ── 手動並べ替え ─────────────────────────────────────────

  reorderManuscripts: async (fromIndex, toIndex) => {
    const { manuscripts } = get()
    const sorted = get().getSorted()
    const reordered = [...sorted]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    // orderを振り直す
    const updated = reordered.map((m, i) => ({ ...m, order: i }))

    // DBに保存
    await Promise.all(updated.map(putManuscript))

    // ストアを更新（元のmanuscriptsをorderで上書き）
    const orderMap = new Map(updated.map((m) => [m.id, m.order]))
    const newManuscripts = manuscripts.map((m) => ({
      ...m,
      order: orderMap.get(m.id) ?? m.order,
    }))
    set({ manuscripts: newManuscripts })
  },

  // ── ソート ──────────────────────────────────────────────

  setSortConfig: (config) => {
    set({ sortConfig: config })
  },

  // ── バージョン ───────────────────────────────────────────

  saveVersion: async (manuscriptId, label, note = '') => {
    const { manuscripts } = get()
    const manuscript = manuscripts.find((m) => m.id === manuscriptId)
    if (!manuscript) throw new Error(`原稿が見つかりません: ${manuscriptId}`)

    const content = manuscript.currentContent
    const contentText = manuscript.currentContentText ?? ''

    const version: Version = {
      id: nanoid(),
      label: label ?? nextVersionLabel(manuscript.versions),
      content,
      contentText,
      savedAt: Math.floor(Date.now() / 1000),
      note,
      charCount: contentText.replace(/\s/g, '').length,
    }

    const updated: Manuscript = {
      ...manuscript,
      versions: [...manuscript.versions, version],
      updatedAt: Math.floor(Date.now() / 1000),
    }

    await putManuscript(updated)
    set({
      manuscripts: manuscripts.map((m) => (m.id === manuscriptId ? updated : m)),
    })

    return version
  },

  removeVersion: async (manuscriptId, versionId) => {
    const { manuscripts } = get()
    const manuscript = manuscripts.find((m) => m.id === manuscriptId)
    if (!manuscript) return

    const updated: Manuscript = {
      ...manuscript,
      versions: manuscript.versions.filter((v) => v.id !== versionId),
    }

    await putManuscript(updated)
    set({
      manuscripts: manuscripts.map((m) => (m.id === manuscriptId ? updated : m)),
    })
  },

  // ── 執筆ログ ────────────────────────────────────────────

  appendLog: async (manuscriptId, log) => {
    const { manuscripts } = get()
    const manuscript = manuscripts.find((m) => m.id === manuscriptId)
    if (!manuscript) return

    const newLog: EditLog = { id: nanoid(), ...log }
    const updated: Manuscript = {
      ...manuscript,
      logs: [...manuscript.logs, newLog],
    }

    await putManuscript(updated)
    set({
      manuscripts: manuscripts.map((m) => (m.id === manuscriptId ? updated : m)),
    })
  },

  // ── 参考画像 ────────────────────────────────────────────

  addAttachment: async (manuscriptId, attachment) => {
    const { manuscripts } = get()
    const manuscript = manuscripts.find((m) => m.id === manuscriptId)
    if (!manuscript) return

    const newAttachment: Attachment = {
      id: nanoid(),
      manuscriptId,
      addedAt: Math.floor(Date.now() / 1000),
      ...attachment,
    }
    const updated: Manuscript = {
      ...manuscript,
      attachments: [...(manuscript.attachments ?? []), newAttachment],
    }
    await putManuscript(updated)
    set({ manuscripts: manuscripts.map((m) => (m.id === manuscriptId ? updated : m)) })
  },

  removeAttachment: async (manuscriptId, attachmentId) => {
    const { manuscripts } = get()
    const manuscript = manuscripts.find((m) => m.id === manuscriptId)
    if (!manuscript) return

    const updated: Manuscript = {
      ...manuscript,
      attachments: (manuscript.attachments ?? []).filter((a) => a.id !== attachmentId),
    }
    await putManuscript(updated)
    set({ manuscripts: manuscripts.map((m) => (m.id === manuscriptId ? updated : m)) })
  },

  updateAttachmentNote: async (manuscriptId, attachmentId, note) => {
    const { manuscripts } = get()
    const manuscript = manuscripts.find((m) => m.id === manuscriptId)
    if (!manuscript) return

    const updated: Manuscript = {
      ...manuscript,
      attachments: (manuscript.attachments ?? []).map((a) =>
        a.id === attachmentId ? { ...a, note } : a
      ),
    }
    await putManuscript(updated)
    set({ manuscripts: manuscripts.map((m) => (m.id === manuscriptId ? updated : m)) })
  },

  // ── セレクター ───────────────────────────────────────────

  getSorted: () => {
    const { manuscripts, sortConfig } = get()
    return sortManuscripts(manuscripts, sortConfig)
  },

  getById: (id) => {
    return get().manuscripts.find((m) => m.id === id)
  },
}))
