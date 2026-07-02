// ============================================================
// matsuba - Google Drive 同期フック
// ============================================================

import { useState, useCallback, useRef } from 'react'
import type { Manuscript } from '../types'
import { tiptapToMarkdown } from '../utils/tiptapToMarkdown'

const FOLDER_NAME = 'matsuba'
const SYNC_INTERVAL_MS = 30000 // 30秒ごとに自動同期

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

type DriveFile = {
  id: string
  name: string
  modifiedTime: string
}

// ── 日時フォーマット ──────────────────────────────────────────

function formatDateISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const offsetHours = pad(Math.floor(absOffset / 60))
  const offsetMinutes = pad(absOffset % 60)

  return [
    date.getFullYear(),
    '-', pad(date.getMonth() + 1),
    '-', pad(date.getDate()),
    'T', pad(date.getHours()),
    ':', pad(date.getMinutes()),
    ':', pad(date.getSeconds()),
    sign, offsetHours, ':', offsetMinutes,
  ].join('')
}

// ── Google Drive API ヘルパー ────────────────────────────────

async function getAuthHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` }
}

/** matsubaフォルダを取得または作成 */
async function getOrCreateFolder(accessToken: string): Promise<string> {
  const headers = await getAuthHeaders(accessToken)

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
    { headers }
  )
  const searchData = await searchRes.json()

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  })
  const createData = await createRes.json()
  return createData.id
}

/** フォルダ内のファイル一覧を取得 */
async function listFiles(accessToken: string, folderId: string): Promise<DriveFile[]> {
  const headers = await getAuthHeaders(accessToken)
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,modifiedTime)`,
    { headers }
  )
  const data = await res.json()
  return data.files ?? []
}

/** ファイルをアップロード（新規作成または更新） */
async function uploadFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  content: string,
  existingFileId?: string
): Promise<void> {
  const headers = await getAuthHeaders(accessToken)
  const blob = new Blob([content], { type: 'text/markdown' })

  if (existingFileId) {
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'text/markdown' },
      body: blob,
    })
  } else {
    const metadata = JSON.stringify({ name: fileName, parents: [folderId] })
    const form = new FormData()
    form.append('metadata', new Blob([metadata], { type: 'application/json' }))
    form.append('file', blob)

    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers,
      body: form,
    })
  }
}

/** ファイルを削除（ゴミ箱へ） */
async function deleteFile(accessToken: string, fileId: string): Promise<void> {
  const headers = await getAuthHeaders(accessToken)
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/trash`, {
    method: 'POST',
    headers,
  })
}

/** ファイルの内容を取得 */
async function downloadFile(accessToken: string, fileId: string): Promise<string> {
  const headers = await getAuthHeaders(accessToken)
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers }
  )
  return res.text()
}

// ── 原稿 → Markdown変換 ──────────────────────────────────────

function manuscriptToMarkdown(manuscript: Manuscript): string {
  const now = formatDateISO(new Date())
  const frontmatter = [
    '---',
    `title: ${manuscript.title}`,
    `date: ${now}`,
    `direction: ${manuscript.direction}`,
    `layoutId: ${manuscript.layoutId}`,
    `tags: [${manuscript.tags.join(', ')}]`,
    '---',
    '',
  ].join('\n')

  const content = manuscript.currentContentText ||
    tiptapToMarkdown(manuscript.currentContent) || ''

  return frontmatter + content
}

function sanitizeFileName(title: string): string {
  return title.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 50) || 'untitled'
}

// ── フック本体 ────────────────────────────────────────────────

export function useGoogleDrive() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const folderIdRef = useRef<string | null>(null)

  const isConnected = accessToken !== null

  const handleLoginSuccess = useCallback((token: string) => {
    setAccessToken(token)
    setError(null)
    setStatus('idle')
  }, [])

  const handleLogout = useCallback(() => {
    setAccessToken(null)
    setStatus('idle')
    setLastSyncedAt(null)
    folderIdRef.current = null
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current)
      syncTimerRef.current = null
    }
  }, [])

  /** 原稿を同期する（削除同期も含む） */
  const syncManuscripts = useCallback(async (manuscripts: Manuscript[]) => {
    if (!accessToken) return
    setStatus('syncing')
    setError(null)

    try {
      if (!folderIdRef.current) {
        folderIdRef.current = await getOrCreateFolder(accessToken)
      }
      const folderId = folderIdRef.current

      // Drive上の既存ファイル一覧を取得
      const existingFiles = await listFiles(accessToken, folderId)
      const fileMap = new Map(existingFiles.map((f) => [f.name, f.id]))

      // matsuba側のファイル名セットを作成
      const matsubaFileNames = new Set(
        manuscripts.map((m) => `${sanitizeFileName(m.title)}.md`)
      )

      // matsuba側にないファイルをDriveから削除
      for (const [fileName, fileId] of fileMap) {
        if (!matsubaFileNames.has(fileName)) {
          await deleteFile(accessToken, fileId)
        }
      }

      // 各原稿をアップロード
      for (const manuscript of manuscripts) {
        const fileName = `${sanitizeFileName(manuscript.title)}.md`
        const content = manuscriptToMarkdown(manuscript)
        const existingId = fileMap.get(fileName)
        await uploadFile(accessToken, folderId, fileName, content, existingId)
      }

      setLastSyncedAt(new Date())
      setStatus('success')
    } catch (err) {
      console.error('Google Drive sync error:', err)
      setError(err instanceof Error ? err.message : '同期に失敗しました')
      setStatus('error')
    }
  }, [accessToken])

  const startAutoSync = useCallback((manuscripts: Manuscript[]) => {
    if (syncTimerRef.current) clearInterval(syncTimerRef.current)
    syncTimerRef.current = setInterval(() => {
      syncManuscripts(manuscripts)
    }, SYNC_INTERVAL_MS)
  }, [syncManuscripts])

  const stopAutoSync = useCallback(() => {
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current)
      syncTimerRef.current = null
    }
  }, [])

  return {
    isConnected,
    status,
    lastSyncedAt,
    error,
    handleLoginSuccess,
    handleLogout,
    syncManuscripts,
    startAutoSync,
    stopAutoSync,
    downloadFile: (fileId: string) => accessToken ? downloadFile(accessToken, fileId) : Promise.resolve(''),
  }
}
