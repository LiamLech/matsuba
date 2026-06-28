// ============================================================
// matsuba - エクスポートフック
// ============================================================

import { useCallback } from 'react'
import type { Manuscript, Version, ExportFormat } from '../types'

/**
 * ファイル名に使えない文字を除去し、最大文字数に収める
 */
function sanitizeFilename(title: string, maxLength = 20): string {
  return title
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim()
    .slice(0, maxLength) || 'untitled'
}

/**
 * エクスポート対象のテキストを取得する。
 * Phase 1: currentContent（プレーンテキスト）を使用。
 * Phase 2: TiptapのJSON→テキスト変換に置き換える。
 */
function resolveContent(manuscript: Manuscript, version: Version | null): string {
  if (version) {
    // バージョンのcontentはPhase 1ではプレーンテキスト
    return typeof version.content === 'string' ? version.content : ''
  }
  return manuscript.currentContent ?? ''
}

/**
 * Markdownのメタデータブロックを生成する
 */
function buildFrontmatter(manuscript: Manuscript, version: Version | null): string {
  const lines = [
    '---',
    `title: ${manuscript.title}`,
    version ? `version: ${version.label}` : 'version: 現在の版',
    `date: ${new Date().toISOString().slice(0, 10)}`,
    '---',
    '',
  ]
  return lines.join('\n')
}

export function useExport() {
  const exportFile = useCallback(
    (
      manuscript: Manuscript,
      version: Version | null,
      format: ExportFormat,
      includeMetadata = false
    ) => {
      const safeTitle = sanitizeFilename(manuscript.title)
      const content = resolveContent(manuscript, version)

      let text = ''
      let mimeType = 'text/plain;charset=utf-8'
      let filename = ''

      const versionSuffix = version ? `_${version.label}` : ''

      switch (format) {
        case 'txt':
          text = content
          mimeType = 'text/plain;charset=utf-8'
          filename = `${safeTitle}${versionSuffix}.txt`
          break

        case 'md':
          text = includeMetadata
            ? buildFrontmatter(manuscript, version) + content
            : content
          mimeType = 'text/markdown;charset=utf-8'
          filename = `${safeTitle}${versionSuffix}.md`
          break

        case 'pdf':
          // Phase 2で実装
          window.alert('PDF出力はPhase 2で実装予定です。')
          return
      }

      const blob = new Blob([text], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    },
    []
  )

  return { exportFile }
}
