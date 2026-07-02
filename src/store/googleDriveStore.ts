// ============================================================
// matsuba - Google Drive 同期ストア（Zustand）
// アプリ全体でトークンと同期状態を共有する
// ============================================================

import { create } from 'zustand'
import type { Manuscript } from '../types'
import { tiptapToMarkdown } from '../utils/tiptapToMarkdown'

const FOLDER_NAME = 'matsuba'

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

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
    `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return (data.files ?? []) as { id: string; name: string }[]
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
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ trashed: true }),
  })
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

  // アクション
  setAccessToken: (token: string) => void
  clearToken: () => void
  sync: (manuscripts: Manuscript[]) => Promise<void>
}

export const useGoogleDriveStore = create<GoogleDriveState>((set, get) => ({
  accessToken: null,
  status: 'idle',
  lastSyncedAt: null,
  error: null,
  folderId: null,

  setAccessToken: (token) => {
    set({ accessToken: token, status: 'idle', error: null })
  },

  clearToken: () => {
    set({ accessToken: null, status: 'idle', lastSyncedAt: null, error: null, folderId: null })
  },

  sync: async (manuscripts) => {
    const { accessToken } = get()
    if (!accessToken) return

    set({ status: 'syncing', error: null })

    try {
      // フォルダを取得または作成
      let { folderId } = get()
      if (!folderId) {
        folderId = await getOrCreateFolder(accessToken)
        set({ folderId })
      }

      // Drive上の既存ファイル一覧
      const existingFiles = await listFiles(accessToken, folderId)
      const fileMap = new Map(existingFiles.map((f) => [f.name, f.id]))

      // matsuba側のファイル名セット
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
