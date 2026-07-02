// ============================================================
// matsuba - Google Drive 同期ストア（Zustand）
// ============================================================

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Manuscript } from '../types'
import { tiptapToMarkdown } from '../utils/tiptapToMarkdown'
import { markdownToTiptap } from '../utils/markdownToTiptap'

const FOLDER_NAME = 'matsuba'
const SYNC_INTERVAL_MS = 30000

type SyncStatus = 'idle' | 'syncing' | 'loading' | 'success' | 'error'

// ── 日時フォーマット ──────────────────────────────────────────

function formatDateISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const oh = pad(Math.floor(absOffset / 60))
  const om = pad(absOffset % 60)
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${oh}:${om}`
}

// ── Drive API ヘルパー ────────────────────────────────────────

async function getOrCreateFolder(token: string): Promise<string> {
  const headers = { Authorization: `Bearer ${token}` }
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
    { headers }
  )
  const data = await res.json()
  if (data.files?.length > 0) return data.files[0].id

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  })
  const created = await createRes.json()
  return created.id
}

async function listFiles(token: string, folderId: string) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,modifiedTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return (data.files ?? []) as { id: string; name: string; modifiedTime: string }[]
}

async function downloadFile(token: string, fileId: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return res.text()
}

async function uploadFile(token: string, folderId: string, fileName: string, content: string, existingId?: string) {
  const headers = { Authorization: `Bearer ${token}` }
  const blob = new Blob([content], { type: 'text/markdown' })
  if (existingId) {
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'text/markdown' },
      body: blob,
    })
  } else {
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify({ name: fileName, parents: [folderId] })], { type: 'application/json' }))
    form.append('file', blob)
    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers,
      body: form,
    })
  }
}

async function trashFile(token: string, fileId: string) {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: true }),
  })
}

// ── Markdownから原稿オブジェクトを生成 ───────────────────────

function parseMarkdownToManuscript(markdown: string, existingId?: string): Partial<Manuscript> {
  // frontmatterを解析
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n/)
  let title = 'untitled'
  let direction: 'horizontal' | 'vertical' = 'horizontal'
  let layoutId = 'prose'
  let tags: string[] = []

  if (frontmatterMatch) {
    const fm = frontmatterMatch[1]
    const titleMatch = fm.match(/^title:\s*(.+)$/m)
    const directionMatch = fm.match(/^direction:\s*(.+)$/m)
    const layoutMatch = fm.match(/^layoutId:\s*(.+)$/m)
    const tagsMatch = fm.match(/^tags:\s*\[([^\]]*)\]$/m)

    if (titleMatch) title = titleMatch[1].trim()
    if (directionMatch) direction = directionMatch[1].trim() as 'horizontal' | 'vertical'
    if (layoutMatch) layoutId = layoutMatch[1].trim()
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean)
    }
  }

  // frontmatterを除いた本文
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '')
  const tiptapContent = markdownToTiptap(body)
  const now = Math.floor(Date.now() / 1000)

  return {
    id: existingId ?? nanoid(),
    title,
    direction,
    layoutId,
    tags,
    currentContent: tiptapContent,
    currentContentText: body,
    createdAt: now,
    updatedAt: now,
    order: 0,
    attachments: [],
    versions: [],
    logs: [],
    editorMode: 'rich',
  }
}

function sanitizeFileName(title: string): string {
  return title.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 50) || 'untitled'
}

function manuscriptToMarkdown(manuscript: Manuscript): string {
  const frontmatter = [
    '---',
    `title: ${manuscript.title}`,
    `date: ${formatDateISO(new Date())}`,
    `direction: ${manuscript.direction}`,
    `layoutId: ${manuscript.layoutId}`,
    `tags: [${manuscript.tags.join(', ')}]`,
    '---',
    '',
  ].join('\n')
  const content = manuscript.currentContentText || tiptapToMarkdown(manuscript.currentContent) || ''
  return frontmatter + content
}

// ── ストア ────────────────────────────────────────────────────

type GoogleDriveState = {
  accessToken: string | null
  status: SyncStatus
  lastSyncedAt: Date | null
  error: string | null
  folderId: string | null
  isLoading: boolean

  setAccessToken: (token: string, onLoad: (manuscripts: Partial<Manuscript>[]) => void) => Promise<void>
  clearToken: () => void
  sync: (manuscripts: Manuscript[]) => Promise<void>
}

export const useGoogleDriveStore = create<GoogleDriveState>((set, get) => ({
  accessToken: null,
  status: 'idle',
  lastSyncedAt: null,
  error: null,
  folderId: null,
  isLoading: false,

  // ログイン時：Driveからデータを読み込んでからトークンをセット
  setAccessToken: async (token, onLoad) => {
    set({ accessToken: token, status: 'loading', isLoading: true, error: null })

    try {
      // フォルダを取得または作成
      const folderId = await getOrCreateFolder(token)
      set({ folderId })

      // Driveのファイル一覧を取得
      const files = await listFiles(token, folderId)
      const mdFiles = files.filter(f => f.name.endsWith('.md') && !f.name.includes('_v'))

      if (mdFiles.length > 0) {
        // 各ファイルを読み込んで原稿オブジェクトに変換
        const manuscripts: Partial<Manuscript>[] = []
        for (const file of mdFiles) {
          const content = await downloadFile(token, file.id)
          const manuscript = parseMarkdownToManuscript(content)
          manuscripts.push(manuscript)
        }

        // コールバックでIndexedDBを更新
        onLoad(manuscripts)
      }

      set({ status: 'success', isLoading: false, lastSyncedAt: new Date() })
    } catch (err) {
      console.error('Drive load error:', err)
      set({
        status: 'error',
        isLoading: false,
        error: err instanceof Error ? err.message : '読み込みに失敗しました',
      })
    }
  },

  clearToken: () => {
    set({ accessToken: null, status: 'idle', lastSyncedAt: null, error: null, folderId: null, isLoading: false })
  },

  sync: async (manuscripts) => {
    const { accessToken } = get()
    if (!accessToken) return

    set({ status: 'syncing', error: null })

    try {
      let { folderId } = get()
      if (!folderId) {
        folderId = await getOrCreateFolder(accessToken)
        set({ folderId })
      }

      const existingFiles = await listFiles(accessToken, folderId)
      const fileMap = new Map(existingFiles.map((f) => [f.name, f.id]))
      const matsubaNames = new Set(manuscripts.map((m) => `${sanitizeFileName(m.title)}.md`))

      // Drive側にあってmatsuba側にないファイルをゴミ箱へ
      for (const [name, id] of fileMap) {
        if (!matsubaNames.has(name)) {
          await trashFile(accessToken, id)
        }
      }

      // 各原稿をアップロード
      for (const manuscript of manuscripts) {
        const fileName = `${sanitizeFileName(manuscript.title)}.md`
        await uploadFile(accessToken, folderId, fileName, manuscriptToMarkdown(manuscript), fileMap.get(fileName))
      }

      set({ status: 'success', lastSyncedAt: new Date() })
    } catch (err) {
      console.error('Drive sync error:', err)
      set({ status: 'error', error: err instanceof Error ? err.message : '同期に失敗しました' })
    }
  },
}))

export { SYNC_INTERVAL_MS }
