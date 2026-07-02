// ============================================================
// matsuba - Google Drive 蜷梧悄繧ｹ繝医い・・ustand・・// ============================================================

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Manuscript } from '../types'
import { tiptapToMarkdown } from '../utils/tiptapToMarkdown'
import { markdownToTiptap } from '../utils/markdownToTiptap'

const FOLDER_NAME = 'matsuba'
export const SYNC_INTERVAL_MS = 30000

const STORAGE_KEY = 'matsuba_drive_token'
const STORAGE_EXPIRY_KEY = 'matsuba_drive_token_expiry'

type SyncStatus = 'idle' | 'syncing' | 'loading' | 'success' | 'error'

// 笏笏 繝医・繧ｯ繝ｳ縺ｮ豌ｸ邯壼喧 笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏

function saveToken(token: string) {
  // 繝医・繧ｯ繝ｳ縺ｮ譛牙柑譛滄剞繧・0蛻・ｾ後↓險ｭ螳夲ｼ・oogle縺ｮ繝医・繧ｯ繝ｳ縺ｯ1譎る俣譛牙柑・・  const expiry = Date.now() + 50 * 60 * 1000
  localStorage.setItem(STORAGE_KEY, token)
  localStorage.setItem(STORAGE_EXPIRY_KEY, String(expiry))
}

function loadToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEY)
  const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY)
  if (!token || !expiry) return null
  if (Date.now() > Number(expiry)) {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_EXPIRY_KEY)
    return null
  }
  return token
}

function clearToken() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_EXPIRY_KEY)
}

// 笏笏 譌･譎ゅヵ繧ｩ繝ｼ繝槭ャ繝・笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏

function formatDateISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const oh = pad(Math.floor(absOffset / 60))
  const om = pad(absOffset % 60)
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${oh}:${om}`
}

// 笏笏 Drive API 繝倥Ν繝代・ 笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏

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

// 笏笏 Markdown縺九ｉ蜴溽ｨｿ繧ｪ繝悶ず繧ｧ繧ｯ繝医ｒ逕滓・ 笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏

function parseMarkdownToManuscript(markdown: string): Partial<Manuscript> {
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
    if (tagsMatch) tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean)
  }

  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '')
  const tiptapContent = markdownToTiptap(body)
  const now = Math.floor(Date.now() / 1000)

  return {
    id: nanoid(),
    title, direction, layoutId, tags,
    currentContent: tiptapContent,
    currentContentText: body,
    createdAt: now, updatedAt: now,
    order: 0, attachments: [], versions: [], logs: [],
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

// 笏笏 Drive縺九ｉ隱ｭ縺ｿ霎ｼ繧蜈ｱ騾壼・逅・笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏

async function loadFromDriveInternal(
  token: string,
  onLoad: (manuscripts: Partial<Manuscript>[]) => Promise<void>
): Promise<string> {
  const folderId = await getOrCreateFolder(token)
  const files = await listFiles(token, folderId)
  const mdFiles = files.filter(f => f.name.endsWith('.md'))

  if (mdFiles.length > 0) {
    const manuscripts: Partial<Manuscript>[] = []
    for (const file of mdFiles) {
      const content = await downloadFile(token, file.id)
      manuscripts.push(parseMarkdownToManuscript(content))
    }
    await onLoad(manuscripts)
  }

  return folderId
}

// 笏笏 繧ｹ繝医い 笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏

type GoogleDriveState = {
  accessToken: string | null
  status: SyncStatus
  lastSyncedAt: Date | null
  error: string | null
  folderId: string | null
  isLoading: boolean

  setAccessToken: (token: string, onLoad: (manuscripts: Partial<Manuscript>[]) => Promise<void>) => Promise<void>
  restoreToken: (onLoad: (manuscripts: Partial<Manuscript>[]) => Promise<void>) => Promise<void>
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

  // 繝ｭ繧ｰ繧､繝ｳ譎ゑｼ壹ヨ繝ｼ繧ｯ繝ｳ繧剃ｿ晏ｭ倥＠縺ｦDrive縺九ｉ隱ｭ縺ｿ霎ｼ縺ｿ
  setAccessToken: async (token, onLoad) => {
    saveToken(token)
    set({ accessToken: token, status: 'loading', isLoading: true, error: null, folderId: null })
    try {
      const folderId = await loadFromDriveInternal(token, onLoad)
      set({ folderId, status: 'success', isLoading: false, lastSyncedAt: new Date() })
    } catch (err) {
      console.error('Drive load error:', err)
      set({ status: 'error', isLoading: false, error: err instanceof Error ? err.message : '隱ｭ縺ｿ霎ｼ縺ｿ縺ｫ螟ｱ謨励＠縺ｾ縺励◆' })
    }
  },

  // 繝ｪ繝ｭ繝ｼ繝画凾・嗟ocalStorage縺九ｉ繝医・繧ｯ繝ｳ繧貞ｾｩ蜈・＠縺ｦDrive縺九ｉ隱ｭ縺ｿ霎ｼ縺ｿ
  restoreToken: async (onLoad) => {
    const token = loadToken()
    if (!token) return

    set({ accessToken: token, status: 'loading', isLoading: true, error: null, folderId: null })
    try {
      const folderId = await loadFromDriveInternal(token, onLoad)
      set({ folderId, status: 'success', isLoading: false, lastSyncedAt: new Date() })
    } catch (err) {
      // 繝医・繧ｯ繝ｳ縺悟､ｱ蜉ｹ縺励※縺・◆蝣ｴ蜷医・繧ｯ繝ｪ繧｢
      console.error('Drive restore error:', err)
      clearToken()
      set({ accessToken: null, status: 'idle', isLoading: false, error: null })
    }
  },

  clearToken: () => {
    clearToken()
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
      for (const [name, id] of fileMap) {
        if (!matsubaNames.has(name)) await trashFile(accessToken, id)
      }
      for (const manuscript of manuscripts) {
        const fileName = `${sanitizeFileName(manuscript.title)}.md`
        await uploadFile(accessToken, folderId, fileName, manuscriptToMarkdown(manuscript), fileMap.get(fileName))
      }
      set({ status: 'success', lastSyncedAt: new Date() })
    } catch (err) {
      console.error('Drive sync error:', err)
      set({ status: 'error', error: err instanceof Error ? err.message : '蜷梧悄縺ｫ螟ｱ謨励＠縺ｾ縺励◆' })
    }
  },
}))

