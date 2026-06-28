// ============================================================
// matsuba - バックアップフック（Phase 2更新）
// ============================================================

import { useCallback } from 'react'
import JSZip from 'jszip'
import type { Manuscript } from '../types'
import { buildFrontmatter } from '../utils/tiptapToMarkdown'

function sanitizeFilename(name: string, maxLength = 20): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, maxLength) || 'untitled'
}

function toDateStr(ts: number): string {
  const d = new Date(ts * 1000)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('')
}

function toVersionCode(index: number): string {
  return `v${String(index + 1).padStart(2, '0')}`
}

function buildMdFile(title: string, contentText: string, versionLabel?: string): string {
  return buildFrontmatter(title, versionLabel) + '\n' + contentText
}

export function useBackup() {
  const exportAllAsZip = useCallback(async (manuscripts: Manuscript[]) => {
    const zip = new JSZip()
    const today = toDateStr(Math.floor(Date.now() / 1000))

    for (const manuscript of manuscripts) {
      const folderName = sanitizeFilename(manuscript.title)
      const folder = zip.folder(folderName)
      if (!folder) continue

      folder.file('current.md', buildMdFile(
        manuscript.title,
        manuscript.currentContentText ?? ''
      ))

      manuscript.versions.forEach((version, index) => {
        const code = toVersionCode(index)
        const dateStr = toDateStr(version.savedAt)
        folder.file(`${code}_${dateStr}.md`, buildMdFile(
          manuscript.title,
          version.contentText ?? '',
          version.label,
        ))
      })

      // 参考画像をZIPに追加
      if (manuscript.attachments && manuscript.attachments.length > 0) {
        const imgFolder = folder.folder('images')
        if (imgFolder) {
          manuscript.attachments.forEach((attachment, i) => {
            const ext = attachment.fileName.split('.').pop() ?? 'jpg'
            const base64 = attachment.dataUrl.split(',')[1]
            if (base64) {
              imgFolder.file(`${String(i + 1).padStart(2, '0')}_${sanitizeFilename(attachment.fileName, 40)}.${ext}`, base64, { base64: true })
            }
          })
        }
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `matsuba_backup_${today}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const exportOneAsZip = useCallback(async (manuscript: Manuscript) => {
    const zip = new JSZip()
    const folderName = sanitizeFilename(manuscript.title)
    const folder = zip.folder(folderName)
    if (!folder) return

    folder.file('current.md', buildMdFile(
      manuscript.title,
      manuscript.currentContentText ?? ''
    ))

    manuscript.versions.forEach((version, index) => {
      const code = toVersionCode(index)
      const dateStr = toDateStr(version.savedAt)
      folder.file(`${code}_${dateStr}.md`, buildMdFile(
        manuscript.title,
        version.contentText ?? '',
        version.label,
      ))
    })

    // 参考画像をZIPに追加
    if (manuscript.attachments && manuscript.attachments.length > 0) {
      const imgFolder = folder.folder('images')
      if (imgFolder) {
        manuscript.attachments.forEach((attachment, i) => {
          const ext = attachment.fileName.split('.').pop() ?? 'jpg'
          const base64 = attachment.dataUrl.split(',')[1]
          if (base64) {
            imgFolder.file(`${String(i + 1).padStart(2, '0')}_${sanitizeFilename(attachment.fileName, 40)}.${ext}`, base64, { base64: true })
          }
        })
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${folderName}_backup.zip`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return { exportAllAsZip, exportOneAsZip }
}
