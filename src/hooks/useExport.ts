// ============================================================
// matsuba - エクスポートフック（Phase 2更新）
// ============================================================

import { useCallback } from 'react'
import type { Manuscript, Version, ExportFormat } from '../types'
import { buildFrontmatter } from '../utils/tiptapToMarkdown'

function sanitizeFilename(title: string, maxLength = 20): string {
  return title.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, maxLength) || 'untitled'
}

function resolveContentText(manuscript: Manuscript, version: Version | null): string {
  if (version) return version.contentText ?? ''
  return manuscript.currentContentText ?? ''
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
      const contentText = resolveContentText(manuscript, version)
      const versionSuffix = version ? `_${version.label}` : ''

      let text = ''
      let mimeType = 'text/plain;charset=utf-8'
      let filename = ''

      switch (format) {
        case 'txt':
          // txtはプレーンテキスト（Markdownの記号なし）
          // contentTextはMarkdown形式のため、記号を除去する
          text = contentText
            .replace(/^#{1,6}\s+/gm, '')    // 見出し記号を除去
            .replace(/\*\*(.*?)\*\*/g, '$1') // 太字を除去
            .replace(/\*(.*?)\*/g, '$1')     // イタリックを除去
            .replace(/~~(.*?)~~/g, '$1')     // 取り消し線を除去
            .replace(/`(.*?)`/g, '$1')       // インラインコードを除去
            .replace(/^[-*]\s+/gm, '')       // リストマーカーを除去
            .replace(/^\d+\.\s+/gm, '')      // 番号付きリストを除去
            .replace(/^>\s+/gm, '')          // 引用を除去
            .replace(/---/g, '')             // 水平線を除去
          mimeType = 'text/plain;charset=utf-8'
          filename = `${safeTitle}${versionSuffix}.txt`
          break

        case 'md':
          // mdはMarkdown形式（contentTextをそのまま使用）
          text = includeMetadata
            ? buildFrontmatter(manuscript.title, version?.label) + '\n' + contentText
            : contentText
          mimeType = 'text/markdown;charset=utf-8'
          filename = `${safeTitle}${versionSuffix}.md`
          break

        case 'pdf':
          window.alert('PDF出力はPhase 2 Step 4で実装予定です。')
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
