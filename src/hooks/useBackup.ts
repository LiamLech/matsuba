// ============================================================
// matsuba - バックアップフック（ZIPエクスポート）
// ============================================================

import { useCallback } from 'react'
import JSZip from 'jszip'
import type { Manuscript } from '../types'

/**
 * ファイル名に使えない文字を除去する
 */
function sanitizeFilename(name: string, maxLength = 20): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim()
    .slice(0, maxLength) || 'untitled'
}

/**
 * タイムスタンプをYYYYMMDD形式の文字列に変換する
 */
function toDateStr(ts: number): string {
  const d = new Date(ts * 1000)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('')
}

/**
 * バージョンのインデックスをv01, v02... 形式に変換する
 */
function toVersionCode(index: number): string {
  return `v${String(index + 1).padStart(2, '0')}`
}

/**
 * 原稿1件分のMarkdownテキストを生成する
 */
function buildMarkdown(manuscript: Manuscript, content: string, versionLabel?: string): string {
  const lines = [
    '---',
    `title: ${manuscript.title}`,
    versionLabel ? `version: ${versionLabel}` : 'version: current',
    `date: ${new Date().toISOString().slice(0, 10)}`,
    '---',
    '',
    content,
  ]
  return lines.join('\n')
}

export function useBackup() {
  /**
   * 全原稿をZIPファイルとしてダウンロードする
   */
  const exportAllAsZip = useCallback(async (manuscripts: Manuscript[]) => {
    const zip = new JSZip()

    const today = toDateStr(Math.floor(Date.now() / 1000))

    for (const manuscript of manuscripts) {
      const folderName = sanitizeFilename(manuscript.title)
      const folder = zip.folder(folderName)
      if (!folder) continue

      // 現在の版（current.md）
      const currentContent = buildMarkdown(
        manuscript,
        manuscript.currentContent ?? '',
      )
      folder.file('current.md', currentContent)

      // 保存済みバージョン（v01_YYYYMMDD.md ...）
      manuscript.versions.forEach((version, index) => {
        const code = toVersionCode(index)
        const dateStr = toDateStr(version.savedAt)
        const filename = `${code}_${dateStr}.md`
        const content = buildMarkdown(
          manuscript,
          typeof version.content === 'string' ? version.content : '',
          version.label,
        )
        folder.file(filename, content)
      })
    }

    // ZIPを生成してダウンロード
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `matsuba_backup_${today}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  /**
   * 特定の原稿1件をZIPファイルとしてダウンロードする
   */
  const exportOneAsZip = useCallback(async (manuscript: Manuscript) => {
    const zip = new JSZip()
    const folderName = sanitizeFilename(manuscript.title)
    const folder = zip.folder(folderName)
    if (!folder) return

    // 現在の版
    folder.file('current.md', buildMarkdown(manuscript, manuscript.currentContent ?? ''))

    // 保存済みバージョン
    manuscript.versions.forEach((version, index) => {
      const code = toVersionCode(index)
      const dateStr = toDateStr(version.savedAt)
      const filename = `${code}_${dateStr}.md`
      folder.file(filename, buildMarkdown(
        manuscript,
        typeof version.content === 'string' ? version.content : '',
        version.label,
      ))
    })

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
